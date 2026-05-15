"""
agent_engine.py — WhatsApp engine that dispatches to Docker Agent via task queue.

Instead of running Selenium directly, this engine enqueues tasks that
remote Docker Agents will poll and execute. The `send_message` call
is non-blocking: it enqueues the task and returns immediately.
"""

import logging
from core.engine_controller import WhatsAppEngine
from core.task_queue import task_queue

logger = logging.getLogger("keymart.agent_engine")


class AgentEngine(WhatsAppEngine):
    """Dispatches messages to Docker Agent(s) via the task queue."""

    def get_name(self) -> str:
        return "DOCKER_AGENT"

    def send_message(self, phone: str, message: str, gmail: str = "") -> dict:
        """
        Enqueue a message task for the Docker Agent.
        Does NOT send directly — the agent polls and sends.
        """
        task = task_queue.enqueue(phone=phone, message=message, gmail=gmail)
        logger.info(f"[DOCKER_AGENT] Task enqueued: {task.id} → {phone}")
        return {"status": "queued", "task_id": task.id, "phone": phone}
