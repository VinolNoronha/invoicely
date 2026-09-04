from typing import List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, ConfigDict, Field, model_validator


class SellerInfo(BaseModel):
    name: Optional[str] = "Unknown Vendor"
    gstin: Optional[str] = None


class CustomerInfo(BaseModel):
    name: Optional[str] = "Customer / Buyer"
    email: Optional[str] = None
    gstin: Optional[str] = None


class Financials(BaseModel):
    taxable_amount: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    total_gst: float = 0.0
    total_amount: float = 0.0

    @model_validator(mode="after")
    def reconcile_tax_totals(self) -> "Financials":
        # 1. Deduce total tax if missing or 0
        calculated_tax = round(self.cgst + self.sgst + self.igst, 2)
        if self.total_gst == 0.0 and calculated_tax > 0.0:
            self.total_gst = calculated_tax

        # 2. Reconcile total amount against taxable_amount + total_gst
        expected_total = round(self.taxable_amount + self.total_gst, 2)

        # Fill total_amount if zero/missing
        if self.total_amount == 0.0 and expected_total > 0.0:
            self.total_amount = expected_total

        # 3. If total_amount exists but total_gst was 0, back-calculate total_gst
        elif self.total_gst == 0.0 and self.total_amount > self.taxable_amount:
            self.total_gst = round(self.total_amount - self.taxable_amount, 2)

        return self


class LineItem(BaseModel):
    # Upgraded to Pydantic v2 ConfigDict
    model_config = ConfigDict(populate_by_name=True)

    sr_no: Optional[int] = None
    commodity: str = Field(default="Item", alias="description")
    hsn_code: Optional[str] = Field(default=None, alias="hsn_sac")
    quantity: float = 1.0
    unit: Optional[str] = None
    rate: float = Field(default=0.0, alias="unit_price")
    amount: float = 0.0


class InvoiceData(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    irn: Optional[str] = None
    payment_status: str = "Pending"
    seller: SellerInfo
    customer: CustomerInfo
    financials: Financials
    line_items: List[LineItem] = Field(default_factory=list)


class ExtractionResponse(BaseModel):
    success: bool = True
    invoice_id: UUID = Field(default_factory=uuid4)
    pdf_url: str = ""
    invoice_type: str = "purchase"
    data: InvoiceData

class InvoiceFormFields(BaseModel):
    """Flat shape matching the Invoices table columns 1:1 — used only to
    pre-fill the frontend review/edit modal. Not stored anywhere itself."""
    client_name: str
    email: Optional[str] = None
    dated: Optional[str] = None
    total_amount: float
    total_taxable_amt: float
    invoice_no: str
    cgst: float
    sgst: float
    igst: float
    total_tax: float  # Replaced op_gst
    status: bool = False
    irn: bool = False
    supplier_gstin: Optional[str] = None
    buyer_gstin: Optional[str] = None
    invoice_type: str

class ExtractionPreviewResponse(BaseModel):
    pdf_url: str
    invoice_type: str
    form: InvoiceFormFields   # <-- what the frontend modal binds to
    raw: ExtractionResponse   # <-- full nested detail, exactly as before — this is what gets stored as raw_json on confirm