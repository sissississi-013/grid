"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrompts, getAgents, getChats, getEvents } from "@/lib/api";

export default function Home() {
  const [stats, setStats] = useState({
    prompts: 0,
    agents: 0,
    chats: 0,
    events: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getPrompts(), getAgents(), getChats(), getEvents()])
      .then(([prompts, agents, chats, events]) => {
        setStats({
          prompts: prompts.status === "fulfilled" ? prompts.value.length : 0,
          agents: agents.status === "fulfilled" ? agents.value.length : 0,
          chats: chats.status === "fulfilled" ? chats.value.length : 0,
          events: events.status === "fulfilled" ? events.value.length : 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: "Prompts", value: stats.prompts, description: "Active agent prompts" },
    { title: "Agents", value: stats.agents, description: "Configured agents" },
    { title: "Chats", value: stats.chats, description: "Active conversations" },
    { title: "Events", value: stats.events, description: "Tracked events" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? "..." : card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
