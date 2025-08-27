import React from 'react';
import { PerplexityTester } from '../components/perplexity/PerplexityTester';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const PerplexityPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Perplexity AI Integration
        </h1>
        <p className="text-lg text-gray-600">
          Leverage the power of Perplexity AI to enhance your decision-making process with 
          real-time insights, market analysis, and expert advice.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>About Perplexity AI</CardTitle>
          <CardDescription>
            Perplexity AI provides real-time, accurate information and insights to help you make better decisions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Real-time Data</h3>
              <p className="text-sm text-blue-600">
                Access the latest information and market trends
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Expert Insights</h3>
              <p className="text-sm text-green-600">
                Get professional advice and analysis
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Decision Support</h3>
              <p className="text-sm text-purple-600">
                Enhance your decision-making with AI-powered insights
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PerplexityTester />
    </div>
  );
};
