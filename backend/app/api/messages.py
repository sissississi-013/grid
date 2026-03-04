import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.message import Message

router = APIRouter(prefix="/messages", tags=["messages"])


class MessageResponse(BaseModel):
    id: uuid.UUID
    platform: str
    chat_id: str
    sender_id: str
    sender_name: str | None
    content: str | None
    timestamp: datetime
    metadata_: dict | None = None

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[MessageResponse])
async def list_messages(
    chat_id: str | None = None,
    platform: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(Message).order_by(desc(Message.timestamp)).limit(limit).offset(offset)
    if chat_id:
        query = query.where(Message.chat_id == chat_id)
    if platform:
        query = query.where(Message.platform == platform)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/chats")
async def list_chats(db: AsyncSession = Depends(get_db)):
    """List all unique chat IDs with their platform and latest message timestamp."""
    from sqlalchemy import func, distinct

    query = (
        select(
            Message.chat_id,
            Message.platform,
            func.max(Message.timestamp).label("latest"),
            func.count(Message.id).label("message_count"),
        )
        .group_by(Message.chat_id, Message.platform)
        .order_by(desc("latest"))
    )
    result = await db.execute(query)
    return [
        {"chat_id": r.chat_id, "platform": r.platform, "latest": r.latest, "message_count": r.message_count}
        for r in result.all()
    ]
