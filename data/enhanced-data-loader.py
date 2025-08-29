#!/usr/bin/env python3
"""
Enhanced data loader script for SmartChoice AI
Loads extended database with vectorization for Milvus
"""

import asyncio
import json
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import psycopg2
from pymilvus import connections, Collection, utility, FieldSchema, CollectionSchema, DataType
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'choice_db',
    'user': 'postgres',
    'password': 'password'
}

# Milvus configuration
MILVUS_CONFIG = {
    'host': 'localhost',
    'port': 19530
}

class EnhancedDataLoader:
    def __init__(self):
        self.embedder = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        self.db_conn = None
        self.milvus_collection = None
        self.items_data = []
    
    def connect_databases(self):
        """Connect to PostgreSQL and Milvus"""
        try:
            # Connect to PostgreSQL
            self.db_conn = psycopg2.connect(**DB_CONFIG)
            logger.info("✅ Connected to PostgreSQL")
            
            # Connect to Milvus
            connections.connect(
                alias="default",
                host=MILVUS_CONFIG['host'],
                port=MILVUS_CONFIG['port']
            )
            logger.info("✅ Connected to Milvus")
            
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise
    
    def setup_milvus_collection(self):
        """Setup Milvus collection for item embeddings"""
        try:
            collection_name = "item_embeddings"
            
            # Drop existing collection if exists
            if utility.has_collection(collection_name):
                utility.drop_collection(collection_name)
                logger.info("🗑️ Dropped existing collection")
            
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
                description="Item embeddings for semantic search in SmartChoice AI"
            )
            
            # Create collection
            self.milvus_collection = Collection(
                name=collection_name,
                schema=schema
            )
            
            logger.info(f"🆕 Created Milvus collection: {collection_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to setup Milvus collection: {e}")
            raise
    
    def load_items_from_db(self):
        """Load all items from PostgreSQL database"""
        try:
            cursor = self.db_conn.cursor()
            
            query = """
                SELECT i.id, i.name, i.description, i.price, i.rating, 
                       i.attributes, c.name as category_name
                FROM items i
                LEFT JOIN categories c ON i.category_id = c.id
                WHERE i.is_available = true
                ORDER BY i.id
            """
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            self.items_data = []
            for row in rows:
                item_id, name, description, price, rating, attributes, category_name = row
                
                self.items_data.append({
                    'id': item_id,
                    'name': name,
                    'description': description or '',
                    'price': float(price) if price else 0.0,
                    'rating': float(rating) if rating else 0.0,
                    'category_name': category_name or 'Разное',
                    'attributes': json.loads(attributes) if attributes else {}
                })
            
            logger.info(f"📊 Loaded {len(self.items_data)} items from database")
            
        except Exception as e:
            logger.error(f"❌ Failed to load items from database: {e}")
            raise
    
    def generate_embeddings(self):
        """Generate embeddings for all items"""
        try:
            logger.info("🧠 Generating embeddings for all items...")
            
            # Prepare data for Milvus
            ids = []
            item_ids = []
            names = []
            categories = []
            embeddings = []
            metadata = []
            
            for i, item in enumerate(self.items_data):
                # Compose text
                text_parts = [item['name'], item['category_name']]
                if item['description']:
                    text_parts.append(item['description'])
                attrs = item['attributes']
                for k in ['brand', 'author', 'genre', 'processor', 'engine', 'cuisine']:
                    if k in attrs:
                        text_parts.append(str(attrs[k]))
                full_text = " ".join(text_parts)
                
                # Embedding
                embedding = self.embedder.encode(full_text)
                
                # Prepare rows
                ids.append(i)
                item_ids.append(item['id'])
                names.append(item['name'][:200])
                categories.append(item['category_name'][:100])
                embeddings.append(embedding.tolist())
                metadata.append(json.dumps({
                    'price': item['price'],
                    'rating': item['rating'],
                    'description': item['description'][:200]
                }, ensure_ascii=False)[:1000])
                
                if (i + 1) % 50 == 0:
                    logger.info(f"   Processed {i + 1}/{len(self.items_data)} items")
            
            if embeddings:
                entities = [ids, item_ids, names, categories, embeddings, metadata]
                logger.info("🚀 Inserting embeddings into Milvus...")
                self.milvus_collection.insert(entities)
                self.milvus_collection.flush()
                logger.info("✅ Flushed data to Milvus")
                
                index_params = {"metric_type": "COSINE", "index_type": "HNSW", "params": {"M": 16, "efConstruction": 200}}
                self.milvus_collection.create_index("embedding", index_params)
                self.milvus_collection.load()
                logger.info("🎯 Collection indexed and loaded")
            
            logger.info(f"🎉 Successfully processed {len(embeddings)} item embeddings")
        
        except Exception as e:
            logger.error(f"❌ Failed to generate embeddings: {e}")
            raise
    
    def run_full_pipeline(self):
        start_time = datetime.now()
        logger.info("🚀 Starting Enhanced Data Loader Pipeline")
        try:
            self.connect_databases()
            self.setup_milvus_collection()
            self.load_items_from_db()
            self.generate_embeddings()
            logger.info("✅ Pipeline completed")
        finally:
            if self.db_conn:
                self.db_conn.close()
                logger.info("🔌 Closed database connections")

if __name__ == "__main__":
    EnhancedDataLoader().run_full_pipeline()
