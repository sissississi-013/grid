from app.agents.base import BaseAgent, AgentAction, AgentResponse, ChatContext
from app.models.message import Message
from app.services.claude import chat


class ReactorAgent(BaseAgent):
    """Reads messages and adds creative emoji reactions."""

    def __init__(self, system_prompt: str):
        super().__init__(name="reactor", system_prompt=system_prompt)
        self._message_count = 0

    async def should_activate(self, message: Message, context: ChatContext) -> bool:
        # React to roughly 1 in 5 messages to avoid being spammy
        self._message_count += 1
        return self._message_count % 5 == 0

    async def process(self, message: Message, context: ChatContext) -> AgentResponse:
        response = await chat(
            system_prompt=self.system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Pick a single emoji reaction for this message. "
                        f"Respond with ONLY the emoji, nothing else.\n\n"
                        f"Message: {message.content}"
                    ),
                }
            ],
            max_tokens=10,
        )

        emoji = response["content"][0].text.strip()
        return AgentResponse(
            actions=[AgentAction(type="react", data={"emoji": emoji})],
            metadata={"usage": response["usage"]},
        )
