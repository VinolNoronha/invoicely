from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
import uuid

from app.schemas.invoice import (
    CustomerInfo,
    ExtractionResponse,
    ExtractionPreviewResponse,
    Financials,
    InvoiceData,
    LineItem,
    SellerInfo,
    InvoiceFormFields
)
from app.services.anchor_search import extract_metadata
from app.services.pdfparser import parse_pdf_document
from app.services.table_extractor import extract_table_items
from app.services.tax_extractor import extract_tax_details
from app.services.supabase_service import get_user_gstin
from app.utils.normalizers import clean_float, clean_gstin, parse_date_iso

router = APIRouter()

@router.post("/extract", response_model=ExtractionPreviewResponse, status_code=status.HTTP_200_OK)
async def extract_invoice(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files are supported."
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF file is empty."
        )

    # 1. Parse raw PDF layout
    parsed_pdf = parse_pdf_document(file_bytes)

    # 2. Extract metadata & table items
    metadata = extract_metadata(parsed_pdf)
    raw_table_items = extract_table_items(parsed_pdf)

    # 3. Clean and map line items
    formatted_items = []
    for item in raw_table_items:
        desc = item.get("description") or item.get("commodity") or "Item"
        hsn = item.get("hsn_sac") or item.get("hsn_code")
        qty = clean_float(item.get("quantity")) or 1.0
        price = clean_float(item.get("unit_price") or item.get("rate")) or 0.0
        raw_amt = clean_float(item.get("amount"))
        line_amt = raw_amt if raw_amt > 0.0 else round(qty * price, 2)

        formatted_items.append(
            LineItem(
                sr_no=item.get("sr_no"),
                description=desc,
                hsn_sac=hsn,
                quantity=qty,
                unit=item.get("unit"),
                unit_price=price,
                amount=line_amt
            )
        )

    # 4. Extract Tax Details & Financials
    supplier_gstin = clean_gstin(metadata.get("supplier_gstin"))
    buyer_gstin = clean_gstin(metadata.get("buyer_gstin"))
    
    extracted_total = clean_float(metadata.get("total_amount"))
    computed_amount = round(sum(i.amount for i in formatted_items), 2)
    total_amount = extracted_total if extracted_total > 0.0 else computed_amount

    raw_tax = extract_tax_details(
        parsed_pdf,
        supplier_gstin=supplier_gstin,
        buyer_gstin=buyer_gstin,
        total_amount=total_amount
    )

    # 5. Fetch user's registered GSTIN dynamically from Supabase
    user_gstin = get_user_gstin(user_id)

    # 6. Classify directional type & set client metadata
    seller_name = (
        metadata.get("seller_name") 
        or metadata.get("supplier_name") 
        or metadata.get("vendor_name") 
        or "Vendor"
    )
    buyer_name = (
        metadata.get("buyer_name") 
        or metadata.get("customer_name") 
        or metadata.get("billed_to") 
        or "Customer"
    )

    if user_gstin and supplier_gstin and supplier_gstin.upper() == user_gstin.upper():
        invoice_type = "sales"
        counterpart_name = buyer_name
        counterpart_gstin = buyer_gstin
    else:
        invoice_type = "purchase"
        counterpart_name = seller_name
        counterpart_gstin = supplier_gstin

    # 7. Construct response payload
    raw_inv_no = metadata.get("invoice_number")
    inv_number = str(raw_inv_no).strip() if raw_inv_no else f"TEMP-{uuid.uuid4().hex[:8].upper()}"  
    
    response_payload = ExtractionResponse(
        pdf_url=f"/storage/uploads/{file.filename}",
        invoice_type=invoice_type,
        data=InvoiceData(
            invoice_number=inv_number,
            invoice_date=parse_date_iso(metadata.get("invoice_date")),
            due_date=parse_date_iso(metadata.get("due_date")),
            irn=metadata.get("irn"),
            seller=SellerInfo(
                name=seller_name,
                gstin=supplier_gstin
            ),
            customer=CustomerInfo(
                name=buyer_name,
                gstin=buyer_gstin
            ),
            financials=Financials(
                taxable_amount=clean_float(raw_tax.get("taxable_value")),
                cgst=clean_float(raw_tax.get("cgst_amount")),
                sgst=clean_float(raw_tax.get("sgst_amount")),
                igst=clean_float(raw_tax.get("igst_amount")),
                total_gst=clean_float(raw_tax.get("total_tax")),
                total_amount=total_amount
            ),
            line_items=formatted_items
        )
    )

    # NEW: flat companion, purely for the frontend form — same
    # counterpart_name/counterpart_gstin you already compute above.
    form_fields = InvoiceFormFields(
        client_name=counterpart_name,
        dated=parse_date_iso(metadata.get("invoice_date")),
        total_amount=total_amount,
        total_taxable_amt=clean_float(raw_tax.get("taxable_value")),
        invoice_no=inv_number,
        cgst=clean_float(raw_tax.get("cgst_amount")),
        sgst=clean_float(raw_tax.get("sgst_amount")),
        igst=clean_float(raw_tax.get("igst_amount")),
        #op_gst=clean_float(raw_tax.get("total_tax")),
        total_tax=clean_float(raw_tax.get("total_tax")),  # Updated from op_gst
        status=False,
        irn=bool(metadata.get("irn")),
        supplier_gstin=supplier_gstin,
        buyer_gstin=buyer_gstin,
        invoice_type=invoice_type,
    )

    # 8. Insert record directly into Supabase Invoices table
    # db_payload = {
    #     "user_id": user_id,
    #     "client_name": counterpart_name,
    #     #"GSTIN": counterpart_gstin,  # Dual-write to preserve legacy frontend UI
    #     "dated": parse_date_iso(metadata.get("invoice_date")),
    #     "total_amount": total_amount,
    #     "status": False,
    #     "invoice_no": inv_number,
    #     "op_gst": clean_float(raw_tax.get("total_tax")),
    #     "cgst": clean_float(raw_tax.get("cgst_amount")),
    #     "sgst": clean_float(raw_tax.get("sgst_amount")),
    #     "total_taxable_amt": clean_float(raw_tax.get("taxable_value")),
    #     "igst": clean_float(raw_tax.get("igst_amount")),
    #     "irn": bool(metadata.get("irn")),
    #     "supplier_gstin": supplier_gstin,
    #     "buyer_gstin": buyer_gstin,
    #     "invoice_type": invoice_type,
    #     "raw_json": response_payload.model_dump(mode="json"),
    # }
    
    #save_invoice_to_db(db_payload)

    return ExtractionPreviewResponse(
            pdf_url=f"/storage/uploads/{file.filename}",
            invoice_type=invoice_type,
            form=form_fields,
            raw=response_payload,
    )


# from fastapi import APIRouter, File, HTTPException, UploadFile, status

# from app.schemas.invoice import (
#     CustomerInfo,
#     ExtractionResponse,
#     Financials,
#     InvoiceData,
#     LineItem,
#     SellerInfo,
# )
# from app.services.anchor_search import extract_metadata
# from app.services.pdfparser import parse_pdf_document
# from app.services.table_extractor import extract_table_items
# from app.services.tax_extractor import extract_tax_details
# from app.utils.normalizers import clean_float, clean_gstin, parse_date_iso

# router = APIRouter()

# MY_COMPANY_GSTIN = "27AAACB1234A1Z1"


# @router.post("/extract", response_model=ExtractionResponse, status_code=status.HTTP_200_OK)
# async def extract_invoice(file: UploadFile = File(...)):
#     if not file.filename.lower().endswith(".pdf"):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Invalid file format. Only PDF files are supported."
#         )

#     file_bytes = await file.read()
#     if not file_bytes:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="The uploaded PDF file is empty."
#         )

#     # 1. Parse raw PDF layout
#     parsed_pdf = parse_pdf_document(file_bytes)

#     # 2. Extract metadata & table items
#     metadata = extract_metadata(parsed_pdf)
#     raw_table_items = extract_table_items(parsed_pdf)

#     # 3. Clean and map line items
#     formatted_items = []
#     for item in raw_table_items:
#         desc = item.get("description") or item.get("commodity") or "Item"
#         hsn = item.get("hsn_sac") or item.get("hsn_code")
#         qty = clean_float(item.get("quantity")) or 1.0
#         price = clean_float(item.get("unit_price") or item.get("rate")) or 0.0
#         raw_amt = clean_float(item.get("amount"))
#         line_amt = raw_amt if raw_amt > 0.0 else round(qty * price, 2)

#         formatted_items.append(
#             LineItem(
#                 sr_no=item.get("sr_no"),
#                 description=desc,
#                 hsn_sac=hsn,
#                 quantity=qty,
#                 unit=item.get("unit"),
#                 unit_price=price,
#                 amount=line_amt
#             )
#         )

#     # 4. Extract Tax Details & Financials directly via service modules
#     supplier_gstin = clean_gstin(metadata.get("supplier_gstin"))
#     buyer_gstin = clean_gstin(metadata.get("buyer_gstin"))
    
#     extracted_total = clean_float(metadata.get("total_amount"))
#     computed_amount = round(sum(i.amount for i in formatted_items), 2)
#     total_amount = extracted_total if extracted_total > 0.0 else computed_amount

#     raw_tax = extract_tax_details(
#         parsed_pdf,
#         supplier_gstin=supplier_gstin,
#         buyer_gstin=buyer_gstin,
#         total_amount=total_amount
#     )

#     # 5. Classify sales vs purchase
#     invoice_type = "sales" if supplier_gstin == MY_COMPANY_GSTIN else "purchase"

#     # Fix key name mismatches from metadata dict
#     seller_name = (
#         metadata.get("seller_name") 
#         or metadata.get("supplier_name") 
#         or metadata.get("vendor_name") 
#         or "Vendor"
#     )
#     buyer_name = (
#         metadata.get("buyer_name") 
#         or metadata.get("customer_name") 
#         or metadata.get("billed_to") 
#         or "Customer"
#     )

#     return ExtractionResponse(
#         pdf_url=f"/storage/uploads/{file.filename}",
#         invoice_type=invoice_type,
#         data=InvoiceData(
#             invoice_number=metadata.get("invoice_number"),
#             invoice_date=parse_date_iso(metadata.get("invoice_date")),
#             due_date=parse_date_iso(metadata.get("due_date")),
#             irn=metadata.get("irn"),
#             seller=SellerInfo(
#                 name=seller_name,
#                 gstin=supplier_gstin
#             ),
#             customer=CustomerInfo(
#                 name=buyer_name,
#                 gstin=buyer_gstin
#             ),
#             financials=Financials(
#                 taxable_amount=clean_float(raw_tax.get("taxable_value")),
#                 cgst=clean_float(raw_tax.get("cgst_amount")),
#                 sgst=clean_float(raw_tax.get("sgst_amount")),
#                 igst=clean_float(raw_tax.get("igst_amount")),
#                 total_gst=clean_float(raw_tax.get("total_tax")),
#                 total_amount=total_amount
#             ),
#             line_items=formatted_items
#         )
#     )

#     # # 5. Classify sales vs purchase
#     # invoice_type = "sales" if supplier_gstin == MY_COMPANY_GSTIN else "purchase"

#     # return ExtractionResponse(
#     #     pdf_url=f"/storage/uploads/{file.filename}",
#     #     invoice_type=invoice_type,
#     #     data=InvoiceData(
#     #         invoice_number=metadata.get("invoice_number"),
#     #         invoice_date=parse_date_iso(metadata.get("invoice_date")),
#     #         due_date=parse_date_iso(metadata.get("due_date")),
#     #         irn=metadata.get("irn"),
#     #         seller=SellerInfo(
#     #             name=metadata.get("supplier_name") or "Vendor",
#     #             gstin=supplier_gstin
#     #         ),
#     #         customer=CustomerInfo(
#     #             name=metadata.get("buyer_name") or "Buyer",
#     #             gstin=buyer_gstin
#     #         ),
#     #         financials=Financials(
#     #             taxable_amount=clean_float(raw_tax.get("taxable_value")),
#     #             cgst=clean_float(raw_tax.get("cgst_amount")),
#     #             sgst=clean_float(raw_tax.get("sgst_amount")),
#     #             igst=clean_float(raw_tax.get("igst_amount")),
#     #             total_gst=clean_float(raw_tax.get("total_tax")),
#     #             total_amount=total_amount
#     #         ),
#     #         line_items=formatted_items
#     #     )
#     # )