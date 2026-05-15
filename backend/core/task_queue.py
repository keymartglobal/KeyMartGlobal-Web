"""
task_queue.py — Thread-safe in-memory task queue for Docker Agent polling.

Tasks flow:
  1. Backend creates a task (from /api/messages/send or automation)
  2. Task is stored in _pending with status "queued"
  3. Docker Agent polls GET /api/agent/tasks/{client_id}
  4. Agent receives tasks, executes Selenium, reports back
  5. Backend updates task status to "success" or "failed"
"""

import uuid
import time
import threading
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field

logger = logging.getLogger("keymart.task_queue")

# ── Task Statuses ────────────────────────────────────────────────────────────
STATUS_QUEUED   = "queued"
STATUS_ASSIGNED = "assigned"
STATUS_SUCCESS  = "success"
STATUS_FAILED   = "failed"


@dataclass
class Task:
    """Represents a single WhatsApp message task."""
    id: str
    client_id: str           # Target agent (or "any" for round-robin)
    phone: str
    message: str
    gmail: str               # For logging / tracking
    status: str = STATUS_QUEUED
    created_at: float = field(default_factory=time.time)
    assigned_at: Optional[float] = None
    completed_at: Optional[float] = None
    error: str = ""


@dataclass
class AgentInfo:
    """Tracks a connected Docker Agent."""
    client_id: str
    agent_token: str
    last_heartbeat: float = field(default_factory=time.time)
    status: str = "online"       # online, offline
    messages_sent: int = 0
    messages_failed: int = 0


class TaskQueue:
    """Thread-safe task queue that Docker Agents poll."""

    def __init__(self):
        self._lock = threading.Lock()
        self._tasks: Dict[str, Task] = {}           # task_id → Task
        self._agents: Dict[str, AgentInfo] = {}      # client_id → AgentInfo
        self._agent_tokens: Dict[str, str] = {}      # token → client_id (reverse lookup)

    # ── Agent Management ─────────────────────────────────────────────────────

    def register_agent(self, client_id: str, agent_token: str) -> AgentInfo:
        """Register or re-register a Docker Agent."""
        with self._lock:
            if client_id in self._agents:
                # Re-register: update token and heartbeat
                agent = self._agents[client_id]
                # Remove old token reverse lookup
                old_tokens = [k for k, v in self._agent_tokens.items() if v == client_id]
                for t in old_tokens:
                    del self._agent_tokens[t]
                agent.agent_token = agent_token
                agent.last_heartbeat = time.time()
                agent.status = "online"
            else:
                agent = AgentInfo(client_id=client_id, agent_token=agent_token)
                self._agents[client_id] = agent

            self._agent_tokens[agent_token] = client_id
            logger.info(f"Agent registered: {client_id}")
            return agent

    def verify_agent_token(self, token: str) -> Optional[str]:
        """Return client_id if token is valid, else None."""
        with self._lock:
            return self._agent_tokens.get(token)

    def heartbeat(self, client_id: str) -> bool:
        """Update agent heartbeat. Returns False if agent not found."""
        with self._lock:
            agent = self._agents.get(client_id)
            if not agent:
                return False
            agent.last_heartbeat = time.time()
            agent.status = "online"
            return True

    def get_all_agents(self) -> List[dict]:
        """Return all agents with their current status."""
        with self._lock:
            now = time.time()
            result = []
            for agent in self._agents.values():
                # Mark offline if no heartbeat in 60 seconds
                if now - agent.last_heartbeat > 60:
                    agent.status = "offline"
                result.append({
                    "client_id": agent.client_id,
                    "status": agent.status,
                    "last_heartbeat": agent.last_heartbeat,
                    "messages_sent": agent.messages_sent,
                    "messages_failed": agent.messages_failed,
                })
            return result

    # ── Task Management ──────────────────────────────────────────────────────

    def enqueue(self, phone: str, message: str, gmail: str = "",
                client_id: str = "any") -> Task:
        """Add a new message task to the queue."""
        task = Task(
            id=str(uuid.uuid4()),
            client_id=client_id,
            phone=phone,
            message=message,
            gmail=gmail,
        )
        with self._lock:
            self._tasks[task.id] = task
        logger.info(f"Task enqueued: {task.id} → {phone}")
        return task

    def enqueue_bulk(self, recipients: List[dict], message: str,
                     client_id: str = "any") -> List[Task]:
        """Enqueue multiple tasks at once."""
        tasks = []
        with self._lock:
            for r in recipients:
                task = Task(
                    id=str(uuid.uuid4()),
                    client_id=client_id,
                    phone=r.get("phone", ""),
                    message=message,
                    gmail=r.get("gmail", ""),
                )
                self._tasks[task.id] = task
                tasks.append(task)
        logger.info(f"Bulk enqueued: {len(tasks)} tasks for agent={client_id}")
        return tasks

    def get_pending_tasks(self, client_id: str, limit: int = 5) -> List[dict]:
        """
        Return up to `limit` queued tasks for the given agent.
        Marks them as 'assigned'.
        """
        with self._lock:
            pending = []
            for task in self._tasks.values():
                if task.status != STATUS_QUEUED:
                    continue
                # Match specific agent or "any"
                if task.client_id not in (client_id, "any"):
                    continue
                task.status = STATUS_ASSIGNED
                task.assigned_at = time.time()
                task.client_id = client_id  # Lock to this agent
                pending.append({
                    "task_id": task.id,
                    "phone": task.phone,
                    "message": task.message,
                    "gmail": task.gmail,
                })
                if len(pending) >= limit:
                    break
            return pending

    def report_task(self, task_id: str, status: str, error: str = "") -> bool:
        """Agent reports back the result of a task."""
        with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return False
            task.status = status
            task.completed_at = time.time()
            task.error = error

            # Update agent stats
            agent = self._agents.get(task.client_id)
            if agent:
                if status == STATUS_SUCCESS:
                    agent.messages_sent += 1
                else:
                    agent.messages_failed += 1

            return True

    def get_queue_stats(self) -> dict:
        """Return queue statistics."""
        with self._lock:
            queued = assigned = success = failed = 0
            for task in self._tasks.values():
                if task.status == STATUS_QUEUED:
                    queued += 1
                elif task.status == STATUS_ASSIGNED:
                    assigned += 1
                elif task.status == STATUS_SUCCESS:
                    success += 1
                elif task.status == STATUS_FAILED:
                    failed += 1
            return {
                "queued": queued,
                "assigned": assigned,
                "success": success,
                "failed": failed,
                "total": len(self._tasks),
            }

    def cleanup_old_tasks(self, max_age_seconds: int = 3600):
        """Remove completed tasks older than max_age_seconds."""
        with self._lock:
            now = time.time()
            to_remove = [
                tid for tid, task in self._tasks.items()
                if task.status in (STATUS_SUCCESS, STATUS_FAILED)
                and task.completed_at
                and now - task.completed_at > max_age_seconds
            ]
            for tid in to_remove:
                del self._tasks[tid]
            if to_remove:
                logger.info(f"Cleaned up {len(to_remove)} old tasks.")


# ── Global Singleton ─────────────────────────────────────────────────────────
task_queue = TaskQueue()
"""
