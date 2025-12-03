
import React, { useRef, useEffect } from 'react';
import { X, Send, Bot, User, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Role } from '../types';

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const AIChatWindow: React.FC<AIChatWindowProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading }) => {
  const [input, setInput] = React.useState('');
  const [isMinimized, setIsMinimized] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-24 left-8 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-indigo-700 transition flex items-center gap-2"
        onClick={() => setIsMinimized(false)}
      >
        <Bot size={24} />
        <span className="font-bold text-sm pr-2">PA 助教</span>
        <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1 hover:bg-indigo-500 rounded-full"
        >
            <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 left-4 md:left-8 z-50 w-[90vw] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col animate-fadeIn overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
             <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Price Action 助教</h3>
            <p className="text-[10px] text-indigo-200">在线 • 随时提问</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <Minimize2 size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-10 px-4">
            <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
               <Bot size={24} className="text-indigo-600" />
            </div>
            <p className="text-slate-500 text-sm mb-2 font-bold">你好！我是你的 PA 交易助教。</p>
            <p className="text-slate-400 text-xs leading-relaxed">你可以问我关于 K线形态、支撑阻力、趋势判断或交易心理的问题。</p>
            <div className="mt-4 grid grid-cols-1 gap-2">
                <button onClick={() => onSendMessage("现在的市场结构是多头还是空头？")} className="text-xs bg-white border border-slate-200 p-2 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition text-left">
                    📈 现在的市场结构是多头还是空头？
                </button>
                <button onClick={() => onSendMessage("如果出现长上影线的Pin bar意味着什么？")} className="text-xs bg-white border border-slate-200 p-2 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition text-left">
                    🕯️ 出现长上影线 Pin bar 意味着什么？
                </button>
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === Role.USER ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {msg.role === Role.USER ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === Role.USER ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
               {msg.role === Role.USER ? (
                 <p>{msg.text}</p>
               ) : (
                 <div className="prose prose-sm prose-indigo max-w-none text-slate-700 dark:prose-invert">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                 </div>
               )}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
               <Bot size={14} />
             </div>
             <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-500" />
                <span className="text-xs text-slate-400">正在思考...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white p-2.5 rounded-xl transition shadow-sm"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
