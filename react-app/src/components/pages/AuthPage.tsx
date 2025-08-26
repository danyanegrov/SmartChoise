import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Tabs,
  Tab,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  styled
} from '@mui/material';
import { Psychology, Rocket } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { apiService } from '@/services/api';
import { LoginForm, RegisterForm } from '@/types';

const AuthContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
}));

const AuthPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 450,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[8],
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setDemo } = useAuthStore();
  const { addToast } = useUIStore();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: ''
  });
  
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    age: 25,
    personalityType: '',
    anxietyLevel: 5
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.login(loginForm);
      login(result.user, result.token);
      
      addToast({
        type: 'success',
        title: 'Добро пожаловать!',
        message: `Вы успешно вошли в систему`
      });

      // Redirect to intended page or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка входа';
      setError(message);
      addToast({
        type: 'error',
        title: 'Ошибка входа',
        message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.register(registerForm);
      login(result.user, result.token);
      
      addToast({
        type: 'success',
        title: 'Аккаунт создан!',
        message: 'Добро пожаловать в SmartChoice AI!'
      });

      navigate('/', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка регистрации';
      setError(message);
      addToast({
        type: 'error',
        title: 'Ошибка регистрации',
        message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    setDemo(true);
    addToast({
      type: 'info',
      title: 'Демо режим',
      message: 'Данные сохраняются локально'
    });
    navigate('/', { replace: true });
  };

  return (
    <AuthContainer>
      <AuthPaper elevation={8}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Psychology sx={{ fontSize: '3rem', color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            SmartChoice AI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Войдите в систему или создайте аккаунт
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Вход" />
          <Tab label="Регистрация" />
        </Tabs>

        {/* Login Form */}
        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
              required
              margin="normal"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              required
              margin="normal"
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Проверяем...' : 'Войти'}
            </Button>
          </Box>
        </TabPanel>

        {/* Register Form */}
        <TabPanel value={tabValue} index={1}>
          <Box component="form" onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="Имя"
              value={registerForm.name}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
              required
              margin="normal"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
              required
              margin="normal"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
              required
              margin="normal"
              disabled={loading}
              helperText="Минимум 6 символов"
            />
            <TextField
              fullWidth
              label="Возраст"
              type="number"
              value={registerForm.age || ''}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
              margin="normal"
              disabled={loading}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Тип личности</InputLabel>
              <Select
                value={registerForm.personalityType}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, personalityType: e.target.value }))}
                disabled={loading}
              >
                <MenuItem value="">Не указан</MenuItem>
                <MenuItem value="introvert">Интроверт</MenuItem>
                <MenuItem value="extrovert">Экстраверт</MenuItem>
                <MenuItem value="ambivert">Амбиверт</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography gutterBottom>
                Уровень тревожности: {registerForm.anxietyLevel}
              </Typography>
              <Slider
                value={registerForm.anxietyLevel}
                onChange={(_, value) => setRegisterForm(prev => ({ ...prev, anxietyLevel: value as number }))}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
                disabled={loading}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">Низкий</Typography>
                <Typography variant="caption" color="text.secondary">Высокий</Typography>
              </Box>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
            </Button>
          </Box>
        </TabPanel>

        {/* Demo Mode */}
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            или
          </Typography>
        </Divider>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<Rocket />}
          onClick={handleDemoMode}
          disabled={loading}
        >
          Демо режим (без регистрации)
        </Button>

        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', textAlign: 'center', mt: 2 }}
        >
          В демо режиме данные сохраняются только локально
        </Typography>
      </AuthPaper>
    </AuthContainer>
  );
};

export default AuthPage;
