from anthropic import AsyncAnthropic

from app.config import settings


client = AsyncAnthropic(api_key=settings.anthropic_api_key)


async def chat(
    system_prompt: str,
    messages: list[dict],
    model: str = "claude-sonnet-4-20250514",
    max_tokens: int = 1024,
    tools: list[dict] | None = None,
) -> dict:
    """Send a message to Claude and return the response."""
    kwargs = {
        "model": model,
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": messages,
    }
    if tools:
        kwargs["tools"] = tools

    response = await client.messages.create(**kwargs)
    return {
        "content": response.content,
        "stop_reason": response.stop_reason,
        "usage": {"input_tokens": response.usage.input_tokens, "output_tokens": response.usage.output_tokens},
    }


async def classify(text: str, categories: list[str]) -> str:
    """Use Claude to classify text into one of the given categories."""
    response = await chat(
        system_prompt="You are a text classifier. Respond with ONLY the category name, nothing else.",
        messages=[
            {
                "role": "user",
                "content": f"Classify this text into one of these categories: {', '.join(categories)}\n\nText: {text}",
            }
        ],
        max_tokens=50,
    )
    return response["content"][0].text.strip()
