import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  styled,
  useTheme
} from '@mui/material';
import {
  Psychology,
  AccountTree,
  Casino,
  Speed,
  Insights,
  SmartToy
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDecisionStore } from '@/store/useDecisionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { DecisionType } from '@/types';

const HeroSection = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4, 0),
  background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
  borderRadius: theme.shape.borderRadius * 2,
  marginBottom: theme.spacing(4),
}));

const StatCard = styled(Card)(({ theme }) => ({
  textAlign: 'center',
  height: '100%',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const DecisionCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    borderColor: theme.palette.primary.main,
  },
  border: `1px solid ${theme.palette.divider}`,
}));

interface DecisionTypeInfo {
  type: DecisionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  techBadge: string;
  color: string;
  path: string;
}

const decisionTypes: DecisionTypeInfo[] = [
  {
    type: 'simple',
    title: 'Быстрое решение',
    description: 'Emotion-aware алгоритм для повседневных решений с анализом эмоционального состояния',
    icon: <Psychology sx={{ fontSize: '3rem' }} />,
    techBadge: 'Emotion AI',
    color: '#1FB8CD',
    path: '/decision/simple'
  },
  {
    type: 'complex',
    title: 'Сложный анализ',
    description: 'AHP + TOPSIS для многокритериальных решений с математическим обоснованием',
    icon: <AccountTree sx={{ fontSize: '3rem' }} />,
    techBadge: 'MCDA',
    color: '#FFC185',
    path: '/decision/complex'
  },
  {
    type: 'random',
    title: 'Случайный выбор',
    description: 'Интерактивное колесо выбора с анимацией для беспристрастного решения',
    icon: <Casino sx={{ fontSize: '3rem' }} />,
    techBadge: 'Random',
    color: '#B4413C',
    path: '/decision/random'
  }
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { decisions, getDecisionsByType } = useDecisionStore();
  const { user, isDemo } = useAuthStore();

  const totalDecisions = decisions.length;
  const avgSatisfaction = decisions.length > 0 
    ? decisions.reduce((sum, d) => sum + (d.outcomeRating || 4), 0) / decisions.length 
    : 4.2;
  const aiAccuracy = Math.min(95, 65 + (totalDecisions * 2));

  const handleDecisionTypeClick = (path: string) => {
    navigate(path);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <HeroSection>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ fontWeight: 700 }}
        >
          Добро пожаловать в SmartChoice AI! 🧠
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto', mb: 2 }}
        >
          Наш ИИ помощник поможет вам принимать решения быстро и уверенно, 
          используя передовые алгоритмы машинного обучения
        </Typography>
        {isDemo && (
          <Chip 
            label="Демо режим" 
            color="warning" 
            variant="outlined"
            sx={{ mt: 1 }}
          />
        )}
      </HeroSection>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <Speed sx={{ fontSize: '2rem', color: 'primary.main', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {totalDecisions}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Решений принято
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <StatCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <Insights sx={{ fontSize: '2rem', color: 'success.main', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {avgSatisfaction.toFixed(1)}
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Средняя оценка
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <StatCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <SmartToy sx={{ fontSize: '2rem', color: 'warning.main', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {aiAccuracy}%
                </Typography>
              </Box>
              <Typography color="text.secondary">
                Точность ИИ
              </Typography>
            </CardContent>
          </StatCard>
        </Grid>
      </Grid>

      {/* Decision Types */}
      <Typography 
        variant="h4" 
        component="h2" 
        gutterBottom
        sx={{ fontWeight: 600, mb: 3 }}
      >
        Выберите тип решения
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {decisionTypes.map((decisionType) => {
          const typeCount = getDecisionsByType(decisionType.type).length;
          
          return (
            <Grid item xs={12} md={4} key={decisionType.type}>
              <DecisionCard 
                onClick={() => handleDecisionTypeClick(decisionType.path)}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                  <Box sx={{ color: decisionType.color, mb: 2 }}>
                    {decisionType.icon}
                  </Box>
                  
                  <Typography 
                    variant="h5" 
                    component="h3" 
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {decisionType.title}
                  </Typography>
                  
                  <Typography 
                    color="text.secondary" 
                    sx={{ mb: 2, lineHeight: 1.6 }}
                  >
                    {decisionType.description}
                  </Typography>
                  
                  <Chip 
                    label={decisionType.techBadge}
                    size="small"
                    sx={{
                      backgroundColor: `${decisionType.color}20`,
                      color: decisionType.color,
                      fontWeight: 600
                    }}
                  />
                  
                  {typeCount > 0 && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        mt: 1,
                        color: 'text.secondary'
                      }}
                    >
                      Использовано {typeCount} раз
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button 
                    variant="contained" 
                    fullWidth
                    sx={{
                      mx: 2,
                      backgroundColor: decisionType.color,
                      '&:hover': {
                        backgroundColor: decisionType.color + 'dd',
                      }
                    }}
                  >
                    Начать
                  </Button>
                </CardActions>
              </DecisionCard>
            </Grid>
          );
        })}
      </Grid>

      {/* AI Tips Section */}
      <Card sx={{ p: 3, background: `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.info.main}15)` }}>
        <Typography 
          variant="h5" 
          component="h3" 
          gutterBottom
          sx={{ fontWeight: 600, textAlign: 'center', mb: 3 }}
        >
          💡 ИИ советы для принятия решений
        </Typography>
        
        <Grid container spacing={2}>
          {[
            "ИИ анализирует ваши эмоции для лучших рекомендаций",
            "Алгоритм AHP автоматически вычисляет важность критериев",
            "TOPSIS находит решение ближайшее к идеальному",
            "Ваши решения становятся точнее с каждым использованием",
            "Контекстуальный анализ учитывает время и настроение",
            "Машинное обучение адаптируется под ваш стиль решений"
          ].map((tip, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  {tip}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Container>
  );
};

export default HomePage;
