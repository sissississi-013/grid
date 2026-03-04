"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getChats, getMessages, type ChatSummary, type Message } from "@/lib/api";

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChats()
      .then(setChats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectChat = async (chatId: string) => {
    setSelectedChat(chatId);
    const msgs = await getMessages({ chat_id: chatId, limit: 100 });
    setMessages(msgs);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Chats</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : chats.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No chats yet. Messages will appear here once the bot starts receiving them.
              </CardContent>
            </Card>
          ) : (
            chats.map((chat) => (
              <Card
                key={`${chat.platform}-${chat.chat_id}`}
                className={`cursor-pointer transition-colors ${
                  selectedChat === chat.chat_id ? "border-primary" : ""
                }`}
                onClick={() => selectChat(chat.chat_id)}
              >
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium truncate">
                      {chat.chat_id}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {chat.platform}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {chat.message_count} messages
                  </p>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        <div className="md:col-span-2">
          {selectedChat ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {messages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {msg.sender_name || msg.sender_id}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        {msg.content}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select a chat to view messages
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
