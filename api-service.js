// API Service для интеграции с Decision Helper Backend
class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:3001/api';
        this.token = localStorage.getItem('authToken');
    }

    // Базовый метод для API запросов
    async makeRequest(endpoint, method = 'GET', data = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        const config = {
            method,
            headers,
            body: data ? JSON.stringify(data) : null
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, config);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Токен истёк или недействителен
                    this.logout();
                    throw new Error('Требуется авторизация');
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // === АУТЕНТИФИКАЦИЯ ===

    async register(userData) {
        const result = await this.makeRequest('/auth/register', 'POST', userData);
        if (result.token) {
            this.token = result.token;
            localStorage.setItem('authToken', this.token);
        }
        return result;
    }

    async login(email, password) {
        const result = await this.makeRequest('/auth/login', 'POST', { email, password });
        if (result.token) {
            this.token = result.token;
            localStorage.setItem('authToken', this.token);
        }
        return result;
    }

    async getProfile() {
        return await this.makeRequest('/auth/me');
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        // Можно добавить редирект на страницу логина
    }

    // === РЕШЕНИЯ ===

    async createSimpleDecision(decisionData) {
        return await this.makeRequest('/decisions/simple', 'POST', {
            title: decisionData.question || decisionData.title,
            description: decisionData.question || decisionData.description,
            options: decisionData.options.map(opt => ({
                text: opt.text,
                rating: opt.rating || 3
            })),
            emotionContext: decisionData.emotion
        });
    }

    async createComplexDecision(decisionData) {
        return await this.makeRequest('/decisions/complex', 'POST', {
            title: decisionData.question || decisionData.title,
            description: decisionData.question || decisionData.description,
            criteria: decisionData.criteria,
            options: decisionData.options,
            evaluationMatrix: decisionData.evaluationMatrix
        });
    }

    async createRandomDecision(decisionData) {
        return await this.makeRequest('/decisions/random', 'POST', {
            title: 'Случайный выбор',
            description: 'Случайный выбор из вариантов',
            options: decisionData.options.map(opt => ({ text: opt }))
        });
    }

    async getDecisionHistory(limit = 50) {
        return await this.makeRequest(`/decisions/history?limit=${limit}`);
    }

    async getDecisionById(id) {
        return await this.makeRequest(`/decisions/${id}`);
    }

    // === ML АЛГОРИТМЫ ===

    async getEmotionDecision(decisionData) {
        return await this.makeRequest('/ml/emotion-decision', 'POST', {
            text: decisionData.question,
            options: decisionData.options,
            userProfile: decisionData.userProfile
        });
    }

    async getContextualRecommendation(decisionData) {
        return await this.makeRequest('/ml/contextual-recommendation', 'POST', {
            options: decisionData.options,
            context: decisionData.context,
            userProfile: decisionData.userProfile
        });
    }

    async getBehavioralAnalysis(sessionData) {
        return await this.makeRequest('/ml/behavioral-analysis', 'POST', sessionData);
    }

    // === АНАЛИТИКА ===

    async getDashboardData() {
        return await this.makeRequest('/analytics/dashboard');
    }

    async getInsights() {
        return await this.makeRequest('/analytics/insights');
    }

    async getTrends() {
        return await this.makeRequest('/analytics/trends');
    }

    // === ПОЛЬЗОВАТЕЛИ ===

    async updateProfile(profileData) {
        return await this.makeRequest('/users/profile', 'PUT', profileData);
    }

    async updatePreferences(preferences) {
        return await this.makeRequest('/users/preferences', 'PUT', { preferences });
    }

    async getBehaviorData() {
        return await this.makeRequest('/users/behavior');
    }

    // === HEALTH CHECK ===

    async healthCheck() {
        try {
            const response = await fetch('http://localhost:3001/health');
            return await response.json();
        } catch (error) {
            throw new Error('Backend недоступен');
        }
    }

    // === УТИЛИТЫ ===

    isAuthenticated() {
        return !!this.token;
    }

    getToken() {
        return this.token;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', this.token);
        } else {
            localStorage.removeItem('authToken');
        }
    }
}

// Создаем глобальный экземпляр API сервиса
window.apiService = new ApiService();

// Проверяем соединение с backend при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const health = await window.apiService.healthCheck();
        console.log('✅ Backend подключен:', health);
        
        // Показываем индикатор подключения
        const indicator = document.querySelector('.ai-indicator');
        if (indicator) {
            indicator.classList.add('active');
            indicator.style.background = 'var(--color-success)';
        }
    } catch (error) {
        console.error('❌ Backend недоступен:', error);
        
        // Показываем ошибку подключения
        const indicator = document.querySelector('.ai-indicator');
        if (indicator) {
            indicator.classList.remove('active');
            indicator.style.background = 'var(--color-error)';
        }
        
        // Показываем уведомление пользователю
        if (window.app) {
            window.app.showToast('Backend недоступен. Проверьте подключение к серверу.', 'error');
        }
    }
});
