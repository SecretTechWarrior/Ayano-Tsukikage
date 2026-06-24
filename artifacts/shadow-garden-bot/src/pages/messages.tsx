import { useState } from "react";
import {
  useGetRecentMessages,
  getGetRecentMessagesQueryKey,
} from "@workspace/api-client-react";
import { MessageSquare, RefreshCw, Bot, User, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const MESSAGE_TYPE_COLORS: Record<string, string> = {
  text: "bg-primary/20 text-primary border-primary/30",
  voice: "bg-purple-500/20 text-purple-400 border-purple-400/30",
  image: "bg-cyan-500/20 text-cyan-400 border-cyan-400/30",
  document: "bg-amber-500/20 text-amber-400 border-amber-400/30",
  command: "bg-green-500/20 text-green-400 border-green-400/30",
  other: "bg-secondary text-muted-foreground border-border",
};

export default function Messages() {
  const [limit, setLimit] = useState(50);
  const { data: messages, isLoading, refetch, isFetching } = useGetRecentMessages(
    { limit },
    { query: { queryKey: getGetRecentMessagesQueryKey({ limit }) } }
  );
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetRecentMessagesQueryKey({ limit }) });
    refetch();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent inline-block">
            Activity Feed
          </h1>
          <p className="text-muted-foreground mt-2 font-mono text-sm uppercase tracking-widest">
            Intercepted Intelligence — Real-Time Dispatch
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLimit((l) => l + 50)}
            className="border-primary/30 text-primary font-mono hover:bg-primary/10"
            data-testid="button-load-more"
          >
            Load More
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="border-primary/30 text-primary font-mono hover:bg-primary/10"
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <Card className="border-primary/10 bg-card/40 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <MessageSquare className="w-5 h-5 text-primary" />
            Message Log
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            Showing last {limit} transmissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="py-16 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground font-mono text-sm">[ NO TRANSMISSIONS LOGGED ]</p>
                <p className="text-muted-foreground/60 text-xs mt-2">Silence... for now.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => {
                  const typeColor = MESSAGE_TYPE_COLORS[msg.messageType] ?? MESSAGE_TYPE_COLORS.other;
                  const displayText = msg.messageText
                    ? msg.messageText.length > 120
                      ? msg.messageText.slice(0, 120) + "…"
                      : msg.messageText
                    : `[${msg.messageType} message]`;

                  return (
                    <div
                      key={msg.id}
                      data-testid={`card-message-${msg.id}`}
                      className={`p-4 rounded-lg border transition-all hover:border-primary/20 ${
                        msg.isFromBot
                          ? "border-primary/20 bg-primary/5"
                          : "border-border/50 bg-secondary/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className={`mt-1 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              msg.isFromBot
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-secondary text-muted-foreground border border-border"
                            }`}
                          >
                            {msg.isFromBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="font-bold text-sm"
                                data-testid={`text-sender-${msg.id}`}
                              >
                                {msg.isFromBot ? "Shadow" : msg.username || `User #${msg.userId}`}
                              </span>
                              {msg.chatTitle && (
                                <span
                                  className="flex items-center gap-1 text-xs text-muted-foreground font-mono"
                                  data-testid={`text-chat-${msg.id}`}
                                >
                                  <Hash className="w-3 h-3" />
                                  {msg.chatTitle}
                                </span>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-mono uppercase tracking-wider ${typeColor}`}
                              >
                                {msg.messageType}
                              </Badge>
                            </div>
                            <p
                              className="text-sm text-foreground/80 mt-1 font-mono break-words"
                              data-testid={`text-message-${msg.id}`}
                            >
                              {displayText}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-xs text-muted-foreground/60 font-mono flex-shrink-0 whitespace-nowrap"
                          data-testid={`text-time-${msg.id}`}
                        >
                          {msg.timestamp
                            ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })
                            : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
