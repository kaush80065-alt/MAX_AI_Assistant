import httpx
import os
import dotenv

dotenv.load_dotenv('.env')

key = os.getenv('OPENROUTER_API_KEY')

models_to_test = [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemini-exp-1206:free',
    'google/gemma-2-9b-it:free',
    'mistralai/mistral-7b-instruct:free',
    'openrouter/free'
]

print(f"Key: {key[:5]}...")

for model in models_to_test:
    print(f"\\nTesting model: {model}")
    try:
        response = httpx.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={'Authorization': f'Bearer {key}'},
            json={'model': model, 'messages': [{'role': 'user', 'content': 'test'}]}
        )
        print("Status:", response.status_code)
        
        if response.status_code == 200:
            print("Success!")
        else:
            print("Body:", response.text)
    except Exception as e:
        print(e)
