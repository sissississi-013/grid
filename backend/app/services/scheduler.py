from celery import Celery

from app.config import settings

celery_app = Celery("grid", broker=settings.redis_url, backend=settings.redis_url)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "check-reminders": {
            "task": "app.services.scheduler.check_reminders",
            "schedule": 60.0,  # Every minute
        },
    },
)


@celery_app.task
def check_reminders():
    """Check for pending reminders that need to be sent."""
    import asyncio
    asyncio.run(_check_reminders())


async def _check_reminders():
    from datetime import datetime, timezone
    from sqlalchemy import select, update
    from app.db.database import async_session
    from app.models.reminder import Reminder
    from app.channels.imessage import IMessageChannel
    from app.channels.slack import SlackChannel
    from app.channels.discord import DiscordChannel

    channels = {
        "imessage": IMessageChannel(),
        "slack": SlackChannel(),
        "discord": DiscordChannel(),
    }

    async with async_session() as db:
        result = await db.execute(
            select(Reminder).where(
                Reminder.sent.is_(False),
                Reminder.remind_at <= datetime.now(timezone.utc),
            )
        )
        reminders = result.scalars().all()

        for reminder in reminders:
            channel = channels.get(reminder.platform)
            if channel:
                try:
                    await channel.send_message(reminder.chat_id, reminder.message)
                    reminder.sent = True
                    await db.commit()
                except Exception as e:
                    print(f"Failed to send reminder {reminder.id}: {e}")
