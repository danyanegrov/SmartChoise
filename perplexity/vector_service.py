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
            entities = [ids, item_ids, names, categories, embeddings, metadata]
            insert_result = self.collection.insert(entities)

            # Flush to make data searchable
            self.collection.flush()

            logger.info(f"Inserted {len(items_data)} embeddings into Milvus")
            return True

        except Exception as e:
            logger.error(f"Failed to insert embeddings: {e}")
            return False

    async def search_similar(self, 
                           query_embedding: List[float], 
                           top_k: int = 10,
                           filters: Optional[Dict] = None) -> List[Dict]:
        """Search for similar items"""
        try:
            # Load collection
            self.collection.load()

            # Prepare search parameters
            search_params = {
                "metric_type": "COSINE",
                "params": {"ef": 200}
            }

            # Perform search
            results = self.collection.search(
                data=[query_embedding],
                anns_field="embedding",
                param=search_params,
                limit=top_k,
                output_fields=["item_id", "name", "category", "metadata"]
            )

            # Process results
            similar_items = []
            for hit in results[0]:
                similar_items.append({
                    "item_id": hit.entity.get("item_id"),
                    "name": hit.entity.get("name"),
                    "category": hit.entity.get("category"),
                    "similarity_score": 1 - hit.distance,  # Convert distance to similarity
                    "metadata": hit.entity.get("metadata", "{}"),
                    "milvus_id": hit.id
                })

            logger.info(f"Found {len(similar_items)} similar items")
            return similar_items

        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []

    async def delete_by_item_id(self, item_id: int) -> bool:
        """Delete embeddings by item_id"""
        try:
            expr = f"item_id == {item_id}"
            delete_result = self.collection.delete(expr)
            self.collection.flush()

            logger.info(f"Deleted embeddings for item_id: {item_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete embeddings: {e}")
            return False

    def get_collection_stats(self) -> Dict:
        """Get collection statistics"""
        try:
            stats = self.collection.get_stats()
            return {
                "name": self.collection_name,
                "row_count": stats.get("row_count", 0),
                "indexed": True if self.collection.has_index() else False,
                "loaded": True
            }
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"error": str(e)}

    async def create_user_query_collection(self):
        """Create collection for user query embeddings"""
        collection_name = "user_queries"

        try:
            if utility.has_collection(collection_name):
                return Collection(collection_name)

            fields = [
                FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
                FieldSchema(name="user_id", dtype=DataType.INT64),
                FieldSchema(name="query_text", dtype=DataType.VARCHAR, max_length=500),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384),
                FieldSchema(name="timestamp", dtype=DataType.INT64)
            ]

            schema = CollectionSchema(fields=fields, description="User query embeddings")
            collection = Collection(name=collection_name, schema=schema)

            # Create index
            index_params = {
                "metric_type": "COSINE",
                "index_type": "HNSW", 
                "params": {"M": 16, "efConstruction": 200}
            }
            collection.create_index("embedding", index_params)

            logger.info(f"Created user queries collection: {collection_name}")
            return collection

        except Exception as e:
            logger.error(f"Failed to create user queries collection: {e}")
            return None

# Global vector service instance
vector_service = VectorService()
