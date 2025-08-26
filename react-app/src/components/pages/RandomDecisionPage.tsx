import React, { useState, useRef, useEffect } from 'react';
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
  Fab,
  Alert,
  styled,
  alpha
} from '@mui/material';
import { 
  Casino, 
  ArrowBack, 
  Add, 
  Delete,
  PlayArrow,
  Refresh,
  EmojiEvents,
  Shuffle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDecisionStore } from '@/store/useDecisionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { apiService } from '@/services/api';
import { WheelOption, SpinResult } from '@/types';

const WheelContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '400px',
  height: '400px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& canvas': {
    borderRadius: '50%',
    boxShadow: theme.shadows[8],
    transition: 'transform 0.1s ease',
  },
  [theme.breakpoints.down('sm')]: {
    width: '300px',
    height: '300px',
  },
}));

const SpinButton = styled(Fab)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 10,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'translate(-50%, -50%) scale(1.1)',
  },
  '&:disabled': {
    backgroundColor: theme.palette.action.disabled,
  },
}));

const Pointer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 0,
  height: 0,
  borderLeft: '15px solid transparent',
  borderRight: '15px solid transparent',
  borderTop: `30px solid ${theme.palette.warning.main}`,
  zIndex: 5,
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
}));

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const RandomDecisionPage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addDecision } = useDecisionStore();
  const { user, isDemo } = useAuthStore();
  const { addToast } = useUIStore();

  const [options, setOptions] = useState<string[]>(['Вариант 1', 'Вариант 2', 'Вариант 3']);
  const [spinning, setSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [title, setTitle] = useState('');

  const wheelOptions: WheelOption[] = options.map((option, index) => ({
    id: index.toString(),
    text: option,
    color: colors[index % colors.length],
    angle: (360 / options.length) * index
  }));

  const addOption = () => {
    if (options.length >= 10) {
      addToast({
        type: 'warning',
        title: 'Максимум вариантов',
        message: 'Можно добавить максимум 10 вариантов'
      });
      return;
    }
    setOptions([...options, `Вариант ${options.length + 1}`]);
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
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw wheel segments
    const segmentAngle = (2 * Math.PI) / options.length;
    
    wheelOptions.forEach((option, index) => {
      const startAngle = index * segmentAngle + (currentRotation * Math.PI / 180);
      const endAngle = (index + 1) * segmentAngle + (currentRotation * Math.PI / 180);

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = option.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 2;
      
      const text = option.text.length > 12 ? option.text.substring(0, 12) + '...' : option.text;
      ctx.fillText(text, radius * 0.7, 5);
      
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const spin = async () => {
    if (spinning) return;

    setSpinning(true);
    setResult(null);

    // Random spin parameters
    const spinDuration = 3000 + Math.random() * 2000; // 3-5 seconds
    const totalRotations = 5 + Math.random() * 5; // 5-10 full rotations
    const finalAngle = Math.random() * 360;
    const totalDegrees = totalRotations * 360 + finalAngle;

    const startTime = Date.now();
    const startRotation = currentRotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      
      // Easing function for realistic spin
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const rotation = startRotation + totalDegrees * easeOut;
      
      setCurrentRotation(rotation % 360);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Determine winner
        const normalizedAngle = (360 - (rotation % 360) + 90) % 360;
        const segmentAngle = 360 / options.length;
        const winnerIndex = Math.floor(normalizedAngle / segmentAngle) % options.length;
        const winner = options[winnerIndex];

        const spinResult: SpinResult = {
          winner,
          rotations: totalRotations,
          finalAngle: rotation % 360
        };

        setResult(spinResult);
        setSpinning(false);

        // Save decision
        saveRandomDecision(winner, spinResult);

        // Celebrate!
        addToast({
          type: 'success',
          title: '🎉 Результат готов!',
          message: `Выбран: ${winner}`
        });
      }
    };

    requestAnimationFrame(animate);
  };

  const saveRandomDecision = async (winner: string, spinResult: SpinResult) => {
    const decisionTitle = title.trim() || 'Случайный выбор';
    
    try {
      if (!isDemo) {
        try {
          const apiResult = await apiService.createRandomDecision({
            options: options
          });
          addDecision(apiResult.decision);
          return;
        } catch (error) {
          console.warn('API failed, saving locally:', error);
        }
      }

      // Create local decision
      const localDecision = {
        id: Date.now().toString(),
        userId: user?.id || 'demo',
        decisionType: 'random' as const,
        title: decisionTitle,
        description: `Случайный выбор из ${options.length} вариантов`,
        options: options.map(opt => ({ text: opt })),
        chosenOption: winner,
        confidenceScore: 100, // Random choice is always 100% confident
        contextData: {
          spinResult,
          wheelOptions,
          totalOptions: options.length
        },
        createdAt: new Date().toISOString(),
        algorithm: 'Random Wheel'
      };

      addDecision(localDecision);
    } catch (error) {
      console.error('Failed to save random decision:', error);
    }
  };

  const resetWheel = () => {
    setCurrentRotation(0);
    setResult(null);
    setSpinning(false);
  };

  const newGame = () => {
    setTitle('');
    setOptions(['Вариант 1', 'Вариант 2', 'Вариант 3']);
    resetWheel();
  };

  useEffect(() => {
    drawWheel();
  }, [options, currentRotation]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            Колесо выбора
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<Casino />} 
              label="Честный случайный выбор" 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              icon={<Shuffle />} 
              label="Без предвзятости" 
              color="secondary" 
              variant="outlined" 
            />
          </Box>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Left Panel - Options */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              Настройка колеса
            </Typography>
            
            <TextField
              fullWidth
              label="Название (опционально)"
              placeholder="Например: Куда пойти на обед?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 3 }}
              disabled={spinning}
            />

            <Typography variant="subtitle1" gutterBottom>
              Варианты выбора:
            </Typography>

            {options.map((option, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: colors[index % colors.length],
                    flexShrink: 0
                  }}
                />
                <TextField
                  fullWidth
                  size="small"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  disabled={spinning}
                />
                <IconButton 
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 2 || spinning}
                  color="error"
                  size="small"
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}

            <Button
              fullWidth
              startIcon={<Add />}
              onClick={addOption}
              disabled={options.length >= 10 || spinning}
              variant="outlined"
              sx={{ mb: 2 }}
            >
              Добавить вариант
            </Button>

            <Button
              fullWidth
              startIcon={<Refresh />}
              onClick={resetWheel}
              disabled={spinning}
              variant="outlined"
            >
              Сбросить
            </Button>
          </Paper>
        </Grid>

        {/* Center - Wheel */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {spinning ? 'Крутим колесо...' : 'Нажмите на центр для запуска'}
            </Typography>

            <WheelContainer>
              <Pointer />
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  cursor: spinning ? 'wait' : 'pointer'
                }}
              />
              <SpinButton
                onClick={spin}
                disabled={spinning}
                size="large"
              >
                <PlayArrow sx={{ fontSize: '2rem' }} />
              </SpinButton>
            </WheelContainer>

            {result && (
              <Card 
                sx={{ 
                  mt: 3, 
                  p: 3, 
                  backgroundColor: 'success.main',
                  color: 'success.contrastText',
                  textAlign: 'center'
                }}
              >
                <EmojiEvents sx={{ fontSize: '3rem', mb: 1 }} />
                <Typography variant="h4" gutterBottom>
                  {result.winner}
                </Typography>
                <Typography variant="body1">
                  Колесо сделало {result.rotations.toFixed(1)} оборотов
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button 
                    variant="outlined" 
                    onClick={spin}
                    sx={{ 
                      color: 'inherit', 
                      borderColor: 'inherit',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Крутить снова
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={newGame}
                    sx={{ 
                      color: 'inherit', 
                      borderColor: 'inherit',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Новая игра
                  </Button>
                </Box>
              </Card>
            )}

            {!result && !spinning && (
              <Alert severity="info" sx={{ mt: 3 }}>
                <strong>Как использовать:</strong> Добавьте варианты в левой панели, 
                затем нажмите на центр колеса для случайного выбора. 
                Колесо использует истинную случайность без предвзятости.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RandomDecisionPage;
