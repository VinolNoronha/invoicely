# app/services/llm_reconciler.py
import os
from google import genai
from google.genai import types
from google.genai import errors as genai_errors
from fastapi import HTTPException, status
from app.schemas.reconciliation import LLMDiscrepancyAnalysis

def analyze_discrepancy_with_llm(invoice_detail: dict, gstr2b_match: dict) -> LLMDiscrepancyAnalysis:
    is_mock_enabled = os.getenv("USE_MOCK_LLM", "false").lower() == "true"

    if is_mock_enabled:
        # ...unchanged mock branch...
        inv_num = invoice_detail.get("invoice_number", "INV-UNKNOWN")
        inv_tax = invoice_detail.get("total_tax", 0)
        gstr_tax = gstr2b_match.get("total_tax", 0) if gstr2b_match else 0
        diff = abs(inv_tax - gstr_tax)

        return LLMDiscrepancyAnalysis(
            summary=f"[MOCK MODE] Discrepancy detected for invoice {inv_num}.",
            root_cause=f"[MOCK MODE] Tax difference of ₹{diff:,.2f} detected between internal records and GSTR-2B.",
            suggested_action="[MOCK MODE] Contact vendor to issue a credit note or amend GSTR-1 in the next filing period."
        )

    client = genai.Client()
    prompt = f"Analyze this GST discrepancy:\nInvoice: {invoice_detail}\nGSTR-2B: {gstr2b_match}"

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=LLMDiscrepancyAnalysis,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
    )

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=config,
        )
        if response.parsed is None:
            raise ValueError("Gemini response did not match expected schema")
        return response.parsed

    except genai_errors.ServerError as e:
        # Google's 503 "high demand" / capacity errors — surface as a real
        # 503 so the frontend's specific rate-limit fallback message fires,
        # instead of a generic unhandled-exception 500.
        print(f"Gemini server error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI analysis temporarily busy. Please retry in a few seconds.",
        )
    except genai_errors.ClientError as e:
        # 429 rate-limit / quota errors from Gemini's side.
        print(f"Gemini client/rate-limit error: {e}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI analysis temporarily busy. Please retry in a few seconds.",
        )