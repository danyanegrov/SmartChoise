#!/usr/bin/env python3
"""
Enhanced data loader script for Intelligent Choice System
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
                description="Item embeddings for semantic search in intelligent choice system"
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
                # Create comprehensive text for embedding
                text_parts = []
                
                # Add item name (most important)
                text_parts.append(item['name'])
                
                # Add category
                text_parts.append(item['category_name'])
                
                # Add description if available
                if item['description']:
                    text_parts.append(item['description'])
                
                # Add important attributes
                attrs = item['attributes']
                if 'brand' in attrs:
                    text_parts.append(f"бренд {attrs['brand']}")
                if 'author' in attrs:
                    text_parts.append(f"автор {attrs['author']}")
                if 'genre' in attrs:
                    text_parts.append(f"жанр {attrs['genre']}")
                if 'processor' in attrs:
                    text_parts.append(f"процессор {attrs['processor']}")
                if 'engine' in attrs:
                    text_parts.append(f"двигатель {attrs['engine']}")
                if 'cuisine' in attrs:
                    text_parts.append(f"кухня {attrs['cuisine']}")
                
                # Combine all parts
                full_text = " ".join(text_parts)
                
                # Generate embedding
                embedding = self.embedder.encode(full_text)
                
                # Prepare data for Milvus
                ids.append(i)  # Sequential ID for Milvus
                item_ids.append(item['id'])
                names.append(item['name'][:200])  # Truncate to fit VARCHAR limit
                categories.append(item['category_name'][:100])
                embeddings.append(embedding.tolist())
                
                # Create metadata JSON
                metadata_dict = {
                    'price': item['price'],
                    'rating': item['rating'],
                    'description': item['description'][:200] if item['description'] else '',
                    'key_attributes': {k: v for k, v in attrs.items() if k in ['brand', 'author', 'genre', 'processor']}
                }
                metadata.append(json.dumps(metadata_dict, ensure_ascii=False)[:1000])
                
                if (i + 1) % 50 == 0:
                    logger.info(f"   Processed {i + 1}/{len(self.items_data)} items")
            
            # Insert into Milvus
            if embeddings:
                entities = [ids, item_ids, names, categories, embeddings, metadata]
                
                logger.info("🚀 Inserting embeddings into Milvus...")
                insert_result = self.milvus_collection.insert(entities)
                
                # Flush to make data searchable
                self.milvus_collection.flush()
                logger.info("💾 Flushed data to Milvus")
                
                # Create index for fast search
                logger.info("🔍 Creating search index...")
                index_params = {
                    "metric_type": "COSINE",
                    "index_type": "HNSW",
                    "params": {"M": 16, "efConstruction": 200}
                }
                
                self.milvus_collection.create_index("embedding", index_params)
                logger.info("✅ Created HNSW index for embeddings")
                
                # Load collection for search
                self.milvus_collection.load()
                logger.info("🎯 Collection loaded and ready for search")
                
            logger.info(f"🎉 Successfully processed {len(embeddings)} item embeddings")
            
        except Exception as e:
            logger.error(f"❌ Failed to generate embeddings: {e}")
            raise
    
    def create_sample_queries(self):
        """Create sample query embeddings for testing"""
        try:
            logger.info("📝 Creating sample query embeddings...")
            
            sample_queries = [
                "игровой ноутбук до 100000 рублей",
                "книги по программированию python",
                "семейный автомобиль надежный",
                "смартфон с хорошей камерой",
                "ресторан итальянская кухня москва",
                "отель центр санкт-петербург",
                "беговые кроссовки nike adidas",
                "классическая русская литература",
                "бизнес седан bmw mercedes",
                "ноутбук для дизайна графика"
            ]
            
            query_embeddings = []
            for query in sample_queries:
                embedding = self.embedder.encode(query)
                query_embeddings.append({
                    'query': query,
                    'embedding': embedding.tolist()
                })
            
            # Save to file for later use
            with open('data/sample/query_embeddings.json', 'w', encoding='utf-8') as f:
                json.dump(query_embeddings, f, ensure_ascii=False, indent=2)
            
            logger.info(f"💾 Saved {len(query_embeddings)} sample query embeddings")
            
        except Exception as e:
            logger.error(f"❌ Failed to create sample queries: {e}")
    
    def test_vector_search(self):
        """Test vector search functionality"""
        try:
            logger.info("🧪 Testing vector search functionality...")
            
            # Test query
            test_query = "игровой ноутбук для программиста"
            query_embedding = self.embedder.encode(test_query)
            
            # Search parameters
            search_params = {
                "metric_type": "COSINE",
                "params": {"ef": 200}
            }
            
            # Perform search
            results = self.milvus_collection.search(
                data=[query_embedding.tolist()],
                anns_field="embedding",
                param=search_params,
                limit=5,
                output_fields=["item_id", "name", "category", "metadata"]
            )
            
            logger.info(f"🔍 Test query: '{test_query}'")
            logger.info("📊 Top 5 results:")
            
            for i, hit in enumerate(results[0]):
                similarity = 1 - hit.distance  # Convert distance to similarity
                logger.info(f"   {i+1}. {hit.entity.get('name')} (similarity: {similarity:.3f})")
            
            logger.info("✅ Vector search test completed successfully")
            
        except Exception as e:
            logger.error(f"❌ Vector search test failed: {e}")
    
    def create_analytics_data(self):
        """Create additional analytics and test data"""
        try:
            logger.info("📈 Creating analytics data...")
            
            cursor = self.db_conn.cursor()
            
            # Get popular items
            cursor.execute("""
                SELECT name, COUNT(*) as interaction_count 
                FROM items i 
                JOIN user_interactions ui ON i.id = ui.item_id 
                GROUP BY i.id, name 
                ORDER BY interaction_count DESC 
                LIMIT 10
            """)
            
            popular_items = cursor.fetchall()
            
            # Get user activity stats
            cursor.execute("""
                SELECT u.username, COUNT(ui.id) as total_interactions,
                       COUNT(CASE WHEN ui.interaction_type = 'purchase' THEN 1 END) as purchases
                FROM users u 
                LEFT JOIN user_interactions ui ON u.id = ui.user_id 
                WHERE u.id > 1  -- Exclude admin
                GROUP BY u.id, u.username 
                ORDER BY total_interactions DESC
            """)
            
            user_stats = cursor.fetchall()
            
            # Create analytics summary
            analytics_data = {
                'popular_items': [{'name': item[0], 'interactions': item[1]} for item in popular_items],
                'active_users': [{'username': user[0], 'interactions': user[1], 'purchases': user[2]} for user in user_stats[:10]],
                'total_items': len(self.items_data),
                'categories_count': len(set(item['category_name'] for item in self.items_data)),
                'generation_time': datetime.now().isoformat()
            }
            
            # Save analytics
            with open('data/sample/analytics_summary.json', 'w', encoding='utf-8') as f:
                json.dump(analytics_data, f, ensure_ascii=False, indent=2)
            
            logger.info("💾 Analytics data saved to data/sample/analytics_summary.json")
            
        except Exception as e:
            logger.error(f"❌ Failed to create analytics data: {e}")
    
    def run_full_pipeline(self):
        """Run the complete data loading and vectorization pipeline"""
        start_time = datetime.now()
        logger.info("🚀 Starting Enhanced Data Loader Pipeline")
        logger.info("=" * 60)
        
        try:
            # Step 1: Connect to databases
            logger.info("1️⃣ Connecting to databases...")
            self.connect_databases()
            
            # Step 2: Setup Milvus collection
            logger.info("2️⃣ Setting up Milvus collection...")
            self.setup_milvus_collection()
            
            # Step 3: Load items from PostgreSQL
            logger.info("3️⃣ Loading items from PostgreSQL...")
            self.load_items_from_db()
            
            # Step 4: Generate and insert embeddings
            logger.info("4️⃣ Generating embeddings and indexing in Milvus...")
            self.generate_embeddings()
            
            # Step 5: Create sample query embeddings
            logger.info("5️⃣ Creating sample query embeddings...")
            self.create_sample_queries()
            
            # Step 6: Test vector search
            logger.info("6️⃣ Testing vector search functionality...")
            self.test_vector_search()
            
            # Step 7: Create analytics data
            logger.info("7️⃣ Creating analytics data...")
            self.create_analytics_data()
            
            # Completion
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info("=" * 60)
            logger.info("🎉 DATA LOADING PIPELINE COMPLETED SUCCESSFULLY!")
            logger.info(f"⏱️  Total execution time: {duration:.2f} seconds")
            logger.info("=" * 60)
            
            # Print summary
            self.print_summary()
            
        except Exception as e:
            logger.error(f"💥 Pipeline failed: {e}")
            raise
        
        finally:
            # Close connections
            if self.db_conn:
                self.db_conn.close()
                logger.info("🔌 Closed database connections")
    
    def print_summary(self):
        """Print summary of loaded data"""
        logger.info("📊 DATA SUMMARY:")
        logger.info(f"   • Total items vectorized: {len(self.items_data)}")
        
        # Count by category
        category_counts = {}
        for item in self.items_data:
            cat = item['category_name']
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        logger.info("   • Items by category:")
        for category, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"     - {category}: {count} items")
        
        # Price statistics
        prices = [item['price'] for item in self.items_data if item['price'] > 0]
        if prices:
            logger.info(f"   • Price range: {min(prices):,.0f} - {max(prices):,.0f} ₽")
            logger.info(f"   • Average price: {np.mean(prices):,.0f} ₽")
        
        logger.info("")
        logger.info("🎯 NEXT STEPS:")
        logger.info("   1. Start the FastAPI server: uvicorn app.main:app --reload")
        logger.info("   2. Start the Streamlit frontend: streamlit run frontend/app.py")
        logger.info("   3. Test recommendations at: http://localhost:8501")

def main():
    """Main entry point"""
    try:
        # Create data directories if they don't exist
        import os
        os.makedirs('data/sample', exist_ok=True)
        
        # Run the data loader
        loader = EnhancedDataLoader()
        loader.run_full_pipeline()
        
    except KeyboardInterrupt:
        logger.info("⏹️  Pipeline interrupted by user")
    except Exception as e:
        logger.error(f"💥 Pipeline failed with error: {e}")
        raise

if __name__ == "__main__":
    main()