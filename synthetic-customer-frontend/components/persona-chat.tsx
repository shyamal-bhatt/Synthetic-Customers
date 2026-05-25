import { useState, useEffect, useRef } from "react";
import { Send, Loader2, ArrowUpRight } from "lucide-react";

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
  turn_number?: number;
  likelihood_update?: number | null;
}

interface PersonaChatProps {
  personaId: string;
  studyId: string;
  personaName: string;
}

export function PersonaChat({ personaId, studyId, personaName }: PersonaChatProps) {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lazy load history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/personas/${personaId}/conversation?study_id=${studyId}`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error("Failed to load conversation history", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [personaId, studyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const newHistory = [...history];
    const userMsg = message;
    setMessage("");
    
    // Optimistic update
    setHistory([...newHistory, { role: "user", content: userMsg }]);
    setIsSending(true);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/personas/${personaId}/chat?study_id=${studyId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-model-mode": "api"
        },
        body: JSON.stringify({
          message: userMsg,
          history: newHistory.slice(-50) // Send up to 50 items
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHistory((prev) => [
          ...prev, 
          { 
            role: "assistant", 
            content: data.reply, 
            likelihood_update: data.likelihood_update 
          }
        ]);
      } else {
        console.error("Chat error", await res.text());
        // Simple rollback
        setHistory(newHistory);
      }
    } catch (err) {
      console.error("Failed to send message", err);
      setHistory(newHistory);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium">No conversation history yet.</p>
            <p className="text-xs">Start a 1-on-1 interview with {personaName}.</p>
          </div>
        ) : (
          history.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.likelihood_update && msg.role === "assistant" && (
                <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-amber-500 uppercase px-2 py-0.5 bg-amber-500/10 rounded">
                  <ArrowUpRight className="w-3 h-3" />
                  Likelihood to buy shifted to {msg.likelihood_update}/5
                </div>
              )}
              <div 
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-br-sm" 
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isSending && (
          <div className="flex items-start">
            <div className="max-w-[80%] p-3 rounded-2xl bg-muted text-foreground rounded-bl-sm flex gap-1">
              <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 bg-muted/30 border-t border-border flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={`Ask ${personaName} a question...`}
          className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={isSending || !message.trim()}
          className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
