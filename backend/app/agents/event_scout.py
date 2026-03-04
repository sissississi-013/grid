import re

from app.agents.base import BaseAgent, AgentAction, AgentResponse, ChatContext
from app.models.message import Message
from app.services.claude import chat

EVENT_KEYWORDS = [
    "hackathon", "conference", "meetup", "workshop", "event",
    "deadline", "registration", "sign up", "rsvp", "tickets",
]


class EventScoutAgent(BaseAgent):
    """Monitors chats for event/hackathon mentions."""

    def __init__(self, system_prompt: str):
        super().__init__(name="event_scout", system_prompt=system_prompt)

    async def should_activate(self, message: Message, context: ChatContext) -> bool:
        content = (message.content or "").lower()
        return any(kw in content for kw in EVENT_KEYWORDS)

    async def process(self, message: Message, context: ChatContext) -> AgentResponse:
        response = await chat(
            system_prompt=self.system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Extract event information from this message. "
                        f"If it mentions an event, hackathon, or deadline, return JSON with: "
                        f"title, description, url (if any), event_date (if any), deadline (if any). "
                        f"If no event is found, return null.\n\n"
                        f"Message: {message.content}"
                    ),
                }
            ],
        )

        reply_text = response["content"][0].text
        actions = []

        # Try to parse event data from response
        if "null" not in reply_text.lower():
            actions.append(AgentAction(type="create_event", data={"raw_response": reply_text}))

        return AgentResponse(actions=actions, metadata={"usage": response["usage"]})
