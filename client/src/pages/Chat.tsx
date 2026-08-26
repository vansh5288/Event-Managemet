import { useState } from 'react';
import { motion } from 'framer-motion';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const mockContacts = [
  { id: 1, name: 'Alice Johnson', role: 'Organizer', avatar: 'A', online: true, lastMsg: 'See you at the event!' },
  { id: 2, name: 'Bob Smith', role: 'Speaker', avatar: 'B', online: true, lastMsg: 'My session is ready' },
  { id: 3, name: 'Carol White', role: 'Sponsor', avatar: 'C', online: false, lastMsg: 'Thanks for the update' },
  { id: 4, name: 'David Brown', role: 'Volunteer', avatar: 'D', online: false, lastMsg: 'I will be there at 9' },
];

export default function Chat() {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ id: number; text: string; sent: boolean }[]>([]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages([...messages, { id: Date.now(), text: message, sent: true }]);
    setMessage('');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}><h1 className="text-2xl font-bold">Chat</h1><p className="text-gray-500 mt-1">Real-time messaging</p></motion.div>
      <motion.div variants={item} className="card p-0 flex h-[600px] overflow-hidden">
        {/* Contacts */}
        <div className="w-72 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <input type="text" placeholder="Search contacts..." className="input-field" />
          </div>
          {mockContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setActiveChat(contact.id)}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                activeChat === contact.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <div className="avatar text-sm">{contact.avatar}</div>
                {contact.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{contact.name}</p>
                <p className="text-xs text-gray-500 truncate">{contact.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="avatar text-sm">{mockContacts.find(c => c.id === activeChat)?.avatar}</div>
                <div>
                  <p className="font-medium">{mockContacts.find(c => c.id === activeChat)?.name}</p>
                  <p className="text-xs text-green-500">Online</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 py-12">
                    <p>Start a conversation</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-xl text-sm ${
                      msg.sent ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="input-field flex-1"
                  />
                  <button onClick={sendMessage} className="btn-primary px-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-20 h-20 mx-auto mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p className="text-sm">Select a contact to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
