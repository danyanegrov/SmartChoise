import pytest
import requests
import json
from app.services.nlp_service import nlp_processor
from app.services.recommendation_service import recommendation_engine

class TestAPI:
    """Integration tests for API endpoints"""

    BASE_URL = "http://localhost:8000/api/v1"

    def test_health_check(self):
        """Test health check endpoint"""
        response = requests.get(f"{self.BASE_URL}/health")
        assert response.status_code == 200

        data = response.json()
        assert "status" in data
        assert "services" in data

    def test_nlp_processing(self):
        """Test NLP processing endpoint"""
        payload = {
            "text": "Хочу купить игровой ноутбук до 100000 рублей",
            "user_context": {}
        }

        response = requests.post(f"{self.BASE_URL}/nlp/process", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert "intent" in data
        assert "entities" in data
        assert "embedding" in data
        assert data["intent"] == "purchase"

    def test_recommendations(self):
        """Test recommendations endpoint"""
        payload = {
            "query": "Посоветуй хороший ноутбук для работы",
            "filters": {"max_price": 80000},
            "limit": 5
        }

        response = requests.post(f"{self.BASE_URL}/recommendations", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert "recommendations" in data
        assert "intent" in data
        assert "processing_time_ms" in data
        assert len(data["recommendations"]) <= 5

class TestNLP:
    """Unit tests for NLP components"""

    def test_text_cleaning(self):
        """Test text preprocessing"""
        text = "Хочу купить НОУТБУК для работы!!!"
        cleaned = nlp_processor._clean_text(text)

        assert cleaned.islower()
        assert "ноутбук" in cleaned
        assert "!!!" not in cleaned

    def test_intent_classification(self):
        """Test intent classification"""
        test_cases = [
            ("Хочу купить ноутбук", "purchase"),
            ("Сравни iPhone и Samsung", "compare"),
            ("Посоветуй хороший ресторан", "recommend"),
            ("Найди автомобиль", "search")
        ]

        for text, expected_intent in test_cases:
            intent, confidence = nlp_processor._classify_intent(text)
            assert intent == expected_intent
            assert confidence > 0

    def test_entity_extraction(self):
        """Test entity extraction"""
        text = "Ноутбук до 50000 рублей в Москве"
        doc = nlp_processor.nlp(text)
        entities = nlp_processor._extract_entities(doc)

        # Should find price and location entities
        entity_texts = [e["text"] for e in entities]
        assert any("50000" in text for text in entity_texts)

class TestRecommendations:
    """Unit tests for recommendation engine"""

    @pytest.mark.asyncio
    async def test_recommendation_generation(self):
        """Test recommendation generation"""
        recommendations = await recommendation_engine.get_recommendations(
            user_id=None,
            query="игровой ноутбук",
            filters={"max_price": 100000},
            limit=3
        )

        assert "recommendations" in recommendations
        assert "intent" in recommendations
        assert "processing_time_ms" in recommendations
        assert len(recommendations["recommendations"]) <= 3

if __name__ == "__main__":
    pytest.main([__file__])
