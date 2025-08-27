import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  styled
} from '@mui/material';
import {
  Home,
  Psychology,
  AccountTree,
  Casino,
  Dashboard,
  History,
  Person,
  SmartToy
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { NavItem } from '@/types';

interface SidebarProps {
  open: boolean;
}

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: 240,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: 240,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    top: 64, // Account for header height
    height: 'calc(100vh - 64px)',
  },
}));

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Главная',
    icon: 'Home',
    path: '/'
  },
  {
    id: 'simple',
    label: 'Быстрое решение',
    icon: 'Psychology',
    path: '/decision/simple'
  },
  {
    id: 'complex',
    label: 'Сложный анализ',
    icon: 'AccountTree',
    path: '/decision/complex'
  },
  {
    id: 'random',
    label: 'Случайный выбор',
    icon: 'Casino',
    path: '/decision/random'
  },
  {
    id: 'dashboard',
    label: 'Аналитика',
    icon: 'Dashboard',
    path: '/dashboard'
  },
  {
    id: 'history',
    label: 'История',
    icon: 'History',
    path: '/history'
  },
  {
    id: 'profile',
    label: 'Профиль',
    icon: 'Person',
    path: '/profile'
  },
  {
    id: 'database',
    label: 'База данных',
    icon: 'Dashboard',
    path: '/database'
  },
  {
    id: 'perplexity',
    label: 'Perplexity AI',
    icon: 'SmartToy',
    path: '/perplexity'
  }
];

const iconComponents = {
  Home,
  Psychology,
  AccountTree,
  Casino,
  Dashboard,
  History,
  Person,
  SmartToy
};

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSidebarOpen } = useUIStore();

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <StyledDrawer
      variant="persistent"
      anchor="left"
      open={open}
    >
      <Box sx={{ overflow: 'auto', pt: 2 }}>
        <List>
          {navItems.slice(0, 4).map((item) => {
            const IconComponent = iconComponents[item.icon as keyof typeof iconComponents];
            const active = isActive(item.path);
            
            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={active}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'inherit',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <IconComponent />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: active ? 600 : 400
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <List>
          {navItems.slice(4).map((item) => {
            const IconComponent = iconComponents[item.icon as keyof typeof iconComponents];
            const active = isActive(item.path);
            
            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={active}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'inherit',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <IconComponent />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: active ? 600 : 400
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </StyledDrawer>
  );
};

export default Sidebar;
