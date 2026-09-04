#Pydantic models for GSTR-2B & match results

from pydantic import BaseModel, Field
from typing import List, Optional


class GSTR2BRecord(BaseModel):
    """Schema for individual line items inside the uploaded GSTR-2B JSON/file."""
    gstin: str = Field(..., description="Supplier GSTIN")
    inv_num: str = Field(..., description="Invoice Number as filed in GSTR-2B")
    inv_date: Optional[str] = Field(None, description="Invoice Date (YYYY-MM-DD)")
    taxable_value: float = Field(0.0, description="Taxable amount reported in GSTR-2B")
    total_tax: float = Field(0.0, description="Total GST amount reported in GSTR-2B")


class ReconcileRequest(BaseModel):
    """Payload sent by the frontend when triggering the reconciliation run."""
    user_id: str = Field(..., description="Supabase User UUID")
    gstr2b_records: List[GSTR2BRecord] = Field(..., description="List of GSTR-2B invoice records")


class MatchDetail(BaseModel):
    """Result status for each processed purchase invoice in Supabase."""
    invoice_id: str
    invoice_no: str
    supplier_gstin: str
    reconciliation_status: str  # 'exact_match', 'fuzzy_match', 'tax_mismatch', 'unmatched'
    confidence_score: int       # 0 to 100
    ai_match_reason: str
    # New: the matched GSTR-2B filing's own values, so the frontend can
    # display them without needing to keep the uploaded GSTR-2B file in
    # memory. None when there's no matched filing (unmatched, including
    # the duplicate-claim case).
    gstr2b_taxable_value: Optional[float] = None
    gstr2b_total_tax: Optional[float] = None


class ReconcileResponse(BaseModel):
    """Summary metrics returned to the frontend dashboard after reconciliation completes."""
    total_db_invoices: int
    total_gstr2b_records: int
    exact_matches: int
    fuzzy_matches: int
    tax_mismatches: int
    unmatched: int
    updated_records: List[MatchDetail]
    # Real measured wall-clock time for the matching loop only — excludes
    # the Supabase fetch/write calls in the route handler, since those are
    # network I/O, not the algorithm's own throughput.
    processing_time_seconds: float

class LLMDiscrepancyAnalysis(BaseModel):
    summary: str
    root_cause: str
    suggested_action: str