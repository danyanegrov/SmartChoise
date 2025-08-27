import React, { useState } from 'react';
import { perplexityApiService, PerplexityResponse } from '../../services/perplexityApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';

export const PerplexityTester: React.FC = () => {
  const [testResult, setTestResult] = useState<PerplexityResponse | null>(null);
  const [decision, setDecision] = useState('');
  const [context, setContext] = useState('');
  const [decisionInsights, setDecisionInsights] = useState<PerplexityResponse | null>(null);
  const [topic, setTopic] = useState('');
  const [marketAnalysis, setMarketAnalysis] = useState<PerplexityResponse | null>(null);
  const [question, setQuestion] = useState('');
  const [expertAdvice, setExpertAdvice] = useState<PerplexityResponse | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [customResult, setCustomResult] = useState<PerplexityResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await perplexityApiService.testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getInsights = async () => {
    if (!decision.trim()) return;
    setLoading(true);
    try {
      const result = await perplexityApiService.getDecisionInsights(decision, context);
      setDecisionInsights(result);
    } catch (error) {
      setDecisionInsights({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getMarketAnalysis = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const result = await perplexityApiService.getMarketAnalysis(topic);
      setMarketAnalysis(result);
    } catch (error) {
      setMarketAnalysis({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getExpertAdvice = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const result = await perplexityApiService.getExpertAdvice(question);
      setExpertAdvice(result);
    } catch (error) {
      setExpertAdvice({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendCustomQuery = async () => {
    if (!customQuery.trim()) return;
    setLoading(true);
    try {
      const result = await perplexityApiService.customQuery(customQuery);
      setCustomResult(result);
    } catch (error) {
      setCustomResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (result: PerplexityResponse | null, title: string) => {
    if (!result) return null;
    
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant={result.success ? "default" : "destructive"}>
              {result.success ? "Success" : "Error"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.success ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Model: {result.model || 'N/A'} | 
                Tokens: {result.usage?.total_tokens || 'N/A'}
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <pre className="whitespace-pre-wrap text-sm">{result.data}</pre>
              </div>
            </div>
          ) : (
            <p className="text-red-600">{result.error}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perplexity API Integration Test</CardTitle>
          <CardDescription>
            Test the integration with Perplexity AI API for enhanced decision-making capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testConnection} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test API Connection'}
          </Button>
          {renderResult(testResult, 'Connection Test Result')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decision Insights</CardTitle>
          <CardDescription>
            Get AI-powered insights for your decisions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="decision">Decision</Label>
            <Input
              id="decision"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="Enter your decision..."
            />
          </div>
          <div>
            <Label htmlFor="context">Context (Optional)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Provide additional context..."
            />
          </div>
          <Button onClick={getInsights} disabled={loading || !decision.trim()}>
            {loading ? 'Getting Insights...' : 'Get Insights'}
          </Button>
          {renderResult(decisionInsights, 'Decision Insights')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Market Analysis</CardTitle>
          <CardDescription>
            Get comprehensive market analysis for any topic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic for market analysis..."
            />
          </div>
          <Button onClick={getMarketAnalysis} disabled={loading || !topic.trim()}>
            {loading ? 'Analyzing...' : 'Get Market Analysis'}
          </Button>
          {renderResult(marketAnalysis, 'Market Analysis')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expert Advice</CardTitle>
          <CardDescription>
            Get expert advice on any question
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your question..."
            />
          </div>
          <Button onClick={getExpertAdvice} disabled={loading || !question.trim()}>
            {loading ? 'Getting Advice...' : 'Get Expert Advice'}
          </Button>
          {renderResult(expertAdvice, 'Expert Advice')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Query</CardTitle>
          <CardDescription>
            Send a custom query to Perplexity AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customQuery">Custom Query</Label>
            <Textarea
              id="customQuery"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Enter your custom query..."
            />
          </div>
          <Button onClick={sendCustomQuery} disabled={loading || !customQuery.trim()}>
            {loading ? 'Sending...' : 'Send Query'}
          </Button>
          {renderResult(customResult, 'Custom Query Result')}
        </CardContent>
      </Card>
    </div>
  );
};
