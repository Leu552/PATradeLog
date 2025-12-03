
import React, { useState, useRef } from 'react';
import { Asset, OrderType, Direction, Strategy, Trade, TradeStatus, TradeStyle } from '../types';
import { X, Camera, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface TradeWizardProps {
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id' | 'timestamp'>) => void;
  selectedDate: string;
}

export const TradeWizard: React.FC<TradeWizardProps> = ({ onClose, onSave, selectedDate }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  
  // Step 1: Mindset Check
  const [isEmotional, setIsEmotional] = useState<boolean | null>(null);
  const [marketContext, setMarketContext] = useState('');
  const [isKeyLevel, setIsKeyLevel] = useState(false);
  const [confidence, setConfidence] = useState(50);
  const [style, setStyle] = useState<TradeStyle>('超短线');

  // Step 2: Trade Details
  const [asset, setAsset] = useState<Asset>(Asset.ES);
  const [timeframe, setTimeframe] = useState('1m');
  const [entryCandleNumber, setEntryCandleNumber] = useState('');
  const [strategy, setStrategy] = useState<Strategy>(Strategy.TREND_FOLLOW);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [direction, setDirection] = useState<Direction>(Direction.LONG);
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [chartImage, setChartImage] = useState<string | undefined>(undefined);

  // Step 2: Immediate Closure (Backtesting)
  const [status, setStatus] = useState<TradeStatus>(TradeStatus.OPEN);
  const [exitPrice, setExitPrice] = useState<string>('');
  const [exitCandleNumber, setExitCandleNumber] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleOptions: TradeStyle[] = ['超短线', '波段', '突破', '反转'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChartImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (isEmotional === null) {
        setError("请回答情绪检查问题。");
        return;
      }
      if (!marketContext.trim()) {
        setError("请描述市场背景。");
        return;
      }
      if (isEmotional === true) {
        if (!window.confirm("警告：你承认自己处于情绪化状态。你确定要交易吗？系统建议你暂时离开屏幕。")) {
          return;
        }
      }
      setError('');
      setStep(2);
    } else {
      if (!entryPrice || !stopLoss) {
        setError("入场价和止损价为必填项。");
        return;
      }

      if (status === TradeStatus.CLOSED && !exitPrice) {
        setError("如果已平仓，请填写平仓价格。");
        return;
      }

      let pnlPoints = undefined;
      if (status === TradeStatus.CLOSED && exitPrice) {
        const dirMult = direction === Direction.LONG ? 1 : -1;
        pnlPoints = Math.round((parseFloat(exitPrice) - parseFloat(entryPrice)) * dirMult * 100) / 100;
      }

      const tradeData: Omit<Trade, 'id' | 'timestamp'> = {
        date: selectedDate,
        isEmotional: isEmotional || false,
        marketContext,
        isKeyLevel,
        confidence,
        style,
        asset,
        timeframe,
        entryCandleNumber,
        strategy,
        orderType,
        direction,
        entryPrice: parseFloat(entryPrice),
        stopLoss: parseFloat(stopLoss),
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
        status: status,
        exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
        exitCandleNumber: exitCandleNumber || undefined,
        pnlPoints: pnlPoints,
        chartImage,
      };

      onSave(tradeData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-slate-800">
            {step === 1 ? '第一步：心态检查' : '第二步：交易详情'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              {/* Question 1: Emotions */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  你现在是否受情绪影响（FOMO、报复性交易、贪婪）？
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsEmotional(true)}
                    className={`p-4 rounded-xl border-2 text-center transition font-medium ${isEmotional === true ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                  >
                    是，心态不稳
                  </button>
                  <button
                    onClick={() => setIsEmotional(false)}
                    className={`p-4 rounded-xl border-2 text-center transition font-medium ${isEmotional === false ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                  >
                    否，我很冷静
                  </button>
                </div>
              </div>

              {/* Question 2: Context */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  当前市场背景是什么？
                </label>
                <textarea
                  value={marketContext}
                  onChange={(e) => setMarketContext(e.target.value)}
                  placeholder="例如：多头趋势，高位盘整，等待新闻发布..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-24 resize-none shadow-sm placeholder:text-slate-400"
                />
              </div>

              {/* Question 3: Key Level & Style */}
              <div className="space-y-4">
                 <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <input
                    type="checkbox"
                    checked={isKeyLevel}
                    onChange={(e) => setIsKeyLevel(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">是关键点位？</span>
                </div>
                
                <div className="space-y-2">
                   <label className="block text-sm font-bold text-slate-700">交易风格/类型</label>
                   <div className="grid grid-cols-4 gap-2 bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm">
                    {styleOptions.map(opt => (
                      <button 
                        key={opt}
                        onClick={() => setStyle(opt)}
                        className={`text-xs font-bold rounded-lg py-2 transition ${style === opt ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Question 4: Confidence */}
              <div className="space-y-3 pt-2">
                <label className="flex justify-between text-sm font-bold text-slate-700">
                  <span>下单把握 (信心指数)</span>
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{confidence}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 px-1">
                   <span>低</span>
                   <span>高</span>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Asset & Timeframe */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">交易品种</label>
                  <select
                    value={asset}
                    onChange={(e) => setAsset(e.target.value as Asset)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm shadow-sm"
                  >
                    {Object.values(Asset).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">周期</label>
                      <input
                        type="text"
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        placeholder="1m"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm shadow-sm"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">入场K#</label>
                      <input
                        type="text"
                        value={entryCandleNumber}
                        onChange={(e) => setEntryCandleNumber(e.target.value)}
                        placeholder="#"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm shadow-sm"
                      />
                   </div>
                </div>
              </div>

              {/* Strategy & Order Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">开仓理由/策略</label>
                  <select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value as Strategy)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm shadow-sm"
                  >
                    {Object.values(Strategy).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">订单类型</label>
                  <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-sm">
                    {Object.values(OrderType).map(t => (
                      <button
                        key={t}
                        onClick={() => setOrderType(t)}
                        className={`text-[10px] py-1.5 rounded-lg font-bold transition ${orderType === t ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direction & Prices */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <label className="block text-xs font-bold text-slate-500">多空方向</label>
                   {/* Status Toggle for Backtesting */}
                   <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                      <button 
                        onClick={() => setStatus(TradeStatus.OPEN)}
                        className={`text-[10px] px-3 py-1 rounded-md font-bold transition ${status === TradeStatus.OPEN ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                      >持仓中</button>
                       <button 
                        onClick={() => setStatus(TradeStatus.CLOSED)}
                        className={`text-[10px] px-3 py-1 rounded-md font-bold transition ${status === TradeStatus.CLOSED ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                      >已平仓</button>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDirection(Direction.LONG)}
                    className={`py-3 rounded-xl font-bold transition shadow-sm ${direction === Direction.LONG ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-emerald-200' : 'bg-white text-slate-500 border border-slate-300 hover:bg-slate-50'}`}
                  >
                    做多 (LONG)
                  </button>
                  <button
                    onClick={() => setDirection(Direction.SHORT)}
                    className={`py-3 rounded-xl font-bold transition shadow-sm ${direction === Direction.SHORT ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-rose-200' : 'bg-white text-slate-500 border border-slate-300 hover:bg-slate-50'}`}
                  >
                    做空 (SHORT)
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">开仓价格</label>
                    <input
                      type="number"
                      step="0.25"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 text-center font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm placeholder:text-slate-300"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">止损价格</label>
                    <input
                      type="number"
                      step="0.25"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-rose-600 text-center font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none shadow-sm placeholder:text-rose-200"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">止盈 (选填)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-emerald-600 text-center font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none shadow-sm placeholder:text-emerald-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Backtesting / Closure Fields */}
                {status === TradeStatus.CLOSED && (
                  <div className="grid grid-cols-2 gap-3 pt-2 animate-fadeIn bg-slate-100 p-3 rounded-xl border border-slate-200">
                     <div className="col-span-2 text-xs font-bold text-slate-500">复盘 / 回测数据</div>
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 mb-1">平仓价格</label>
                        <input
                          type="number"
                          step="0.25"
                          value={exitPrice}
                          onChange={(e) => setExitPrice(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-mono focus:border-indigo-500 outline-none"
                          placeholder="Exit Price"
                        />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 mb-1">离场K#</label>
                        <input
                          type="text"
                          value={exitCandleNumber}
                          onChange={(e) => setExitCandleNumber(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-mono focus:border-indigo-500 outline-none"
                          placeholder="#"
                        />
                     </div>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="mt-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">K线截图 (推荐用于AI分析)</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition ${chartImage ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-300 hover:border-indigo-400 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
                >
                  <Camera size={18} />
                  {chartImage ? '图片已上传 (点击更换)' : '上传 K线截图'}
                </button>
                {chartImage && (
                  <div className="mt-2 h-24 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                    <img src={chartImage} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            onClick={handleNext}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2"
          >
            {step === 1 ? '下一步' : (status === TradeStatus.CLOSED ? '记录复盘' : '记录交易')} <ArrowUpRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
