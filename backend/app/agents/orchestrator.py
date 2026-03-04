import asyncio
import logging

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import BaseAgent, AgentResponse, ChatContext
from app.agents.interaction import InteractionAgent
from app.agents.event_scout import EventScoutAgent
from app.agents.reminder import ReminderAgent
from app.agents.reactor import ReactorAgent
from app.models.message import Message
from app.models.prompt import Prompt
from app.models.agent_config import AgentConfig

logger = logging.getLogger(__name__)

AGENT_CLASSES = {
    "interaction": InteractionAgent,
    "event_scout": EventScoutAgent,
    "reminder": ReminderAgent,
    "reactor": ReactorAgent,
}

DEFAULT_PROMPTS = {
    "interaction": "You are Grid, a helpful AI assistant in a group chat. Be concise, friendly, and useful.",
    "event_scout": "You are an event scout. Extract event details from messages accurately. Return valid JSON.",
    "reminder": "You are a reminder assistant. Extract reminder details from messages. Return valid JSON with ISO dates.",
    "reactor": "You pick creative and contextually appropriate emoji reactions for messages.",
}


class Orchestrator:
    """Routes incoming messages to the right agent(s) based on content."""

    def __init__(self):
        self.agents: list[BaseAgent] = []

    async def load_agents(self, db: AsyncSession):
        """Load agent configurations from the database."""
        self.agents = []

        result = await db.execute(select(AgentConfig).where(AgentConfig.is_active.is_(True)))
        configs = result.scalars().all()

        for config in configs:
            agent_class = AGENT_CLASSES.get(config.agent_type)
            if not agent_class:
                logger.warning(f"Unknown agent type: {config.agent_type}")
                continue

            # Load prompt from DB
            system_prompt = DEFAULT_PROMPTS.get(config.agent_type, "")
            if config.prompt_id:
                prompt_result = await db.execute(select(Prompt).where(Prompt.id == config.prompt_id))
                prompt = prompt_result.scalar_one_or_none()
                if prompt and prompt.is_active:
                    system_prompt = prompt.system_prompt

            self.agents.append(agent_class(system_prompt=system_prompt))

        # If no agents configured, load defaults
        if not self.agents:
            for agent_type, agent_class in AGENT_CLASSES.items():
                self.agents.append(agent_class(system_prompt=DEFAULT_PROMPTS[agent_type]))

    async def _build_context(self, message: Message, db: AsyncSession) -> ChatContext:
        """Build chat context with recent messages."""
        result = await db.execute(
            select(Message)
            .where(Message.chat_id == message.chat_id)
            .order_by(desc(Message.timestamp))
            .limit(20)
        )
        recent = result.scalars().all()

        return ChatContext(
            recent_messages=[
                {"role": "user", "content": m.content or ""}
                for m in reversed(recent)
                if m.id != message.id
            ],
            chat_id=message.chat_id,
            platform=message.platform,
        )

    async def route(self, message: Message, db: AsyncSession) -> list[AgentResponse]:
        """Route a message to all applicable agents."""
        if not self.agents:
            await self.load_agents(db)

        context = await self._build_context(message, db)

        # Check which agents should activate (in parallel)
        activation_results = await asyncio.gather(
            *[agent.should_activate(message, context) for agent in self.agents],
            return_exceptions=True,
        )

        active_agents = [
            agent
            for agent, should_activate in zip(self.agents, activation_results)
            if should_activate is True
        ]

        if not active_agents:
            return []

        # Process with all active agents (in parallel)
        responses = await asyncio.gather(
            *[agent.process(message, context) for agent in active_agents],
            return_exceptions=True,
        )

        return [r for r in responses if isinstance(r, AgentResponse)]
