"""
template_engine.py — Simple {placeholder} template substitution.
"""


def render(template: str, **kwargs) -> str:
    """
    Replace {key} placeholders in template with provided kwargs.
    Unknown placeholders are left as-is.

    Usage:
        render("Hello {name}, your email is {gmail}", name="Ravi", gmail="r@gmail.com")
    """
    result = template
    for key, value in kwargs.items():
        result = result.replace(f"{{{key}}}", str(value))
    return result


# Default message template
DEFAULT_TEMPLATE = (
    "Hello,\n\n"
    "Your registered email ID with KeyMart Global is:\n"
    "📧 *{gmail}*\n\n"
    "Please verify and ensure you're signed in with this email in the Adobe portal.\n\n"
    "For support: business@keymartglobal.in\n\n"
    "Thank you,\n"
    "KeyMart Global Team"
)
