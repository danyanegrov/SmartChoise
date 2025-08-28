// SmartChoice AI Application - New Version
class SmartChoiceAI {
    constructor() {
        this.currentScreen = 'home';
        this.decisionHistory = [];
        this.userProfile = {
            id: 'demo_user',
            name: 'Демо пользователь',
            email: 'demo@smartchoice.ai'
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadUserProfile();
        this.showScreen('home');
        this.initializeHomeScreen();
        this.loadRecentDecisions();
    }

    loadUserProfile() {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            try {
                this.userProfile = { ...this.userProfile, ...JSON.parse(savedProfile) };
            } catch (error) {
                console.error('Failed to load user profile:', error);
            }
        }

        const savedHistory = localStorage.getItem('decisionHistory');
        if (savedHistory) {
            try {
                this.decisionHistory = JSON.parse(savedHistory);
            } catch (error) {
                console.error('Failed to load decision history:', error);
            }
        }
    }

    setupEventListeners() {
        // Mode buttons
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const type = btn.getAttribute('data-type');
                this.handleModeChange(type);
            });
        });

        // Navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('onclick');
                if (action) {
                    eval(action);
                }
            });
        });

        // Decision screen options
        this.setupDecisionOptions();
    }

    setupDecisionOptions() {
        const addOptionBtn = document.getElementById('add-decision-option');
        const optionsList = document.getElementById('decision-options');
        const getRecommendationBtn = document.getElementById('get-decision-recommendation');

        if (addOptionBtn && optionsList) {
            addOptionBtn.addEventListener('click', () => {
                const optionItem = document.createElement('div');
                optionItem.className = 'option-item';
                optionItem.innerHTML = `
                    <input type="text" class="form-control" placeholder="Добавить вариант...">
                    <button class="btn btn--small btn--danger" onclick="this.parentElement.remove()">×</button>
                `;
                optionsList.appendChild(optionItem);
            });
        }

        if (getRecommendationBtn) {
            getRecommendationBtn.addEventListener('click', () => this.handleDecisionSubmit());
        }
    }

    async handleDecisionSubmit() {
        const questionInput = document.getElementById('decision-question');
        const optionsList = document.getElementById('decision-options');
        const resultSection = document.getElementById('decision-result');

        if (!questionInput || !optionsList || !resultSection) return;

        const question = questionInput.value.trim();
        if (!question) {
            this.showToast('Введите описание ситуации', 'error');
            return;
        }

        const options = Array.from(optionsList.querySelectorAll('.form-control'))
            .map(input => input.value.trim())
            .filter(value => value.length > 0);

        if (options.length < 2) {
            this.showToast('Добавьте минимум 2 варианта', 'error');
            return;
        }

        // Show result section
        resultSection.classList.remove('hidden');

        // Mock recommendation for now
        const recommendedOption = options[Math.floor(Math.random() * options.length)];
        const confidence = Math.random() * 0.4 + 0.6; // 60-100%

        const recommendedElement = resultSection.querySelector('.recommended-option');
        const confidenceFill = resultSection.querySelector('.confidence-fill');
        const confidenceText = resultSection.querySelector('.confidence-text');
        const explanation = resultSection.querySelector('.result-explanation');

        if (recommendedElement) recommendedElement.textContent = recommendedOption;
        if (confidenceFill) confidenceFill.style.width = (confidence * 100) + '%';
        if (confidenceText) confidenceText.textContent = Math.round(confidence * 100) + '%';
        if (explanation) explanation.textContent = `На основе анализа вашей ситуации "${question}", ИИ рекомендует "${recommendedOption}" с уверенностью ${Math.round(confidence * 100)}%.`;

        // Add to history
        this.addToHistory(question, {
            recommendation: recommendedOption,
            confidence: confidence
        });

        // Update dashboard stats
        this.updateDashboardStats();
    }

    handleModeChange(type) {
        switch(type) {
            case 'simple':
                this.showDecisionScreen('simple');
                break;
            case 'complex':
                this.showDecisionScreen('complex');
                break;
            case 'random':
                this.showDecisionScreen('random');
                break;
            case 'analysis':
                this.showScreen('dashboard');
                break;
            case 'ai':
                this.showDecisionScreen('simple');
                break;
            default:
                this.showScreen('home');
        }
    }

    showScreen(screenName) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }
        
        // Update navigation
        this.updateNavigation(screenName);
    }

    showDecisionScreen(type) {
        this.currentDecisionType = type;
        this.showScreen('decision');
        
        // Update decision screen content based on type
        this.updateDecisionScreen(type);
    }

    updateNavigation(activeScreen) {
        // Update header navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Find and activate corresponding nav button
        const activeNavBtn = document.querySelector(`[onclick*="${activeScreen}"]`);
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
        }
    }

    updateDecisionScreen(type) {
        const decisionScreen = document.getElementById('decision-screen');
        if (!decisionScreen) return;

        const title = decisionScreen.querySelector('.decision-title');
        const description = decisionScreen.querySelector('.decision-description');
        
        if (title && description) {
            switch(type) {
                case 'simple':
                    title.textContent = 'Простой выбор';
                    description.textContent = 'Опишите ситуацию и получите рекомендацию';
                    break;
                case 'complex':
                    title.textContent = 'Сложный анализ';
                    description.textContent = 'Множественные критерии и варианты';
                    break;
                case 'random':
                    title.textContent = 'Случайный выбор';
                    description.textContent = 'Когда нужно быстро принять решение';
                    break;
            }
        }
    }

    initializeHomeScreen() {
        // Examples
        const examples = [
            'Стоит ли сейчас менять работу?',
            'Какой ноутбук выбрать для data science?',
            'Куда поехать в отпуск с бюджетом 1000$?',
            'Выбрать аренду или ипотеку?'
        ];
        
        const examplesContainer = document.getElementById('examples-list');
        if (examplesContainer) {
            examplesContainer.innerHTML = examples.map(example => 
                `<div class="example-item" onclick="app.setExample('${example}')">${example}</div>`
            ).join('');
        }
        
        // Wire up submit button
        const submitBtn = document.getElementById('home-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleHomeSubmit());
        }
    }

    setExample(text) {
        const input = document.getElementById('home-input');
        if (input) {
            input.value = text;
            input.focus();
        }
    }

    async handleHomeSubmit() {
        const input = document.getElementById('home-input');
        const answer = document.getElementById('home-answer');
        
        if (!input || !answer) return;
        
        const question = input.value.trim();
        if (!question) {
            this.showToast('Введите описание ситуации', 'error');
            return;
        }

        answer.textContent = 'Анализирую…';
        
        try {
            // Submit to API
            const response = await fetch('/api/decisions/simple', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    userId: this.userProfile.id,
                    decisionType: 'simple'
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.displayAIResponse(result, answer);
                
                // Add to history
                this.addToHistory(question, result);
                
                // Refresh recent decisions
                this.loadRecentDecisions();
                
            } else {
                throw new Error(`API error: ${response.status}`);
            }
        } catch (error) {
            console.error('API submission failed:', error);
            this.displayFallbackResponse(question, answer);
        }
    }

    displayAIResponse(result, answerElement) {
        answerElement.innerHTML = `
            <div class="ai-response">
                <div class="response-header">
                    <strong>🤖 AI Анализ завершен</strong>
                </div>
                <div class="response-content">
                    <p><strong>Рекомендация:</strong> ${result.recommendation}</p>
                    <p><strong>Уверенность:</strong> ${Math.round(result.confidence * 100)}%</p>
                    <p><strong>Обоснование:</strong> ${result.reasoning}</p>
                    <div class="response-options">
                        <strong>Варианты:</strong>
                        <ul>
                            ${result.alternatives.map(alt => `<li>${alt}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    displayFallbackResponse(question, answerElement) {
        answerElement.innerHTML = `
            <div class="ai-response">
                <div class="response-header">
                    <strong>🔧 Локальный анализ</strong>
                </div>
                <div class="response-content">
                    <p><strong>Рекомендация:</strong> На основе вашего вопроса "${question}", я рекомендую тщательно взвесить все варианты.</p>
                    <p><em>Примечание: Используется локальная обработка. API недоступен.</em></p>
                </div>
            </div>
        `;
    }

    addToHistory(question, result) {
        const decision = {
            id: Date.now(),
            type: 'simple',
            question: question,
            result: result.recommendation,
            timestamp: new Date().toISOString(),
            confidence: result.confidence
        };
        
        this.decisionHistory.unshift(decision);
        
        // Keep only last 50 decisions
        if (this.decisionHistory.length > 50) {
            this.decisionHistory = this.decisionHistory.slice(0, 50);
        }
        
        // Save to localStorage
        localStorage.setItem('decisionHistory', JSON.stringify(this.decisionHistory));
    }

    async loadRecentDecisions() {
        try {
            const response = await fetch('/api/decisions/recent');
            if (response.ok) {
                const decisions = await response.json();
                this.renderRecentDecisions(decisions);
            } else {
                // Fallback to local data
                this.renderRecentDecisionsLocal();
            }
        } catch (error) {
            console.error('Failed to load recent decisions:', error);
            this.renderRecentDecisionsLocal();
        }
    }

    renderRecentDecisions(decisions) {
        const container = document.getElementById('recent-decisions');
        if (!container) return;
        
        const formatDate = (date) => {
            const now = new Date();
            const diff = now - new Date(date);
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(hours / 24);
            
            if (hours < 1) return 'Только что';
            if (hours < 24) return `${hours} час${hours === 1 ? '' : hours < 5 ? 'а' : 'ов'} назад`;
            if (days < 7) return `${days} дн${days === 1 ? 'ь' : days < 5 ? 'я' : 'ей'} назад`;
            return new Date(date).toLocaleDateString('ru-RU');
        };
        
        container.innerHTML = decisions.map(d => `
            <div class="recent-decision">
                <div class="decision-title">${d.title}</div>
                <div class="decision-meta">
                    <span class="decision-type">${d.decisionType}</span>
                    <span class="decision-date">${formatDate(d.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    renderRecentDecisionsLocal() {
        const container = document.getElementById('recent-decisions');
        if (!container) return;
        
        const recent = this.decisionHistory.slice(0, 5);
        container.innerHTML = recent.map(d => `
            <div class="recent-decision">
                <div class="decision-title">${d.question}</div>
                <div class="decision-meta">
                    <span class="decision-type">${d.type}</span>
                    <span class="decision-date">${new Date(d.timestamp).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;

        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }

    // Navigation methods
    showDashboard() {
        this.showScreen('dashboard');
        this.updateDashboardStats();
    }

    showHistory() {
        this.showScreen('history');
        this.renderHistoryList();
    }

    showProfile() {
        this.showScreen('profile');
        this.loadProfileData();
    }

    // Dashboard methods
    updateDashboardStats() {
        const totalDecisions = this.decisionHistory.length;
        const successRate = totalDecisions > 0 ? Math.round((totalDecisions / (totalDecisions + 5)) * 100) : 0;
        const avgConfidence = totalDecisions > 0 ? 
            Math.round(this.decisionHistory.reduce((sum, d) => sum + (d.confidence || 0.5), 0) / totalDecisions * 100) : 0;

        const totalElement = document.getElementById('total-decisions');
        const successElement = document.getElementById('success-rate');
        const confidenceElement = document.getElementById('avg-confidence');

        if (totalElement) totalElement.textContent = totalDecisions;
        if (successElement) successElement.textContent = successRate + '%';
        if (confidenceElement) confidenceElement.textContent = avgConfidence + '%';

        // Update mini stats on home screen
        const miniTotal = document.getElementById('mini-total');
        const miniAccuracy = document.getElementById('mini-accuracy');
        if (miniTotal) miniTotal.textContent = totalDecisions;
        if (miniAccuracy) miniAccuracy.textContent = successRate + '%';
    }

    // History methods
    renderHistoryList() {
        const container = document.getElementById('history-list');
        if (!container) return;

        if (this.decisionHistory.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">История решений пуста</p>';
            return;
        }

        container.innerHTML = this.decisionHistory.map(decision => `
            <div class="history-item" style="padding: 1rem; border-bottom: 1px solid var(--color-border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong>${decision.question}</strong>
                    <span style="color: var(--color-text-secondary); font-size: 0.9rem;">
                        ${new Date(decision.timestamp).toLocaleDateString()}
                    </span>
                </div>
                <div style="color: var(--color-text-secondary); margin-bottom: 0.5rem;">
                    Тип: ${decision.type} | Уверенность: ${Math.round((decision.confidence || 0.5) * 100)}%
                </div>
                <div style="color: var(--color-accent); font-weight: 500;">
                    ${decision.result}
                </div>
            </div>
        `).join('');

        // Setup export button
        const exportBtn = document.getElementById('export-history');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportHistory());
        }

        // Setup filter
        const filterSelect = document.getElementById('history-type-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => this.filterHistory(e.target.value));
        }
    }

    filterHistory(type) {
        const container = document.getElementById('history-list');
        if (!container) return;

        let filteredDecisions = this.decisionHistory;
        if (type) {
            filteredDecisions = this.decisionHistory.filter(d => d.type === type);
        }

        if (filteredDecisions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">Решения не найдены</p>';
            return;
        }

        container.innerHTML = filteredDecisions.map(decision => `
            <div class="history-item" style="padding: 1rem; border-bottom: 1px solid var(--color-border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong>${decision.question}</strong>
                    <span style="color: var(--color-text-secondary); font-size: 0.9rem;">
                        ${new Date(decision.timestamp).toLocaleDateString()}
                    </span>
                </div>
                <div style="color: var(--color-text-secondary); margin-bottom: 0.5rem;">
                    Тип: ${decision.type} | Уверенность: ${Math.round((decision.confidence || 0.5) * 100)}%
                </div>
                <div style="color: var(--color-accent); font-weight: 500;">
                    ${decision.result}
                </div>
            </div>
        `).join('');
    }

    exportHistory() {
        if (this.decisionHistory.length === 0) {
            this.showToast('История пуста', 'error');
            return;
        }

        const csvContent = this.convertToCSV(this.decisionHistory);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `smartchoice_history_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    convertToCSV(data) {
        const headers = ['Дата', 'Тип', 'Вопрос', 'Результат', 'Уверенность'];
        const rows = data.map(item => [
            new Date(item.timestamp).toLocaleDateString('ru-RU'),
            item.type,
            item.question,
            item.result,
            Math.round((item.confidence || 0.5) * 100) + '%'
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    // Profile methods
    loadProfileData() {
        const nameInput = document.getElementById('user-name');
        const ageInput = document.getElementById('user-age');
        const personalitySelect = document.getElementById('personality-type');
        const anxietyRange = document.getElementById('anxiety-level');
        const anxietyValue = document.getElementById('anxiety-value');

        if (nameInput) nameInput.value = this.userProfile.name || '';
        if (ageInput) ageInput.value = this.userProfile.age || '';
        if (personalitySelect) personalitySelect.value = this.userProfile.personalityType || '';
        if (anxietyRange) anxietyRange.value = this.userProfile.anxietyLevel || 5;
        if (anxietyValue) anxietyValue.textContent = this.userProfile.anxietyLevel || 5;

        // Load preferences
        const dataCheckbox = document.getElementById('prefer-data');
        const intuitionCheckbox = document.getElementById('prefer-intuition');
        const speedCheckbox = document.getElementById('prefer-speed');
        const consultationCheckbox = document.getElementById('prefer-consultation');

        if (dataCheckbox) dataCheckbox.checked = this.userProfile.preferences?.data || false;
        if (intuitionCheckbox) intuitionCheckbox.checked = this.userProfile.preferences?.intuition || false;
        if (speedCheckbox) speedCheckbox.checked = this.userProfile.preferences?.speed || false;
        if (consultationCheckbox) consultationCheckbox.checked = this.userProfile.preferences?.consultation || false;

        // Setup anxiety range listener
        if (anxietyRange && anxietyValue) {
            anxietyRange.addEventListener('input', (e) => {
                anxietyValue.textContent = e.target.value;
            });
        }

        // Setup save button
        const saveBtn = document.getElementById('save-profile');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveProfile());
        }
    }

    saveProfile() {
        const nameInput = document.getElementById('user-name');
        const ageInput = document.getElementById('user-age');
        const personalitySelect = document.getElementById('personality-type');
        const anxietyRange = document.getElementById('anxiety-level');
        const dataCheckbox = document.getElementById('prefer-data');
        const intuitionCheckbox = document.getElementById('prefer-intuition');
        const speedCheckbox = document.getElementById('prefer-speed');
        const consultationCheckbox = document.getElementById('prefer-consultation');

        this.userProfile = {
            ...this.userProfile,
            name: nameInput?.value || '',
            age: ageInput?.value ? parseInt(ageInput.value) : null,
            personalityType: personalitySelect?.value || '',
            anxietyLevel: anxietyRange?.value ? parseInt(anxietyRange.value) : 5,
            preferences: {
                data: dataCheckbox?.checked || false,
                intuition: intuitionCheckbox?.checked || false,
                speed: speedCheckbox?.checked || false,
                consultation: consultationCheckbox?.checked || false
            }
        };

        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
        
        this.showToast('Профиль сохранен успешно', 'success');
    }

    logout() {
        localStorage.removeItem('demoMode');
        localStorage.removeItem('decisionHistory');
        window.location.reload();
    }
}

// Global app instance
let app;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    app = new SmartChoiceAI();
});

// Global functions for button clicks
function showScreen(screenName) {
    if (app && typeof app.showScreen === 'function') {
        app.showScreen(screenName);
    }
}

function showDecisionScreen(type) {
    if (app && typeof app.showDecisionScreen === 'function') {
        app.showDecisionScreen(type);
    }
}
