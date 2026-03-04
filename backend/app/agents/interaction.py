from app.agents.base import BaseAgent, AgentAction, AgentResponse, ChatContext
from app.models.message import Message
from app.services.claude import chat


class InteractionAgent(BaseAgent):
    """General conversation handler. Uses custom prompts from the dashboard."""

    def __init__(self, system_prompt: str):
        super().__init__(name="interaction", system_prompt=system_prompt)

    async def should_activate(self, message: Message, context: ChatContext) -> bool:
        # Activate when the bot is mentioned or in DMs
        content = (message.content or "").lower()
        return "grid" in content or "@grid" in content

    async def process(self, message: Message, context: ChatContext) -> AgentResponse:
        messages = [
            *[{"role": m["role"], "content": m["content"]} for m in context.recent_messages],
            {"role": "user", "content": message.content or ""},
        ]

        response = await chat(
            system_prompt=self.system_prompt,
            messages=messages,
        )

        reply_text = response["content"][0].text
        return AgentResponse(
            actions=[AgentAction(type="reply", data={"text": reply_text})],
            metadata={"usage": response["usage"]},
        )
