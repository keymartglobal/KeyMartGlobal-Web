"""
test_selenium.py — Standalone WhatsApp Selenium test.
Sends a sample message to a test number WITHOUT touching any real data.

Usage:
    python test_selenium.py

The script:
1. Launches Chrome with a persistent profile (session saved after first QR scan).
2. Opens web.whatsapp.com — if not logged in, shows a 4-minute countdown.
3. Waits for WhatsApp Web to load fully.
4. Sends the sample template message to the configured test number.
"""
import sys
import os
import io
import time

# ── Force UTF-8 so emojis print correctly on Windows ─────────────────────────
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ── Add backend root to path ──────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engines.selenium_engine import SeleniumEngine
from utils.template_engine import render, DEFAULT_TEMPLATE

# ── Test configuration (NOT real data) ───────────────────────────────────────
TEST_PHONE = "934469007"          # 10-digit number; country code added automatically
TEST_GMAIL = "jasvanth@gmail.com"
TEST_NAME  = "Jasvanth"
QR_WAIT    = 240                   # seconds to wait for QR scan (first-time only)

# ─────────────────────────────────────────────────────────────────────────────

def _is_logged_in(driver) -> bool:
    """Return True if WhatsApp Web chat list is visible (already logged in)."""
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    try:
        WebDriverWait(driver, 8).until(
            EC.presence_of_element_located(
                (By.XPATH, '//div[@aria-label="Search input textbox"] | //div[@data-testid="chat-list"]')
            )
        )
        return True
    except Exception:
        return False


def run_test():
    print("=" * 50)
    print("  KeyMart Global — WhatsApp Selenium Test")
    print("=" * 50)

    # ── Step 1: Start engine ──────────────────────────────────────────────────
    print("\n[1/4] Starting Selenium engine (Chrome)...")
    try:
        engine = SeleniumEngine()
    except Exception as e:
        print(f"\n❌ Failed to start Chrome: {e}")
        print("   Make sure Chrome is installed and not already running with this profile.")
        return

    driver = engine._driver

    # ── Step 2: Open WhatsApp Web ─────────────────────────────────────────────
    print("[2/4] Opening WhatsApp Web...")
    driver.get("https://web.whatsapp.com")

    if _is_logged_in(driver):
        print("      ✅ Already logged in — skipping QR wait.\n")
    else:
        print("      📱 Not logged in. Scan the QR code with your phone.")
        print(f"         Waiting up to {QR_WAIT} seconds...\n")
        deadline = time.time() + QR_WAIT
        logged_in = False
        while time.time() < deadline:
            remaining = int(deadline - time.time())
            print(f"\r         ⏳ {remaining}s remaining...  ", end="", flush=True)
            if _is_logged_in(driver):
                logged_in = True
                break
            time.sleep(5)
        print()  # newline after countdown
        if not logged_in:
            print("\n❌ QR code was not scanned in time. Run the script again.")
            engine.quit()
            return
        print("      ✅ QR scan successful!\n")

    # ── Step 3: Prepare message ───────────────────────────────────────────────
    print("[3/4] Preparing test message...")
    message = render(DEFAULT_TEMPLATE, gmail=TEST_GMAIL, name=TEST_NAME)
    print("\n--- Message Preview ---")
    print(message)
    print("----------------------\n")

    # ── Step 4: Send message ─────────────────────────────────────────────────
    print(f"[4/4] Sending to {TEST_PHONE}...")
    try:
        result = engine.send_message(TEST_PHONE, message)
        print(f"\n✅ Message sent successfully! Result: {result}")
    except Exception as e:
        print(f"\n❌ Failed to send: {e}")
        print("\nDebugging tips:")
        print("  • Make sure the phone number is active on WhatsApp.")
        print("  • Check if WhatsApp Web is showing any popups/errors.")
        print("  • Try running the script again — sometimes the chat takes extra time to load.")
    finally:
        print("\n[Done] Browser will stay open for 5 seconds so you can verify...")
        time.sleep(5)
        engine.quit()
        print("Browser closed.")


if __name__ == "__main__":
    run_test()
