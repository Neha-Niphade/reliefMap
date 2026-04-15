import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Bot, Send, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  'What should I do during an earthquake?',
  'How to perform CPR?',
  'First aid for burns',
  'How to help someone having a panic attack?',
];

// AI responses removed - now fetched from backend

function AssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>([
    { id: 'welcome', role: 'assistant', content: '👋 Hi! I\'m your **AI Emergency Assistant**. I can help you with:\n\n• Emergency guidance and procedures\n• First aid instructions\n• Safety tips\n• Connecting you with nearby helpers\n\nHow can I help you today?' },
  ]);
  const [input, setInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || isLoading) return;
    
    const userMsg: AIMessage = { id: `u_${Date.now()}`, role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chatbot/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: msg })
      });
      const data = await res.json();
      const aiMsg: AIMessage = { id: `a_${Date.now()}`, role: 'assistant', content: data.reply || data.error || "Service unavailable." };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const aiMsg: AIMessage = { id: `a_${Date.now()}`, role: 'assistant', content: "Failed to connect to backend AI server." };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-48px)] max-w-3xl mx-auto">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-info" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm">AI Emergency Assistant</h2>
              <p className="text-xs text-success">Online — Ready to help</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant' ? 'bg-info/20' : 'gradient-emergency'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-info" /> : <User className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>
              <div className={`max-w-md px-4 py-3 rounded-2xl text-sm whitespace-pre-line ${
                msg.role === 'user'
                  ? 'gradient-emergency text-primary-foreground rounded-br-md'
                  : 'bg-secondary text-secondary-foreground rounded-bl-md'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </div>

        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs px-3 py-1.5 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about emergency procedures..."
              className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-info"
            />
            <button disabled={isLoading} onClick={() => handleSend()} className="w-10 h-10 rounded-xl bg-info flex items-center justify-center shrink-0 disabled:opacity-50">
              <Send className="w-4 h-4 text-info-foreground" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default AssistantPage;
