
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
    <div className="min-h-screen pb-24 max-w-2xl mx-auto shadow-2xl bg-white flex flex-col relative">
      <header className="p-6 bg-gradient-to-r from-pink-50 to-white border-b border-pink-100 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pink-800 tracking-tight">潤敏肌管理助手</h1>
            <p className="text-xs text-pink-500 font-medium tracking-wide">Dynamic Skincare AI Assistant</p>
          </div>
          <div className="text-right bg-white/50 px-3 py-1 rounded-2xl border border-pink-100 shadow-sm">
            <span className="text-[10px] block text-gray-400 uppercase font-bold tracking-widest">Taipei Now</span>
            <span className="text-sm font-bold text-pink-700">
              {envData.temperature.toFixed(1)}° / {envData.humidity.toFixed(0)}%
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 space-y-6">
        {isExtremeDry && (
          <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-2xl shadow-sm animate-pulse flex items-start gap-4">
            <div className="text-2xl mt-1">🌵</div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-orange-800">極乾環境警告</h4>
              <p className="text-xs text-orange-700 mt-1">環境極度乾燥，建議強化 Healmild 系列修復。</p>
            </div>
            <button 
              onClick={() => setUserFactors(p => ({...p, isHeatingOn: !p.isHeatingOn}))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${userFactors.isHeatingOn ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-600'}`}
            >
              暖氣: {userFactors.isHeatingOn ? 'ON' : 'OFF'}
            </button>
          </div>
        )}

        {mode === AppMode.ANALYSIS && (
          <div className="space-y-6">
            {!analysisResult ? (
              <div className="space-y-6">
                <div className="bg-pink-50/30 border-2 border-dashed border-pink-200 rounded-3xl p-6">
                  <h3 className="font-bold text-pink-800 mb-4 text-center">第一步：上傳臉頰照片</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {['leftSkin', 'rightSkin'].map(slot => {
                      const img = slot === 'leftSkin' ? skinPhotos.left : skinPhotos.right;
                      return (
                        <label key={slot} className="aspect-[3/4] rounded-2xl bg-white border border-pink-200 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 transition-all overflow-hidden relative shadow-sm">
                          {img ? (
                            <img src={img} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <span className="text-2xl opacity-60">📸</span>
                              <span className="text-[10px] font-bold text-pink-400 mt-1 uppercase tracking-tighter">{slot === 'leftSkin' ? '左臉頰' : '右臉頰'}</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, slot)} />
                        </label>
                      );
                    })}
                  </div>
                  
                  {/* Context Buttons */}
                  <div className="mt-6 space-y-4">
                    <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest text-center">時段與洗臉狀態</p>
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => setTimeOfDay('Morning')}
                        className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all shadow-sm ${timeOfDay === 'Morning' ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-400 border-gray-100'}`}
                      >☀️ 早上</button>
                      <button 
                        onClick={() => setTimeOfDay('Evening')}
                        className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all shadow-sm ${timeOfDay === 'Evening' ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-400 border-gray-100'}`}
                      >🌙 晚上</button>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => setWashStatus('Before')}
                        className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all shadow-sm ${washStatus === 'Before' ? 'bg-pink-800 text-white border-pink-800' : 'bg-white text-gray-400 border-gray-100'}`}
                      >🧼 洗臉前</button>
                      <button 
                        onClick={() => setWashStatus('After')}
                        className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all shadow-sm ${washStatus === 'After' ? 'bg-pink-800 text-white border-pink-800' : 'bg-white text-gray-400 border-gray-100'}`}
                      >🚿 洗臉後</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                   <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                     <span className="w-1 h-4 bg-pink-400 rounded-full"></span>第二步：目前狀態
                   </h3>
                   <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={() => setUserFactors(p => ({...p, isPeriod: !p.isPeriod}))}
                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${userFactors.isPeriod ? 'bg-pink-100 border-pink-300 text-pink-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                     >🩸 生理期中</button>
                     <input 
                        placeholder="近期服藥狀況"
                        value={userFactors.onMedication}
                        onChange={(e) => setUserFactors(p => ({...p, onMedication: e.target.value}))}
                        className="py-3 px-4 rounded-2xl text-xs bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 shadow-sm"
                     />
                   </div>
                   <button 
                    disabled={(!skinPhotos.left && !skinPhotos.right) || loading}
                    onClick={runAnalysis}
                    className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-100 disabled:bg-gray-200 transition-all mt-4 active:scale-95"
                  >
                    {loading ? 'AI 正在精準分析...' : '開始 AI 診斷分析'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in space-y-6">
                <section className="bg-white rounded-3xl p-6 shadow-md border border-pink-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">AI 分析報告</h3>
                    <button onClick={() => setAnalysisResult(null)} className="text-[10px] font-bold text-pink-500 uppercase px-3 py-1 bg-pink-50 rounded-full">重新分析</button>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-pink-700 leading-relaxed">{analysisResult.summary}</p>
                    <div className="bg-pink-50 p-4 rounded-2xl border-l-4 border-pink-400 shadow-inner">
                      <p className="text-sm italic text-gray-700 leading-relaxed">"{analysisResult.diagnosis}"</p>
                    </div>
                  </div>
                </section>
                <section className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">推薦保養方案</h3>
                  {analysisResult.routine.map((step) => (
                    <div key={step.step} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 hover:border-pink-200 transition-all">
                      <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-black flex-shrink-0 border border-pink-100">{step.step}</div>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase font-bold text-pink-300 tracking-widest">{step.label}</p>
                        <p className="font-bold text-gray-800 leading-tight">{step.product}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.reason}</p>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            )}
          </div>
        )}

        {mode === AppMode.INVENTORY && (
          <div className="space-y-6">
            <button 
              onClick={() => {
                const id = Math.random().toString(36).substr(2, 9);
                setInventory(prev => [{ id, name: "新增產品", category: ProductCategory.SERUM, brand: "待辨識" }, ...prev]);
                setExpandedItemId(id);
              }}
              className="w-full py-4 bg-white border-2 border-pink-200 rounded-2xl text-sm font-bold text-pink-600 shadow-sm hover:bg-pink-50 transition-all"
            >➕ 新增庫存產品</button>

            <div className="space-y-4">
              {Object.values(ProductCategory).map((cat) => {
                const items = inventory.filter(i => i.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{cat}</h4>
                    {items.map(item => {
                      const isExpanded = expandedItemId === item.id;
                      return (
                        <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                          {/* Item Header with Small Preview */}
                          <div 
                            onClick={() => setExpandedItemId(isExpanded ? null : item.id)} 
                            className="p-4 flex justify-between items-center cursor-pointer active:bg-pink-50"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {/* Preview Thumbnail */}
                              {item.frontImage && !isExpanded && (
                                <img src={item.frontImage} className="w-12 h-12 rounded-xl object-cover border border-pink-50 shadow-sm animate-fade-in" alt="preview" />
                              )}
                              <div className="flex-1">
                                <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{item.brand}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.category === ProductCategory.MASK && (
                                <div className="flex items-center gap-2 bg-pink-50 px-2 py-1 rounded-lg" onClick={(e) => e.stopPropagation()}>
                                  <input 
                                    type="number" 
                                    value={item.stockCount ?? 0} 
                                    onChange={(e) => updateStock(item.id, parseInt(e.target.value) || 0)} 
                                    className="w-8 bg-transparent text-xs font-bold text-pink-600 outline-none text-center" 
                                  />
                                </div>
                              )}
                              <span className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 bg-gray-50/50 border-t border-gray-100 space-y-4 animate-fade-in">
                              <div className="grid grid-cols-2 gap-3">
                                {/* Front Image Slot */}
                                <label className="aspect-square bg-white border border-pink-100 rounded-xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group shadow-sm">
                                  {item.frontImage ? (
                                    <img src={item.frontImage} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[10px] font-bold text-pink-300 text-center px-2">📸 點擊上傳<br/>正面照辨識</span>
                                  )}
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    className="hidden" 
                                    onChange={(e) => handleFileUpload(e, 'frontProduct', item.id)} 
                                  />
                                </label>
                                {/* Back Image Slot */}
                                <label className={`aspect-square bg-white border border-pink-100 rounded-xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden shadow-sm ${item.category === ProductCategory.DEVICE ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}>
                                  {item.backImage ? (
                                    <img src={item.backImage} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[10px] font-bold text-pink-300 text-center px-2">
                                      {item.category === ProductCategory.DEVICE ? '儀器不需成分' : '📸 點擊上傳\n背面成分分析'}
                                    </span>
                                  )}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'backProduct', item.id)} />
                                </label>
                              </div>
                              
                              {item.category !== ProductCategory.DEVICE && (
                                <div className="text-center bg-white p-4 rounded-2xl border border-pink-50 shadow-inner">
                                  <button 
                                    onClick={() => setShowManualInput(showManualInput === item.id ? null : item.id)}
                                    className="text-[11px] font-black text-pink-500 flex items-center justify-center gap-2 mx-auto"
                                  >
                                    <span className="text-base">📝</span>
                                    <span className="underline decoration-pink-200 underline-offset-4">成分表不清楚？手動輸入成分表</span>
                                  </button>
                                  
                                  {showManualInput === item.id && (
                                    <div className="mt-4 space-y-3 animate-fade-in">
                                      <textarea 
                                        className="w-full p-4 rounded-2xl border border-pink-100 text-xs outline-none focus:border-pink-400 bg-white shadow-sm placeholder:text-gray-300 resize-none transition-all" 
                                        rows={4} 
                                        placeholder="貼上成分表文字內容..."
                                        value={item.manualIngredients || ""}
                                        onChange={(e) => setInventory(prev => prev.map(i => i.id === item.id ? { ...i, manualIngredients: e.target.value } : i))}
                                      />
                                      <button 
                                        disabled={!item.manualIngredients?.trim() || loading}
                                        onClick={() => runIngredientCheck(null, item.manualIngredients || "", item.id, true)}
                                        className="w-full py-3 bg-pink-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-100 disabled:bg-gray-200"
                                      >分析並記憶</button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {(item.ingredients || item.effects) && (
                                <div className="bg-white p-4 rounded-xl border border-pink-100 shadow-sm space-y-3 animate-fade-in">
                                  <div>
                                    <p className="text-[10px] font-bold text-green-600 uppercase">✨ 安心成分與功效</p>
                                    <p className="text-xs font-bold text-gray-800 mt-1">{item.effects}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {item.ingredients?.map(ing => <span key={ing} className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[9px] font-medium border border-green-100">{ing}</span>)}
                                    </div>
                                  </div>
                                  {item.cons && item.cons.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-red-400 uppercase">⚠️ 致敏風險</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {item.cons.map(c => <span key={c} className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[9px] font-medium border border-red-100">{c}</span>)}
                                      </div>
                                    </div>
                                  )}
                                  <div className="pt-2 border-t border-gray-100">
                                    <p className="text-[10px] font-bold text-pink-400 uppercase">⏰ 使用建議</p>
                                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.usageTiming}</p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-[10px] text-gray-300 uppercase tracking-tighter">ID: {item.id}</span>
                                <button onClick={() => setInventory(prev => prev.filter(i => i.id !== item.id))} className="text-[10px] font-bold text-red-300 hover:text-red-500 px-2 py-1 transition-colors">🗑️ 移除產品</button>
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
                <div className="pt-8 text-center">
                   <button 
                    onClick={() => { if(confirm('確定要清空數據嗎？')) setInventory(INITIAL_INVENTORY); }}
                    className="text-[10px] font-bold text-gray-300 underline decoration-gray-100"
                   >清空歷史數據</button>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === AppMode.CHECKER && (
          <div className="space-y-6">
            <div className="bg-pink-50/50 rounded-3xl p-8 text-center border-2 border-pink-100 shadow-inner">
              <span className="text-4xl mb-4 block">🛡️</span>
              <h2 className="text-xl font-bold text-pink-800 mb-2">採購掃雷分析</h2>
              <p className="text-sm text-pink-600/70 mb-6 italic px-4">拍下成分表照片，AI 將判斷是否適合極乾敏感肌使用。</p>
              <label className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 cursor-pointer active:scale-95 transition-all">
                📸 上傳照片開始掃雷
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'checker')} />
              </label>
            </div>

            {checkerResult && (
              <div className={`bg-white rounded-3xl p-6 border-4 shadow-2xl animate-fade-in ${checkerResult.recommendation === 'PASS' ? 'border-green-400' : 'border-red-400'}`}>
                <h3 className="text-xl font-black text-gray-800 mb-4">{checkerResult.productName}</h3>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-green-600 mb-2">✅ 安心成分</p>
                        <div className="flex flex-wrap gap-1">
                          {checkerResult.pros.map((p, i) => <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded shadow-sm font-medium">{p}</span>)}
                        </div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-red-600 mb-2">⚠️ 風險成分</p>
                        <div className="flex flex-wrap gap-1">
                          {checkerResult.cons.map((p, i) => <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded shadow-sm font-medium">{p}</span>)}
                        </div>
                      </div>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-2xl space-y-2 text-sm text-gray-700 shadow-inner">
                      <p><strong>功效：</strong>{checkerResult.effects}</p>
                      <p><strong>建議：</strong>{checkerResult.timing}</p>
                   </div>
                   <div className={`py-4 rounded-2xl text-center font-black tracking-widest shadow-md transition-colors ${checkerResult.recommendation === 'PASS' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {checkerResult.recommendation === 'PASS' ? '✨ 極力推薦購買' : '⚠️ 不推薦使用'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white/95 backdrop-blur-lg border-t border-gray-100 h-22 flex items-center justify-around px-8 pb-4 z-40 shadow-lg">
        {[{mode: AppMode.ANALYSIS, icon: '🏡', label: '膚況'}, {mode: AppMode.INVENTORY, icon: '🍱', label: '清單'}, {mode: AppMode.CHECKER, icon: '🛡️', label: '掃雷'}].map(t => (
          <button key={t.mode} onClick={() => setMode(t.mode)} className={`flex flex-col items-center gap-1.5 transition-all ${mode === t.mode ? 'text-pink-500 scale-110 font-bold' : 'text-gray-300'}`}>
            <span className="text-2xl">{t.icon}</span>
            <span className="text-[10px] uppercase font-black tracking-tighter">{t.label}</span>
          </button>
        ))}
      </nav>

      {loading && (
        <div className="fixed inset-0 z-[60] bg-white/70 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin mb-6 shadow-xl shadow-pink-100"></div>
          <p className="text-pink-800 font-black animate-pulse text-lg tracking-widest text-center px-6">AI 精準分析記憶中...</p>
        </div>
      )}
    </div>
  );
};

export default App;