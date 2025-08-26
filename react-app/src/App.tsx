import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

// Components
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import LoadingScreen from '@/components/common/LoadingScreen';
import ToastContainer from '@/components/common/ToastContainer';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Pages
import HomePage from '@/components/pages/HomePage';
import AuthPage from '@/components/pages/AuthPage';
import SimpleDecisionPage from '@/components/pages/SimpleDecisionPage';
import ComplexDecisionPage from '@/components/pages/ComplexDecisionPage';
import RandomDecisionPage from '@/components/pages/RandomDecisionPage';
import DashboardPage from '@/components/pages/DashboardPage';
import HistoryPage from '@/components/pages/HistoryPage';
import ProfilePage from '@/components/pages/ProfilePage';

// Hooks and Stores
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useAuthInitialization } from '@/hooks/useAuthInitialization';

// Services
import { apiService } from '@/services/api';

function App() {
  const { isAuthenticated, isDemo } = useAuthStore();
  const { theme, sidebarOpen } = useUIStore();
  const { loading } = useAuthInitialization();

  // Create MUI theme based on our design system
  const muiTheme = createTheme({
    palette: {
      mode: theme.mode === 'dark' ? 'dark' : 'light',
      primary: {
        main: theme.primaryColor,
      },
      secondary: {
        main: theme.secondaryColor,
      },
      background: {
        default: theme.mode === 'dark' ? '#1f2121' : '#fcfcf9',
        paper: theme.mode === 'dark' ? '#262828' : '#fffffd',
      },
      text: {
        primary: theme.mode === 'dark' ? '#f5f5f5' : '#13343b',
        secondary: theme.mode === 'dark' ? '#a7a9a9' : '#626c71',
      },
    },
    shape: {
      borderRadius: theme.borderRadius,
    },
    typography: {
      fontFamily: '"FKGroteskNeue", "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: theme.fontSize === 'small' ? 12 : theme.fontSize === 'large' ? 16 : 14,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: theme.borderRadius,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: theme.borderRadius * 1.5,
            boxShadow: theme.mode === 'dark' 
              ? '0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
          },
        },
      },
    },
  });

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await apiService.healthCheck();
        console.log('✅ Backend connected');
      } catch (error) {
        console.warn('⚠️ Backend unavailable, using offline mode');
      }
    };

    checkBackend();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const isAuthorized = isAuthenticated || isDemo;

  return (
    <ErrorBoundary>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Router>
          <ErrorBoundary>
            <Box 
              sx={{ 
                display: 'flex', 
                minHeight: '100vh',
                backgroundColor: 'background.default'
              }}
            >
              {isAuthorized && (
                <ErrorBoundary>
                  <Header />
                  <Sidebar open={sidebarOpen} />
                </ErrorBoundary>
              )}
              
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  pt: isAuthorized ? '64px' : 0, // Account for header height
                  pl: isAuthorized && sidebarOpen ? '240px' : 0, // Account for sidebar width
                  transition: 'padding-left 0.3s ease',
                  minHeight: '100vh',
                }}
              >
                <ErrorBoundary>
                  <Routes>
                    {/* Public Routes */}
                    <Route 
                      path="/auth" 
                      element={
                        isAuthorized ? <Navigate to="/" replace /> : (
                          <ErrorBoundary>
                            <AuthPage />
                          </ErrorBoundary>
                        )
                      } 
                    />
                    
                    {/* Protected Routes */}
                    <Route 
                      path="/" 
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <HomePage />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/decision/simple" 
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <SimpleDecisionPage />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/decision/complex" 
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <ComplexDecisionPage />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/decision/random" 
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <RandomDecisionPage />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <DashboardPage />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/history" 
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <HistoryPage />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <ProfilePage />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Redirect unmatched routes */}
                    <Route 
                      path="*" 
                      element={
                        <Navigate to={isAuthorized ? "/" : "/auth"} replace />
                      } 
                    />
                  </Routes>
                </ErrorBoundary>
              </Box>
              
              <ToastContainer />
            </Box>
          </ErrorBoundary>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
