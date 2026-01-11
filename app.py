import streamlit as st
import google.generativeai as genai
from PIL import Image
import requests # 用來抓天氣的工具

# ==========================================
# 🌸 頁面設定與粉色主題 CSS
# ==========================================
st.set_page_config(page_title="潤敏肌專屬顧問", page_icon="🧖‍♀️", layout="wide")

# 自訂 CSS (優化手機版面與頁籤)
st.markdown("""
    <style>
    .stApp { background-color: #FFF5F7; color: #5D4037; }
    h1, h2, h3 { color: #D81B60 !important; font-family: 'Helvetica', sans-serif; }
    .stButton>button { background-color: #F8BBD0; color: #880E4F; border-radius: 20px; border: none; font-weight: bold; }
    .stButton>button:hover { background-color: #F48FB1; color: white; }
    
    /* 優化頁籤 (Tabs) 的樣式 */
    .stTabs [data-baseweb="tab-list"] { gap: 10px; }
    .stTabs [data-baseweb="tab"] {
        height: 50px; white-space: pre-wrap; background-color: #FFF0F5; border-radius: 10px 10px 0 0; gap: 1px; padding-top: 10px; padding-bottom: 10px; color: #880E4F;
    }
    .stTabs [aria-selected="true"] { background-color: #F8BBD0; color: #880E4F; font-weight: bold;}
    </style>
""", unsafe_allow_html=True)

# ==========================================
# 🔑 API 金鑰設定
# ==========================================
GOOGLE_API_KEY = "AIzaSyB1Rg-qsGJRZxU23Ee_hvS9AZ7gVtqPQCQ" 
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# ==========================================
# 🌤️ 自動抓取天氣函數 (台北大安區)
# ==========================================
def get_weather_data():
    try:
        # 台北市大安區座標 (Latitude: 25.03, Longitude: 121.54)
        url = "https://api.open-meteo.com/v1/forecast?latitude=25.03&longitude=121.54&current=temperature_2m,relative_humidity_2m,dew_point_2m&timezone=Asia%2FTaipei"
        response = requests.get(url)
        data = response.json()
        current = data['current']
        return {
            "temp": current['temperature_2m'],
            "humidity": current['relative_humidity_2m'],
            "dew": current['dew_point_2m']
        }
    except:
        return None # 如果抓取失敗，回傳空值讓使用者手填

# ==========================================
# 📦 預設產品資料庫
# ==========================================
default_inventory = [
    {"category": "清潔", "name": "Curél 潤浸保濕洗顏慕絲", "desc": "溫和潔顏，早晚皆可", "qty": 1},
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
    {"category": "儀器", "name": "medicube AGE-R Booster Pro", "desc": "四合一美容儀", "qty": 1}
]

if 'inventory' not in st.session_state:
    st.session_state.inventory = default_inventory

# ==========================================
# 🧠 AI 核心邏輯
# ==========================================
def analyze_skin_routine(left_img, right_img, weather_data, user_status, custom_note):
    inventory_text = ""
    for item in st.session_state.inventory:
        qty_info = f"(剩餘: {item['qty']})" if item['category'] == "面膜" else ""
        inventory_text += f"- [{item['category']}] {item['name']} : {item['desc']} {qty_info}\n"

    prompt = f"""
    【角色】專業皮膚科醫師。使用者：乾燥敏感肌。
    【環境】氣溫{weather_data['temp']}°C | 濕度{weather_data['humidity']}% | 露點{weather_data['dew']}°C
    【狀態】{user_status['time']} | {user_status['shower']} | 生理期:{'是' if user_status['period'] else '否'}
    【備註】{custom_note}
    【庫存】\n{inventory_text}
    【規則】
    1. 紅色痘印必選Makiron，膿頭痘必選3M，黑疤必選喜能復。
    2. 濕度高用Biore防曬/Curél凝露；乾燥/低露點用Curél防曬/Healmild。
    3. 安排Medicube Booster Pro模式(橘/綠/紅/藍)。
    4. 檢查面膜庫存，<2片標註(需補貨)。
    請以粉嫩溫柔語氣輸出：今日膚況摘要、保養流程(含儀器)、重點提醒、購物清單。
    """
    content = [prompt]
    if left_img: content.append(left_img)
    if right_img: content.append(right_img)
    content.append("請分析照片規劃保養。")

    try:
        response = model.generate_content(content)
        return response.text
    except Exception as e:
        return f"分析錯誤：{e}"

def check_ingredients(image):
    try:
        response = model.generate_content(["你是成分專家。針對乾燥敏感肌(對酒精香精敏感)，分析成分表優缺點與是否推薦。", image])
        return response.text
    except:
        return "無法辨識成分表。"

# ==========================================
# 🖥️ 介面配置 (改用 Tabs 頁籤)
# ==========================================

st.title("🧖‍♀️ 潤敏肌專屬顧問")

# 建立三個頁籤
tab1, tab2, tab3 = st.tabs(["🔍 膚質分析", "📦 產品清單", "🧪 成分掃雷"])

# --- Tab 1: 膚質分析 ---
with tab1:
    st.info("📍 已自動載入「台北市大安區」即時氣象")
    
    # 自動抓取天氣
    weather_auto = get_weather_data()
    
    # 如果抓到了就用自動的，沒抓到就用預設值
    def_temp = weather_auto['temp'] if weather_auto else 20.0
    def_hum = weather_auto['humidity'] if weather_auto else 60
    def_dew = weather_auto['dew'] if weather_auto else 15.0

    col1, col2, col3 = st.columns(3)
    temp = col1.number_input("🌡️ 氣溫 (°C)", value=def_temp)
    humidity = col2.number_input("💧 濕度 (%)", value=float(def_hum))
    dew_point = col3.number_input("🌫️ 露點 (°C)", value=def_dew, help="露點越低越乾")

    col_t1, col_t2 = st.columns(2)
    time_option = col_t1.selectbox("🕒 時段", ["☀️ 早上", "🌙 晚上"])
    period_status = col_t2.checkbox("🩸 正值生理期")
    shower_option = st.radio("🚿 狀態", ["尚未洗臉/洗澡", "剛洗完臉 (已清潔)"], horizontal=True)
    custom_note = st.text_input("📝 補充 (如：熬夜、擠粉刺)")

    c1, c2 = st.columns(2)
    left_file = c1.file_uploader("📸 左臉頰", type=["jpg", "png"])
    right_file = c2.file_uploader("📸 右臉頰", type=["jpg", "png"])

    if st.button("✨ 生成保養流程"):
        if left_file and right_file:
            with st.spinner("AI 正在觀察膚況與計算濕度..."):
                w_data = {"temp": temp, "humidity": humidity, "dew": dew_point}
                u_status = {"time": time_option, "shower": shower_option, "period": period_status}
                res = analyze_skin_routine(Image.open(left_file), Image.open(right_file), w_data, u_status, custom_note)
                st.markdown("---")
                st.markdown(res)
        else:
            st.warning("請上傳兩張照片喔！")

# --- Tab 2: 產品清單 ---
with tab2:
    st.write("📦 管理妳的保養品")
    with st.expander("➕ 新增產品"):
        n_name = st.text_input("名稱")
        n_cat = st.selectbox("分類", ["清潔", "化妝水", "精華液", "藥膏", "面膜", "乳霜", "防曬", "儀器"])
        n_qty = st.number_input("數量", value=1)
        if st.button("加入"):
            st.session_state.inventory.append({"category": n_cat, "name": n_name, "desc": "自訂", "qty": n_qty})
            st.success(f"已加入 {n_name}")
            st.rerun()

    for item in st.session_state.inventory:
        with st.expander(f"{item['category']} | {item['name']}"):
            st.write(f"備註: {item['desc']}")
            if item['category'] == "面膜":
                q = st.number_input(f"剩餘片數 ({item['name']})", value=item['qty'])
                item['qty'] = q
                if q < 2: st.error("⚠️ 需補貨")
            
            if st.button("🗑️ 刪除", key=f"del_{item['name']}"):
                st.session_state.inventory.remove(item)
                st.rerun()

# --- Tab 3: 成分掃雷 ---
with tab3:
    st.write("🧪 檢查成分是否含酒精/香精")
    ing = st.file_uploader("上傳成分表", type=["jpg", "png"])
    if ing and st.button("🔍 分析"):
        st.markdown(check_ingredients(Image.open(ing)))
