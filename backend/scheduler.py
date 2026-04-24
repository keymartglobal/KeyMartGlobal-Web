"""
KeyMart Global — Background Scheduler
========================================
Runs periodic background jobs using APScheduler.
Currently schedules the comparison engine to detect org changes periodically.
"""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from services.sheets_service import SheetsService
    from services.comparison_engine import ComparisonEngine

logger = logging.getLogger("keymart.scheduler")

_scheduler = None
_previous_sheet2_snapshot: list[dict] = []


def _periodic_comparison_job(sheets, engine):
    """
    Periodic job that:
    1. Fetches the current Sheet 2 state
    2. Compares it against the previous snapshot stored in memory
    3. Logs any detected org changes to Sheet 3
    4. Updates the in-memory snapshot for the next cycle
    """
    global _previous_sheet2_snapshot
    try:
        current_data = sheets.get_all_adobe_data()
        if _previous_sheet2_snapshot:
            engine.detect_and_log_changes(_previous_sheet2_snapshot, current_data)
        _previous_sheet2_snapshot = current_data
        logger.debug(f"Periodic comparison done. {len(current_data)} records in Sheet 2.")
    except Exception as e:
        logger.error(f"Periodic comparison job failed: {e}")


def start_scheduler(sheets, engine):
    """
    Start the APScheduler background scheduler.
    Runs the comparison job every 60 seconds.
    """
    global _scheduler, _previous_sheet2_snapshot

    if _scheduler and _scheduler.running:
        logger.warning("Scheduler is already running.")
        return

    # Capture initial Sheet 2 state as baseline snapshot
    _previous_sheet2_snapshot = sheets.get_all_adobe_data()
    logger.info(f"Scheduler baseline: {len(_previous_sheet2_snapshot)} records in Sheet 2.")

    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        _periodic_comparison_job,
        trigger="interval",
        seconds=60,  # Runs every 60 seconds
        args=[sheets, engine],
        id="periodic_comparison",
        max_instances=1,         # Prevent overlapping runs
        coalesce=True,           # If missed, run once instead of catching up
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Background scheduler started — periodic comparison every 60s.")
