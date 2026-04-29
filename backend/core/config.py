"""
config.py — Shared runtime config for the WhatsApp automation system.
Thread-safe state management using a dataclass + lock.
Now includes: engine mode, messaging mode (file_trigger / manual), template.
"""
import threading
from dataclasses import dataclass, field
from typing import Literal, List, Dict, Any, Optional

EngineMode    = Literal["META_API", "SELENIUM"]
MessagingMode = Literal["FILE_TRIGGER", "MANUAL"]


@dataclass
class AutomationConfig:
    # ── Engine Settings ────────────────────────────────────────────────────────
    active_engine: EngineMode = "SELENIUM"          # META_API unavailable — default SELENIUM
    messaging_mode: MessagingMode = "MANUAL"

    # ── Runtime State ──────────────────────────────────────────────────────────
    is_running: bool = False
    total_processed: int = 0
    success_count: int = 0
    failed_count: int = 0
    logs: List[Dict[str, Any]] = field(default_factory=list)

    # ── Template ───────────────────────────────────────────────────────────────
    file_trigger_template: str = (
        "Hello,\n\n"
        "Your Adobe organisation has been updated.\n\n"
        "📧 Account: *{gmail}*\n"
        "🏢 Previous Org: *{from_org}*\n"
        "🏢 New Org: *{to_org}*\n\n"
        "Please re-verify your access in the Adobe portal.\n\n"
        "For support: business@keymartglobal.in\n\n"
        "Thank you,\nKeyMart Global Team"
    )
    manual_template: str = (
        "Hello,\n\n"
        "Your registered email ID with KeyMart Global is:\n"
        "📧 *{gmail}*\n\n"
        "Please verify and ensure you're signed in with this email in the Adobe portal.\n\n"
        "For support: business@keymartglobal.in\n\n"
        "Thank you,\nKeyMart Global Team"
    )

    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    # ── Methods ────────────────────────────────────────────────────────────────

    def reset_stats(self):
        with self._lock:
            self.total_processed = 0
            self.success_count = 0
            self.failed_count = 0
            self.logs = []

    def log(self, phone: str, gmail: str, engine: str, status: str, error: str = ""):
        from datetime import datetime, timezone
        with self._lock:
            self.total_processed += 1
            if status == "success":
                self.success_count += 1
            else:
                self.failed_count += 1
            self.logs.append({
                "phone": phone,
                "gmail": gmail,
                "engine": engine,
                "status": status,
                "error": error,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

    def get_status(self) -> dict:
        return {
            "active_engine":   self.active_engine,
            "messaging_mode":  self.messaging_mode,
            "is_running":      self.is_running,
            "total_processed": self.total_processed,
            "success_count":   self.success_count,
            "failed_count":    self.failed_count,
        }

    def get_settings(self) -> dict:
        return {
            "active_engine":          self.active_engine,
            "messaging_mode":         self.messaging_mode,
            "file_trigger_template":  self.file_trigger_template,
            "manual_template":        self.manual_template,
        }


# Global singleton
automation_config = AutomationConfig()
