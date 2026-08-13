from ddgs import DDGS

def search_web(query: str, max_results: int = 3) -> str:
    """
    Searches the web using DuckDuckGo and formats the results into a readable string.
    """
    try:
        results = DDGS().text(query, max_results=max_results)
        
        if not results:
            return "No search results found."

        formatted_results = []
        for index, result in enumerate(results):
            title = result.get('title', 'No Title')
            href = result.get('href', 'No URL')
            body = result.get('body', 'No Content')
            
            formatted_results.append(
                f"[{index + 1}] {title}\nURL: {href}\nSnippet: {body}"
            )
            
        return "\n\n".join(formatted_results)
        
    except Exception as e:
        print(f"Web search error: {e}")
        return f"Web search failed: {e}"

if __name__ == "__main__":
    print(search_web("What is the capital of France?"))
