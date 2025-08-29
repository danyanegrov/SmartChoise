// Эмуляция базы данных товаров для работы без бэкенда
class MockDatabase {
    constructor() {
        this.items = [
            // Ноутбуки
            { id: 1, name: "ASUS ROG Strix G15", category: "ноутбуки", price: 45000, rating: 4.8, description: "Игровой ноутбук с RTX 3060", attributes: ["gaming", "rtx", "15inch"] },
            { id: 2, name: "MacBook Air M2", category: "ноутбуки", price: 75000, rating: 4.9, description: "Ультрабук для работы и творчества", attributes: ["ultrabook", "macos", "13inch"] },
            { id: 3, name: "HP Pavilion 15", category: "ноутбуки", price: 25000, rating: 4.3, description: "Бюджетный ноутбук для учебы", attributes: ["budget", "student", "15inch"] },
            { id: 4, name: "Dell XPS 13", category: "ноутбуки", price: 55000, rating: 4.7, description: "Премиальный ультрабук", attributes: ["ultrabook", "premium", "13inch"] },
            { id: 5, name: "Lenovo ThinkPad X1", category: "ноутбуки", price: 85000, rating: 4.6, description: "Бизнес-ноутбук", attributes: ["business", "durable", "14inch"] },
            
            // Смартфоны
            { id: 6, name: "iPhone 15", category: "смартфоны", price: 65000, rating: 4.8, description: "Флагманский смартфон Apple", attributes: ["ios", "premium", "camera"] },
            { id: 7, name: "Samsung Galaxy S24", category: "смартфоны", price: 55000, rating: 4.7, description: "Android флагман", attributes: ["android", "amoled", "camera"] },
            { id: 8, name: "Xiaomi 14", category: "смартфоны", price: 35000, rating: 4.5, description: "Соотношение цена-качество", attributes: ["android", "miui", "fast-charging"] },
            
            // Путешествия
            { id: 9, name: "Отдых в Сочи", category: "путешествия", price: 15000, rating: 4.4, description: "Недельный отдых на море", attributes: ["море", "россия", "курорт"] },
            { id: 10, name: "Тур в Европу", category: "путешествия", price: 45000, rating: 4.6, description: "10 дней по столицам", attributes: ["европа", "культура", "города"] },
            { id: 11, name: "Отпуск в Турции", category: "путешествия", price: 25000, rating: 4.5, description: "All inclusive отель", attributes: ["море", "отель", "all-inclusive"] },
            
            // Жилье
            { id: 12, name: "Квартира в центре", category: "жилье", price: 3500000, rating: 4.2, description: "2-комнатная в центре города", attributes: ["центр", "2-комнатная", "метро"] },
            { id: 13, name: "Дом за городом", category: "жилье", price: 4200000, rating: 4.7, description: "Коттедж с участком", attributes: ["загород", "дом", "участок"] },
            
            // Работа
            { id: 14, name: "Remote Data Scientist", category: "работа", price: 150000, rating: 4.8, description: "Удаленная работа в IT", attributes: ["remote", "it", "data-science"] },
            { id: 15, name: "Менеджер продукта", category: "работа", price: 120000, rating: 4.5, description: "Product Manager в стартапе", attributes: ["startup", "product", "management"] }
        ];
        
        this.categories = [
            { id: 1, name: "ноутбуки", description: "Ноутбуки и переносные компьютеры" },
            { id: 2, name: "смартфоны", description: "Мобильные телефоны" },
            { id: 3, name: "путешествия", description: "Туры и путешествия" },
            { id: 4, name: "жилье", description: "Недвижимость" },
            { id: 5, name: "работа", description: "Вакансии и карьера" }
        ];
        
        this.userInteractions = [
            { userId: "demo_user", itemId: 1, type: "view", rating: 5 },
            { userId: "demo_user", itemId: 6, type: "like", rating: 4 },
            { userId: "demo_user", itemId: 9, type: "view", rating: 3 }
        ];
    }
    
    // Поиск товаров по запросу
    searchItems(query, limit = 5) {
        const keywords = query.toLowerCase().split(' ');
        const results = [];
        
        for (const item of this.items) {
            let score = 0;
            const searchText = `${item.name} ${item.description} ${item.category} ${item.attributes.join(' ')}`.toLowerCase();
            
            // Подсчет релевантности
            for (const keyword of keywords) {
                if (searchText.includes(keyword)) {
                    score += 1;
                    
                    // Бонус за точное совпадение в названии
                    if (item.name.toLowerCase().includes(keyword)) {
                        score += 2;
                    }
                    
                    // Бонус за совпадение категории
                    if (item.category.includes(keyword)) {
                        score += 1.5;
                    }
                }
            }
            
            if (score > 0) {
                results.push({
                    item: item,
                    score: score,
                    confidence: Math.min(score / keywords.length, 1.0)
                });
            }
        }
        
        // Сортировка по релевантности
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, limit);
    }
    
    // Получение рекомендаций на основе предпочтений
    getRecommendations(query, userId = "demo_user", limit = 5) {
        const searchResults = this.searchItems(query, limit * 2);
        
        if (searchResults.length === 0) {
            return {
                recommendations: [],
                explanation: "К сожалению, не найдено подходящих вариантов."
            };
        }
        
        // Учитываем пользовательские предпочтения
        const userPrefs = this.getUserPreferences(userId);
        
        for (const result of searchResults) {
            // Бонус за высокий рейтинг
            result.confidence += (result.item.rating - 4.0) * 0.1;
            
            // Бонус за предпочтения пользователя
            for (const pref of userPrefs) {
                if (result.item.attributes.includes(pref)) {
                    result.confidence += 0.15;
                }
            }
            
            // Нормализация уверенности
            result.confidence = Math.min(result.confidence, 1.0);
        }
        
        // Пересортировка с учетом предпочтений
        searchResults.sort((a, b) => b.confidence - a.confidence);
        
        const recommendations = searchResults.slice(0, limit);
        const topChoice = recommendations[0];
        
        let explanation = "";
        if (topChoice) {
            explanation = `Рекомендую "${topChoice.item.name}" на основе анализа вашего запроса "${query}". `;
            explanation += `Этот вариант имеет высокий рейтинг (${topChoice.item.rating}) и соответствует `;
            explanation += `вашим предпочтениям. Цена: ${this.formatPrice(topChoice.item.price)}.`;
        }
        
        return {
            recommendations: recommendations,
            explanation: explanation,
            query: query,
            total_found: searchResults.length
        };
    }
    
    getUserPreferences(userId) {
        // Извлекаем предпочтения из истории взаимодействий
        const interactions = this.userInteractions.filter(i => i.userId === userId);
        const preferences = [];
        
        for (const interaction of interactions) {
            const item = this.items.find(i => i.id === interaction.itemId);
            if (item && interaction.rating >= 4) {
                preferences.push(...item.attributes);
            }
        }
        
        return [...new Set(preferences)]; // убираем дубли
    }
    
    formatPrice(price) {
        if (price >= 1000000) {
            return `${(price / 1000000).toFixed(1)} млн руб.`;
        } else if (price >= 1000) {
            return `${(price / 1000).toFixed(0)} тыс. руб.`;
        } else {
            return `${price} руб.`;
        }
    }
    
    getRecentDecisions() {
        return [
            {
                title: "Выбор игрового ноутбука",
                decisionType: "recommendation",
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                title: "Планирование отпуска в Турции",
                decisionType: "search",
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            },
            {
                title: "Выбор смартфона до 50000",
                decisionType: "recommendation",
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }
}

// Глобальный экземпляр базы данных
window.mockDB = new MockDatabase();
