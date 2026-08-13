import httpx
import os
import dotenv

dotenv.load_dotenv('.env')
key = os.getenv('OPENROUTER_API_KEY')

models = [
    'google/gemma-4-31b-it:free',
    'openrouter/free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
]

image_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="

for model in models:
    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What color is this?"},
                    {"type": "image_url", "image_url": {"url": image_b64}}
                ]
            }
        ]
    }
    
    print(f"\\nTesting {model}...")
    try:
        response = httpx.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={'Authorization': f'Bearer {key}'},
            json=payload,
            timeout=10.0
        )
        print("Status:", response.status_code)
        print("Response:", response.text[:200])
    except Exception as e:
        print("Error:", e)
