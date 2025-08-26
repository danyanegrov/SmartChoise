import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Rating,
  Alert,
  Pagination,
  Stack
} from '@mui/material';
import { 
  History, 
  ArrowBack, 
  Search,
  FilterList,
  Psychology,
  AccountTree,
  Casino,
  TrendingUp,
  CalendarToday,
  Star
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDecisionStore } from '@/store/useDecisionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Decision, DecisionType } from '@/types';

const ITEMS_PER_PAGE = 6;

const typeIcons = {
  simple: <Psychology />,
  complex: <AccountTree />,
  random: <Casino />
};

const typeLabels = {
  simple: 'Быстрое решение',
  complex: 'Сложный анализ',
  random: 'Случайный выбор'
};

const typeColors = {
  simple: '#1FB8CD',
  complex: '#FFC185',
  random: '#B4413C'
};

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { decisions } = useDecisionStore();
  const { isDemo } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<DecisionType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'confidence'>('date');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort decisions
  const filteredDecisions = useMemo(() => {
    let filtered = [...decisions];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(decision =>
        decision.title.toLowerCase().includes(query) ||
        decision.description?.toLowerCase().includes(query) ||
        decision.chosenOption?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(decision => decision.decisionType === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'rating':
          return (b.outcomeRating || 0) - (a.outcomeRating || 0);
        case 'confidence':
          return (b.confidenceScore || 0) - (a.confidenceScore || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [decisions, searchQuery, filterType, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredDecisions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDecisions = filteredDecisions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleDecisionClick = (decision: Decision) => {
    // Could navigate to a detailed view or show modal
    console.log('Decision clicked:', decision);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setSortBy('date');
    setCurrentPage(1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            История решений
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isDemo ? 'Локальная история' : 'Ваши сохраненные решения'}
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Поиск"
              placeholder="Найти решение..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Тип</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as DecisionType | 'all')}
                label="Тип"
              >
                <MenuItem value="all">Все типы</MenuItem>
                <MenuItem value="simple">Быстрые</MenuItem>
                <MenuItem value="complex">Сложные</MenuItem>
                <MenuItem value="random">Случайные</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Сортировка</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'rating' | 'confidence')}
                label="Сортировка"
              >
                <MenuItem value="date">По дате</MenuItem>
                <MenuItem value="rating">По оценке</MenuItem>
                <MenuItem value="confidence">По уверенности</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Найдено: {filteredDecisions.length} из {decisions.length}
              </Typography>
              {(searchQuery || filterType !== 'all' || sortBy !== 'date') && (
                <Button size="small" onClick={clearFilters}>
                  Сбросить
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      {filteredDecisions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          {decisions.length === 0 ? (
            <>
              <History sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                История пока пуста
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Принимайте решения с помощью ИИ, и они будут сохраняться здесь
              </Typography>
              <Button variant="contained" onClick={() => navigate('/')}>
                Принять первое решение
              </Button>
            </>
          ) : (
            <>
              <Search sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Ничего не найдено
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Попробуйте изменить параметры поиска
              </Typography>
              <Button variant="outlined" onClick={clearFilters}>
                Сбросить фильтры
              </Button>
            </>
          )}
        </Paper>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {paginatedDecisions.map((decision) => (
              <Grid item xs={12} md={6} key={decision.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleDecisionClick(decision)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        sx={{
                          backgroundColor: typeColors[decision.decisionType],
                          mr: 2,
                          width: 48,
                          height: 48
                        }}
                      >
                        {typeIcons[decision.decisionType]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography 
                          variant="h6" 
                          gutterBottom
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {decision.title}
                        </Typography>
                        <Chip
                          label={typeLabels[decision.decisionType]}
                          size="small"
                          sx={{
                            backgroundColor: `${typeColors[decision.decisionType]}20`,
                            color: typeColors[decision.decisionType]
                          }}
                        />
                      </Box>
                    </Box>

                    {decision.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {decision.description}
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Star sx={{ color: 'warning.main', mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Выбор: {decision.chosenOption}
                      </Typography>
                    </Box>

                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUp sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Уверенность:
                          </Typography>
                        </Box>
                        <Chip
                          label={`${Math.round(decision.confidenceScore || 0)}%`}
                          size="small"
                          color={getConfidenceColor(decision.confidenceScore || 0)}
                        />
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(decision.createdAt)}
                          </Typography>
                        </Box>
                        {decision.outcomeRating && (
                          <Rating 
                            value={decision.outcomeRating} 
                            readOnly 
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Grid>
                    </Grid>

                    {decision.algorithm && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block', 
                          mt: 1,
                          fontStyle: 'italic'
                        }}
                      >
                        Алгоритм: {decision.algorithm}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Info Alert */}
      {decisions.length > 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <strong>Совет:</strong> Регулярно оценивайте результаты ваших решений. 
          Это помогает ИИ алгоритмам становиться точнее и лучше понимать ваши предпочтения.
        </Alert>
      )}
    </Container>
  );
};

export default HistoryPage;
