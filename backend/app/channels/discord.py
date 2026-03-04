import logging
from typing import Callable, Awaitable

import httpx

from app.channels.base import BaseChannel
from app.config import settings

logger = logging.getLogger(__name__)

DISCORD_API = "https://discord.com/api/v10"


class DiscordChannel(BaseChannel):
    """Discord adapter using the Bot API."""

    platform = "discord"

    def __init__(self):
        self.token = settings.discord_bot_token

    def _headers(self) -> dict:
        return {"Authorization": f"Bot {self.token}", "Content-Type": "application/json"}

    async def send_message(self, chat_id: str, text: str) -> None:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DISCORD_API}/channels/{chat_id}/messages",
                headers=self._headers(),
                json={"content": text},
            )
            response.raise_for_status()
            logger.info(f"Sent Discord message to {chat_id}")

    async def send_reaction(self, message_id: str, emoji: str) -> None:
        # message_id format: "channel_id:message_id"
        parts = message_id.split(":", 1)
        if len(parts) != 2:
            logger.error(f"Invalid Discord message_id format: {message_id}")
            return

        channel_id, msg_id = parts
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{DISCORD_API}/channels/{channel_id}/messages/{msg_id}/reactions/{emoji}/@me",
                headers=self._headers(),
            )
            response.raise_for_status()

    async def register_webhook(self, callback: Callable[..., Awaitable]) -> None:
        # Discord uses Gateway (websocket) for events
        # For webhook-based approach, use Discord Interactions endpoint
        logger.info("Discord bot should be started separately with discord.py gateway connection")
