import pymupdf #used to read the pdfs in python 
from typing import Dict, List, Any #type annotations 


#groups words horizontally by using y0
def group_words_into_lines(words: List[Dict[str, Any]], y_tolerance: float = 3.0) -> List[Dict[str, Any]]:
    """Groups word tokens into horizontal reading lines based on baseline (y0) alignment."""
    if not words:
        return []

    sorted_words = sorted(words, key=lambda w: (w["page"], w["y0"], w["x0"])) #helps to sort the extracted words accordin to the document(pdf) order thats fromm top-bottom and left-ryt
    lines: List[Dict[str, Any]] = []
    current_line: List[Dict[str, Any]] = [sorted_words[0]]

    for word in sorted_words[1:]:
        prev_word = current_line[-1]
        if word["page"] == prev_word["page"] and abs(word["y0"] - prev_word["y0"]) <= y_tolerance:
            current_line.append(word)
        else:
            current_line.sort(key=lambda w: w["x0"])
            lines.append({
                "page": current_line[0]["page"],
                "text": " ".join([w["text"] for w in current_line]),
                "y0": current_line[0]["y0"],
                "bbox": (
                    min(w["x0"] for w in current_line),
                    min(w["y0"] for w in current_line),
                    max(w["x1"] for w in current_line),
                    max(w["y1"] for w in current_line),
                ),
                "word_count": len(current_line),
                "words": current_line,
            })
            current_line = [word]

    if current_line:
        current_line.sort(key=lambda w: w["x0"])
        lines.append({
            "page": current_line[0]["page"],
            "text": " ".join([w["text"] for w in current_line]),
            "y0": current_line[0]["y0"],
            "bbox": (
                min(w["x0"] for w in current_line),
                min(w["y0"] for w in current_line),
                max(w["x1"] for w in current_line),
                max(w["y1"] for w in current_line),
            ),
            "word_count": len(current_line)
        })

    return lines


#takes raw pdf bytes from the backend
def parse_pdf_document(file_bytes: bytes) -> Dict[str, Any]:
    """
    Parses PDF bytes to extract word-level coordinates and reconstructed lines.
    
    Returns:
        dict containing:
          - total_pages: Total number of PDF pages
          - pages_meta: Dimensions of each page
          - words: List of all word tokens with bboxes (for spatial anchor search)
          - lines: Reconstructed text lines (for text/regex search)
    """
    doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    extracted_words: List[Dict[str, Any]] = []
    pages_meta: List[Dict[str, Any]] = []

    for page_idx, page in enumerate(doc):
        page_num = page_idx + 1
        rect = page.rect
        
        pages_meta.append({
            "page": page_num,
            "width": round(rect.width, 2),
            "height": round(rect.height, 2)
        })

        words = page.get_text("words")

        for w in words:
            cleaned_text = w[4].strip() #the original word: eg: "invoice"
            if not cleaned_text:
                continue

            x0, y0, x1, y1 = round(w[0], 2), round(w[1], 2), round(w[2], 2), round(w[3], 2)

            extracted_words.append({
                "page": page_num,
                "text": cleaned_text,
                "bbox": (x0, y0, x1, y1),
                "x0": x0,
                "y0": y0,
                "x1": x1,
                "y1": y1,
                "block_num": w[5],
                "line_num": w[6],
            })

    doc.close()

    lines = group_words_into_lines(extracted_words)

    return {
        "total_pages": len(pages_meta),
        "pages_meta": pages_meta,
        "words": extracted_words,
        "lines": lines
    }