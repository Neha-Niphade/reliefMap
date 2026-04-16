import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Send, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { useUserMap } from '@/hooks/useUserMap';

function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [input, setInput] = useState('');
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const { getUserName } = useUserMap();
  
  const currentUserId = localStorage.getItem('user_id') || 'anonymous';

  // Load active chat threads
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'threads'));
    const unSub = onSnapshot(q, snapshot => {
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setThreads(liveData);
    });
    return () => unSub();
  }, []);

  // Load messages for selected chat
  useEffect(() => {
    if (!db || !selectedChat) return;
    const q = query(collection(db, `threads/${selectedChat.id}/messages`), orderBy('timestamp', 'asc'));
    const unSub = onSnapshot(q, snapshot => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unSub();
  }, [selectedChat]);

  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;
    try {
      await addDoc(collection(db, `threads/${selectedChat.id}/messages`), {
        senderId: currentUserId,
        content: input,
        timestamp: new Date().toISOString()
      });
      setInput('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-48px)]">
        {/* Chat list */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-bold">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
               <div className="p-6 text-sm text-center text-muted-foreground">No active conversations. Start one from the map!</div>
            ) : threads.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left p-4 border-b border-border transition-colors hover:bg-secondary/50 ${
                  selectedChat?.id === chat.id ? 'bg-secondary' : ''
                }`}
              >
                <p className="font-semibold text-sm truncate">
                  {chat.participantIds?.filter((id: string) => id !== currentUserId).map((id: string) => getUserName(id)).join(' & ') || 'Chat'}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {chat.lastSenderId === currentUserId ? 'You: ' : `${getUserName(chat.lastSenderId)}: `}{chat.lastMessage}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <p className="font-display font-bold text-sm">
                Talking with {selectedChat.participantIds?.filter((id: string) => id !== currentUserId).map((id: string) => getUserName(id)).join(' & ') || 'Someone'}
              </p>
              <p className="text-xs text-muted-foreground">Request #{selectedChat.requestId}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                    msg.senderId === currentUserId
                      ? 'gradient-emergency text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-secondary-foreground rounded-bl-md'
                  }`}>
                    {msg.senderId !== currentUserId && (
                      <p className="text-xs font-semibold mb-1 opacity-70">{getUserName(msg.senderId)}</p>
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
