import streamlit as st
import google.generativeai as genai
from PIL import Image

# ==========================================
# 🔑 設定區 (請把妳的鑰匙直接貼在下面的引號裡)
# ==========================================
GOOGLE_API_KEY = "AIzaSyB1Rg-qsGJRZxU23Ee_hvS9AZ7gVtqPQCQ" 
# ==========================================

st.set_page_config(page_title="肌膚管理", page_icon="🧖‍♀️", layout="wide")
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

if 'inventory' not in st.session_state:
    st.session_state.inventory = [
        {"id": 1, "category": "化妝水", "name": "medicube 積雪草化妝水", "qty": 1},
        {"id": 2, "category": "藥膏", "name": "マキロン ACNEIGE", "qty": 1},
        {"id": 3, "category": "藥膏", "name": "喜能復", "qty": 1},
        {"id": 4, "category": "面膜", "name": "medicube PDRN 面膜", "qty": 1}
    ]

def analyze_skin(left_img, right_img, conditions):
    inv_str = "\n".join([f"- {item['name']}" for item in st.session_state.inventory])
    prompt = f"角色：皮膚科醫師。環境：{conditions}。庫存：{inv_str}。請規劃保養步驟(繁中)。"
    try:
        content = [prompt, left_img, right_img]
        response = model.generate_content(content)
        return response.text
    except:
        return "分析失敗，請檢查 API Key 或圖片"

st.sidebar.title("🧖‍♀️ 保養顧問")
page = st.sidebar.radio("選單", ["🔍 膚況分析", "📦 產品管理"])

if page == "🔍 膚況分析":
    st.title("🔍 今日膚況")
    c1, c2 = st.columns(2)
    l = c1.file_uploader("左臉", type=["jpg","png"])
    r = c2.file_uploader("右臉", type=["jpg","png"])
    f = st.multiselect("環境", ["🔥 暖氣", "💊 吃藥", "🩸 生理期"])
    if st.button("✨ 分析") and l and r:
        st.write(analyze_skin(Image.open(l), Image.open(r), ",".join(f)))

elif page == "📦 產品管理":
    st.title("📦 庫存")
    with st.expander("➕ 新增"):
        n = st.text_input("名稱")
        if st.button("加入"):
            st.session_state.inventory.append({"name":n, "qty":1})
            st.rerun()
    for i in st.session_state.inventory:
        st.write(f"- {i['name']}")
