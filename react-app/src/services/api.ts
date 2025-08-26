import { 
  User, 
  UserProfile, 
  Decision, 
  DecisionOption,
  AuthResponse, 
  DecisionResponse,
  HistoryResponse,
  DashboardData,
  UserInsight,
  EmotionAnalysis,
  LoginForm,
  RegisterForm
} from '@/types';

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    this.token = localStorage.getItem('authToken');
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: any
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        if (response.status === 401) {
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

  // Authentication
  async register(userData: RegisterForm): Promise<AuthResponse> {
    const result = await this.makeRequest<AuthResponse>('/auth/register', 'POST', userData);
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  async login(credentials: LoginForm): Promise<AuthResponse> {
    const result = await this.makeRequest<AuthResponse>('/auth/login', 'POST', credentials);
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  async getProfile(): Promise<{ user: UserProfile }> {
    return await this.makeRequest<{ user: UserProfile }>('/auth/me');
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    return await this.makeRequest<{ user: UserProfile }>('/users/profile', 'PUT', profileData);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Decisions
  async createSimpleDecision(decisionData: {
    title: string;
    description?: string;
    options: DecisionOption[];
    emotionContext?: EmotionAnalysis;
  }): Promise<DecisionResponse> {
    return await this.makeRequest<DecisionResponse>('/decisions/simple', 'POST', {
      title: decisionData.title,
      description: decisionData.description,
      options: decisionData.options.map(opt => ({
        text: opt.text,
        rating: opt.rating || 3
      })),
      emotionContext: decisionData.emotionContext
    });
  }

  async createComplexDecision(decisionData: {
    title: string;
    description?: string;
    criteria: Array<{ name: string; weight: number }>;
    options: string[];
    evaluationMatrix: number[][];
  }): Promise<DecisionResponse> {
    return await this.makeRequest<DecisionResponse>('/decisions/complex', 'POST', decisionData);
  }

  async createRandomDecision(decisionData: {
    options: string[];
  }): Promise<DecisionResponse> {
    return await this.makeRequest<DecisionResponse>('/decisions/random', 'POST', {
      title: 'Случайный выбор',
      description: 'Случайный выбор из вариантов',
      options: decisionData.options.map(opt => ({ text: opt }))
    });
  }

  async getDecisionHistory(limit = 50): Promise<HistoryResponse> {
    return await this.makeRequest<HistoryResponse>(`/decisions/history?limit=${limit}`);
  }

  async getDecisionById(id: string): Promise<{ decision: Decision }> {
    return await this.makeRequest<{ decision: Decision }>(`/decisions/${id}`);
  }

  async updateDecision(id: string, updates: Partial<Decision>): Promise<{ decision: Decision }> {
    return await this.makeRequest<{ decision: Decision }>(`/decisions/${id}`, 'PUT', updates);
  }

  async deleteDecision(id: string): Promise<void> {
    await this.makeRequest<void>(`/decisions/${id}`, 'DELETE');
  }

  // ML Algorithms
  async getEmotionDecision(decisionData: {
    text: string;
    options: DecisionOption[];
    userProfile?: UserProfile;
  }): Promise<any> {
    return await this.makeRequest('/ml/emotion-decision', 'POST', decisionData);
  }

  async getContextualRecommendation(decisionData: {
    options: DecisionOption[];
    context: any;
    userProfile?: UserProfile;
  }): Promise<any> {
    return await this.makeRequest('/ml/contextual-recommendation', 'POST', decisionData);
  }

  async getBehavioralAnalysis(sessionData: any): Promise<any> {
    return await this.makeRequest('/ml/behavioral-analysis', 'POST', sessionData);
  }

  // Analytics
  async getDashboardData(): Promise<DashboardData> {
    return await this.makeRequest<DashboardData>('/analytics/dashboard');
  }

  async getInsights(): Promise<{ insights: UserInsight[] }> {
    return await this.makeRequest<{ insights: UserInsight[] }>('/analytics/insights');
  }

  async getTrends(): Promise<any> {
    return await this.makeRequest('/analytics/trends');
  }

  // User Behavior
  async trackBehavior(behaviorData: {
    actionType: string;
    pageUrl?: string;
    elementClicked?: string;
    timeSpent?: number;
    hesitationTime?: number;
    metadata?: any;
  }): Promise<void> {
    await this.makeRequest('/users/behavior', 'POST', behaviorData);
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch('http://localhost:3001/health');
      return await response.json();
    } catch (error) {
      throw new Error('Backend недоступен');
    }
  }

  // Utilities
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }
}

export const apiService = new ApiService();
export default apiService;
