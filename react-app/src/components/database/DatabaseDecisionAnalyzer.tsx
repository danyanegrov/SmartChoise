import React, { useState, useEffect } from 'react';
import { 
  DecisionOption, 
  UserProfile, 
  DatabaseAnalysisResult,
  DatabaseCategory,
  DatabaseCriteria
} from '@/types';
import { databaseDecisionAnalyzer } from '@/services/enhancedAlgorithms';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  Database, 
  TrendingUp, 
  Users, 
  FileText,
  BarChart3,
  Lightbulb,
  Search,
  Plus,
  Trash2
} from 'lucide-react';

interface DatabaseDecisionAnalyzerProps {
  className?: string;
  userProfile?: UserProfile;
}

export const DatabaseDecisionAnalyzer: React.FC<DatabaseDecisionAnalyzerProps> = ({ 
  className, 
  userProfile 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<DecisionOption[]>([
    { text: '', rating: 3 }
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<DatabaseCategory[]>([]);
  const [criteria, setCriteria] = useState<DatabaseCriteria[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<Record<string, number>>({});
  const [analysisResult, setAnalysisResult] = useState<DatabaseAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCriteriaByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const categoriesData = await databaseDecisionAnalyzer.getDecisionCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCriteriaByCategory = async (category: string) => {
    try {
      const criteriaData = await databaseDecisionAnalyzer.getDecisionCriteria(category);
      setCriteria(criteriaData);
      
      // Initialize criteria weights
      const initialWeights: Record<string, number> = {};
      criteriaData.forEach(criterion => {
        initialWeights[criterion.name] = criterion.weight;
      });
      setSelectedCriteria(initialWeights);
    } catch (error) {
      console.error('Error loading criteria:', error);
    }
  };

  const addOption = () => {
    setOptions([...options, { text: '', rating: 3 }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: keyof DecisionOption, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const updateCriteriaWeight = (criterionName: string, weight: number) => {
    setSelectedCriteria(prev => ({
      ...prev,
      [criterionName]: weight
    }));
  };

  const analyzeDecision = async () => {
    if (!title.trim() || options.some(opt => !opt.text.trim())) {
      alert('Пожалуйста, заполните заголовок и все варианты');
      return;
    }

    try {
      setLoading(true);
      const result = await databaseDecisionAnalyzer.analyzeDecision({
        title,
        description,
        options,
        userProfile,
        context: {
          category: selectedCategory,
          timeOfDay: new Date().getHours(),
          criteria: selectedCriteria
        },
        criteria: selectedCriteria
      });
      
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing decision:', error);
      alert('Ошибка при анализе решения. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Результаты анализа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {analysisResult.databaseStats.similarDecisionsFound}
                </div>
                <div className="text-sm text-muted-foreground">Похожих решений</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {analysisResult.databaseStats.totalRecommendations}
                </div>
                <div className="text-sm text-muted-foreground">Рекомендаций</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {analysisResult.databaseStats.expertInsightsAvailable}
                </div>
                <div className="text-sm text-muted-foreground">Экспертных оценок</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Анализ вариантов:</h4>
              {analysisResult.options.map((option, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{option.text}</h5>
                      <Badge variant="outline" className="text-lg">
                        {option.score.toFixed(1)}/10
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {option.reasoning}
                    </p>
                    {option.databaseInsights && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-2">Инсайты из базы данных:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Категория:</span>
                            <Badge variant="secondary" className="ml-1">
                              {option.databaseInsights.category}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Сложность:</span>
                            <Badge variant="secondary" className="ml-1">
                              {option.databaseInsights.metrics.complexity}/10
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {analysisResult.recommendations.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Рекомендации из базы данных:</h4>
                <div className="space-y-2">
                  {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{rec.scenario}</span>
                        <Badge variant="outline">{rec.score.toFixed(1)}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{rec.alternative}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{rec.category}</Badge>
                        <Badge variant="outline">Сложность: {rec.metrics.complexity}/10</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.expertInsights.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Экспертные оценки:</h4>
                <div className="space-y-2">
                  {analysisResult.expertInsights.map((insight, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{insight.expertise}</span>
                        <Badge variant="outline">Уверенность: {insight.confidence}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        <strong>Риски:</strong> {insight.risks}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Подход:</strong> {insight.approach}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Анализатор решений с базой данных</h2>
        <p className="text-muted-foreground">
          Проанализируйте ваше решение, используя знания из базы данных и экспертные оценки
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Описание решения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Заголовок решения *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Опишите вашу проблему кратко"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Подробное описание</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Расскажите подробнее о ситуации..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Категория решения</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Варианты решения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(index, 'text', e.target.value)}
                      placeholder={`Вариант ${index + 1}`}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={option.rating}
                      onChange={(e) => updateOption(index, 'rating', parseInt(e.target.value))}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={options.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button onClick={addOption} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Добавить вариант
              </Button>
            </CardContent>
          </Card>

          {showAdvanced && selectedCategory && criteria.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Критерии оценки
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {criteria.map((criterion) => (
                  <div key={criterion.id} className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">{criterion.name}</Label>
                      <p className="text-xs text-muted-foreground">{criterion.description}</p>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={selectedCriteria[criterion.name] || criterion.weight}
                        onChange={(e) => updateCriteriaWeight(criterion.name, parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => setShowAdvanced(!showAdvanced)} 
              variant="outline"
            >
              {showAdvanced ? 'Скрыть' : 'Показать'} расширенные настройки
            </Button>
            <Button 
              onClick={analyzeDecision} 
              disabled={loading || !title.trim() || options.some(opt => !opt.text.trim())}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Анализирую...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Анализировать решение
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div>
          {renderAnalysisResult()}
        </div>
      </div>
    </div>
  );
};
