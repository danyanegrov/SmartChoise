import React from 'react';
import { Box, CircularProgress, Typography, styled } from '@mui/material';
import { keyframes } from '@mui/system';

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
}));

const BrainIcon = styled('div')(({ theme }) => ({
  fontSize: '4rem',
  marginBottom: theme.spacing(2),
  animation: `${pulseAnimation} 2s ease-in-out infinite`,
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

const LoadingScreen: React.FC = () => {
  return (
    <LoadingContainer>
      <BrainIcon>🧠</BrainIcon>
      <CircularProgress 
        size={60} 
        thickness={4}
        sx={{ 
          color: 'primary.main',
          marginBottom: 2 
        }}
      />
      <Typography 
        variant="h5" 
        component="h1" 
        gutterBottom
        sx={{ fontWeight: 600 }}
      >
        SmartChoice AI
      </Typography>
      <LoadingText variant="body2">
        Загружаем ваш персональный помощник принятия решений...
      </LoadingText>
    </LoadingContainer>
  );
};

export default LoadingScreen;
