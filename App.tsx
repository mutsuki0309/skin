
import React, { useState, useEffect } from 'react';
import { 
  AppMode, 
  ProductCategory, 
  InventoryItem, 
  EnvironmentalData, 
  AnalysisResult, 
  IngredientAnalysis,
  UserFactors
} from './types';
import { INITIAL_INVENTORY } from './constants';
import { analyzeSkin, analyzeIngredients } from './services/geminiService';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.ANALYSIS);
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('skincare_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });
  
  const [envData, setEnvData] = useState<EnvironmentalData>({
    temperature: 18,
    humidity: 55,
    dewPoint: 9,
    isHeatingOn: false
  });

  const [userFactors, setUserFactors] = useState<UserFactors>(() => {
    const saved = localStorage.getItem('skincare_user_factors');
    return saved ? JSON.parse(saved) : {
      isPeriod: false,
      onMedication: "",
      otherStatus: "",
      isHeatingOn: false
    };
  });

  // UI States
  const [skinPhotos, setSkinPhotos] = useState<{ left: string | null, right: string | null }>({ left: null, right: null });
  const [timeOfDay, setTimeOfDay] = useState<'Morning' | 'Evening'>('Morning');
  const [washStatus, setWashStatus] = useState<'Before' | 'After'>('Before');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [checkerResult, setCheckerResult] = useState<IngredientAnalysis | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('skincare_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('skincare_user_factors', JSON.stringify(userFactors));
  }, [userFactors]);

  useEffect(() => {
    const fetchEnv = () => {
      setEnvData(prev => ({
        ...prev,
        temperature: 14 + Math.random() * 6,
        humidity: 60 + Math.random() * 20,
        dewPoint: 8 + Math.random() * 4
      }));
    };
    fetchEnv();
    const interval = setInterval(fetchEnv, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: string, itemId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      if (slot === 'leftSkin') setSkinPhotos(prev => ({ ...prev, left: base64 }));
      else if (slot === 'rightSkin') setSkinPhotos(prev => ({ ...prev, right: base64 }));
      else if (slot === 'frontProduct' && itemId) {
        setInventory(prev => prev.map(item => item.id === itemId ? { ...item, frontImage: base64 } : item));
        const item = inventory.find(i => i.id === itemId);
        if (item && item.category !== ProductCategory.DEVICE) {
          runIdentification(base64, itemId);
        }
      }
      else if (slot === 'backProduct' && itemId) {
        setInventory(prev => prev.map(item => item.id === itemId ? { ...item, backImage: base64 } : item));
        runIngredientCheck(base64, null, itemId, true);
      }
      else if (slot === 'checker') {
        runIngredientCheck(base64, null, null, false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const runIdentification = async (img: string, id: string) => {
    setLoading(true);
    try {
      const result = await analyzeIngredients(img, null, true);
      setInventory(prev => prev.map(item => 
        item.id === id 
          ? { 
              ...item, 
              name: result.productName, 
              brand: "AI 辨識品牌",
              ingredients: result.pros,
              cons: result.cons,
              effects: result.effects,
              usageTiming: result.timing,
              recommendation: result.recommendation
            } 
          : item
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!skinPhotos.left && !skinPhotos.right) return;
    setLoading(true);
    try {
      const result = await analyzeSkin(skinPhotos.left, skinPhotos.right, envData, userFactors, timeOfDay, washStatus);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      alert("分析失敗，請檢查網路。");
    } finally {
      setLoading(false);
    }
  };

  const runIngredientCheck = async (img: string | null, text: string | null, id: string | null, isInventory: boolean) => {
    setLoading(true);
    try {
      const result = await analyzeIngredients(img, text, isInventory);
      if (id) {
        setInventory(prev => prev.map(item => 
          item.id === id 
            ? { 
                ...item, 
                name: result.productName,
                ingredients: result.pros,
                cons: result.cons,
                effects: result.effects,
                usageTiming: result.timing,
                recommendation: result.recommendation
              } 
            : item
        ));
      } else {
        setCheckerResult(result);
      }
    } catch (err) {
      console.error(err);
      alert("解析失敗。");
    } finally {
      setLoading(false);
    }
  };

  const updateStock = (id: string, count: number) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, stockCount: count } : item));
  };

  const isExtremeDry = envData.dewPoint < 10 || userFactors.isHeatingOn;

  return (
    <div className="min-h-screen pb-28 max-w-2xl mx-auto shadow-2xl bg-white flex flex-col relative overflow-x-hidden antialiased">
      <header className="p-7 bg-gradient-to-b from-[#fffcfd] to-[#fff7f9] border-b border-pink-100 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-2xl flex items-center justify-center text-xl">🌸</div>
            <div>
              <h1 className="text-2xl font-bold text-pink-500 tracking-tight leading-none">潤敏肌助手</h1>
              <p className="text-[10px] text-pink-300 font-bold tracking-[0.2em] uppercase mt-1">Sakura Care Assistant</p>
            </div>
          </div>
          <div className="text-right bg-white/80 px-4 py-2 rounded-3xl border border-pink-100 shadow-sm backdrop-blur-md">
            <span className="text-[9px] block text-pink-300 uppercase font-bold tracking-widest mb-0.5">即時環境</span>
            <span className="text-sm font-bold text-pink-400">
              {envData.temperature.toFixed(1)}° / {envData.humidity.toFixed(0)}%
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-7">
        {isExtremeDry && (
          <div className="p-5 bg-orange-50/70 border-l-4 border-orange-300 rounded-r-[2rem] shadow-sm flex items-start gap-4 animate-pulse">
            <div className="text-2xl mt-1">🏜️</div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-orange-800">櫻花警報：極端乾燥</h4>
              <p className="text-xs text-orange-600 mt-1 font-bold">露點低於預警，建議強化 Healmild 鎖水。</p>
            </div>
            <button 
              onClick={() => setUserFactors(p => ({...p, isHeatingOn: !p.isHeatingOn}))}
              className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all shadow-sm ${userFactors.isHeatingOn ? 'bg-orange-400 text-white' : 'bg-white text-orange-400 border border-orange-200'}`}
            >
              暖氣: {userFactors.isHeatingOn ? 'ON' : 'OFF'}
            </button>
          </div>
        )}

        {mode === AppMode.ANALYSIS && (
          <div className="space-y-7">
            {!analysisResult ? (
              <div className="space-y-7">
                <div className="bg-pink-50/40 border-2 border-dashed border-pink-100 rounded-[2.5rem] p-8 text-center">
                  <h3 className="font-bold text-pink-500 mb-6 text-lg tracking-tight">第一步：膚況照片分析</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {['leftSkin', 'rightSkin'].map(slot => {
                      const img = slot === 'leftSkin' ? skinPhotos.left : skinPhotos.right;
                      return (
                        <label key={slot} className="aspect-[3/4] rounded-[2rem] bg-white border border-pink-100 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 transition-all overflow-hidden relative shadow-sm hover:shadow-md active:scale-95 group">
                          {img ? (
                            <img src={img} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center mb-3 group-hover:bg-pink-100 transition-colors">
                                <span className="text-3xl">🤳</span>
                              </div>
                              <span className="text-[11px] font-bold text-pink-300 uppercase tracking-widest">{slot === 'leftSkin' ? '左頰' : '右頰'}</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, slot)} />
                        </label>
                      );
                    })}
                  </div>
                  
                  <div className="mt-8 space-y-6">
                    <p className="text-[10px] font-bold text-pink-200 uppercase tracking-[0.4em]">環境與生活參數</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setTimeOfDay('Morning')}
                        className={`flex-1 py-4 rounded-[1.25rem] text-[13px] font-bold border transition-all shadow-sm ${timeOfDay === 'Morning' ? 'bg-pink-400 text-white border-pink-400' : 'bg-white text-pink-300 border-pink-50'}`}
                      >☀️ 晨間保養</button>
                      <button 
                        onClick={() => setTimeOfDay('Evening')}
                        className={`flex-1 py-4 rounded-[1.25rem] text-[13px] font-bold border transition-all shadow-sm ${timeOfDay === 'Evening' ? 'bg-pink-400 text-white border-pink-400' : 'bg-white text-pink-300 border-pink-50'}`}
                      >🌙 晚間修復</button>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setWashStatus('Before')}
                        className={`flex-1 py-4 rounded-[1.25rem] text-[13px] font-bold border transition-all shadow-sm ${washStatus === 'Before' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-pink-300 border-pink-50'}`}
                      >🧼 洗臉前</button>
                      <button 
                        onClick={() => setWashStatus('After')}
                        className={`flex-1 py-4 rounded-[1.25rem] text-[13px] font-bold border transition-all shadow-sm ${washStatus === 'After' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-pink-300 border-pink-50'}`}
                      >🚿 洗臉後</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-pink-50 shadow-sm space-y-6">
                   <h3 className="font-bold text-pink-400 text-sm flex items-center gap-3">
                     <span className="w-1.5 h-5 bg-pink-100 rounded-full"></span>個人身體狀態
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                     <button 
                        onClick={() => setUserFactors(p => ({...p, isPeriod: !p.isPeriod}))}
                        className={`py-4 rounded-[1.25rem] text-xs font-bold border transition-all ${userFactors.isPeriod ? 'bg-pink-50 border-pink-100 text-pink-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                     >🌸 生理期中</button>
                     <input 
                        placeholder="近期特殊用藥"
                        value={userFactors.onMedication}
                        onChange={(e) => setUserFactors(p => ({...p, onMedication: e.target.value}))}
                        className="py-4 px-6 rounded-[1.25rem] text-xs font-bold bg-gray-50 border border-gray-100 outline-none focus:border-pink-200 focus:bg-white transition-all placeholder:text-gray-300 shadow-inner"
                     />
                   </div>
                   <button 
                    disabled={(!skinPhotos.left && !skinPhotos.right) || loading}
                    onClick={runAnalysis}
                    className="w-full py-5 bg-pink-400 text-white rounded-[1.5rem] font-bold shadow-sakura disabled:bg-gray-200 transition-all mt-4 hover:bg-pink-500 active:scale-[0.98] text-base tracking-widest"
                  >
                    {loading ? 'AI 粉圓智慧分析中...' : '開始 AI 膚況診斷'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in space-y-8">
                <section className="bg-white rounded-[2.5rem] p-8 shadow-md border border-pink-50">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-pink-500">AI 診斷分析結果</h3>
                    <button onClick={() => setAnalysisResult(null)} className="text-[11px] font-bold text-pink-400 uppercase px-4 py-2 bg-pink-50/50 rounded-full hover:bg-pink-50 transition-colors">重新分析</button>
                  </div>
                  <div className="space-y-6">
                    <p className="text-sm font-bold text-gray-600 leading-relaxed">{analysisResult.summary}</p>
                    <div className="bg-[#fffafa] p-6 rounded-[2rem] border-l-4 border-pink-200 shadow-inner">
                      <p className="text-sm italic text-pink-700 font-bold leading-relaxed">「{analysisResult.diagnosis}」</p>
                    </div>
                  </div>
                </section>
                <section className="space-y-4">
                  <h3 className="text-[11px] font-bold text-pink-200 uppercase tracking-[0.3em] px-3">櫻花粉圓推薦保養流程</h3>
                  {analysisResult.routine.map((step) => (
                    <div key={step.step} className="bg-white rounded-[2rem] p-6 shadow-sm border border-pink-50 flex gap-5 hover:border-pink-200 transition-all group">
                      <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center font-bold flex-shrink-0 border border-pink-100 text-xl group-hover:bg-pink-400 group-hover:text-white transition-all">{step.step}</div>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase font-bold text-pink-200 tracking-[0.2em] mb-1">{step.label}</p>
                        <p className="font-bold text-gray-800 text-base leading-tight mb-1">{step.product}</p>
                        <p className="text-xs text-gray-500 font-bold leading-relaxed">{step.reason}</p>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            )}
          </div>
        )}

        {mode === AppMode.INVENTORY && (
          <div className="space-y-7">
            <button 
              onClick={() => {
                const id = Math.random().toString(36).substr(2, 9);
                setInventory(prev => [{ id, name: "櫻花新品", category: ProductCategory.SERUM, brand: "辨識中" }, ...prev]);
                setExpandedItemId(id);
              }}
              className="w-full py-5 bg-white border-2 border-pink-100 rounded-[1.5rem] text-sm font-bold text-pink-400 shadow-sakura hover:bg-pink-50 transition-all active:scale-[0.98]"
            >🌸 點擊入庫新保養品</button>

            <div className="space-y-6">
              {Object.values(ProductCategory).map((cat) => {
                const items = inventory.filter(i => i.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="space-y-3">
                    <h4 className="text-[11px] font-bold text-pink-200 uppercase tracking-[0.4em] px-3">{cat}</h4>
                    {items.map(item => {
                      const isExpanded = expandedItemId === item.id;
                      return (
                        <div key={item.id} className="bg-white rounded-[2.25rem] border border-pink-50 shadow-sm overflow-hidden hover:shadow-md transition-all">
                          <div 
                            onClick={() => setExpandedItemId(isExpanded ? null : item.id)} 
                            className="p-6 flex justify-between items-center cursor-pointer active:bg-pink-50 transition-colors"
                          >
                            <div className="flex items-center gap-5 flex-1">
                              {item.frontImage && !isExpanded && (
                                <img src={item.frontImage} className="w-14 h-14 rounded-2xl object-cover border border-pink-50 shadow-sm animate-fade-in" alt="preview" />
                              )}
                              <div className="flex-1">
                                <p className="font-bold text-gray-800 text-[15px] leading-tight mb-0.5">{item.name}</p>
                                <p className="text-[10px] text-pink-300 font-bold tracking-widest uppercase">{item.brand}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {item.category === ProductCategory.MASK && (
                                <div className="flex items-center gap-2 bg-pink-50/70 px-4 py-2 rounded-full" onClick={(e) => e.stopPropagation()}>
                                  <input 
                                    type="number" 
                                    value={item.stockCount ?? 0} 
                                    onChange={(e) => updateStock(item.id, parseInt(e.target.value) || 0)} 
                                    className="w-8 bg-transparent text-xs font-bold text-pink-500 outline-none text-center" 
                                  />
                                </div>
                              )}
                              <span className={`text-pink-100 text-sm transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-6 pb-8 pt-3 bg-[#fffdfd] border-t border-pink-50 space-y-6 animate-fade-in">
                              <div className="grid grid-cols-2 gap-5">
                                <label className="aspect-square bg-white border border-pink-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-inner hover:border-pink-200 transition-all group">
                                  {item.frontImage ? (
                                    <img src={item.frontImage} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="text-center p-5">
                                      <span className="text-3xl opacity-40 block mb-2 group-hover:scale-110 transition-transform">📸</span>
                                      <span className="text-[10px] font-bold text-pink-200 uppercase tracking-widest">正面圖辨識</span>
                                    </div>
                                  )}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'frontProduct', item.id)} />
                                </label>
                                <label className={`aspect-square bg-white border border-pink-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-inner hover:border-pink-200 transition-all group ${item.category === ProductCategory.DEVICE ? 'opacity-20 pointer-events-none' : ''}`}>
                                  {item.backImage ? (
                                    <img src={item.backImage} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="text-center p-5">
                                      <span className="text-3xl opacity-40 block mb-2 group-hover:scale-110 transition-transform">🔍</span>
                                      <span className="text-[10px] font-bold text-pink-200 uppercase tracking-widest">成分全析</span>
                                    </div>
                                  )}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'backProduct', item.id)} />
                                </label>
                              </div>
                              
                              {item.category !== ProductCategory.DEVICE && (
                                <div className="text-center bg-white p-6 rounded-[2rem] border border-pink-50 shadow-sm">
                                  <button 
                                    onClick={() => setShowManualInput(showManualInput === item.id ? null : item.id)}
                                    className="text-[11px] font-bold text-pink-400 flex items-center justify-center gap-2 mx-auto hover:text-pink-600 transition-colors"
                                  >
                                    <span className="text-xl">✍️</span>
                                    <span className="underline decoration-pink-100 underline-offset-8">手動輸入成分表 (jf 粉圓體)</span>
                                  </button>
                                  
                                  {showManualInput === item.id && (
                                    <div className="mt-6 space-y-4 animate-fade-in">
                                      <textarea 
                                        className="w-full p-6 rounded-[1.75rem] border border-pink-50 text-xs font-bold outline-none focus:border-pink-300 bg-[#fffdfd] shadow-inner placeholder:text-pink-100 resize-none transition-all" 
                                        rows={4} 
                                        placeholder="在此貼上您手打或複製的成分表清單..."
                                        value={item.manualIngredients || ""}
                                        onChange={(e) => setInventory(prev => prev.map(i => i.id === item.id ? { ...i, manualIngredients: e.target.value } : i))}
                                      />
                                      <button 
                                        disabled={!item.manualIngredients?.trim() || loading}
                                        onClick={() => runIngredientCheck(null, item.manualIngredients || "", item.id, true)}
                                        className="w-full py-4 bg-pink-400 text-white rounded-2xl text-[13px] font-bold shadow-sakura disabled:bg-gray-100 active:scale-[0.98] transition-all"
                                      >AI 解析並保存至櫻花庫存</button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {(item.ingredients || item.effects) && (
                                <div className="bg-white p-7 rounded-[2rem] border border-pink-50 shadow-sm space-y-5 animate-fade-in">
                                  <div>
                                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2">✨ 櫻花肌推薦成分</p>
                                    <p className="text-xs font-bold text-gray-700 mb-4 leading-relaxed">{item.effects}</p>
                                    <div className="flex flex-wrap gap-2">
                                      {item.ingredients?.map(ing => <span key={ing} className="bg-green-50/70 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-bold border border-green-100">{ing}</span>)}
                                    </div>
                                  </div>
                                  {item.cons && item.cons.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2">⚠️ 刺激風險警示</p>
                                      <div className="flex flex-wrap gap-2">
                                        {item.cons.map(c => <span key={c} className="bg-pink-50 text-pink-400 px-4 py-1.5 rounded-full text-[10px] font-bold border border-pink-100">{c}</span>)}
                                      </div>
                                    </div>
                                  )}
                                  <div className="pt-4 border-t border-pink-50">
                                    <p className="text-[10px] font-bold text-pink-200 uppercase tracking-widest mb-2">建議使用時機</p>
                                    <p className="text-xs text-gray-500 font-bold leading-relaxed">{item.usageTiming}</p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center pt-3">
                                <span className="text-[9px] text-pink-100 font-bold tracking-[0.2em]">REF: {item.id}</span>
                                <button onClick={() => setInventory(prev => prev.filter(i => i.id !== item.id))} className="text-[11px] font-bold text-pink-200 hover:text-pink-500 transition-colors flex items-center gap-1">🗑️ 移除品項</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {inventory.length > 0 && (
                <div className="pt-12 text-center">
                   <button 
                    onClick={() => { if(confirm('確定要清除所有櫻花記憶嗎？')) setInventory(INITIAL_INVENTORY); }}
                    className="text-[10px] font-bold text-pink-100 underline decoration-pink-50 underline-offset-8 hover:text-pink-300 transition-colors"
                   >清空歷史數據記憶</button>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === AppMode.CHECKER && (
          <div className="space-y-7">
            <div className="bg-[#fffcfd] rounded-[2.5rem] p-12 text-center border-2 border-dashed border-pink-100 shadow-inner">
              <div className="w-24 h-24 bg-pink-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                <span className="text-5xl">🛡️</span>
              </div>
              <h2 className="text-2xl font-bold text-pink-500 mb-4 tracking-tight">櫻花採購掃雷</h2>
              <p className="text-sm text-pink-300 font-bold mb-10 italic px-8 leading-relaxed">在您購買新產品前，讓 AI 為乾燥敏感肌把關每一項成分。</p>
              <label className="w-full py-5 bg-pink-400 text-white rounded-[1.5rem] font-bold shadow-sakura flex items-center justify-center gap-4 cursor-pointer hover:bg-pink-500 active:scale-95 transition-all text-base tracking-widest">
                📸 拍攝成分表開始掃雷
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'checker')} />
              </label>
            </div>

            {checkerResult && (
              <div className={`bg-white rounded-[2.5rem] p-9 border-4 shadow-2xl animate-fade-in ${checkerResult.recommendation === 'PASS' ? 'border-green-300 shadow-green-50' : 'border-pink-300 shadow-pink-50'}`}>
                <h3 className="text-2xl font-bold text-gray-800 mb-7 leading-tight">{checkerResult.productName}</h3>
                <div className="space-y-7">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="bg-green-50/60 p-6 rounded-[2rem]">
                        <p className="text-[10px] font-bold text-green-600 mb-4 tracking-widest uppercase">✨ 極佳優點</p>
                        <div className="flex flex-wrap gap-2">
                          {checkerResult.pros.map((p, i) => <span key={i} className="text-[10px] bg-white px-3 py-1.5 rounded-full shadow-sm font-bold border border-green-100 text-green-700">{p}</span>)}
                        </div>
                      </div>
                      <div className="bg-pink-50/60 p-6 rounded-[2rem]">
                        <p className="text-[10px] font-bold text-pink-400 mb-4 tracking-widest uppercase">⚠️ 致敏風險</p>
                        <div className="flex flex-wrap gap-2">
                          {checkerResult.cons.map((p, i) => <span key={i} className="text-[10px] bg-white px-3 py-1.5 rounded-full shadow-sm font-bold border border-pink-100 text-pink-700">{p}</span>)}
                        </div>
                      </div>
                   </div>
                   <div className="bg-gray-50/80 p-7 rounded-[2rem] space-y-4 text-sm font-bold text-gray-600 shadow-inner">
                      <p><strong className="text-pink-400">主要功效：</strong>{checkerResult.effects}</p>
                      <p><strong className="text-pink-400">專家建議：</strong>{checkerResult.timing}</p>
                   </div>
                   <div className={`py-6 rounded-[1.5rem] text-center font-bold tracking-[0.25em] shadow-lg transition-all text-base ${checkerResult.recommendation === 'PASS' ? 'bg-green-400 text-white' : 'bg-pink-400 text-white'}`}>
                    {checkerResult.recommendation === 'PASS' ? '✨ 極力推薦購買' : '❌ 建議避雷 (不推薦)'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white/95 backdrop-blur-2xl border-t border-pink-50 h-28 flex items-center justify-around px-8 pb-6 z-40 shadow-[0_-15px_40px_-15px_rgba(249,168,212,0.3)]">
        {[{mode: AppMode.ANALYSIS, icon: '🌸', label: '膚況'}, {mode: AppMode.INVENTORY, icon: '🍱', label: '庫存'}, {mode: AppMode.CHECKER, icon: '🛡️', label: '掃雷'}].map(t => (
          <button key={t.mode} onClick={() => setMode(t.mode)} className={`flex flex-col items-center gap-2.5 transition-all duration-500 ${mode === t.mode ? 'text-pink-500 scale-110 font-bold' : 'text-pink-200 opacity-60'}`}>
            <span className="text-3xl">{t.icon}</span>
            <span className="text-[10px] uppercase font-bold tracking-[0.3em]">{t.label}</span>
          </button>
        ))}
      </nav>

      {loading && (
        <div className="fixed inset-0 z-[60] bg-white/85 backdrop-blur-lg flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center mb-10">
            <div className="absolute inset-0 border-[6px] border-pink-50 border-t-pink-400 rounded-full animate-spin"></div>
            <span className="text-5xl animate-bounce">🌸</span>
          </div>
          <p className="text-pink-500 font-bold animate-pulse text-xl tracking-[0.15em] text-center px-12 leading-relaxed">AI 櫻花粉圓智慧分析中...</p>
          <p className="text-pink-300 text-[10px] mt-4 font-bold tracking-[0.4em] uppercase">Processing Skincare Wisdom</p>
        </div>
      )}
    </div>
  );
};

export default App;
