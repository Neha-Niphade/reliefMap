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

const aiResponses: Record<string, string> = {
  'earthquake': '🏠 **During an Earthquake:**\n\n1. **DROP** to your hands and knees\n2. **COVER** under a sturdy desk or table\n3. **HOLD ON** until shaking stops\n4. Stay away from windows and heavy objects\n5. If outdoors, move to an open area\n6. After shaking stops, check for injuries\n\n⚠️ Do NOT run outside during shaking.',
  'cpr': '❤️ **CPR Steps:**\n\n1. Check for responsiveness — tap and shout\n2. Call emergency services\n3. Place heel of hand on center of chest\n4. Push hard and fast — 100-120 compressions/min\n5. Push at least 2 inches deep\n6. Give 2 rescue breaths after every 30 compressions\n\n📱 Use the SOS button for immediate help.',
  'burn': '🔥 **First Aid for Burns:**\n\n1. Cool the burn under cool running water for 10-20 minutes\n2. Remove clothing/jewelry near the burn (if not stuck)\n3. Cover with a clean, non-fluffy dressing\n4. Do NOT apply ice, butter, or toothpaste\n5. Take pain relief if needed\n6. Seek medical help for severe burns\n\n🏥 Press SOS for medical emergency nearby.',
  'panic': '🧘 **Helping Someone Having a Panic Attack:**\n\n1. Stay calm and reassuring\n2. Speak in short, simple sentences\n3. Help them breathe slowly — "Breathe in for 4, hold for 4, out for 4"\n4. Ground them: "Name 5 things you can see"\n5. Don\'t leave them alone\n6. Avoid saying "calm down"\n\n💚 You\'re doing great by asking!',
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('earthquake')) return aiResponses['earthquake'];
  if (lower.includes('cpr')) return aiResponses['cpr'];
  if (lower.includes('burn') || lower.includes('fire')) return aiResponses['burn'];
  if (lower.includes('panic') || lower.includes('anxiety')) return aiResponses['panic'];
  return `I understand you need help with: "${input}"\n\n🤖 In the full version, I\'ll provide AI-powered guidance using real-time analysis. For now, here are general tips:\n\n1. Stay calm and assess the situation\n2. Use the **SOS button** for immediate help\n3. Contact emergency services if life-threatening\n4. Nearby helpers will be notified automatically\n\nStay safe! 💚`;
}

function AssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>([
    { id: 'welcome', role: 'assistant', content: '👋 Hi! I\'m your **AI Emergency Assistant**. I can help you with:\n\n• Emergency guidance and procedures\n• First aid instructions\n• Safety tips\n• Connecting you with nearby helpers\n\nHow can I help you today?' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    const userMsg: AIMessage = { id: `u_${Date.now()}`, role: 'user', content: msg };
    const aiMsg: AIMessage = { id: `a_${Date.now()}`, role: 'assistant', content: getAIResponse(msg) };
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
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
            <button onClick={() => handleSend()} className="w-10 h-10 rounded-xl bg-info flex items-center justify-center shrink-0">
              <Send className="w-4 h-4 text-info-foreground" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default AssistantPage;
