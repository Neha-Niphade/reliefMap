import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { mockChats, type ChatThread, type ChatMessage } from '@/data/mockData';
import { Send, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<ChatThread | null>(mockChats[0]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(
    Object.fromEntries(mockChats.map(c => [c.id, c.messages]))
  );

  const handleSend = () => {
    if (!input.trim() || !selectedChat) return;
    const msg: ChatMessage = {
      id: `m_${Date.now()}`,
      senderId: 'me',
      senderName: 'You',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), msg],
    }));
    setInput('');
  };

  const currentMessages = selectedChat ? messages[selectedChat.id] || [] : [];

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-48px)]">
        {/* Chat list */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-bold">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {mockChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left p-4 border-b border-border transition-colors hover:bg-secondary/50 ${
                  selectedChat?.id === chat.id ? 'bg-secondary' : ''
                }`}
              >
                <p className="font-semibold text-sm truncate">{chat.participantNames.join(' & ')}</p>
                <p className="text-xs text-muted-foreground truncate mt-1">{chat.lastMessage}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <p className="font-display font-bold text-sm">{selectedChat.participantNames.join(' & ')}</p>
              <p className="text-xs text-muted-foreground">Request #{selectedChat.requestId}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentMessages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                    msg.senderId === 'me'
                      ? 'gradient-emergency text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-secondary-foreground rounded-bl-md'
                  }`}>
                    {msg.senderId !== 'me' && (
                      <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderName}</p>
                    )}
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleSend}
                  className="w-10 h-10 rounded-xl gradient-emergency flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <MessageCircle className="w-10 h-10 mx-auto opacity-30" />
              <p>Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default ChatPage;
