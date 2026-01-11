import streamlit as st
import google.generativeai as genai
from PIL import Image
import datetime

# ==========================================
# 🌸 頁面設定與粉色主題 CSS
# ==========================================
st.set_page_config(page_title="潤敏肌專屬顧問", page_icon="🧖‍♀️", layout="wide")

# 自訂 CSS (淡粉色主題)
st.markdown("""
    <style>
    /* 全站背景與字體 */
    .stApp {
        background-color: #FFF5F7; /* 淡粉紅背景 */
        color: #5D4037; /* 深咖啡色字體 (比較柔和) */
    }
    
    /* 標題樣式 */
    h1, h2, h3 {
        color: #D81B60 !important; /* 玫瑰紅標題 */
        font-family: 'Helvetica', sans-serif;
    }
    
    /* 按鈕樣式 */
    .stButton>button {
        background-color: #F8BBD0;
        color: #880E4F;
        border-radius: 20px;
        border: none;
        padding: 10px 24px;
        font-weight: bold;
    }
    .stButton>button:hover {
        background-color: #F48FB1;
        color: white;
    }
    
    /* 擴充選單 (Expander) 背景 */
    .streamlit-expanderHeader {
        background-color: #FFF0F5;
        border-radius: 10px;
    }
    
    /* 訊息框顏色 */
    .stAlert {
        background-color: #FFF0F5;
        border: 1px solid #F48FB1;
    }
    </style>
""", unsafe_allow_html=True)

# ==========================================
# 🔑 API 金鑰設定
# ==========================================
GOOGLE_API_KEY = "AIzaSyB1Rg-qsGJRZxU23Ee_hvS9AZ7gVtqPQCQ" 
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# ==========================================
# 📦 預設產品資料庫 (包含妳的所有產品)
# ==========================================
default_inventory = [
    # 1. 清潔
    {"category": "清潔", "name": "Curél 潤浸保濕洗顏慕絲", "desc": "溫和潔顏，早晚皆可", "qty": 1},
    # 2. 化妝水
    {"category": "化妝水", "name": "medicube 積雪草化妝水 (Super Cica)", "desc": "清爽鎮靜，日常打底", "qty": 1},
    {"category": "化妝水", "name": "Curel 潤浸保濕化粧水 II (輕潤型)", "desc": "基礎保濕，膚況穩定用", "qty": 1},
    {"category": "化妝水", "name": "Platinum Label 積雪草化妝水", "desc": "大容量清爽，適合濕敷", "qty": 1},
    {"category": "化妝水", "name": "ヒルマイルド (Healmild) 化妝水", "desc": "類肝素高保濕，極乾燥/暖氣房用", "qty": 1},
    # 3. 棉片
    {"category": "棉片", "name": "Torriden DIVE IN 棉片", "desc": "清爽補水，妝前用", "qty": 1},
    {"category": "棉片", "name": "medicube Zero 毛孔爽膚棉 (藍)", "desc": "收斂毛孔/去角質", "qty": 1},
    {"category": "棉片", "name": "medicube 積雪草修護爽膚棉 (綠)", "desc": "舒緩泛紅、鎮靜敏感", "qty": 1},
    {"category": "棉片", "name": "medicube RED 修護爽膚棉 (紅)", "desc": "針對粉刺痘痘，代謝角質", "qty": 1},
    {"category": "棉片", "name": "medicube Deep 維他命 C 爽膚棉 (黃)", "desc": "美白提亮 (白天需防曬)", "qty": 1},
    {"category": "棉片", "name": "medicube Collagen 膠原蛋白爽膚棉 (粉)", "desc": "彈力緊緻，改善細紋", "qty": 1},
    # 4. 精華液
    {"category": "精華液", "name": "Torriden DIVE IN 玻尿酸精華", "desc": "清爽補水，百搭基底", "qty": 1},
    {"category": "精華液", "name": "Torriden 積雪草精華液", "desc": "舒緩敏感，膚況不穩時用", "qty": 1},
    {"category": "精華液", "name": "medicube 積雪草外泌體安瓶", "desc": "高修復力，搭配 Booster Pro", "qty": 1},
    {"category": "精華液", "name": "medicube PDRN 粉紅濃縮精華", "desc": "強力再生、抗老與修復凹洞 (夜間)", "qty": 4},
    {"category": "精華液", "name": "Nature Republic 維他命 C 精華", "desc": "抗氧化、淡化紅印 (偏稠)", "qty": 1},
    {"category": "精華液", "name": "Torriden 維他命 C 精華", "desc": "抗氧化 (水感，備用)", "qty": 1},
    # 5. 藥膏
    {"category": "藥膏", "name": "マキロン (Makiron) ACNEIGE", "desc": "【針對紅印/發炎】殺菌退紅", "qty": 1},
    {"category": "藥膏", "name": "3M 抗痘凝露", "desc": "【針對冒頭痘痘】含水楊酸", "qty": 1},
    {"category": "藥膏", "name": "喜能復 (Hiruscar) Post Acne", "desc": "【針對黑疤/凹凸】修復陳舊疤痕", "qty": 1},
    # 6. 面膜
    {"category": "面膜", "name": "DermaLine D'LEXO PDRN 面膜", "desc": "診所級修復，術後/極乾肌", "qty": 5},
    {"category": "面膜", "name": "DermaFarm 積雪草外泌體 PDRN 面膜", "desc": "雙重修復，鎮靜退紅", "qty": 1},
    {"category": "面膜", "name": "medicube PDRN 粉紅維他命濃縮面膜", "desc": "提亮緊緻，暗沈肌用", "qty": 5},
    {"category": "面膜", "name": "medicube ZERO 毛孔淨化冰感面膜", "desc": "收縮毛孔，擠粉刺後用", "qty": 5},
    {"category": "面膜", "name": "KOSE 光映透 集中調理禦痘面膜", "desc": "預防粉刺痘痘", "qty": 5},
    {"category": "面膜", "name": "KOSE 光映透 爆彈保濕療癒面膜", "desc": "急救補水", "qty": 5},
    {"category": "面膜", "name": "KOSE 光映透 積雪草保濕面膜", "desc": "日常鎮靜", "qty": 5},
    # 7. 乳霜
    {"category": "乳霜/乳液", "name": "Curél 潤浸保濕控油保濕凝露", "desc": "清爽鎖水，日間/高濕度用", "qty": 1},
    {"category": "乳霜/乳液", "name": "Torriden DIVE IN Soothing Cream", "desc": "標準鎖水，夜間/冷氣房用", "qty": 1},
    {"category": "乳霜/乳液", "name": "ヒルマイルド (Healmild) 乳液", "desc": "強效封閉，乾燥脫皮/暖氣房用", "qty": 1},
    # 8. 防曬
    {"category": "防曬", "name": "Curél 潤浸保濕防曬乳", "desc": "溫和，敏感期/術後首選", "qty": 1},
    {"category": "防曬", "name": "Biore 含水防曬保濕水凝乳", "desc": "水感清爽，日常/高濕度用", "qty": 1},
    # 9. 儀器
    {"category": "儀器", "name": "medicube Booster Pro", "desc": "四合一美容儀 (需搭配App)", "qty": 1}
]

# 初始化 session state
if 'inventory' not in st.session_state:
    st.session_state.inventory = default_inventory

# ==========================================
# 🧠 AI 核心邏輯函數
# ==========================================

def analyze_skin_routine(left_img, right_img, weather_data, user_status, custom_note):
    # 1. 整理庫存字串給 AI
    inventory_text = ""
    for item in st.session_state.inventory:
        qty_info = f"(剩餘: {item['qty']})" if item['category'] == "面膜" else ""
        inventory_text += f"- [{item['category']}] {item['name']} : {item['desc']} {qty_info}\n"

    # 2. 組合 Prompt
    prompt = f"""
    【角色設定】
    妳是專業的皮膚科醫師與美容顧問，使用者的膚質為「乾燥敏感肌」，容易泛紅脫屑，對酒精、香精敏感。
    請根據以下資訊，安排今日的保養流程。

    【環境與生理數據】
    - 天氣狀況：氣溫 {weather_data['temp']}°C | 濕度 {weather_data['humidity']}% | 露點 {weather_data['dew']}°C
    - 時間：{user_status['time']}
    - 洗臉狀態：{user_status['shower']} (若為洗澡前請提醒先卸妝/洗臉)
    - 生理期：{'是' if user_status['period'] else '否'}
    - 其他備註：{custom_note}

    【使用者現有產品庫存】
    {inventory_text}

    【儀器 Medicube Booster Pro 模式參考】
    - Booster (橘): 光澤導入，每日可做。
    - MC (綠): 線條微電流，每日可做。
    - Derma Shot (紅): 輪廓拉提，每日可做。
    - Air Shot (藍): 毛孔微針，限乾臉，每週2-3次，不可與其他模式混用。

    【特殊規則邏輯】
    1. **藥膏選擇**：
       - 紅色痘印/紅斑 -> 必選 Makiron。
       - 凸起/膿頭痘痘 -> 必選 3M 抗痘。
       - 黑疤/凹凸 -> 必選 喜能復 (Hiruscar)。
    2. **防曬邏輯**：
       - 若為「早上」且紫外線高，必須包含防曬。
       - 敏感/術後/泛紅 -> 推 Curél。
       - 穩定/高濕度 -> 推 Biore。
    3. **保濕邏輯**：
       - 露點低/開暖氣 -> 局部用 Healmild 加強。
       - 一般保濕 -> Torriden 面霜。
    4. **面膜邏輯**：
       - 若安排 Air Shot 模式或臉部泛紅，優先選 積雪草 或 PDRN 面膜。
       - **請檢查面膜庫存**，若某款面膜數量 < 2，請在建議中標註「(需補貨)」。

    【輸出要求】
    請用溫柔、粉嫩的語氣 (繁體中文)，條列式輸出：
    1. **今日膚況摘要** (根據照片與天氣判斷)。
    2. **建議保養流程** (Step 1, Step 2...)，包含儀器使用時機。
    3. **重點提醒** (針對紅印、疤痕或天氣的特別叮嚀)。
    4. **購物清單** (若有面膜庫存 < 2，請列在此處)。
    """

    content = [prompt]
    if left_img: content.append(left_img)
    if right_img: content.append(right_img)
    content.append("請分析以上兩張臉部照片(左臉紅印/右臉疤痕)。")

    try:
        response = model.generate_content(content)
        return response.text
    except Exception as e:
        return f"分析發生錯誤，請檢查 API Key 或網路連線。\n錯誤訊息：{e}"

def check_ingredients(image):
    prompt = """
    你是成分分析專家。使用者為「乾燥敏感肌」，對「酒精」、「香精」可能過敏。
    請分析這張圖片中的成分表：
    1. 是否含有酒精 (Alcohol/Ethanol)？
    2. 是否含有香精 (Fragrance/Parfum)？
    3. 針對乾燥敏感肌的 ✅ 優點成分 (如神經醯胺、積雪草、玻尿酸)。
    4. 潛在 ⚠️ 風險成分。
    5. 綜合結論：【推薦】或【不推薦】。
    """
    try:
        response = model.generate_content([prompt, image])
        return response.text
    except:
        return "無法辨識成分表，請確保照片清晰。"

# ==========================================
# 🖥️ 介面配置
# ==========================================

# 側邊欄選單
st.sidebar.title("🌸 功能選單")
page = st.sidebar.radio("", ["🔍 膚質分析與規劃", "📦 產品清單管理", "🧪 購買前成分掃雷"])

# --- 頁面 1: 膚質分析 ---
if page == "🔍 膚質分析與規劃":
    st.title("🧖‍♀️ 今日膚質分析與保養規劃")
    st.info("請輸入今天的環境數據，讓我為妳安排最完美的保養流程！")

    # 1. 環境數據輸入
    st.subheader("1. 環境與生理狀態")
    col1, col2, col3 = st.columns(3)
    temp = col1.number_input("🌡️ 氣溫 (°C)", value=20, step=1)
    humidity = col2.number_input("💧 濕度 (%)", value=60, step=5)
    dew_point = col3.number_input("🌫️ 露點 (°C)", value=15, step=1, help="露點越低代表空氣越乾燥")

    col_t1, col_t2 = st.columns(2)
    time_option = col_t1.selectbox("🕒 時段", ["☀️ 早上 (Morning)", "🌙 晚上 (Night)"])
    period_status = col_t2.checkbox("🩸 正值生理期")

    shower_option = st.radio("🚿 洗澡/洗臉狀態", ["尚未洗臉/洗澡", "剛洗完臉 (已用 Curél 慕斯清潔)"], horizontal=True)
    
    custom_note = st.text_input("📝 其他補充 (例如：熬夜、剛擠完粉刺、想加強美白...)")

    # 2. 照片上傳
    st.subheader("2. 膚況掃描")
    c1, c2 = st.columns(2)
    left_file = c1.file_uploader("📸 左臉", type=["jpg", "png", "jpeg"])
    right_file = c2.file_uploader("📸 右臉", type=["jpg", "png", "jpeg"])

    # 3. 分析按鈕
    if st.button("✨ 生成專屬保養流程"):
        if not left_file or not right_file:
            st.warning("請務必上傳左右臉照片，以便精準判斷紅印與疤痕狀況喔！")
        else:
            with st.spinner("正在分析天氣數據與膚況影像... (AI 思考中 🧠)"):
                # 打包數據
                weather = {"temp": temp, "humidity": humidity, "dew": dew_point}
                status = {"time": time_option, "shower": shower_option, "period": period_status}
                
                left_img = Image.open(left_file)
                right_img = Image.open(right_file)
                
                result = analyze_skin_routine(left_img, right_img, weather, status, custom_note)
                
                st.markdown("---")
                st.success("分析完成！以下是為妳量身打造的建議：")
                st.markdown(result)

# --- 頁面 2: 產品清單 ---
elif page == "📦 產品清單管理":
    st.title("📦 我的保養軍火庫")
    st.write("在這裡管理妳的所有寶貝產品！")

    # 新增產品區塊
    with st.expander("➕ 新增產品到清單"):
        n_name = st.text_input("產品名稱")
        n_cat = st.selectbox("分類", ["清潔", "化妝水", "棉片", "精華液", "藥膏", "面膜", "乳霜/乳液", "防曬", "儀器"])
        n_desc = st.text_input("功效/備註")
        n_qty = st.number_input("數量 (面膜類必填)", min_value=1, value=1)
        
        if st.button("加入清單"):
            st.session_state.inventory.append({"category": n_cat, "name": n_name, "desc": n_desc, "qty": n_qty})
            st.success(f"已加入 {n_name}")
            st.rerun()

    st.markdown("---")

    # 顯示分類清單
    categories = ["清潔", "化妝水", "棉片", "精華液", "藥膏", "面膜", "乳霜/乳液", "防曬", "儀器"]
    
    for cat in categories:
        items = [p for p in st.session_state.inventory if p["category"] == cat]
        if items:
            st.subheader(f"📂 {cat}")
            for item in items:
                # 產品卡片
                with st.expander(f"{item['name']}"):
                    st.write(f"**功效/備註：** {item['desc']}")
                    
                    # 面膜庫存邏輯
                    if cat == "面膜":
                        col_q1, col_q2 = st.columns([1, 3])
                        new_qty = col_q1.number_input("剩餘片數", min_value=0, value=item['qty'], key=f"qty_{item['name']}")
                        item['qty'] = new_qty
                        
                        if item['qty'] < 2:
                            st.error("⚠️ 庫存不足！ (< 2片) 記得補貨喔！")
                        else:
                            st.caption(f"目前庫存: {item['qty']} 片")

                    # 上傳照片區 (正面 & 背面)
                    st.markdown("#### 📸 產品建檔")
                    uc1, uc2 = st.columns(2)
                    uc1.file_uploader("正面照片", type=["jpg", "png"], key=f"f_{item['name']}")
                    uc2.file_uploader("背面成分表", type=["jpg", "png"], key=f"b_{item['name']}")

                    # 刪除按鈕
                    if st.button("🗑️ 刪除此產品", key=f"del_{item['name']}"):
                        st.session_state.inventory.remove(item)
                        st.rerun()

# --- 頁面 3: 成分掃雷 ---
elif page == "🧪 購買前成分掃雷":
    st.title("🧪 購買前成分掃雷")
    st.markdown("""
    **專為乾燥敏感肌設計** 拍下產品背面的成分表，我幫妳檢查是否含有：
    - ❌ **酒精 (Alcohol)**
    - ❌ **香精 (Fragrance)**
    - ✅ **適合妳的修復成分**
    """)
    
    ing_img = st.file_uploader("上傳成分表照片", type=["jpg", "png", "jpeg"])
    
    if ing_img:
        if st.button("🔍 開始分析成分"):
            with st.spinner("正在逐一檢查成分..."):
                res = check_ingredients(Image.open(ing_img))
                st.markdown(res)
