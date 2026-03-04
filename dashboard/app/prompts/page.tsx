"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  type Prompt,
} from "@/lib/api";

const TRIGGER_TYPES = ["always", "keyword", "regex", "ai_classify"];
const PLATFORMS = ["imessage", "slack", "discord"];

function PromptForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Prompt>;
  onSubmit: (data: Partial<Prompt>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [systemPrompt, setSystemPrompt] = useState(initial?.system_prompt || "");
  const [triggerType, setTriggerType] = useState(initial?.trigger_type || "always");
  const [triggerConfig, setTriggerConfig] = useState(
    initial?.trigger_config ? JSON.stringify(initial.trigger_config) : ""
  );
  const [platformScope, setPlatformScope] = useState<string[]>(
    initial?.platform_scope || []
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const togglePlatform = (p: string) => {
    setPlatformScope((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      system_prompt: systemPrompt,
      trigger_type: triggerType,
      trigger_config: triggerConfig ? JSON.parse(triggerConfig) : null,
      platform_scope: platformScope.length > 0 ? platformScope : null,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="system_prompt">System Prompt</Label>
        <Textarea
          id="system_prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={8}
          required
        />
      </div>
      <div>
        <Label htmlFor="trigger_type">Trigger Type</Label>
        <select
          id="trigger_type"
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          {TRIGGER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      {triggerType !== "always" && (
        <div>
          <Label htmlFor="trigger_config">Trigger Config (JSON)</Label>
          <Input
            id="trigger_config"
            value={triggerConfig}
            onChange={(e) => setTriggerConfig(e.target.value)}
            placeholder='{"keywords": ["hackathon", "event"]}'
          />
        </div>
      )}
      <div>
        <Label>Platform Scope</Label>
        <div className="flex gap-2 mt-1">
          {PLATFORMS.map((p) => (
            <Badge
              key={p}
              variant={platformScope.includes(p) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => togglePlatform(p)}
            >
              {p}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Leave empty for all platforms
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        <Label>Active</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial?.id ? "Update" : "Create"}</Button>
      </div>
    </form>
  );
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Prompt | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    getPrompts()
      .then(setPrompts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (data: Partial<Prompt>) => {
    await createPrompt(data);
    setCreating(false);
    load();
  };

  const handleUpdate = async (data: Partial<Prompt>) => {
    if (!editing) return;
    await updatePrompt(editing.id, data);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this prompt?")) return;
    await deletePrompt(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Prompts</h2>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>New Prompt</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Prompt</DialogTitle>
            </DialogHeader>
            <PromptForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : prompts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No prompts yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {prompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{prompt.name}</CardTitle>
                    <Badge variant={prompt.is_active ? "default" : "secondary"}>
                      {prompt.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{prompt.trigger_type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Dialog
                      open={editing?.id === prompt.id}
                      onOpenChange={(open) => !open && setEditing(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(prompt)}
                        >
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Prompt</DialogTitle>
                        </DialogHeader>
                        {editing && (
                          <PromptForm
                            initial={editing}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditing(null)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(prompt.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {prompt.system_prompt}
                </pre>
                {prompt.platform_scope && prompt.platform_scope.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {prompt.platform_scope.map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
