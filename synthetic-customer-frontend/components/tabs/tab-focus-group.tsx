"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

interface Message {
  id: number;
  sender: string;
  role: "moderator" | "persona";
  content: string;
  avatar?: string;
}

const discussionScript: Omit<Message, "id">[] = [
  {
    sender: "Moderator",
    role: "moderator",
    content: "Welcome everyone to our focus group discussion. Today we're exploring a new product concept. Let's start with first impressions — what immediately stands out to you about this idea?",
  },
  {
    sender: "Sarah Chen",
    role: "persona",
    content: "Honestly, my first thought was 'finally.' I've been cobbling together solutions for this exact problem for years. The fact that someone is building a dedicated tool is exciting.",
    avatar: "SC",
  },
  {
    sender: "Michael Patel",
    role: "persona",
    content: "I'm more cautious. We've seen a lot of AI products overpromise lately. I'd need to see concrete demos before getting excited.",
    avatar: "MP",
  },
  {
    sender: "Sarah Chen",
    role: "persona",
    content: "@Michael that's fair, but I think the premise here is solid. Even if it's 70% as good as promised, it would still save me hours each week.",
    avatar: "SC",
  },
  {
    sender: "Emma Rodriguez",
    role: "persona",
    content: "What concerns me is the pricing model. Monthly subscriptions add up fast, and I'm already paying for too many SaaS tools.",
    avatar: "ER",
  },
  {
    sender: "Moderator",
    role: "moderator",
    content: "Great point, Emma. Let's dig into that — what would be a price point that feels fair to you for this kind of solution?",
  },
  {
    sender: "James Williams",
    role: "persona",
    content: "For me, under $20/month is the sweet spot. Anything more needs to clearly justify ROI with time savings or revenue impact.",
    avatar: "JW",
  },
  {
    sender: "Michael Patel",
    role: "persona",
    content: "Agreed. Though if there's a pay-per-use option, I might actually prefer that. I don't use these tools every day.",
    avatar: "MP",
  },
  {
    sender: "Emma Rodriguez",
    role: "persona",
    content: "The team collaboration features are what would push me over the edge. If my whole team can use it, $30/month becomes reasonable.",
    avatar: "ER",
  },
  {
    sender: "Sarah Chen",
    role: "persona",
    content: "Absolutely. And integrations! If this plugs into my existing workflow seamlessly, that's worth premium pricing.",
    avatar: "SC",
  },
  {
    sender: "Moderator",
    role: "moderator",
    content: "Let's shift to potential concerns. What might prevent you from adopting this product even if the price were right?",
  },
  {
    sender: "James Williams",
    role: "persona",
    content: "Data privacy, hands down. I need to know my information isn't being used to train models or sold to third parties.",
    avatar: "JW",
  },
  {
    sender: "Michael Patel",
    role: "persona",
    content: "Lock-in worries me too. What happens if I spend months building workflows here and the company pivots or shuts down?",
    avatar: "MP",
  },
];

export function TabFocusGroup() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let messageIndex = 0;

    const addMessage = () => {
      if (messageIndex < discussionScript.length) {
        setIsTyping(true);
        
        const typingDelay = Math.random() * 1500 + 1000;
        
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { ...discussionScript[messageIndex], id: messageIndex },
          ]);
          setIsTyping(false);
          messageIndex++;
          
          const nextDelay = Math.random() * 2000 + 1500;
          setTimeout(addMessage, nextDelay);
        }, typingDelay);
      }
    };

    const initialDelay = setTimeout(addMessage, 500);
    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-muted/50 border-b border-border px-6 py-4">
          <h3 className="font-semibold text-foreground">Live Focus Group Discussion</h3>
          <p className="text-sm text-muted-foreground">
            Simulated panel debate with {new Set(discussionScript.filter(m => m.role === "persona").map(m => m.sender)).size} synthetic participants
          </p>
        </div>

        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 ${
                message.role === "moderator" ? "justify-center" : ""
              }`}
            >
              {message.role === "moderator" ? (
                <div className="max-w-md text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
                    <Bot className="w-4 h-4" />
                    <span className="font-medium">Moderator:</span>
                    <span>{message.content}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-medium text-foreground">
                    {message.avatar}
                  </div>
                  <div className="flex-1 max-w-md">
                    <p className="text-sm font-medium text-foreground mb-1">
                      {message.sender}
                    </p>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm text-foreground">{message.content}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && messages.length < discussionScript.length && (
            <div className="flex gap-4 animate-in fade-in">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            This is a simulated focus group. All participants are AI-generated synthetic personas based on your target audience profile.
          </p>
        </div>
      </div>
    </div>
  );
}
