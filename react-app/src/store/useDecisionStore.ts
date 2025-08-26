import { create } from 'zustand';
import { Decision, DecisionState, DecisionType } from '@/types';

interface DecisionActions {
  setDecisions: (decisions: Decision[]) => void;
  addDecision: (decision: Decision) => void;
  updateDecision: (id: string, updates: Partial<Decision>) => void;
  deleteDecision: (id: string) => void;
  setCurrentDecision: (decision: Partial<Decision> | null) => void;
  setFilters: (filters: DecisionState['filters']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  getDecisionsByType: (type: DecisionType) => Decision[];
  getRecentDecisions: (limit?: number) => Decision[];
  searchDecisions: (query: string) => Decision[];
}

export const useDecisionStore = create<DecisionState & DecisionActions>()(
  (set, get) => ({
    // State
    decisions: [],
    currentDecision: null,
    history: [],
    filters: {},
    loading: false,
    error: null,

    // Actions
    setDecisions: (decisions: Decision[]) => {
      set({ 
        decisions,
        history: decisions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      });
    },

    addDecision: (decision: Decision) => {
      const { decisions } = get();
      const newDecisions = [decision, ...decisions];
      set({ 
        decisions: newDecisions,
        history: newDecisions
      });
    },

    updateDecision: (id: string, updates: Partial<Decision>) => {
      const { decisions } = get();
      const updatedDecisions = decisions.map(decision =>
        decision.id === id ? { ...decision, ...updates } : decision
      );
      set({ 
        decisions: updatedDecisions,
        history: updatedDecisions
      });
    },

    deleteDecision: (id: string) => {
      const { decisions } = get();
      const filteredDecisions = decisions.filter(decision => decision.id !== id);
      set({ 
        decisions: filteredDecisions,
        history: filteredDecisions
      });
    },

    setCurrentDecision: (decision: Partial<Decision> | null) => {
      set({ currentDecision: decision });
    },

    setFilters: (filters: DecisionState['filters']) => {
      set({ filters });
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },

    getDecisionsByType: (type: DecisionType) => {
      const { decisions } = get();
      return decisions.filter(decision => decision.decisionType === type);
    },

    getRecentDecisions: (limit = 10) => {
      const { history } = get();
      return history.slice(0, limit);
    },

    searchDecisions: (query: string) => {
      const { decisions } = get();
      const lowercaseQuery = query.toLowerCase();
      
      return decisions.filter(decision =>
        decision.title.toLowerCase().includes(lowercaseQuery) ||
        decision.description?.toLowerCase().includes(lowercaseQuery) ||
        decision.chosenOption?.toLowerCase().includes(lowercaseQuery)
      );
    }
  })
);
