
import re

from app.memory import update_profile


# ---------------------------------------------------------
# Automatic memory extraction
# ---------------------------------------------------------

def extract_memory(user_message: str):
    """
    Detect useful personal information from a user message.

    This version uses simple rules instead of an additional
    AI request.

    Returns:
        dict: Information that was detected and saved.
    """

    text = user_message.strip()

    if not text:
        return {}

    updates = {}


    # -----------------------------------------------------
    # 1. Learning / studying
    #
    # Example:
    # "I am learning FastAPI"
    # -----------------------------------------------------

    learning_match = re.search(
        r"(?:i am|i'm|i am currently)\s+"
        r"(?:learning|studying)\s+(.+)",
        text,
        re.IGNORECASE
    )

    if learning_match:

        learning = learning_match.group(1).strip(" .")

        if 1 <= len(learning) <= 100:
            updates["learning"] = learning


    # -----------------------------------------------------
    # 2. Goal
    #
    # Example:
    # "My goal is to become an AI engineer"
    # -----------------------------------------------------

    goal_match = re.search(
        r"(?:my goal is|my goal is to|i want to)\s+(.+)",
        text,
        re.IGNORECASE
    )

    if goal_match:

        goal = goal_match.group(1).strip(" .")

        if 1 <= len(goal) <= 150:
            updates["goal"] = goal


    # -----------------------------------------------------
    # 3. Current project
    #
    # Example:
    # "I am working on MAX AI Assistant"
    # -----------------------------------------------------

    project_match = re.search(
        r"(?:i am working on|i'm working on|"
        r"my current project is)\s+(.+)",
        text,
        re.IGNORECASE
    )

    if project_match:

        project = project_match.group(1).strip(" .")

        if 1 <= len(project) <= 150:
            updates["current_project"] = project


    # -----------------------------------------------------
    # 4. Preferred response style
    #
    # Example:
    # "Keep your answers concise"
    # -----------------------------------------------------

    if re.search(
        r"(?:keep|make)\s+"
        r"(?:your|the)\s+"
        r"(?:answer|answers|response|responses)\s+"
        r"(?:short|concise)",
        text,
        re.IGNORECASE
    ):

        updates["preferred_style"] = "concise"


    # -----------------------------------------------------
    # 5. Save detected information
    # -----------------------------------------------------

    if updates:
        update_profile(updates)

    return updates

