import streamlit as st
import requests
import json
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import time

# Page configuration
st.set_page_config(
    page_title="SmartChoice AI",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API configuration
API_BASE_URL = "http://localhost:8000/api/v1"

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .sub-header {
        font-size: 1.5rem;
        color: #ff7f0e;
        margin-bottom: 1rem;
    }
    .recommendation-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
        border-left: 4px solid #1f77b4;
    }
    .metric-card {
        background-color: #ffffff;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)

def check_api_health():
    """Check if API is running"""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        return response.status_code == 200, response.json()
    except:
        return False, {}

def get_recommendations(query, user_id=None, filters=None, limit=10):
    """Get recommendations from API"""
    try:
        payload = {
            "query": query,
            "user_id": user_id,
            "filters": filters or {},
            "limit": limit
        }
        response = requests.post(f"{API_BASE_URL}/recommendations", json=payload, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"API Error: {response.status_code}")
            return None
    except Exception as e:
        st.error(f"Request failed: {str(e)}")
        return None

def process_nlp(text):
    """Process text with NLP"""
    try:
        payload = {"text": text, "user_context": {}}
        response = requests.post(f"{API_BASE_URL}/nlp/process", json=payload, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"NLP API Error: {response.status_code}")
            return None
    except Exception as e:
        st.error(f"NLP request failed: {str(e)}")
        return None

def search_items(query=None, category_id=None, min_price=None, max_price=None, limit=20):
    """Search items"""
    try:
        params = {
            "query": query,
            "category_id": category_id,
            "min_price": min_price,
            "max_price": max_price,
            "limit": limit
        }
        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}
        
        response = requests.get(f"{API_BASE_URL}/search", params=params, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Search API Error: {response.status_code}")
            return None
    except Exception as e:
        st.error(f"Search request failed: {str(e)}")
        return None

def get_categories():
    """Get all categories"""
    try:
        response = requests.get(f"{API_BASE_URL}/categories", timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            return []
    except:
        return []

def main():
    # Header
    st.markdown('<h1 class="main-header">🧠 SmartChoice AI</h1>', unsafe_allow_html=True)
    st.markdown('<p style="text-align: center; font-size: 1.2rem; color: #666;">Интеллектуальная система рекомендаций с AI</p>', unsafe_allow_html=True)
    
    # Check API health
    api_healthy, health_data = check_api_health()
    
    if not api_healthy:
        st.error("⚠️ API сервер недоступен. Убедитесь, что сервер запущен на http://localhost:8000")
        st.stop()
    
    # Sidebar
    st.sidebar.title("🔧 Настройки")
    
    # API Status
    st.sidebar.subheader("📊 Статус API")
    if health_data:
        status_color = "🟢" if health_data.get("status") == "healthy" else "🔴"
        st.sidebar.write(f"{status_color} Статус: {health_data.get('status', 'unknown')}")
        st.sidebar.write(f"📅 Время: {health_data.get('timestamp', 'unknown')}")
        st.sidebar.write(f"🔌 Версия: {health_data.get('version', 'unknown')}")
    
    # User ID input
    user_id = st.sidebar.number_input("👤 User ID (опционально)", min_value=1, value=None, help="Введите ID пользователя для персонализированных рекомендаций")
    
    # Main tabs
    tab1, tab2, tab3, tab4 = st.tabs(["🎯 Рекомендации", "🔍 Поиск", "📊 Аналитика", "🧠 NLP Анализ"])
    
    with tab1:
        st.markdown('<h2 class="sub-header">🎯 Получить рекомендации</h2>', unsafe_allow_html=True)
        
        # Query input
        query = st.text_input("💬 Введите ваш запрос:", placeholder="Например: Найди ноутбук для работы")
        
        # Filters
        col1, col2, col3 = st.columns(3)
        with col1:
            max_price = st.number_input("💰 Максимальная цена (руб):", min_value=0, value=100000)
        with col2:
            min_rating = st.number_input("⭐ Минимальный рейтинг:", min_value=0.0, max_value=5.0, value=4.0, step=0.1)
        with col3:
            limit = st.number_input("📊 Количество результатов:", min_value=1, max_value=50, value=10)
        
        # Get recommendations button
        if st.button("🚀 Получить рекомендации", type="primary"):
            if query:
                with st.spinner("🤔 Анализирую запрос и подбираю рекомендации..."):
                    filters = {
                        "max_price": max_price,
                        "min_rating": min_rating
                    }
                    
                    result = get_recommendations(query, user_id, filters, limit)
                    
                    if result:
                        # Display results
                        st.success(f"✅ Найдено {result.get('total_found', 0)} рекомендаций")
                        
                        # Query info
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.metric("🔍 Обработанный запрос", result.get('processed_query', ''))
                        with col2:
                            st.metric("🎯 Намерение", result.get('intent', ''))
                        with col3:
                            st.metric("⚡ Время обработки", f"{result.get('processing_time_ms', 0)} мс")
                        
                        # Recommendations
                        st.subheader("📋 Рекомендации:")
                        for i, rec in enumerate(result.get('recommendations', []), 1):
                            with st.container():
                                st.markdown(f"""
                                <div class="recommendation-card">
                                    <h4>#{i} {rec.get('item', {}).get('name', 'Unknown')}</h4>
                                    <p><strong>Описание:</strong> {rec.get('item', {}).get('description', 'No description')}</p>
                                    <p><strong>Цена:</strong> {rec.get('item', {}).get('price', 0)} руб</p>
                                    <p><strong>Рейтинг:</strong> {rec.get('item', {}).get('rating', 0)} ⭐</p>
                                    <p><strong>Уверенность:</strong> {rec.get('confidence', 0):.2f}</p>
                                    <p><strong>Объяснение:</strong> {rec.get('explanation', 'No explanation')}</p>
                                </div>
                                """, unsafe_allow_html=True)
                        
                        # Save query ID for feedback
                        if 'query_id' in result:
                            st.session_state['last_query_id'] = result['query_id']
                        
                        # Feedback section
                        st.subheader("💬 Оставить отзыв")
                        rating = st.slider("Оцените качество рекомендаций:", 1, 5, 3)
                        feedback_text = st.text_area("Комментарий (опционально):")
                        
                        if st.button("📤 Отправить отзыв"):
                            # Here you would send feedback to API
                            st.success("Спасибо за отзыв! 🙏")
            else:
                st.warning("⚠️ Пожалуйста, введите запрос")
    
    with tab2:
        st.markdown('<h2 class="sub-header">🔍 Поиск товаров</h2>', unsafe_allow_html=True)
        
        # Search form
        col1, col2 = st.columns(2)
        with col1:
            search_query = st.text_input("🔍 Поисковый запрос:", placeholder="Введите название или описание")
            category_id = st.selectbox("📂 Категория:", options=[None] + get_categories(), format_func=lambda x: x.get('name') if x else "Все категории")
        
        with col2:
            min_price = st.number_input("💰 Минимальная цена:", min_value=0, value=0)
            max_price = st.number_input("💰 Максимальная цена:", min_value=0, value=100000)
        
        if st.button("🔍 Найти", type="primary"):
            if search_query or category_id or min_price > 0 or max_price < 100000:
                with st.spinner("🔍 Выполняю поиск..."):
                    result = search_items(
                        query=search_query if search_query else None,
                        category_id=category_id.get('id') if category_id else None,
                        min_price=min_price if min_price > 0 else None,
                        max_price=max_price if max_price < 100000 else None
                    )
                    
                    if result:
                        st.success(f"✅ Найдено {result.get('total', 0)} товаров")
                        
                        # Display items
                        items = result.get('items', [])
                        if items:
                            # Convert to DataFrame for better display
                            df = pd.DataFrame(items)
                            st.dataframe(df, use_container_width=True)
                        else:
                            st.info("📭 Товары не найдены")
            else:
                st.warning("⚠️ Укажите хотя бы один критерий поиска")
    
    with tab3:
        st.markdown('<h2 class="sub-header">📊 Аналитика и статистика</h2>', unsafe_allow_html=True)
        
        # Metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.markdown("""
            <div class="metric-card">
                <h3>📈 Всего запросов</h3>
                <h2>1,234</h2>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown("""
            <div class="metric-card">
                <h3>🎯 Успешность</h3>
                <h2>94.2%</h2>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            st.markdown("""
            <div class="metric-card">
                <h3>⚡ Среднее время</h3>
                <h2>245 мс</h2>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            st.markdown("""
            <div class="metric-card">
                <h3>👥 Пользователи</h3>
                <h2>567</h2>
            </div>
            """, unsafe_allow_html=True)
        
        # Charts
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📊 Популярные категории")
            categories_data = {
                'Категория': ['Электроника', 'Одежда', 'Книги', 'Спорт', 'Дом'],
                'Запросы': [45, 32, 28, 19, 15]
            }
            df_cat = pd.DataFrame(categories_data)
            fig = px.bar(df_cat, x='Категория', y='Запросы', color='Запросы')
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            st.subheader("📈 Время обработки")
            time_data = {
                'Время': list(range(24)),
                'Запросы': [12, 8, 5, 3, 2, 1, 2, 8, 15, 22, 28, 35, 42, 38, 32, 28, 25, 30, 35, 28, 22, 18, 15, 12]
            }
            df_time = pd.DataFrame(time_data)
            fig = px.line(df_time, x='Время', y='Запросы', title='Запросы по часам')
            st.plotly_chart(fig, use_container_width=True)
    
    with tab4:
        st.markdown('<h2 class="sub-header">🧠 NLP Анализ текста</h2>', unsafe_allow_html=True)
        
        # Text input
        nlp_text = st.text_area("📝 Введите текст для анализа:", 
                               placeholder="Введите любой текст на русском языке для анализа...",
                               height=150)
        
        if st.button("🧠 Анализировать", type="primary"):
            if nlp_text:
                with st.spinner("🧠 Анализирую текст..."):
                    nlp_result = process_nlp(nlp_text)
                    
                    if nlp_result:
                        st.success("✅ Анализ завершен!")
                        
                        # Display results
                        col1, col2 = st.columns(2)
                        
                        with col1:
                            st.subheader("📊 Основная информация")
                            st.write(f"**Оригинальный текст:** {nlp_result.get('original_text', '')}")
                            st.write(f"**Очищенный текст:** {nlp_result.get('cleaned_text', '')}")
                            st.write(f"**Намерение:** {nlp_result.get('intent', '')}")
                            st.write(f"**Уверенность намерения:** {nlp_result.get('intent_confidence', 0):.2f}")
                            st.write(f"**Тональность:** {nlp_result.get('sentiment', '')}")
                            st.write(f"**Оценка тональности:** {nlp_result.get('sentiment_score', 0):.2f}")
                        
                        with col2:
                            st.subheader("🔍 Детали анализа")
                            st.write(f"**Токены:** {', '.join(nlp_result.get('tokens', [])[:10])}...")
                            
                            # Entities
                            entities = nlp_result.get('entities', [])
                            if entities:
                                st.write("**Сущности:**")
                                for entity in entities:
                                    st.write(f"- {entity.get('text', '')} ({entity.get('label', '')})")
                            
                            # Filters
                            filters = nlp_result.get('filters', {})
                            if filters:
                                st.write("**Извлеченные фильтры:**")
                                for key, value in filters.items():
                                    st.write(f"- {key}: {value}")
                        
                        # Embedding visualization (simplified)
                        st.subheader("📊 Векторное представление")
                        embedding = nlp_result.get('embedding', [])
                        if embedding:
                            # Show first 50 dimensions
                            fig = px.line(y=embedding[:50], title="Первые 50 измерений вектора")
                            st.plotly_chart(fig, use_container_width=True)
            else:
                st.warning("⚠️ Пожалуйста, введите текст для анализа")

if __name__ == "__main__":
    main()
