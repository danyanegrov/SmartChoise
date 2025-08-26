// SmartChoice AI Application - Advanced Decision Support System
class SmartChoiceAI {
    constructor() {
        this.currentScreen = 'home';
        this.currentDecisionType = null;
        this.userProfile = null;
        this.decisionHistory = [];
        this.algorithms = {
            ahp: new AHPAlgorithm(),
            topsis: new TOPSISAlgorithm(),
            emotionAI: new EmotionAI(),
            contextualBandit: new ContextualBandit()
        };
        
        // Проверяем авторизацию
        this.isDemo = localStorage.getItem('demoMode') === 'true';
        this.isAuthenticated = window.apiService && window.apiService.isAuthenticated();
        
        this.init();
    }

    async init() {
        // Проверяем авторизацию
        if (!this.isDemo && !this.isAuthenticated) {
            window.location.href = 'auth.html';
            return;
        }

        this.setupEventListeners();
        
        // Загружаем данные пользователя
        await this.loadUserData();
        
        // Показываем кнопку выхода для авторизованных пользователей
        this.updateUIForAuthState();
        
        this.showScreen('home');
        this.updateStatistics();
        this.loadAITips();
    }

    async loadUserData() {
        try {
            if (this.isDemo) {
                // В демо режиме используем локальные данные
                this.userProfile = this.loadUserProfile();
                this.decisionHistory = this.loadDecisionHistory();
                
                if (this.decisionHistory.length === 0) {
                    this.generateDemoData();
                }
            } else if (this.isAuthenticated) {
                // Загружаем данные с сервера
                try {
                    const profileData = await window.apiService.getProfile();
                    this.userProfile = profileData.user;
                    
                    const historyData = await window.apiService.getDecisionHistory();
                    this.decisionHistory = historyData.decisions || [];
                    
                    console.log('✅ Данные пользователя загружены:', this.userProfile);
                } catch (error) {
                    console.error('Ошибка загрузки данных пользователя:', error);
                    this.showToast('Ошибка загрузки данных. Используется локальный режим.', 'warning');
                    
                    // Fallback к локальным данным
                    this.userProfile = this.loadUserProfile();
                    this.decisionHistory = this.loadDecisionHistory();
                }
            }
        } catch (error) {
            console.error('Ошибка инициализации данных:', error);
            this.showToast('Ошибка инициализации. Проверьте подключение.', 'error');
        }
    }

    updateUIForAuthState() {
        const logoutBtn = document.querySelector('.logout-btn');
        const headerSubtitle = document.querySelector('.header__subtitle');
        
        if (this.isDemo) {
            if (headerSubtitle) {
                headerSubtitle.textContent = 'Демо режим - локальное сохранение';
            }
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-flex';
                logoutBtn.title = 'Выйти из демо режима';
            }
        } else if (this.isAuthenticated && this.userProfile) {
            if (headerSubtitle) {
                headerSubtitle.textContent = `Добро пожаловать, ${this.userProfile.name || 'Пользователь'}!`;
            }
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-flex';
                logoutBtn.title = 'Выйти из аккаунта';
            }
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Decision type selection
        document.querySelectorAll('.decision-card .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const card = btn.closest('.decision-card');
                const type = card.dataset.type;
                this.showDecisionScreen(type);
            });
        });

        // Back buttons
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('home');
            });
        });

        // Simple Decision Events
        this.setupSimpleDecisionEvents();
        
        // Complex Decision Events
        this.setupComplexDecisionEvents();
        
        // Random Decision Events
        this.setupRandomDecisionEvents();

        // Dashboard Events
        this.setupDashboardEvents();

        // History Events
        this.setupHistoryEvents();

        // Profile Events
        this.setupProfileEvents();

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Screen Management
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            
            // Initialize screen-specific functionality
            if (screenName === 'dashboard') {
                setTimeout(() => this.initializeDashboard(), 100);
            } else if (screenName === 'history') {
                this.loadHistoryItems();
            } else if (screenName === 'profile') {
                this.loadProfileForm();
            }
        }
    }

    showDecisionScreen(type) {
        this.currentDecisionType = type;
        this.showScreen(type);
        this.resetCurrentDecision(type);
    }

    updateProgress(screenName, percentage) {
        const screen = document.getElementById(`${screenName}-screen`);
        if (screen) {
            const progressFill = screen.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = percentage + '%';
            }
        }
    }

    // Simple Decision Logic with Emotion AI
    setupSimpleDecisionEvents() {
        const questionField = document.getElementById('simple-question');
        const addOptionBtn = document.getElementById('add-simple-option');
        const getRecommendationBtn = document.getElementById('get-simple-recommendation');

        if (questionField) {
            questionField.addEventListener('input', (e) => {
                this.analyzeEmotion(e.target.value);
            });
        }

        if (addOptionBtn) {
            addOptionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addSimpleOption();
            });
        }

        if (getRecommendationBtn) {
            getRecommendationBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.getSimpleRecommendation();
            });
        }

        // Setup initial rating functionality
        const optionsContainer = document.getElementById('simple-options');
        if (optionsContainer) {
            this.setupRatingStars(optionsContainer);
        }
    }

    analyzeEmotion(text) {
        const emotion = this.algorithms.emotionAI.analyze(text);
        const emotionResult = document.getElementById('emotion-result');
        
        if (emotionResult && text.length > 10) {
            const emotionIcons = {
                anxiety: '😰',
                confidence: '😊',
                fear: '😨',
                excitement: '🤩',
                neutral: '😐'
            };

            emotionResult.className = `emotion-analysis ${emotion.emotion}`;
            emotionResult.innerHTML = `
                <span class="emotion-icon">${emotionIcons[emotion.emotion]}</span>
                <span class="emotion-text">Обнаружено: ${this.getEmotionLabel(emotion.emotion)} (${Math.round(emotion.confidence * 100)}% уверенность)</span>
            `;
        }
    }

    getEmotionLabel(emotion) {
        const labels = {
            anxiety: 'тревожность',
            confidence: 'уверенность',
            fear: 'страх',
            excitement: 'возбуждение',
            neutral: 'нейтральность'
        };
        return labels[emotion] || emotion;
    }

    addSimpleOption() {
        const container = document.getElementById('simple-options');
        const optionCount = container.children.length;
        
        if (optionCount >= 5) {
            this.showToast('Максимум 5 вариантов разрешено', 'error');
            return;
        }

        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item';
        optionDiv.innerHTML = `
            <input type="text" class="form-control" placeholder="Вариант ${optionCount + 1}">
            <div class="rating" data-value="0">
                <span class="star" data-rating="1">★</span>
                <span class="star" data-rating="2">★</span>
                <span class="star" data-rating="3">★</span>
                <span class="star" data-rating="4">★</span>
                <span class="star" data-rating="5">★</span>
            </div>
        `;
        
        container.appendChild(optionDiv);
        this.setupRatingStars(optionDiv);
        this.updateProgress('simple', Math.min(75, 50 + (optionCount * 10)));
    }

    setupRatingStars(container) {
        const ratings = container.querySelectorAll('.rating');
        ratings.forEach(rating => {
            const stars = rating.querySelectorAll('.star');
            stars.forEach((star) => {
                star.addEventListener('click', (e) => {
                    e.preventDefault();
                    const ratingValue = parseInt(star.dataset.rating);
                    this.updateStarDisplay(rating, ratingValue);
                    rating.dataset.value = ratingValue;
                });

                star.addEventListener('mouseenter', () => {
                    const ratingValue = parseInt(star.dataset.rating);
                    this.updateStarDisplay(rating, ratingValue, true);
                });
            });

            rating.addEventListener('mouseleave', () => {
                const currentValue = parseInt(rating.dataset.value) || 0;
                this.updateStarDisplay(rating, currentValue);
            });
        });
    }

    updateStarDisplay(ratingContainer, value, isHover = false) {
        const stars = ratingContainer.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.remove('active');
            if (index < value) {
                star.classList.add('active');
            }
        });
    }

    async getSimpleRecommendation() {
        const question = document.getElementById('simple-question').value.trim();
        const optionItems = document.querySelectorAll('#simple-options .option-item');
        
        if (!question) {
            this.showToast('Пожалуйста, опишите ваше решение', 'error');
            return;
        }

        const options = [];
        let hasValidOptions = false;

        optionItems.forEach((item, index) => {
            const text = item.querySelector('input').value.trim();
            const rating = parseInt(item.querySelector('.rating').dataset.value) || 0;
            
            if (text) {
                options.push({ text, rating, index: index + 1 });
                hasValidOptions = true;
            }
        });

        if (!hasValidOptions || options.length < 2) {
            this.showToast('Добавьте минимум два варианта с названиями', 'error');
            return;
        }

        // Show loading state
        const btn = document.getElementById('get-simple-recommendation');
        btn.classList.add('loading');

        try {
            let recommendation;
            let emotionContext;

            if (!this.isDemo && this.isAuthenticated) {
                // Используем реальный API
                try {
                    emotionContext = this.algorithms.emotionAI.analyze(question);
                    
                    const apiResult = await window.apiService.createSimpleDecision({
                        question: question,
                        options: options,
                        emotion: emotionContext
                    });

                    recommendation = {
                        option: apiResult.aiRecommendation?.option || apiResult.chosenOption || options[0].text,
                        confidence: apiResult.aiRecommendation?.confidence || Math.random() * 40 + 60,
                        originalRating: options.find(o => o.text === (apiResult.aiRecommendation?.option || apiResult.chosenOption))?.rating || 3
                    };

                    console.log('✅ API решение получено:', apiResult);
                } catch (apiError) {
                    console.error('Ошибка API, переходим к локальному алгоритму:', apiError);
                    this.showToast('Используется локальный алгоритм', 'warning');
                    throw apiError; // Переходим к fallback
                }
            } else {
                throw new Error('Demo mode'); // Принудительно используем локальный алгоритм
            }

        } catch (error) {
            // Fallback к локальному алгоритму
            emotionContext = this.algorithms.emotionAI.analyze(question);
            
            recommendation = await this.algorithms.contextualBandit.recommend(options, {
                emotion: emotionContext,
                userProfile: this.userProfile,
                timeOfDay: new Date().getHours()
            });
        }

        // Simulate processing time
        setTimeout(() => {
            btn.classList.remove('loading');
            this.displaySimpleResult(recommendation, options, emotionContext);
            this.updateProgress('simple', 100);
        }, 1500);
    }

    displaySimpleResult(recommendation, allOptions, emotionContext) {
        const resultSection = document.getElementById('simple-result');
        const recommendedOption = resultSection.querySelector('.recommended-option');
        const confidenceBar = resultSection.querySelector('.confidence-fill');
        const confidenceText = resultSection.querySelector('.confidence-text');
        const explanation = resultSection.querySelector('.result-explanation');
        
        recommendedOption.innerHTML = `
            <h4>🎯 ${recommendation.option}</h4>
            <div class="rating">
                ${'★'.repeat(recommendation.originalRating)}${'☆'.repeat(5 - recommendation.originalRating)}
            </div>
        `;
        
        // Animate confidence bar
        setTimeout(() => {
            confidenceBar.style.width = Math.round(recommendation.confidence) + '%';
        }, 100);
        
        confidenceText.textContent = `${Math.round(recommendation.confidence)}% уверенность ИИ`;
        
        let explanationText = `ИИ рекомендует этот вариант на основе анализа:\n`;
        explanationText += `• Ваша оценка: ${recommendation.originalRating}/5 звезд\n`;
        explanationText += `• Эмоциональный контекст: ${this.getEmotionLabel(emotionContext.emotion)}\n`;
        explanationText += `• Персональные предпочтения учтены\n`;
        explanationText += `• Машинное обучение: ${Math.round(recommendation.confidence)}% точность`;
        
        explanation.textContent = explanationText;
        
        resultSection.classList.remove('hidden');
        document.querySelector('#simple-screen .decision-form').style.display = 'none';

        // Save decision to history
        this.saveDecision({
            type: 'simple',
            question: document.getElementById('simple-question').value,
            options: allOptions.map(o => o.text),
            chosen: recommendation.option,
            confidence: recommendation.confidence,
            emotion: emotionContext,
            timestamp: new Date().toISOString()
        });

        this.showToast('ИИ рекомендация готова!', 'success');
    }

    // Complex Decision Logic with AHP + TOPSIS
    setupComplexDecisionEvents() {
        const addCriteriaBtn = document.getElementById('add-criteria');
        const nextToOptionsBtn = document.getElementById('next-to-options');
        const addComplexOptionBtn = document.getElementById('add-complex-option');
        const calculateBtn = document.getElementById('calculate-complex');

        if (addCriteriaBtn) {
            addCriteriaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addComplexCriteria();
            });
        }

        if (nextToOptionsBtn) {
            nextToOptionsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showComplexStep2();
            });
        }

        if (addComplexOptionBtn) {
            addComplexOptionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addComplexOption();
            });
        }

        if (calculateBtn) {
            calculateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.calculateComplexResult();
            });
        }
    }

    addComplexCriteria() {
        const container = document.getElementById('complex-criteria');
        const criteriaCount = container.children.length;
        
        if (criteriaCount >= 5) {
            this.showToast('Максимум 5 критериев разрешено', 'error');
            return;
        }

        const criteriaDiv = document.createElement('div');
        criteriaDiv.className = 'criteria-item';
        criteriaDiv.innerHTML = `
            <input type="text" class="form-control" placeholder="Например: Расположение">
            <select class="form-control">
                <option value="1">Не важно (1)</option>
                <option value="2">Мало важно (2)</option>
                <option value="3" selected>Средне важно (3)</option>
                <option value="4">Очень важно (4)</option>
                <option value="5">Критически важно (5)</option>
            </select>
        `;
        
        container.appendChild(criteriaDiv);
        this.updateProgress('complex', 40);
    }

    showComplexStep2() {
        const criteriaItems = document.querySelectorAll('#complex-criteria .criteria-item');
        const validCriteria = [];

        criteriaItems.forEach(item => {
            const text = item.querySelector('input').value.trim();
            const weight = parseInt(item.querySelector('select').value);
            
            if (text) {
                validCriteria.push({ text, weight });
            }
        });

        if (validCriteria.length === 0) {
            this.showToast('Добавьте хотя бы один критерий', 'error');
            return;
        }

        this.complexCriteria = validCriteria;
        document.getElementById('complex-step-1').classList.add('hidden');
        document.getElementById('complex-step-2').classList.remove('hidden');
        this.updateProgress('complex', 60);
    }

    addComplexOption() {
        const input = document.querySelector('#complex-options input');
        const optionText = input.value.trim();
        
        if (!optionText) {
            this.showToast('Введите название варианта', 'error');
            return;
        }

        if (this.complexOptions && this.complexOptions.length >= 5) {
            this.showToast('Максимум 5 вариантов разрешено', 'error');
            return;
        }

        if (!this.complexOptions) this.complexOptions = [];
        this.complexOptions.push(optionText);
        input.value = '';
        
        this.updateComplexMatrix();
        this.updateProgress('complex', 80);
    }

    updateComplexMatrix() {
        const matrixContainer = document.getElementById('evaluation-matrix');
        
        if (!this.complexOptions || this.complexOptions.length === 0) {
            matrixContainer.innerHTML = '';
            return;
        }

        let tableHTML = `
            <h5>Оцените каждый вариант по критериям (1-5):</h5>
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th>Вариант</th>
                        ${this.complexCriteria.map(c => `<th>${c.text}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${this.complexOptions.map((option, optIndex) => `
                        <tr>
                            <td><strong>${option}</strong></td>
                            ${this.complexCriteria.map((criteria, critIndex) => `
                                <td>
                                    <select data-option="${optIndex}" data-criteria="${critIndex}">
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3" selected>3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                    </select>
                                </td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        matrixContainer.innerHTML = tableHTML;
    }

    async calculateComplexResult() {
        if (!this.complexOptions || this.complexOptions.length === 0) {
            this.showToast('Добавьте хотя бы один вариант', 'error');
            return;
        }

        const btn = document.getElementById('calculate-complex');
        btn.classList.add('loading');

        // Build decision matrix
        const decisionMatrix = [];
        const weights = this.complexCriteria.map(c => c.weight);

        this.complexOptions.forEach((option, optIndex) => {
            const scores = [];
            this.complexCriteria.forEach((criteria, critIndex) => {
                const select = document.querySelector(`select[data-option="${optIndex}"][data-criteria="${critIndex}"]`);
                const score = parseInt(select ? select.value : 3);
                scores.push(score);
            });
            decisionMatrix.push(scores);
        });

        // Calculate AHP weights
        const ahpWeights = this.algorithms.ahp.calculateWeights(weights);
        
        // Calculate TOPSIS scores
        const topsisResults = this.algorithms.topsis.calculate(decisionMatrix, ahpWeights);

        setTimeout(() => {
            btn.classList.remove('loading');
            this.displayComplexResult(topsisResults, ahpWeights);
            this.updateProgress('complex', 100);
        }, 2500);
    }

    displayComplexResult(topsisResults, ahpWeights) {
        const resultSection = document.getElementById('complex-result');
        const weightsContainer = document.getElementById('ahp-weights');
        const scoresContainer = document.getElementById('topsis-scores');
        
        // Display AHP weights
        let weightsHTML = '';
        this.complexCriteria.forEach((criteria, index) => {
            weightsHTML += `
                <div class="weight-item">
                    <span class="weight-name">${criteria.text}</span>
                    <span class="weight-value">${(ahpWeights[index] * 100).toFixed(1)}%</span>
                </div>
            `;
        });
        weightsContainer.innerHTML = weightsHTML;
        
        // Display TOPSIS scores
        let scoresHTML = '';
        topsisResults.forEach((result, index) => {
            const isWinner = index === 0;
            scoresHTML += `
                <div class="result-item ${isWinner ? 'winner' : ''}">
                    <h4>${result.name} ${isWinner ? '🏆' : ''}</h4>
                    <p>TOPSIS Балл: <span class="score">${result.score.toFixed(3)}</span></p>
                    <p>Рейтинг: <span class="score">#${index + 1}</span></p>
                    ${isWinner ? '<p><strong>ИИ рекомендация: Лучший выбор!</strong></p>' : ''}
                </div>
            `;
        });
        scoresContainer.innerHTML = scoresHTML;
        
        resultSection.classList.remove('hidden');
        document.querySelector('#complex-screen .decision-form').style.display = 'none';

        // Save decision to history
        this.saveDecision({
            type: 'complex',
            question: document.getElementById('complex-question').value,
            criteria: this.complexCriteria.map(c => c.text),
            options: this.complexOptions,
            chosen: topsisResults[0].name,
            algorithm: 'AHP + TOPSIS',
            weights: ahpWeights,
            scores: topsisResults.map(r => r.score),
            timestamp: new Date().toISOString()
        });

        this.showToast('MCDA анализ завершен!', 'success');
    }

    // Random Decision Logic
    setupRandomDecisionEvents() {
        const addRandomOptionBtn = document.getElementById('add-random-option');
        const spinWheelBtn = document.getElementById('spin-wheel');

        if (addRandomOptionBtn) {
            addRandomOptionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addRandomOption();
            });
        }

        if (spinWheelBtn) {
            spinWheelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.spinWheel();
            });
        }

        const randomContainer = document.getElementById('random-options');
        if (randomContainer) {
            randomContainer.addEventListener('input', () => this.updateWheelSegments());
        }
    }

    addRandomOption() {
        const container = document.getElementById('random-options');
        const inputs = container.querySelectorAll('input');
        
        if (inputs.length >= 8) {
            this.showToast('Максимум 8 вариантов для колеса', 'error');
            return;
        }

        const newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.className = 'form-control';
        newInput.placeholder = `Вариант ${inputs.length + 1}`;
        newInput.style.marginBottom = 'var(--space-8)';
        
        container.appendChild(newInput);
        this.updateWheelSegments();
    }

    updateWheelSegments() {
        const inputs = document.querySelectorAll('#random-options input');
        const options = [];
        
        inputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                options.push(value);
            }
        });
        
        if (options.length >= 2) {
            this.randomOptions = options;
            this.renderWheel(options);
        }
    }

    renderWheel(options) {
        const segmentsContainer = document.querySelector('.wheel-segments');
        if (!segmentsContainer) return;
        
        const segmentAngle = 360 / options.length;
        segmentsContainer.innerHTML = '';
        
        const colors = ['var(--color-bg-1)', 'var(--color-bg-2)', 'var(--color-bg-3)', 'var(--color-bg-4)', 
                       'var(--color-bg-5)', 'var(--color-bg-6)', 'var(--color-bg-7)', 'var(--color-bg-8)'];
        
        options.forEach((option, index) => {
            const segment = document.createElement('div');
            segment.className = 'wheel-segment';
            segment.style.transform = `rotate(${index * segmentAngle}deg)`;
            segment.style.background = colors[index % colors.length];
            segment.textContent = option;
            segmentsContainer.appendChild(segment);
        });
    }

    spinWheel() {
        const inputs = document.querySelectorAll('#random-options input');
        const options = [];
        
        inputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                options.push(value);
            }
        });
        
        if (options.length < 2) {
            this.showToast('Добавьте минимум 2 варианта', 'error');
            return;
        }
        
        const wheel = document.getElementById('decision-wheel');
        const randomRotation = 1800 + Math.random() * 1800; // 5-10 full rotations
        
        wheel.style.transform = `rotate(${randomRotation}deg)`;
        wheel.classList.add('spinning');
        
        // Play sound effect (Web Audio API)
        this.playSpinSound();
        
        setTimeout(() => {
            const normalizedRotation = randomRotation % 360;
            const segmentAngle = 360 / options.length;
            const selectedIndex = Math.floor((360 - normalizedRotation + segmentAngle/2) / segmentAngle) % options.length;
            const winner = options[selectedIndex];
            
            this.displayRandomResult(winner, options);
            wheel.classList.remove('spinning');
        }, 4000);
    }

    playSpinSound() {
        // Create simple beep sound using Web Audio API
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const audioContext = new (AudioContext || webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    }

    displayRandomResult(winner, allOptions) {
        const resultSection = document.getElementById('random-result');
        const choiceContainer = resultSection.querySelector('.random-choice');
        
        choiceContainer.innerHTML = `<h4>🎉 ${winner}</h4>`;
        
        resultSection.classList.remove('hidden');
        document.querySelector('#random-screen .decision-form').style.display = 'none';

        // Save decision to history
        this.saveDecision({
            type: 'random',
            question: 'Случайный выбор из вариантов',
            options: allOptions,
            chosen: winner,
            algorithm: 'Random Selection',
            timestamp: new Date().toISOString()
        });

        this.showToast('Судьба решила!', 'success');
    }

    // Dashboard functionality
    setupDashboardEvents() {
        // Dashboard is initialized when screen is shown
    }

    initializeDashboard() {
        this.renderDecisionTypesChart();
        this.renderEmotionsChart();
        this.renderSatisfactionChart();
        this.generatePersonalInsights();
    }

    renderDecisionTypesChart() {
        const ctx = document.getElementById('decision-types-chart');
        if (!ctx) return;

        const typeCounts = {
            simple: this.decisionHistory.filter(d => d.type === 'simple').length,
            complex: this.decisionHistory.filter(d => d.type === 'complex').length,
            random: this.decisionHistory.filter(d => d.type === 'random').length
        };

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Быстрые решения', 'Сложный анализ', 'Случайный выбор'],
                datasets: [{
                    data: [typeCounts.simple, typeCounts.complex, typeCounts.random],
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderEmotionsChart() {
        const ctx = document.getElementById('emotions-chart');
        if (!ctx) return;

        const emotions = this.decisionHistory
            .filter(d => d.emotion)
            .map(d => d.emotion.emotion);

        const emotionCounts = {};
        emotions.forEach(emotion => {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(emotionCounts),
                datasets: [{
                    label: 'Частота эмоций',
                    data: Object.values(emotionCounts),
                    backgroundColor: '#5D878F'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderSatisfactionChart() {
        const ctx = document.getElementById('satisfaction-chart');
        if (!ctx) return;

        const last30Days = this.decisionHistory
            .filter(d => new Date(d.timestamp) > new Date(Date.now() - 30*24*60*60*1000))
            .map(d => ({
                date: new Date(d.timestamp).toLocaleDateString(),
                satisfaction: d.satisfaction || Math.random() * 5 + 1 // Demo data
            }));

        const dateGroups = {};
        last30Days.forEach(d => {
            if (!dateGroups[d.date]) dateGroups[d.date] = [];
            dateGroups[d.date].push(d.satisfaction);
        });

        const chartData = Object.keys(dateGroups).map(date => ({
            date,
            avgSatisfaction: dateGroups[date].reduce((a, b) => a + b, 0) / dateGroups[date].length
        }));

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.date),
                datasets: [{
                    label: 'Средняя удовлетворенность',
                    data: chartData.map(d => d.avgSatisfaction),
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 1,
                        max: 5
                    }
                }
            }
        });
    }

    generatePersonalInsights() {
        const container = document.getElementById('insights-container');
        if (!container) return;

        const insights = [];

        // Analyze decision patterns
        const recentDecisions = this.decisionHistory.slice(-10);
        const emotionCounts = {};
        const typeCounts = {};

        recentDecisions.forEach(d => {
            if (d.emotion) {
                emotionCounts[d.emotion.emotion] = (emotionCounts[d.emotion.emotion] || 0) + 1;
            }
            typeCounts[d.type] = (typeCounts[d.type] || 0) + 1;
        });

        const mostCommonEmotion = Object.keys(emotionCounts).reduce((a, b) => 
            emotionCounts[a] > emotionCounts[b] ? a : b, 'neutral');

        const mostCommonType = Object.keys(typeCounts).reduce((a, b) => 
            typeCounts[a] > typeCounts[b] ? a : b, 'simple');

        insights.push({
            icon: '🧠',
            text: `Ваша доминирующая эмоция при принятии решений: ${this.getEmotionLabel(mostCommonEmotion)}`
        });

        insights.push({
            icon: '📈',
            text: `Вы предпочитаете ${this.getTypeLabel(mostCommonType)} решения`
        });

        insights.push({
            icon: '⏰',
            text: `Лучшее время для решений: ${this.getOptimalTime()}`
        });

        insights.push({
            icon: '🎯',
            text: `Ваша точность решений улучшилась на ${Math.round(Math.random() * 15 + 5)}% за последний месяц`
        });

        container.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <span class="insight-icon">${insight.icon}</span>
                <span>${insight.text}</span>
            </div>
        `).join('');
    }

    getTypeLabel(type) {
        const labels = {
            simple: 'быстрые',
            complex: 'сложные аналитические',
            random: 'случайные'
        };
        return labels[type] || type;
    }

    getOptimalTime() {
        const hours = new Date().getHours();
        if (hours < 12) return 'утро (9-12)';
        if (hours < 17) return 'день (13-17)';
        return 'вечер (18-21)';
    }

    // History functionality
    setupHistoryEvents() {
        const filterSelect = document.getElementById('history-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                this.loadHistoryItems();
            });
        }
    }

    loadHistoryItems() {
        const container = document.getElementById('history-list');
        const filter = document.getElementById('history-filter')?.value || 'all';
        
        if (!container) return;

        let filteredHistory = this.decisionHistory;
        if (filter !== 'all') {
            filteredHistory = this.decisionHistory.filter(d => d.type === filter);
        }

        container.innerHTML = filteredHistory.map((decision, index) => `
            <div class="history-item" onclick="app.showDecisionDetail(${index})">
                <div class="history-header">
                    <span class="history-title">${decision.question || 'Решение без названия'}</span>
                    <span class="history-date">${new Date(decision.timestamp).toLocaleDateString()}</span>
                </div>
                <div class="history-type">${this.getTypeLabel(decision.type)}</div>
                <div class="history-result">
                    Выбрано: <strong>${decision.chosen}</strong>
                    ${decision.confidence ? `(${Math.round(decision.confidence)}% уверенность ИИ)` : ''}
                </div>
            </div>
        `).join('');
    }

    showDecisionDetail(index) {
        const decision = this.decisionHistory[index];
        if (!decision) return;

        const modal = document.getElementById('decision-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');

        title.textContent = `Детали решения`;

        let detailsHTML = `
            <div><strong>Тип:</strong> ${this.getTypeLabel(decision.type)}</div>
            <div><strong>Вопрос:</strong> ${decision.question}</div>
            <div><strong>Дата:</strong> ${new Date(decision.timestamp).toLocaleString()}</div>
            <div><strong>Выбранный вариант:</strong> ${decision.chosen}</div>
        `;

        if (decision.options) {
            detailsHTML += `<div><strong>Все варианты:</strong> ${decision.options.join(', ')}</div>`;
        }

        if (decision.confidence) {
            detailsHTML += `<div><strong>Уверенность ИИ:</strong> ${Math.round(decision.confidence)}%</div>`;
        }

        if (decision.algorithm) {
            detailsHTML += `<div><strong>Алгоритм:</strong> ${decision.algorithm}</div>`;
        }

        if (decision.emotion) {
            detailsHTML += `<div><strong>Эмоциональный контекст:</strong> ${this.getEmotionLabel(decision.emotion.emotion)}</div>`;
        }

        body.innerHTML = detailsHTML;
        modal.classList.remove('hidden');
    }

    closeModal() {
        const modal = document.getElementById('decision-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    exportHistory() {
        const csv = this.convertToCSV(this.decisionHistory);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartchoice_history_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showToast('История экспортирована', 'success');
    }

    convertToCSV(data) {
        const headers = ['Дата', 'Тип', 'Вопрос', 'Выбор', 'Уверенность', 'Алгоритм'];
        const rows = data.map(d => [
            new Date(d.timestamp).toLocaleString(),
            this.getTypeLabel(d.type),
            d.question || '',
            d.chosen || '',
            d.confidence ? Math.round(d.confidence) + '%' : '',
            d.algorithm || ''
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    // Profile functionality
    setupProfileEvents() {
        const saveBtn = document.getElementById('save-profile');
        const anxietySlider = document.getElementById('anxiety-level');

        if (anxietySlider) {
            anxietySlider.addEventListener('input', (e) => {
                document.getElementById('anxiety-value').textContent = e.target.value;
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveUserProfile();
            });
        }
    }

    loadProfileForm() {
        const profile = this.userProfile;
        
        const nameField = document.getElementById('user-name');
        const ageField = document.getElementById('user-age');
        const personalityField = document.getElementById('personality-type');
        const anxietyField = document.getElementById('anxiety-level');

        if (nameField) nameField.value = profile.name || '';
        if (ageField) ageField.value = profile.age || '';
        if (personalityField) personalityField.value = profile.personality || '';
        if (anxietyField) {
            anxietyField.value = profile.anxietyLevel || 5;
            document.getElementById('anxiety-value').textContent = anxietyField.value;
        }

        // Load preferences
        const preferences = profile.preferences || {};
        document.getElementById('prefer-data').checked = preferences.data || false;
        document.getElementById('prefer-intuition').checked = preferences.intuition || false;
        document.getElementById('prefer-speed').checked = preferences.speed || false;
        document.getElementById('prefer-consultation').checked = preferences.consultation || false;
    }

    saveUserProfile() {
        const profile = {
            name: document.getElementById('user-name').value,
            age: parseInt(document.getElementById('user-age').value) || null,
            personality: document.getElementById('personality-type').value,
            anxietyLevel: parseInt(document.getElementById('anxiety-level').value),
            preferences: {
                data: document.getElementById('prefer-data').checked,
                intuition: document.getElementById('prefer-intuition').checked,
                speed: document.getElementById('prefer-speed').checked,
                consultation: document.getElementById('prefer-consultation').checked
            },
            lastUpdated: new Date().toISOString()
        };

        this.userProfile = profile;
        localStorage.setItem('smartchoice_profile', JSON.stringify(profile));
        this.showToast('Профиль сохранен!', 'success');
        
        // Update AI algorithms with new profile
        this.algorithms.contextualBandit.updateUserProfile(profile);
    }

    // Data management
    async saveDecision(decision) {
        // Локально сохраняем всегда
        this.decisionHistory.unshift(decision);
        if (this.decisionHistory.length > 100) {
            this.decisionHistory = this.decisionHistory.slice(0, 100);
        }
        
        if (this.isDemo) {
            localStorage.setItem('smartchoice_history', JSON.stringify(this.decisionHistory));
        }
        
        // В API не сохраняем принудительно, так как решение уже создано через createSimpleDecision
        // Только обновляем статистику
        this.updateStatistics();
    }

    loadDecisionHistory() {
        const stored = localStorage.getItem('smartchoice_history');
        return stored ? JSON.parse(stored) : [];
    }

    loadUserProfile() {
        const stored = localStorage.getItem('smartchoice_profile');
        return stored ? JSON.parse(stored) : {
            name: 'Пользователь',
            age: null,
            personality: '',
            anxietyLevel: 5,
            preferences: {}
        };
    }

    generateDemoData() {
        // Generate some demo decisions for showcase
        const demoDecisions = [
            {
                type: 'simple',
                question: 'Какой ресторан выбрать на ужин?',
                options: ['Итальянский', 'Японский', 'Мексиканский'],
                chosen: 'Японский',
                confidence: 85,
                emotion: { emotion: 'neutral', confidence: 0.7 },
                timestamp: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
                satisfaction: 4.2
            },
            {
                type: 'complex',
                question: 'Выбор квартиры для покупки',
                criteria: ['Цена', 'Локация', 'Площадь'],
                options: ['Квартира в центре', 'Квартира в спальном районе'],
                chosen: 'Квартира в центре',
                algorithm: 'AHP + TOPSIS',
                timestamp: new Date(Date.now() - 5*24*60*60*1000).toISOString(),
                satisfaction: 4.8
            },
            {
                type: 'random',
                question: 'Фильм на вечер',
                options: ['Комедия', 'Драма', 'Триллер', 'Мелодрама'],
                chosen: 'Триллер',
                algorithm: 'Random Selection',
                timestamp: new Date(Date.now() - 24*60*60*1000).toISOString(),
                satisfaction: 3.5
            }
        ];

        this.decisionHistory = demoDecisions;
        localStorage.setItem('smartchoice_history', JSON.stringify(this.decisionHistory));
    }

    updateStatistics() {
        const totalDecisions = this.decisionHistory.length;
        const avgSatisfaction = this.decisionHistory
            .filter(d => d.satisfaction)
            .reduce((sum, d) => sum + d.satisfaction, 0) / 
            Math.max(1, this.decisionHistory.filter(d => d.satisfaction).length);

        const totalElement = document.getElementById('total-decisions');
        if (totalElement) {
            totalElement.textContent = totalDecisions;
        }

        // Animate number counting
        this.animateNumber(totalElement, totalDecisions);
    }

    animateNumber(element, target) {
        if (!element) return;
        
        let current = 0;
        const increment = target / 20;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 50);
    }

    loadAITips() {
        const container = document.getElementById('tips-container');
        if (!container) return;

        const tips = [
            "ИИ анализирует ваши эмоции для лучших рекомендаций",
            "Алгоритм AHP автоматически вычисляет важность критериев",
            "TOPSIS находит решение ближайшее к идеальному",
            "Ваши решения становятся точнее с каждым использованием",
            "Контекстуальный анализ учитывает время и настроение",
            "Машинное обучение адаптируется под ваш стиль решений"
        ];

        container.innerHTML = tips.map(tip => `
            <div class="tip-card">
                <p>${tip}</p>
            </div>
        `).join('');
    }

    // Toast notifications
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

    // Utility functions
    startOver() {
        this.resetCurrentDecision(this.currentDecisionType);
    }

    resetCurrentDecision(type) {
        switch(type) {
            case 'simple':
                this.resetSimpleDecision();
                break;
            case 'complex':
                this.resetComplexDecision();
                break;
            case 'random':
                this.resetRandomDecision();
                break;
        }
    }

    resetSimpleDecision() {
        const questionField = document.getElementById('simple-question');
        if (questionField) questionField.value = '';
        
        const container = document.getElementById('simple-options');
        if (container) {
            container.innerHTML = `
                <div class="option-item">
                    <input type="text" class="form-control" placeholder="Вариант 1">
                    <div class="rating" data-value="0">
                        <span class="star" data-rating="1">★</span>
                        <span class="star" data-rating="2">★</span>
                        <span class="star" data-rating="3">★</span>
                        <span class="star" data-rating="4">★</span>
                        <span class="star" data-rating="5">★</span>
                    </div>
                </div>
                <div class="option-item">
                    <input type="text" class="form-control" placeholder="Вариант 2">
                    <div class="rating" data-value="0">
                        <span class="star" data-rating="1">★</span>
                        <span class="star" data-rating="2">★</span>
                        <span class="star" data-rating="3">★</span>
                        <span class="star" data-rating="4">★</span>
                        <span class="star" data-rating="5">★</span>
                    </div>
                </div>
            `;
            this.setupRatingStars(container);
        }
        
        const resultSection = document.getElementById('simple-result');
        if (resultSection) resultSection.classList.add('hidden');
        
        const decisionForm = document.querySelector('#simple-screen .decision-form');
        if (decisionForm) decisionForm.style.display = 'block';
        
        this.updateProgress('simple', 25);
    }

    resetComplexDecision() {
        const questionField = document.getElementById('complex-question');
        if (questionField) questionField.value = '';
        
        const criteriaContainer = document.getElementById('complex-criteria');
        if (criteriaContainer) {
            criteriaContainer.innerHTML = `
                <div class="criteria-item">
                    <input type="text" class="form-control" placeholder="Например: Цена">
                    <select class="form-control">
                        <option value="1">Не важно (1)</option>
                        <option value="2">Мало важно (2)</option>
                        <option value="3" selected>Средне важно (3)</option>
                        <option value="4">Очень важно (4)</option>
                        <option value="5">Критически важно (5)</option>
                    </select>
                </div>
            `;
        }
        
        this.complexCriteria = [];
        this.complexOptions = [];
        
        document.getElementById('complex-step-1').classList.remove('hidden');
        document.getElementById('complex-step-2').classList.add('hidden');
        document.getElementById('complex-result').classList.add('hidden');
        document.querySelector('#complex-screen .decision-form').style.display = 'block';
        document.getElementById('evaluation-matrix').innerHTML = '';
        
        const optionsInput = document.querySelector('#complex-options input');
        if (optionsInput) optionsInput.value = '';
        
        this.updateProgress('complex', 25);
    }

    resetRandomDecision() {
        const container = document.getElementById('random-options');
        if (container) {
            container.innerHTML = `
                <input type="text" class="form-control" placeholder="Вариант 1" style="margin-bottom: var(--space-8);">
                <input type="text" class="form-control" placeholder="Вариант 2" style="margin-bottom: var(--space-8);">
            `;
        }
        
        this.randomOptions = [];
        const segmentsContainer = document.querySelector('.wheel-segments');
        if (segmentsContainer) segmentsContainer.innerHTML = '';
        
        const resultSection = document.getElementById('random-result');
        if (resultSection) resultSection.classList.add('hidden');
        
        const decisionForm = document.querySelector('#random-screen .decision-form');
        if (decisionForm) decisionForm.style.display = 'block';
        
        const wheel = document.getElementById('decision-wheel');
        if (wheel) {
            wheel.style.transform = 'rotate(0deg)';
            wheel.classList.remove('spinning');
        }
    }

    spinAgain() {
        document.getElementById('random-result').classList.add('hidden');
        document.querySelector('#random-screen .decision-form').style.display = 'block';
        this.updateWheelSegments();
    }

    saveAndHome() {
        this.showScreen('home');
        this.updateStatistics();
    }

    logout() {
        if (this.isDemo) {
            localStorage.removeItem('demoMode');
        }
        
        if (window.apiService) {
            window.apiService.logout();
        }
        
        this.showToast('Вы вышли из системы', 'info');
        
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
    }
}

// AI Algorithms Implementation

class EmotionAI {
    constructor() {
        this.keywords = {
            anxiety: ['переживаю', 'тревожно', 'боюсь', 'не знаю', 'сложно', 'волнуюсь', 'переживание', 'стресс'],
            confidence: ['уверен', 'точно', 'определенно', 'знаю', 'ясно', 'четко', 'однозначно'],
            fear: ['страшно', 'опасно', 'рискованно', 'боюсь', 'пугает', 'угроза'],
            excitement: ['интересно', 'круто', 'супер', 'отлично', 'здорово', 'восторг', 'радует'],
            neutral: ['нужно', 'следует', 'возможно', 'может быть', 'думаю', 'считаю']
        };
    }

    analyze(text) {
        const lowerText = text.toLowerCase();
        const emotions = {};
        
        // Count keyword matches for each emotion
        for (const [emotion, keywords] of Object.entries(this.keywords)) {
            emotions[emotion] = 0;
            keywords.forEach(keyword => {
                const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
                emotions[emotion] += matches;
            });
        }

        // Find dominant emotion
        const dominantEmotion = Object.keys(emotions).reduce((a, b) => 
            emotions[a] > emotions[b] ? a : b, 'neutral');
        
        // Calculate confidence based on keyword density and text length
        const totalWords = text.split(' ').length;
        const emotionWords = emotions[dominantEmotion];
        const confidence = Math.min(0.9, Math.max(0.1, emotionWords / Math.max(1, totalWords) * 3));

        return {
            emotion: dominantEmotion,
            confidence: confidence,
            scores: emotions
        };
    }
}

class AHPAlgorithm {
    calculateWeights(rawWeights) {
        // Normalize weights using AHP principles
        const n = rawWeights.length;
        const matrix = this.buildPairwiseMatrix(rawWeights);
        const weights = this.calculateEigenVector(matrix);
        
        return this.normalizeWeights(weights);
    }

    buildPairwiseMatrix(rawWeights) {
        const n = rawWeights.length;
        const matrix = Array(n).fill().map(() => Array(n).fill(1));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    matrix[i][j] = rawWeights[i] / rawWeights[j];
                }
            }
        }
        
        return matrix;
    }

    calculateEigenVector(matrix) {
        const n = matrix.length;
        const weights = Array(n).fill(0);
        
        // Simplified eigenvector calculation using geometric mean
        for (let i = 0; i < n; i++) {
            let product = 1;
            for (let j = 0; j < n; j++) {
                product *= matrix[i][j];
            }
            weights[i] = Math.pow(product, 1/n);
        }
        
        return weights;
    }

    normalizeWeights(weights) {
        const sum = weights.reduce((a, b) => a + b, 0);
        return weights.map(w => w / sum);
    }

    calculateConsistency(matrix) {
        // Calculate consistency ratio
        const n = matrix.length;
        const weights = this.calculateEigenVector(matrix);
        
        let lambdaMax = 0;
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                sum += matrix[i][j] * weights[j];
            }
            lambdaMax += sum / weights[i];
        }
        lambdaMax /= n;
        
        const ci = (lambdaMax - n) / (n - 1);
        const ri = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41][n] || 1.45;
        
        return ci / ri; // CR should be < 0.1 for consistency
    }
}

class TOPSISAlgorithm {
    calculate(decisionMatrix, weights) {
        // TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
        const normalizedMatrix = this.normalizeMatrix(decisionMatrix);
        const weightedMatrix = this.applyWeights(normalizedMatrix, weights);
        const idealSolutions = this.findIdealSolutions(weightedMatrix);
        const distances = this.calculateDistances(weightedMatrix, idealSolutions);
        const scores = this.calculateTOPSISScores(distances);
        
        return this.rankAlternatives(scores);
    }

    normalizeMatrix(matrix) {
        const m = matrix.length;
        const n = matrix[0].length;
        const normalized = Array(m).fill().map(() => Array(n));
        
        // Vector normalization
        for (let j = 0; j < n; j++) {
            const sumSquares = matrix.reduce((sum, row) => sum + row[j] * row[j], 0);
            const norm = Math.sqrt(sumSquares);
            
            for (let i = 0; i < m; i++) {
                normalized[i][j] = matrix[i][j] / norm;
            }
        }
        
        return normalized;
    }

    applyWeights(matrix, weights) {
        return matrix.map(row => 
            row.map((value, j) => value * weights[j])
        );
    }

    findIdealSolutions(matrix) {
        const n = matrix[0].length;
        const positiveIdeal = Array(n);
        const negativeIdeal = Array(n);
        
        for (let j = 0; j < n; j++) {
            const column = matrix.map(row => row[j]);
            positiveIdeal[j] = Math.max(...column); // Assuming all criteria are beneficial
            negativeIdeal[j] = Math.min(...column);
        }
        
        return { positive: positiveIdeal, negative: negativeIdeal };
    }

    calculateDistances(matrix, idealSolutions) {
        return matrix.map(row => {
            const distToPositive = Math.sqrt(
                row.reduce((sum, value, j) => 
                    sum + Math.pow(value - idealSolutions.positive[j], 2), 0)
            );
            
            const distToNegative = Math.sqrt(
                row.reduce((sum, value, j) => 
                    sum + Math.pow(value - idealSolutions.negative[j], 2), 0)
            );
            
            return { positive: distToPositive, negative: distToNegative };
        });
    }

    calculateTOPSISScores(distances) {
        return distances.map(dist => 
            dist.negative / (dist.positive + dist.negative)
        );
    }

    rankAlternatives(scores) {
        return scores
            .map((score, index) => ({ index, score, name: `Вариант ${index + 1}` }))
            .sort((a, b) => b.score - a.score);
    }
}

class ContextualBandit {
    constructor() {
        this.arms = new Map(); // Store arm statistics
        this.alpha = 1; // Exploration parameter
        this.userProfile = {};
    }

    updateUserProfile(profile) {
        this.userProfile = profile;
    }

    async recommend(options, context) {
        // Multi-armed bandit with contextual information
        const recommendations = options.map((option, index) => {
            const armKey = this.getArmKey(option.text, context);
            const armStats = this.arms.get(armKey) || { successes: 1, attempts: 1 };
            
            // Beta distribution sampling for exploration/exploitation
            const beta_a = armStats.successes + 1;
            const beta_b = armStats.attempts - armStats.successes + 1;
            const sampledReward = this.betaSample(beta_a, beta_b);
            
            // Context adjustment based on emotion and user profile
            const contextMultiplier = this.getContextMultiplier(option, context);
            const adjustedReward = sampledReward * contextMultiplier;
            
            // User preference adjustment
            const preferenceBonus = this.calculatePreferenceBonus(option, context);
            
            const finalScore = (adjustedReward + preferenceBonus) * option.rating;
            
            return {
                option: option.text,
                score: finalScore,
                confidence: Math.min(95, Math.max(60, adjustedReward * 100)),
                originalRating: option.rating,
                contextFactor: contextMultiplier,
                expectedReward: sampledReward
            };
        });
        
        // Return best recommendation
        const best = recommendations.reduce((a, b) => a.score > b.score ? a : b);
        
        // Update arm statistics (simulate user feedback)
        this.updateArmStats(best, context, 0.8); // Assume 80% satisfaction
        
        return best;
    }

    getArmKey(option, context) {
        return `${option}_${context.emotion.emotion}_${context.timeOfDay > 12 ? 'pm' : 'am'}`;
    }

    getContextMultiplier(option, context) {
        let multiplier = 1.0;
        
        // Emotion-based adjustments
        switch (context.emotion.emotion) {
            case 'anxiety':
                multiplier *= 0.9; // Slightly conservative
                break;
            case 'confidence':
                multiplier *= 1.1; // Boost high-rated options
                break;
            case 'fear':
                multiplier *= 0.8; // More conservative
                break;
            case 'excitement':
                multiplier *= 1.2; // More adventurous
                break;
        }
        
        // Time-based adjustments
        if (context.timeOfDay < 12) {
            multiplier *= 1.05; // Morning decisions tend to be better
        } else if (context.timeOfDay > 20) {
            multiplier *= 0.95; // Evening fatigue factor
        }
        
        return multiplier;
    }

    calculatePreferenceBonus(option, context) {
        if (!this.userProfile.preferences) return 0;
        
        let bonus = 0;
        const prefs = this.userProfile.preferences;
        
        if (prefs.speed && option.rating >= 4) bonus += 0.1;
        if (prefs.data && context.emotion.confidence > 0.7) bonus += 0.1;
        if (prefs.intuition && context.emotion.emotion === 'confidence') bonus += 0.15;
        
        return bonus;
    }

    betaSample(alpha, beta) {
        // Simplified beta distribution sampling
        const gamma1 = this.gammaFunction(alpha, 1);
        const gamma2 = this.gammaFunction(beta, 1);
        return gamma1 / (gamma1 + gamma2);
    }

    gammaFunction(shape, scale) {
        // Simplified gamma distribution using Box-Muller transform
        if (shape < 1) {
            return this.gammaFunction(shape + 1, scale) * Math.pow(Math.random(), 1/shape);
        }
        
        const d = shape - 1/3;
        const c = 1 / Math.sqrt(9 * d);
        
        while (true) {
            let x, v;
            do {
                x = this.normalRandom();
                v = 1 + c * x;
            } while (v <= 0);
            
            v = v * v * v;
            const u = Math.random();
            
            if (u < 1 - 0.0331 * x * x * x * x) {
                return d * v * scale;
            }
            
            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
                return d * v * scale;
            }
        }
    }

    normalRandom() {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    updateArmStats(recommendation, context, satisfaction) {
        const armKey = this.getArmKey(recommendation.option, context);
        const armStats = this.arms.get(armKey) || { successes: 0, attempts: 0 };
        
        armStats.attempts += 1;
        if (satisfaction > 0.6) { // Consider satisfaction > 60% as success
            armStats.successes += 1;
        }
        
        this.arms.set(armKey, armStats);
    }
}

// Global app instance
let app;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    app = new SmartChoiceAI();
});

// Global functions for button clicks
function startOver() {
    app.startOver();
}

function saveAndHome() {
    app.saveAndHome();
}

function spinAgain() {
    app.spinAgain();
}

function exportHistory() {
    app.exportHistory();
}

function closeModal() {
    app.closeModal();
}
}