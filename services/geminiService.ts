
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { Trade } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
const modelName = "gemini-2.5-flash";

export const analyzeTradeWithAI = async (trade: Trade): Promise<{ feedback: string; score: number }> => {
  if (!process.env.API_KEY) {
    return {
      feedback: "缺少 API Key。请配置环境以使用 AI 教练。",
      score: 0
    };
  }

  const prompt = `
    你是一位世界级的机构交易教练，专精于价格行为（Price Action）和交易心理学。
    请分析以下初学者交易员的交易执行情况。
    
    交易详情:
    - 交易品种: ${trade.asset}
    - 策略依据: ${trade.strategy}
    - 风格类型: ${trade.style}
    - 入场K线标号: ${trade.entryCandleNumber || '未提供'}
    - 离场K线标号: ${trade.exitCandleNumber || '未平仓或未提供'}
    - 时间周期: ${trade.timeframe}
    - 方向: ${trade.direction}
    - 入场价格: ${trade.entryPrice}
    - 止损价格: ${trade.stopLoss}
    - 平仓价格: ${trade.exitPrice || 'N/A'}
    - 结果 (点数): ${trade.pnlPoints || '持仓中'}
    - 用户提供的市场背景: "${trade.marketContext}"
    - 用户信心指数: ${trade.confidence}%
    - 交易前情绪状态: ${trade.isEmotional ? "情绪化/不稳定" : "稳定/冷静"}
    - 用户心得/笔记: "${trade.userNotes || '无'}"
    
    任务:
    1. 基于策略 "${trade.strategy}" 和风格 "${trade.style}" 批判该交易设置的合理性。
    2. 评估入场与止损的风险回报比（盈亏比）。如果已平仓，点评离场是否符合逻辑（基于K线标号和价格）。
    3. 如果提供了图片，请结合K线形态（反转、突破、量能等）进行分析。
    4. 结合用户的心得/笔记进行针对性指导。
    5. 给出 0 到 10 的技术评分（10分为完美执行）。
    6. 建议必须简洁、具体、严厉但带有鼓励性。使用中文回答。

    输出格式 (JSON):
    {
      "feedback": "你的详细反馈内容...",
      "score": 8
    }
  `;

  try {
    const parts: any[] = [{ text: prompt }];

    if (trade.chartImage) {
      const match = trade.chartImage.match(/^data:(.*);base64,(.*)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json"
      }
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("AI 未返回响应");

    const result = JSON.parse(textResponse);
    return {
      feedback: result.feedback || "无法生成反馈。",
      score: typeof result.score === 'number' ? result.score : 0
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      feedback: "连接 AI 教练时发生错误，请稍后再试。",
      score: 0
    };
  }
};

export const createPAChatSession = (): Chat => {
  if (!process.env.API_KEY) {
    throw new Error("Missing API Key");
  }

  return ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: `
        你是一位精通 Price Action（价格行为）交易法的资深导师，类似于 Al Brooks 或 Steve Nison 的风格，但也融合了现代机构订单流（ICT/SMC）的理解。
        
        你的角色：
        1. 随时回答用户关于K线形态、市场结构（HH/HL）、支撑阻力、趋势线、通道等技术问题。
        2. 你的回答应该简洁、专业、客观。不要给出具体的“投资建议”（如：现在立刻买入），而是给出“技术分析视角”（如：这里出现了一个双底结构，如果突破颈线可能是做多机会）。
        3. 关注风险管理和交易心理。如果用户表现出急躁、赌博心态，请温和地提醒。
        4. 请使用中文与用户交流。
        
        你的专长领域：
        - 趋势识别（Trend Identification）
        - 反转形态（Reversal Patterns: 楔形, 双顶/底, 头肩顶/底）
        - 突破与回调（Breakouts & Pullbacks）
        - K线信号（Pin bar, Engulfing, Inside bar）
        - 市场背景解读（Context is King）
      `,
    }
  });
};
