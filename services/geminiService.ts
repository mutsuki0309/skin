
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, IngredientAnalysis, EnvironmentalData, UserFactors } from "../types";

export const analyzeSkin = async (
  leftImage: string | null,
  rightImage: string | null,
  env: EnvironmentalData,
  factors: UserFactors,
  timeOfDay: 'Morning' | 'Evening',
  washStatus: 'Before' | 'After'
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    你是一位極度乾燥敏感肌的頂級智能皮膚管理助手。
    分析用戶上傳的左臉頰與右臉頰皮膚照片。
    
    環境數據：氣溫 ${env.temperature}°C, 濕度 ${env.humidity}%, 露點 ${env.dewPoint}°C。
    暖氣狀態: ${factors.isHeatingOn ? '開啟' : '關閉'}。
    用戶因素：生理期: ${factors.isPeriod ? '是' : '否'}, 用藥: ${factors.onMedication}, 狀態: ${factors.otherStatus}。
    目前時段：${timeOfDay === 'Morning' ? '早上 (Morning)' : '晚上 (Evening)'}。
    洗臉狀態：${washStatus === 'Before' ? '尚未洗臉' : '已洗臉 (使用 Curél 潤浸保濕洗顏慕絲)'}。
    
    【核心邏輯規則】：
    1. 環境判定：若 (露點 < 10°C) 或 (暖氣開啟)，判定為「極乾環境」，保養流程中化妝水與乳液「必須」優先選用 ヒルマイルド (Healmild) 系列。
    2. 局部用藥判定：
       - 紅色痘印/平面紅斑 -> 建議 マキロン (Makiron)。
       - 褐色暗沈/陳舊疤痕 -> 建議 喜能復 (Hiruscar)。
       - 凸起痘痘/膿頭 -> 建議 3M 抗痘凝露。
    3. 產品挑選：只能從用戶清單中挑選。
    4. 洗臉狀態邏輯：若洗臉狀態為「洗臉後」，保養流程請直接從「打底」或「棉片」步驟開始。
    5. 【美容儀器 (medicube AGE-R BOOSTER PRO) 邏輯】：
       - 模式名稱：Booster 模式 (橘光)、MC 模式 (綠光)、Derma Shot 模式 (紅光)、Air Shot 模式 (藍光)。
       - 紫光輔助邏輯：紫光是輔助模式，必須與上述四種主模式之一搭配使用（例如：Booster+紫光），不可單獨存在。
       - Air Shot 模式必須在「乾臉」時使用。
    6. 必須使用「繁體中文」回答。
  `;

  const prompt = `
    請分析上傳的左臉頰與右臉頰照片。
    根據觀察結果、環境數據以及「${timeOfDay}」與「${washStatus === 'After' ? '已洗臉' : '洗臉前'}」的狀態，提供精準診斷，並排出 1 到 5 步的保養流程。
    如果建議使用 medicube AGE-R BOOSTER PRO，請具體說明建議模式（橘、綠、紅或藍光）並提醒可搭配紫光使用。
  `;

  const contents = {
    parts: [
      { text: prompt },
      ...(leftImage ? [{ inlineData: { data: leftImage.split(',')[1], mimeType: 'image/jpeg' } }] : []),
      ...(rightImage ? [{ inlineData: { data: rightImage.split(',')[1], mimeType: 'image/jpeg' } }] : [])
    ]
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          observations: { type: Type.ARRAY, items: { type: Type.STRING } },
          diagnosis: { type: Type.STRING },
          routine: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.NUMBER },
                label: { type: Type.STRING },
                product: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["step", "label", "product", "reason"]
            }
          }
        },
        required: ["summary", "observations", "diagnosis", "routine"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzeIngredients = async (
  image: string | null,
  manualText: string | null,
  isInventoryMode: boolean
): Promise<IngredientAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    你是一位保養品成分分析專家。針對「極度乾燥敏感肌」進行審查。
    若提供照片，請辨識產品名稱與成分；若提供文字，請直接分析成分。
    
    【審查標準】：
    - ✅ 優點：神經醯胺、積雪草、玻尿酸、PDRN、泛醇、尿囊素。
    - ⚠️ 缺點：變性酒精、香精、高濃度水楊酸、防腐劑。
    
    必須使用「繁體中文」。
  `;

  const prompt = isInventoryMode 
    ? "詳細分析此產品的成分、核心功效、優缺點以及建議使用時機。"
    : "分析此產品是否適合購買，並指出其對乾燥敏感肌的利弊。";

  const parts: any[] = [{ text: prompt }];
  if (image) {
    parts.push({ inlineData: { data: image.split(',')[1], mimeType: 'image/jpeg' } });
  }
  if (manualText) {
    parts.push({ text: `手動輸入成分表：${manualText}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          effects: { type: Type.STRING },
          timing: { type: Type.STRING },
          recommendation: { type: Type.STRING, enum: ["PASS", "FAIL"] }
        },
        required: ["productName", "pros", "cons", "effects", "timing", "recommendation"]
      }
    }
  });

  return JSON.parse(response.text);
};
