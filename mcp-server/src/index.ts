import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { searchChats, searchChatsSchema } from "./tools/search-chats.js";
import { getEvents, getEventsSchema } from "./tools/get-events.js";
import { getDecisions, getDecisionsSchema } from "./tools/get-decisions.js";
import { getContext, getContextSchema } from "./tools/get-context.js";
import { query } from "./db.js";

const server = new McpServer({
  name: "grid",
  version: "0.1.0",
});

server.tool(
  "search_chats",
  "Search across all chat history from iMessage, Slack, and Discord",
  searchChatsSchema.shape,
  async (params) => {
    const results = await searchChats(searchChatsSchema.parse(params));
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "get_events",
  "List tracked events and hackathons with dates and links",
  getEventsSchema.shape,
  async (params) => {
    const results = await getEvents(getEventsSchema.parse(params));
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "get_decisions",
  "Extract decisions and agreements from conversations",
  getDecisionsSchema.shape,
  async (params) => {
    const results = await getDecisions(getDecisionsSchema.parse(params));
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "get_project_context",
  "Get all discussion context about a specific project or topic",
  getContextSchema.shape,
  async (params) => {
    const results = await getContext(getContextSchema.parse(params));
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "get_reminders",
  "List upcoming reminders and deadlines",
  { limit: { type: "number", description: "Max results" } } as any,
  async (params) => {
    const rows = await query(
      `SELECT r.id, r.message, r.remind_at, r.platform, r.chat_id, r.sent,
              e.title as event_title, e.url as event_url
       FROM reminders r
       LEFT JOIN events e ON r.event_id = e.id
       WHERE r.sent = false
       ORDER BY r.remind_at ASC
       LIMIT $1`,
      [(params as any).limit || 20]
    );
    return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
