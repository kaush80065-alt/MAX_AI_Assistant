import httpx
import asyncio

async def test():
    payload = {
        "message": "What is the weather in Tokyo today?"
    }
    print("Testing chat endpoint for search trigger...")
    async with httpx.AsyncClient() as client:
        response = await client.post("http://127.0.0.1:8000/chat", json=payload, timeout=60.0)
    print("Response:")
    print(response.json())

if __name__ == "__main__":
    asyncio.run(test())
