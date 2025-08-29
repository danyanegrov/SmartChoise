// SmartChoice AI Application - New Version
class SmartChoiceAI {
    constructor() {
        this.currentScreen = 'home';
        this.currentMode = 'simple'; // Режим по умолчанию
        this.processingStrategy = 'fast';
        this.decisionHistory = [];
        this.userProfile = {
            id: 'demo_user',
            name: 'Демо пользователь',
            email: 'demo@smartchoice.ai'
        };
        
        this.init();
    }

    async init() {
        console.log('Инициализация приложения...');
        this.setupEventListeners();
        this.loadUserProfile();
        this.showScreen('home');
        this.initializeHomeScreen();
        this.loadRecentDecisions();
        this.restoreModeSwitchers();
        console.log('Приложение инициализировано с режимом:', this.currentMode);
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
        
        // Загружаем сохраненный режим
        const savedMode = localStorage.getItem('selectedMode');
        if (savedMode) {
            this.currentMode = savedMode;
            this.updateProcessingMode(savedMode);
        }
        
        // Обновляем интерфейс в соответствии с загруженным режимом
        if (this.currentMode === 'complex') {
            this.updateModeSwitchers('complex');
        }
    }

    setupEventListeners() {
        // Mode switchers in input field
        const modeSwitchers = document.querySelectorAll('.mode-switch');
        modeSwitchers.forEach(btn => {
            btn.addEventListener('click', () => {
                modeSwitchers.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const mode = btn.getAttribute('data-mode');
                this.handleModeChange(mode);
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
        
        // Кнопка добавления варианта для сложного анализа
        this.setupAddOptionButton();
    }
    
    setupAddOptionButton() {
        const addOptionBtn = document.getElementById('add-option-btn');
        if (addOptionBtn) {
            // Удаляем ВСЕ старые обработчики
            const newBtn = addOptionBtn.cloneNode(true);
            addOptionBtn.parentNode.replaceChild(newBtn, addOptionBtn);
            
            // Добавляем новый обработчик только один раз
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Кнопка "Добавить вариант" нажата');
                this.addNewOption();
            });
        }
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

    handleModeChange(mode) {
        console.log('handleModeChange вызвана с режимом:', mode);
        
        // Обновляем placeholder в зависимости от режима
        const input = document.getElementById('home-input');
        if (input) {
            switch(mode) {
                case 'simple':
                    input.placeholder = 'Спросите что угодно или упомяните пространство';
                    break;
                case 'complex':
                    input.placeholder = 'Опишите сложную задачу с множественными критериями...';
                    break;
                case 'random':
                    input.placeholder = 'Когда нужно быстро принять решение...';
                    break;
            }
        }
        
        // Сохраняем выбранный режим
        this.currentMode = mode;
        localStorage.setItem('selectedMode', mode);
        
        console.log('Сохранили режим:', mode);
        
        // Обновляем визуальное состояние переключателей
        this.updateModeSwitchers(mode);
        
        // Обновляем логику обработки в зависимости от режима
        this.updateProcessingMode(mode);
    }
    
    updateModeSwitchers(activeMode) {
        console.log('updateModeSwitchers вызвана с режимом:', activeMode);
        
        const modeSwitchers = document.querySelectorAll('.mode-switch');
        const simpleInput = document.getElementById('simple-input-container');
        const complexInterface = document.getElementById('complex-analysis-interface');
        
        console.log('Найденные элементы:', {
            simpleInput: simpleInput,
            complexInterface: complexInterface,
            modeSwitchers: modeSwitchers.length
        });
        
        modeSwitchers.forEach(btn => {
            const mode = btn.getAttribute('data-mode');
            if (mode === activeMode) {
                // Активный режим - синий цвет
                btn.style.color = '#378798';
                btn.classList.add('active');
            } else {
                // Неактивные режимы - серый цвет
                btn.style.color = '#6B7280';
                btn.classList.remove('active');
            }
        });
        
        // Переключаем интерфейсы
        if (activeMode === 'complex') {
            console.log('Переключаем на сложный анализ');
            // Показываем интерфейс сложного анализа
            if (simpleInput) {
                simpleInput.style.display = 'none';
                console.log('Скрыли простой интерфейс');
            }
            if (complexInterface) {
                complexInterface.style.display = 'block';
                console.log('Показали сложный интерфейс');
            }
            // Перенастраиваем кнопку добавления
            setTimeout(() => this.setupAddOptionButton(), 100);
        } else {
            console.log('Переключаем на простой режим');
            // Показываем простой интерфейс
            if (simpleInput) {
                simpleInput.style.display = 'block';
                console.log('Показали простой интерфейс');
            }
            if (complexInterface) {
                complexInterface.style.display = 'none';
                console.log('Скрыли сложный интерфейс');
            }
        }
    }
    
    updateProcessingMode(mode) {
        // Здесь можно настроить разные алгоритмы для разных режимов
        switch(mode) {
            case 'simple':
                // Быстрые рекомендации на основе ключевых слов
                this.processingStrategy = 'fast';
                break;
            case 'complex':
                // Детальный анализ с множественными критериями
                this.processingStrategy = 'detailed';
                break;
            case 'random':
                // Случайный выбор из подходящих вариантов
                this.processingStrategy = 'random';
                break;
        }
    }
    
    restoreModeSwitchers() {
        console.log('restoreModeSwitchers вызвана с режимом:', this.currentMode);
        
        // Восстанавливаем активное состояние переключателей
        const modeSwitchers = document.querySelectorAll('.mode-switch');
        console.log('Найдено переключателей режимов:', modeSwitchers.length);
        
        modeSwitchers.forEach(btn => {
            const mode = btn.getAttribute('data-mode');
            if (mode === this.currentMode) {
                btn.classList.add('active');
                btn.style.color = '#378798'; // Активный режим - синий
                console.log('Активирован переключатель для режима:', mode);
            } else {
                btn.classList.remove('active');
                btn.style.color = '#6B7280'; // Неактивные режимы - серый
            }
        });
        
        // Обновляем видимость интерфейсов в соответствии с текущим режимом
        this.updateModeSwitchers(this.currentMode);
    }
    
    addNewOption() {
        console.log('addNewOption вызвана');
        
        const optionsList = document.getElementById('options-list');
        const criteriaList = document.getElementById('criteria-list');
        
        if (optionsList && criteriaList) {
            // Добавляем ОДИН новый вариант
            const optionNumber = optionsList.children.length + 1;
            console.log(`Добавляем вариант ${optionNumber}`);
            
            const newOption = document.createElement('input');
            newOption.type = 'text';
            newOption.placeholder = `Вариант ${optionNumber}`;
            newOption.style.cssText = 'padding:0.75rem;border:2px solid rgba(55,135,152,0.3);border-radius:12px;background:rgba(255,255,255,0.15);color:#111827;outline:none;transition:border-color 0.3s;';
            optionsList.appendChild(newOption);
            
            // Добавляем ОДИН соответствующий критерий
            const criteriaNumber = criteriaList.children.length + 1;
            const newCriteria = document.createElement('input');
            newCriteria.type = 'text';
            newCriteria.placeholder = `Критерий ${criteriaNumber} (например: важность)`;
            newCriteria.style.cssText = 'padding:0.75rem;border:2px solid rgba(55,135,152,0.3);border-radius:12px;background:rgba(255,255,255,0.15);color:#111827;outline:none;transition:border-color 0.3s;';
            criteriaList.appendChild(newCriteria);
            
            console.log(`Добавлено: Вариант ${optionNumber} и Критерий ${criteriaNumber}`);
            console.log(`Всего вариантов: ${optionsList.children.length}, критериев: ${criteriaList.children.length}`);
            
            // Добавляем эффект фокуса
            newOption.focus();
        } else {
            console.error('Не найдены списки вариантов или критериев');
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
        
        // Wire up submit button + Enter
        const submitBtn = document.getElementById('home-submit');
        const inputEl = document.getElementById('home-input');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleHomeSubmit());
        }
        if (inputEl) {
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleHomeSubmit();
                }
            });
        }
    }

    ensureChatUI() {
        let chat = document.getElementById('chat-thread');
        if (!chat) {
            const inputEl = document.getElementById('home-input');
            const inputWrapper = inputEl ? inputEl.parentElement : null; // positioned wrapper
            const container = inputWrapper ? inputWrapper.parentElement : document.getElementById('home-screen');

            chat = document.createElement('div');
            chat.id = 'chat-thread';
            chat.style.maxWidth = '1100px';
            chat.style.margin = '1.25rem auto 0 auto';
            chat.style.display = 'flex';
            chat.style.flexDirection = 'column';
            chat.style.gap = '0.75rem';

            // Вставляем чат ПЕРЕД полем ввода, чтобы ввод спускался вниз
            if (container && inputWrapper && container.insertBefore) {
                container.insertBefore(chat, inputWrapper);
            } else {
                const homeScreen = document.getElementById('home-screen');
                homeScreen.appendChild(chat);
            }
        }
        return chat;
    }

    appendMessage(role, content, isPending = false) {
        const chat = this.ensureChatUI();
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = role === 'user' ? 'flex-end' : 'flex-start';

        const bubble = document.createElement('div');
        bubble.style.maxWidth = '80%';
        bubble.style.padding = '12px 14px';
        bubble.style.border = '1px solid #E5E7EB';
        bubble.style.borderRadius = role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px';
        bubble.style.background = role === 'user' ? '#F9FAFB' : '#FFFFFF';
        bubble.style.whiteSpace = 'pre-wrap';
        bubble.textContent = content;
        if (isPending) bubble.dataset.pending = 'true';

        row.appendChild(bubble);
        chat.appendChild(row);
        chat.scrollTop = chat.scrollHeight;
        return bubble;
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
        if (!input) return;
        const question = input.value.trim();
        if (!question) {
            this.showToast('Введите описание ситуации', 'error');
            return;
        }

        // Скрываем заголовок сразу после первого сообщения
        const welcome = document.querySelector('.welcome-section');
        if (welcome) {
            welcome.style.display = 'none';
        }
        
        // show user message and pending assistant
        this.appendMessage('user', question);
        input.value = '';
        const pending = this.appendMessage('assistant', 'Анализирую…', true);
        
        try {
            // Try API first with short timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            const response = await fetch('/api/decisions/simple', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    userId: this.userProfile.id,
                    decisionType: 'simple'
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const result = await response.json();
                pending.textContent = `${result.recommendation}\n\nОбоснование: ${result.reasoning}`;
                delete pending.dataset.pending;
                this.addToHistory(question, result);
                return;
            } else {
                throw new Error(`API error: ${response.status}`);
            }
        } catch (error) {
            console.log('API недоступен, используется локальная база данных');
            const local = this.processWithMockDatabaseReturn(question);
            if (local) {
                pending.textContent = `${local.recommendation}\n\nАнализ: ${local.reasoning}`;
                delete pending.dataset.pending;
            } else {
                pending.textContent = 'Не удалось получить ответ.';
                delete pending.dataset.pending;
            }
        }
    }

    processWithMockDatabaseReturn(question) {
        if (!window.mockDB) return null;
        const recommendations = window.mockDB.getRecommendations(question, this.userProfile.id, 5);
        if (recommendations.recommendations.length > 0) {
            const top = recommendations.recommendations[0];
            const alternatives = recommendations.recommendations.slice(1, 4);
            const result = {
                recommendation: top.item.name,
                confidence: top.confidence,
                reasoning: recommendations.explanation,
                alternatives: alternatives.map(r => r.item.name),
                source: 'database'
            };
            this.addToHistory(question, result);
            return result;
        }
        return null;
    }
    
    processWithMockDatabase(question, answerElement) {
        // Используем эмуляцию базы данных
        if (!window.mockDB) {
            this.displayFallbackResponse(question, answerElement);
            return;
        }
        
        answerElement.innerHTML = '<div class="loading-indicator">🔍 Поиск в базе данных товаров...</div>';
        
        // Имитируем задержку для реалистичности
        setTimeout(() => {
            const recommendations = window.mockDB.getRecommendations(question, this.userProfile.id, 5);
            
            if (recommendations.recommendations.length > 0) {
                const top = recommendations.recommendations[0];
                const alternatives = recommendations.recommendations.slice(1, 4);
                
                const result = {
                    recommendation: top.item.name,
                    confidence: top.confidence,
                    reasoning: recommendations.explanation,
                    alternatives: alternatives.map(r => r.item.name),
                    source: "database"
                };
                
                this.displayDatabaseResponse(result, answerElement);
                this.addToHistory(question, result);
                this.showToast('Найдено в базе данных!', 'success');
            } else {
                this.displayFallbackResponse(question, answerElement);
            }
        }, 800); // 800ms задержка для эффекта поиска
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

    displayDatabaseResponse(result, answerElement) {
        answerElement.innerHTML = `
            <div class="ai-response">
                <div class="response-header">
                    <strong>📊 Анализ базы данных завершен</strong>
                </div>
                <div class="response-content">
                    <p><strong>Лучший вариант:</strong> ${result.recommendation}</p>
                    <p><strong>Уверенность:</strong> ${Math.round(result.confidence * 100)}%</p>
                    <p><strong>Анализ:</strong> ${result.reasoning}</p>
                    ${result.alternatives.length > 0 ? `
                        <div class="response-options">
                            <strong>Альтернативы:</strong>
                            <ul>
                                ${result.alternatives.map(alt => `<li>${alt}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="data-source">
                        <small>💾 Данные получены из локальной базы товаров и услуг</small>
                    </div>
                </div>
            </div>
        `;
    }

    displayFallbackResponse(question, answerElement) {
        // Более интеллектуальный локальный анализ
        const keywords = question.toLowerCase();
        let recommendation = "тщательно проанализировать все доступные варианты";
        let reasoning = "Базовый анализ показывает необходимость комплексного подхода к решению.";
        let alternatives = ["Сбор дополнительной информации", "Консультация с экспертами", "Анализ плюсов и минусов"];
        
        // Простые правила на основе ключевых слов
        if (keywords.includes('купить') || keywords.includes('выбрать') || keywords.includes('покупка')) {
            recommendation = "изучить отзывы, сравнить цены и характеристики";
            reasoning = "При принятии решения о покупке важно учесть бюджет, качество и долгосрочную ценность.";
            alternatives = ["Изучение отзывов", "Сравнение аналогов", "Консультация продавца"];
        } else if (keywords.includes('работа') || keywords.includes('карьера') || keywords.includes('профессия')) {
            recommendation = "оценить перспективы развития и соответствие интересам";
            reasoning = "Карьерные решения требуют анализа личных целей, рынка труда и потенциала роста.";
            alternatives = ["Анализ рынка труда", "Оценка своих навыков", "Консультация с наставником"];
        } else if (keywords.includes('дом') || keywords.includes('квартира') || keywords.includes('жилье')) {
            recommendation = "учесть расположение, инфраструктуру и бюджет";
            reasoning = "Выбор жилья влияет на качество жизни, поэтому важно оценить все факторы.";
            alternatives = ["Изучение района", "Осмотр объекта", "Анализ документов"];
        } else if (keywords.includes('отпуск') || keywords.includes('путешествие') || keywords.includes('поездка')) {
            recommendation = "рассмотреть бюджет, время года и личные предпочтения";
            reasoning = "Планирование поездки требует баланса между желаниями и возможностями.";
            alternatives = ["Изучение направлений", "Планирование бюджета", "Бронирование заранее"];
        }
        
        answerElement.innerHTML = `
            <div class="ai-response">
                <div class="response-header">
                    <strong>🧠 Интеллектуальный анализ</strong>
                </div>
                <div class="response-content">
                    <p><strong>Рекомендация:</strong> На основе анализа "${question}", рекомендую ${recommendation}.</p>
                    <p><strong>Уверенность:</strong> 75%</p>
                    <p><strong>Обоснование:</strong> ${reasoning}</p>
                    <div class="response-options">
                        <strong>Дополнительные шаги:</strong>
                        <ul>
                            ${alternatives.map(alt => `<li>${alt}</li>`).join('')}
                        </ul>
                    </div>
                    <p><em>💡 Совет: Для более точного анализа можно запустить полную AI-систему с подключением к базе данных.</em></p>
                </div>
            </div>
        `;
        
        // Добавляем в историю как локальное решение
        this.addToHistory(question, {
            recommendation: recommendation,
            confidence: 0.75,
            reasoning: reasoning
        });
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
            const response = await fetch('/api/decisions/recent', { 
                signal: AbortSignal.timeout(2000) 
            });
            if (response.ok) {
                const decisions = await response.json();
                this.renderRecentDecisions(decisions);
                return;
            }
        } catch (error) {
            console.log('API недоступен, используются локальные данные');
        }
        
        // Fallback to mock database or local data
        if (window.mockDB) {
            const mockDecisions = window.mockDB.getRecentDecisions();
            this.renderRecentDecisions(mockDecisions);
        } else {
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
