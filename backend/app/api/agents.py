import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.agent_config import AgentConfig

router = APIRouter(prefix="/agents", tags=["agents"])


class AgentConfigCreate(BaseModel):
    agent_type: str
    prompt_id: uuid.UUID | None = None
    settings: dict | None = None
    is_active: bool = True


class AgentConfigUpdate(BaseModel):
    prompt_id: uuid.UUID | None = None
    settings: dict | None = None
    is_active: bool | None = None


class AgentConfigResponse(BaseModel):
    id: uuid.UUID
    agent_type: str
    prompt_id: uuid.UUID | None
    settings: dict | None
    is_active: bool

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[AgentConfigResponse])
async def list_agents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentConfig))
    return result.scalars().all()


@router.get("/{agent_id}", response_model=AgentConfigResponse)
async def get_agent(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentConfig).where(AgentConfig.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent config not found")
    return agent


@router.post("/", response_model=AgentConfigResponse, status_code=201)
async def create_agent(data: AgentConfigCreate, db: AsyncSession = Depends(get_db)):
    agent = AgentConfig(**data.model_dump())
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.put("/{agent_id}", response_model=AgentConfigResponse)
async def update_agent(agent_id: uuid.UUID, data: AgentConfigUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentConfig).where(AgentConfig.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent config not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(agent, key, value)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentConfig).where(AgentConfig.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent config not found")
    await db.delete(agent)
    await db.commit()
