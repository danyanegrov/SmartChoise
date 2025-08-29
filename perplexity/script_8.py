# Создаем Streamlit фронтенд

# frontend/requirements.txt
frontend_requirements = """streamlit==1.28.1
requests==2.31.0
plotly==5.17.0
pandas==2.0.3
altair==5.1.2
"""

# frontend/app.py
frontend_app_content = '''import streamlit as st
import requests
import json
import pandas as pd
import plotly.express as px
from datetime import datetime
import time

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"

# Page configuration
st.set_page_config(
    page_title="Система интеллектуального выбора",
    page_icon="🤔",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
.main-header {
    font-size: 2.5rem;
    color: #1f77b4;
    text-align: center;
    margin-bottom: 2rem;
}

.recommendation-card {
    border: 1px solid #ddd;
    border-radius: 10px;
    padding: 1rem;
    margin: 0.5rem 0;
    background: #f9f9f9;
}

.score-badge {
    background: #28a745;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 15px;
    font-size: 0.8rem;
}

.intent-badge {
    background: #007bff;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 15px;
    font-size: 0.8rem;
}
</style>
""", unsafe_allow_html=True)

def check_api_health():
    """Check if API is available"""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def process_nlp(text):
    """Process text with NLP API"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/nlp/process",
            json={"text": text, "user_context": {}},
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"NLP обработка не удалась: {response.status_code}")
            return None
    except Exception as e:
        st.error(f"Ошибка соединения с API: {str(e)}")
        return None

def get_recommendations(query, filters=None, limit=10):
    """Get recommendations from API"""
    try:
        payload = {
            "query": query,
            "filters": filters or {},
            "limit": limit
        }
        
        response = requests.post(
            f"{API_BASE_URL}/recommendations",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Получение рекомендаций не удалось: {response.status_code}")
            return None
    except Exception as e:
        st.error(f"Ошибка соединения с API: {str(e)}")
        return None

def submit_feedback(query_id, rating, feedback_text=""):
    """Submit feedback to API"""
    try:
        payload = {
            "query_id": query_id,
            "rating": rating,
            "feedback_text": feedback_text
        }
        
        response = requests.post(
            f"{API_BASE_URL}/recommendations/feedback",
            json=payload,
            timeout=10
        )
        
        return response.status_code == 200
    except:
        return False

def search_items(search_query="", category_id=None, min_price=None, max_price=None, limit=20):
    """Search items via API"""
    try:
        params = {"limit": limit, "offset": 0}
        
        if search_query:
            params["search"] = search_query
        if category_id:
            params["category_id"] = category_id
        if min_price:
            params["min_price"] = min_price
        if max_price:
            params["max_price"] = max_price
            
        response = requests.get(f"{API_BASE_URL}/items", params=params, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None

def display_recommendation_card(rec, index):
    """Display a recommendation card"""
    with st.container():
        col1, col2, col3 = st.columns([3, 1, 1])
        
        with col1:
            st.markdown(f"**{rec.get('name', 'Неизвестный товар')}**")
            if rec.get('price'):
                st.write(f"💰 {rec['price']:,.0f} ₽")
            if rec.get('rating'):
                st.write(f"⭐ {rec['rating']:.1f}/5.0")
        
        with col2:
            score = rec.get('final_score', rec.get('similarity_score', 0))
            st.markdown(f'<span class="score-badge">{score:.0%}</span>', 
                       unsafe_allow_html=True)
        
        with col3:
            # Feedback buttons
            col_like, col_dislike = st.columns(2)
            with col_like:
                if st.button("👍", key=f"like_{index}"):
                    st.session_state[f'feedback_{index}'] = "like"
                    st.rerun()
            with col_dislike:
                if st.button("👎", key=f"dislike_{index}"):
                    st.session_state[f'feedback_{index}'] = "dislike"
                    st.rerun()
        
        # Explanation
        if rec.get('explanation'):
            st.write(f"💡 {rec['explanation']}")
        
        # Show feedback if given
        feedback_key = f'feedback_{index}'
        if feedback_key in st.session_state:
            feedback = st.session_state[feedback_key]
            if feedback == "like":
                st.success("Спасибо за положительную оценку!")
            elif feedback == "dislike":
                st.info("Спасибо за обратную связь, мы учтем это.")

def main():
    """Main application"""
    
    # Header
    st.markdown('<h1 class="main-header">🤔 Система интеллектуального выбора</h1>', 
                unsafe_allow_html=True)
    
    # Check API health
    if not check_api_health():
        st.error("⚠️ API недоступен. Убедитесь, что сервер запущен на http://localhost:8000")
        st.stop()
    else:
        st.success("✅ API подключен")
    
    # Sidebar with filters
    with st.sidebar:
        st.header("🔧 Настройки")
        
        # Price range
        price_range = st.slider(
            "Ценовой диапазон (₽)",
            min_value=0,
            max_value=5000000,
            value=(0, 500000),
            step=10000,
            format="%d"
        )
        
        # Category selection
        category_options = {
            "Все категории": None,
            "Ноутбуки": 2,
            "Смартфоны": 3,
            "Автомобили": 4,
            "Книги": 7
        }
        
        selected_category = st.selectbox("Категория", list(category_options.keys()))
        category_id = category_options[selected_category]
        
        # Number of results
        limit = st.slider("Количество результатов", 5, 20, 10)
    
    # Main content area
    tab1, tab2, tab3 = st.tabs(["🔍 Поиск и рекомендации", "📊 Аналитика", "ℹ️ О системе"])
    
    with tab1:
        st.header("Опишите ваш выбор")
        
        # Query input
        query = st.text_area(
            "Введите ваш запрос:",
            placeholder="Например: Хочу купить игровой ноутбук до 100000 рублей для CS:GO",
            height=100,
            help="Опишите что вы ищете, ваши требования и бюджет"
        )
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            search_button = st.button("🔍 Получить рекомендации", type="primary")
        
        with col2:
            if st.button("🧪 NLP анализ"):
                if query:
                    with st.spinner("Анализирую запрос..."):
                        nlp_result = process_nlp(query)
                        if nlp_result:
                            st.json(nlp_result)
        
        # Process recommendations
        if search_button and query:
            with st.spinner("🤖 Анализирую ваш запрос и подбираю рекомендации..."):
                
                # Prepare filters
                filters = {
                    "min_price": price_range[0] if price_range[0] > 0 else None,
                    "max_price": price_range[1] if price_range[1] < 5000000 else None
                }
                
                if category_id:
                    filters["category_id"] = category_id
                
                # Get recommendations
                recommendations = get_recommendations(query, filters, limit)
                
                if recommendations:
                    st.session_state['last_recommendations'] = recommendations
                    
                    # Display results summary
                    st.success(f"✅ {recommendations['explanation']}")
                    
                    # Show intent and processing time
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        intent = recommendations.get('intent', 'unknown')
                        st.markdown(f'Намерение: <span class="intent-badge">{intent}</span>', 
                                   unsafe_allow_html=True)
                    
                    with col2:
                        confidence = recommendations.get('intent_confidence', 0)
                        st.metric("Уверенность", f"{confidence:.0%}")
                    
                    with col3:
                        time_ms = recommendations.get('processing_time_ms', 0)
                        st.metric("Время обработки", f"{time_ms}мс")
                    
                    # Display recommendations
                    st.header("📋 Рекомендации")
                    
                    recs = recommendations.get('recommendations', [])
                    if recs:
                        for i, rec in enumerate(recs):
                            with st.expander(f"{i+1}. {rec.get('name', 'Товар')}", 
                                           expanded=i < 3):
                                display_recommendation_card(rec, i)
                    else:
                        st.warning("Не найдено подходящих вариантов. Попробуйте изменить критерии поиска.")
                        
                        # Show alternative search
                        st.subheader("🔍 Альтернативный поиск")
                        alt_results = search_items(
                            search_query=query,
                            category_id=category_id,
                            min_price=filters.get('min_price'),
                            max_price=filters.get('max_price'),
                            limit=limit
                        )
                        
                        if alt_results and alt_results.get('items'):
                            st.info(f"Найдено {len(alt_results['items'])} товаров по обычному поиску:")
                            
                            for item in alt_results['items'][:5]:
                                st.write(f"• **{item['name']}** - {item['price']:,.0f} ₽")
    
    with tab2:
        st.header("📊 Аналитика системы")
        
        try:
            # Get analytics from API
            response = requests.get(f"{API_BASE_URL}/analytics/stats", timeout=10)
            
            if response.status_code == 200:
                stats = response.json()
                
                # Display metrics
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    st.metric("Пользователи", stats.get('users', 0))
                
                with col2:
                    st.metric("Товары", stats.get('items', 0))
                
                with col3:
                    st.metric("Взаимодействия", stats.get('interactions', 0))
                
                with col4:
                    st.metric("Запросы", stats.get('queries', 0))
                
                # Vector DB stats
                if stats.get('vector_db'):
                    st.subheader("Векторная база данных")
                    vec_stats = stats['vector_db']
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric("Векторы", vec_stats.get('row_count', 0))
                    with col2:
                        indexed = vec_stats.get('indexed', False)
                        st.metric("Индексирована", "✅" if indexed else "❌")
            
            else:
                st.error("Не удалось получить аналитику")
                
        except Exception as e:
            st.error(f"Ошибка получения аналитики: {e}")
    
    with tab3:
        st.header("ℹ️ О системе")
        
        st.markdown("""
        ### Система интеллектуального выбора
        
        Эта система использует современные технологии искусственного интеллекта для помощи в принятии решений:
        
        **🧠 Обработка естественного языка (NLP)**
        - Понимание запросов на русском языке
        - Извлечение намерений и сущностей
        - Анализ эмоциональной окраски
        
        **🤖 Алгоритмы рекомендаций**
        - Семантический поиск через векторные представления
        - Коллаборативная фильтрация на основе поведения пользователей
        - Контентная фильтрация по атрибутам товаров
        
        **🔧 Технологии**
        - FastAPI для backend API
        - PostgreSQL для структурированных данных
        - Milvus для векторного поиска
        - Streamlit для пользовательского интерфейса
        
        **📊 Алгоритм гибридизации**
        - Семантический поиск: 40%
        - Коллаборативная фильтрация: 35%
        - Контентная фильтрация: 25%
        
        ### Как использовать
        
        1. Опишите ваш запрос в свободной форме на русском языке
        2. Укажите ваши предпочтения в фильтрах (цена, категория)
        3. Получите персонализированные рекомендации с объяснениями
        4. Оцените результаты для улучшения будущих рекомендаций
        """)
        
        # System status
        st.subheader("🔧 Статус системы")
        
        status_data = []
        
        # Check API
        api_status = "🟢 Работает" if check_api_health() else "🔴 Недоступен"
        status_data.append(["API сервер", api_status])
        
        # Check services via health endpoint
        try:
            response = requests.get(f"{API_BASE_URL}/health", timeout=5)
            if response.status_code == 200:
                health = response.json()
                services = health.get('services', {})
                
                for service, status in services.items():
                    status_text = "🟢 Подключен" if status else "🔴 Не подключен"
                    status_data.append([service.title(), status_text])
        except:
            status_data.append(["Сервисы", "🔴 Недоступны"])
        
        # Display status table
        df_status = pd.DataFrame(status_data, columns=["Компонент", "Статус"])
        st.table(df_status)
        
    # Footer
    st.markdown("---")
    st.markdown("*Система интеллектуального выбора v1.0 | Powered by AI*")

if __name__ == "__main__":
    main()
'''

# Создаем фронтенд файлы
os.makedirs("frontend", exist_ok=True)

with open("frontend/requirements.txt", "w", encoding="utf-8") as f:
    f.write(frontend_requirements)

with open("frontend/app.py", "w", encoding="utf-8") as f:
    f.write(frontend_app_content)

print("✅ Streamlit фронтенд создан:")
print("- frontend/requirements.txt")
print("- frontend/app.py")