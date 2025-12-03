
import React, { useState, useRef } from 'react';
import { Trade, TradeStatus, Direction, Strategy, Asset, TradeStyle } from '../types';
import { X, BrainCircuit, Edit2, Check, RefreshCw, Camera, Trash2 } from 'lucide-react';
import { analyzeTradeWithAI } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface TradeDetailModalProps {
  trade: Trade;
  onClose: () => void;
  onUpdate: (updatedTrade: Trade) => void;
  onDelete: (id: string) => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({ trade, onClose, onUpdate, onDelete }) => {
  const [exitPrice, setExitPrice] = useState<string>(trade.exitPrice?.toString() || '');
  const [exitCandleNumber, setExitCandleNumber] = useState(trade.exitCandleNumber || '');
  const [userNotes, setUserNotes] = useState(trade.userNotes || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState(trade.date);
  const [editEntryPrice, setEditEntryPrice] = useState(trade.entryPrice.toString());
  const [editStopLoss, setEditStopLoss] = useState(trade.stopLoss.toString());
  const [editTakeProfit, setEditTakeProfit] = useState(trade.takeProfit?.toString() || '');
  const [editStrategy, setEditStrategy] = useState(trade.strategy);
  const [editStyle, setEditStyle] = useState(trade.style);
  const [editEntryCandleNumber, setEditEntryCandleNumber] = useState(trade.entryCandleNumber || '');
  const [editExitCandleNumber, setEditExitCandleNumber] = useState(trade.exitCandleNumber || '');
  
  const [editMarketContext, setEditMarketContext] = useState(trade.marketContext);
  const [editIsEmotional, setEditIsEmotional] = useState(trade.isEmotional);
  const [editConfidence, setEditConfidence] = useState(trade.confidence);
  
  const [editChartImage, setEditChartImage] = useState<string | undefined>(trade.chartImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCloseTrade = () => {
    if (!exitPrice) return;
    const exit = parseFloat(exitPrice);
    const directionMultiplier = trade.direction === Direction.LONG ? 1 : -1;
    const pnl = (exit - trade.entryPrice) * directionMultiplier;
    const roundedPnl = Math.round(pnl * 100) / 100;

    const updated: Trade = {
      ...trade,
      status: TradeStatus.CLOSED,
      exitPrice: exit,
      exitCandleNumber: exitCandleNumber,
      pnlPoints: roundedPnl,
      userNotes: userNotes
    };

    onUpdate(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditChartImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    const updated: Trade = {
      ...trade,
      date: editDate,
      entryPrice: parseFloat(editEntryPrice),
      stopLoss: parseFloat(editStopLoss),
      takeProfit: editTakeProfit ? parseFloat(editTakeProfit) : undefined,
      strategy: editStrategy,
      style: editStyle,
      entryCandleNumber: editEntryCandleNumber,
      exitCandleNumber: editExitCandleNumber,
      marketContext: editMarketContext,
      isEmotional: editIsEmotional,
      confidence: editConfidence,
      chartImage: editChartImage,
    };
    
    if (updated.status === TradeStatus.CLOSED && updated.exitPrice) {
       const directionMultiplier = updated.direction === Direction.LONG ? 1 : -1;
       updated.pnlPoints = Math.round(((updated.exitPrice - updated.entryPrice) * directionMultiplier) * 100) / 100;
    }

    onUpdate(updated);
    setIsEditing(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const tradeForAnalysis = {
       ...trade,
       userNotes,
       marketContext: isEditing ? editMarketContext : trade.marketContext,
       exitPrice: exitPrice ? parseFloat(exitPrice) : trade.exitPrice,
       exitCandleNumber: exitCandleNumber || trade.exitCandleNumber,
       pnlPoints: exitPrice ? (parseFloat(exitPrice) - trade.entryPrice) * (trade.direction === Direction.LONG ? 1 : -1) : trade.pnlPoints
    };

    const result = await analyzeTradeWithAI(tradeForAnalysis);
    
    const updated: Trade = {
      ...tradeForAnalysis,
      aiFeedback: result.feedback,
      aiScore: result.score
    };
    
    onUpdate(updated);
    setIsAnalyzing(false);
  };

  const handleDelete = () => {
    // Just notify parent to initiate delete
    onDelete(trade.id);
  };

  const calculateRR = () => {
    const entry = isEditing ? parseFloat(editEntryPrice) : trade.entryPrice;
    const stop = isEditing ? parseFloat(editStopLoss) : trade.stopLoss;
    const tp = isEditing ? parseFloat(editTakeProfit) : trade.takeProfit;

    if (!stop) return 'N/A';
    const risk = Math.abs(entry - stop);
    if (!tp) return 'N/A';
    const reward = Math.abs(tp - entry);
    if (risk === 0) return '0';
    return `1:${(reward / risk).toFixed(1)}`;
  };

  const strategies = Object.values(Strategy);
  const styles: TradeStyle[] = ['超短线', '波段', '突破', '反转'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {trade.asset} <span className="text-slate-300">|</span> 
              <span className={trade.direction === Direction.LONG ? 'text-emerald-600' : 'text-rose-600'}>{trade.direction}</span>
              {isEditing && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">编辑模式</span>}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              {isEditing ? (
                 <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="bg-slate-50 border border-slate-300 rounded px-1" />
              ) : (
                 <span>{trade.date}</span>
              )}
              <span>•</span>
              <span className="bg-slate-100 px-1.5 rounded">{trade.timeframe}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition" title="修改">
                  <Edit2 size={18} />
                </button>
              </>
            ) : (
               <>
                 <button onClick={handleSaveChanges} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-emerald-600 shadow-sm shadow-emerald-200">
                    <Check size={16} /> 保存
                  </button>
                  <button onClick={() => setIsEditing(false)} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-200">
                    取消
                  </button>
               </>
            )}
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 transition">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Left Column: Details */}
            <div className="space-y-4">
              
              <div className={`bg-white p-5 rounded-xl border shadow-sm space-y-4 relative transition-colors ${isEditing ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200'}`}>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-bold mb-1">入场价</div>
                      {isEditing ? (
                        <input type="number" step="0.25" value={editEntryPrice} onChange={(e) => setEditEntryPrice(e.target.value)} className="w-full border rounded px-2 py-1 text-sm bg-slate-50 font-mono focus:ring-2 focus:ring-indigo-200 outline-none" />
                      ) : (
                        <div className="text-lg font-mono text-slate-800 font-medium">{trade.entryPrice}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-bold mb-1">止损</div>
                      {isEditing ? (
                        <input type="number" step="0.25" value={editStopLoss} onChange={(e) => setEditStopLoss(e.target.value)} className="w-full border rounded px-2 py-1 text-sm bg-slate-50 border-rose-200 text-rose-600 font-mono focus:ring-2 focus:ring-rose-200 outline-none" />
                      ) : (
                        <div className="text-lg font-mono text-rose-500 font-medium">{trade.stopLoss}</div>
                      )}
                    </div>
                    <div>
                       <div className="text-xs text-slate-400 uppercase font-bold mb-1">止盈目标</div>
                       {isEditing ? (
                        <input type="number" step="0.25" value={editTakeProfit} onChange={(e) => setEditTakeProfit(e.target.value)} className="w-full border rounded px-2 py-1 text-sm bg-slate-50 border-emerald-200 text-emerald-600 font-mono focus:ring-2 focus:ring-emerald-200 outline-none" />
                      ) : (
                        <div className="text-lg font-mono text-emerald-500 font-medium">{trade.takeProfit || '-'}</div>
                      )}
                    </div>
                    <div>
                       <div className="text-xs text-slate-400 uppercase font-bold mb-1">计划盈亏比</div>
                       <div className="text-lg font-mono text-slate-600">{calculateRR()}</div>
                    </div>
                 </div>

                 {isEditing && (
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-1 gap-3 animate-fadeIn">
                       <div>
                         <label className="text-xs text-slate-400 font-bold">策略</label>
                         <select value={editStrategy} onChange={(e) => setEditStrategy(e.target.value as Strategy)} className="w-full mt-1 text-sm border rounded p-1.5 bg-slate-50">
                            {strategies.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                       </div>
                       <div className="flex gap-2">
                         <div className="flex-1">
                            <label className="text-xs text-slate-400 font-bold">风格</label>
                            <select value={editStyle} onChange={(e) => setEditStyle(e.target.value as TradeStyle)} className="w-full mt-1 text-sm border rounded p-1.5 bg-slate-50">
                                {styles.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                       </div>
                       <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-slate-400 font-bold">入场K线#</label>
                            <input type="text" value={editEntryCandleNumber} onChange={(e) => setEditEntryCandleNumber(e.target.value)} className="w-full mt-1 text-sm border rounded p-1.5 bg-slate-50" />
                         </div>
                         <div className="flex-1">
                            <label className="text-xs text-slate-400 font-bold">离场K线#</label>
                            <input type="text" value={editExitCandleNumber} onChange={(e) => setEditExitCandleNumber(e.target.value)} className="w-full mt-1 text-sm border rounded p-1.5 bg-slate-50" />
                         </div>
                       </div>
                    </div>
                 )}
              </div>

              {/* Status Section */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="text-sm font-bold text-slate-700 mb-3">交易状态</h3>
                 {trade.status === TradeStatus.OPEN ? (
                   <div className="space-y-4">
                     <div className="text-blue-600 font-bold flex items-center gap-2 animate-pulse">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm"></span> 持仓中
                     </div>
                     <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                           <div className="col-span-2">
                              <label className="text-xs text-slate-500 font-bold">平仓价格</label>
                              <input 
                                type="number" 
                                value={exitPrice} 
                                onChange={(e) => setExitPrice(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-200 outline-none"
                                placeholder="价格"
                              />
                           </div>
                           <div>
                              <label className="text-xs text-slate-500 font-bold">离场K#</label>
                              <input 
                                type="text" 
                                value={exitCandleNumber} 
                                onChange={(e) => setExitCandleNumber(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-200 outline-none"
                                placeholder="#"
                              />
                           </div>
                        </div>
                        <button 
                          onClick={handleCloseTrade}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 mt-2 rounded-lg font-bold text-sm transition shadow-sm shadow-indigo-200"
                        >
                          平仓
                        </button>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     <div className="text-slate-500 font-bold text-sm flex items-center gap-2">
                       <span className="h-2 w-2 rounded-full bg-slate-400"></span> 已平仓
                     </div>
                     <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                       <span className="text-slate-500 text-sm">平仓价格:</span>
                       <span className="font-mono text-slate-800 font-medium">{trade.exitPrice}</span>
                     </div>
                     <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                       <span className="text-slate-500 text-sm">结果:</span>
                       <span className={`font-mono font-bold text-xl ${(trade.pnlPoints || 0) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {(trade.pnlPoints || 0) > 0 ? '+' : ''}{trade.pnlPoints} pts
                       </span>
                     </div>
                   </div>
                 )}
              </div>

               {/* Notes */}
               <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">我的笔记 (可编辑)</label>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  onBlur={() => onUpdate({ ...trade, userNotes })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-700 resize-none h-24 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm"
                  placeholder="添加关于此交易的备注，修改后可点击右侧重新分析..."
                />
              </div>
            </div>

            {/* Right Column: AI & Context */}
            <div className="space-y-4">
              
              {/* Context Summary / Edit Form */}
              <div className={`p-4 rounded-xl border text-sm shadow-sm transition-all ${isEditing ? 'bg-white border-indigo-300 ring-2 ring-indigo-50' : 'bg-indigo-50/50 border-indigo-100'}`}>
                {isEditing ? (
                  <div className="space-y-3 animate-fadeIn">
                     <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-700">编辑背景与心态 (Step 1)</span>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">市场背景</label>
                        <textarea 
                           value={editMarketContext} 
                           onChange={e => setEditMarketContext(e.target.value)}
                           className="w-full mt-1 border rounded-lg p-2 text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-200 outline-none"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="text-xs font-bold text-slate-500">是否情绪化?</label>
                           <div className="flex gap-2 mt-1">
                              <button 
                                onClick={() => setEditIsEmotional(true)}
                                className={`flex-1 py-1.5 text-xs rounded border font-bold ${editIsEmotional ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-white text-slate-400'}`}
                              >是</button>
                               <button 
                                onClick={() => setEditIsEmotional(false)}
                                className={`flex-1 py-1.5 text-xs rounded border font-bold ${!editIsEmotional ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white text-slate-400'}`}
                              >否</button>
                           </div>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500">信心 ({editConfidence}%)</label>
                           <input 
                              type="range" min="0" max="100" step="5"
                              value={editConfidence}
                              onChange={e => setEditConfidence(parseInt(e.target.value))}
                              className="w-full mt-2 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                           />
                        </div>
                     </div>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-600 mb-2 flex justify-between"><span className="text-indigo-600 font-bold">背景:</span> <span className="text-right flex-1 ml-2">{trade.marketContext}</span></p>
                    <p className="text-slate-600 mb-2 flex justify-between"><span className="text-indigo-600 font-bold">情绪化:</span> <span>{trade.isEmotional ? "是 ⚠️" : "否 ✅"}</span></p>
                    <p className="text-slate-600 mb-2 flex justify-between"><span className="text-indigo-600 font-bold">策略:</span> <span>{trade.strategy}</span></p>
                    <p className="text-slate-600 flex justify-between"><span className="text-indigo-600 font-bold">风格:</span> <span>{trade.style}</span></p>
                  </>
                )}
              </div>

              {/* Chart Image */}
              <div className="relative group">
                {isEditing ? (
                   <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 text-center hover:bg-slate-100 transition">
                      {editChartImage ? (
                        <div className="relative h-40 w-full mb-2">
                           <img src={editChartImage} className="w-full h-full object-cover rounded-lg opacity-80" />
                           <button onClick={() => setEditChartImage(undefined)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="h-20 flex items-center justify-center text-slate-400">无图片</div>
                      )}
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="text-sm font-bold text-indigo-600 flex items-center justify-center gap-1 w-full">
                         <Camera size={16} /> {editChartImage ? '更换图片' : '上传/添加图片'}
                      </button>
                   </div>
                ) : (
                  trade.chartImage && (
                    <div className="h-48 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm group relative">
                      <img src={trade.chartImage} alt="Chart" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition pointer-events-none"></div>
                    </div>
                  )
                )}
              </div>

              {/* AI Coach */}
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-5 border border-indigo-200 shadow-sm relative overflow-hidden flex flex-col h-full min-h-[300px]">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100 rounded-full blur-2xl -mr-10 -mt-10 opacity-50"></div>
                
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                    <BrainCircuit size={20} className="text-indigo-600" /> AI 教练
                  </h3>
                  <div className="flex items-center gap-2">
                     {trade.aiFeedback && (
                        <button 
                           onClick={handleAnalyze} 
                           disabled={isAnalyzing}
                           className="text-xs bg-white text-indigo-600 border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50 flex items-center gap-1 transition"
                        >
                           <RefreshCw size={12} className={isAnalyzing ? "animate-spin" : ""} /> {isAnalyzing ? '分析中' : '重新分析'}
                        </button>
                     )}
                     {trade.aiScore !== undefined && (
                        <span className={`text-lg font-bold px-3 py-0.5 rounded-lg border ${trade.aiScore >= 7 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : trade.aiScore >= 4 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                        {trade.aiScore}/10
                        </span>
                     )}
                  </div>
                </div>
                
                {trade.aiFeedback ? (
                  <div className="text-sm text-slate-700 leading-relaxed overflow-y-auto custom-scrollbar relative z-10 flex-1 prose prose-sm prose-indigo max-w-none">
                    <ReactMarkdown>
                        {trade.aiFeedback}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-6 relative z-10 flex-1 flex flex-col justify-center">
                    <p className="text-slate-500 text-sm mb-4">获取关于此交易的专业反馈。</p>
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 shadow-sm hover:shadow px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 mx-auto justify-center"
                    >
                      {isAnalyzing ? (
                        <>分析中...</>
                      ) : (
                        <>开始分析</>
                      )}
                    </button>
                  </div>
                )}
              </div>

               {/* Delete Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleDelete}
                  className="text-slate-400 hover:text-rose-600 text-sm font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-50 transition"
                >
                  <Trash2 size={16} /> 删除此记录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
