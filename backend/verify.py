import httpx
import asyncio

async def test():
    # 1x1 white pixel base64
    image_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
    
    payload = {
        "message": "What color is this image?",
        "image": image_b64
    }
    
    print("Sending request to /chat...")
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://127.0.0.1:8000/chat",
            json=payload,
            timeout=30.0
        )
    
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())

if __name__ == "__main__":
    asyncio.run(test())
