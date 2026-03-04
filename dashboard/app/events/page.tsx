"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEvents, updateEvent, deleteEvent, type Event } from "@/lib/api";

const STATUS_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  discovered: "outline",
  interested: "default",
  registered: "default",
  passed: "secondary",
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  const load = () => {
    setLoading(true);
    getEvents(tab === "all" ? undefined : tab)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]);

  const handleStatusChange = async (id: string, status: string) => {
    await updateEvent(id, { status });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await deleteEvent(id);
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Events</h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="discovered">Discovered</TabsTrigger>
          <TabsTrigger value="interested">Interested</TabsTrigger>
          <TabsTrigger value="registered">Registered</TabsTrigger>
          <TabsTrigger value="passed">Passed</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No events found. Events will appear here when the Event Scout agent discovers them.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{event.title}</CardTitle>
                        <Badge variant={STATUS_COLORS[event.status] || "outline"}>
                          {event.status}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        {event.status === "discovered" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(event.id, "interested")}
                          >
                            Interested
                          </Button>
                        )}
                        {event.status === "interested" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(event.id, "registered")}
                          >
                            Registered
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {event.event_date && (
                        <span>Event: {new Date(event.event_date).toLocaleDateString()}</span>
                      )}
                      {event.deadline && (
                        <span>Deadline: {new Date(event.deadline).toLocaleDateString()}</span>
                      )}
                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Link
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
