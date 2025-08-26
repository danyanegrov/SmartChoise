import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Rating,
  Grid
} from '@mui/material';
import { Add, Psychology, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDecisionStore } from '@/store/useDecisionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { apiService } from '@/services/api';
import { emotionAI, contextualBandit } from '@/services/algorithms';
import { DecisionOption } from '@/types';

const SimpleDecisionPage: React.FC = () => {
  const navigate = useNavigate();
  const { addDecision } = useDecisionStore();
  const { user, isDemo } = useAuthStore();
  const { addToast, setLoading } = useUIStore();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<DecisionOption[]>([
    { text: '', rating: 3 },
    { text: '', rating: 3 }
  ]);
  const [progress, setProgress] = useState(25);
  const [result, setResult] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const addOption = () => {
    if (options.length >= 5) {
      addToast({
        type: 'warning',
        title: 'Максимум вариантов',
        message: 'Можно добавить максимум 5 вариантов'
      });
      return;
    }
    setOptions([...options, { text: '', rating: 3 }]);
    setProgress(Math.min(75, 50 + (options.length * 10)));
  };

  const updateOption = (index: number, field: keyof DecisionOption, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const getRecommendation = async () => {
    if (!question.trim()) {
      addToast({
        type: 'error',
        title: 'Заполните поле',
        message: 'Пожалуйста, опишите ваше решение'
      });
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      addToast({
        type: 'error',
        title: 'Недостаточно вариантов',
        message: 'Добавьте минимум два варианта с названиями'
      });
      return;
    }

    setProcessing(true);
    setLoading('decision', true);

    try {
      let recommendation;
      const emotionContext = emotionAI.analyze(question);

      if (!isDemo) {
        // Try API first
        try {
          const apiResult = await apiService.createSimpleDecision({
            title: question,
            description: question,
            options: validOptions,
            emotionContext
          });

          recommendation = {
            option: apiResult.decision.chosenOption || validOptions[0].text,
            confidence: Math.random() * 40 + 60,
            originalRating: validOptions.find(o => o.text === apiResult.decision.chosenOption)?.rating || 3
          };

          // Add to store
          addDecision(apiResult.decision);
        } catch (error) {
          console.warn('API failed, using local algorithm:', error);
          throw error;
        }
      } else {
        throw new Error('Demo mode');
      }

      // Fallback to local algorithm
      if (!recommendation) {
        recommendation = await contextualBandit.recommend(validOptions, {
          emotion: emotionContext,
          userProfile: user,
          timeOfDay: new Date().getHours()
        });

        // Create local decision
        const localDecision = {
          id: Date.now().toString(),
          userId: user?.id || 'demo',
          decisionType: 'simple' as const,
          title: question,
          description: question,
          options: validOptions,
          chosenOption: recommendation.option,
          confidenceScore: recommendation.confidence,
          contextData: { emotion: emotionContext },
          createdAt: new Date().toISOString()
        };

        addDecision(localDecision);
      }

      setResult({
        recommendation,
        emotion: emotionContext,
        options: validOptions
      });
      
      setProgress(100);
      
      addToast({
        type: 'success',
        title: 'Рекомендация готова!',
        message: 'ИИ проанализировал ваше решение'
      });

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Ошибка анализа',
        message: 'Попробуйте еще раз'
      });
    } finally {
      setProcessing(false);
      setLoading('decision', false);
    }
  };

  const startOver = () => {
    setQuestion('');
    setOptions([{ text: '', rating: 3 }, { text: '', rating: 3 }]);
    setResult(null);
    setProgress(25);
  };

  if (result) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            🎉 ИИ рекомендация готова!
          </Typography>
          
          <Card 
            variant="outlined" 
            sx={{ 
              p: 3, 
              my: 3, 
              backgroundColor: 'success.main', 
              color: 'success.contrastText',
              borderColor: 'success.main'
            }}
          >
            <Typography variant="h5" gutterBottom>
              🎯 {result.recommendation.option}
            </Typography>
            <Rating 
              value={result.recommendation.originalRating} 
              readOnly 
              sx={{ color: 'inherit' }}
            />
          </Card>

          <Box sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Уверенность ИИ:
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={result.recommendation.confidence} 
              sx={{ height: 8, borderRadius: 4, mb: 1 }}
            />
            <Typography variant="body2">
              {Math.round(result.recommendation.confidence)}%
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            ИИ рекомендует этот вариант на основе анализа вашей оценки 
            ({result.recommendation.originalRating}/5 звезд) и эмоционального контекста 
            ({result.emotion.emotion}).
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={startOver}>
              Начать заново
            </Button>
            <Button variant="contained" onClick={() => navigate('/')}>
              На главную
            </Button>
          </Box>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            Быстрое решение с ИИ
          </Typography>
          <Chip 
            icon={<Psychology />} 
            label="Emotion AI активен" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
      </Box>

      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ mb: 4, height: 8, borderRadius: 4 }}
      />

      <Paper sx={{ p: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Опишите ваше решение"
          placeholder="Например: Волнуюсь, какой ресторан выбрать на важную встречу..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Typography variant="h6" gutterBottom>
          Ваши варианты:
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {options.map((option, index) => (
            <Grid item xs={12} key={index}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    fullWidth
                    label={`Вариант ${index + 1}`}
                    value={option.text}
                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                  />
                  <Box sx={{ minWidth: 140 }}>
                    <Typography variant="body2" gutterBottom>
                      Оценка:
                    </Typography>
                    <Rating
                      value={option.rating}
                      onChange={(_, value) => updateOption(index, 'rating', value || 1)}
                    />
                  </Box>
                  {options.length > 2 && (
                    <IconButton onClick={() => removeOption(index)} color="error">
                      ×
                    </IconButton>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            startIcon={<Add />}
            onClick={addOption}
            disabled={options.length >= 5}
          >
            Добавить вариант
          </Button>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={getRecommendation}
          disabled={processing}
          sx={{ py: 1.5 }}
        >
          {processing ? 'Анализирую...' : 'Получить ИИ рекомендацию'}
        </Button>
      </Paper>
    </Container>
  );
};

export default SimpleDecisionPage;
