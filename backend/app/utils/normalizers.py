import re
from datetime import datetime
from typing import Any, Optional


def parse_date_iso(date_str: Optional[str]) -> Optional[str]:
    """
    Parses diverse date formats into standard 'YYYY-MM-DD'.
    Handles hyphens, slashes, dots, and full/abbreviated month names.
    """
    if not date_str:
        return None

    cleaned = str(date_str).strip()
    formats = [
        # Standard numeric formats
        "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d.%m.%Y",
        "%d/%m/%y", "%d-%m-%y",
        # Named month formats (space and hyphen separated)
        "%d %b %Y", "%d %B %Y", "%d-%b-%Y", "%d-%B-%Y",
        "%b %d, %Y", "%B %d, %Y", "%d/%b/%Y"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(cleaned, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def clean_float(val: Any) -> float:
    """
    Safely parses strings or numbers into a cleaned float.
    Handles currency symbols (₹, $, Rs), commas, and trailing noise (/-).
    """
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)

    # 1. Remove commas and whitespace
    raw_str = str(val).replace(',', '').strip()

    # 2. Extract first valid float/int pattern (prevents trailing hyphens like '/-' from ruining parse)
    match = re.search(r'-?\d+(?:\.\d+)?', raw_str)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return 0.0
    return 0.0


def clean_gstin(gstin_str: Optional[str]) -> Optional[str]:
    """
    Validates and extracts a 15-character Indian GSTIN string.
    Strips internal hyphens/spaces before matching.
    """
    if not gstin_str:
        return None
    
    # Strip spaces/hyphens for clean matching
    sanitized = re.sub(r'[\s-]+', '', str(gstin_str).upper())
    match = re.search(r'[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}', sanitized)
    return match.group(0) if match else None


def normalize_invoice_number(inv_no: Optional[str]) -> str:
    """
    Normalizes invoice numbers for fuzzy reconciliation:
    - Uppercases string
    - Strips slashes, dashes, spaces, and dots (e.g., AGRO/26/0013 -> AGRO260013)
    - Strips leading zeros from numeric segments (e.g., AGRO260013 -> AGRO2613)
    """
    if not inv_no:
        return ""
    
    cleaned = str(inv_no).upper().strip()
    # Remove separators (/ - _ . space)
    cleaned = re.sub(r"[\/\_\-\s\.]", "", cleaned)
    # Strip leading zeros after letters or start of string (e.g., AGRO0013 -> AGRO13)
    cleaned = re.sub(r"(?<=\D)0+(?=\d)", "", cleaned)
    return cleaned

def format_currency(val: float) -> str:
    """Formats float back to clean 2-decimal comma string (e.g., 37,534,221.00)."""
    return f"{val:,.2f}"