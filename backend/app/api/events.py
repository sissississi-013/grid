import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.event import Event

router = APIRouter(prefix="/events", tags=["events"])


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    url: str | None = None
    deadline: datetime | None = None
    event_date: datetime | None = None
    source_message_id: uuid.UUID | None = None
    status: str = "discovered"


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    url: str | None = None
    deadline: datetime | None = None
    event_date: datetime | None = None
    status: str | None = None


class EventResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    url: str | None
    deadline: datetime | None
    event_date: datetime | None
    source_message_id: uuid.UUID | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[EventResponse])
async def list_events(status: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Event).order_by(desc(Event.created_at))
    if status:
        query = query.where(Event.status == status)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=EventResponse, status_code=201)
async def create_event(data: EventCreate, db: AsyncSession = Depends(get_db)):
    event = Event(**data.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(event_id: uuid.UUID, data: EventUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(event, key, value)
    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
