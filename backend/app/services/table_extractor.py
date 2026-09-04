import os
import re
import json
from typing import Dict, List, Optional, Any, Tuple

# --- REGEX PATTERNS ---
REGEX_PATTERNS = {
    "HSN_SAC": r'\b\d{4,8}\b',
    "UNIT": r'\b(?:KGS?|GMS?|GRAMS?|MTRS?|METERS?|PCS?|PIECES?|BAGS?|BALES?|TONS?|MT|NOS?|BOX(?:ES)?|QTL|LTRS?|LITERS?|SET|DOZ|CTN|ROLL|SQM|SQFT|EA|UNIT)\b',
    "TAX_KEYWORDS": r'\b(?:IGST|CGST|SGST|VAT|CESS|MANDI|TAX|DUTY|FEE|TOTAL|ROUND|SUBTOTAL)\b',
}

# NOTE: "quantity" aliases must ONLY match qty-labeled headers.
# Unit words (bags, kg, etc.) belong exclusively to the "unit" column
# so a header like "Qty (Bags)" doesn't pull unit-words into the qty span.
COLUMN_HEADER_ALIASES = {
    "sr_no": ["sl.no", "sl no", "sr.no", "sr no", "s.n.", "s.no", "item no"],
    "description": ["description", "commodity", "particulars", "item description", "product description", "goods", "item"],
    "hsn_sac": ["hsn", "hsn/sac", "hsn code", "sac code", "hsn / sac", "sac"],
    "quantity": ["qty", "quantity", "qnty", "net weight"],
    "unit": ["unit", "uom", "per", "pkg", "packaging", "u.o.m"],
    "rate": ["rate", "unit price", "price", "rate/unit", "price/unit"],
    "amount": ["amount", "total amount", "taxable value", "val", "total"],
}


def parse_numeric_value(val_str: Optional[str]) -> Optional[float]:
    if not val_str:
        return None
    cleaned = re.sub(r'[^\d.-]', '', str(val_str).replace(',', ''))
    if cleaned in ('', '-', '.'):
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_quantity_and_unit(text: Optional[str]) -> Tuple[Optional[float], Optional[str]]:
    """
    Splits a cell like '50 BAGS', '120.5 KG', '3 PCS' into (qty, unit).
    Scoped to the cell text itself -- never the full row -- to avoid
    false-positive unit matches from unrelated columns (e.g. description).
    """
    if not text:
        return None, None

    unit_match = re.search(REGEX_PATTERNS["UNIT"], text, re.IGNORECASE)
    unit = unit_match.group(0).capitalize() if unit_match else None

    # Strip the matched unit token before parsing the number, so "50BAGS"
    # (no space) doesn't get mangled by parse_numeric_value's char strip.
    numeric_part = text
    if unit_match:
        numeric_part = text[:unit_match.start()] + text[unit_match.end():]

    qty = parse_numeric_value(numeric_part)
    return qty, unit


def find_table_boundaries(lines: List[Dict[str, Any]]) -> Tuple[Optional[Dict[str, Any]], float, float]:
    """Finds header line and Y-coordinates bounding the line item table."""
    header_line = None
    max_matches = 0

    for line in lines:
        text_lower = line["text"].lower()
        matches = sum(1 for aliases in COLUMN_HEADER_ALIASES.values() if any(a in text_lower for a in aliases))
        if matches > max_matches and matches >= 3:
            max_matches = matches
            header_line = line

    if not header_line:
        return None, 0.0, 9999.0

    header_y1 = header_line["bbox"][3]
    footer_y0 = 9999.0

    for line in lines:
        if line["bbox"][1] <= header_y1:
            continue
        line_text_upper = line["text"].upper()
        if re.search(REGEX_PATTERNS["TAX_KEYWORDS"], line_text_upper) or "GRAND TOTAL" in line_text_upper or "AMOUNT IN WORDS" in line_text_upper:
            footer_y0 = min(footer_y0, line["bbox"][1] - 2.0)
            break

    return header_line, header_y1, footer_y0


def calculate_column_spans(header_line: Dict[str, Any], all_words: List[Dict[str, Any]]) -> Dict[str, Tuple[float, float]]:
    """Calculates wide, non-clipping X-spans for table columns."""
    header_words = header_line.get("words", [])
    col_starts: Dict[str, float] = {}
    col_header_widths: Dict[str, float] = {}

    for word in header_words:
        w_text = word["text"].lower()
        for col_name, aliases in COLUMN_HEADER_ALIASES.items():
            if col_name not in col_starts and any(re.search(r'\b' + re.escape(a) + r'\b', w_text) for a in aliases):
                col_starts[col_name] = word["x0"]
                col_header_widths[col_name] = word["x1"] - word["x0"]

    sorted_cols = sorted(col_starts.items(), key=lambda x: x[1])
    col_spans: Dict[str, Tuple[float, float]] = {}

    for idx, (col_name, x0) in enumerate(sorted_cols):
        if col_name == "description" and "sr_no" in col_starts:
            sr_no_x0 = col_starts["sr_no"]
            sr_no_width = col_header_widths.get("sr_no", 20.0)
            left_bound = sr_no_x0 + max(sr_no_width, 20.0) + 5.0
        elif col_name == "description":
            left_bound = 0.0
        else:
            left_bound = x0 - 10.0

        if idx < len(sorted_cols) - 1:
            right_bound = sorted_cols[idx + 1][1] - 2.0
        else:
            right_bound = 2000.0

        col_spans[col_name] = (left_bound, right_bound)

    return col_spans


def cluster_row_words(words: List[Dict[str, Any]], header_y1: float, footer_y0: float, y_tolerance: float = 6.0) -> List[List[Dict[str, Any]]]:
    """Groups page words into distinct horizontal visual rows."""
    body_words = [w for w in words if header_y1 < w["y0"] < footer_y0]
    body_words.sort(key=lambda w: (w["y0"], w["x0"]))

    rows: List[List[Dict[str, Any]]] = []
    for word in body_words:
        placed = False
        for row in rows:
            row_avg_y = sum(w["y0"] for w in row) / len(row)
            if abs(word["y0"] - row_avg_y) <= y_tolerance:
                row.append(word)
                placed = True
                break
        if not placed:
            rows.append([word])

    for row in rows:
        row.sort(key=lambda w: w["x0"])

    return rows


def extract_table_items(parsed_pdf: Dict[str, Any]) -> List[Dict[str, Any]]:
    lines = parsed_pdf.get("lines", [])
    words = parsed_pdf.get("words", [])

    header_line, header_y1, footer_y0 = find_table_boundaries(lines)
    if not header_line:
        return []

    col_spans = calculate_column_spans(header_line, words)
    has_dedicated_unit_col = "unit" in col_spans
    raw_rows = cluster_row_words(words, header_y1, footer_y0)

    items: List[Dict[str, Any]] = []
    current_item: Optional[Dict[str, Any]] = None

    for row_words in raw_rows:
        row_text = " ".join(w["text"] for w in row_words).strip()

        if re.search(REGEX_PATTERNS["TAX_KEYWORDS"], row_text, re.IGNORECASE):
            continue

        row_cols: Dict[str, List[str]] = {c: [] for c in col_spans.keys()}
        for w in row_words:
            w_mid = (w["x0"] + w["x1"]) / 2.0
            for col_name, (cx0, cx1) in col_spans.items():
                if cx0 <= w_mid <= cx1:
                    row_cols[col_name].append(w["text"])
                    break

        formatted_cols = {k: " ".join(v).strip() for k, v in row_cols.items()}

        # Strip a leading row-number token from description text.
        # This covers two cases:
        #   1. A real Sr.No column exists and its value leaked into description
        #      (use the captured value).
        #   2. No separate Sr.No column was detected at all, and the number is
        #      embedded directly in the description text run in the source PDF
        #      (use the expected sequential position instead).
        desc = formatted_cols.get("description", "").strip()
        sr_no_col_val = parse_numeric_value(formatted_cols.get("sr_no"))
        # len(items) only counts items already appended -- current_item (the
        # one being built right now, from the previous row) hasn't been
        # pushed into items yet at this point in the loop, so it must be
        # counted separately or every row after the first undercounts by 1.
        items_so_far = len(items) + (1 if current_item is not None else 0)
        expected_sr_no = items_so_far + 1
        probe_sr_no = sr_no_col_val if sr_no_col_val is not None else expected_sr_no

        if probe_sr_no is not None:
            desc = re.sub(rf'^{int(probe_sr_no)}[\.\)]?\s+', '', desc)
        formatted_cols["description"] = desc

        hsn_match = re.search(REGEX_PATTERNS["HSN_SAC"], formatted_cols.get("hsn_sac", "") or "")
        has_amount = parse_numeric_value(formatted_cols.get("amount")) is not None
        has_hsn = hsn_match is not None

        if has_hsn or (has_amount and (formatted_cols.get("quantity") or formatted_cols.get("rate"))):
            if current_item:
                items.append(current_item)

            # Quantity + unit resolution:
            # 1. If the invoice has a dedicated Unit/UOM column, use it directly.
            # 2. Otherwise, split the embedded unit out of the quantity cell.
            qty_raw = formatted_cols.get("quantity", "")
            qty_val, embedded_unit = parse_quantity_and_unit(qty_raw)

            if has_dedicated_unit_col and formatted_cols.get("unit"):
                unit_val = formatted_cols["unit"].strip().capitalize()
                # dedicated column exists but qty cell had no unit text -> just parse the number
                if qty_val is None:
                    qty_val = parse_numeric_value(qty_raw)
            else:
                unit_val = embedded_unit

            current_item = {
                "sr_no": parse_numeric_value(formatted_cols.get("sr_no")),
                "commodity": formatted_cols.get("description", "").strip(),
                "hsn_code": hsn_match.group(0) if hsn_match else None,
                "quantity": qty_val,
                "unit": unit_val,
                "rate": parse_numeric_value(formatted_cols.get("rate")),
                "amount": parse_numeric_value(formatted_cols.get("amount")),
            }
        else:
            if current_item and row_text:
                desc_text = formatted_cols.get("description") or row_text
                if desc_text and desc_text not in current_item["commodity"]:
                    current_item["commodity"] += " " + desc_text.strip()

    if current_item:
        items.append(current_item)

    for idx, item in enumerate(items, start=1):
        if item["sr_no"] is None:
            item["sr_no"] = idx
        else:
            item["sr_no"] = int(item["sr_no"])

    return items


if __name__ == "__main__":
    try:
        from app.services.pdf_parser import parse_pdf_document
    except ImportError:
        from pdfparser import parse_pdf_document

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    test_folder = os.path.join(project_root, "test_invoices")

    test_files = [f for f in os.listdir(test_folder) if f.endswith(".pdf")] if os.path.exists(test_folder) else []

    if test_files:
        for file_name in test_files:
            print(f"\n==========================================")
            print(f" Testing Table Extractor: {file_name}")
            print(f"==========================================")

            sample_path = os.path.join(test_folder, file_name)
            with open(sample_path, "rb") as f:
                pdf_data = f.read()

            parsed_pdf = parse_pdf_document(pdf_data)
            table_items = extract_table_items(parsed_pdf)

            print(json.dumps(table_items, indent=2))

