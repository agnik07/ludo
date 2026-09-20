import React, { useState } from 'react';
import { PlayerColor, ChatMessage } from '../types/ludo';
import { MessageSquare, Send, X, Smile, Sparkles } from 'lucide-react';

interface ChatDrawerProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, emoji?: string) => void;
  onClose: () => void;
}

export const QUICK_EMOTES = [
  { emoji: '🍀', text: 'Good luck!' },
  { emoji: '😂', text: 'Oops, my bad!' },
  { emoji: '🔥', text: 'Nice move!' },
  { emoji: '🏃', text: 'Catch me if you can!' },
  { emoji: '😜', text: 'Better luck next time!' },
  { emoji: '🚀', text: 'Unstoppable!' },
  { emoji: '👑', text: 'I rule this board!' },
  { emoji: '😭', text: 'Lucky roll!' },
];

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  messages,
  onSendMessage,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md glass-panel p-5 space-y-4 border border-indigo-500/30 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">In-Game Chat & Emotes</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Funny Emotes */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Quick Reaction Emotes
          </label>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_EMOTES.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSendMessage(item.text, item.emoji);
                  onClose();
                }}
                className="p-2 bg-slate-900/90 hover:bg-indigo-600/30 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left flex items-center gap-2 transition-all active:scale-95"
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="text-xs font-bold text-slate-200 truncate">{item.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat History List */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Recent Chat
          </label>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto space-y-2 text-xs">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 py-3 italic text-[11px]">
                No messages yet. Send a quick emote above!
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1 bg-${msg.color}-500 shrink-0`} />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-200 font-bold">{msg.senderName}:</strong>
                      <span className="text-[10px] text-slate-500">{msg.time}</span>
                    </div>
                    <div className="text-slate-300 font-medium">
                      {msg.emoji && <span className="mr-1 text-sm">{msg.emoji}</span>}
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Text Form */}
        <form onSubmit={handleSendCustom} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type custom message..."
            maxLength={40}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
