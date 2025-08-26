import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Chip,
  styled
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  ExitToApp,
  Psychology
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(41, 150, 161, 0.15)' 
    : 'rgba(59, 130, 246, 0.08)',
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.8,
  },
});

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isDemo, logout } = useAuthStore();
  const { toggleSidebar, addToast } = useUIStore();

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    addToast({
      type: 'info',
      title: 'Выход выполнен',
      message: 'До свидания!'
    });
    navigate('/auth');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <StyledAppBar position="fixed" elevation={0}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <LogoContainer onClick={handleLogoClick} sx={{ flexGrow: 1 }}>
          <Psychology sx={{ mr: 1, fontSize: '2rem' }} />
          <Box>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 600,
                lineHeight: 1.2 
              }}
            >
              SmartChoice AI
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.8,
                lineHeight: 1 
              }}
            >
              {isDemo 
                ? 'Демо режим - локальное сохранение'
                : user?.name 
                  ? `Добро пожаловать, ${user.name}!`
                  : 'Принимайте решения с ИИ'
              }
            </Typography>
          </Box>
        </LogoContainer>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isDemo && (
            <Chip
              label="ДЕМО"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}

          <IconButton
            color="inherit"
            onClick={handleProfileClick}
            title="Профиль"
          >
            <AccountCircle />
          </IconButton>

          <Button
            color="inherit"
            startIcon={<ExitToApp />}
            onClick={handleLogout}
            size="small"
            title={isDemo ? 'Выйти из демо режима' : 'Выйти из аккаунта'}
          >
            Выход
          </Button>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;
