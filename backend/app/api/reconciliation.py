#Endpoints for GSTR-2B upload & matching

from fastapi import APIRouter, HTTPException, status
from app.schemas.reconciliation import ReconcileRequest, ReconcileResponse
from app.services.reconciliation_engine import reconcile_invoices
from app.services.supabase_service import (
    fetch_user_invoices,
    update_reconciliation_results,
    supabase
)
from app.services.llm_reconciler import analyze_discrepancy_with_llm, LLMDiscrepancyAnalysis


router = APIRouter()


@router.post("/run", response_model=ReconcileResponse)
async def run_reconciliation(payload: ReconcileRequest):
    """
    Triggers 4-tier reconciliation comparing Supabase purchase records 
    against GSTR-2B entries, then updates Supabase with statuses and confidence scores.
    """
    db_invoices = fetch_user_invoices(payload.user_id)
    if not db_invoices:
        raise HTTPException( 
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No purchase invoices found in database for this user."
        )

    result = reconcile_invoices(db_invoices, payload.gstr2b_records)

    match_updates = [record.model_dump() for record in result.updated_records]
    update_reconciliation_results(match_updates)

    return result


# app/api/reconciliation.py

@router.post("/explain-discrepancy", response_model=LLMDiscrepancyAnalysis)
def explain_discrepancy(
    invoice_id: str,
    invoice_detail: dict,
    gstr2b_match: dict | None = None
):
    analysis = analyze_discrepancy_with_llm(invoice_detail, gstr2b_match)

    combined_explanation = (
        f"SUMMARY: {analysis.summary}\n\n"
        f"ROOT CAUSE: {analysis.root_cause}\n\n"
        f"SUGGESTED ACTION: {analysis.suggested_action}"
    )

    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not configured.",
        )

    # Deliberately a narrow update — only the 3 fields this endpoint owns.
    # Do NOT route this through update_reconciliation_results(), which
    # always writes gstr2b_taxable_value/gstr2b_total_tax (as None when
    # absent from the payload) and would silently wipe the values already
    # stored there from the bulk reconciliation run.
    supabase.table("Invoices").update({
        "reconciliation_status": "tax_mismatch_explained",
        "ai_match_reason": combined_explanation,
        "confidence_score": 100.0,
    }).eq("id", invoice_id).execute()

    return analysis
# @router.post("/explain-discrepancy", response_model=LLMDiscrepancyAnalysis)
# def explain_discrepancy(
#     invoice_id: str,
#     invoice_detail: dict,
#     gstr2b_match: dict | None = None
# ):
#     analysis = analyze_discrepancy_with_llm(invoice_detail, gstr2b_match)

#     # Format the AI output into a single text block for `ai_match_reason`
#     combined_explanation = (
#         f"SUMMARY: {analysis.summary}\n\n"
#         f"ROOT CAUSE: {analysis.root_cause}\n\n"
#         f"SUGGESTED ACTION: {analysis.suggested_action}"
#     )

#     db_payload = [{
#         "invoice_id": invoice_id,
#         "reconciliation_status": "tax_mismatch_explained",
#         "ai_match_reason": combined_explanation,
#         "confidence_score": 100.0
#     }]
    
#     update_reconciliation_results(db_payload)

#     return analysis