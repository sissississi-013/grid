from app.agents.base import BaseAgent, AgentAction, AgentResponse, ChatContext
from app.models.message import Message
from app.services.claude import chat

REMINDER_KEYWORDS = ["remind", "reminder", "don't forget", "due", "by tomorrow", "next week"]


class ReminderAgent(BaseAgent):
    """Tracks discussed events/deadlines and sends reminders."""

    def __init__(self, system_prompt: str):
        super().__init__(name="reminder", system_prompt=system_prompt)

    async def should_activate(self, message: Message, context: ChatContext) -> bool:
        content = (message.content or "").lower()
        return any(kw in content for kw in REMINDER_KEYWORDS)

    async def process(self, message: Message, context: ChatContext) -> AgentResponse:
        response = await chat(
            system_prompt=self.system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Extract reminder information from this message. "
                        f"Return JSON with: message (reminder text), remind_at (ISO datetime). "
                        f"If no reminder is needed, return null.\n\n"
                        f"Message: {message.content}"
                    ),
                }
            ],
        )

        reply_text = response["content"][0].text
        actions = []

        if "null" not in reply_text.lower():
            actions.append(AgentAction(type="schedule_reminder", data={"raw_response": reply_text}))

        return AgentResponse(actions=actions, metadata={"usage": response["usage"]})
