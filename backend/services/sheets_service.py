"""
KeyMart Global — Google Sheets Service
========================================
All interactions with the 3 Google Sheets are abstracted here.
Credentials are loaded entirely from ENV variables — no JSON file needed.

Sheet 1: Customer Master   → Name, Phone, Gmail, Duration
Sheet 2: Adobe Data        → Gmail, Organization
Sheet 3: Org Changes       → From Organization, To Organization
"""

import os
import io
import logging
import pandas as pd
from typing import Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("keymart.sheets")

# ── Constants ────────────────────────────────────────────────────────────────
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SHEET1_NAME = "Customer Master"
SHEET2_NAME = "Adobe Data"
SHEET3_NAME = "Org Changes"

# Sheet headers — strictly defined per spec
SHEET1_HEADERS = ["Name", "Phone", "Gmail", "Duration", "Timestamp"]
SHEET2_HEADERS = ["Email", "Organization", "Products", "Duration (months)", "Days Left", "Refundable", "Status"]
SHEET3_HEADERS = ["Gmail", "From Organization", "To Organization", "Detected At"]


class SheetsService:
    """Handles all Google Sheets read/write operations for KeyMart Global."""

    def __init__(self):
        """
        Initialize the Google Sheets API client using credentials
        loaded entirely from environment variables.
        No JSON file required.
        """
        self.sheet_id = os.getenv("GOOGLE_SHEET_ID", "")

        if not self.sheet_id:
            logger.warning("GOOGLE_SHEET_ID not set in .env — sheets operations will fail.")

        try:
            # Build service account info dict from individual ENV variables
            service_account_info = {
                "type":                        os.getenv("GOOGLE_TYPE", "service_account"),
                "project_id":                  os.getenv("GOOGLE_PROJECT_ID", ""),
                "private_key_id":              os.getenv("GOOGLE_PRIVATE_KEY_ID", ""),
                # Replace literal \n sequences with real newlines (dotenv stores them escaped)
                "private_key":                 os.getenv("GOOGLE_PRIVATE_KEY", "").replace("\\n", "\n"),
                "client_email":                os.getenv("GOOGLE_CLIENT_EMAIL", ""),
                "client_id":                   os.getenv("GOOGLE_CLIENT_ID", ""),
                "auth_uri":                    "https://accounts.google.com/o/oauth2/auth",
                "token_uri":                   os.getenv("GOOGLE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url":        f"https://www.googleapis.com/robot/v1/metadata/x509/{os.getenv('GOOGLE_CLIENT_EMAIL', '')}",
            }

            creds = service_account.Credentials.from_service_account_info(
                service_account_info, scopes=SCOPES
            )
            self.service = build("sheets", "v4", credentials=creds)
            self.sheet = self.service.spreadsheets()
            logger.info("Google Sheets service initialized from ENV variables.")
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets service: {e}")
            self.service = None
            self.sheet = None

    def _read_sheet(self, sheet_name: str, include_header: bool = True) -> list[dict]:
        """
        Generic method to read all rows from a named sheet tab.
        Returns a list of dicts using the first row as column keys.
        """
        if not self.sheet:
            return []
        try:
            result = self.sheet.values().get(
                spreadsheetId=self.sheet_id,
                range=sheet_name,
            ).execute()
            rows = result.get("values", [])
            if not rows or len(rows) < 1:
                return []
            headers = rows[0]
            return [dict(zip(headers, row + [""] * (len(headers) - len(row)))) for row in rows[1:]]
        except Exception as e:
            logger.error(f"Error reading sheet '{sheet_name}': {e}")
            return []

    def _append_row(self, sheet_name: str, values: list):
        """Append a single row to the specified sheet."""
        if not self.sheet:
            return
        try:
            self.sheet.values().append(
                spreadsheetId=self.sheet_id,
                range=f"{sheet_name}!A1",
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body={"values": [values]},
            ).execute()
        except Exception as e:
            logger.error(f"Error appending to sheet '{sheet_name}': {e}")

    def _clear_and_write(self, sheet_name: str, headers: list, rows: list[list]):
        """Clear all content in a sheet and rewrite from scratch with headers."""
        if not self.sheet:
            return
        try:
            # Clear existing content
            self.sheet.values().clear(
                spreadsheetId=self.sheet_id,
                range=sheet_name,
            ).execute()
            # Write headers + data
            all_values = [headers] + rows
            self.sheet.values().update(
                spreadsheetId=self.sheet_id,
                range=f"{sheet_name}!A1",
                valueInputOption="USER_ENTERED",
                body={"values": all_values},
            ).execute()
            logger.info(f"Sheet '{sheet_name}' cleared and rewritten with {len(rows)} data rows.")
        except Exception as e:
            logger.error(f"Error rewriting sheet '{sheet_name}': {e}")

    def initialize_sheets(self):
        """
        Initialize all 3 sheets with proper headers if they're blank.
        Called once on first setup.
        """
        logger.info("Initializing sheet headers...")
        for name, headers in [
            (SHEET1_NAME, SHEET1_HEADERS),
            (SHEET2_NAME, SHEET2_HEADERS),
            (SHEET3_NAME, SHEET3_HEADERS),
        ]:
            existing = self._read_sheet(name, include_header=True)
            if not existing:
                self._clear_and_write(name, headers, [])
                logger.info(f"Initialized headers for '{name}'.")

    # ── Sheet 1: Customer Master ─────────────────────────────────────────────

    def get_all_customers(self) -> list[dict]:
        """Return all customers from Sheet 1."""
        return self._read_sheet(SHEET1_NAME)

    def get_customer_by_gmail(self, gmail: str) -> Optional[dict]:
        """Find a customer by Gmail (case-insensitive)."""
        customers = self.get_all_customers()
        gmail_lower = gmail.strip().lower()
        for c in customers:
            if c.get("Gmail", "").strip().lower() == gmail_lower:
                return c
        return None

    def add_customer(self, data: dict):
        """
        Add a new customer to Sheet 1.
        data must contain: name, phone, gmail, duration
        """
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self._append_row(SHEET1_NAME, [
            data.get("name", ""),
            data.get("phone", ""),
            data.get("gmail", ""),
            data.get("duration", ""),
            timestamp,
        logger.info(f"Customer added to Sheet 1: {data.get('gmail')}")

    def update_customer_phone(self, gmail: str, phone: str):
        """Update or insert a customer's phone number in Sheet 1."""
        if not self.sheet:
            return
            
        gmail_lower = gmail.strip().lower()
        try:
            result = self.sheet.values().get(
                spreadsheetId=self.sheet_id,
                range=SHEET1_NAME,
            ).execute()
            rows = result.get("values", [])
            
            if not rows:
                return
                
            headers = rows[0]
            try:
                gmail_idx = headers.index("Gmail")
                phone_idx = headers.index("Phone")
            except ValueError:
                return
                
            for i, row in enumerate(rows[1:], start=2):
                padded_row = row + [""] * (len(headers) - len(row))
                if padded_row[gmail_idx].strip().lower() == gmail_lower:
                    padded_row[phone_idx] = phone
                    # Convert to character for column range (A to E)
                    self.sheet.values().update(
                        spreadsheetId=self.sheet_id,
                        range=f"{SHEET1_NAME}!A{i}:E{i}",
                        valueInputOption="USER_ENTERED",
                        body={"values": [padded_row[:5]]}
                    ).execute()
                    logger.info(f"Updated phone for {gmail} in Sheet 1")
                    return
            
            # If not found, append a new row
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            new_row = ["", phone, gmail, "", timestamp]
            self._append_row(SHEET1_NAME, new_row)
            logger.info(f"Appended new user {gmail} to Sheet 1 with phone {phone}")
        except Exception as e:
            logger.error(f"Failed to update customer phone: {e}")

    # ── Sheet 2: Adobe Data ──────────────────────────────────────────────────

    def get_all_adobe_data(self) -> list[dict]:
        """Return all records from Sheet 2."""
        return self._read_sheet(SHEET2_NAME)

    def get_adobe_data_by_gmail(self, gmail: str) -> Optional[dict]:
        """Find an Adobe record by Gmail."""
        records = self.get_all_adobe_data()
        gmail_lower = gmail.strip().lower()
        for r in records:
            if r.get("Email", "").strip().lower() == gmail_lower:
                return r
        return None

    def get_unique_organizations(self) -> list[str]:
        """Return a deduplicated list of organizations from Sheet 2."""
        records = self.get_all_adobe_data()
        orgs = sorted(set(r.get("Organization", "").strip() for r in records if r.get("Organization")))
        return orgs

    def get_users_by_organization(self, organization: str) -> list[dict]:
        """Return all users belonging to a specific organization (Sheet 2)."""
        records = self.get_all_adobe_data()
        return [r for r in records if r.get("Organization", "").strip().lower() == organization.strip().lower()]

    def replace_adobe_data(self, parsed_data: list[dict]):
        """
        Replace all of Sheet 2 with fresh normalized data.
        Called after admin uploads a CSV/Excel file.
        """
        if not parsed_data:
            self._clear_and_write(SHEET2_NAME, SHEET2_HEADERS, [])
            return

        rows = [[str(row.get(h, "")) for h in SHEET2_HEADERS] for row in parsed_data]
        self._clear_and_write(SHEET2_NAME, SHEET2_HEADERS, rows)
        logger.info(f"Sheet 2 replaced with {len(rows)} records.")

    def parse_upload(self, content: bytes, filename: str) -> list[dict]:
        """
        Parse uploaded CSV or Excel file into normalized list of dicts.
        Normalizes column names to match Sheet 2 headers (Gmail, Organization).
        """
        try:
            if filename.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(content))
            else:
                df = pd.read_excel(io.BytesIO(content))

            # Normalize column names: strip whitespace
            df.columns = [col.strip() for col in df.columns]

            # Flexible column name mapping
            col_map = {}
            for col in df.columns:
                col_lower = col.lower()
                if "gmail" in col_lower or "email" in col_lower or "mail" in col_lower:
                    col_map[col] = "Email"
                elif "org" in col_lower or "organization" in col_lower or "company" in col_lower:
                    col_map[col] = "Organization"

            df.rename(columns=col_map, inplace=True)

            # Ensure required columns exist
            for required in ["Email", "Organization"]:
                if required not in df.columns:
                    logger.warning(f"Column '{required}' not found in uploaded file.")
                    df[required] = ""

            df.dropna(subset=["Email", "Organization"], how="all", inplace=True)
            df["Email"] = df["Email"].astype(str).str.strip().str.lower()
            df["Organization"] = df["Organization"].astype(str).str.strip()
            df = df[df["Email"] != "nan"]

            df.fillna("", inplace=True)

            return df.to_dict(orient="records")
        except Exception as e:
            logger.error(f"Failed to parse upload: {e}")
            return []

    # ── Sheet 3: Org Changes ─────────────────────────────────────────────────

    def get_all_org_changes(self) -> list[dict]:
        """Return all logged organization changes from Sheet 3."""
        return self._read_sheet(SHEET3_NAME)

    def log_org_change(self, gmail: str, from_org: str, to_org: str):
        """
        Log a unique organization change to Sheet 3.
        Checks for duplicates before writing.
        """
        from datetime import datetime
        existing = self.get_all_org_changes()

        # Deduplication: skip if this exact transition for this Gmail already exists
        for record in existing:
            if (
                record.get("Gmail", "").strip().lower() == gmail.strip().lower()
                and record.get("From Organization", "").strip() == from_org.strip()
                and record.get("To Organization", "").strip() == to_org.strip()
            ):
                logger.debug(f"Duplicate org change skipped: {gmail} {from_org} → {to_org}")
                return

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self._append_row(SHEET3_NAME, [gmail, from_org, to_org, timestamp])
        logger.info(f"Org change logged: {gmail} [{from_org} → {to_org}]")
