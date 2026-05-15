"""
engine_controller.py — Strategy pattern engine selector.
Only ONE engine can be active at a time.
Supports: META_API, SELENIUM (runs via local Docker Agent).
SELENIUM and DOCKER_AGENT are treated as equivalent — both route
to the AgentEngine which dispatches tasks to the local Docker container.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Literal

EngineMode = Literal["META_API", "SELENIUM", "DOCKER_AGENT"]


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
    SELENIUM and DOCKER_AGENT both route to AgentEngine since
    Selenium runs locally via the Docker Agent container.
    """
    if mode == "META_API":
        from engines.meta_api_engine import MetaAPIEngine
        return MetaAPIEngine()
    elif mode in ("SELENIUM", "DOCKER_AGENT"):
        from engines.agent_engine import AgentEngine
        return AgentEngine()
    else:
        raise ValueError(f"Unknown engine mode: {mode}")
