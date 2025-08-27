import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseService {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data');
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Load CSV data with caching
   */
  async loadCSVData(filename) {
    const cacheKey = `csv_${filename}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const filePath = path.join(this.dataPath, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = this.parseCSV(fileContent);
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      logger.info(`Loaded CSV data from ${filename}: ${data.length} records`);
      return data;
    } catch (error) {
      logger.error(`Error loading CSV data from ${filename}:`, error);
      throw new Error(`Failed to load database: ${error.message}`);
    }
  }

  /**
   * Parse CSV content to array of objects
   */
  parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  }

  /**
   * Parse CSV line handling quoted values
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Get all decision categories
   */
  async getCategories() {
    const categories = await this.loadCSVData('decision_categories.csv');
    return categories.map(cat => ({
      id: cat.ID,
      name: cat.Название,
      description: cat.Описание,
      examples: cat.Примеры,
      complexity: cat.Сложность
    }));
  }

  /**
   * Get all decision criteria
   */
  async getCriteria() {
    const criteria = await this.loadCSVData('decision_criteria.csv');
    return criteria.map(crit => ({
      id: crit.ID,
      name: crit.Название,
      description: crit.Описание,
      category: crit.Категория,
      weight: parseFloat(crit.Вес) || 1,
      type: crit.Тип
    }));
  }

  /**
   * Get decisions by category
   */
  async getDecisionsByCategory(category, limit = 50) {
    const decisions = await this.loadCSVData('decision_database_main.csv');
    const filtered = decisions
      .filter(d => d.Категория === category)
      .slice(0, limit);
    
    return filtered.map(d => ({
      id: d.ID,
      category: d.Категория,
      scenario: d.Сценарий,
      alternative: d.Альтернатива,
      criteria: this.extractCriteriaScores(d),
      factors: this.extractDecisionFactors(d),
      metrics: this.extractMetrics(d)
    }));
  }

  /**
   * Get decisions by scenario
   */
  async getDecisionsByScenario(scenario, limit = 20) {
    const decisions = await this.loadCSVData('decision_database_main.csv');
    const filtered = decisions
      .filter(d => d.Сценарий.toLowerCase().includes(scenario.toLowerCase()))
      .slice(0, limit);
    
    return filtered.map(d => ({
      id: d.ID,
      category: d.Категория,
      scenario: d.Сценарий,
      alternative: d.Альтернатива,
      criteria: this.extractCriteriaScores(d),
      factors: this.extractDecisionFactors(d),
      metrics: this.extractMetrics(d)
    }));
  }

  /**
   * Get similar decisions based on criteria
   */
  async getSimilarDecisions(criteria, limit = 10) {
    const decisions = await this.loadCSVData('decision_database_main.csv');
    const scored = decisions.map(d => ({
      decision: d,
      similarity: this.calculateSimilarity(criteria, d)
    }));
    
    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => ({
        id: item.decision.ID,
        category: item.decision.Категория,
        scenario: item.decision.Сценарий,
        alternative: item.decision.Альтернатива,
        similarity: item.similarity,
        criteria: this.extractCriteriaScores(item.decision),
        factors: this.extractDecisionFactors(item.decision),
        metrics: this.extractMetrics(item.decision)
      }));
  }

  /**
   * Get expert evaluations for decisions
   */
  async getExpertEvaluations(decisionId) {
    const evaluations = await this.loadCSVData('expert_evaluations.csv');
    return evaluations
      .filter(e => e.ID_решения === decisionId)
      .map(e => ({
        id: e.ID,
        decisionId: e.ID_решения,
        expertise: e.Область_экспертизы,
        complexity: parseFloat(e.Экспертная_оценка_сложности) || 5,
        risks: e.Ключевые_риски,
        approach: e.Рекомендуемый_подход,
        confidence: parseFloat(e.Уверенность_в_оценке) || 0.8
      }));
  }

  /**
   * Get decision outcomes
   */
  async getDecisionOutcomes(decisionId) {
    const outcomes = await this.loadCSVData('decision_outcomes.csv');
    const outcome = outcomes.find(o => o.ID_решения === decisionId);
    
    if (!outcome) return null;
    
    return {
      id: outcome.ID,
      decisionId: outcome.ID_решения,
      wasChosen: outcome.Было_выбрано === 'Да',
      satisfaction: parseFloat(outcome.Удовлетворенность_результатом) || 5,
      stress: parseFloat(outcome.Стресс_при_принятии_решения) || 5,
      financialImpact: outcome.Финансовые_последствия,
      emotionalImpact: outcome.Эмоциональные_последствия,
      timeToResult: outcome.Время_до_результата,
      lessons: outcome.Полученные_уроки
    };
  }

  /**
   * Get user profiles
   */
  async getUserProfiles(limit = 50) {
    const profiles = await this.loadCSVData('users_profiles.csv');
    return profiles
      .slice(0, limit)
      .map(p => ({
        id: p.ID_пользователя,
        age: parseInt(p.Возраст) || 0,
        gender: p.Пол,
        education: p.Образование,
        maritalStatus: p.Семейное_положение,
        income: p.Доход,
        region: p.Регион,
        employment: p.Тип_занятости,
        decisionExperience: parseFloat(p.Опыт_принятия_решений) || 5,
        decisionStyle: p.Предпочитаемый_стиль_решений
      }));
  }

  /**
   * Extract criteria scores from decision data
   */
  extractCriteriaScores(decision) {
    const criteria = {};
    Object.keys(decision).forEach(key => {
      if (key.startsWith('Критерий_') && decision[key]) {
        const criteriaName = key.replace('Критерий_', '');
        criteria[criteriaName] = parseFloat(decision[key]) || 0;
      }
    });
    return criteria;
  }

  /**
   * Extract decision factors from decision data
   */
  extractDecisionFactors(decision) {
    return {
      anxiety: decision.Тревожность,
      timePressure: decision.Временное_давление,
      importance: decision.Важность_решения,
      informationAvailability: decision.Доступность_информации,
      experience: decision.Опыт_в_области,
      financialResources: decision.Финансовые_ресурсы,
      socialSupport: decision.Социальная_поддержка,
      emotionalState: decision.Эмоциональное_состояние,
      selfConfidence: decision.Уверенность_в_себе,
      riskTolerance: decision.Склонность_к_риску
    };
  }

  /**
   * Extract metrics from decision data
   */
  extractMetrics(decision) {
    return {
      overallScore: parseFloat(decision.Общая_оценка) || 0,
      decisionTime: parseFloat(decision.Время_на_решение) || 0,
      complexity: parseFloat(decision.Сложность) || 5,
      confidence: parseFloat(decision.Уверенность) || 5,
      risk: parseFloat(decision.Риск) || 5
    };
  }

  /**
   * Calculate similarity between two decisions based on criteria
   */
  calculateSimilarity(criteria1, decision2) {
    const criteria2 = this.extractCriteriaScores(decision2);
    const commonCriteria = Object.keys(criteria1).filter(k => criteria2[k] !== undefined);
    
    if (commonCriteria.length === 0) return 0;
    
    let similarity = 0;
    commonCriteria.forEach(criterion => {
      const diff = Math.abs(criteria1[criterion] - criteria2[criterion]);
      const maxScore = 10;
      similarity += (maxScore - diff) / maxScore;
    });
    
    return similarity / commonCriteria.length;
  }

  /**
   * Get recommendations based on user profile and context
   */
  async getRecommendations(userProfile, context, limit = 5) {
    const decisions = await this.loadCSVData('decision_database_main.csv');
    const outcomes = await this.loadCSVData('decision_outcomes.csv');
    
    // Create lookup for outcomes
    const outcomesMap = new Map();
    outcomes.forEach(o => outcomesMap.set(o.ID_решения, o));
    
    const scored = decisions.map(d => {
      const outcome = outcomesMap.get(d.ID_решения);
      const score = this.calculateRecommendationScore(d, outcome, userProfile, context);
      
      return {
        decision: d,
        score,
        outcome
      };
    });
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        id: item.decision.ID,
        category: item.decision.Категория,
        scenario: item.decision.Сценарий,
        alternative: item.decision.Альтернатива,
        score: item.score,
        criteria: this.extractCriteriaScores(item.decision),
        factors: this.extractDecisionFactors(item.decision),
        metrics: this.extractMetrics(item.decision),
        outcome: item.outcome ? {
          satisfaction: parseFloat(item.outcome.Удовлетворенность_результатом) || 5,
          stress: parseFloat(item.outcome.Стресс_при_принятии_решения) || 5
        } : null
      }));
  }

  /**
   * Calculate recommendation score based on user profile and context
   */
  calculateRecommendationScore(decision, outcome, userProfile, context) {
    let score = 0;
    
    // Base score from overall rating
    score += parseFloat(decision.Общая_оценка) || 5;
    
    // Factor in outcome satisfaction if available
    if (outcome) {
      score += parseFloat(outcome.Удовлетворенность_результатом) || 5;
    }
    
    // Adjust for user anxiety level
    if (userProfile?.anxietyLevel) {
      const anxiety = userProfile.anxietyLevel;
      const decisionAnxiety = decision.Тревожность;
      
      if (anxiety > 7 && decisionAnxiety === 'Низкая') {
        score += 2; // Prefer low anxiety decisions for anxious users
      } else if (anxiety < 4 && decisionAnxiety === 'Высокая') {
        score += 1; // Confident users can handle high anxiety decisions
      }
    }
    
    // Adjust for decision style preference
    if (userProfile?.decisionStyle) {
      const style = userProfile.decisionStyle;
      const complexity = parseFloat(decision.Сложность) || 5;
      
      if (style === 'Аналитический' && complexity > 7) {
        score += 1; // Analytical users prefer complex decisions
      } else if (style === 'Интуитивный' && complexity < 5) {
        score += 1; // Intuitive users prefer simpler decisions
      }
    }
    
    // Context adjustments
    if (context?.timePressure === 'high' && decision.Временное_давление === 'Нет') {
      score += 1; // Prefer quick decisions under time pressure
    }
    
    return score;
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const stats = await this.loadCSVData('database_statistics.json');
      return stats[0] || {};
    } catch (error) {
      // Fallback to manual calculation
      const decisions = await this.loadCSVData('decision_database_main.csv');
      const categories = await this.loadCSVData('decision_categories.csv');
      const criteria = await this.loadCSVData('decision_criteria.csv');
      const users = await this.loadCSVData('users_profiles.csv');
      const outcomes = await this.loadCSVData('decision_outcomes.csv');
      
      return {
        totalDecisions: decisions.length,
        totalCategories: categories.length,
        totalCriteria: criteria.length,
        totalUsers: users.length,
        totalOutcomes: outcomes.length,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Database cache cleared');
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
