from typing import List, Dict, Any, Optional
import numpy as np
from pymilvus import (
    connections, Collection, FieldSchema, CollectionSchema, DataType,
    utility, Index
)
from loguru import logger
from app.core.config import settings

class VectorService:
    def __init__(self):
        self.collection_name = "item_embeddings"
        self.collection = None
        self._connect_and_setup()

    def _connect_and_setup(self):
        """Connect to Milvus and setup collections"""
        try:
            # Connect to Milvus
            connections.connect(
                alias="default",
                host=settings.MILVUS_HOST,
                port=settings.MILVUS_PORT
            )
            logger.info("Connected to Milvus successfully")

            # Setup collection
            self._setup_collection()

        except Exception as e:
            logger.error(f"Failed to connect to Milvus: {e}")
            raise

    def _setup_collection(self):
        """Setup Milvus collection for item embeddings"""
        try:
            # Check if collection exists
            if utility.has_collection(self.collection_name):
                self.collection = Collection(self.collection_name)
                logger.info(f"Using existing collection: {self.collection_name}")
                return

            # Define schema
            fields = [
                FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=False),
                FieldSchema(name="item_id", dtype=DataType.INT64),
                FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=200),
                FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=100),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384),
                FieldSchema(name="metadata", dtype=DataType.VARCHAR, max_length=1000)
            ]

            schema = CollectionSchema(
                fields=fields,
                description="Item embeddings for semantic search"
            )

            # Create collection
            self.collection = Collection(
                name=self.collection_name,
                schema=schema
            )

            # Create index
            index_params = {
                "metric_type": "COSINE",
                "index_type": "HNSW",
                "params": {"M": 16, "efConstruction": 200}
            }

            self.collection.create_index("embedding", index_params)
            logger.info(f"Created collection and index: {self.collection_name}")

        except Exception as e:
            logger.error(f"Failed to setup collection: {e}")
            raise

    async def insert_embeddings(self, items_data: List[Dict]) -> bool:
        """Insert item embeddings into Milvus"""
        try:
            if not items_data:
                return True

            # Prepare data for insertion
            ids = []
            item_ids = []
            names = []
            categories = []
            embeddings = []
            metadata = []

            for i, item in enumerate(items_data):
                ids.append(item.get('id', i))
                item_ids.append(item['item_id'])
                names.append(item['name'])
                categories.append(item.get('category', ''))
                embeddings.append(item['embedding'])
                metadata.append(str(item.get('metadata', {})))

            # Insert data
            data = [ids, item_ids, names, categories, embeddings, metadata]
            self.collection.insert(data)
            
            # Flush to ensure data is persisted
            self.collection.flush()
            
            logger.info(f"Inserted {len(items_data)} embeddings successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to insert embeddings: {e}")
            return False

    async def search_similar(self, query_embedding: List[float], 
                           filters: Dict[str, Any] = None, 
                           limit: int = 10) -> List[Dict]:
        """Search for similar items using vector similarity"""
        try:
            if not self.collection:
                logger.error("Collection not initialized")
                return []

            # Load collection
            self.collection.load()

            # Prepare search parameters
            search_params = {
                "metric_type": "COSINE",
                "params": {"ef": 64}
            }

            # Build filter expression
            filter_expr = None
            if filters:
                filter_parts = []
                
                if filters.get("category"):
                    filter_parts.append(f'category == "{filters["category"]}"')
                
                if filters.get("max_price"):
                    # Note: Price filtering would need to be done in application layer
                    # as Milvus doesn't support numeric filtering in this schema
                    pass
                
                if filter_parts:
                    filter_expr = " and ".join(filter_parts)

            # Perform search
            results = self.collection.search(
                data=[query_embedding],
                anns_field="embedding",
                param=search_params,
                limit=limit,
                expr=filter_expr,
                output_fields=["item_id", "name", "category", "metadata"]
            )

            # Process results
            search_results = []
            for hits in results:
                for hit in hits:
                    search_results.append({
                        "item_id": hit.entity.get("item_id"),
                        "name": hit.entity.get("name"),
                        "category": hit.entity.get("category"),
                        "score": hit.score,
                        "metadata": hit.entity.get("metadata", {})
                    })

            # Sort by score (higher is better for cosine similarity)
            search_results.sort(key=lambda x: x["score"], reverse=True)
            
            logger.info(f"Found {len(search_results)} similar items")
            return search_results

        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []

    async def update_embedding(self, item_id: int, new_embedding: List[float]) -> bool:
        """Update embedding for existing item"""
        try:
            if not self.collection:
                return False

            # Delete old embedding
            delete_expr = f'item_id == {item_id}'
            self.collection.delete(delete_expr)

            # Insert new embedding
            data = [[0], [item_id], [""], [""], [new_embedding], [""]]
            self.collection.insert(data)
            self.collection.flush()

            logger.info(f"Updated embedding for item {item_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to update embedding: {e}")
            return False

    async def delete_embedding(self, item_id: int) -> bool:
        """Delete embedding for item"""
        try:
            if not self.collection:
                return False

            delete_expr = f'item_id == {item_id}'
            self.collection.delete(delete_expr)
            self.collection.flush()

            logger.info(f"Deleted embedding for item {item_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete embedding: {e}")
            return False

    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get collection statistics"""
        try:
            if not self.collection:
                return {}

            stats = {
                "name": self.collection_name,
                "num_entities": self.collection.num_entities,
                "schema": str(self.collection.schema)
            }

            return stats

        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return {}

    async def clear_collection(self) -> bool:
        """Clear all data from collection"""
        try:
            if not self.collection:
                return False

            # Delete all entities
            self.collection.delete("id >= 0")
            self.collection.flush()

            logger.info("Collection cleared successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to clear collection: {e}")
            return False

# Global instance
vector_service = VectorService()
