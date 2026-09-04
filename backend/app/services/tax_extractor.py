import os
import re
import json
from typing import Dict, List, Tuple, Optional, Any

try:
    from app.utils.normalizers import clean_float, clean_gstin, format_currency
except ImportError:
    from utils.normalizers import clean_float, clean_gstin, format_currency

# Strict regex patterns for rate and label matching
RATE_REGEX = re.compile(r'(?:@\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*%)')
TAXABLE_ANCHOR_REGEX = re.compile(
    r'\b(taxable\s*(value|amount|amt|val)?|sub\s*total|subtotal|total\s*before\s*tax|assessed\s*value|goods\s*value|base\s*amount)\b',
    re.IGNORECASE
)


def determine_supply_type(supplier_gstin: Optional[str], buyer_gstin: Optional[str]) -> Optional[str]:
    """
    Compares the first 2 digits (State Code) of cleaned supplier and buyer GSTINs.
    Same state code -> INTRA_STATE (CGST + SGST)
    Different state code -> INTER_STATE (IGST)
    """
    sup = clean_gstin(supplier_gstin)
    buy = clean_gstin(buyer_gstin)
    if sup and buy:
        return "INTRA_STATE" if sup[:2] == buy[:2] else "INTER_STATE"
    return None


def _extract_rate_and_amount(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Helper to pull percentage rate and numeric tax amount from line text."""
    rate = None
    rate_match = RATE_REGEX.search(text)
    if rate_match:
        # Group 1 captures '@ 5', Group 2 captures '5%'
        matched_val = rate_match.group(1) or rate_match.group(2)
        rate = f"{float(matched_val):g}%"

    flt_amt = clean_float(text)
    amount_str = format_currency(flt_amt) if flt_amt > 0 else None
    return rate, amount_str


def extract_tax_details(
    parsed_pdf: Dict[str, Any],
    supplier_gstin: Optional[str] = None,
    buyer_gstin: Optional[str] = None,
    total_amount: Optional[str] = None
) -> Dict[str, Any]:
    lines = parsed_pdf.get("lines", [])
    words = parsed_pdf.get("words", [])

    supply_type = determine_supply_type(supplier_gstin, buyer_gstin)

    results = {
        "supply_type": supply_type,
        "taxable_value": None,
        "cgst_rate": None,
        "cgst_amount": None,
        "sgst_rate": None,
        "sgst_amount": None,
        "igst_rate": None,
        "igst_amount": None,
        "total_tax": None,
    }

    # ------------------------------------------------------------------
    # STRATEGY 1: Line-by-Line Key-Value & Label Search
    # ------------------------------------------------------------------
    for line in lines:
        txt = line["text"].strip()
        if not txt:
            continue

        # Taxable Value / Sub Total
        if not results["taxable_value"] and TAXABLE_ANCHOR_REGEX.search(txt):
            amt = clean_float(txt)
            if amt > 0:
                results["taxable_value"] = format_currency(amt)

        # CGST
        if re.search(r'\bcgst\b', txt, re.IGNORECASE):
            rate, amt = _extract_rate_and_amount(txt)
            if rate and not results["cgst_rate"]:
                results["cgst_rate"] = rate
            if amt and not results["cgst_amount"]:
                results["cgst_amount"] = amt

        # SGST / UTGST
        if re.search(r'\b(sgst|utgst)\b', txt, re.IGNORECASE):
            rate, amt = _extract_rate_and_amount(txt)
            if rate and not results["sgst_rate"]:
                results["sgst_rate"] = rate
            if amt and not results["sgst_amount"]:
                results["sgst_amount"] = amt

        # IGST
        if re.search(r'\bigst\b', txt, re.IGNORECASE):
            rate, amt = _extract_rate_and_amount(txt)
            if rate and not results["igst_rate"]:
                results["igst_rate"] = rate
            if amt and not results["igst_amount"]:
                results["igst_amount"] = amt

        # Total Tax Amount
        if not results["total_tax"] and re.search(r'\b(total\s*tax|tot\s*tax|tax\s*amount)\b', txt, re.IGNORECASE):
            amt = clean_float(txt)
            if amt > 0:
                results["total_tax"] = format_currency(amt)

    # ------------------------------------------------------------------
    # STRATEGY 2: Spatial Row-Clustering Fallback
    # ------------------------------------------------------------------
    if not (results["cgst_amount"] or results["igst_amount"]):
        footer_words = [w for w in words if w.get("y0", 0) > 200]
        footer_words.sort(key=lambda w: (w["y0"], w["x0"]))

        clustered_rows: List[List[Dict[str, Any]]] = []
        for w in footer_words:
            if not clustered_rows or abs(w["y0"] - clustered_rows[-1][0]["y0"]) > 4.0:
                clustered_rows.append([w])
            else:
                clustered_rows[-1].append(w)

        for row in clustered_rows:
            row_str = " ".join(w["text"] for w in row)

            if "CGST" in row_str.upper() and not results["cgst_amount"]:
                r, a = _extract_rate_and_amount(row_str)
                results["cgst_rate"] = results["cgst_rate"] or r
                results["cgst_amount"] = a
            elif ("SGST" in row_str.upper() or "UTGST" in row_str.upper()) and not results["sgst_amount"]:
                r, a = _extract_rate_and_amount(row_str)
                results["sgst_rate"] = results["sgst_rate"] or r
                results["sgst_amount"] = a
            elif "IGST" in row_str.upper() and not results["igst_amount"]:
                r, a = _extract_rate_and_amount(row_str)
                results["igst_rate"] = results["igst_rate"] or r
                results["igst_amount"] = a

    # ------------------------------------------------------------------
    # STRATEGY 3: Post-Processing & Mathematical Deductions
    # ------------------------------------------------------------------
    if not results["supply_type"]:
        if results["igst_amount"]:
            results["supply_type"] = "INTER_STATE"
        elif results["cgst_amount"] or results["sgst_amount"]:
            results["supply_type"] = "INTRA_STATE"

    # Compute Total Tax if missing
    cgst_flt = clean_float(results["cgst_amount"])
    sgst_flt = clean_float(results["sgst_amount"])
    igst_flt = clean_float(results["igst_amount"])

    tot_tax_flt = clean_float(results["total_tax"]) or (cgst_flt + sgst_flt + igst_flt)
    if tot_tax_flt > 0:
        results["total_tax"] = format_currency(tot_tax_flt)

    tot_amt_flt = clean_float(total_amount)

    # Deduction 1: Infer Taxable Value (Total Amount - Total Tax)
    if not results["taxable_value"] and tot_amt_flt > 0 and tot_tax_flt > 0:
        taxable_calc = tot_amt_flt - tot_tax_flt
        if taxable_calc > 0:
            results["taxable_value"] = format_currency(taxable_calc)

    taxable_flt = clean_float(results["taxable_value"])

    # Deduction 2: Infer Missing Tax Rates
    if taxable_flt > 0:
        if igst_flt > 0 and not results["igst_rate"]:
            results["igst_rate"] = f"{round((igst_flt / taxable_flt) * 100):g}%"

        if cgst_flt > 0 and not results["cgst_rate"]:
            results["cgst_rate"] = f"{round((cgst_flt / taxable_flt) * 100, 1):g}%"

        if sgst_flt > 0 and not results["sgst_rate"]:
            results["sgst_rate"] = f"{round((sgst_flt / taxable_flt) * 100, 1):g}%"

    return results


if __name__ == "__main__":
    try:
        from app.services.pdfparser import parse_pdf_document
        from app.services.anchor_search import extract_metadata
    except ImportError:
        from pdfparser import parse_pdf_document
        from anchor_search import extract_metadata

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    test_folder = os.path.join(project_root, "test_invoices")

    test_files = [f for f in os.listdir(test_folder) if f.endswith(".pdf")] if os.path.exists(test_folder) else []

    if test_files:
        for file_name in test_files:
            print(f"\n==========================================")
            print(f" Testing Tax Extraction: {file_name}")
            print(f"==========================================")

            sample_path = os.path.join(test_folder, file_name)
            with open(sample_path, "rb") as f:
                pdf_data = f.read()

            parsed_pdf = parse_pdf_document(pdf_data)
            meta = extract_metadata(parsed_pdf)
            tax_details = extract_tax_details(
                parsed_pdf, 
                supplier_gstin=meta.get("supplier_gstin"),
                buyer_gstin=meta.get("buyer_gstin"),
                total_amount=meta.get("total_amount")
            )

            print(json.dumps(tax_details, indent=2))
    else:
        print(f"No '.pdf' files found inside '{test_folder}'.")

# import os
# import re
# import json
# from typing import Dict, List, Tuple, Optional, Any

# # Strict regex patterns for numeric parsing
# RATE_REGEX = re.compile(r'(?:@|\b)\s*(\d+(?:\.\d+)?)\s*%?')
# AMOUNT_REGEX = re.compile(r'(?:INR|Rs\.?|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|\b[0-9]+\.[0-9]{2}\b)')

# TAXABLE_ANCHOR_REGEX = re.compile(
#     r'\b(taxable\s*(value|amount|amt|val)?|sub\s*total|subtotal|total\s*before\s*tax|assessed\s*value|goods\s*value|base\s*amount)\b',
#     re.IGNORECASE
# )


# def determine_supply_type(supplier_gstin: Optional[str], buyer_gstin: Optional[str]) -> Optional[str]:
#     """
#     Compares the first 2 digits (State Code) of supplier and buyer GSTINs.
#     Same state code -> INTRA_STATE (CGST + SGST)
#     Different state code -> INTER_STATE (IGST)
#     """
#     if supplier_gstin and buyer_gstin:
#         sup_state = supplier_gstin[:2]
#         buy_state = buyer_gstin[:2]
#         if sup_state.isdigit() and buy_state.isdigit():
#             return "INTRA_STATE" if sup_state == buy_state else "INTER_STATE"
#     return None


# def _clean_amount(text: str) -> Optional[str]:
#     """Extracts the last valid currency float from a string snippet."""
#     matches = AMOUNT_REGEX.findall(text)
#     if matches:
#         return matches[-1]
#     return None


# def _extract_rate_and_amount(text: str) -> Tuple[Optional[str], Optional[str]]:
#     """Helper to pull percentage rate and numeric tax amount from line text."""
#     rate = None
#     rate_match = re.search(r'(\d+(?:\.\d+)?)\s*%', text)
#     if rate_match:
#         rate = f"{float(rate_match.group(1)):g}%"

#     amount = _clean_amount(text)
#     return rate, amount


# def _to_float(val: Optional[str]) -> Optional[float]:
#     if not val:
#         return None
#     try:
#         return float(str(val).replace(",", ""))
#     except ValueError:
#         return None


# def extract_tax_details(
#     parsed_pdf: Dict[str, Any],
#     supplier_gstin: Optional[str] = None,
#     buyer_gstin: Optional[str] = None,
#     total_amount: Optional[str] = None
# ) -> Dict[str, Any]:
#     lines = parsed_pdf.get("lines", [])
#     words = parsed_pdf.get("words", [])

#     supply_type = determine_supply_type(supplier_gstin, buyer_gstin)

#     results = {
#         "supply_type": supply_type,
#         "taxable_value": None,
#         "cgst_rate": None,
#         "cgst_amount": None,
#         "sgst_rate": None,
#         "sgst_amount": None,
#         "igst_rate": None,
#         "igst_amount": None,
#         "total_tax": None,
#     }

#     # ------------------------------------------------------------------
#     # STRATEGY 1: Line-by-Line Key-Value & Label Search
#     # ------------------------------------------------------------------
#     for line in lines:
#         txt = line["text"].strip()
#         if not txt:
#             continue

#         # Taxable Value / Sub Total
#         if not results["taxable_value"] and TAXABLE_ANCHOR_REGEX.search(txt):
#             amt = _clean_amount(txt)
#             if amt:
#                 results["taxable_value"] = amt

#         # CGST
#         if re.search(r'\bcgst\b', txt, re.IGNORECASE):
#             rate, amt = _extract_rate_and_amount(txt)
#             if rate and not results["cgst_rate"]:
#                 results["cgst_rate"] = rate
#             if amt and not results["cgst_amount"]:
#                 results["cgst_amount"] = amt

#         # SGST / UTGST
#         if re.search(r'\b(sgst|utgst)\b', txt, re.IGNORECASE):
#             rate, amt = _extract_rate_and_amount(txt)
#             if rate and not results["sgst_rate"]:
#                 results["sgst_rate"] = rate
#             if amt and not results["sgst_amount"]:
#                 results["sgst_amount"] = amt

#         # IGST
#         if re.search(r'\bigst\b', txt, re.IGNORECASE):
#             rate, amt = _extract_rate_and_amount(txt)
#             if rate and not results["igst_rate"]:
#                 results["igst_rate"] = rate
#             if amt and not results["igst_amount"]:
#                 results["igst_amount"] = amt

#         # Total Tax Amount
#         if not results["total_tax"] and re.search(r'\b(total\s*tax|tot\s*tax|tax\s*amount)\b', txt, re.IGNORECASE):
#             amt = _clean_amount(txt)
#             if amt:
#                 results["total_tax"] = amt

#     # ------------------------------------------------------------------
#     # STRATEGY 2: Spatial Row-Clustering Fallback
#     # ------------------------------------------------------------------
#     if not (results["cgst_amount"] or results["igst_amount"]):
#         footer_words = [w for w in words if w.get("y0", 0) > 200]
#         footer_words.sort(key=lambda w: (w["y0"], w["x0"]))

#         clustered_rows: List[List[Dict[str, Any]]] = []
#         for w in footer_words:
#             if not clustered_rows or abs(w["y0"] - clustered_rows[-1][0]["y0"]) > 4.0:
#                 clustered_rows.append([w])
#             else:
#                 clustered_rows[-1].append(w)

#         for row in clustered_rows:
#             row_str = " ".join(w["text"] for w in row)

#             if "CGST" in row_str.upper() and not results["cgst_amount"]:
#                 r, a = _extract_rate_and_amount(row_str)
#                 results["cgst_rate"] = results["cgst_rate"] or r
#                 results["cgst_amount"] = a
#             elif ("SGST" in row_str.upper() or "UTGST" in row_str.upper()) and not results["sgst_amount"]:
#                 r, a = _extract_rate_and_amount(row_str)
#                 results["sgst_rate"] = results["sgst_rate"] or r
#                 results["sgst_amount"] = a
#             elif "IGST" in row_str.upper() and not results["igst_amount"]:
#                 r, a = _extract_rate_and_amount(row_str)
#                 results["igst_rate"] = results["igst_rate"] or r
#                 results["igst_amount"] = a

#     # ------------------------------------------------------------------
#     # STRATEGY 3: Post-Processing & Mathematical Deductions
#     # ------------------------------------------------------------------
#     if not results["supply_type"]:
#         if results["igst_amount"]:
#             results["supply_type"] = "INTER_STATE"
#         elif results["cgst_amount"] or results["sgst_amount"]:
#             results["supply_type"] = "INTRA_STATE"

#     # Compute Total Tax if missing
#     cgst_flt = _to_float(results["cgst_amount"]) or 0.0
#     sgst_flt = _to_float(results["sgst_amount"]) or 0.0
#     igst_flt = _to_float(results["igst_amount"]) or 0.0

#     if not results["total_tax"]:
#         calc_total_tax = cgst_flt + sgst_flt + igst_flt
#         if calc_total_tax > 0:
#             results["total_tax"] = f"{calc_total_tax:,.2f}"

#     tot_tax_flt = _to_float(results["total_tax"]) or (cgst_flt + sgst_flt + igst_flt)
#     tot_amt_flt = _to_float(total_amount)

#     # Deduction 1: Infer Taxable Value (Total Amount - Total Tax)
#     if not results["taxable_value"] and tot_amt_flt and tot_tax_flt:
#         taxable_calc = tot_amt_flt - tot_tax_flt
#         if taxable_calc > 0:
#             results["taxable_value"] = f"{taxable_calc:,.2f}"

#     taxable_flt = _to_float(results["taxable_value"])

#     # Deduction 2: Infer Missing Tax Rates
#     if taxable_flt and taxable_flt > 0:
#         if igst_flt > 0 and not results["igst_rate"]:
#             calculated_rate = round((igst_flt / taxable_flt) * 100)
#             results["igst_rate"] = f"{calculated_rate}%"

#         if cgst_flt > 0 and not results["cgst_rate"]:
#             calculated_rate = round((cgst_flt / taxable_flt) * 100, 1)
#             results["cgst_rate"] = f"{calculated_rate:g}%"

#         if sgst_flt > 0 and not results["sgst_rate"]:
#             calculated_rate = round((sgst_flt / taxable_flt) * 100, 1)
#             results["sgst_rate"] = f"{calculated_rate:g}%"

#     return results


# if __name__ == "__main__":
#     try:
#         from app.services.pdfparser import parse_pdf_document
#         from app.services.anchor_search import extract_metadata
#     except ImportError:
#         from pdfparser import parse_pdf_document
#         from anchor_search import extract_metadata

#     script_dir = os.path.dirname(os.path.abspath(__file__))
#     project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
#     test_folder = os.path.join(project_root, "test_invoices")

#     test_files = [f for f in os.listdir(test_folder) if f.endswith(".pdf")] if os.path.exists(test_folder) else []

#     if test_files:
#         for file_name in test_files:
#             print(f"\n==========================================")
#             print(f" Testing Tax Extraction: {file_name}")
#             print(f"==========================================")

#             sample_path = os.path.join(test_folder, file_name)
#             with open(sample_path, "rb") as f:
#                 pdf_data = f.read()

#             parsed_pdf = parse_pdf_document(pdf_data)
#             meta = extract_metadata(parsed_pdf)
#             tax_details = extract_tax_details(
#                 parsed_pdf, 
#                 supplier_gstin=meta.get("supplier_gstin"),
#                 buyer_gstin=meta.get("buyer_gstin"),
#                 total_amount=meta.get("total_amount")
#             )

#             print(json.dumps(tax_details, indent=2))
#     else:
#         print(f"No '.pdf' files found inside '{test_folder}'.")