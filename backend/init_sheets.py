"""
KeyMart Global — Sheet Initialization Script
============================================
Run this ONCE to create the 3 tabs and headers in your Google Sheet.
Credentials are loaded from ENV variables — no JSON file needed.
Usage: python init_sheets.py
"""

import os
import sys
import logging
from dotenv import load_dotenv
from google.oauth2 import service_account as sa
from googleapiclient.discovery import build

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("init_sheets")

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "")

SHEETS = {
    "Customer Master": ["Name", "Phone", "Gmail", "Duration", "Timestamp"],
    "Adobe Data":      ["Email", "Organization", "Products", "Duration (months)", "Days Left", "Refundable", "Status"],
    "Org Changes":     ["Gmail", "From Organization", "To Organization", "Detected At"],
}


def init():
    if not SHEET_ID:
        logger.error("GOOGLE_SHEET_ID not set in .env")
        sys.exit(1)

    # Build credentials from ENV variables
    private_key = os.getenv("GOOGLE_PRIVATE_KEY", "").replace("\\n", "\n")
    service_account_info = {
        "type":                        os.getenv("GOOGLE_TYPE", "service_account"),
        "project_id":                  os.getenv("GOOGLE_PROJECT_ID", ""),
        "private_key_id":              os.getenv("GOOGLE_PRIVATE_KEY_ID", ""),
        "private_key":                 private_key,
        "client_email":                os.getenv("GOOGLE_CLIENT_EMAIL", ""),
        "client_id":                   os.getenv("GOOGLE_CLIENT_ID", ""),
        "auth_uri":                    "https://accounts.google.com/o/oauth2/auth",
        "token_uri":                   os.getenv("GOOGLE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url":        f"https://www.googleapis.com/robot/v1/metadata/x509/{os.getenv('GOOGLE_CLIENT_EMAIL', '')}",
    }

    if not service_account_info["client_email"] or not private_key:
        logger.error("GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY not set in .env")
        sys.exit(1)

    creds = sa.Credentials.from_service_account_info(service_account_info, scopes=SCOPES)
    service = build("sheets", "v4", credentials=creds)
    sheet_api = service.spreadsheets()

    # Get existing sheets
    meta = sheet_api.get(spreadsheetId=SHEET_ID).execute()
    existing_tabs = {s["properties"]["title"] for s in meta.get("sheets", [])}

    requests_body = []
    for tab_name, headers in SHEETS.items():
        if tab_name not in existing_tabs:
            # Create the tab
            requests_body.append({
                "addSheet": {"properties": {"title": tab_name}}
            })
            logger.info(f"Will create tab: '{tab_name}'")
        else:
            logger.info(f"Tab already exists: '{tab_name}'")

    if requests_body:
        sheet_api.batchUpdate(spreadsheetId=SHEET_ID, body={"requests": requests_body}).execute()

    # Write headers to each tab
    for tab_name, headers in SHEETS.items():
        # Check if headers already exist
        result = sheet_api.values().get(
            spreadsheetId=SHEET_ID, range=f"{tab_name}!A1:Z1"
        ).execute()
        existing = result.get("values", [])
        if not existing or existing[0] != headers:
            sheet_api.values().update(
                spreadsheetId=SHEET_ID,
                range=f"{tab_name}!A1",
                valueInputOption="USER_ENTERED",
                body={"values": [headers]},
            ).execute()
            logger.info(f"Headers written to '{tab_name}': {headers}")
        else:
            logger.info(f"Headers already correct in '{tab_name}'")

    logger.info("✅ All sheets initialized successfully!")


if __name__ == "__main__":
    init()
