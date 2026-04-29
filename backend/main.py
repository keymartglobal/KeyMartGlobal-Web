"""
KeyMart Global — Main FastAPI Application
==========================================
Entry point for the backend. Registers all routes, middleware, and starts the scheduler.
"""

import os
import logging
import threading
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional, Literal

from services.sheets_service import SheetsService
from services.whatsapp_service import WhatsAppService
from services.comparison_engine import ComparisonEngine
from scheduler import start_scheduler

# ── Load Environment Variables ──────────────────────────────────────────────
load_dotenv()

# ── Logging Configuration ────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("keymart.main")

# ── FastAPI App Instance ─────────────────────────────────────────────────────
app = FastAPI(
    title="KeyMart Global API",
    description="Adobe Premium Seller — Customer Migration Automation System",
    version="2.0.0",
)

# ── CORS Middleware ─────────────────────────────────────────────────────────
# FRONTEND_URL env var is set in Render dashboard to your Vercel URL.
# Falls back to wildcard for local development.
_frontend_url = os.getenv("FRONTEND_URL", "")
_allow_origins = (
    [_frontend_url, "http://localhost:5173", "http://localhost:3000"]
    if _frontend_url
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Service Instances ────────────────────────────────────────────────────────
sheets = SheetsService()
whatsapp = WhatsAppService()
engine = ComparisonEngine(sheets)


# ── Pydantic Models ──────────────────────────────────────────────────────────

class RegistrationData(BaseModel):
    """Model for customer registration from Sheet 1."""
    name: str
    phone: str
    gmail: str
    duration: str  # e.g., "1 Month", "3 Months", "1 Year"


class UpdatePhoneRequest(BaseModel):
    """Model for updating a customer's phone number."""
    gmail: str
    phone: str


class SendMessageRequest(BaseModel):
    """Model for sending WhatsApp messages to an organization's users."""
    organization: str
    message: str


class TestMessageRequest(BaseModel):
    """Model for test WhatsApp message."""
    phone: str
    message: str


# ── Startup / Shutdown Events ────────────────────────────────────────────────

@app.on_event("startup")
async def on_startup():
    """Initialize services and start background scheduler on app boot."""
    logger.info("KeyMart Global backend starting up...")
    start_scheduler(sheets, engine)
    logger.info("Scheduler started. System is live.")


# ══════════════════════════════════════════════════════════════════════════════
#  REGISTRATION ENDPOINTS (Sheet 1)
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/register", tags=["Registration"])
async def register_customer(data: RegistrationData, background_tasks: BackgroundTasks):
    """
    Register a new customer into Sheet 1 (Customer Master).
    Prevents duplicate entries by checking Gmail.
    Sends a WhatsApp notification to the admin on new registration.
    """
    logger.info(f"Registration request for: {data.gmail}")
    try:
        # Check for duplicates
        existing = sheets.get_customer_by_gmail(data.gmail)
        if existing:
            raise HTTPException(status_code=409, detail="A customer with this Gmail is already registered.")

        # Append to Sheet 1
        sheets.add_customer(data.dict())

        # Send admin notification in background (non-blocking)
        background_tasks.add_task(
            whatsapp.send_registration_alert,
            name=data.name,
            phone=data.phone,
            gmail=data.gmail,
            duration=data.duration,
        )

        logger.info(f"Customer registered successfully: {data.gmail}")
        return {"success": True, "message": "Customer registered successfully."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/customers", tags=["Registration"])
def get_all_customers():
    """Fetch all customers from Sheet 1."""
    try:
        customers = sheets.get_all_customers()
        return {"success": True, "data": customers, "count": len(customers)}
    except Exception as e:
        logger.error(f"Failed to fetch customers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/customers/phone", tags=["Registration"])
def update_phone(data: UpdatePhoneRequest):
    """Update or insert a customer's phone number."""
    try:
        sheets.update_customer_phone(data.gmail, data.phone)
        return {"success": True, "message": "Phone number updated successfully."}
    except Exception as e:
        logger.error(f"Failed to update phone: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/status", tags=["Registration"])
def search_customer(gmail: str):
    """Search for a customer by Gmail across Sheet 1 and Sheet 2."""
    try:
        customer = sheets.get_customer_by_gmail(gmail)
        adobe_data = sheets.get_adobe_data_by_gmail(gmail)
        if not customer and not adobe_data:
            raise HTTPException(status_code=404, detail="No customer found with this Gmail.")
        return {"success": True, "customer": customer, "adobe_data": adobe_data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  ADMIN UPLOAD ENDPOINTS (Sheet 2)
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/admin/upload", tags=["Admin"])
async def upload_adobe_data(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """
    Admin endpoint: Upload a CSV/Excel file to replace Sheet 2 (Adobe Data).
    After upload, triggers the comparison engine to detect org changes.
    """
    logger.info(f"Admin upload received: {file.filename}")
    try:
        # Validate file type
        if not file.filename.endswith((".csv", ".xlsx", ".xls")):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload CSV or Excel.")

        content = await file.read()

        # Parse and normalize the uploaded data
        parsed_data = sheets.parse_upload(content, file.filename)
        if not parsed_data:
            raise HTTPException(status_code=400, detail="File is empty or invalid format.")

        # Save previous Sheet 2 snapshot before replacing
        previous_data = sheets.get_all_adobe_data()

        # Replace Sheet 2 with new data
        sheets.replace_adobe_data(parsed_data)

        # Trigger comparison engine in background
        if background_tasks:
            background_tasks.add_task(engine.detect_and_log_changes, previous_data, parsed_data)

        logger.info(f"Adobe data updated with {len(parsed_data)} records.")
        return {
            "success": True,
            "message": f"Adobe data updated with {len(parsed_data)} records.",
            "count": len(parsed_data),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/adobe-data", tags=["Admin"])
def get_adobe_data():
    """Fetch all records from Sheet 2 (Adobe Data)."""
    try:
        data = sheets.get_all_adobe_data()
        return {"success": True, "data": data, "count": len(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/organizations", tags=["Admin"])
def get_organizations():
    """Get unique list of organizations from Sheet 2."""
    try:
        orgs = sheets.get_unique_organizations()
        return {"success": True, "organizations": orgs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/all-users", tags=["Admin"])
def get_all_merged_users():
    """Get all unique users merged from Sheet 2 and their phones from Sheet 1."""
    try:
        adobe_users = sheets.get_all_adobe_data()
        customers = sheets.get_all_customers()
        
        gmail_to_phone = {c["Gmail"].strip().lower(): c["Phone"] for c in customers if c.get("Gmail") and c.get("Phone")}
        
        unique_users = {}
        for user in adobe_users:
            gmail = user.get("Email", "").strip()
            if not gmail:
                continue
            gmail_lower = gmail.lower()
            if gmail_lower not in unique_users:
                unique_users[gmail_lower] = {
                    "gmail": gmail,
                    "phone": gmail_to_phone.get(gmail_lower, "Not found"),
                    "organization": user.get("Organization", "N/A"),
                    "duration_days": user.get("Days Left", "N/A"),
                }
        
        return {"success": True, "users": list(unique_users.values()), "count": len(unique_users)}
    except Exception as e:
        logger.error(f"Failed to fetch all users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  ORG CHANGES ENDPOINTS (Sheet 3)
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/org-changes", tags=["Changes"])
def get_org_changes():
    """Fetch all logged organization changes from Sheet 3."""
    try:
        changes = sheets.get_all_org_changes()
        return {"success": True, "data": changes, "count": len(changes)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/compare", tags=["Changes"])
async def trigger_comparison(background_tasks: BackgroundTasks):
    """Manually trigger the comparison engine to detect org changes."""
    try:
        background_tasks.add_task(engine.run_full_comparison)
        return {"success": True, "message": "Comparison engine triggered. Check Sheet 3 for results."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  WHATSAPP MESSAGING ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

def _bg_send_manual_messages(recipients: list, raw_message: str, org: str):
    from core.config import automation_config
    from core.engine_controller import get_engine
    from utils.template_engine import render

    try:
        engine = get_engine(automation_config.active_engine)
    except Exception as e:
        logger.error(f"Failed to init engine [{automation_config.active_engine}]: {e}")
        return

    logger.info(f"[{automation_config.active_engine}] Starting manual bulk send to {len(recipients)} users in '{org}'")

    for r in recipients:
        phone = r["phone"]
        gmail = r["gmail"]
        
        # Render the template in case {gmail} etc. is used
        message = render(raw_message, gmail=gmail)

        try:
            engine.send_message(phone, message)
            automation_config.log(phone, gmail, automation_config.active_engine, "success")
            logger.info(f"[{automation_config.active_engine}] ✅ Sent to {gmail} ({phone})")
        except Exception as e:
            automation_config.log(phone, gmail, automation_config.active_engine, "failed", str(e))
            logger.error(f"[{automation_config.active_engine}] ❌ Failed to send to {gmail}: {e}")

    logger.info(f"[{automation_config.active_engine}] Bulk send for '{org}' complete.")


@app.post("/api/messages/send", tags=["Messaging"])
async def send_whatsapp_to_org(req: SendMessageRequest, background_tasks: BackgroundTasks):
    """
    Send a WhatsApp message to all users in a specific organization.
    Maps Gmail → Phone from Sheet 1 before sending.
    """
    logger.info(f"Send message request for org: {req.organization}")
    try:
        # Get users from Sheet 2 belonging to this org
        adobe_users = sheets.get_users_by_organization(req.organization)
        if not adobe_users:
            raise HTTPException(status_code=404, detail=f"No users found in organization: {req.organization}")

        # Map Gmail → Phone from Sheet 1
        customers = sheets.get_all_customers()
        gmail_to_phone = {c["Gmail"]: c["Phone"] for c in customers if c.get("Gmail") and c.get("Phone")}

        # Build recipient list
        recipients = []
        for user in adobe_users:
            gmail = user.get("Email", "")
            phone = gmail_to_phone.get(gmail)
            if phone:
                recipients.append({"gmail": gmail, "phone": phone})

        if not recipients:
            raise HTTPException(status_code=404, detail="No matching phone numbers found for users in this organization.")

        # Send messages in background using the globally configured active engine
        background_tasks.add_task(
            _bg_send_manual_messages,
            recipients=recipients,
            raw_message=req.message,
            org=req.organization,
        )

        return {
            "success": True,
            "message": f"Messages queued for {len(recipients)} recipients in '{req.organization}'.",
            "recipient_count": len(recipients),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Messaging failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/messages/users/{organization}", tags=["Messaging"])
def get_users_for_messaging(organization: str):
    """Preview users and their phone numbers for a given organization."""
    try:
        adobe_users = sheets.get_users_by_organization(organization)
        customers = sheets.get_all_customers()
        gmail_to_phone = {c["Gmail"]: c["Phone"] for c in customers if c.get("Gmail") and c.get("Phone")}

        result = []
        for user in adobe_users:
            gmail = user.get("Email", "")
            result.append({
                "gmail": gmail,
                "phone": gmail_to_phone.get(gmail, "Not found"),
                "organization": user.get("Organization", ""),
            })
        return {"success": True, "users": result, "count": len(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  DASHBOARD & TEST ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/dashboard/stats", tags=["Dashboard"])
def get_dashboard_stats():
    """Get summary statistics for the admin dashboard."""
    try:
        customers = sheets.get_all_customers()
        adobe_data = sheets.get_all_adobe_data()
        org_changes = sheets.get_all_org_changes()
        orgs = sheets.get_unique_organizations()

        return {
            "success": True,
            "stats": {
                "total_customers": len(customers),
                "total_adobe_records": len(adobe_data),
                "total_org_changes": len(org_changes),
                "total_organizations": len(orgs),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/test/whatsapp", tags=["Test"])
async def test_whatsapp(req: TestMessageRequest):
    """Test endpoint to verify WhatsApp API connectivity."""
    try:
        result = whatsapp.send_text_message(req.phone, req.message)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health", tags=["Test"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "KeyMart Global API", "version": "2.0.0"}


# ══════════════════════════════════════════════════════════════════════════════
#  WHATSAPP AUTOMATION ENGINE CONTROL
# ══════════════════════════════════════════════════════════════════════════════

from core.config import automation_config
from core.engine_controller import get_engine
from services.processor import run_automation
from utils.template_engine import DEFAULT_TEMPLATE


class EngineRequest(BaseModel):
    mode: Literal["META_API", "SELENIUM"]


class AutomationRequest(BaseModel):
    template: Optional[str] = None


class SettingsRequest(BaseModel):
    active_engine: Literal["META_API", "SELENIUM"]
    messaging_mode: Literal["FILE_TRIGGER", "MANUAL"]
    manual_template: Optional[str] = None
    file_trigger_template: Optional[str] = None


@app.get("/api/automation/settings", tags=["Automation"])
def get_settings():
    """Return current engine + messaging settings."""
    return {"success": True, **automation_config.get_settings()}


@app.post("/api/automation/settings", tags=["Automation"])
def save_settings(req: SettingsRequest):
    """Persist engine mode, messaging mode, and templates."""
    if automation_config.is_running:
        raise HTTPException(status_code=409, detail="Cannot change settings while automation is running.")
    automation_config.active_engine   = req.active_engine
    automation_config.messaging_mode  = req.messaging_mode
    if req.manual_template:
        automation_config.manual_template = req.manual_template
    if req.file_trigger_template:
        automation_config.file_trigger_template = req.file_trigger_template
    logger.info(f"Settings saved: engine={req.active_engine}, mode={req.messaging_mode}")
    return {"success": True, "settings": automation_config.get_settings()}


@app.post("/api/automation/set-engine", tags=["Automation"])
def set_engine(req: EngineRequest):
    """Select the active messaging engine (META_API or SELENIUM)."""
    if automation_config.is_running:
        raise HTTPException(status_code=409, detail="Cannot switch engine while automation is running. Stop it first.")
    automation_config.active_engine = req.mode
    logger.info(f"Engine switched to: {req.mode}")
    return {"success": True, "active_engine": req.mode}


@app.post("/api/automation/start", tags=["Automation"])
def start_automation(req: AutomationRequest):
    """Start the WhatsApp automation using the selected engine."""
    if automation_config.is_running:
        raise HTTPException(status_code=409, detail="Automation is already running.")

    automation_config.is_running = True
    automation_config.reset_stats()

    # Pick template: explicit override > config manual_template > hardcoded default
    template = req.template or automation_config.manual_template or DEFAULT_TEMPLATE

    t = threading.Thread(
        target=run_automation,
        args=(sheets, template),
        daemon=True,
        name="wa-automation",
    )
    t.start()
    logger.info(f"Automation started with engine: {automation_config.active_engine}")
    return {"success": True, "message": "Automation started.", "engine": automation_config.active_engine}


@app.post("/api/automation/stop", tags=["Automation"])
def stop_automation():
    """Signal the running automation to stop gracefully."""
    if not automation_config.is_running:
        return {"success": True, "message": "Automation was not running."}
    automation_config.is_running = False
    logger.info("Automation stop signal sent.")
    return {"success": True, "message": "Stop signal sent. Automation will halt after the current message."}


@app.get("/api/automation/status", tags=["Automation"])
def get_automation_status():
    """Get the current automation status and message log."""
    return {
        "success": True,
        **automation_config.get_status(),
        "logs": automation_config.logs[-100:],   # last 100 entries
    }
