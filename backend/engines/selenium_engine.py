"""
selenium_engine.py — WhatsApp Web automation via Selenium.
Uses persistent Chrome profile for session reuse (no QR each time).
Anti-ban: random delays, human-like interaction, 50 msg/session limit.
"""
import os
import time
import random
import urllib.parse
from core.engine_controller import WhatsAppEngine

MAX_MESSAGES_PER_SESSION = 50
_message_count = 0


def _random_delay(min_s: float = 8, max_s: float = 20):
    time.sleep(random.uniform(min_s, max_s))


class SeleniumEngine(WhatsAppEngine):
    """Sends messages via WhatsApp Web using Selenium ChromeDriver."""

    def __init__(self):
        self._driver = None
        self._init_driver()

    def get_name(self) -> str:
        return "SELENIUM"

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
            options = Options()
            options.add_argument(f"--user-data-dir={profile_path}")
            options.add_argument("--profile-directory=Default")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1280,800")
            # Headless optional — comment out if QR scan needed first time
            # options.add_argument("--headless=new")

            service = Service(ChromeDriverManager().install())
            self._driver = webdriver.Chrome(service=service, options=options)
        except Exception as e:
            raise RuntimeError(f"Failed to initialise ChromeDriver: {e}")

    def _wait_for_send_button(self, timeout: int = 20):
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        return WebDriverWait(self._driver, timeout).until(
            EC.element_to_be_clickable(
                (By.XPATH, '//button[@aria-label="Send" or @data-testid="send"]')
            )
        )

    def send_message(self, phone: str, message: str) -> dict:
        global _message_count

        if _message_count >= MAX_MESSAGES_PER_SESSION:
            raise RuntimeError("Session message limit reached (50). Restart to continue.")

        encoded = urllib.parse.quote(message)
        url = f"https://web.whatsapp.com/send?phone={phone}&text={encoded}"

        try:
            self._driver.get(url)
            # Wait for the page + chat to load
            time.sleep(random.uniform(6, 10))

            send_btn = self._wait_for_send_button(timeout=25)
            send_btn.click()
            _message_count += 1

            # Anti-ban delay between messages
            _random_delay(8, 20)

            return {"status": "sent", "phone": phone}

        except Exception as e:
            raise RuntimeError(f"Selenium send failed for {phone}: {e}")

    def quit(self):
        """Gracefully close the browser."""
        if self._driver:
            try:
                self._driver.quit()
            except Exception:
                pass
            self._driver = None
