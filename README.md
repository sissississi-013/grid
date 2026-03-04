# Grid

AI agent that lives in your group chats. It scouts events, tracks deadlines, sends reminders, reacts to messages, and exposes all chat data via MCP + REST API.

Works across iMessage, Slack, and Discord.

## Architecture

```
Dashboard (Next.js) --> Backend API (FastAPI) --> Neon Postgres + pgvector
                              |
               BlueBubbles / Slack / Discord
                              |
                     Agent Orchestrator
                   /    |       |      \
            Interaction  Event   Reminder  Reactor
              Agent     Scout    Agent     Agent
```

**Agents** run in parallel on every incoming message. Each has its own system prompt (editable from the dashboard) and activation logic. The orchestrator fans out, collects actions (reply, react, create event, schedule reminder), and dispatches them through the appropriate channel adapter.

## Stack

| Layer | Tech |
|-------|------|
| Dashboard | Next.js 15, Tailwind, shadcn/ui |
| Backend | Python FastAPI |
| AI | Claude (Anthropic SDK) |
| Database | Neon Postgres + pgvector |
| iMessage | BlueBubbles REST API |
| Slack | Slack Web API |
| Discord | Discord Bot API |
| Data API | MCP Server (TypeScript) |
| Jobs | Celery + Redis |

## Project Structure

```
grid/
├── backend/          # FastAPI app
│   ├── app/
│   │   ├── agents/   # Orchestrator + 4 specialized agents
│   │   ├── api/      # REST endpoints (prompts, agents, messages, events, webhooks)
│   │   ├── channels/ # Platform adapters (iMessage, Slack, Discord)
│   │   ├── services/ # Claude wrapper, embeddings, scheduler
│   │   └── db/       # Neon HTTP connection
│   └── Dockerfile
├── dashboard/        # Next.js web app
│   ├── app/          # Pages: overview, prompts, agents, chats, events
│   └── lib/          # API client
├── mcp-server/       # MCP server for AI tool access to chat data
│   └── src/tools/    # search-chats, get-events, get-decisions, get-context
└── docker-compose.yml
```

## Setup

### Backend

```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in your keys
uvicorn app.main:app --reload
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

### MCP Server

```bash
cd mcp-server
npm install
NEON_DATABASE_URL="your-connection-string" npm run dev
```

### Environment Variables

```
DATABASE_URL          # Neon Postgres connection string
ANTHROPIC_API_KEY     # Claude API key
REDIS_URL             # Redis for Celery jobs
BLUEBUBBLES_URL       # BlueBubbles server address
BLUEBUBBLES_PASSWORD  # BlueBubbles server password
SLACK_BOT_TOKEN       # Slack bot OAuth token
DISCORD_BOT_TOKEN     # Discord bot token
```

## Dashboard

The web dashboard at `localhost:3000` lets you:

- **Prompts** -- Create and edit agent system prompts. Changes take effect immediately.
- **Agents** -- Toggle agents on/off, assign custom prompts.
- **Chats** -- Browse conversations across all platforms.
- **Events** -- Track discovered events, mark interest, manage deadlines.

## Agents

| Agent | Does |
|-------|------|
| Interaction | Responds when mentioned. Uses your custom prompt. |
| Event Scout | Detects hackathon/event mentions, extracts details. |
| Reminder | Picks up deadlines, schedules reminders. |
| Reactor | Adds emoji reactions to messages. |

## MCP Tools

The MCP server exposes chat data to AI coding tools:

- `search_chats` -- Semantic search across all chat history
- `get_events` -- List tracked events with dates and links
- `get_decisions` -- Extract decisions from conversations
- `get_project_context` -- Get discussion context for a topic
- `get_reminders` -- List upcoming reminders
