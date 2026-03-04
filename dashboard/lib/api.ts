const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export interface Prompt {
  id: string;
  name: string;
  system_prompt: string;
  trigger_type: string;
  trigger_config: Record<string, unknown> | null;
  platform_scope: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentConfig {
  id: string;
  agent_type: string;
  prompt_id: string | null;
  settings: Record<string, unknown> | null;
  is_active: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  deadline: string | null;
  event_date: string | null;
  status: string;
  created_at: string;
}

export interface ChatSummary {
  chat_id: string;
  platform: string;
  latest: string;
  message_count: number;
}

export interface Message {
  id: string;
  platform: string;
  chat_id: string;
  sender_id: string;
  sender_name: string | null;
  content: string | null;
  timestamp: string;
}

// Prompts
export const getPrompts = (): Promise<Prompt[]> => fetchAPI("/prompts/");
export const getPrompt = (id: string): Promise<Prompt> => fetchAPI(`/prompts/${id}`);
export const createPrompt = (data: Partial<Prompt>): Promise<Prompt> =>
  fetchAPI("/prompts/", { method: "POST", body: JSON.stringify(data) });
export const updatePrompt = (id: string, data: Partial<Prompt>): Promise<Prompt> =>
  fetchAPI(`/prompts/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deletePrompt = (id: string): Promise<void> =>
  fetchAPI(`/prompts/${id}`, { method: "DELETE" });

// Agents
export const getAgents = (): Promise<AgentConfig[]> => fetchAPI("/agents/");
export const createAgent = (data: Partial<AgentConfig>): Promise<AgentConfig> =>
  fetchAPI("/agents/", { method: "POST", body: JSON.stringify(data) });
export const updateAgent = (id: string, data: Partial<AgentConfig>): Promise<AgentConfig> =>
  fetchAPI(`/agents/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteAgent = (id: string): Promise<void> =>
  fetchAPI(`/agents/${id}`, { method: "DELETE" });

// Messages
export const getMessages = (params?: { chat_id?: string; platform?: string; limit?: number }): Promise<Message[]> => {
  const searchParams = new URLSearchParams();
  if (params?.chat_id) searchParams.set("chat_id", params.chat_id);
  if (params?.platform) searchParams.set("platform", params.platform);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  return fetchAPI(`/messages/?${searchParams}`);
};
export const getChats = (): Promise<ChatSummary[]> => fetchAPI("/messages/chats");

// Events
export const getEvents = (status?: string): Promise<Event[]> =>
  fetchAPI(`/events/${status ? `?status=${status}` : ""}`);
export const createEvent = (data: Partial<Event>): Promise<Event> =>
  fetchAPI("/events/", { method: "POST", body: JSON.stringify(data) });
export const updateEvent = (id: string, data: Partial<Event>): Promise<Event> =>
  fetchAPI(`/events/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteEvent = (id: string): Promise<void> =>
  fetchAPI(`/events/${id}`, { method: "DELETE" });
