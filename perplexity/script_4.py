# Создаем NLP сервис

nlp_service_content = '''import re
import spacy
import asyncio
from typing import Dict, List, Tuple, Any
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import numpy as np
from loguru import logger
from app.core.config import settings
from app.models.schemas import NLPResponse, Entity

class NLPProcessor:
    def __init__(self):
        self.nlp = None
        self.embedder = None
        self.sentiment_analyzer = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize all NLP models"""
        try:
            # Load spaCy model for Russian
            self.nlp = spacy.load(settings.SPACY_MODEL)
            logger.info("SpaCy model loaded successfully")
            
            # Load sentence transformer
            self.embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info("Sentence transformer loaded successfully")
            
            # Load sentiment analyzer
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis", 
                model="blanchefort/rubert-base-cased-sentiment",
                return_all_scores=True
            )
            logger.info("Sentiment analyzer loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load NLP models: {e}")
            raise
    
    async def process_query(self, text: str, user_context: Dict = {}) -> Dict:
        """Main method to process user query"""
        try:
            # Clean text
            cleaned_text = self._clean_text(text)
            
            # Tokenize
            doc = self.nlp(cleaned_text)
            tokens = [token.lemma_.lower() for token in doc if not token.is_stop and not token.is_punct]
            
            # Extract entities
            entities = self._extract_entities(doc)
            
            # Classify intent
            intent, intent_confidence = self._classify_intent(cleaned_text)
            
            # Analyze sentiment
            sentiment, sentiment_score = await self._analyze_sentiment(cleaned_text)
            
            # Extract filters
            filters = self._extract_filters(cleaned_text, entities)
            
            # Generate embedding
            embedding = self._vectorize_text(cleaned_text)
            
            return {
                "original_text": text,
                "cleaned_text": cleaned_text,
                "tokens": tokens,
                "entities": entities,
                "intent": intent,
                "intent_confidence": intent_confidence,
                "sentiment": sentiment,
                "sentiment_score": sentiment_score,
                "filters": filters,
                "embedding": embedding.tolist()
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            raise
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep Russian, English, numbers, and basic punctuation
        text = re.sub(r'[^\w\s\-.,!?а-яё]', '', text, flags=re.UNICODE)
        
        return text
    
    def _extract_entities(self, doc) -> List[Dict]:
        """Extract named entities from spaCy doc"""
        entities = []
        
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
                "confidence": 1.0  # spaCy doesn't provide confidence scores by default
            })
        
        # Extract custom entities (products, brands, etc.)
        custom_entities = self._extract_custom_entities(doc.text)
        entities.extend(custom_entities)
        
        return entities
    
    def _extract_custom_entities(self, text: str) -> List[Dict]:
        """Extract custom entities like products, brands"""
        entities = []
        
        # Product patterns
        product_patterns = [
            r'(ноутбук|laptop|компьютер|pc)',
            r'(телефон|смартфон|phone|iphone|samsung)',
            r'(автомобиль|машина|car|авто)',
            r'(квартира|дом|apartment|house)',
            r'(ресторан|кафе|restaurant|cafe)'
        ]
        
        for pattern in product_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                entities.append({
                    "text": match.group(),
                    "label": "PRODUCT",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.9
                })
        
        # Price patterns
        price_patterns = [
            r'(\d+(?:\s?\d{3})*)\s*(?:руб|рублей?|₽)',
            r'(\d+(?:\.\d{3})*)\s*(?:долларов?|\$)',
            r'до\s+(\d+(?:\s?\d{3})*)',
            r'(\d+(?:\s?\d{3})*)\s*-\s*(\d+(?:\s?\d{3})*)'
        ]
        
        for pattern in price_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                entities.append({
                    "text": match.group(),
                    "label": "MONEY",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.95
                })
        
        return entities
    
    def _classify_intent(self, text: str) -> Tuple[str, float]:
        """Classify user intent"""
        
        intent_patterns = {
            "purchase": [
                r'\b(купить|покупать|приобрести|нужен|нужна|нужно)\b',
                r'\b(хочу|желаю|планирую)\s+(купить|приобрести)\b',
                r'\b(подобрать|выбрать|найти)\b.*\b(для\s+покупки|купить)\b'
            ],
            "compare": [
                r'\b(сравни|сравнить|сравнение)\b',
                r'\b(что\s+лучше|какой\s+лучше)\b',
                r'\b(отличия|разница|различия)\b',
                r'\b(vs|против|\sили\s)\b'
            ],
            "recommend": [
                r'\b(посоветуй|посоветовать|порекомендуй|рекомендация)\b',
                r'\b(что\s+выбрать|как\s+выбрать)\b',
                r'\b(лучший|оптимальный|подходящий)\b',
                r'\b(помоги\s+выбрать|помощь\s+в\s+выборе)\b'
            ],
            "information": [
                r'\b(расскажи|информация|узнать|что\s+это)\b',
                r'\b(характеристики|описание|детали)\b',
                r'\b(как\s+работает|принцип\s+работы)\b'
            ],
            "search": [
                r'\b(найди|найти|поиск|искать)\b',
                r'\b(где\s+купить|где\s+найти)\b',
                r'\b(магазин|shop|store)\b'
            ]
        }
        
        intent_scores = {}
        
        for intent, patterns in intent_patterns.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    score += 1
            intent_scores[intent] = score / len(patterns)
        
        # Get best intent
        best_intent = max(intent_scores, key=intent_scores.get)
        confidence = intent_scores[best_intent]
        
        # If no clear intent, default to search
        if confidence < 0.1:
            best_intent = "search"
            confidence = 0.5
        
        return best_intent, confidence
    
    async def _analyze_sentiment(self, text: str) -> Tuple[str, float]:
        """Analyze sentiment of the text"""
        try:
            results = self.sentiment_analyzer(text)[0]
            
            # Find the sentiment with highest score
            best_sentiment = max(results, key=lambda x: x['score'])
            
            # Map labels
            sentiment_map = {
                'POSITIVE': 'positive',
                'NEGATIVE': 'negative', 
                'NEUTRAL': 'neutral'
            }
            
            sentiment = sentiment_map.get(best_sentiment['label'], 'neutral')
            score = best_sentiment['score']
            
            return sentiment, score
            
        except Exception as e:
            logger.warning(f"Sentiment analysis failed: {e}")
            return "neutral", 0.5
    
    def _extract_filters(self, text: str, entities: List[Dict]) -> Dict[str, Any]:
        """Extract filters from text and entities"""
        filters = {}
        
        # Extract price filters
        price_matches = re.findall(r'до\s+(\d+(?:\s?\d{3})*)', text, re.IGNORECASE)
        if price_matches:
            filters['max_price'] = int(price_matches[0].replace(' ', ''))
        
        price_range = re.search(r'(\d+(?:\s?\d{3})*)\s*-\s*(\d+(?:\s?\d{3})*)', text)
        if price_range:
            filters['min_price'] = int(price_range.group(1).replace(' ', ''))
            filters['max_price'] = int(price_range.group(2).replace(' ', ''))
        
        # Extract category from entities
        product_entities = [e for e in entities if e['label'] == 'PRODUCT']
        if product_entities:
            product_text = product_entities[0]['text'].lower()
            category_map = {
                'ноутбук': 'laptops',
                'телефон': 'phones',
                'смартфон': 'phones',
                'автомобиль': 'cars',
                'машина': 'cars',
                'квартира': 'real_estate',
                'ресторан': 'restaurants'
            }
            filters['category'] = category_map.get(product_text)
        
        # Extract purpose/usage
        purpose_patterns = {
            'gaming': r'\b(игр|геймин|gaming|game)\b',
            'work': r'\b(работ|офис|бизнес|work|office)\b',
            'study': r'\b(учеб|студент|school|university)\b',
            'travel': r'\b(путешеств|отпуск|travel|vacation)\b'
        }
        
        for purpose, pattern in purpose_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                filters['purpose'] = purpose
                break
        
        return filters
    
    def _vectorize_text(self, text: str) -> np.ndarray:
        """Create vector representation of text"""
        try:
            embedding = self.embedder.encode(text)
            return embedding
        except Exception as e:
            logger.error(f"Vectorization failed: {e}")
            # Return zero vector as fallback
            return np.zeros(384)

# Global NLP processor instance
nlp_processor = NLPProcessor()

async def process_nlp_request(text: str, user_context: Dict = {}) -> Dict:
    """Process NLP request"""
    return await nlp_processor.process_query(text, user_context)
'''

# Создаем сервисы
os.makedirs("app/services", exist_ok=True)

with open("app/services/__init__.py", "w") as f:
    f.write("")

with open("app/services/nlp_service.py", "w", encoding="utf-8") as f:
    f.write(nlp_service_content)

print("✅ NLP сервис создан:")
print("- app/services/nlp_service.py")