from abc import ABC, abstractmethod
from typing import Callable, Awaitable


class BaseChannel(ABC):
    """Abstract interface for messaging platform adapters."""

    platform: str

    @abstractmethod
    async def send_message(self, chat_id: str, text: str) -> None:
        """Send a text message to a chat."""

    @abstractmethod
    async def send_reaction(self, message_id: str, emoji: str) -> None:
        """Add an emoji reaction to a message."""

    @abstractmethod
    async def register_webhook(self, callback: Callable[..., Awaitable]) -> None:
        """Register a callback for incoming messages."""
