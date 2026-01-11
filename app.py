import streamlit as st
import google.generativeai as genai
from PIL import Image
import requests

# ==========================================
# 🌸 頁面設定 & 櫻花主題 CSS
# ==========================================
st.set_page_config(page_title="潤敏肌助手", page_icon="🌸", layout="mobile") # 改成 mobile 佈局比較像 App

# 自訂 CSS (仿 AI Studio 設計風格)
st.markdown("""
    <style>
    /* 全站背景：極淡的櫻花粉白 */
    .stApp {
        background-color: #fffcfd;
        color: #5a4b4e;
    }
    
    /* 標題與重點文字 */
    h1, h2, h3 {
        color: #db2777 !important; /* 深粉紅 */
        font-family: 'Helvetica', sans-serif;
        font-weight: 700;
    }
    
    /* 調整 Tabs 頁籤樣式 */
    .stTabs [data-baseweb="tab-list"] {
        background-color: #fff0f5;
        border-radius: 20px;
        padding: 5px;
        gap: 5px;
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 15px;
        color: #db2777;
        font-weight: bold;
    }
    .stTabs [aria-selected="true"] {
        background-color: #fff;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    /* 氣象資訊卡片化 */
    div[data-testid="stMetricValue"] {
        font-size: 28px !important;
        color: #db2777 !important;
        font-weight: 900 !important;
    }
    div[data-testid="stMetricLabel"] {
        font-size: 14px !important;
        color: #9d8189 !important;
    }
    
    /* 按鈕美化 */
    .stButton>button {
        background: linear-gradient(90deg, #f9a8d4 0%, #f472b6 100%);
        color: white;
        border: none;
        border-radius: 25px;
        padding: 12px 0px;
        width: 100%;
        font-weight: bold;
        box-shadow: 0 4px 10px rgba(244, 114, 182, 0.3);
        transition: all 0.3s;
    }
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(244, 114, 182, 0.4);
    }

    /* 上傳框美化 */
    div[data-testid="stFileUploader"] {
        border: 2px dashed #fbcfe8;
        border-radius: 15px;
        padding: 10px;
        background-color: #fff;
    }

    /* 選項按鈕 (Radio) 改成卡片式 */
    div[role="radiogroup"] {
        background-color: #fff;
        padding: 10px;
        border-radius: 15px;
        border: 1px solid #fce7f3;
    }
    </style>
""", unsafe_allow_html=True)

# ==========================================
# 🔑 API 設定
# ==========================================
GOOGLE_API_KEY = "AIzaSyB1Rg-qsGJRZxU23Ee_hvS9AZ7gVtqPQCQ"
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# ==========================================
# 🌤️ 天氣函數
# ==========================================
def get_weather_data():
    try:
        url = "https://api.open-meteo.com/v1/forecast?latitude=25.03&longitude=121.54&current=temperature_2m,relative_humidity_2m,dew_point_2m&timezone=Asia%2FTaipei"
        response = requests.get(url, timeout=5)
        data = response.json()
        return data['current']
    except:
        return None

# ==========================================
# 📦 產品資料庫 (維持原本設定)
# ==========================================
default_inventory = [
    {"category": "清潔", "name": "Curél 潤浸保濕洗顏慕絲", "desc": "溫和潔顏", "qty": 1},
    {"category": "化妝水", "name": "medicube 積雪草化妝水", "desc": "清爽鎮靜", "qty": 1},
    {"category": "化妝水", "name": "Curel 潤浸保濕化粧水 II", "desc": "基礎保濕", "qty": 1},
    {"category": "化妝水", "name": "Platinum Label 積雪草化妝水", "desc": "濕敷專用", "qty": 1},
    {"category": "化妝水", "name": "ヒルマイルド 化妝水", "desc": "類肝素高保濕", "qty": 1},
    {"category": "棉片", "name": "Torriden DIVE IN 棉片", "desc": "妝前補水", "qty": 1},
    {"category": "棉片", "name": "medicube Zero 毛孔爽膚棉(藍)", "desc": "收斂毛孔", "qty": 1},
    {"category": "棉片", "name": "medicube 積雪草棉片(綠)", "desc": "舒緩泛紅", "qty": 1},
    {"category": "棉片", "name": "medicube RED 棉片(紅)", "desc": "痘痘代謝", "qty": 1},
    {"category": "棉片", "name": "medicube 維他命C棉片(黃)", "desc": "美白提亮", "qty": 1},
    {"category": "棉片", "name": "medicube 膠原蛋白棉片(粉)", "desc": "彈力緊緻", "qty": 1},
    {"category": "精華液", "name": "Torriden 玻尿酸精華", "desc": "百搭保濕", "qty": 1},
    {"category": "精華液", "name": "Torriden 積雪草精華", "desc": "舒緩敏感", "qty": 1},
    {"category": "精華液", "name": "medicube 積雪草外泌體", "desc": "搭配Booster Pro", "qty": 1},
    {"category": "精華液", "name": "medicube PDRN 粉紅精華", "desc": "抗老修復凹洞", "qty": 4},
    {"category": "精華液", "name": "Nature Republic 維他命C", "desc": "淡化紅印", "qty": 1},
    {"category": "藥膏", "name": "マキロン ACNEIGE", "desc": "紅印/發炎痘", "qty": 1},
    {"category": "藥膏", "name": "3M 抗痘凝露", "desc": "膿頭痘痘", "qty": 1},
    {"category": "藥膏", "name": "喜能復 Post Acne", "desc": "黑疤/凹凸", "qty": 1},
    {"category": "面膜", "name": "DermaLine PDRN 面膜", "desc": "術後修復", "qty": 5},
    {"category": "面膜", "name": "medicube PDRN 面膜", "desc": "提亮緊緻", "qty": 5},
    {"category": "面膜", "name": "KOSE 積雪草面膜", "desc": "日常鎮靜", "qty": 5},
    {"category": "乳霜", "name": "Curél 保濕凝露", "desc": "日間清爽", "qty": 1},
    {"category": "乳霜", "name": "Torriden 舒緩霜", "desc": "夜間鎖水", "qty": 1},
    {"category": "乳霜", "name": "ヒルマイルド 乳液", "desc": "強效封閉/脫皮用", "qty": 1},
    {"category": "防曬", "name": "Curél 潤浸保濕防曬", "desc": "敏感期用", "qty": 1},
    {"category": "防曬", "name": "Biore 含水防曬", "desc": "日常清爽", "qty": 1},
    {"category": "儀器", "name": "medicube Booster Pro", "desc": "四合一美容儀", "qty": 1}
]

if 'inventory' not in st.session_state:
    st.session_state.inventory = default_inventory

# ==========================================
# 🧠 AI 邏輯
# ==========================================
def analyze_skin_routine(left_img, right_img, weather_data, user_status, custom_note):
    inventory_text = "\n".join([f"- {item['name']}" for item in st.session_state.inventory])
    
    prompt = f"""
    角色：專業皮膚科醫師。使用者：乾燥敏感肌。
    環境：氣溫{weather_data['temp']}°C | 濕度{weather_data['humidity']}% | 露點{weather_data['dew']}°C
    狀態：{user_status['time']} | {user_status['shower']} | 生理期:{'是' if user_status['period'] else '否'}
    備註：{custom_note}
    庫存：{inventory_text}
    
    請以粉嫩溫柔語氣輸出保養流程(含儀器建議)。
    重點：紅印用Makiron，痘痘用3M，疤痕用喜能復。面膜<2片提醒補貨。
    """
    content = [prompt]
    if left_img: content.append(left_img)
    if right_img: content.append(right_img)
    content.append("開始分析")
    
    try:
        response = model.generate_content(content)
        return response.text
    except Exception as e:
        return f"分析錯誤: {e}"

def check_ingredients(image):
    try:
        response = model.generate_content(["分析成分表(乾燥敏感肌視角)，檢查酒精香精。", image])
        return response.text
    except:
        return "無法辨識"

# ==========================================
# 📱 介面佈局
# ==========================================

# 標題區
st.markdown("<h1 style='text-align: center;'>🌸 潤敏肌助手</h1>", unsafe_allow_html=True)
st.markdown("<p style='text-align: center; color: #db2777; letter-spacing: 2px;'>SAKURA CARE ASSISTANT</p>", unsafe_allow_html=True)

# 頁籤導航
tab1, tab2, tab3 = st.tabs(["膚況分析", "產品清單", "成分掃雷"])

# --- Tab 1: 膚況分析 (重頭戲) ---
with tab1:
    # 1. 氣象橫幅 (大數字)
    weather = get_weather_data()
    t_val = weather['temperature_2m'] if weather else 20
    h_val = weather['relative_humidity_2m'] if weather else 60
    d_val = weather['dew_point_2m'] if weather else 15
    
    # 使用 container 包住氣象區，用 column 排列
    with st.container(border=True):
        st.markdown("**📍 台北市大安區 即時環境**")
        wc1, wc2, wc3 = st.columns(3)
        wc1.metric("🌡️ 氣溫", f"{t_val}°C")
        wc2.metric("💧 濕度", f"{h_val}%")
        wc3.metric("🌫️ 露點", f"{d_val}°C")

    # 2. 照片上傳區 (左右臉)
    st.markdown("### 📸 拍攝膚況")
    c1, c2 = st.columns(2)
    with c1:
        st.info("左臉")
        left_file = st.file_uploader("上傳左臉", type=["jpg", "png"], label_visibility="collapsed", key="left")
    with c2:
        st.info("右臉")
        right_file = st.file_uploader("上傳右臉", type=["jpg", "png"], label_visibility="collapsed", key="right")

    # 3. 狀態按鈕區
    st.markdown("### ⚙️ 環境與生理狀態")
    
    col_status1, col_status2 = st.columns(2)
    with col_status1:
        time_option = st.radio("時段", ["☀️ 早上", "🌙 晚上"], horizontal=True, label_visibility="collapsed")
    with col_status2:
        shower_option = st.radio("清潔", ["🛁 洗澡前", "🧖‍♀️ 洗澡後"], horizontal=True, label_visibility="collapsed")
        
    # 生理期與備註
    p_col, n_col = st.columns([1, 2])
    with p_col:
        st.write("") # 空行排版用
        st.write("")
        period_status = st.checkbox("🩸 生理期")
    with n_col:
        custom_note = st.text_input("📝 其他 (如: 熬夜/擠粉刺)", placeholder="輸入補充事項...")

    # 4. 開始分析按鈕
    st.write("")
    if st.button("✨ 開始 AI 膚況診斷"):
        if left_file and right_file:
            with st.spinner("🌸 AI 正在為您調配保養處方..."):
                w_data = {"temp": t_val, "humidity": h_val, "dew": d_val}
                u_status = {"time": time_option, "shower": shower_option, "period": period_status}
                res = analyze_skin_routine(Image.open(left_file), Image.open(right_file), w_data, u_status, custom_note)
                
                # 結果顯示區
                st.markdown("---")
                st.markdown(res)
        else:
            st.warning("⚠️ 請記得上傳左右臉的照片喔！")

# --- Tab 2: 產品清單 (保持原樣，微調樣式) ---
with tab2:
    with st.expander("➕ 入庫新產品"):
        n_name = st.text_input("名稱")
        n_cat = st.selectbox("分類", ["清潔", "化妝水", "精華液", "藥膏", "面膜", "乳霜", "防曬", "儀器"])
        if st.button("加入"):
            st.session_state.inventory.append({"category": n_cat, "name": n_name, "desc": "新入庫", "qty": 1})
            st.rerun()

    for item in st.session_state.inventory:
        with st.expander(f"{item['category']} | {item['name']}"):
            st.caption(item['desc'])
            if item['category'] == "面膜":
                item['qty'] = st.number_input(f"剩餘數量", value=item['qty'], key=item['name'])
                if item['qty'] < 2: st.error("⚠️ 該補貨囉！")
            if st.button("刪除", key=f"del_{item['name']}"):
                st.session_state.inventory.remove(item)
                st.rerun()

# --- Tab 3: 成分掃雷 ---
with tab3:
    st.markdown("### 🛡️ 櫻花採購掃雷")
    st.write("購買前拍一下，幫妳把關酒精與香精！")
    ing = st.file_uploader("上傳成分表", type=["jpg", "png"])
    if ing and st.button("🔍 開始掃雷"):
        st.markdown(check_ingredients(Image.open(ing)))
