from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from app.models.message import Message


@dataclass
class ChatContext:
    recent_messages: list[dict] = field(default_factory=list)
    chat_id: str = ""
    platform: str = ""


@dataclass
class AgentAction:
    type: str  # "reply", "react", "schedule_reminder", "create_event"
    data: dict = field(default_factory=dict)


@dataclass
class AgentResponse:
    actions: list[AgentAction] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)


class BaseAgent(ABC):
    name: str
    system_prompt: str
    is_active: bool = True

    def __init__(self, name: str, system_prompt: str):
        self.name = name
        self.system_prompt = system_prompt

    @abstractmethod
    async def should_activate(self, message: Message, context: ChatContext) -> bool:
        """Decide if this agent should handle this message."""

    @abstractmethod
    async def process(self, message: Message, context: ChatContext) -> AgentResponse:
        """Process message and return actions."""
