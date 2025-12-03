
export enum Asset {
  ES = 'ES (标普500)',
  NQ = 'NQ (纳指100)',
  GC = 'GC (黄金)',
}

export enum OrderType {
  MARKET = '市价单',
  LIMIT = '限价单',
  STOP = '止损单',
}

export enum Direction {
  LONG = '做多',
  SHORT = '做空',
}

export enum Strategy {
  TREND_FOLLOW = '趋势跟随',
  RANGE_FADE = '震荡区间高抛低吸',
  REVERSAL = '主要趋势反转',
  WEDGE_REVERSAL = '楔形反转',
  BREAKOUT = '突破跟随',
  PULLBACK = '趋势回调入场',
}

export enum TradeStatus {
  OPEN = '持仓中',
  CLOSED = '已平仓',
}

export type TradeStyle = '超短线' | '波段' | '突破' | '反转';

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  
  // Pre-trade Check
  isEmotional: boolean;
  marketContext: string;
  isKeyLevel: boolean;
  confidence: number; // 1-100
  style: TradeStyle;
  
  // Trade Details
  asset: Asset;
  timeframe: string; // e.g., "1m", "5m"
  entryCandleNumber?: string; // K线标号
  strategy: Strategy;
  orderType: OrderType;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit?: number; // Optional
  
  // Execution
  status: TradeStatus;
  exitPrice?: number;
  exitCandleNumber?: string; // New field: 离场K线标号
  pnlPoints?: number;
  
  // Media & AI
  chartImage?: string; // Base64
  aiFeedback?: string;
  aiScore?: number; // 0-10
  userNotes?: string;
  
  // System
  isDeleted?: boolean;
}

export interface DailyStats {
  date: string;
  totalTrades: number;
  totalPoints: number;
  wins: number;
  losses: number;
}

// AI Chat Types
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
}
