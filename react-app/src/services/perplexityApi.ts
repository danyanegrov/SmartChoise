import { apiService } from './api';

export interface PerplexityResponse {
  success: boolean;
  data?: string;
  error?: string;
  model?: string;
  usage?: any;
}

export class PerplexityApiService {
  async testConnection(): Promise<PerplexityResponse> {
    try {
      const response = await fetch('/api/perplexity/test');
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getDecisionInsights(decision: string, context?: string): Promise<PerplexityResponse> {
    try {
      const response = await fetch('/api/perplexity/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision, context }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getMarketAnalysis(topic: string): Promise<PerplexityResponse> {
    try {
      const response = await fetch('/api/perplexity/market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getExpertAdvice(question: string): Promise<PerplexityResponse> {
    try {
      const response = await fetch('/api/perplexity/expert-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async customQuery(query: string, model?: string): Promise<PerplexityResponse> {
    try {
      const response = await fetch('/api/perplexity/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, model }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const perplexityApiService = new PerplexityApiService();
