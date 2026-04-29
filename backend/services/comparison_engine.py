"""
comparison_engine.py — Detects org changes between Sheet 2 snapshots.
Now: when FILE_TRIGGER mode is active, automatically sends WhatsApp
notifications to affected users via the configured engine.
"""
import logging
from typing import TYPE_CHECKING, List, Dict

if TYPE_CHECKING:
    from services.sheets_service import SheetsService

logger = logging.getLogger("keymart.engine")


class ComparisonEngine:
    """Detects org changes between two snapshots of Sheet 2 and logs them to Sheet 3."""

    def __init__(self, sheets_service: "SheetsService"):
        self.sheets = sheets_service

    # ── Core Comparison ───────────────────────────────────────────────────────

    def detect_and_log_changes(
        self,
        previous_data: List[Dict],
        new_data: List[Dict],
    ) -> List[Dict]:
        """
        Compare previous vs new Sheet 2 data.
        Returns list of change records: {gmail, from_org, to_org}
        Logs each change to Sheet 3 and (if FILE_TRIGGER mode) sends WhatsApp.
        """
        logger.info("Comparison engine started...")

        if not previous_data:
            logger.info("No previous data — skipping comparison (first upload).")
            return []

        old_map = {
            row.get("Email", "").strip().lower(): row.get("Organization", "").strip()
            for row in previous_data if row.get("Email")
        }
        new_map = {
            row.get("Email", "").strip().lower(): row.get("Organization", "").strip()
            for row in new_data if row.get("Email")
        }

        changes: List[Dict] = []

        for gmail, new_org in new_map.items():
            old_org = old_map.get(gmail)
            if old_org and old_org != new_org:
                logger.info(f"Org change: {gmail} [{old_org} → {new_org}]")
                self.sheets.log_org_change(gmail, old_org, new_org)
                changes.append({"gmail": gmail, "from_org": old_org, "to_org": new_org})

        logger.info(f"Comparison complete. {len(changes)} change(s) detected.")

        # ── FILE_TRIGGER: Send WhatsApp notifications ─────────────────────────
        if changes:
            self._notify_changed_users(changes)

        return changes

    def _notify_changed_users(self, changes: List[Dict]):
        """
        For each changed Gmail: look up phone from Sheet 1, render template,
        send message via the configured engine — but ONLY when FILE_TRIGGER
        mode is active.
        """
        from core.config import automation_config
        from core.engine_controller import get_engine
        from utils.template_engine import render

        if automation_config.messaging_mode != "FILE_TRIGGER":
            logger.info("FILE_TRIGGER mode inactive — skipping auto-notifications.")
            return

        logger.info(
            f"FILE_TRIGGER active [{automation_config.active_engine}] — "
            f"sending notifications to {len(changes)} user(s)."
        )

        # Build gmail → phone lookup from Sheet 1
        try:
            customers = self.sheets.get_all_customers()
        except Exception as e:
            logger.error(f"Cannot fetch Sheet 1 for phone lookup: {e}")
            return

        gmail_to_phone = {
            c.get("Gmail", "").strip().lower(): c.get("Phone", "").strip()
            for c in customers if c.get("Gmail") and c.get("Phone")
        }

        try:
            engine = get_engine(automation_config.active_engine)
        except Exception as e:
            logger.error(f"Cannot initialise engine: {e}")
            return

        template = automation_config.file_trigger_template

        for change in changes:
            gmail     = change["gmail"]
            from_org  = change["from_org"]
            to_org    = change["to_org"]
            phone     = gmail_to_phone.get(gmail)

            if not phone:
                logger.warning(f"No phone for {gmail} — skipping notification.")
                automation_config.log(
                    phone or "unknown", gmail,
                    automation_config.active_engine, "failed",
                    "No phone number found in Sheet 1"
                )
                continue

            message = render(template, gmail=gmail, from_org=from_org, to_org=to_org)

            try:
                engine.send_message(phone, message)
                automation_config.log(phone, gmail, automation_config.active_engine, "success")
                logger.info(f"Notified {gmail} ({phone}) ✅")
            except Exception as e:
                automation_config.log(phone, gmail, automation_config.active_engine, "failed", str(e))
                logger.warning(f"Failed to notify {gmail}: {e}")

    def run_full_comparison(self):
        """Manual trigger: validates pipeline without making false changes."""
        logger.info("Manual full comparison triggered.")
        current_data = self.sheets.get_all_adobe_data()
        if not current_data:
            logger.warning("Sheet 2 is empty — nothing to compare.")
            return
        logger.info(f"Full comparison complete. {len(current_data)} records checked.")
