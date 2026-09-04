import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import List, Dict, Any

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Initialize Supabase client
supabase: Client | None = (
    create_client(SUPABASE_URL, SUPABASE_KEY)
    if SUPABASE_URL and SUPABASE_KEY
    else None
)

def get_user_gstin(user_id: str) -> str | None:
    """Fetch the registered GSTIN for the authenticated user from Company table."""
    if not supabase:
        return None
    res = supabase.table("Company").select("gstin").eq("id", user_id).execute()
    if res.data and len(res.data) > 0:
        return res.data[0].get("gstin")
    return None

def save_invoice_to_db(payload: dict) -> dict:
    """Persist the extracted invoice record into the Invoices table."""
    if not supabase:
        return {}
    res = supabase.table("Invoices").insert(payload).execute()
    return res.data[0] if res.data else {}

#reconcialiation functions

# def fetch_user_invoices(user_id: str) -> List[Dict[str, Any]]:
#     """Fetch all purchase invoices stored in Supabase for a given user, ordered
#     by creation time so that when two invoices share the same (gstin, invoice_no),
#     the one entered first consistently wins the GSTR-2B match."""
#     if not supabase:
#         return []
#     res = (
#         supabase.table("Invoices")
#         .select("id, invoice_no, supplier_gstin, total_tax, total_amount")
#         .eq("user_id", user_id)
#         .order("created_at")
#         .execute()
#     )
#     return res.data or []

def fetch_user_invoices(user_id: str) -> List[Dict[str, Any]]:
    """Fetch all purchase invoices stored in Supabase for a given user, ordered
    by creation time so that when two invoices share the same (gstin, invoice_no),
    the one entered first consistently wins the GSTR-2B match. Filtered to
    invoice_type = "purchase" only — sales invoices have nothing to do with
    ITC reconciliation against GSTR-2B, which reflects what vendors reported
    selling TO you, not what you sold to your own customers."""
    if not supabase:
        return []
    res = (
        supabase.table("Invoices")
        .select("id, invoice_no, supplier_gstin, total_tax, total_amount")
        .eq("user_id", user_id)
        .eq("invoice_type", "purchase")
        .order("created_at")
        .execute()
    )
    return res.data or []


def update_reconciliation_results(match_details: List[Dict[str, Any]]) -> None:
    """Updates reconciliation fields for each invoice. Only writes the keys
    actually present in each record — a caller that omits a field (e.g. one
    that doesn't compute gstr2b_taxable_value/gstr2b_total_tax) won't
    accidentally null out a value already stored from a previous call."""
    if not supabase or not match_details:
        return

    updatable_fields = {
        "reconciliation_status",
        "confidence_score",
        "ai_match_reason",
        "gstr2b_taxable_value",
        "gstr2b_total_tax",
    }

    for record in match_details:
        payload = {k: record[k] for k in updatable_fields if k in record}
        if not payload:
            continue
        supabase.table("Invoices").update(payload).eq(
            "id", record.get("invoice_id")
        ).execute()

# def update_reconciliation_results(match_details: List[Dict[str, Any]]) -> None:
#     """Updates reconciliation status, confidence score, match reason, and the
#     matched GSTR-2B record's own values for each invoice in Supabase."""
#     if not supabase or not match_details:
#         return
    
#     for record in match_details:
#         supabase.table("Invoices").update({
#             "reconciliation_status": record.get("reconciliation_status"),
#             "confidence_score": record.get("confidence_score"),
#             "ai_match_reason": record.get("ai_match_reason"),
#             "gstr2b_taxable_value": record.get("gstr2b_taxable_value"),
#             "gstr2b_total_tax": record.get("gstr2b_total_tax"),
#         }).eq("id", record.get("invoice_id")).execute()