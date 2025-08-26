import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDecisionStore } from '@/store/useDecisionStore';
import { useUIStore } from '@/store/useUIStore';
import { apiService } from '@/services/api';

export const useAuthInitialization = () => {
  const [loading, setLoading] = useState(true);
  const { 
    isAuthenticated, 
    isDemo, 
    token, 
    setUser, 
    logout, 
    setLoading: setAuthLoading 
  } = useAuthStore();
  const { setDecisions } = useDecisionStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setAuthLoading(true);

        // If we have a token, verify it's still valid
        if (token && !isDemo) {
          try {
            apiService.setToken(token);
            const profileResponse = await apiService.getProfile();
            setUser(profileResponse.user);

            // Load user's decision history
            try {
              const historyResponse = await apiService.getDecisionHistory();
              setDecisions(historyResponse.decisions || []);
            } catch (historyError) {
              console.warn('Failed to load decision history:', historyError);
              // Don't logout for history errors
            }

            console.log('✅ User authenticated and data loaded');
          } catch (error) {
            console.warn('Token invalid, logging out:', error);
            logout();
            addToast({
              type: 'warning',
              title: 'Сессия истекла',
              message: 'Пожалуйста, войдите в систему снова'
            });
          }
        } else if (isDemo) {
          // In demo mode, load local data
          console.log('📱 Demo mode initialized');
          addToast({
            type: 'info',
            title: 'Демо режим',
            message: 'Данные сохраняются локально'
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        addToast({
          type: 'error',
          title: 'Ошибка инициализации',
          message: 'Проверьте подключение к интернету'
        });
      } finally {
        setLoading(false);
        setAuthLoading(false);
      }
    };

    initializeAuth();
  }, [
    token, 
    isDemo, 
    setUser, 
    logout, 
    setAuthLoading, 
    setDecisions, 
    addToast
  ]);

  return { loading };
};
