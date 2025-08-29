import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock
import json
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.main import app
from app.core.config import get_settings
from app.services.nlp_service import NLPProcessor
from app.services.recommendation_service import RecommendationEngine
from app.services.vector_service import VectorService

# Test client
client = TestClient(app)

# Mock data
SAMPLE_QUERY = "Найди ноутбук для работы"
SAMPLE_USER_ID = 1
SAMPLE_FILTERS = {"max_price": 100000, "min_rating": 4.0}

class TestHealthCheck:
    """Test health check endpoints"""
    
    def test_health_check(self):
        """Test basic health check"""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
    
    def test_health_detailed(self):
        """Test detailed health check"""
        response = client.get("/api/v1/health/detailed")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "database" in data["checks"]
        assert "redis" in data["checks"]
        assert "milvus" in data["checks"]

class TestNLPProcessing:
    """Test NLP service endpoints"""
    
    @patch('app.services.nlp_service.NLPProcessor')
    def test_nlp_process_success(self, mock_nlp_class):
        """Test successful NLP processing"""
        # Mock NLP processor
        mock_nlp = Mock()
        mock_nlp.process_query.return_value = {
            "original_text": SAMPLE_QUERY,
            "cleaned_text": "найди ноутбук для работы",
            "tokens": ["найди", "ноутбук", "для", "работы"],
            "intent": "search",
            "intent_confidence": 0.95,
            "sentiment": "neutral",
            "sentiment_score": 0.0,
            "entities": [
                {"text": "ноутбук", "label": "PRODUCT", "start": 7, "end": 14}
            ],
            "filters": {"product_type": "ноутбук"},
            "embedding": [0.1, 0.2, 0.3] * 100  # 300 dimensions
        }
        mock_nlp_class.return_value = mock_nlp
        
        response = client.post("/api/v1/nlp/process", json={
            "text": SAMPLE_QUERY,
            "user_context": {}
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["original_text"] == SAMPLE_QUERY
        assert data["intent"] == "search"
        assert data["intent_confidence"] == 0.95
    
    def test_nlp_process_empty_text(self):
        """Test NLP processing with empty text"""
        response = client.post("/api/v1/nlp/process", json={
            "text": "",
            "user_context": {}
        })
        assert response.status_code == 400
    
    def test_nlp_process_invalid_json(self):
        """Test NLP processing with invalid JSON"""
        response = client.post("/api/v1/nlp/process", json={
            "invalid_field": "value"
        })
        assert response.status_code == 422

class TestRecommendations:
    """Test recommendation endpoints"""
    
    @patch('app.services.recommendation_service.RecommendationEngine')
    def test_get_recommendations_success(self, mock_rec_class):
        """Test successful recommendation generation"""
        # Mock recommendation engine
        mock_rec = Mock()
        mock_rec.get_recommendations.return_value = {
            "query": SAMPLE_QUERY,
            "processed_query": "найди ноутбук для работы",
            "intent": "search",
            "total_found": 5,
            "recommendations": [
                {
                    "item": {
                        "id": 1,
                        "name": "MacBook Pro 13",
                        "description": "Мощный ноутбук для работы",
                        "price": 150000,
                        "rating": 4.8
                    },
                    "confidence": 0.95,
                    "explanation": "Отличный выбор для работы благодаря высокой производительности",
                    "reasoning_factors": ["performance", "reliability"]
                }
            ],
            "processing_time_ms": 245,
            "query_id": "test_query_123"
        }
        mock_rec_class.return_value = mock_rec
        
        response = client.post("/api/v1/recommendations", json={
            "query": SAMPLE_QUERY,
            "user_id": SAMPLE_USER_ID,
            "filters": SAMPLE_FILTERS,
            "limit": 10
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_found"] == 5
        assert len(data["recommendations"]) == 1
        assert data["recommendations"][0]["item"]["name"] == "MacBook Pro 13"
    
    def test_get_recommendations_missing_query(self):
        """Test recommendations without query"""
        response = client.post("/api/v1/recommendations", json={
            "user_id": SAMPLE_USER_ID,
            "filters": SAMPLE_FILTERS
        })
        assert response.status_code == 422
    
    def test_get_recommendations_invalid_filters(self):
        """Test recommendations with invalid filters"""
        response = client.post("/api/v1/recommendations", json={
            "query": SAMPLE_QUERY,
            "filters": {"invalid_filter": "value"}
        })
        assert response.status_code == 200  # Should still work with invalid filters

class TestSearch:
    """Test search endpoints"""
    
    @patch('app.services.recommendation_service.RecommendationEngine')
    def test_search_items_success(self, mock_rec_class):
        """Test successful item search"""
        # Mock search results
        mock_rec = Mock()
        mock_rec._semantic_search.return_value = [
            {
                "id": 1,
                "name": "MacBook Pro 13",
                "description": "Мощный ноутбук для работы",
                "price": 150000,
                "rating": 4.8,
                "category_id": 1,
                "similarity_score": 0.95
            }
        ]
        mock_rec_class.return_value = mock_rec
        
        response = client.get("/api/v1/search", params={
            "query": "ноутбук",
            "limit": 10
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "MacBook Pro 13"
    
    def test_search_with_filters(self):
        """Test search with price filters"""
        response = client.get("/api/v1/search", params={
            "query": "ноутбук",
            "min_price": 50000,
            "max_price": 200000
        })
        assert response.status_code == 200
    
    def test_search_no_results(self):
        """Test search with no results"""
        response = client.get("/api/v1/search", params={
            "query": "несуществующий_товар_12345"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0

class TestCategories:
    """Test category endpoints"""
    
    def test_get_categories(self):
        """Test getting all categories"""
        response = client.get("/api/v1/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_category_by_id(self):
        """Test getting category by ID"""
        # First get all categories
        response = client.get("/api/v1/categories")
        if response.status_code == 200 and response.json():
            category_id = response.json()[0]["id"]
            
            # Then get specific category
            response = client.get(f"/api/v1/categories/{category_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == category_id
    
    def test_get_nonexistent_category(self):
        """Test getting non-existent category"""
        response = client.get("/api/v1/categories/99999")
        assert response.status_code == 404

class TestItems:
    """Test item endpoints"""
    
    def test_get_items(self):
        """Test getting all items"""
        response = client.get("/api/v1/items")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_item_by_id(self):
        """Test getting item by ID"""
        # First get all items
        response = client.get("/api/v1/items")
        if response.status_code == 200 and response.json():
            item_id = response.json()[0]["id"]
            
            # Then get specific item
            response = client.get(f"/api/v1/items/{item_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == item_id
    
    def test_get_nonexistent_item(self):
        """Test getting non-existent item"""
        response = client.get("/api/v1/items/99999")
        assert response.status_code == 404

class TestFeedback:
    """Test feedback endpoints"""
    
    def test_submit_feedback_success(self):
        """Test successful feedback submission"""
        feedback_data = {
            "query_id": "test_query_123",
            "rating": 5,
            "comment": "Отличные рекомендации!",
            "user_id": SAMPLE_USER_ID
        }
        
        response = client.post("/api/v1/feedback", json=feedback_data)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Feedback submitted successfully"
    
    def test_submit_feedback_missing_rating(self):
        """Test feedback without rating"""
        feedback_data = {
            "query_id": "test_query_123",
            "comment": "Отличные рекомендации!",
            "user_id": SAMPLE_USER_ID
        }
        
        response = client.post("/api/v1/feedback", json=feedback_data)
        assert response.status_code == 422

class TestVectorOperations:
    """Test vector database operations"""
    
    @patch('app.services.vector_service.VectorService')
    def test_vector_search_success(self, mock_vector_class):
        """Test successful vector search"""
        # Mock vector service
        mock_vector = Mock()
        mock_vector.search_similar.return_value = [
            {"id": 1, "similarity": 0.95, "metadata": {"name": "MacBook Pro"}},
            {"id": 2, "similarity": 0.87, "metadata": {"name": "Dell XPS"}}
        ]
        mock_vector_class.return_value = mock_vector
        
        response = client.post("/api/v1/vector/search", json={
            "embedding": [0.1, 0.2, 0.3] * 100,
            "limit": 5
        })
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) == 2
        assert data["results"][0]["similarity"] == 0.95
    
    def test_vector_search_invalid_embedding(self):
        """Test vector search with invalid embedding"""
        response = client.post("/api/v1/vector/search", json={
            "embedding": "invalid_embedding",
            "limit": 5
        })
        assert response.status_code == 422

class TestErrorHandling:
    """Test error handling"""
    
    def test_404_not_found(self):
        """Test 404 error for non-existent endpoint"""
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404
    
    def test_405_method_not_allowed(self):
        """Test 405 error for wrong HTTP method"""
        response = client.put("/api/v1/health")
        assert response.status_code == 405
    
    def test_422_validation_error(self):
        """Test 422 error for validation failures"""
        response = client.post("/api/v1/nlp/process", json={
            "invalid_field": 123
        })
        assert response.status_code == 422

class TestIntegration:
    """Integration tests"""
    
    def test_full_recommendation_flow(self):
        """Test complete recommendation flow"""
        # 1. Process NLP
        nlp_response = client.post("/api/v1/nlp/process", json={
            "text": SAMPLE_QUERY,
            "user_context": {}
        })
        assert nlp_response.status_code == 200
        
        # 2. Get recommendations
        rec_response = client.post("/api/v1/recommendations", json={
            "query": SAMPLE_QUERY,
            "user_id": SAMPLE_USER_ID,
            "filters": SAMPLE_FILTERS
        })
        assert rec_response.status_code == 200
        
        # 3. Submit feedback
        if rec_response.json().get("query_id"):
            feedback_response = client.post("/api/v1/feedback", json={
                "query_id": rec_response.json()["query_id"],
                "rating": 5,
                "comment": "Great recommendations!"
            })
            assert feedback_response.status_code == 200
    
    def test_search_and_categories_integration(self):
        """Test search and categories integration"""
        # 1. Get categories
        categories_response = client.get("/api/v1/categories")
        assert categories_response.status_code == 200
        
        if categories_response.json():
            category_id = categories_response.json()[0]["id"]
            
            # 2. Search in specific category
            search_response = client.get("/api/v1/search", params={
                "category_id": category_id,
                "limit": 5
            })
            assert search_response.status_code == 200

# Performance tests
class TestPerformance:
    """Performance tests"""
    
    def test_health_check_response_time(self):
        """Test health check response time"""
        import time
        start_time = time.time()
        response = client.get("/api/v1/health")
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 1.0  # Should respond within 1 second
    
    def test_concurrent_requests(self):
        """Test concurrent request handling"""
        import threading
        import time
        
        results = []
        errors = []
        
        def make_request():
            try:
                response = client.get("/api/v1/health")
                results.append(response.status_code)
            except Exception as e:
                errors.append(str(e))
        
        # Start 10 concurrent requests
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Check results
        assert len(results) == 10
        assert all(status == 200 for status in results)
        assert len(errors) == 0

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
