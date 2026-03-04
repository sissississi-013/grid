import logging
from typing import Callable, Awaitable

import httpx

from app.channels.base import BaseChannel
from app.config import settings

logger = logging.getLogger(__name__)


class SlackChannel(BaseChannel):
    """Slack adapter using the Web API."""

    platform = "slack"

    def __init__(self):
        self.token = settings.slack_bot_token

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    async def send_message(self, chat_id: str, text: str) -> None:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://slack.com/api/chat.postMessage",
                headers=self._headers(),
                json={"channel": chat_id, "text": text},
            )
            data = response.json()
            if not data.get("ok"):
                logger.error(f"Slack send failed: {data.get('error')}")
            else:
                logger.info(f"Sent Slack message to {chat_id}")

    async def send_reaction(self, message_id: str, emoji: str) -> None:
        # message_id format: "channel:timestamp"
        parts = message_id.split(":", 1)
        if len(parts) != 2:
            logger.error(f"Invalid Slack message_id format: {message_id}")
            return

        channel, ts = parts
        emoji_name = emoji.strip(":")  # Remove colons if present
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://slack.com/api/reactions.add",
                headers=self._headers(),
                json={"channel": channel, "timestamp": ts, "name": emoji_name},
            )
            data = response.json()
            if not data.get("ok"):
                logger.error(f"Slack reaction failed: {data.get('error')}")

    async def register_webhook(self, callback: Callable[..., Awaitable]) -> None:
        # Slack uses Events API configured in the Slack app dashboard
        # The webhook endpoint is /api/webhooks/slack
        logger.info("Slack webhook should be configured via Events API to POST to /api/webhooks/slack")
