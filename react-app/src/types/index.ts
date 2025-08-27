// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
  age?: number;
  personalityType?: 'introvert' | 'extrovert' | 'ambivert';
  anxietyLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  preferences?: {
    data?: boolean;
    intuition?: boolean;
    speed?: boolean;
    consultation?: boolean;
  };
}

// Decision Types
export type DecisionType = 'simple' | 'complex' | 'random';

export interface DecisionOption {
  id?: string;
  text: string;
  rating?: number;
  aiScore?: number;
  criteriaScores?: Record<string, number>;
}

export interface Decision {
  id: string;
  userId: string;
  decisionType: DecisionType;
  title: string;
  description?: string;
  options: DecisionOption[];
  chosenOption?: string;
  confidenceScore?: number;
  outcomeRating?: number;
  contextData?: Record<string, any>;
  createdAt: string;
  algorithm?: string;
  criteria?: string[];
  weights?: number[];
  scores?: number[];
  emotion?: EmotionAnalysis;
}

// Emotion AI Types
export interface EmotionAnalysis {
  emotion: 'anxiety' | 'confidence' | 'fear' | 'excitement' | 'neutral';
  confidence: number;
  scores?: Record<string, number>;
}

// ML Algorithm Types
export interface AHPWeights {
  criteria: string[];
  weights: number[];
  consistencyRatio: number;
}

export interface TOPSISResult {
  name: string;
  score: number;
  rank: number;
}

export interface ContextualBanditRecommendation {
  option: string;
  confidence: number;
  originalRating: number;
  contextFactor: number;
  expectedReward: number;
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface DecisionResponse {
  decision: Decision;
  aiRecommendation?: {
    option: string;
    confidence: number;
    reasoning: string;
  };
}

export interface HistoryResponse {
  decisions: Decision[];
  total: number;
  page: number;
  limit: number;
}

// Analytics Types
export interface DashboardData {
  totalDecisions: number;
  avgSatisfaction: number;
  typeDistribution: Record<DecisionType, number>;
  emotionTrends: Record<string, number>;
  recentDecisions: Decision[];
}

export interface UserInsight {
  type: 'pattern' | 'improvement' | 'recommendation' | 'achievement';
  title: string;
  description: string;
  icon: string;
  confidence: number;
}

// Component Props Types
export interface DecisionCardProps {
  type: DecisionType;
  title: string;
  description: string;
  icon: string;
  techBadge: string;
  onClick: () => void;
}

export interface ProgressBarProps {
  progress: number;
  animated?: boolean;
}

export interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// Store Types
export interface AppState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  decisions: Decision[];
  currentDecision: Partial<Decision> | null;
  loading: boolean;
  error: string | null;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  loading: boolean;
  error: string | null;
}

export interface DecisionState {
  decisions: Decision[];
  currentDecision: Partial<Decision> | null;
  history: Decision[];
  filters: {
    type?: DecisionType;
    dateRange?: [Date, Date];
    search?: string;
  };
  loading: boolean;
  error: string | null;
}

// Algorithm Context Types
export interface DecisionContext {
  emotion: EmotionAnalysis;
  userProfile: UserProfile;
  timeOfDay: number;
  environment?: 'mobile' | 'desktop';
  sessionData?: {
    hesitationTime?: number;
    clickPattern?: string[];
    timeSpent?: number;
  };
}

// Complex Decision Types
export interface Criteria {
  id: string;
  name: string;
  weight: number;
  description?: string;
}

export interface EvaluationMatrix {
  criteria: Criteria[];
  options: string[];
  scores: number[][];
}

// Random Decision Types
export interface WheelOption {
  id: string;
  text: string;
  color: string;
  angle: number;
}

export interface SpinResult {
  winner: string;
  rotations: number;
  finalAngle: number;
}

// Theme Types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  borderRadius: number;
  fontSize: 'small' | 'medium' | 'large';
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Navigation Types
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

// Toast/Notification Types
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  age?: number;
  personalityType?: string;
  anxietyLevel: number;
}

export interface SimpleDecisionForm {
  question: string;
  options: Array<{
    text: string;
    rating: number;
  }>;
}

export interface ComplexDecisionForm {
  question: string;
  criteria: Array<{
    name: string;
    weight: number;
  }>;
  options: string[];
  evaluationMatrix: number[][];
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: {
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
  scales?: {
    y?: {
      beginAtZero: boolean;
      min?: number;
      max?: number;
    };
  };
}

// Database Types
export interface DatabaseCategory {
  id: string;
  name: string;
  description: string;
  examples: string;
  complexity: string;
}

export interface DatabaseCriteria {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
  type: string;
}

export interface DatabaseDecision {
  id: string;
  category: string;
  scenario: string;
  alternative: string;
  criteria: Record<string, number>;
  factors: {
    anxiety: string;
    timePressure: string;
    importance: string;
    informationAvailability: string;
    experience: string;
    financialResources: string;
    socialSupport: string;
    emotionalState: string;
    selfConfidence: string;
    riskTolerance: string;
  };
  metrics: {
    overallScore: number;
    decisionTime: number;
    complexity: number;
    confidence: number;
    risk: number;
  };
  similarity?: number;
  outcome?: {
    satisfaction: number;
    stress: number;
  };
}

export interface DatabaseOutcome {
  id: string;
  decisionId: string;
  wasChosen: boolean;
  satisfaction: number;
  stress: number;
  financialImpact: string;
  emotionalImpact: string;
  timeToResult: string;
  lessons: string;
}

export interface DatabaseUserProfile {
  id: string;
  age: number;
  gender: string;
  education: string;
  maritalStatus: string;
  income: string;
  region: string;
  employment: string;
  decisionExperience: number;
  decisionStyle: string;
}

export interface DatabaseExpertEvaluation {
  id: string;
  decisionId: string;
  expertise: string;
  complexity: number;
  risks: string;
  approach: string;
  confidence: number;
}

export interface DatabaseRecommendation {
  id: string;
  category: string;
  scenario: string;
  alternative: string;
  score: number;
  criteria: Record<string, number>;
  factors: DatabaseDecision['factors'];
  metrics: DatabaseDecision['metrics'];
  outcome?: DatabaseDecision['outcome'];
}

export interface DatabaseAnalysisResult {
  title: string;
  description?: string;
  options: Array<{
    text: string;
    score: number;
    reasoning: string;
    databaseInsights?: {
      category: string;
      scenario: string;
      factors: DatabaseDecision['factors'];
      metrics: DatabaseDecision['metrics'];
    };
  }>;
  recommendations: DatabaseRecommendation[];
  expertInsights: DatabaseExpertEvaluation[];
  databaseStats: {
    similarDecisionsFound: number;
    totalRecommendations: number;
    expertInsightsAvailable: number;
  };
}

export interface DatabaseSearchResult {
  query: string;
  results: {
    decisions: DatabaseDecision[];
    categories: DatabaseCategory[];
    criteria: DatabaseCriteria[];
    users: DatabaseUserProfile[];
  };
  totalResults: number;
  searchTypes: string[];
}

export interface DatabaseStats {
  totalDecisions: number;
  totalCategories: number;
  totalCriteria: number;
  totalUsers: number;
  totalOutcomes: number;
  lastUpdated: string;
}
