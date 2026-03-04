from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.message import Message

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/bluebubbles")
async def bluebubbles_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive incoming iMessage events from BlueBubbles."""
    payload = await request.json()
    event_type = payload.get("type")

    if event_type == "new-message":
        data = payload.get("data", {})
        message = Message(
            platform="imessage",
            chat_id=data.get("chats", [{}])[0].get("guid", "unknown"),
            sender_id=data.get("handle", {}).get("address", "unknown"),
            sender_name=data.get("handle", {}).get("name"),
            content=data.get("text"),
            metadata_={"bluebubbles_guid": data.get("guid")},
        )
        db.add(message)
        await db.commit()

        # TODO: Route to agent orchestrator
        return {"status": "processed"}

    return {"status": "ignored", "event_type": event_type}


@router.post("/slack")
async def slack_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive incoming Slack events."""
    payload = await request.json()

    # Handle Slack URL verification challenge
    if payload.get("type") == "url_verification":
        return {"challenge": payload["challenge"]}

    event = payload.get("event", {})
    if event.get("type") == "message" and not event.get("bot_id"):
        message = Message(
            platform="slack",
            chat_id=event.get("channel", ""),
            sender_id=event.get("user", ""),
            content=event.get("text"),
            metadata_={"slack_ts": event.get("ts")},
        )
        db.add(message)
        await db.commit()

        # TODO: Route to agent orchestrator
        return {"status": "processed"}

    return {"status": "ignored"}
