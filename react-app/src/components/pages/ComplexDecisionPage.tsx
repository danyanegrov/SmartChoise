import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  IconButton,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Rating
} from '@mui/material';
import { 
  AccountTree, 
  ArrowBack, 
  Add, 
  Delete,
  Calculate,
  TrendingUp,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDecisionStore } from '@/store/useDecisionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { apiService } from '@/services/api';
import { ahpAlgorithm, topsisAlgorithm } from '@/services/algorithms';
import { Criteria, EvaluationMatrix, TOPSISResult } from '@/types';

const steps = [
  'Определите критерии',
  'Задайте важность',
  'Добавьте варианты',
  'Оцените варианты',
  'Получите результат'
];

const ComplexDecisionPage: React.FC = () => {
  const navigate = useNavigate();
  const { addDecision } = useDecisionStore();
  const { user, isDemo } = useAuthStore();
  const { addToast, setLoading } = useUIStore();

  const [activeStep, setActiveStep] = useState(0);
  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState<Criteria[]>([
    { id: '1', name: 'Стоимость', weight: 5, description: '' },
    { id: '2', name: 'Качество', weight: 4, description: '' }
  ]);
  const [options, setOptions] = useState<string[]>(['Вариант 1', 'Вариант 2']);
  const [evaluationMatrix, setEvaluationMatrix] = useState<number[][]>([
    [3, 4], // Вариант 1: [Стоимость: 3, Качество: 4]
    [5, 3]  // Вариант 2: [Стоимость: 5, Качество: 3]
  ]);
  const [result, setResult] = useState<TOPSISResult[] | null>(null);
  const [processing, setProcessing] = useState(false);

  const addCriterion = () => {
    if (criteria.length >= 6) {
      addToast({
        type: 'warning',
        title: 'Максимум критериев',
        message: 'Можно добавить максимум 6 критериев'
      });
      return;
    }
    
    const newCriterion: Criteria = {
      id: Date.now().toString(),
      name: `Критерий ${criteria.length + 1}`,
      weight: 3,
      description: ''
    };
    
    setCriteria([...criteria, newCriterion]);
    
    // Расширяем матрицу оценок
    const newMatrix = evaluationMatrix.map(row => [...row, 3]);
    setEvaluationMatrix(newMatrix);
  };

  const removeCriterion = (index: number) => {
    if (criteria.length <= 2) {
      addToast({
        type: 'warning',
        title: 'Минимум критериев',
        message: 'Нужно минимум 2 критерия'
      });
      return;
    }
    
    const newCriteria = criteria.filter((_, i) => i !== index);
    setCriteria(newCriteria);
    
    // Сжимаем матрицу оценок
    const newMatrix = evaluationMatrix.map(row => row.filter((_, i) => i !== index));
    setEvaluationMatrix(newMatrix);
  };

  const updateCriterion = (index: number, field: keyof Criteria, value: any) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setCriteria(newCriteria);
  };

  const addOption = () => {
    if (options.length >= 8) {
      addToast({
        type: 'warning',
        title: 'Максимум вариантов',
        message: 'Можно добавить максимум 8 вариантов'
      });
      return;
    }
    
    setOptions([...options, `Вариант ${options.length + 1}`]);
    
    // Добавляем новую строку в матрицу оценок
    const newRow = Array(criteria.length).fill(3);
    setEvaluationMatrix([...evaluationMatrix, newRow]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      addToast({
        type: 'warning',
        title: 'Минимум вариантов',
        message: 'Нужно минимум 2 варианта'
      });
      return;
    }
    
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    
    // Удаляем строку из матрицы оценок
    const newMatrix = evaluationMatrix.filter((_, i) => i !== index);
    setEvaluationMatrix(newMatrix);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const updateEvaluation = (optionIndex: number, criterionIndex: number, value: number) => {
    const newMatrix = [...evaluationMatrix];
    newMatrix[optionIndex][criterionIndex] = value;
    setEvaluationMatrix(newMatrix);
  };

  const calculateDecision = async () => {
    if (!title.trim()) {
      addToast({
        type: 'error',
        title: 'Заполните поле',
        message: 'Пожалуйста, введите название решения'
      });
      return;
    }

    setProcessing(true);
    setLoading('decision', true);

    try {
      // Calculate AHP weights
      const rawWeights = criteria.map(c => c.weight);
      const ahpResult = ahpAlgorithm.calculateWeights(rawWeights);
      
      // Calculate TOPSIS ranking
      const topsisResult = topsisAlgorithm.calculate(evaluationMatrix, ahpResult.weights);
      
      // Enhance results with option names
      const enhancedResults = topsisResult.map((result, index) => ({
        ...result,
        name: options[index]
      }));

      setResult(enhancedResults);

      // Try to save via API
      if (!isDemo) {
        try {
          const apiResult = await apiService.createComplexDecision({
            title,
            description: `Многокритериальный анализ с ${criteria.length} критериями и ${options.length} вариантами`,
            criteria: criteria.map(c => ({ name: c.name, weight: c.weight })),
            options,
            evaluationMatrix
          });

          addDecision(apiResult.decision);
        } catch (error) {
          console.warn('API failed, saving locally:', error);
          
          // Create local decision
          const localDecision = {
            id: Date.now().toString(),
            userId: user?.id || 'demo',
            decisionType: 'complex' as const,
            title,
            description: `Многокритериальный анализ с ${criteria.length} критериями и ${options.length} вариантами`,
            options: options.map(opt => ({ text: opt })),
            chosenOption: enhancedResults[0].name,
            confidenceScore: enhancedResults[0].score * 100,
            contextData: {
              criteria: criteria.map(c => ({ name: c.name, weight: c.weight })),
              evaluationMatrix,
              topsisResults: enhancedResults,
              ahpConsistencyRatio: ahpResult.consistencyRatio
            },
            createdAt: new Date().toISOString(),
            algorithm: 'AHP + TOPSIS'
          };

          addDecision(localDecision);
        }
      } else {
        // Demo mode - save locally
        const localDecision = {
          id: Date.now().toString(),
          userId: 'demo',
          decisionType: 'complex' as const,
          title,
          description: `Многокритериальный анализ с ${criteria.length} критериями и ${options.length} вариантами`,
          options: options.map(opt => ({ text: opt })),
          chosenOption: enhancedResults[0].name,
          confidenceScore: enhancedResults[0].score * 100,
          contextData: {
            criteria: criteria.map(c => ({ name: c.name, weight: c.weight })),
            evaluationMatrix,
            topsisResults: enhancedResults,
            ahpConsistencyRatio: ahpResult.consistencyRatio
          },
          createdAt: new Date().toISOString(),
          algorithm: 'AHP + TOPSIS'
        };

        addDecision(localDecision);
      }

      addToast({
        type: 'success',
        title: 'Анализ завершен!',
        message: 'Многокритериальный анализ выполнен успешно'
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

  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const resetForm = () => {
    setActiveStep(0);
    setTitle('');
    setCriteria([
      { id: '1', name: 'Стоимость', weight: 5, description: '' },
      { id: '2', name: 'Качество', weight: 4, description: '' }
    ]);
    setOptions(['Вариант 1', 'Вариант 2']);
    setEvaluationMatrix([[3, 4], [5, 3]]);
    setResult(null);
  };

  if (result) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <CheckCircle sx={{ fontSize: '4rem', color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Многокритериальный анализ завершен!
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
          </Box>

          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            🏆 Рейтинг вариантов (TOPSIS):
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {result.map((option, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: index === 0 ? 'success.main' : 'background.paper',
                    color: index === 0 ? 'success.contrastText' : 'text.primary',
                    border: index === 0 ? 2 : 1,
                    borderColor: index === 0 ? 'success.main' : 'divider'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    #{option.rank} {option.name}
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {(option.score * 100).toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={option.score * 100} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: index === 0 ? 'rgba(255,255,255,0.3)' : undefined
                    }}
                  />
                  {index === 0 && (
                    <Chip 
                      label="ЛУЧШИЙ ВАРИАНТ" 
                      size="small" 
                      sx={{ 
                        mt: 1, 
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: 'success.main',
                        fontWeight: 'bold'
                      }} 
                    />
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>

          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Как читать результат:</strong> TOPSIS анализирует близость каждого варианта к идеальному решению. 
            Чем выше балл, тем лучше вариант соответствует вашим критериям с учетом их важности.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={resetForm}>
              Новый анализ
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            Многокритериальный анализ
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<AccountTree />} 
              label="AHP + TOPSIS" 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              icon={<Calculate />} 
              label="Научный подход" 
              color="secondary" 
              variant="outlined" 
            />
          </Box>
        </Box>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3 }}>
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Шаг 1: Определите критерии для сравнения
            </Typography>
            <TextField
              fullWidth
              label="Название решения"
              placeholder="Например: Выбор нового автомобиля"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 3 }}
            />
            
            <Typography variant="subtitle1" gutterBottom>
              Критерии оценки:
            </Typography>
            
            {criteria.map((criterion, index) => (
              <Card key={criterion.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Название критерия"
                      value={criterion.name}
                      onChange={(e) => updateCriterion(index, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth
                      label="Описание (опционально)"
                      value={criterion.description}
                      onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton 
                      onClick={() => removeCriterion(index)}
                      disabled={criteria.length <= 2}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Grid>
                </Grid>
              </Card>
            ))}
            
            <Button
              startIcon={<Add />}
              onClick={addCriterion}
              disabled={criteria.length >= 6}
              sx={{ mb: 3 }}
            >
              Добавить критерий
            </Button>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Шаг 2: Определите важность критериев
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Оцените важность каждого критерия от 1 (неважно) до 5 (очень важно)
            </Typography>
            
            {criteria.map((criterion, index) => (
              <Card key={criterion.id} variant="outlined" sx={{ mb: 2, p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {criterion.name}
                </Typography>
                {criterion.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {criterion.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 80 }}>
                    Важность:
                  </Typography>
                  <Slider
                    value={criterion.weight}
                    onChange={(_, value) => updateCriterion(index, 'weight', value)}
                    min={1}
                    max={5}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    sx={{ flexGrow: 1 }}
                  />
                  <Rating 
                    value={criterion.weight} 
                    readOnly 
                    sx={{ ml: 2 }}
                  />
                </Box>
              </Card>
            ))}
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Шаг 3: Добавьте варианты для сравнения
            </Typography>
            
            {options.map((option, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Вариант ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                />
                <IconButton 
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 2}
                  color="error"
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}
            
            <Button
              startIcon={<Add />}
              onClick={addOption}
              disabled={options.length >= 8}
              sx={{ mb: 3 }}
            >
              Добавить вариант
            </Button>
          </Box>
        )}

        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Шаг 4: Оцените каждый вариант по каждому критерию
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Оцените от 1 (плохо) до 5 (отлично) насколько каждый вариант соответствует критерию
            </Typography>
            
            <TableContainer component={Card} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Варианты \ Критерии</strong></TableCell>
                    {criteria.map((criterion) => (
                      <TableCell key={criterion.id} align="center">
                        <strong>{criterion.name}</strong>
                        <br />
                        <small>(важность: {criterion.weight}/5)</small>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {options.map((option, optionIndex) => (
                    <TableRow key={optionIndex}>
                      <TableCell component="th" scope="row">
                        <strong>{option}</strong>
                      </TableCell>
                      {criteria.map((criterion, criterionIndex) => (
                        <TableCell key={criterion.id} align="center">
                          <Rating
                            value={evaluationMatrix[optionIndex][criterionIndex]}
                            onChange={(_, value) => 
                              updateEvaluation(optionIndex, criterionIndex, value || 1)
                            }
                            max={5}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeStep === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Шаг 5: Готово к анализу!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Проверьте данные и запустите многокритериальный анализ
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    📋 Решение: {title}
                  </Typography>
                  <Typography variant="body2">
                    Критериев: {criteria.length}
                  </Typography>
                  <Typography variant="body2">
                    Вариантов: {options.length}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    🧮 Алгоритмы
                  </Typography>
                  <Typography variant="body2">
                    • AHP - определение весов критериев
                  </Typography>
                  <Typography variant="body2">
                    • TOPSIS - ранжирование вариантов
                  </Typography>
                </Card>
              </Grid>
            </Grid>
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={calculateDecision}
              disabled={processing}
              startIcon={processing ? <TrendingUp /> : <Calculate />}
              sx={{ py: 1.5 }}
            >
              {processing ? 'Выполняется анализ...' : 'Запустить многокритериальный анализ'}
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={prevStep}
            disabled={activeStep === 0}
          >
            Назад
          </Button>
          <Button
            onClick={nextStep}
            disabled={activeStep === steps.length - 1}
            variant="contained"
          >
            Далее
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ComplexDecisionPage;
