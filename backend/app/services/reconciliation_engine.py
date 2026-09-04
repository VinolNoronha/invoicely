#Core matching algorithms & rule sets

from typing import List, Dict, Any, Tuple
import time
from app.schemas.reconciliation import GSTR2BRecord, MatchDetail, ReconcileResponse
from app.utils.normalizers import clean_gstin, normalize_invoice_number, clean_float


def reconcile_invoices(
    db_invoices: List[Dict[str, Any]], 
    gstr2b_records: List[GSTR2BRecord]
) -> ReconcileResponse:
    """
    Executes 4-tier reconciliation between Supabase purchase invoices and GSTR-2B filings.
    
    Tiers:
    1. Exact Match (Score 100): GSTIN + Raw Invoice No + Total Tax match.
    2. Fuzzy Match (Score 90): GSTIN + Normalized Invoice No + Total Tax match.
    3. Tax Mismatch (Score 65): GSTIN + Invoice No match, but tax amount differs.
    4. Unmatched (Score 0): No vendor or invoice match found in GSTR-2B, OR the
       matching GSTR-2B filing was already claimed by another (duplicate) invoice.

    A GSTR-2B record can satisfy at most ONE db invoice per run — once consumed
    by tier 1/2/3, it's removed from the candidate pool for every later invoice.
    If a later invoice would have matched a filing that's already claimed, its
    unmatched reason explicitly says so instead of implying no filing exists.
    """
    start_time = time.perf_counter()

    updated_records: List[MatchDetail] = []
    
    exact_count = 0
    fuzzy_count = 0
    tax_mismatch_count = 0
    unmatched_count = 0

    # Index GSTR-2B records by cleaned GSTIN, keeping each record's original
    # position so we can mark it "used" without needing a unique id field.
    gstr2b_by_gstin: Dict[str, List[Tuple[int, GSTR2BRecord]]] = {}
    for idx, record in enumerate(gstr2b_records):
        gstin_key = clean_gstin(record.gstin) or record.gstin.upper().strip()
        gstr2b_by_gstin.setdefault(gstin_key, []).append((idx, record))

    used_gstr2b_indices: set[int] = set()

    # Process each invoice from Supabase
    for inv in db_invoices:
        inv_id = str(inv.get("id"))
        raw_inv_no = str(inv.get("invoice_no", "")).strip()
        norm_inv_no = normalize_invoice_number(raw_inv_no)
        
        supplier_gstin = clean_gstin(inv.get("supplier_gstin")) or str(inv.get("supplier_gstin", "")).upper().strip()
        db_tax = clean_float(inv.get("total_tax", 0.0))

        matched_record: MatchDetail | None = None
        duplicate_claim_inv_no: str | None = None  # set if a matching filing exists but was already used

        # Check if supplier GSTIN exists in GSTR-2B
        candidate_filings = gstr2b_by_gstin.get(supplier_gstin, [])

        if candidate_filings:
            for idx, record in candidate_filings:
                gstr2b_inv_raw = str(record.inv_num).strip()
                gstr2b_inv_norm = normalize_invoice_number(gstr2b_inv_raw)
                gstr2b_tax = clean_float(record.total_tax)
                gstr2b_taxable = clean_float(record.taxable_value)

                tax_diff = abs(db_tax - gstr2b_tax)
                is_tax_equal = tax_diff <= 0.50  # Allowance for rounding (up to ₹0.50)
                invoice_no_matches = (raw_inv_no == gstr2b_inv_raw) or (norm_inv_no == gstr2b_inv_norm)

                if idx in used_gstr2b_indices:
                    # Already claimed by an earlier invoice this run. If this
                    # record would otherwise have matched, remember it so the
                    # eventual "unmatched" reason can name the real cause.
                    if invoice_no_matches and duplicate_claim_inv_no is None:
                        duplicate_claim_inv_no = gstr2b_inv_raw
                    continue

                # Tier 1: Exact Match
                if raw_inv_no == gstr2b_inv_raw and is_tax_equal:
                    matched_record = MatchDetail(
                        invoice_id=inv_id,
                        invoice_no=raw_inv_no,
                        supplier_gstin=supplier_gstin,
                        reconciliation_status="matched",
                        confidence_score=100,
                        ai_match_reason="Exact match on GSTIN, Invoice Number, and Tax amount.",
                        gstr2b_taxable_value=gstr2b_taxable,
                        gstr2b_total_tax=gstr2b_tax,
                    )
                    exact_count += 1
                    used_gstr2b_indices.add(idx)
                    break

                # Tier 2: Fuzzy Match (formatting differences like missing slashes/zeros)
                elif norm_inv_no == gstr2b_inv_norm and is_tax_equal:
                    matched_record = MatchDetail(
                        invoice_id=inv_id,
                        invoice_no=raw_inv_no,
                        supplier_gstin=supplier_gstin,
                        reconciliation_status="fuzzy_matched",
                        confidence_score=90,
                        ai_match_reason=f"Matched with formatting variation in invoice number (GSTR-2B filed as '{gstr2b_inv_raw}').",
                        gstr2b_taxable_value=gstr2b_taxable,
                        gstr2b_total_tax=gstr2b_tax,
                    )
                    fuzzy_count += 1
                    used_gstr2b_indices.add(idx)
                    break

                # Tier 3: Tax Mismatch
                elif invoice_no_matches and not is_tax_equal:
                    matched_record = MatchDetail(
                        invoice_id=inv_id,
                        invoice_no=raw_inv_no,
                        supplier_gstin=supplier_gstin,
                        reconciliation_status="tax_mismatch",
                        confidence_score=65,
                        ai_match_reason=f"Invoice number matched, but tax differs. DB: ₹{db_tax:,.2f} vs GSTR-2B: ₹{gstr2b_tax:,.2f}.",
                        gstr2b_taxable_value=gstr2b_taxable,
                        gstr2b_total_tax=gstr2b_tax,
                    )
                    tax_mismatch_count += 1
                    used_gstr2b_indices.add(idx)
                    break

        # Tier 4: Unmatched
        if not matched_record:
            if duplicate_claim_inv_no:
                reason = (
                    f"Duplicate invoice number — GSTR-2B filing '{duplicate_claim_inv_no}' "
                    "was already matched to another invoice in this batch."
                )
            else:
                reason = "No matching invoice found in uploaded GSTR-2B records."

            matched_record = MatchDetail(
                invoice_id=inv_id,
                invoice_no=raw_inv_no,
                supplier_gstin=supplier_gstin,
                reconciliation_status="unmatched",
                confidence_score=0,
                ai_match_reason=reason,
                gstr2b_taxable_value=None,
                gstr2b_total_tax=None,
            )
            unmatched_count += 1

        updated_records.append(matched_record)

    elapsed = time.perf_counter() - start_time

    return ReconcileResponse(
        total_db_invoices=len(db_invoices),
        total_gstr2b_records=len(gstr2b_records),
        exact_matches=exact_count,
        fuzzy_matches=fuzzy_count,
        tax_mismatches=tax_mismatch_count,
        unmatched=unmatched_count,
        updated_records=updated_records,
        processing_time_seconds=round(elapsed, 4),
    )
# from typing import List, Dict, Any, Tuple
# from app.schemas.reconciliation import GSTR2BRecord, MatchDetail, ReconcileResponse
# from app.utils.normalizers import clean_gstin, normalize_invoice_number, clean_float


# def reconcile_invoices(
#     db_invoices: List[Dict[str, Any]], 
#     gstr2b_records: List[GSTR2BRecord]
# ) -> ReconcileResponse:
#     """
#     Executes 4-tier reconciliation between Supabase purchase invoices and GSTR-2B filings.
    
#     Tiers:
#     1. Exact Match (Score 100): GSTIN + Raw Invoice No + Total Tax match.
#     2. Fuzzy Match (Score 90): GSTIN + Normalized Invoice No + Total Tax match.
#     3. Tax Mismatch (Score 65): GSTIN + Invoice No match, but tax amount differs.
#     4. Unmatched (Score 0): No vendor or invoice match found in GSTR-2B.
#     """
#     updated_records: List[MatchDetail] = []
    
#     exact_count = 0
#     fuzzy_count = 0
#     tax_mismatch_count = 0
#     unmatched_count = 0

#     # Index GSTR-2B records by cleaned GSTIN for fast lookup
#     gstr2b_by_gstin: Dict[str, List[GSTR2BRecord]] = {}
#     for record in gstr2b_records:
#         gstin_key = clean_gstin(record.gstin) or record.gstin.upper().strip()
#         if gstin_key not in gstr2b_by_gstin:
#             gstr2b_by_gstin[gstin_key] = []
#         gstr2b_by_gstin[gstin_key].append(record)

#     # Process each invoice from Supabase
#     for inv in db_invoices:
#         inv_id = str(inv.get("id"))
#         raw_inv_no = str(inv.get("invoice_no", "")).strip()
#         norm_inv_no = normalize_invoice_number(raw_inv_no)
        
#         supplier_gstin = clean_gstin(inv.get("supplier_gstin")) or str(inv.get("supplier_gstin", "")).upper().strip()
#         db_tax = clean_float(inv.get("total_tax", 0.0))

#         matched_record: MatchDetail | None = None
        
#         # Check if supplier GSTIN exists in GSTR-2B
#         candidate_filings = gstr2b_by_gstin.get(supplier_gstin, [])

#         if candidate_filings:
#             for record in candidate_filings:
#                 gstr2b_inv_raw = str(record.inv_num).strip()
#                 gstr2b_inv_norm = normalize_invoice_number(gstr2b_inv_raw)
#                 gstr2b_tax = clean_float(record.total_tax)

#                 tax_diff = abs(db_tax - gstr2b_tax)
#                 is_tax_equal = tax_diff <= 0.50  # Allowance for rounding (up to ₹0.50)

#                 # Tier 1: Exact Match
#                 if raw_inv_no == gstr2b_inv_raw and is_tax_equal:
#                     matched_record = MatchDetail(
#                         invoice_id=inv_id,
#                         invoice_no=raw_inv_no,
#                         supplier_gstin=supplier_gstin,
#                         reconciliation_status="matched",
#                         confidence_score=100,
#                         ai_match_reason="Exact match on GSTIN, Invoice Number, and Tax amount."
#                     )
#                     exact_count += 1
#                     break

#                 # Tier 2: Fuzzy Match (formatting differences like missing slashes/zeros)
#                 elif norm_inv_no == gstr2b_inv_norm and is_tax_equal:
#                     matched_record = MatchDetail(
#                         invoice_id=inv_id,
#                         invoice_no=raw_inv_no,
#                         supplier_gstin=supplier_gstin,
#                         reconciliation_status="fuzzy_matched",
#                         confidence_score=90,
#                         ai_match_reason=f"Matched with formatting variation in invoice number (GSTR-2B filed as '{gstr2b_inv_raw}')."
#                     )
#                     fuzzy_count += 1
#                     break

#                 # Tier 3: Tax Mismatch
#                 elif (raw_inv_no == gstr2b_inv_raw or norm_inv_no == gstr2b_inv_norm) and not is_tax_equal:
#                     matched_record = MatchDetail(
#                         invoice_id=inv_id,
#                         invoice_no=raw_inv_no,
#                         supplier_gstin=supplier_gstin,
#                         reconciliation_status="tax_mismatch",
#                         confidence_score=65,
#                         ai_match_reason=f"Invoice number matched, but tax differs. DB: ₹{db_tax:,.2f} vs GSTR-2B: ₹{gstr2b_tax:,.2f}."
#                     )
#                     tax_mismatch_count += 1
#                     break

#         # Tier 4: Unmatched
#         if not matched_record:
#             matched_record = MatchDetail(
#                 invoice_id=inv_id,
#                 invoice_no=raw_inv_no,
#                 supplier_gstin=supplier_gstin,
#                 reconciliation_status="unmatched",
#                 confidence_score=0,
#                 ai_match_reason="No matching invoice found in uploaded GSTR-2B records."
#             )
#             unmatched_count += 1

#         updated_records.append(matched_record)

#     return ReconcileResponse(
#         total_db_invoices=len(db_invoices),
#         total_gstr2b_records=len(gstr2b_records),
#         exact_matches=exact_count,
#         fuzzy_matches=fuzzy_count,
#         tax_mismatches=tax_mismatch_count,
#         unmatched=unmatched_count,
#         updated_records=updated_records
#     )