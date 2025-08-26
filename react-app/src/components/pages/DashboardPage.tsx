import React, { useMemo } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  IconButton,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Dashboard, 
  ArrowBack,
  TrendingUp,
  Assessment,
  Psychology,
  AccountTree,
  Casino,
  EmojiEvents,
  Insights,
  Speed,
  Timeline,
  Star
} from '@mui/icons-material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useDecisionStore } from '@/store/useDecisionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Decision, DecisionType, UserInsight } from '@/types';

const COLORS = {
  simple: '#1FB8CD',
  complex: '#FFC185', 
  random: '#B4413C'
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { decisions } = useDecisionStore();
  const { user, isDemo } = useAuthStore();

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (decisions.length === 0) {
      return {
        totalDecisions: 0,
        avgSatisfaction: 0,
        avgConfidence: 0,
        typeDistribution: [],
        recentTrend: [],
        topChoices: [],
        insights: []
      };
    }

    // Basic stats
    const totalDecisions = decisions.length;
    const avgSatisfaction = decisions.reduce((sum, d) => sum + (d.outcomeRating || 4), 0) / totalDecisions;
    const avgConfidence = decisions.reduce((sum, d) => sum + (d.confidenceScore || 70), 0) / totalDecisions;

    // Type distribution
    const typeCount = decisions.reduce((acc, decision) => {
      acc[decision.decisionType] = (acc[decision.decisionType] || 0) + 1;
      return acc;
    }, {} as Record<DecisionType, number>);

    const typeDistribution = Object.entries(typeCount).map(([type, count]) => ({
      name: type === 'simple' ? 'Быстрые' : type === 'complex' ? 'Сложные' : 'Случайные',
      value: count,
      color: COLORS[type as DecisionType]
    }));

    // Recent trend (last 7 decisions)
    const recent = decisions.slice(0, 7).reverse();
    const recentTrend = recent.map((decision, index) => ({
      name: `${index + 1}`,
      confidence: decision.confidenceScore || 70,
      satisfaction: (decision.outcomeRating || 4) * 20 // Convert to 0-100 scale
    }));

    // Top choices
    const choiceCount = decisions.reduce((acc, decision) => {
      if (decision.chosenOption) {
        acc[decision.chosenOption] = (acc[decision.chosenOption] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topChoices = Object.entries(choiceCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([choice, count]) => ({ choice, count }));

    // Generate insights
    const insights: UserInsight[] = [];

    if (avgConfidence > 80) {
      insights.push({
        type: 'achievement',
        title: 'Высокая уверенность',
        description: `Ваша средняя уверенность в решениях составляет ${avgConfidence.toFixed(1)}%`,
        icon: '🎯',
        confidence: avgConfidence
      });
    }

    if (avgSatisfaction > 4) {
      insights.push({
        type: 'achievement',
        title: 'Отличная удовлетворенность',
        description: `Средняя оценка ваших решений: ${avgSatisfaction.toFixed(1)}/5`,
        icon: '⭐',
        confidence: avgSatisfaction * 20
      });
    }

    const mostUsedType = Object.entries(typeCount).reduce((a, b) => a[1] > b[1] ? a : b);
    insights.push({
      type: 'pattern',
      title: 'Предпочитаемый тип',
      description: `Чаще всего вы используете ${
        mostUsedType[0] === 'simple' ? 'быстрые решения' : 
        mostUsedType[0] === 'complex' ? 'сложный анализ' : 'случайный выбор'
      }`,
      icon: '📊',
      confidence: (mostUsedType[1] / totalDecisions) * 100
    });

    if (totalDecisions >= 10) {
      insights.push({
        type: 'achievement',
        title: 'Активный пользователь',
        description: `Вы приняли уже ${totalDecisions} решений с помощью ИИ!`,
        icon: '🏆',
        confidence: 100
      });
    }

    return {
      totalDecisions,
      avgSatisfaction,
      avgConfidence,
      typeDistribution,
      recentTrend,
      topChoices,
      insights
    };
  }, [decisions]);

  const StatCard = ({ title, value, subtitle, icon, color = 'primary' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ backgroundColor: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (decisions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            Аналитический дашборд
          </Typography>
        </Box>

        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Недостаточно данных для аналитики
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Принимайте решения с помощью ИИ, чтобы увидеть персональную аналитику
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Chip
              icon={<Psychology />}
              label="Быстрое решение"
              clickable
              onClick={() => navigate('/decision/simple')}
            />
            <Chip
              icon={<AccountTree />}
              label="Сложный анализ"
              clickable
              onClick={() => navigate('/decision/complex')}
            />
            <Chip
              icon={<Casino />}
              label="Случайный выбор"
              clickable
              onClick={() => navigate('/decision/random')}
            />
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            Аналитический дашборд
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isDemo ? 'Локальная аналитика' : 'Персональная аналитика решений'}
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Решений принято"
            value={analytics.totalDecisions}
            subtitle="Всего с начала использования"
            icon={<Speed />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Средняя оценка"
            value={`${analytics.avgSatisfaction.toFixed(1)}/5`}
            subtitle="Удовлетворенность результатами"
            icon={<Star />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Уверенность ИИ"
            value={`${analytics.avgConfidence.toFixed(0)}%`}
            subtitle="Средняя точность рекомендаций"
            icon={<TrendingUp />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Инсайтов"
            value={analytics.insights.length}
            subtitle="Персональных рекомендаций"
            icon={<Insights />}
            color="secondary"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Type Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Распределение типов решений
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Trend */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Динамика последних решений
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.recentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#1FB8CD" 
                      strokeWidth={2}
                      name="Уверенность ИИ (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="satisfaction" 
                      stroke="#FFC185" 
                      strokeWidth={2}
                      name="Удовлетворенность (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Choices */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Популярные выборы
              </Typography>
              <List>
                {analytics.topChoices.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={item.choice}
                      secondary={`Выбрано ${item.count} раз`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Insights */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ИИ Инсайты
              </Typography>
              {analytics.insights.map((insight, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ mr: 1 }}>
                      {insight.icon}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {insight.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {insight.description}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={insight.confidence}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  {index < analytics.insights.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
