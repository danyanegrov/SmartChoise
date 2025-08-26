import { 
  EmotionAnalysis, 
  UserProfile, 
  DecisionOption,
  ContextualBanditRecommendation,
  AHPWeights,
  TOPSISResult
} from '@/types';

// Emotion AI Algorithm
export class EmotionAI {
  private keywords = {
    anxiety: ['переживаю', 'тревожно', 'боюсь', 'не знаю', 'сложно', 'волнуюсь', 'переживание', 'стресс'],
    confidence: ['уверен', 'точно', 'определенно', 'знаю', 'ясно', 'четко', 'однозначно'],
    fear: ['страшно', 'опасно', 'рискованно', 'боюсь', 'пугает', 'угроза'],
    excitement: ['интересно', 'круто', 'супер', 'отлично', 'здорово', 'восторг', 'радует'],
    neutral: ['нужно', 'следует', 'возможно', 'может быть', 'думаю', 'считаю']
  };

  analyze(text: string): EmotionAnalysis {
    const lowerText = text.toLowerCase();
    const emotions: Record<string, number> = {};
    
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
      emotions[a] > emotions[b] ? a : b, 'neutral'
    ) as EmotionAnalysis['emotion'];
    
    // Calculate confidence based on keyword density and text length
    const totalWords = text.split(' ').length;
    const emotionWords = emotions[dominantEmotion];
    const confidence = Math.min(0.9, Math.max(0.1, emotionWords / Math.max(1, totalWords) * 3));

    return {
      emotion: dominantEmotion,
      confidence,
      scores: emotions
    };
  }
}

// AHP (Analytic Hierarchy Process) Algorithm
export class AHPAlgorithm {
  calculateWeights(rawWeights: number[]): AHPWeights {
    const n = rawWeights.length;
    const matrix = this.buildPairwiseMatrix(rawWeights);
    const weights = this.calculateEigenVector(matrix);
    const normalizedWeights = this.normalizeWeights(weights);
    const consistencyRatio = this.calculateConsistency(matrix);
    
    return {
      criteria: rawWeights.map((_, i) => `Критерий ${i + 1}`),
      weights: normalizedWeights,
      consistencyRatio
    };
  }

  private buildPairwiseMatrix(rawWeights: number[]): number[][] {
    const n = rawWeights.length;
    const matrix = Array(n).fill(0).map(() => Array(n).fill(1));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          matrix[i][j] = rawWeights[i] / rawWeights[j];
        }
      }
    }
    
    return matrix;
  }

  private calculateEigenVector(matrix: number[][]): number[] {
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

  private normalizeWeights(weights: number[]): number[] {
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map(w => w / sum);
  }

  private calculateConsistency(matrix: number[][]): number {
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

// TOPSIS Algorithm
export class TOPSISAlgorithm {
  calculate(decisionMatrix: number[][], weights: number[]): TOPSISResult[] {
    const normalizedMatrix = this.normalizeMatrix(decisionMatrix);
    const weightedMatrix = this.applyWeights(normalizedMatrix, weights);
    const idealSolutions = this.findIdealSolutions(weightedMatrix);
    const distances = this.calculateDistances(weightedMatrix, idealSolutions);
    const scores = this.calculateTOPSISScores(distances);
    
    return this.rankAlternatives(scores);
  }

  private normalizeMatrix(matrix: number[][]): number[][] {
    const m = matrix.length;
    const n = matrix[0].length;
    const normalized = Array(m).fill(0).map(() => Array(n));
    
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

  private applyWeights(matrix: number[][], weights: number[]): number[][] {
    return matrix.map(row => 
      row.map((value, j) => value * weights[j])
    );
  }

  private findIdealSolutions(matrix: number[][]): { positive: number[]; negative: number[] } {
    const n = matrix[0].length;
    const positiveIdeal = Array(n);
    const negativeIdeal = Array(n);
    
    for (let j = 0; j < n; j++) {
      const column = matrix.map(row => row[j]);
      positiveIdeal[j] = Math.max(...column);
      negativeIdeal[j] = Math.min(...column);
    }
    
    return { positive: positiveIdeal, negative: negativeIdeal };
  }

  private calculateDistances(matrix: number[][], idealSolutions: { positive: number[]; negative: number[] }): Array<{ positive: number; negative: number }> {
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

  private calculateTOPSISScores(distances: Array<{ positive: number; negative: number }>): number[] {
    return distances.map(dist => 
      dist.negative / (dist.positive + dist.negative)
    );
  }

  private rankAlternatives(scores: number[]): TOPSISResult[] {
    return scores
      .map((score, index) => ({ 
        name: `Вариант ${index + 1}`, 
        score, 
        rank: 0 
      }))
      .sort((a, b) => b.score - a.score)
      .map((result, index) => ({ ...result, rank: index + 1 }));
  }
}

// Contextual Bandit Algorithm
export class ContextualBandit {
  private arms: Map<string, { successes: number; attempts: number }> = new Map();
  private alpha = 1; // Exploration parameter

  async recommend(
    options: DecisionOption[], 
    context: {
      emotion: EmotionAnalysis;
      userProfile?: UserProfile;
      timeOfDay: number;
    }
  ): Promise<ContextualBanditRecommendation> {
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
      
      const finalScore = (adjustedReward + preferenceBonus) * (option.rating || 3);
      
      return {
        option: option.text,
        score: finalScore,
        confidence: Math.min(95, Math.max(60, adjustedReward * 100)),
        originalRating: option.rating || 3,
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

  private getArmKey(option: string, context: any): string {
    return `${option}_${context.emotion.emotion}_${context.timeOfDay > 12 ? 'pm' : 'am'}`;
  }

  private getContextMultiplier(option: DecisionOption, context: any): number {
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

  private calculatePreferenceBonus(option: DecisionOption, context: any): number {
    if (!context.userProfile?.preferences) return 0;
    
    let bonus = 0;
    const prefs = context.userProfile.preferences;
    
    if (prefs.speed && (option.rating || 0) >= 4) bonus += 0.1;
    if (prefs.data && context.emotion.confidence > 0.7) bonus += 0.1;
    if (prefs.intuition && context.emotion.emotion === 'confidence') bonus += 0.15;
    
    return bonus;
  }

  private betaSample(alpha: number, beta: number): number {
    // Simplified beta distribution sampling
    const gamma1 = this.gammaFunction(alpha, 1);
    const gamma2 = this.gammaFunction(beta, 1);
    return gamma1 / (gamma1 + gamma2);
  }

  private gammaFunction(shape: number, scale: number): number {
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

  private normalRandom(): number {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private updateArmStats(recommendation: ContextualBanditRecommendation, context: any, satisfaction: number): void {
    const armKey = this.getArmKey(recommendation.option, context);
    const armStats = this.arms.get(armKey) || { successes: 0, attempts: 0 };
    
    armStats.attempts += 1;
    if (satisfaction > 0.6) { // Consider satisfaction > 60% as success
      armStats.successes += 1;
    }
    
    this.arms.set(armKey, armStats);
  }
}

// Export algorithm instances
export const emotionAI = new EmotionAI();
export const ahpAlgorithm = new AHPAlgorithm();
export const topsisAlgorithm = new TOPSISAlgorithm();
export const contextualBandit = new ContextualBandit();
