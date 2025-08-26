import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  IconButton,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  Avatar,
  Chip,
  Alert,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Person, 
  ArrowBack,
  Edit,
  Save,
  Settings,
  Palette,
  Security,
  Notifications,
  Download,
  Delete,
  Info
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useDecisionStore } from '@/store/useDecisionStore';
import { apiService } from '@/services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isDemo, setUser, logout } = useAuthStore();
  const { theme, setTheme, addToast } = useUIStore();
  const { decisions } = useDecisionStore();

  const [tabValue, setTabValue] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    age: user?.age || '',
    personalityType: user?.personalityType || '',
    anxietyLevel: user?.anxietyLevel || 5,
    preferences: {
      data: true,
      intuition: true,
      speed: false,
      consultation: false
    }
  });

  // Theme settings
  const [themeSettings, setThemeSettings] = useState({
    mode: theme.mode,
    primaryColor: theme.primaryColor,
    borderRadius: theme.borderRadius,
    fontSize: theme.fontSize
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    decisions: true,
    insights: true,
    reminders: false,
    updates: true
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileSave = async () => {
    if (!user || isDemo) {
      // Demo mode - just update local state
      setUser({
        ...user!,
        name: profileForm.name,
        age: profileForm.age ? parseInt(profileForm.age.toString()) : undefined,
        personalityType: profileForm.personalityType as any,
        anxietyLevel: profileForm.anxietyLevel,
        preferences: profileForm.preferences
      });
      addToast({
        type: 'success',
        title: 'Профиль обновлен',
        message: 'Изменения сохранены локально'
      });
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const updatedProfile = await apiService.updateProfile({
        name: profileForm.name,
        age: profileForm.age ? parseInt(profileForm.age.toString()) : undefined,
        personalityType: profileForm.personalityType as any,
        anxietyLevel: profileForm.anxietyLevel,
        preferences: profileForm.preferences
      });
      
      setUser(updatedProfile.user);
      addToast({
        type: 'success',
        title: 'Профиль обновлен',
        message: 'Изменения успешно сохранены'
      });
      setEditing(false);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Ошибка сохранения',
        message: 'Не удалось обновить профиль'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (key: string, value: any) => {
    const newTheme = { ...themeSettings, [key]: value };
    setThemeSettings(newTheme);
    setTheme(newTheme);
  };

  const exportData = () => {
    const exportData = {
      profile: user,
      decisions: decisions,
      preferences: profileForm.preferences,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartchoice-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addToast({
      type: 'success',
      title: 'Данные экспортированы',
      message: 'Файл с вашими данными загружен'
    });
  };

  const deleteAllData = () => {
    if (window.confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
      localStorage.clear();
      addToast({
        type: 'info',
        title: 'Данные удалены',
        message: 'Все локальные данные очищены'
      });
      logout();
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            Настройки профиля
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isDemo ? 'Демо режим - настройки сохраняются локально' : 'Персонализируйте ваш опыт'}
          </Typography>
        </Box>
      </Box>

      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mr: 3,
                bgcolor: 'primary.main',
                fontSize: '2rem'
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : '👤'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" gutterBottom>
                {user?.name || 'Пользователь'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {isDemo && <Chip label="Демо режим" color="warning" size="small" />}
                {user?.personalityType && (
                  <Chip 
                    label={user.personalityType === 'introvert' ? 'Интроверт' : 
                           user.personalityType === 'extrovert' ? 'Экстраверт' : 'Амбиверт'} 
                    size="small" 
                  />
                )}
                <Chip label={`${decisions.length} решений`} size="small" />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable">
          <Tab icon={<Person />} label="Профиль" />
          <Tab icon={<Palette />} label="Тема" />
          <Tab icon={<Notifications />} label="Уведомления" />
          <Tab icon={<Security />} label="Данные" />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Личная информация
            </Typography>
            <Button
              startIcon={editing ? <Save /> : <Edit />}
              onClick={editing ? handleProfileSave : () => setEditing(true)}
              disabled={saving}
              variant={editing ? 'contained' : 'outlined'}
            >
              {editing ? (saving ? 'Сохранение...' : 'Сохранить') : 'Редактировать'}
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Имя"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={!editing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Возраст"
                type="number"
                value={profileForm.age}
                onChange={(e) => setProfileForm(prev => ({ ...prev, age: e.target.value }))}
                disabled={!editing}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth disabled={!editing}>
                <InputLabel>Тип личности</InputLabel>
                <Select
                  value={profileForm.personalityType}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, personalityType: e.target.value }))}
                  label="Тип личности"
                >
                  <MenuItem value="">Не указан</MenuItem>
                  <MenuItem value="introvert">Интроверт</MenuItem>
                  <MenuItem value="extrovert">Экстраверт</MenuItem>
                  <MenuItem value="ambivert">Амбиверт</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Уровень тревожности: {profileForm.anxietyLevel}
              </Typography>
              <Slider
                value={profileForm.anxietyLevel}
                onChange={(_, value) => setProfileForm(prev => ({ ...prev, anxietyLevel: value as number }))}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
                disabled={!editing}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Предпочтения в принятии решений
          </Typography>
          <Grid container spacing={2}>
            {[
              { key: 'data', label: 'Опираться на данные', description: 'Предпочитаете фактическую информацию' },
              { key: 'intuition', label: 'Доверять интуиции', description: 'Учитываете внутренние ощущения' },
              { key: 'speed', label: 'Быстрые решения', description: 'Предпочитаете не затягивать с выбором' },
              { key: 'consultation', label: 'Консультации', description: 'Любите обсуждать с другими' }
            ].map((pref) => (
              <Grid item xs={12} sm={6} key={pref.key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profileForm.preferences[pref.key as keyof typeof profileForm.preferences]}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, [pref.key]: e.target.checked }
                      }))}
                      disabled={!editing}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{pref.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pref.description}
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Theme Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Настройки внешнего вида
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Тема</InputLabel>
                <Select
                  value={themeSettings.mode}
                  onChange={(e) => handleThemeChange('mode', e.target.value)}
                  label="Тема"
                >
                  <MenuItem value="light">Светлая</MenuItem>
                  <MenuItem value="dark">Темная</MenuItem>
                  <MenuItem value="auto">Автоматически</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Размер шрифта</InputLabel>
                <Select
                  value={themeSettings.fontSize}
                  onChange={(e) => handleThemeChange('fontSize', e.target.value)}
                  label="Размер шрифта"
                >
                  <MenuItem value="small">Маленький</MenuItem>
                  <MenuItem value="medium">Средний</MenuItem>
                  <MenuItem value="large">Большой</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Скругление углов: {themeSettings.borderRadius}px
              </Typography>
              <Slider
                value={themeSettings.borderRadius}
                onChange={(_, value) => handleThemeChange('borderRadius', value)}
                min={0}
                max={20}
                valueLabelDisplay="auto"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Настройки уведомлений
          </Typography>
          
          <List>
            {[
              { key: 'decisions', label: 'Уведомления о решениях', description: 'Получать уведомления при создании решений' },
              { key: 'insights', label: 'ИИ инсайты', description: 'Персональные рекомендации и анализ' },
              { key: 'reminders', label: 'Напоминания', description: 'Напоминания о важных решениях' },
              { key: 'updates', label: 'Обновления', description: 'Новости о новых функциях' }
            ].map((setting) => (
              <ListItem key={setting.key}>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText
                  primary={setting.label}
                  secondary={setting.description}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notifications[setting.key as keyof typeof notifications]}
                    onChange={(e) => setNotifications(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Data Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Управление данными
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Ваши данные:</strong> {decisions.length} решений, создан {new Date(user?.createdAt || '').toLocaleDateString('ru-RU')}
          </Alert>

          <List>
            <ListItem>
              <ListItemIcon>
                <Download />
              </ListItemIcon>
              <ListItemText
                primary="Экспорт данных"
                secondary="Скачать все ваши данные в формате JSON"
              />
              <ListItemSecondaryAction>
                <Button variant="outlined" onClick={exportData}>
                  Скачать
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Info />
              </ListItemIcon>
              <ListItemText
                primary="Политика конфиденциальности"
                secondary="Как мы обрабатываем ваши данные"
              />
              <ListItemSecondaryAction>
                <Button variant="outlined">
                  Читать
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                <Delete color="error" />
              </ListItemIcon>
              <ListItemText
                primary="Удалить все данные"
                secondary="Удалить аккаунт и все данные безвозвратно"
              />
              <ListItemSecondaryAction>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={deleteAllData}
                >
                  Удалить
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
