"""
KeyMart Global — WhatsApp Cloud API Service
============================================
Handles all outbound WhatsApp messaging using Meta's WhatsApp Cloud API.
Includes retry logic, rate limiting, and professional message templates.
"""

import os
import time
import logging
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("keymart.whatsapp")

# ── Constants ────────────────────────────────────────────────────────────────
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2  # Initial delay, doubles on each retry (exponential backoff)
RATE_LIMIT_DELAY = 1.2   # Seconds between messages to avoid rate limiting


class WhatsAppService:
    """Handles all WhatsApp Cloud API interactions for KeyMart Global."""

    def __init__(self):
        """Load credentials from environment variables."""
        self.token = os.getenv("WHATSAPP_API_TOKEN", "")
        self.phone_id = os.getenv("WHATSAPP_PHONE_ID", "")
        self.admin_number = os.getenv("ADMIN_WHATSAPP_NUMBER", "")
        self.api_url = f"https://graph.facebook.com/v19.0/{self.phone_id}/messages"

        if not self.token or not self.phone_id:
            logger.warning("WhatsApp credentials not fully configured in .env")

    def _send_request(self, payload: dict, retry_count: int = 0) -> dict:
        """
        Core HTTP request sender with exponential backoff retry logic.
        Retries up to MAX_RETRIES times on failure.
        """
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        try:
            response = requests.post(self.api_url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                return {"success": True, "response": response.json()}
            elif response.status_code == 429:
                # Rate limited — apply exponential backoff
                wait_time = RETRY_DELAY_SECONDS * (2 ** retry_count)
                logger.warning(f"Rate limited by WhatsApp API. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                if retry_count < MAX_RETRIES:
                    return self._send_request(payload, retry_count + 1)
            else:
                logger.error(f"WhatsApp API error {response.status_code}: {response.text}")
                return {"success": False, "error": response.text}
        except requests.exceptions.Timeout:
            logger.error("WhatsApp API request timed out.")
            if retry_count < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS * (2 ** retry_count))
                return self._send_request(payload, retry_count + 1)
        except Exception as e:
            logger.error(f"WhatsApp send failed: {e}")
            return {"success": False, "error": str(e)}

        return {"success": False, "error": "Max retries exceeded."}

    def send_text_message(self, phone: str, message: str) -> dict:
        """
        Send a plain text WhatsApp message to a single phone number.
        Phone format: country code + number (e.g., 94771234567)
        """
        # Normalize phone number
        phone = phone.strip().replace("+", "").replace(" ", "").replace("-", "")

        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "text",
            "text": {"body": message},
        }
        logger.info(f"Sending WhatsApp to {phone[:4]}***")
        result = self._send_request(payload)
        if result.get("success"):
            logger.info(f"WhatsApp delivered to {phone[:4]}***")
        return result

    def send_registration_alert(self, name: str, phone: str, gmail: str, duration: str):
        """
        Send a professional registration alert to the admin/activator.
        Called automatically when a new customer registers.
        """
        if not self.admin_number:
            logger.warning("ADMIN_WHATSAPP_NUMBER not set — skipping registration alert.")
            return

        message = (
            f"🚨 *New Adobe Registration Alert!*\n\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n"
            f"👤 *Name:* {name}\n"
            f"📧 *Gmail:* {gmail}\n"
            f"📱 *Phone:* {phone}\n"
            f"⏳ *Duration:* {duration}\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"⚡ Action Required: Please activate this account in the Adobe Reseller Portal.\n\n"
            f"_— KeyMart Global Automation System_"
        )
        self.send_text_message(self.admin_number, message)
        logger.info(f"Registration alert sent to admin for: {gmail}")

    def send_org_change_notification(self, phone: str, gmail: str, from_org: str, to_org: str):
        """
        Send a WhatsApp notification to a user about their organization change.
        Called by the comparison engine when an org change is detected.
        """
        message = (
            f"🔔 *Adobe Organization Update*\n\n"
            f"Dear Customer,\n\n"
            f"Your Adobe account organization has been updated:\n\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n"
            f"📦 *Previous Org:* {from_org}\n"
            f"✅ *New Org:* {to_org}\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"If you have any questions, please contact us.\n\n"
            f"_— KeyMart Global Team_"
        )
        self.send_text_message(phone, message)

    def send_bulk_messages(self, recipients: list[dict], message: str, organization: str):
        """
        Send a custom WhatsApp message to multiple recipients.
        Respects rate limiting with a delay between each message.
        recipients: list of {gmail: str, phone: str}
        """
        success_count = 0
        fail_count = 0

        logger.info(f"Starting bulk send to {len(recipients)} recipients in org: {organization}")

        for recipient in recipients:
            phone = recipient.get("phone", "")
            gmail = recipient.get("gmail", "")

            if not phone:
                logger.warning(f"No phone for {gmail}, skipping.")
                fail_count += 1
                continue

            result = self.send_text_message(phone, message)
            if result.get("success"):
                success_count += 1
            else:
                fail_count += 1
                logger.error(f"Failed to send to {gmail}: {result.get('error')}")

            # Rate limiting delay between messages
            time.sleep(RATE_LIMIT_DELAY)

        logger.info(
            f"Bulk send complete for '{organization}': "
            f"{success_count} sent, {fail_count} failed."
        )
        return {"success_count": success_count, "fail_count": fail_count}
