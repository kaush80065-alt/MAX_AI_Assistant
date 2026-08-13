import asyncio
import httpx


from app.config import OPENROUTER_API_KEY, OPENROUTER_MODEL, GEMINI_API_KEY, GEMINI_MODEL

from app.memory import (
    add_history,
    get_history,
    get_profile,
    remember,
)

from app.memory_extractor import extract_memory

from app.personality import build_system_prompt
from app.search import search_web


# ---------------------------------------------------------
# OpenRouter API
# ---------------------------------------------------------

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"


# ---------------------------------------------------------
# Web Search Intent Detector
# ---------------------------------------------------------

async def should_search_web(user_message: str, api_url: str, api_key: str, model_name: str) -> bool:
    """Uses a fast LLM call to determine if the user's message needs real-time web search."""
    prompt = (
        "You are a search intent classifier. Does the user's message require querying the internet for "
        "real-time information, recent events, weather, news, specific facts, or things you wouldn't know natively? "
        "Reply with ONLY the word YES or NO."
    )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                api_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "max_tokens": 10,
                    "temperature": 0.0
                },
                timeout=5.0
            )
        data = response.json()
        if isinstance(data, list):
            print("Received list response from API (likely error):", data)
            data = data[0] if data else {}
        reply = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip().upper()
        return "YES" in reply
    except Exception as e:
        print("Search detection failed:", e)
        return False


# ---------------------------------------------------------
# MAX AI response
# ---------------------------------------------------------

async def get_ai_response(user_message: str, image_b64: str = None) -> str:
    """
    Process the user's message and return MAX's response.
    """

    # -----------------------------------------------------
    # 1. Save user's message
    # -----------------------------------------------------

    add_history(
        "user",
        user_message
    )


    # -----------------------------------------------------
    # 2. Automatically detect useful memory
    # -----------------------------------------------------

    extracted_memory = extract_memory(
        user_message
    )

    if extracted_memory:
        print(
            "Memory updated:",
            extracted_memory
        )


    # -----------------------------------------------------
    # 3. Handle direct name memory
    #
    # Example:
    # "My name is Kaushal"
    # -----------------------------------------------------

    message_lower = user_message.lower().strip()

    if message_lower.startswith("my name is "):

        name = user_message[11:].strip()

        if name:

            remember(
                "name",
                name
            )

            reply = (
                f"Nice to meet you, {name}. "
                "I'll remember your name."
            )

            add_history(
                "assistant",
                reply
            )

            return reply


    # -----------------------------------------------------
    # 4. Handle name question
    # -----------------------------------------------------

    if "what is my name" in message_lower:

        profile = get_profile()

        name = profile.get("name")

        if name:
            reply = f"Your name is {name}."

        else:
            reply = "I don't know your name yet."

        add_history(
            "assistant",
            reply
        )

        return reply


    # -----------------------------------------------------
    # 5. Get current user profile
    # -----------------------------------------------------

    profile = get_profile()


    # -----------------------------------------------------
    # 6. Build MAX personality prompt
    # -----------------------------------------------------

    system_prompt = build_system_prompt(
        profile
    )


    # -----------------------------------------------------
    # 7. Get conversation history
    # -----------------------------------------------------

    history = get_history()


    # -----------------------------------------------------
    # 8. Build messages for OpenRouter
    # -----------------------------------------------------

    use_gemini = bool(GEMINI_API_KEY)
    
    if use_gemini:
        api_url = GEMINI_URL
        api_key = GEMINI_API_KEY
        model_name = GEMINI_MODEL
    else:
        api_url = OPENROUTER_URL
        api_key = OPENROUTER_API_KEY
        model_name = OPENROUTER_MODEL

    if not api_key:
        return (
            "MAX Error: "
            "No API key configured (neither Gemini nor OpenRouter)."
        )

    # Perform background search intent detection
    if await should_search_web(user_message, api_url, api_key, model_name):
        print(f"Web search triggered for: {user_message}")

        loop = asyncio.get_running_loop()
        results_text = await loop.run_in_executor(None, search_web, user_message)

        system_prompt += (
            f"\n\n[Web Search Results for '{user_message}']:\n{results_text}\n"
            "(Use these real-time search results to answer the user's prompt accurately.)"
        )

    messages = [
        {
            "role": "system",
            "content": system_prompt
        }
    ]


    # Add conversation history

    for item in history:

        role = item.get("role")

        message = item.get("message")

        if role in ["user", "assistant"] and message:

            messages.append(
                {
                    "role": role,
                    "content": message
                }
            )

    # Format the current user message (the last one) for vision if an image is provided
    if image_b64 and messages and messages[-1]["role"] == "user":
        messages[-1]["content"] = [
            {"type": "text", "text": messages[-1]["content"]},
            {"type": "image_url", "image_url": {"url": image_b64}}
        ]


    # -----------------------------------------------------
    # 9. Send request to OpenRouter/Gemini
    # -----------------------------------------------------


    # -----------------------------------------------------
    # 10. Send request to OpenRouter
    # -----------------------------------------------------

    try:

        async with httpx.AsyncClient() as client:
            response = await client.post(
                api_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_name,
                    "messages": messages
                },
                timeout=60.0
            )


        # -------------------------------------------------
        # 11. Convert response to JSON
        # -------------------------------------------------

        data = response.json()
        if isinstance(data, list):
            data = data[0] if data else {}


        # -------------------------------------------------
        # 12. Handle OpenRouter errors
        # -------------------------------------------------

        if response.status_code != 200:

            print(
                "OpenRouter error:",
                data
            )

            error_message = (
                data
                .get("error", {})
                .get(
                    "message",
                    "Unknown OpenRouter error"
                )
            )

            return (
                f"MAX Error: {error_message}"
            )


        # -------------------------------------------------
        # 13. Validate response
        # -------------------------------------------------

        if "choices" not in data:

            print(
                "Unexpected OpenRouter response:",
                data
            )

            return (
                "MAX Error: "
                "Invalid response received "
                "from OpenRouter."
            )


        # -------------------------------------------------
        # 14. Extract AI response
        # -------------------------------------------------

        reply = (
            data["choices"][0]
            ["message"]
            ["content"]
        )


        if not reply:

            return (
                "MAX Error: "
                "The AI returned an empty response."
            )


        # -------------------------------------------------
        # 15. Save MAX response
        # -------------------------------------------------

        add_history(
            "assistant",
            reply
        )


        # -------------------------------------------------
        # 16. Return response
        # -------------------------------------------------

        return reply


    # -----------------------------------------------------
    # 17. Handle timeout
    # -----------------------------------------------------

    except httpx.TimeoutException:

        return (
            "MAX Error: "
            "OpenRouter request timed out."
        )


    # -----------------------------------------------------
    # 18. Handle connection error
    # -----------------------------------------------------

    except httpx.ConnectError:

        return (
            "MAX Error: "
            "Could not connect to OpenRouter."
        )


    # -----------------------------------------------------
    # 19. Handle other request errors
    # -----------------------------------------------------

    except httpx.RequestError as e:

        print(
            "Request error:",
            e
        )

        return (
            "MAX Error: "
            "Network request failed."
        )


    # -----------------------------------------------------
    # 20. Handle unexpected errors
    # -----------------------------------------------------

    except Exception as e:

        print(
            "Unexpected AI engine error:",
            e
        )

        return (
            "MAX Error: "
            "Something went wrong while "
            "processing your request."
        )

