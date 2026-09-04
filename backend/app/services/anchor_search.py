import os
import re
from typing import Dict, List, Tuple, Optional, Any

try:
    from rapidfuzz import fuzz
    def calculate_similarity(s1: str, s2: str) -> float:
        return fuzz.partial_ratio(s1.lower(), s2.lower())
except ImportError:
    import difflib
    def calculate_similarity(s1: str, s2: str) -> float:
        s1, s2 = s1.lower(), s2.lower()
        if s1 in s2 or s2 in s1:
            return 100.0
        return difflib.SequenceMatcher(None, s1, s2).ratio() * 100.0


# --- STRICT REGEX PATTERNS ---
REGEX_PATTERNS = {
    "GSTIN": r'\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b',
    "EWAY_BILL": r'\b\d{12}\b',
    "INVOICE_NO": r'\b(?:AGRO|INV|BILL|REC)[/:-][0-9A-Za-z/_-]+\b',
    "DATE": r'\b\d{1,2}[-/\.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{1,2})[-/\.]\d{2,4}\b',
    "AMOUNT": r'(?:INR|Rs\.?|\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)|(?:\b[0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{2})\b)',
    "PO_NO": r'\bPO[-/\s:]?\s*([0-9A-Za-z_-]+)\b',
    "LR_NO": r'\bLR[-/\s:]?\s*([0-9A-Za-z_-]+)\b',
    "VEHICLE_NO": r'\b[A-Z0-9]{2}[-_\s]?[0-9]{1,2}[-_\s]?[A-Z0-9]{1,3}[-_\s]?[0-9]{4}\b',
    "WEIGHBRIDGE_TICKET": r'\bWB[-/\s]?[0-9A-Za-z_-]+\b',
}

COPY_MARKER_PATTERN = re.compile(
    r'^\s*(ORIGINAL|DUPLICATE|TRIPLICATE|QUADRUPLICATE|COPY)(\s+(FOR|OF)\s+\w+)?\s*$',
    re.IGNORECASE
)

ADDRESS_OR_HEADER_REGEX = re.compile(
    r'(\bH\.?No\.?|\bShop\b|\bPlot\b|\bStreet\b|\bRoad\b|\bChowk\b|\bMarket\b|\bYard\b|\bFloor\b|\bBuilding\b|\bOpp\.?|\bNear\b|\bDist\.?|\bGSTIN\b|\bFSSAI\b|\bMandi\b|\bState\b|\bType of Supply\b|\bWholesale\b|\bCommission\b|\b\d{6}\b)',
    re.IGNORECASE
)

INLINE_LABEL_STOP_REGEX = re.compile(
    r'\b(e-?way\s*bill|inv(\.|oice)?\s*no|po\s*no|lr\s*no|date|vehicle|gstin|weighbridge|total|state|place of supply)\b.*$',
    re.IGNORECASE
)


def clean_party_name(text: Optional[str]) -> Optional[str]:
    """
    Cleans raw line strings by truncating horizontal column leaks,
    removing anchor prefixes, and ignoring structural header junk.
    """
    if not text:
        return None

    # 1. Truncate line at the first adjacent field label (prevents column bleeding)
    text = INLINE_LABEL_STOP_REGEX.sub('', text)

    # 2. Strip leading anchor prefixes
    text = re.sub(r'^(billed to|bill to|buyer|consignee|customer|m/s\.?)\s*\(?buyer\)?\s*:\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^(billed to|bill to|buyer|consignee|customer|m/s\.?)\s*:\s*', '', text, flags=re.IGNORECASE)

    # 3. Trim punctuation and spaces
    cleaned = text.strip(" :|-,\t\n")

    # 4. Filter invalid lines, address fragments, or column headers
    if not cleaned or len(cleaned) < 3:
        return None

    if COPY_MARKER_PATTERN.match(cleaned):
        return None

    if re.search(r'^(\(?buyer\)?|billed to|bill to|s\.?n\.?|sr\.?\s*no\.?)$', cleaned, re.IGNORECASE):
        return None

    if ADDRESS_OR_HEADER_REGEX.search(cleaned):
        return None

    return cleaned


def _word_span_bbox(line: Dict[str, Any], start: int, end: int) -> Tuple[float, float, float, float]:
    words = line.get("words")
    if not words:
        return line["bbox"]

    matched = []
    cursor = 0
    for w in words:
        w_start = cursor
        w_end = cursor + len(w["text"])
        if w_end > start and w_start < end:
            matched.append(w)
        cursor = w_end + 1

    if not matched:
        return line["bbox"]

    return (
        min(w["x0"] for w in matched),
        min(w["y0"] for w in matched),
        max(w["x1"] for w in matched),
        max(w["y1"] for w in matched),
    )


# --- 1. FUZZY ANCHOR SEARCH ---
def find_anchor_bbox(
    lines: List[Dict[str, Any]],
    target_labels: List[str],
    threshold: float = 80.0
) -> Optional[Dict[str, Any]]:
    best_match = None
    highest_score = 0.0

    for line in lines:
        line_text = line["text"]
        for label in target_labels:
            m = re.search(r'\b' + re.escape(label) + r'\b', line_text, re.IGNORECASE)
            if m:
                return {
                    "matched_label": label,
                    "score": 100.0,
                    "line": line,
                    "bbox": _word_span_bbox(line, m.start(), m.end()),
                    "page": line["page"],
                    "label_end": m.end(),
                    "same_line_text": line_text[m.end():].strip(" :|-"),
                }

            score = calculate_similarity(label, line_text)
            if score >= threshold and score > highest_score:
                highest_score = score
                fallback_words = line.get("words") or []
                approx_bbox = (
                    (fallback_words[0]["x0"], fallback_words[0]["y0"],
                     fallback_words[0]["x1"], fallback_words[0]["y1"])
                    if fallback_words else line["bbox"]
                )
                best_match = {
                    "matched_label": label,
                    "score": score,
                    "line": line,
                    "bbox": approx_bbox,
                    "page": line["page"],
                    "label_end": None,
                    "same_line_text": None,
                }

    return best_match


# --- 2. SPATIAL BOUNDING BOX WINDOWING ---
def get_words_in_spatial_window(
    words: List[Dict[str, Any]],
    anchor_bbox: Tuple[float, float, float, float],
    page_num: int,
    direction: str = "right",
    max_dx: float = 350.0,
    max_dy: float = 40.0,
    y_tolerance: float = 5.0
) -> List[Dict[str, Any]]:
    ax0, ay0, ax1, ay1 = anchor_bbox
    candidate_words = []
    page_words = [w for w in words if w["page"] == page_num]

    if direction in ("right", "right_or_below"):
        for w in page_words:
            if w["x0"] >= (ax1 - 2.0) and w["x0"] <= (ax1 + max_dx):
                if abs(w["y0"] - ay0) <= y_tolerance or (ay0 - y_tolerance <= w["y0"] <= ay1 + y_tolerance):
                    candidate_words.append(w)

        if candidate_words or direction == "right":
            candidate_words.sort(key=lambda w: w["x0"])
            return candidate_words

    if direction in ("below", "right_or_below"):
        for w in page_words:
            if w["y0"] >= (ay0 - 2.0) and w["y0"] <= (ay1 + max_dy):
                if (ax0 - 20.0) <= w["x0"] <= (ax1 + max_dx):
                    candidate_words.append(w)

        candidate_words.sort(key=lambda w: (w["y0"], w["x0"]))

    return candidate_words


# --- 3. FIELD EXTRACTION PIPELINE ---
def extract_field_value(
    parsed_pdf: Dict[str, Any],
    labels: List[str],
    regex_pattern: Optional[str] = None,
    direction: str = "right_or_below",
    max_dx: float = 300.0,
    max_dy: float = 30.0,
    threshold: float = 80.0
) -> Optional[str]:
    lines = parsed_pdf.get("lines", [])
    words = parsed_pdf.get("words", [])

    anchor = find_anchor_bbox(lines, labels, threshold=threshold)
    if not anchor:
        return None

    same_line_text = anchor.get("same_line_text")
    if same_line_text:
        if regex_pattern:
            match = re.search(regex_pattern, same_line_text, re.IGNORECASE)
            if match:
                return match.group(0 if match.lastindex is None else match.lastindex).strip()
        else:
            if same_line_text:
                return same_line_text

    window_words = get_words_in_spatial_window(
        words=words,
        anchor_bbox=anchor["bbox"],
        page_num=anchor["page"],
        direction=direction,
        max_dx=max_dx,
        max_dy=max_dy
    )
    candidate_text = " ".join(w["text"] for w in window_words)

    if regex_pattern and candidate_text:
        match = re.search(regex_pattern, candidate_text, re.IGNORECASE)
        if match:
            return match.group(0 if match.lastindex is None else match.lastindex).strip()

    if regex_pattern:
        match = re.search(regex_pattern, anchor["line"]["text"], re.IGNORECASE)
        if match:
            return match.group(0 if match.lastindex is None else match.lastindex).strip()

    if not regex_pattern and candidate_text:
        cleaned = candidate_text
        for lbl in labels:
            cleaned = re.sub(re.escape(lbl), "", cleaned, flags=re.IGNORECASE)
        return cleaned.strip(" :|-") or None

    return None


# --- 4. SELLER / BUYER NAME EXTRACTION ---
def extract_seller_name(lines: List[Dict[str, Any]], supplier_gstin: Optional[str] = None) -> Optional[str]:
    """
    Extracts seller name using GSTIN proximity or top letterhead.
    """
    if supplier_gstin:
        for idx, line in enumerate(lines):
            if supplier_gstin in line["text"]:
                for offset in range(1, 6):
                    if idx - offset >= 0:
                        candidate = clean_party_name(lines[idx - offset]["text"])
                        if candidate:
                            return candidate

    for line in lines[:8]:
        text = line["text"].strip()
        candidate = clean_party_name(text)
        if candidate and not re.search(r'\b(tax invoice|bill|receipt|weighbridge|invoice|billed to)\b', text, re.IGNORECASE):
            return candidate

    return None


def extract_buyer_name(lines: List[Dict[str, Any]], words: List[Dict[str, Any]], buyer_gstin: Optional[str] = None, seller_name: Optional[str] = None) -> Optional[str]:
    """
    Extracts buyer name using column-constrained spatial bounding boxes and GSTIN proximity.
    """
    # 1. Anchor spatial search ("Billed To", "Bill To", "Buyer")
    candidate_lines = [ln for ln in lines if not COPY_MARKER_PATTERN.match(ln["text"].strip())]
    anchor = find_anchor_bbox(candidate_lines, ["Billed To", "Bill To", "Buyer Details", "Buyer", "Consignee"], threshold=80.0)

    if anchor:
        ax0, ay0, ax1, ay1 = anchor["bbox"]
        anchor_page = anchor["page"]

        # Check inline right-side text first
        same_line = anchor.get("same_line_text") or ""
        cleaned_same = clean_party_name(same_line)
        if cleaned_same and cleaned_same != seller_name:
            return cleaned_same

        # Column-bounded spatial window: restricts X to anchor width + 220px to prevent column bleed
        below_words = [
            w for w in words
            if w.get("page") == anchor_page
            and w["y0"] >= (ay1 - 2.0)
            and w["y0"] <= (ay1 + 65.0)
            and (ax0 - 15.0) <= w["x0"] <= (ax0 + 220.0)
        ]

        # Group words into visual lines by Y coordinate
        below_words.sort(key=lambda w: (w["y0"], w["x0"]))
        grouped_lines: List[List[Dict[str, Any]]] = []
        for w in below_words:
            if not grouped_lines or abs(w["y0"] - grouped_lines[-1][0]["y0"]) > 4.0:
                grouped_lines.append([w])
            else:
                grouped_lines[-1].append(w)

        for line_words in grouped_lines:
            raw_str = " ".join(w["text"] for w in line_words)
            candidate = clean_party_name(raw_str)
            if candidate and candidate != seller_name:
                return candidate

    # 2. Fallback: Proximity above Buyer GSTIN
    if buyer_gstin:
        for idx, line in enumerate(lines):
            if buyer_gstin in line["text"]:
                for offset in range(1, 5):
                    if idx - offset >= 0:
                        candidate = clean_party_name(lines[idx - offset]["text"])
                        if candidate and candidate != seller_name:
                            return candidate

    return None


# --- 5. HIGH-LEVEL METADATA EXTRACTION ENGINE ---
def extract_metadata(parsed_pdf: Dict[str, Any]) -> Dict[str, Any]:
    lines = parsed_pdf.get("lines", [])
    words = parsed_pdf.get("words", [])
    full_text = "\n".join(l["text"] for l in lines)

    all_gstins = re.findall(REGEX_PATTERNS["GSTIN"], full_text)
    supplier_gstin = all_gstins[0] if len(all_gstins) > 0 else None
    buyer_gstin = all_gstins[1] if len(all_gstins) > 1 else (
        extract_field_value(parsed_pdf, ["GSTIN", "GSTIN:"], REGEX_PATTERNS["GSTIN"], direction="right_or_below")
    )

    seller_name = extract_seller_name(lines, supplier_gstin)
    buyer_name = extract_buyer_name(lines, words, buyer_gstin, seller_name)

    metadata = {
        "invoice_number": extract_field_value(
            parsed_pdf, ["Inv. No", "Invoice No", "Inv No", "Invoice Number"],
            REGEX_PATTERNS["INVOICE_NO"], direction="right_or_below"
        ),
        "invoice_date": extract_field_value(
            parsed_pdf, ["Date", "Invoice Date", "Dated"],
            REGEX_PATTERNS["DATE"], direction="right_or_below"
        ),
        "eway_bill_number": extract_field_value(
            parsed_pdf, ["e-Way Bill", "eWay Bill", "E-Way Bill No"],
            REGEX_PATTERNS["EWAY_BILL"], direction="right_or_below"
        ),
        "po_number": extract_field_value(
            parsed_pdf, ["PO No", "PO Number", "P.O. Ref", "Ref:"],
            REGEX_PATTERNS["PO_NO"], direction="right_or_below"
        ),
        "vehicle_number": extract_field_value(
            parsed_pdf, ["Vehicle No", "Vehicle Number", "Vehicle"],
            REGEX_PATTERNS["VEHICLE_NO"], direction="right_or_below"
        ),
        "weighbridge_ticket": extract_field_value(
            parsed_pdf, ["Weighbridge Ticket", "WB Ticket", "Weighbridge"],
            REGEX_PATTERNS["WEIGHBRIDGE_TICKET"], direction="right_or_below"
        ),
        "lr_number": extract_field_value(
            parsed_pdf, ["LR No", "Lorry Receipt", "LR Number"],
            REGEX_PATTERNS["LR_NO"], direction="right_or_below"
        ),
        "supplier_gstin": supplier_gstin,
        "buyer_gstin": buyer_gstin,
        "seller_name": seller_name,
        "buyer_name": buyer_name,
        "total_amount": extract_field_value(
            parsed_pdf, ["Total Value", "Grand Total", "Total Amount"],
            REGEX_PATTERNS["AMOUNT"], direction="right_or_below"
        )
    }

    return metadata


if __name__ == "__main__":
    import json
    try:
        from app.services.pdfparser import parse_pdf_document
    except ImportError:
        from pdfparser import parse_pdf_document

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    test_folder = os.path.join(project_root, "test_invoices")

    test_files = [f for f in os.listdir(test_folder) if f.endswith(".pdf")] if os.path.exists(test_folder) else []

    if test_files:
        for file_name in test_files:
            print(f"\n==========================================")
            print(f" Testing Anchor Extraction: {file_name}")
            print(f"==========================================")

            sample_path = os.path.join(test_folder, file_name)
            with open(sample_path, "rb") as f:
                pdf_data = f.read()

            parsed_pdf = parse_pdf_document(pdf_data)
            extracted_meta = extract_metadata(parsed_pdf)

            print(json.dumps(extracted_meta, indent=2))
    else:
        print(f"No '.pdf' files found inside '{test_folder}'.")

        
# import os
# import re
# from typing import Dict, List, Tuple, Optional, Any

# #loading the libs which calculate the similarity of 2 sentences
# try:
#     from rapidfuzz import fuzz
#     def calculate_similarity(s1: str, s2: str) -> float:
#         return fuzz.partial_ratio(s1.lower(), s2.lower())
# except ImportError:
#     import difflib
#     def calculate_similarity(s1: str, s2: str) -> float:
#         s1, s2 = s1.lower(), s2.lower()
#         if s1 in s2 or s2 in s1:
#             return 100.0
#         return difflib.SequenceMatcher(None, s1, s2).ratio() * 100.0


# # --- STRICT REGEX PATTERNS ---
# REGEX_PATTERNS = {
#     "GSTIN": r'\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b',
#     "EWAY_BILL": r'\b\d{12}\b',
#     "INVOICE_NO": r'\b(?:AGRO|INV|BILL|REC)[/:-][0-9A-Za-z/_-]+\b',
#     "DATE": r'\b\d{1,2}[-/\.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{1,2})[-/\.]\d{2,4}\b',
#     "AMOUNT": r'(?:INR|Rs\.?|\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)|(?:\b[0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{2})\b)',
#     "PO_NO": r'\bPO[-/\s:]?\s*([0-9A-Za-z_-]+)\b',
#     "LR_NO": r'\bLR[-/\s:]?\s*([0-9A-Za-z_-]+)\b',
#     "VEHICLE_NO": r'\b[A-Z0-9]{2}[-_\s]?[0-9]{1,2}[-_\s]?[A-Z0-9]{1,3}[-_\s]?[0-9]{4}\b',
#     "WEIGHBRIDGE_TICKET": r'\bWB[-/\s]?[0-9A-Za-z_-]+\b',
# }


# def _word_span_bbox(line: Dict[str, Any], start: int, end: int) -> Tuple[float, float, float, float]:
#     """
#     Maps a [start:end) character span in line["text"] back to the bbox of the
#     words that produced that substring. line["text"] is built as
#     " ".join(w["text"] for w in line["words"]), so we walk the same words in
#     the same order, tracking cumulative offsets, and union the bboxes of any
#     word that overlaps the requested span.
#     """
#     words = line.get("words")
#     if not words:
#         # Fallback: no word-level data available, can't do better than the line bbox
#         return line["bbox"]

#     matched = []
#     cursor = 0
#     for w in words:
#         w_start = cursor
#         w_end = cursor + len(w["text"])
#         # does [w_start, w_end) overlap [start, end)?
#         if w_end > start and w_start < end:
#             matched.append(w)
#         cursor = w_end + 1  # +1 for the joining space

#     if not matched:
#         return line["bbox"]

#     return (
#         min(w["x0"] for w in matched),
#         min(w["y0"] for w in matched),
#         max(w["x1"] for w in matched),
#         max(w["y1"] for w in matched),
#     )


# # --- 1. FUZZY ANCHOR SEARCH ---
# def find_anchor_bbox(
#     lines: List[Dict[str, Any]],
#     target_labels: List[str],
#     threshold: float = 80.0
# ) -> Optional[Dict[str, Any]]:
#     """
#     Finds the line matching target labels, and returns the bbox of ONLY the
#     matched label tokens (not the whole line) — plus the label's end offset
#     within line["text"], so callers can slice out same-line trailing value
#     text without doing spatial search at all.
#     """
#     best_match = None
#     highest_score = 0.0

#     for line in lines:
#         line_text = line["text"]
#         for label in target_labels:
#             m = re.search(r'\b' + re.escape(label) + r'\b', line_text, re.IGNORECASE)
#             if m:
#                 return {
#                     "matched_label": label,
#                     "score": 100.0,
#                     "line": line,
#                     "bbox": _word_span_bbox(line, m.start(), m.end()),
#                     "page": line["page"],
#                     "label_end": m.end(),          # NEW: offset right after the label text
#                     "same_line_text": line_text[m.end():].strip(" :|-"),  # NEW
#                 }

#             score = calculate_similarity(label, line_text)
#             if score >= threshold and score > highest_score:
#                 highest_score = score
#                 # Fuzzy match: we don't have an exact char span, so approximate
#                 # the label's bbox as just the first word of the line (best guess)
#                 # rather than claiming the whole line.
#                 fallback_words = line.get("words") or []
#                 approx_bbox = (
#                     (fallback_words[0]["x0"], fallback_words[0]["y0"],
#                      fallback_words[0]["x1"], fallback_words[0]["y1"])
#                     if fallback_words else line["bbox"]
#                 )
#                 best_match = {
#                     "matched_label": label,
#                     "score": score,
#                     "line": line,
#                     "bbox": approx_bbox,
#                     "page": line["page"],
#                     "label_end": None,
#                     "same_line_text": None,
#                 }

#     return best_match


# # --- 2. SPATIAL BOUNDING BOX WINDOWING ---
# def get_words_in_spatial_window(
#     words: List[Dict[str, Any]],
#     anchor_bbox: Tuple[float, float, float, float],
#     page_num: int,
#     direction: str = "right",
#     max_dx: float = 350.0,
#     max_dy: float = 40.0,
#     y_tolerance: float = 5.0
# ) -> List[Dict[str, Any]]:
#     ax0, ay0, ax1, ay1 = anchor_bbox
#     candidate_words = []
#     page_words = [w for w in words if w["page"] == page_num]

#     if direction in ("right", "right_or_below"):
#         for w in page_words:
#             if w["x0"] >= (ax1 - 2.0) and w["x0"] <= (ax1 + max_dx):
#                 if abs(w["y0"] - ay0) <= y_tolerance or (ay0 - y_tolerance <= w["y0"] <= ay1 + y_tolerance):
#                     candidate_words.append(w)

#         if candidate_words or direction == "right":
#             candidate_words.sort(key=lambda w: w["x0"])
#             return candidate_words

#     if direction in ("below", "right_or_below"):
#         for w in page_words:
#             if w["y0"] >= (ay0 - 2.0) and w["y0"] <= (ay1 + max_dy):
#                 if (ax0 - 20.0) <= w["x0"] <= (ax1 + max_dx):
#                     candidate_words.append(w)

#         candidate_words.sort(key=lambda w: (w["y0"], w["x0"]))

#     return candidate_words


# # --- 3. FIELD EXTRACTION PIPELINE ---
# def extract_field_value(
#     parsed_pdf: Dict[str, Any],
#     labels: List[str],
#     regex_pattern: Optional[str] = None,
#     direction: str = "right_or_below",
#     max_dx: float = 300.0,
#     max_dy: float = 30.0,
#     threshold: float = 80.0
# ) -> Optional[str]:
#     lines = parsed_pdf.get("lines", [])
#     words = parsed_pdf.get("words", [])

#     anchor = find_anchor_bbox(lines, labels, threshold=threshold)
#     if not anchor:
#         return None

#     # --- Path A: same-line value (label and value share a reconstructed line) ---
#     same_line_text = anchor.get("same_line_text")
#     if same_line_text:
#         if regex_pattern:
#             match = re.search(regex_pattern, same_line_text, re.IGNORECASE)
#             if match:
#                 return match.group(0 if match.lastindex is None else match.lastindex).strip()
#         else:
#             # No pattern supplied: trust the cleaned same-line remainder directly,
#             # but only if it's non-trivial (avoids returning "" for label-only lines)
#             if same_line_text:
#                 return same_line_text

#     # --- Path B: spatial window search (label and value are on different lines,
#     #     e.g. label above a table column, or same-line slice found nothing) ---
#     window_words = get_words_in_spatial_window(
#         words=words,
#         anchor_bbox=anchor["bbox"],
#         page_num=anchor["page"],
#         direction=direction,
#         max_dx=max_dx,
#         max_dy=max_dy
#     )
#     candidate_text = " ".join(w["text"] for w in window_words)

#     if regex_pattern and candidate_text:
#         match = re.search(regex_pattern, candidate_text, re.IGNORECASE)
#         if match:
#             return match.group(0 if match.lastindex is None else match.lastindex).strip()

#     # --- Path C: regex against the full anchor line as a last resort ---
#     if regex_pattern:
#         match = re.search(regex_pattern, anchor["line"]["text"], re.IGNORECASE)
#         if match:
#             return match.group(0 if match.lastindex is None else match.lastindex).strip()

#     # --- Path D: no regex supplied at all, fall back to cleaned window text ---
#     if not regex_pattern and candidate_text:
#         cleaned = candidate_text
#         for lbl in labels:
#             cleaned = re.sub(re.escape(lbl), "", cleaned, flags=re.IGNORECASE)
#         return cleaned.strip(" :|-") or None

#     return None


# # --- 4. HIGH-LEVEL METADATA EXTRACTION ENGINE ---
# def extract_metadata(parsed_pdf: Dict[str, Any]) -> Dict[str, Any]:
#     lines = parsed_pdf.get("lines", [])
#     full_text = "\n".join(l["text"] for l in lines)

#     all_gstins = re.findall(REGEX_PATTERNS["GSTIN"], full_text)
#     supplier_gstin = all_gstins[0] if len(all_gstins) > 0 else None
#     buyer_gstin = all_gstins[1] if len(all_gstins) > 1 else (
#         extract_field_value(parsed_pdf, ["GSTIN", "GSTIN:"], REGEX_PATTERNS["GSTIN"], direction="right_or_below")
#     )

#     metadata = {
#         "invoice_number": extract_field_value(
#             parsed_pdf, ["Inv. No", "Invoice No", "Inv No", "Invoice Number"],
#             REGEX_PATTERNS["INVOICE_NO"], direction="right_or_below"
#         ),
#         "invoice_date": extract_field_value(
#             parsed_pdf, ["Date", "Invoice Date", "Dated"],
#             REGEX_PATTERNS["DATE"], direction="right_or_below"
#         ),
#         "eway_bill_number": extract_field_value(
#             parsed_pdf, ["e-Way Bill", "eWay Bill", "E-Way Bill No"],
#             REGEX_PATTERNS["EWAY_BILL"], direction="right_or_below"
#         ),
#         "po_number": extract_field_value(
#             parsed_pdf, ["PO No", "PO Number", "P.O. Ref", "Ref:"],
#             REGEX_PATTERNS["PO_NO"], direction="right_or_below"
#         ),
#         "vehicle_number": extract_field_value(
#             parsed_pdf, ["Vehicle No", "Vehicle Number", "Vehicle"],
#             REGEX_PATTERNS["VEHICLE_NO"], direction="right_or_below"
#         ),
#         "weighbridge_ticket": extract_field_value(
#             parsed_pdf, ["Weighbridge Ticket", "WB Ticket", "Weighbridge"],
#             REGEX_PATTERNS["WEIGHBRIDGE_TICKET"], direction="right_or_below"
#         ),
#         "lr_number": extract_field_value(
#             parsed_pdf, ["LR No", "Lorry Receipt", "LR Number"],
#             REGEX_PATTERNS["LR_NO"], direction="right_or_below"
#         ),
#         "supplier_gstin": supplier_gstin,
#         "buyer_gstin": buyer_gstin,
#         "total_amount": extract_field_value(
#             parsed_pdf, ["Total Value", "Grand Total", "Total Amount"],
#             REGEX_PATTERNS["AMOUNT"], direction="right_or_below"
#         )
#     }

#     return metadata


# if __name__ == "__main__":
#     import json
#     try:
#         from app.services.pdfparser import parse_pdf_document
#     except ImportError:
#         from pdfparser import parse_pdf_document

#     script_dir = os.path.dirname(os.path.abspath(__file__))
#     project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
#     test_folder = os.path.join(project_root, "test_invoices")

#     test_files = [f for f in os.listdir(test_folder) if f.endswith(".pdf")] if os.path.exists(test_folder) else []

#     if test_files:
#         for file_name in test_files:
#             sample_path = os.path.join(test_folder, file_name)
#             print(f"\n==========================================")
#             print(f" Testing Anchor Extraction: {file_name}")
#             print(f"==========================================")

#             with open(sample_path, "rb") as f:
#                 pdf_data = f.read()

#             parsed_pdf = parse_pdf_document(pdf_data)
#             extracted_meta = extract_metadata(parsed_pdf)

#             print(json.dumps(extracted_meta, indent=2))
#     else:
#         print(f"No '.pdf' files found inside '{test_folder}'.")

