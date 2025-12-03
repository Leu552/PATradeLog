import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Calendar, Target, AlertCircle, History, Database, TrendingUp, Bot } from 'lucide-react';
import { Trade, TradeStatus, ChatMessage, Role } from './types';
import { TradeWizard } from './components/TradeWizard';
import { TradeList } from './components/TradeList';
import { TradeDetailModal } from './components/TradeDetailModal';
import { DataManagementModal } from './components/DataManagementModal';
import { ConfirmModal } from './components/ConfirmModal';
import { AIChatWindow } from './components/AIChatWindow';
import { createPAChatSession } from './services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';

const STORAGE_KEY = 'mindful_trades';
const getTodayDate = () => new Date().toISOString().split('T')[0];

const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Fallback
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const App: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  
  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardVersion, setWizardVersion] = useState(0); 
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Delete flow state
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);

  // Reset flow state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Import flow state
  const [pendingImport, setPendingImport] = useState<Trade[] | null>(null);

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);

  // Load from Storage
  useEffect(() => {
    localStorage.removeItem('mindful_trades_test'); // Clean legacy
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTrades(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse trades", e);
      }
    }
    
    // Initialize Chat Session
    try {
      chatSessionRef.current = createPAChatSession();
    } catch (e) {
      console.error("Failed to init chat session", e);
    }
  }, []);

  // Save to Storage Effect
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    } catch (e) {
      console.error("Storage limit reached", e);
      alert("⚠️ 警告：本地存储空间已满！刚才的操作可能未保存。\n建议：\n1. 点击右上角设置图标导出备份\n2. 清空数据或删除旧的大图片记录");
    }
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => t.date === selectedDate).sort((a, b) => b.timestamp - a.timestamp);
  }, [trades, selectedDate]);

  const dailyStats = useMemo(() => {
    const closedTrades = filteredTrades.filter(t => t.status === TradeStatus.CLOSED);
    const totalPoints = closedTrades.reduce((acc, t) => acc + (t.pnlPoints || 0), 0);
    return {
      total: filteredTrades.length,
      closedCount: closedTrades.length,
      points: Math.round(totalPoints * 100) / 100,
      wins: closedTrades.filter(t => (t.pnlPoints || 0) > 0).length,
      losses: closedTrades.filter(t => (t.pnlPoints || 0) < 0).length,
    };
  }, [filteredTrades]);

  // Total Historical PnL Calculation
  const totalHistoricalPoints = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === TradeStatus.CLOSED);
    const total = closedTrades.reduce((acc, t) => acc + (t.pnlPoints || 0), 0);
    return Math.round(total * 100) / 100;
  }, [trades]);

  const handleOpenWizard = () => {
    setWizardVersion(prev => prev + 1);
    setIsWizardOpen(true);
  };

  const handleSaveTrade = (newTradeData: Omit<Trade, 'id' | 'timestamp'>) => {
    const newTrade: Trade = {
      ...newTradeData,
      id: generateId(),
      timestamp: Date.now(),
    };
    setTrades(prev => [newTrade, ...prev]);
    setIsWizardOpen(false);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
    setSelectedTrade(updatedTrade);
  };

  // --- CHAT LOGIC START ---
  const handleSendMessage = async (text: string) => {
    if (!chatSessionRef.current) return;
    
    const userMsg: ChatMessage = {
      id: generateId(),
      role: Role.USER,
      text: text,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: text });
      const modelMsg: ChatMessage = {
        id: generateId(),
        role: Role.MODEL,
        text: result.text || "Sorry, I couldn't generate a response.",
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat Error", error);
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: Role.MODEL,
        text: "抱歉，连接 AI 服务时出现错误，请稍后再试。",
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };
  // --- CHAT LOGIC END ---

  // --- DELETE LOGIC START ---
  const initiateDeleteTrade = (tradeId: string) => {
    setTradeToDelete(tradeId);
  };

  const confirmDeleteTrade = () => {
    if (tradeToDelete) {
      setTrades(prev => prev.filter(t => t.id !== tradeToDelete));
      if (selectedTrade?.id === tradeToDelete) {
        setSelectedTrade(null);
      }
      setTradeToDelete(null);
    }
  };

  const cancelDeleteTrade = () => {
    setTradeToDelete(null);
  };
  // --- DELETE LOGIC END ---

  // --- RESET LOGIC START ---
  const handleResetRequest = () => {
    setIsResetModalOpen(true);
  };

  const confirmFactoryReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTrades([]);
    setWizardVersion(0);
    setSelectedTrade(null);
    setTradeToDelete(null);
    setPendingImport(null);
    setChatMessages([]);
    try {
        chatSessionRef.current = createPAChatSession();
    } catch(e) { console.error(e) }
    setIsResetModalOpen(false);
  };
  // --- RESET LOGIC END ---

  // --- IMPORT LOGIC START ---
  const handleImportRequest = (importedTrades: Trade[]) => {
    setPendingImport(importedTrades);
    // Modal will close automatically via its own logic, App handles the pending state
  };

  const confirmImport = () => {
    if (pendingImport) {
      setTrades(pendingImport);
      
      // Auto-switch date to the most recent trade in the imported data
      if (pendingImport.length > 0) {
        // Sort by date string descending
        const sorted = [...pendingImport].sort((a, b) => b.date.localeCompare(a.date));
        setSelectedDate(sorted[0].date);
      }
      
      setPendingImport(null);
    }
  };
  // --- IMPORT LOGIC END ---

  return (
    <div className="min-h-screen pb-24 md:pb-12 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-md shrink-0">
              <Target size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 hidden md:block">Mindful Trader AI</h1>
          </div>
          
          {/* Total PnL Display */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm mx-2">
             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">历史总盈亏</span>
             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider sm:hidden">总</span>
             <div className={`font-mono font-bold text-sm sm:text-base flex items-center gap-1 ${totalHistoricalPoints > 0 ? 'text-emerald-600' : totalHistoricalPoints < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                {totalHistoricalPoints > 0 && <TrendingUp size={14} />}
                {totalHistoricalPoints > 0 ? '+' : ''}{totalHistoricalPoints} <span className="text-xs opacity-70">pts</span>
             </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition" size={16} />
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-100 border-none text-slate-700 text-sm font-medium rounded-lg pl-9 pr-2 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 transition cursor-pointer hover:bg-slate-200/50 w-32 sm:w-auto"
              />
            </div>
            
            <button 
              onClick={() => setIsDataModalOpen(true)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              title="数据管理 (备份/恢复)"
            >
              <Database size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Daily Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-300">
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">当日盈亏 (Pts)</div>
            <div className={`text-3xl font-mono font-bold tracking-tight ${dailyStats.points > 0 ? 'text-emerald-500' : dailyStats.points < 0 ? 'text-rose-500' : 'text-slate-700'}`}>
              {dailyStats.points > 0 ? '+' : ''}{dailyStats.points}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-300">
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">当日交易笔数</div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${dailyStats.total > 4 ? 'text-amber-500' : 'text-slate-800'}`}>{dailyStats.total}</span>
              <span className="text-slate-400 text-sm font-medium">/ 4</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-300">
             <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">当日胜率</div>
             <div className="text-3xl font-bold text-slate-800">
               {dailyStats.closedCount > 0 
                 ? Math.round((dailyStats.wins / dailyStats.closedCount) * 100) 
                 : 0}%
             </div>
          </div>
           <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm md:block hidden hover:shadow-md transition duration-300">
             <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">当日状态</div>
             <div className="text-base font-bold text-slate-600 pt-1 flex items-center gap-2">
               {dailyStats.points > 0 ? <span className="text-emerald-600">盈利日 ✅</span> : dailyStats.points < 0 ? <span className="text-rose-600">亏损日 🛑</span> : "持平"}
             </div>
          </div>
        </div>

        {dailyStats.total > 4 && (
           <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 text-sm font-medium animate-fadeIn">
             <AlertCircle size={20} className="text-amber-600" />
             <span>你已超过每日推荐的4笔交易，请警惕过度交易风险。</span>
           </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History size={20} className="text-indigo-600" /> 交易日志
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{dailyStats.total} 笔记录</span>
          </div>
          <TradeList 
            trades={filteredTrades} 
            onSelect={setSelectedTrade}
            onDelete={initiateDeleteTrade}
          />
        </div>
      </main>

      {/* Floating Buttons */}
      {!isChatOpen && (
        <div className="fixed bottom-8 left-8 z-40">
           <button
             onClick={() => setIsChatOpen(true)}
             className="bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-full p-3.5 shadow-lg transition-all flex items-center gap-2 group"
             title="AI 助教"
           >
             <Bot size={24} className="group-hover:scale-110 transition" />
             <span className="font-bold text-sm pr-1 hidden sm:block">PA 助教</span>
           </button>
        </div>
      )}

      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={handleOpenWizard}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg shadow-indigo-300 transition-all hover:scale-110 flex items-center gap-2 pr-6 group"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-bold">记一笔</span>
        </button>
      </div>

      <AIChatWindow 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isLoading={isChatLoading}
      />

      {isWizardOpen && (
        <TradeWizard 
          key={wizardVersion}
          selectedDate={selectedDate}
          onClose={() => setIsWizardOpen(false)} 
          onSave={handleSaveTrade} 
        />
      )}

      {selectedTrade && (
        <TradeDetailModal 
          trade={selectedTrade} 
          onClose={() => setSelectedTrade(null)}
          onUpdate={handleUpdateTrade}
          onDelete={initiateDeleteTrade}
        />
      )}

      {isDataModalOpen && (
        <DataManagementModal 
          trades={trades}
          onClose={() => setIsDataModalOpen(false)}
          onImport={handleImportRequest}
          onReset={handleResetRequest}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={tradeToDelete !== null}
        title="删除交易记录"
        message="确定要删除这条交易记录吗？此操作无法撤销。"
        onConfirm={confirmDeleteTrade}
        onCancel={cancelDeleteTrade}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal 
        isOpen={isResetModalOpen}
        title="重置所有数据"
        message="警告：此操作将永久删除本地所有交易记录、聊天记录和设置。数据无法恢复。"
        confirmText="彻底清空"
        onConfirm={confirmFactoryReset}
        onCancel={() => setIsResetModalOpen(false)}
      />

      {/* Import Confirmation Modal */}
      <ConfirmModal 
        isOpen={pendingImport !== null}
        title="确认导入数据"
        message={`警告：这将覆盖当前的 ${trades.length} 条数据，替换为导入的 ${pendingImport?.length || 0} 条数据。建议先备份当前数据。此操作不可撤销。`}
        confirmText="覆盖导入"
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  );
};

export default App;