
import json
import os
from datetime import datetime


# ---------------------------------------------------------
# Location of memory.json
# ---------------------------------------------------------

MEMORY_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "memory.json"
)


# ---------------------------------------------------------
# Load memory
# ---------------------------------------------------------

def load_memory():
    """Load MAX memory from memory.json."""

    if not os.path.exists(MEMORY_FILE):
        return {
            "profile": {},
            "history": []
        }

    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        # Make sure profile exists
        if "profile" not in data:
            data["profile"] = {}

        # Make sure history exists
        if "history" not in data:
            data["history"] = []

        return data

    except (json.JSONDecodeError, OSError):
        return {
            "profile": {},
            "history": []
        }


# ---------------------------------------------------------
# Save memory
# ---------------------------------------------------------

def save_memory(data):
    """Save MAX memory to memory.json."""

    with open(MEMORY_FILE, "w", encoding="utf-8") as file:
        json.dump(
            data,
            file,
            indent=2,
            ensure_ascii=False
        )


# ---------------------------------------------------------
# Get user profile
# ---------------------------------------------------------

def get_profile():
    """Return the user's saved profile."""

    data = load_memory()

    return data.get("profile", {})


# ---------------------------------------------------------
# Remember one piece of information
# ---------------------------------------------------------

def remember(key, value):
    """Save one item to the user's profile."""

    data = load_memory()

    if "profile" not in data:
        data["profile"] = {}

    data["profile"][key] = value

    save_memory(data)


# ---------------------------------------------------------
# Update multiple profile fields
# ---------------------------------------------------------

def update_profile(updates):
    """
    Update multiple profile fields.

    Example:

    {
        "goal": "Become an AI engineer",
        "learning": "FastAPI"
    }
    """

    if not updates:
        return

    data = load_memory()

    if "profile" not in data:
        data["profile"] = {}

    for key, value in updates.items():

        if value is None:
            continue

        value = str(value).strip()

        if not value:
            continue

        data["profile"][key] = value

    save_memory(data)


# ---------------------------------------------------------
# Add conversation history
# ---------------------------------------------------------

def add_history(role, message):
    """Save a conversation message."""

    data = load_memory()

    if "history" not in data:
        data["history"] = []

    data["history"].append({
        "role": role,
        "message": message,
        "timestamp": datetime.now().isoformat()
    })

    # Keep only the latest 15 messages
    data["history"] = data["history"][-15:]

    save_memory(data)


# ---------------------------------------------------------
# Get conversation history
# ---------------------------------------------------------

def get_history():
    """Return conversation history."""

    data = load_memory()

    return data.get("history", [])


# ---------------------------------------------------------
# Clear conversation history
# ---------------------------------------------------------

def clear_history():
    """
    Delete conversation history.

    User profile is NOT deleted.
    """

    data = load_memory()

    data["history"] = []

    save_memory(data)
