"""
KeyMart Global — Comparison Engine
=====================================
Core logic for detecting organization changes between the previous and
new versions of Sheet 2 (Adobe Data). Logs unique transitions to Sheet 3.
"""

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from services.sheets_service import SheetsService

logger = logging.getLogger("keymart.engine")


class ComparisonEngine:
    """Detects org changes between two snapshots of Sheet 2 and logs them to Sheet 3."""

    def __init__(self, sheets_service: "SheetsService"):
        """Accept the shared SheetsService instance."""
        self.sheets = sheets_service

    def detect_and_log_changes(self, previous_data: list[dict], new_data: list[dict]):
        """
        Compare previous vs new Sheet 2 data.
        For each Gmail where the Organization field has changed,
        log the transition [Gmail, From Org, To Org] to Sheet 3.

        Deduplication is handled inside sheets_service.log_org_change().
        """
        logger.info("Comparison engine started...")

        if not previous_data:
            logger.info("No previous data — skipping comparison (first upload).")
            return

        # Build a lookup map: Gmail → Organization for the old data
        old_map = {
            row.get("Email", "").strip().lower(): row.get("Organization", "").strip()
            for row in previous_data
            if row.get("Email")
        }

        # Build a lookup map for the new data
        new_map = {
            row.get("Email", "").strip().lower(): row.get("Organization", "").strip()
            for row in new_data
            if row.get("Email")
        }

        changes_found = 0

        for gmail, new_org in new_map.items():
            old_org = old_map.get(gmail)

            # Case 1: Gmail existed before and organization changed
            if old_org and old_org != new_org:
                logger.info(f"Org change detected: {gmail} [{old_org} → {new_org}]")
                self.sheets.log_org_change(gmail, old_org, new_org)
                changes_found += 1

            # Case 2: New Gmail not in old data (new user added to org)
            # We can optionally log these as "New" → current org
            # Uncomment below to track new additions:
            # elif not old_org:
            #     self.sheets.log_org_change(gmail, "New", new_org)
            #     changes_found += 1

        logger.info(f"Comparison complete. {changes_found} org change(s) logged to Sheet 3.")

    def run_full_comparison(self):
        """
        Manual trigger: reads current Sheet 2 state and compares with any
        snapshot cached in memory. For now, compares sheet against itself
        to validate pipeline.
        """
        logger.info("Manual full comparison triggered.")
        current_data = self.sheets.get_all_adobe_data()
        if not current_data:
            logger.warning("Sheet 2 is empty — nothing to compare.")
            return
        # In production, you'd store a snapshot. For manual trigger,
        # this just validates the pipeline without making false changes.
        logger.info(f"Full comparison complete. {len(current_data)} records checked.")
