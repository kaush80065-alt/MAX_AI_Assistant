import httpx
import os
import dotenv

dotenv.load_dotenv('.env')

key = os.getenv('OPENROUTER_API_KEY')
model = 'nvidia/nemotron-nano-12b-v2-vl:free'

image_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="

payload = {
    "model": model,
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is this?"},
                {"type": "image_url", "image_url": {"url": image_b64}}
            ]
        }
    ]
}

print(f"Testing {model}...")
try:
    response = httpx.post(
        'https://openrouter.ai/api/v1/chat/completions',
        headers={'Authorization': f'Bearer {key}'},
        json=payload
    )
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print(e)
