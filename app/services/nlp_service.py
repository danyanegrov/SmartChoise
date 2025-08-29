import re
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
                "confidence": 0.8  # Default confidence
            })
        return entities

    def _classify_intent(self, text: str) -> Tuple[str, float]:
        """Classify user intent from text"""
        # Simple rule-based intent classification
        text_lower = text.lower()
        
        # Define intent patterns
        intent_patterns = {
            "search": ["найти", "поиск", "искать", "показать", "что", "какой"],
            "compare": ["сравнить", "что лучше", "разница", "отличие"],
            "recommend": ["рекомендуй", "посоветуй", "что выбрать", "помоги"],
            "filter": ["фильтр", "только", "не больше", "не меньше", "цена"],
            "explain": ["объясни", "почему", "как", "что значит"]
        }
        
        max_score = 0
        best_intent = "search"  # Default intent
        
        for intent, patterns in intent_patterns.items():
            score = sum(1 for pattern in patterns if pattern in text_lower)
            if score > max_score:
                max_score = score
                best_intent = intent
        
        # Normalize confidence score
        confidence = min(max_score / 3, 1.0)  # Max confidence 1.0
        
        return best_intent, confidence

    async def _analyze_sentiment(self, text: str) -> Tuple[str, float]:
        """Analyze sentiment of the text"""
        try:
            # Use sentiment analyzer
            results = self.sentiment_analyzer(text)
            
            # Extract scores
            scores = results[0]
            positive_score = scores[0]['score']
            negative_score = scores[1]['score']
            neutral_score = scores[2]['score']
            
            # Determine sentiment
            if positive_score > negative_score and positive_score > neutral_score:
                sentiment = "positive"
                score = positive_score
            elif negative_score > positive_score and negative_score > neutral_score:
                sentiment = "negative"
                score = negative_score
            else:
                sentiment = "neutral"
                score = neutral_score
                
            return sentiment, score
            
        except Exception as e:
            logger.warning(f"Sentiment analysis failed: {e}")
            return "neutral", 0.5

    def _extract_filters(self, text: str, entities: List[Dict]) -> Dict[str, Any]:
        """Extract filters from text and entities"""
        filters = {}
        
        # Price filters
        price_pattern = r'(\d+)\s*(руб|рубл|₽)'
        price_matches = re.findall(price_pattern, text)
        if price_matches:
            filters["max_price"] = float(price_matches[0][0])
        
        # Category filters
        for entity in entities:
            if entity["label"] == "ORG" or entity["label"] == "PRODUCT":
                filters["category"] = entity["text"]
        
        # Rating filters
        if "высокий рейтинг" in text or "хороший отзыв" in text:
            filters["min_rating"] = 4.0
        
        return filters

    def _vectorize_text(self, text: str) -> np.ndarray:
        """Generate embedding vector for text"""
        try:
            embedding = self.embedder.encode(text)
            return embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            # Return zero vector as fallback
            return np.zeros(384)  # Default dimension for the model

# Global instance
nlp_processor = NLPProcessor()
