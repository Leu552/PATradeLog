
import React from 'react';
import { Trade, Direction, TradeStatus } from '../types';
import { MessageSquare, AlertTriangle, TrendingUp, Trash2 } from 'lucide-react';

interface TradeListProps {
  trades: Trade[];
  onSelect: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

export const TradeList: React.FC<TradeListProps> = ({ trades, onSelect, onDelete }) => {
  
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // No window.confirm here. We just trigger the parent's delete flow.
    onDelete(id);
  };

  if (trades.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm border-dashed">
        <TrendingUp className="mx-auto mb-3 opacity-20" size={48} />
        <p>该日期暂无交易记录。</p>
        <p className="text-xs mt-1 opacity-70">点击右下角按钮开始记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trades.map((trade) => {
        const isWin = (trade.pnlPoints || 0) > 0;
        const isLoss = (trade.pnlPoints || 0) < 0;
        
        return (
          <div 
            key={trade.id} 
            onClick={() => onSelect(trade)}
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer relative group"
          >
            {/* Delete Button - Top Right */}
            <button
              onClick={(e) => handleDeleteClick(e, trade.id)}
              className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100 z-10"
              title="删除记录"
            >
              <Trash2 size={16} />
            </button>

            <div className="flex justify-between items-start mb-3 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${trade.direction === Direction.LONG ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {trade.direction}
                </span>
                <span className="font-bold text-slate-800">{trade.asset.split(' ')[0]}</span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">{trade.timeframe}</span>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{trade.style}</span>
                
                {trade.entryCandleNumber && (
                  <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    入#{trade.entryCandleNumber}
                  </span>
                )}
                 {trade.exitCandleNumber && (
                  <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    离#{trade.exitCandleNumber}
                  </span>
                )}

                {trade.isEmotional && (
                  <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle size={12} /> 情绪化
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {trade.status === TradeStatus.CLOSED ? (
                  <span className={`font-mono font-bold text-sm px-2 py-1 rounded ${isWin ? 'bg-emerald-50 text-emerald-600' : isLoss ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                    {trade.pnlPoints && trade.pnlPoints > 0 ? '+' : ''}{trade.pnlPoints} pts
                  </span>
                ) : (
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded animate-pulse border border-blue-100">
                    持仓中
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 mb-1">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">策略</span>
                <span className="text-slate-700 font-medium truncate">{trade.strategy}</span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-xs text-slate-400">入场价</span>
                 <span className="text-slate-700 font-mono">{trade.entryPrice}</span>
              </div>
            </div>

            {trade.aiFeedback && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-indigo-600">
                <div className="bg-indigo-100 p-1 rounded-full shrink-0">
                  <MessageSquare size={12} />
                </div>
                <span className="truncate max-w-[200px] sm:max-w-md font-medium">{trade.aiFeedback.replace(/[*#]/g, '')}</span>
                <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${trade.aiScore && trade.aiScore >= 7 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : trade.aiScore && trade.aiScore >= 4 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                  {trade.aiScore}/10
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
