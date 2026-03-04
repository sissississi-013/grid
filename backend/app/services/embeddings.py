import httpx

from app.config import settings


async def get_embedding(text: str) -> list[float]:
    """Get embedding vector for text using Anthropic's Voyage embeddings via API.

    Note: Switch to a different embedding provider if needed.
    For now, uses a simple approach with the Anthropic API.
    """
    # Using Voyage AI embeddings (recommended by Anthropic)
    # You'll need to set up a Voyage API key or use another embedding provider
    # For development, we can use a placeholder
    # In production, replace with actual embedding API call

    # Placeholder: return zero vector for development
    # TODO: Integrate actual embedding provider (Voyage AI, OpenAI, etc.)
    return [0.0] * 1536


async def search_similar(query_embedding: list[float], db_session, limit: int = 10):
    """Search for messages with similar embeddings using pgvector."""
    from sqlalchemy import text

    result = await db_session.execute(
        text("""
            SELECT id, content, platform, chat_id, sender_name, timestamp,
                   embedding <=> :embedding::vector AS distance
            FROM messages
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> :embedding::vector
            LIMIT :limit
        """),
        {"embedding": str(query_embedding), "limit": limit},
    )
    return [dict(row._mapping) for row in result.all()]
