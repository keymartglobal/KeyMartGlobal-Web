"""
config.py — Shared runtime config for the WhatsApp automation system.
Thread-safe state management using a dataclass + lock.
"""
import threading
from dataclasses import dataclass, field
from typing import Literal, List, Dict, Any

EngineMode = Literal["META_API", "SELENIUM"]


@dataclass
class AutomationConfig:
    active_engine: EngineMode = "META_API"
    is_running: bool = False
    total_processed: int = 0
    success_count: int = 0
    failed_count: int = 0
    logs: List[Dict[str, Any]] = field(default_factory=list)
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

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
            "active_engine": self.active_engine,
            "is_running": self.is_running,
            "total_processed": self.total_processed,
            "success_count": self.success_count,
            "failed_count": self.failed_count,
        }


# Global singleton
automation_config = AutomationConfig()
