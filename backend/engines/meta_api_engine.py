"""
meta_api_engine.py — Meta WhatsApp Business API engine.
Wraps the existing Meta API implementation without modifying it.
"""
import os
import requests
from core.engine_controller import WhatsAppEngine


class MetaAPIEngine(WhatsAppEngine):
    """Sends messages via the official Meta WhatsApp Business API."""

    def __init__(self):
        self.token    = os.getenv("META_API_TOKEN", "")
        self.phone_id = os.getenv("META_PHONE_ID", "")
        self.api_url  = f"https://graph.facebook.com/v19.0/{self.phone_id}/messages"

    def get_name(self) -> str:
        return "META_API"

    def send_message(self, phone: str, message: str) -> dict:
        if not self.token or not self.phone_id:
            raise RuntimeError("META_API_TOKEN or META_PHONE_ID not configured.")

        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "text",
            "text": {"body": message},
        }
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        resp = requests.post(self.api_url, json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        return resp.json()
