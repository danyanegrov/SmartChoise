import axios from 'axios';

class PerplexityService {
    constructor() {
        this.apiKey = process.env.PERPLEXITY_API_KEY || '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';
        this.baseURL = 'https://api.perplexity.ai';
        
        if (!this.apiKey) {
            console.error('⚠️ PERPLEXITY_API_KEY not found in environment variables');
        }
    }

    async query(query, model = 'llama-3.1-sonar-large-128k-online') {
        try {
            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant that provides accurate and helpful information.'
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                max_tokens: 1024,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                data: response.data.choices[0].message.content,
                model: model,
                usage: response.data.usage
            };
        } catch (error) {
            console.error('Perplexity API Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    async getDecisionInsights(decision, context) {
        const query = `Analyze this decision: "${decision}" with context: "${context}". Provide insights, potential risks, and recommendations based on best practices.`;
        return await this.query(query);
    }

    async getMarketAnalysis(topic) {
        const query = `Provide a comprehensive market analysis for: "${topic}". Include trends, opportunities, and risks.`;
        return await this.query(query);
    }

    async getExpertAdvice(question) {
        const query = `Provide expert advice on: "${question}". Give practical, actionable recommendations.`;
        return await this.query(query);
    }
}

const perplexityService = new PerplexityService();
export default perplexityService;
