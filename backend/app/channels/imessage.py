import logging
from typing import Callable, Awaitable

import httpx

from app.channels.base import BaseChannel
from app.config import settings

logger = logging.getLogger(__name__)


class IMessageChannel(BaseChannel):
    """BlueBubbles adapter for iMessage."""

    platform = "imessage"

    def __init__(self):
        self.base_url = settings.bluebubbles_url.rstrip("/")
        self.password = settings.bluebubbles_password

    def _params(self) -> dict:
        return {"password": self.password}

    async def send_message(self, chat_id: str, text: str) -> None:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/message/text",
                params=self._params(),
                json={
                    "chatGuid": chat_id,
                    "message": text,
                    "method": "apple-script",
                },
            )
            response.raise_for_status()
            logger.info(f"Sent iMessage to {chat_id}")

    async def send_reaction(self, message_id: str, emoji: str) -> None:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/message/{message_id}/react",
                params=self._params(),
                json={"reaction": emoji},
            )
            response.raise_for_status()
            logger.info(f"Reacted to {message_id} with {emoji}")

    async def register_webhook(self, callback: Callable[..., Awaitable]) -> None:
        # BlueBubbles uses HTTP webhooks configured in its UI
        # The webhook endpoint is /api/webhooks/bluebubbles
        logger.info("BlueBubbles webhook should be configured to POST to /api/webhooks/bluebubbles")
