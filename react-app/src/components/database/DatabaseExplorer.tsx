import React, { useState, useEffect } from 'react';
import { 
  DatabaseStats, 
  DatabaseCategory, 
  DatabaseDecision, 
  DatabaseCriteria,
  DatabaseSearchResult 
} from '@/types';
import apiService from '@/services/api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Database, 
  TrendingUp, 
  Users, 
  FileText,
  BarChart3,
  Filter,
  RefreshCw
} from 'lucide-react';

interface DatabaseExplorerProps {
  className?: string;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ className }) => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [categories, setCategories] = useState<DatabaseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [decisions, setDecisions] = useState<DatabaseDecision[]>([]);
  const [criteria, setCriteria] = useState<DatabaseCriteria[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DatabaseSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'decisions' | 'search'>('overview');

  useEffect(() => {
    loadDatabaseStats();
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadDecisionsByCategory(selectedCategory);
      loadCriteriaByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const loadDatabaseStats = async () => {
    try {
      setLoading(true);
      const statsData = await apiService.getDatabaseStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading database stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await apiService.getDecisionCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDecisionsByCategory = async (category: string) => {
    try {
      setLoading(true);
      const decisionsData = await apiService.getDecisionsByCategory(category, 20);
      setDecisions(decisionsData);
    } catch (error) {
      console.error('Error loading decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCriteriaByCategory = async (category: string) => {
    try {
      const criteriaData = await apiService.getDecisionCriteria(category);
      setCriteria(criteriaData);
    } catch (error) {
      console.error('Error loading criteria:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const results = await apiService.searchDatabase(searchQuery);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('Error searching database:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      await apiService.clearDatabaseCache();
      // Reload data
      loadDatabaseStats();
      loadCategories();
      if (selectedCategory) {
        loadDecisionsByCategory(selectedCategory);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего решений</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDecisions || 0}</div>
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
            <div className="text-2xl font-bold">{stats?.totalCategories || 0}</div>
            <p className="text-xs text-muted-foreground">
              Категорий решений
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Критерии</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCriteria || 0}</div>
            <p className="text-xs text-muted-foreground">
              Критериев оценки
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Профилей пользователей
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Статистика базы данных
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Последнее обновление:</span>
              <span className="font-mono text-sm">
                {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Неизвестно'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Всего результатов:</span>
              <span className="font-mono text-sm">{stats?.totalOutcomes || 0}</span>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={clearCache} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Очистить кэш
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === category.name ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedCategory(category.name)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <Badge variant={category.complexity === 'Высокая' ? 'destructive' : 
                           category.complexity === 'Средняя' ? 'secondary' : 'default'}>
                {category.complexity}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {category.description}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Примеры:</strong> {category.examples}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDecisions = () => (
    <div className="space-y-4">
      {selectedCategory && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Решения в категории: {selectedCategory}
          </h3>
          <Badge variant="outline">{decisions.length} решений</Badge>
        </div>
      )}

      {criteria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Критерии оценки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {criteria.map((criterion) => (
                <Badge key={criterion.id} variant="secondary">
                  {criterion.name} (вес: {criterion.weight})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {decisions.map((decision) => (
          <Card key={decision.id}>
            <CardHeader>
              <CardTitle className="text-base">{decision.scenario}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{decision.category}</Badge>
                <Badge variant="secondary">Сложность: {decision.metrics.complexity}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">
                <strong>Альтернатива:</strong> {decision.alternative}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <span className="text-xs text-muted-foreground">Общая оценка</span>
                  <div className="font-semibold">{decision.metrics.overallScore}/10</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Время решения</span>
                  <div className="font-semibold">{decision.metrics.decisionTime} мин</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Уверенность</span>
                  <div className="font-semibold">{decision.metrics.confidence}/10</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Риск</span>
                  <div className="font-semibold">{decision.metrics.risk}/10</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Тревожность:</span>
                  <Badge variant={decision.factors.anxiety === 'Высокая' ? 'destructive' : 
                               decision.factors.anxiety === 'Средняя' ? 'secondary' : 'default'}>
                    {decision.factors.anxiety}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Важность:</span>
                  <Badge variant={decision.factors.importance === 'Критическая' ? 'destructive' : 
                               decision.factors.importance === 'Высокая' ? 'secondary' : 'default'}>
                    {decision.factors.importance}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Поиск по базе данных..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          Поиск
        </Button>
      </div>

      {searchResults && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="font-medium">
              Найдено {searchResults.totalResults} результатов для "{searchResults.query}"
            </span>
          </div>

          {searchResults.results.decisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Решения ({searchResults.results.decisions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchResults.results.decisions.slice(0, 5).map((decision) => (
                    <div key={decision.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{decision.scenario}</div>
                      <div className="text-sm text-muted-foreground">{decision.alternative}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{decision.category}</Badge>
                        <Badge variant="secondary">{decision.metrics.overallScore}/10</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {searchResults.results.categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Категории ({searchResults.results.categories.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {searchResults.results.categories.map((category) => (
                    <Badge key={category.id} variant="outline">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {searchResults.results.criteria.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Критерии ({searchResults.results.criteria.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {searchResults.results.criteria.map((criterion) => (
                    <Badge key={criterion.id} variant="secondary">
                      {criterion.name} ({criterion.category})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Исследователь базы данных</h2>
        <p className="text-muted-foreground">
          Изучите базу данных решений, категории, критерии и найдите похожие случаи
        </p>
      </div>

      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          Обзор
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'outline'}
          onClick={() => setActiveTab('categories')}
        >
          Категории
        </Button>
        <Button
          variant={activeTab === 'decisions' ? 'default' : 'outline'}
          onClick={() => setActiveTab('decisions')}
          disabled={!selectedCategory}
        >
          Решения
        </Button>
        <Button
          variant={activeTab === 'search' ? 'default' : 'outline'}
          onClick={() => setActiveTab('search')}
        >
          Поиск
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Загрузка...</span>
        </div>
      )}

      {!loading && (
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'categories' && renderCategories()}
          {activeTab === 'decisions' && renderDecisions()}
          {activeTab === 'search' && renderSearch()}
        </div>
      )}
    </div>
  );
};
