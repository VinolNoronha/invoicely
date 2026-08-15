from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import invoices

app = FastAPI(title="Invoicely Extraction Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register invoice router
app.include_router(invoices.router, prefix="/api/v1/invoices", tags=["Invoices"])

@app.get("/health")
def health_check():
    return {"status": "ok"}