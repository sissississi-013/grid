import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.prompt import Prompt

router = APIRouter(prefix="/prompts", tags=["prompts"])


class PromptCreate(BaseModel):
    name: str
    system_prompt: str
    trigger_type: str = "always"
    trigger_config: dict | None = None
    platform_scope: list[str] | None = None
    is_active: bool = True


class PromptUpdate(BaseModel):
    name: str | None = None
    system_prompt: str | None = None
    trigger_type: str | None = None
    trigger_config: dict | None = None
    platform_scope: list[str] | None = None
    is_active: bool | None = None


class PromptResponse(BaseModel):
    id: uuid.UUID
    name: str
    system_prompt: str
    trigger_type: str
    trigger_config: dict | None
    platform_scope: list[str] | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[PromptResponse])
async def list_prompts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prompt).order_by(Prompt.updated_at.desc()))
    return result.scalars().all()


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(prompt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prompt).where(Prompt.id == prompt_id))
    prompt = result.scalar_one_or_none()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt


@router.post("/", response_model=PromptResponse, status_code=201)
async def create_prompt(data: PromptCreate, db: AsyncSession = Depends(get_db)):
    prompt = Prompt(**data.model_dump())
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)
    return prompt


@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(prompt_id: uuid.UUID, data: PromptUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prompt).where(Prompt.id == prompt_id))
    prompt = result.scalar_one_or_none()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(prompt, key, value)
    prompt.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(prompt)
    return prompt


@router.delete("/{prompt_id}", status_code=204)
async def delete_prompt(prompt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Prompt).where(Prompt.id == prompt_id))
    prompt = result.scalar_one_or_none()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    await db.delete(prompt)
    await db.commit()
