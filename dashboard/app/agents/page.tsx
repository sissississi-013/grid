"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getAgents,
  getPrompts,
  createAgent,
  updateAgent,
  deleteAgent,
  type AgentConfig,
  type Prompt,
} from "@/lib/api";

const AGENT_TYPES = ["interaction", "event_scout", "reminder", "reactor"];

const AGENT_DESCRIPTIONS: Record<string, string> = {
  interaction: "General conversation handler with custom personality",
  event_scout: "Monitors chats for event and hackathon mentions",
  reminder: "Tracks deadlines and sends reminders",
  reactor: "Adds creative emoji reactions to messages",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState(AGENT_TYPES[0]);
  const [newPromptId, setNewPromptId] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([getAgents(), getPrompts()])
      .then(([a, p]) => {
        setAgents(a);
        setPrompts(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    await createAgent({
      agent_type: newType,
      prompt_id: newPromptId || null,
      is_active: true,
    });
    setCreating(false);
    load();
  };

  const handleToggle = async (agent: AgentConfig) => {
    await updateAgent(agent.id, { is_active: !agent.is_active });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    await deleteAgent(id);
    load();
  };

  const getPromptName = (id: string | null) => {
    if (!id) return "Default";
    const p = prompts.find((p) => p.id === id);
    return p?.name || "Unknown";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Agents</h2>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>New Agent</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Agent Type</Label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  {AGENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {AGENT_DESCRIPTIONS[newType]}
                </p>
              </div>
              <div>
                <Label>Prompt</Label>
                <select
                  value={newPromptId}
                  onChange={(e) => setNewPromptId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Default prompt</option>
                  {prompts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No agents configured. Default agents will be used automatically.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base capitalize">
                      {agent.agent_type.replace("_", " ")}
                    </CardTitle>
                    <Badge variant={agent.is_active ? "default" : "secondary"}>
                      {agent.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={agent.is_active}
                      onCheckedChange={() => handleToggle(agent)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(agent.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {AGENT_DESCRIPTIONS[agent.agent_type]}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Prompt: {getPromptName(agent.prompt_id)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
