"""
selenium_engine.py — Bug-fixed, robust WhatsApp Web automation via Selenium.

Fixes applied:
- Wait for WhatsApp Web to fully load before acting (chat list check)
- Use multiple fallback XPath selectors for the Send button
- Handle phone number formatting edge-cases
- Singleton driver pattern: one browser session reused across calls
- Thread-safe message counter
- Graceful teardown on error
"""
import os
import re
import time
import random
import threading
import urllib.parse
import logging
from core.engine_controller import WhatsAppEngine

logger = logging.getLogger("keymart.selenium")

MAX_MESSAGES_PER_SESSION = 50
_lock = threading.Lock()

# ── XPath candidates for WhatsApp Web's Send button ──────────────────────────
# WhatsApp Web frequently changes its DOM, so we try several selectors.
SEND_BUTTON_XPATHS = [
    '//button[@aria-label="Send"]',
    '//button[@data-testid="compose-btn-send"]',
    '//*[@data-icon="send"]',
    '//span[@data-icon="send"]',
    '//button[contains(@class,"send")]',
]

# ── XPath for the chat input box ──────────────────────────────────────────────
INPUT_XPATHS = [
    '//div[@aria-label="Type a message"]',
    '//div[@aria-placeholder="Type a message"]',
    '//div[@data-testid="conversation-compose-box-input"]',
    '//footer//div[@contenteditable="true"]',
]

# ── XPath to confirm WhatsApp Web finished loading ───────────────────────────
LOADED_XPATHS = [
    '//div[@aria-label="Search or start new chat"]',
    '//div[@aria-label="Search input textbox"]',
    '//div[@data-testid="chat-list"]',
    '//button[@aria-label="New chat"]',
    '//div[@role="textbox"]',
    '//div[@data-tab="3"]',
]


def _clean_phone(phone: str) -> str:
    """Strip non-digits; ensure Indian 91 prefix (10-digit numbers)."""
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        digits = "91" + digits
    return digits


def _random_delay(min_s: float = 2.0, max_s: float = 5.0):
    time.sleep(random.uniform(min_s, max_s))


class SeleniumEngine(WhatsAppEngine):
    """Sends messages via WhatsApp Web using Selenium ChromeDriver."""

    _instance = None           # Singleton: reuse one browser per process

    def __new__(cls):
        if cls._instance is None:
            instance = super().__new__(cls)
            instance._driver = None
            instance._msg_count = 0
            instance._init_driver()
            cls._instance = instance
        return cls._instance

    def get_name(self) -> str:
        return "SELENIUM"

    # ── Driver Initialisation ─────────────────────────────────────────────────

    def _init_driver(self):
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.service import Service
            from selenium.webdriver.chrome.options import Options
            from webdriver_manager.chrome import ChromeDriverManager

            profile_path = os.getenv(
                "SELENIUM_CHROME_PROFILE_PATH",
                os.path.join(os.path.expanduser("~"), "whatsapp_chrome_profile"),
            )
            os.makedirs(profile_path, exist_ok=True)

            options = Options()
            options.add_argument(f"--user-data-dir={profile_path}")
            options.add_argument("--profile-directory=Default")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1366,768")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option("useAutomationExtension", False)

            service = Service(ChromeDriverManager().install())
            self._driver = webdriver.Chrome(service=service, options=options)
            self._driver.execute_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )
            logger.info("ChromeDriver initialised successfully.")
        except Exception as e:
            raise RuntimeError(f"Failed to initialise ChromeDriver: {e}")

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _wait_for_element(self, xpaths: list, timeout: int = 30):
        """Try multiple XPath candidates; return the first that appears."""
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        deadline = time.time() + timeout
        while time.time() < deadline:
            for xpath in xpaths:
                try:
                    el = WebDriverWait(self._driver, 3).until(
                        EC.presence_of_element_located((By.XPATH, xpath))
                    )
                    return el
                except Exception:
                    continue
        raise TimeoutError(
            f"None of the XPaths became visible within {timeout}s: {xpaths}"
        )

    def _wait_clickable(self, xpaths: list, timeout: int = 30):
        """Try multiple XPath candidates; return the first that is clickable."""
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        deadline = time.time() + timeout
        while time.time() < deadline:
            for xpath in xpaths:
                try:
                    el = WebDriverWait(self._driver, 3).until(
                        EC.element_to_be_clickable((By.XPATH, xpath))
                    )
                    return el
                except Exception:
                    continue
        raise TimeoutError(
            f"No clickable element within {timeout}s: {xpaths}"
        )

    def _ensure_wa_loaded(self, timeout: int = 30):
        """Block until WhatsApp Web chat list is visible."""
        logger.info("Waiting for WhatsApp Web to finish loading...")
        self._wait_for_element(LOADED_XPATHS, timeout=timeout)
        logger.info("WhatsApp Web loaded.")

    # ── Core send ────────────────────────────────────────────────────────────

    def send_message(self, phone: str, message: str) -> dict:
        with _lock:
            if self._msg_count >= MAX_MESSAGES_PER_SESSION:
                raise RuntimeError(
                    "Session limit (50 messages) reached. Restart engine to continue."
                )

        phone = _clean_phone(phone)
        encoded = urllib.parse.quote(message)
        url = f"https://web.whatsapp.com/send?phone={phone}&text={encoded}"

        try:
            logger.info(f"Opening chat URL for {phone}...")
            self._driver.get(url)

            # Wait for WhatsApp to load the chat
            self._ensure_wa_loaded(timeout=40)

            # Extra buffer for chat + message pre-fill
            _random_delay(3, 6)

            # Click the send button
            logger.info("Looking for Send button...")
            send_btn = self._wait_clickable(SEND_BUTTON_XPATHS, timeout=30)
            send_btn.click()
            logger.info(f"Message sent to {phone}")

            with _lock:
                self._msg_count += 1

            # Anti-ban delay
            _random_delay(4, 10)

            return {"status": "sent", "phone": phone}

        except Exception as e:
            logger.error(f"Send failed for {phone}: {e}")
            raise RuntimeError(f"Selenium send failed for {phone}: {e}")

    def quit(self):
        """Close the browser and reset the singleton."""
        if self._driver:
            try:
                self._driver.quit()
            except Exception:
                pass
            self._driver = None
        SeleniumEngine._instance = None
        logger.info("Selenium browser closed.")
