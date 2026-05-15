"""
worker.py — KeyMart Global WhatsApp Automation Agent
=====================================================

Runs on the CLIENT machine inside Docker.
- Reads config from config.json (mounted into container)
- Polls the backend for pending message tasks
- Executes WhatsApp Web automation via Selenium
- Reports results back to the backend
- Saves error screenshots for debugging
- Maintains persistent Chrome profile for WhatsApp login

SMART LOGIN FLOW:
  • First run   → No Chrome session exists → QR code saved to screenshots/QR_CODE.png
  • Subsequent  → Session already in Chrome profile → auto-login, no QR needed
  • If expired  → WhatsApp redirects to QR screen → automatically shows QR again
"""

import os
import re
import sys
import time
import json
import random
import signal
import shutil
import logging
import urllib.parse
import requests
from datetime import datetime

# ══════════════════════════════════════════════════════════════════════════════
#  CONFIGURATION — loaded from config.json
# ══════════════════════════════════════════════════════════════════════════════

CONFIG_PATH = "/app/config.json"


def load_config() -> dict:
    """Load configuration from config.json."""
    if not os.path.exists(CONFIG_PATH):
        print(f"ERROR: {CONFIG_PATH} not found.")
        print("Make sure config.json exists in the agent folder.")
        sys.exit(1)
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)


config = load_config()

BACKEND_URL    = config.get("backend_url", "http://localhost:8000")
CLIENT_ID      = config.get("client_id", "client_001")
AGENT_TOKEN    = config.get("agent_token", "change_me_to_secure_token")
POLL_INTERVAL  = config.get("poll_interval", 5)
MAX_MESSAGES   = config.get("max_messages_per_session", 50)
CHROME_PROFILE = "/app/chrome-profile"
SCREENSHOT_DIR = "/app/screenshots"

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("agent")

# ── Globals ──────────────────────────────────────────────────────────────────
driver    = None
msg_count = 0
running   = True

# ── XPath Selectors for WhatsApp Web ─────────────────────────────────────────
SEND_BUTTON_XPATHS = [
    '//button[@aria-label="Send"]',
    '//button[@data-testid="compose-btn-send"]',
    '//*[@data-icon="send"]',
    '//span[@data-icon="send"]',
    '//button[contains(@class,"send")]',
]

# Signs that the user IS logged in to WhatsApp Web
LOGGED_IN_XPATHS = [
    '//div[@aria-label="Search or start new chat"]',
    '//div[@aria-label="Search input textbox"]',
    '//div[@data-testid="chat-list"]',
    '//button[@aria-label="New chat"]',
    '//div[@data-tab="3"]',
]

# Signs that WhatsApp Web is showing the QR / login screen
QR_SCREEN_XPATHS = [
    '//canvas[@aria-label="Scan this QR code to link a device"]',
    '//div[@data-ref]',   # QR code container
    '//div[contains(@class,"landing-main")]',
    '//*[@data-testid="qr-code"]',
]


def signal_handler(signum, frame):
    """Graceful shutdown on SIGINT/SIGTERM."""
    global running
    logger.info("Shutdown signal received. Finishing current task...")
    running = False


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def save_screenshot(name: str = "error"):
    """Save a debug screenshot to /app/screenshots/."""
    if not driver:
        return
    try:
        os.makedirs(SCREENSHOT_DIR, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = f"{SCREENSHOT_DIR}/{name}_{timestamp}.png"
        driver.save_screenshot(path)
        logger.info(f"Screenshot saved: {path}")
    except Exception as e:
        logger.warning(f"Screenshot failed: {e}")


def has_existing_session() -> bool:
    """
    Check if a WhatsApp Web session already exists in the Chrome profile.
    Looks for the WhatsApp localStorage database — this file only exists
    after a successful login.
    """
    session_markers = [
        # Chrome's IndexedDB or Local Storage for WhatsApp
        os.path.join(CHROME_PROFILE, "Default", "Local Storage", "leveldb"),
        os.path.join(CHROME_PROFILE, "Default", "IndexedDB"),
    ]
    for marker in session_markers:
        if os.path.exists(marker):
            # Marker exists — check if it has actual content (not just empty dirs)
            if os.path.isdir(marker):
                if any(os.scandir(marker)):
                    return True
            else:
                return True
    return False


# ══════════════════════════════════════════════════════════════════════════════
#  SELENIUM BROWSER
# ══════════════════════════════════════════════════════════════════════════════

def init_browser():
    """Initialize Chrome/Chromium with persistent profile."""
    global driver
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options

    os.makedirs(CHROME_PROFILE, exist_ok=True)

    # Remove lock files if they exist from a previous crash
    for lock_name in ["SingletonLock", "SingletonSocket", "SingletonCookie"]:
        lock_file = os.path.join(CHROME_PROFILE, lock_name)
        if os.path.exists(lock_file):
            try:
                if os.path.isdir(lock_file):
                    shutil.rmtree(lock_file)
                else:
                    os.remove(lock_file)
            except Exception:
                pass

    options = Options()

    # Persistent profile — WhatsApp login survives restarts
    options.add_argument(f"--user-data-dir={CHROME_PROFILE}")

    # Required for Docker
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1366,768")

    # Anti-detection
    options.add_argument("--disable-blink-features=AutomationControlled")

    # Use system Chromium (installed in Docker image)
    chrome_bin = "/usr/bin/chromium"
    if os.path.exists(chrome_bin):
        options.binary_location = chrome_bin
    else:
        for candidate in ["/usr/bin/chromium-browser", "/usr/bin/google-chrome"]:
            if os.path.exists(candidate):
                options.binary_location = candidate
                break

    logger.info(f"Using browser: {options.binary_location}")

    service = Service("/usr/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)
    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    logger.info("Browser initialized successfully.")


def _check_login_state(wait_seconds: int = 5) -> str:
    """
    Check current WhatsApp Web state.
    Returns: 'logged_in' | 'qr_screen' | 'loading'
    """
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    # Check if logged in
    for xpath in LOGGED_IN_XPATHS:
        try:
            WebDriverWait(driver, wait_seconds).until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            return "logged_in"
        except Exception:
            continue

    # Check if QR screen
    for xpath in QR_SCREEN_XPATHS:
        try:
            WebDriverWait(driver, 2).until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            return "qr_screen"
        except Exception:
            continue

    return "loading"


def _clean_qr_file():
    """Remove the QR code screenshot if it exists."""
    qr_path = os.path.join(SCREENSHOT_DIR, "QR_CODE.png")
    if os.path.exists(qr_path):
        try:
            os.remove(qr_path)
        except Exception:
            pass


def smart_login(timeout: int = 300) -> bool:
    """
    Smart login handler:
    - If session exists in Chrome profile → try auto-login first (fast path).
    - If WhatsApp shows QR screen → save QR_CODE.png every 5s until scanned.
    - Returns True when fully logged in, False on timeout.
    """
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    logger.info("Navigating to WhatsApp Web...")
    driver.get("https://web.whatsapp.com")

    # Give the page a moment to settle
    time.sleep(3)

    session_exists = has_existing_session()

    if session_exists:
        logger.info("📂 Existing session detected — attempting auto-login...")
        logger.info("   (No QR scan needed if your session is still valid)")
    else:
        logger.info("🆕 No existing session found — QR scan required.")

    deadline = time.time() + timeout
    last_qr_save = 0
    qr_phase_announced = False
    auto_login_announced = False
    state = "loading"

    while time.time() < deadline:
        state = _check_login_state(wait_seconds=3)

        if state == "logged_in":
            logger.info("")
            logger.info("✅ WhatsApp Web is LOGGED IN!")
            if session_exists:
                logger.info("   Auto-login successful — no QR scan was needed.")
            else:
                logger.info("   QR code scanned successfully.")
            logger.info("")
            _clean_qr_file()
            save_screenshot("login_success")
            return True

        elif state == "qr_screen":
            if not qr_phase_announced:
                qr_phase_announced = True
                logger.info("")
                logger.info("╔══════════════════════════════════════════════════════╗")
                logger.info("║         📱  WHATSAPP LOGIN REQUIRED                 ║")
                logger.info("╠══════════════════════════════════════════════════════╣")
                logger.info("║  1. Open the 'screenshots' folder in your agent dir ║")
                logger.info("║  2. Open the 'QR_CODE.png' file                     ║")
                logger.info("║  3. In WhatsApp on your phone:                      ║")
                logger.info("║     Settings → Linked Devices → Link a Device       ║")
                logger.info("║  4. Scan the QR code with your phone camera         ║")
                logger.info("║                                                      ║")
                logger.info("║  The QR code refreshes every ~20 seconds.           ║")
                logger.info("║  This file is updating automatically.               ║")
                logger.info("╚══════════════════════════════════════════════════════╝")
                logger.info("")

            # Save QR screenshot every 5 seconds
            if time.time() - last_qr_save > 5:
                try:
                    driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "QR_CODE.png"))
                    last_qr_save = time.time()
                except Exception:
                    pass

        else:  # still loading
            if session_exists and not auto_login_announced:
                auto_login_announced = True
                logger.info("   Page is loading... checking for session restore...")
            time.sleep(1)

    # Timed out
    logger.error("❌ WhatsApp login timed out after %ds.", timeout)
    save_screenshot("login_timeout")
    _clean_qr_file()
    return False


# ══════════════════════════════════════════════════════════════════════════════
#  SEND MESSAGE
# ══════════════════════════════════════════════════════════════════════════════

def is_still_logged_in() -> bool:
    """Quick check if WhatsApp Web is still showing the chat interface."""
    state = _check_login_state(wait_seconds=3)
    return state == "logged_in"


def send_whatsapp_message(phone: str, message: str) -> bool:
    """Send a single WhatsApp message via Selenium."""
    global msg_count
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    # Clean phone number — ensure country code
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        digits = "91" + digits

    encoded = urllib.parse.quote(message)
    url = f"https://web.whatsapp.com/send?phone={digits}&text={encoded}"

    try:
        logger.info(f"Opening chat for {digits}...")
        driver.get(url)

        # Wait for WhatsApp to load the chat
        deadline = time.time() + 40
        loaded = False
        while time.time() < deadline:
            for xpath in LOGGED_IN_XPATHS:
                try:
                    WebDriverWait(driver, 3).until(
                        EC.presence_of_element_located((By.XPATH, xpath))
                    )
                    loaded = True
                    break
                except Exception:
                    continue
            if loaded:
                break

        if not loaded:
            save_screenshot(f"load_fail_{digits}")
            raise Exception("WhatsApp page did not load in time.")

        # Wait for message text to pre-fill in the input box
        time.sleep(random.uniform(3, 6))

        # Click Send button
        for xpath in SEND_BUTTON_XPATHS:
            try:
                btn = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, xpath))
                )
                btn.click()
                msg_count += 1
                logger.info(f"✅ Message sent to {digits} ({msg_count}/{MAX_MESSAGES})")

                # Anti-ban delay — random wait between messages
                time.sleep(random.uniform(4, 10))
                return True
            except Exception:
                continue

        save_screenshot(f"send_fail_{digits}")
        raise Exception("Send button not found.")

    except Exception as e:
        logger.error(f"❌ Failed to send to {digits}: {e}")
        save_screenshot(f"error_{digits}")
        return False


# ══════════════════════════════════════════════════════════════════════════════
#  BACKEND COMMUNICATION
# ══════════════════════════════════════════════════════════════════════════════

def register_with_backend() -> bool:
    """Register this agent with the backend."""
    try:
        resp = requests.post(f"{BACKEND_URL}/api/agent/register", json={
            "client_id": CLIENT_ID,
            "agent_token": AGENT_TOKEN,
        }, timeout=15)
        if resp.status_code == 200:
            logger.info(f"Registered with backend as '{CLIENT_ID}'.")
            return True
        else:
            logger.error(f"Registration failed: {resp.text}")
            return False
    except Exception as e:
        logger.error(f"Cannot reach backend at {BACKEND_URL}: {e}")
        return False


def poll_tasks() -> list:
    """Poll the backend for pending tasks."""
    try:
        resp = requests.get(
            f"{BACKEND_URL}/api/agent/tasks/{CLIENT_ID}",
            headers={"Authorization": f"Bearer {AGENT_TOKEN}"},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get("tasks", [])
        elif resp.status_code in (401, 403):
            logger.warning(f"Poll error: {resp.status_code}. Token rejected (backend might have restarted). Re-registering...")
            register_with_backend()
            return []
        else:
            logger.warning(f"Poll error: {resp.status_code}")
            return []
    except requests.exceptions.ConnectionError:
        logger.warning("Backend unreachable. Will retry...")
        return []
    except Exception as e:
        logger.warning(f"Poll failed: {e}")
        return []


def report_result(task_id: str, status: str, error: str = ""):
    """Report task result back to the backend."""
    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/agent/report",
            json={"task_id": task_id, "status": status, "error": error},
            headers={"Authorization": f"Bearer {AGENT_TOKEN}"},
            timeout=10,
        )
        if resp.status_code in (401, 403):
            logger.warning(f"Report error: {resp.status_code}. Re-registering...")
            register_with_backend()
    except Exception as e:
        logger.warning(f"Report failed for {task_id}: {e}")


def send_heartbeat():
    """Send heartbeat to backend."""
    try:
        resp = requests.post(
            f"{BACKEND_URL}/api/agent/heartbeat/{CLIENT_ID}",
            headers={"Authorization": f"Bearer {AGENT_TOKEN}"},
            timeout=5,
        )
        if resp.status_code in (401, 403):
            logger.warning(f"Heartbeat error: {resp.status_code}. Re-registering...")
            register_with_backend()
    except Exception:
        pass


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN LOOP
# ══════════════════════════════════════════════════════════════════════════════

def main():
    global running, msg_count

    print()
    print("╔══════════════════════════════════════════════════════╗")
    print("║   KeyMart Global — WhatsApp Automation Agent        ║")
    print("╠══════════════════════════════════════════════════════╣")
    print(f"║   Client ID : {CLIENT_ID:<38} ║")
    print(f"║   Backend   : {BACKEND_URL:<38} ║")
    print(f"║   Poll Rate : {str(POLL_INTERVAL) + 's':<38} ║")
    print("╚══════════════════════════════════════════════════════╝")
    print()

    # Step 1: Register with backend (with retries)
    max_retries = 5
    for attempt in range(max_retries):
        if register_with_backend():
            break
        wait = min(10 * (attempt + 1), 60)
        logger.warning(f"Registration attempt {attempt + 1}/{max_retries} failed. Retrying in {wait}s...")
        time.sleep(wait)
    else:
        logger.error("Cannot register with backend after all retries. Exiting.")
        sys.exit(1)

    # Step 2: Initialize browser
    init_browser()

    # Step 3: Smart login — auto if session exists, QR if not
    if not smart_login(timeout=300):
        logger.error("WhatsApp login failed. Please restart and scan QR code.")
        sys.exit(1)

    # Step 4: Main polling loop
    logger.info("🚀 Entering polling loop — waiting for tasks...")
    heartbeat_counter = 0
    session_check_counter = 0

    while running:
        try:
            # Periodically verify we're still logged in (every 10 polls)
            session_check_counter += 1
            if session_check_counter >= 10:
                session_check_counter = 0
                if not is_still_logged_in():
                    logger.warning("⚠️  WhatsApp session appears to have expired!")
                    logger.warning("    Re-running smart login...")
                    if not smart_login(timeout=300):
                        logger.error("Re-login failed. Exiting.")
                        sys.exit(1)

            # Session limit check — restart browser to avoid WhatsApp ban
            if msg_count >= MAX_MESSAGES:
                logger.warning(f"Session limit ({MAX_MESSAGES}) reached. Restarting browser...")
                try:
                    driver.quit()
                except Exception:
                    pass
                msg_count = 0
                time.sleep(5)
                init_browser()
                smart_login(timeout=120)

            # Poll for tasks
            tasks = poll_tasks()

            for task in tasks:
                if not running:
                    break

                task_id = task.get("task_id", "unknown")
                phone   = task.get("phone", "")
                message = task.get("message", "")

                if not phone or not message:
                    report_result(task_id, "failed", "Missing phone or message")
                    continue

                logger.info(f"Processing task {task_id}: {phone}")
                success = send_whatsapp_message(phone, message)

                if success:
                    report_result(task_id, "success")
                else:
                    report_result(task_id, "failed", "Selenium send failed")

            # Heartbeat every 5 polls (~25 seconds)
            heartbeat_counter += 1
            if heartbeat_counter >= 5:
                send_heartbeat()
                heartbeat_counter = 0

            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            break
        except Exception as e:
            logger.error(f"Loop error: {e}")
            save_screenshot("loop_error")
            time.sleep(POLL_INTERVAL)

    # Cleanup
    logger.info("Shutting down agent...")
    _clean_qr_file()
    if driver:
        try:
            driver.quit()
        except Exception:
            pass
    logger.info("Agent stopped. Goodbye!")


if __name__ == "__main__":
    main()
