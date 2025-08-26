import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Collapse,
  styled
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh,
  BugReport,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

const ErrorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  padding: theme.spacing(4),
  textAlign: 'center',
}));

const ErrorCard = styled(Card)(({ theme }) => ({
  maxWidth: 600,
  width: '100%',
  padding: theme.spacing(3),
}));

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, you would send this to an error tracking service like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // For now, just log to console
    console.error('Error Report:', errorReport);
    
    // Store locally for debugging
    const errors = JSON.parse(localStorage.getItem('smartchoice_errors') || '[]');
    errors.push(errorReport);
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.splice(0, errors.length - 10);
    }
    localStorage.setItem('smartchoice_errors', JSON.stringify(errors));
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  private reportBug = () => {
    const { error, errorInfo } = this.state;
    const subject = encodeURIComponent(`SmartChoice AI Bug Report: ${error?.message}`);
    const body = encodeURIComponent(`
Описание ошибки:
${error?.message}

Stack Trace:
${error?.stack}

Component Stack:
${errorInfo?.componentStack}

URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Дополнительная информация:
[Опишите что вы делали перед ошибкой]
    `);
    
    window.open(`mailto:support@smartchoice.ai?subject=${subject}&body=${body}`);
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorContainer>
          <ErrorCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <ErrorIcon sx={{ fontSize: '4rem', color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    Упс! Что-то пошло не так
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Произошла непредвиденная ошибка в приложении
                  </Typography>
                </Box>
              </Box>

              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Ошибка:</strong> {this.state.error?.message || 'Неизвестная ошибка'}
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                  color="primary"
                >
                  Перезагрузить страницу
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleReset}
                >
                  Продолжить
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
                <Button
                  variant="text"
                  startIcon={<BugReport />}
                  onClick={this.reportBug}
                  size="small"
                >
                  Сообщить об ошибке
                </Button>
                <Button
                  variant="text"
                  startIcon={this.state.showDetails ? <ExpandLess /> : <ExpandMore />}
                  onClick={this.toggleDetails}
                  size="small"
                >
                  {this.state.showDetails ? 'Скрыть' : 'Показать'} детали
                </Button>
              </Box>

              <Collapse in={this.state.showDetails}>
                <Alert severity="info" sx={{ textAlign: 'left' }}>
                  <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                    <strong>Stack Trace:</strong>
                  </Typography>
                  <Typography 
                    variant="caption" 
                    component="pre" 
                    sx={{ 
                      fontSize: '0.7rem',
                      overflow: 'auto',
                      maxHeight: 200,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {this.state.error?.stack}
                  </Typography>
                  
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <Typography variant="caption" component="div" sx={{ mb: 1, mt: 2 }}>
                        <strong>Component Stack:</strong>
                      </Typography>
                      <Typography 
                        variant="caption" 
                        component="pre" 
                        sx={{ 
                          fontSize: '0.7rem',
                          overflow: 'auto',
                          maxHeight: 200,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    </>
                  )}
                </Alert>
              </Collapse>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Если проблема повторяется, попробуйте очистить кеш браузера или обратитесь в поддержку
              </Typography>
            </CardContent>
          </ErrorCard>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
