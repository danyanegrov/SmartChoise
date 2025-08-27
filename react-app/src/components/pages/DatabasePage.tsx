import React, { useState } from 'react';
import { DatabaseExplorer } from '@/components/database/DatabaseExplorer';
import { DatabaseDecisionAnalyzer } from '@/components/database/DatabaseDecisionAnalyzer';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Database, 
  Brain, 
  Search, 
  TrendingUp, 
  Users, 
  FileText,
  BarChart3,
  Lightbulb
} from 'lucide-react';

export const DatabasePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'analyzer'>('explorer');
  const { user } = useAuthStore();

  const tabs = [
    {
      id: 'explorer',
      label: 'Исследователь базы данных',
      icon: Database,
      description: 'Изучите структуру базы данных, категории и критерии'
    },
    {
      id: 'analyzer',
      label: 'Анализатор решений',
      icon: Brain,
      description: 'Анализируйте ваши решения с помощью базы знаний'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">База данных решений</h1>
        <p className="text-xl text-muted-foreground">
          Интегрированная система поддержки принятия решений на основе реальных данных
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">База знаний</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">389+</div>
            <p className="text-xs text-muted-foreground">
              Решений в базе данных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Категории</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Жизненных категорий
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Критерии</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96</div>
            <p className="text-xs text-muted-foreground">
              Критериев оценки
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Эксперты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">116</div>
            <p className="text-xs text-muted-foreground">
              Экспертных оценок
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id as 'explorer' | 'analyzer')}
              className="flex items-center gap-2 px-6 py-3"
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'explorer' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Исследователь базы данных</h2>
              <p className="text-muted-foreground">
                Изучите структуру базы данных, просматривайте категории решений, критерии оценки и находите похожие случаи для анализа.
              </p>
            </div>
            <DatabaseExplorer />
          </div>
        )}

        {activeTab === 'analyzer' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Анализатор решений</h2>
              <p className="text-muted-foreground">
                Проанализируйте ваши решения, используя знания из базы данных, экспертные оценки и алгоритмы машинного обучения.
              </p>
            </div>
            <DatabaseDecisionAnalyzer userProfile={user} />
          </div>
        )}
      </div>

      {/* Database Benefits */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Преимущества интегрированной базы данных</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Реальные данные</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                База содержит 389 реальных решений с результатами, что позволяет давать обоснованные рекомендации
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Экспертные оценки</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                116 экспертных оценок по различным областям знаний для повышения качества рекомендаций
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Персонализация</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Учет профиля пользователя, уровня тревожности и предпочтений для адаптации рекомендаций
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Поиск похожих случаев</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Алгоритмы поиска находят похожие решения для анализа и сравнения вариантов
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Многокритериальный анализ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                96 критериев оценки для комплексного анализа решений по различным аспектам
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Умные алгоритмы</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Интеграция с алгоритмами AHP, TOPSIS и контекстными бандитами для точных рекомендаций
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
