"""
template_engine.py — Simple {placeholder} template substitution.
Supports any keyword arguments: {gmail}, {name}, {from_org}, {to_org}, etc.
"""


def render(template: str, **kwargs) -> str:
    """
    Replace {key} placeholders in template with provided kwargs.
    Unknown placeholders are left as-is.
    """
    result = template
    for key, value in kwargs.items():
        result = result.replace(f"{{{key}}}", str(value))
    return result


# Default manual template (for Messaging page + processor.py)
DEFAULT_TEMPLATE = (
    "Hello,\n\n"
    "Your registered email ID with KeyMart Global is:\n"
    "📧 *{gmail}*\n\n"
    "Please verify and ensure you're signed in with this email in the Adobe portal.\n\n"
    "For support: business@keymartglobal.in\n\n"
    "Thank you,\n"
    "KeyMart Global Team"
)

# Default file-trigger template (org-change notification)
FILE_TRIGGER_TEMPLATE = (
    "Hello,\n\n"
    "Your Adobe organisation has been updated.\n\n"
    "📧 Account: *{gmail}*\n"
    "🏢 Previous Org: *{from_org}*\n"
    "🏢 New Org: *{to_org}*\n\n"
    "Please re-verify your access in the Adobe portal.\n\n"
    "For support: business@keymartglobal.in\n\n"
    "Thank you,\n"
    "KeyMart Global Team"
)

