"""
processor.py — Shared data pipeline for the WhatsApp automation.
Reads Sheet 1, groups by phone, renders template, sends via selected engine.
Google Sheet structure is NOT modified.
"""
import logging
from typing import List, Dict
from utils.template_engine import render, DEFAULT_TEMPLATE
from core.config import automation_config
from core.engine_controller import get_engine, WhatsAppEngine

logger = logging.getLogger("keymart.processor")


def _group_by_phone(customers: List[Dict]) -> Dict[str, List[Dict]]:
    """Group customer records by phone number."""
    groups: Dict[str, List[Dict]] = {}
    for row in customers:
        phone = row.get("Phone", "").strip()
        if not phone:
            continue
        groups.setdefault(phone, []).append(row)
    return groups


def run_automation(sheets_service, template: str = DEFAULT_TEMPLATE) -> None:
    """
    Main automation loop — called in a background thread.
    1. Read Sheet 1
    2. Group by phone
    3. For each phone+gmail, render template and send via active engine
    """
    cfg = automation_config
    if not cfg.is_running:
        logger.warning("run_automation called but is_running=False. Aborting.")
        return

    try:
        engine: WhatsAppEngine = get_engine(cfg.active_engine)
    except Exception as e:
        logger.error(
            f"Failed to initialise engine [{cfg.active_engine}]: {e}. "
            "On Render: ensure Chrome is installed via the build command. "
            "Locally: ensure Chrome is installed and not already running."
        )
        cfg.is_running = False
        return

    logger.info(f"[{engine.get_name()}] Automation started.")

    try:
        customers = sheets_service.get_all_customers()
    except Exception as e:
        logger.error(f"Failed to fetch Sheet 1: {e}")
        cfg.is_running = False
        return

    groups = _group_by_phone(customers)
    logger.info(f"[{engine.get_name()}] {len(groups)} phone groups | {len(customers)} total rows.")

    for phone, rows in groups.items():
        if not cfg.is_running:          # Honour stop signal
            logger.info("Stop signal received — halting automation.")
            break

        for row in rows:
            if not cfg.is_running:
                break

            gmail = row.get("Gmail", "").strip()
            if not gmail:
                continue

            message = render(template, gmail=gmail, name=row.get("Name", ""))

            try:
                engine.send_message(phone, message)
                cfg.log(phone, gmail, engine.get_name(), "success")
                logger.info(f"[{engine.get_name()}] ✅ {phone} | {gmail}")
            except Exception as e:
                cfg.log(phone, gmail, engine.get_name(), "failed", str(e))
                logger.warning(f"[{engine.get_name()}] ❌ {phone} | {gmail} — {e}")

    cfg.is_running = False
    logger.info(f"[{engine.get_name()}] Automation complete. ✅ {cfg.success_count} | ❌ {cfg.failed_count}")
