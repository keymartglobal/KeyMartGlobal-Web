"""
engine_controller.py — Strategy pattern engine selector.
Only ONE engine can be active at a time.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Literal

EngineMode = Literal["META_API", "SELENIUM"]


class WhatsAppEngine(ABC):
    """Base engine interface — all engines must implement this."""

    @abstractmethod
    def send_message(self, phone: str, message: str) -> dict:
        """Send a WhatsApp message. Returns a result dict."""
        ...

    @abstractmethod
    def get_name(self) -> str:
        """Return engine name for logging."""
        ...


def get_engine(mode: EngineMode) -> WhatsAppEngine:
    """
    Factory: returns the correct engine instance.
    Raises ValueError if mode is unknown.
    """
    if mode == "META_API":
        from engines.meta_api_engine import MetaAPIEngine
        return MetaAPIEngine()
    elif mode == "SELENIUM":
        from engines.selenium_engine import SeleniumEngine
        return SeleniumEngine()
    else:
        raise ValueError(f"Unknown engine mode: {mode}")
