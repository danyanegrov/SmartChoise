#!/usr/bin/env python3
"""
Data loader script for Intelligent Choice System
Loads sample data and generates embeddings for vector search
"""

import asyncio
import json
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import psycopg2
from pymilvus import connections, Collection, utility
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
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

class DataLoader:
    def __init__(self):
        self.embedder = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        self.db_conn = None
        self.milvus_collection = None

    def connect_databases(self):
        """Connect to PostgreSQL and Milvus"""
        try:
            # Connect to PostgreSQL
            self.db_conn = psycopg2.connect(**DB_CONFIG)
            logger.info("Connected to PostgreSQL")

            # Connect to Milvus
            connections.connect(
                alias="default",
                host=MILVUS_CONFIG['host'],
                port=MILVUS_CONFIG['port']
            )

            # Get Milvus collection
            if utility.has_collection("item_embeddings"):
                self.milvus_collection = Collection("item_embeddings")
                logger.info("Connected to Milvus collection")
            else:
                logger.warning("Milvus collection 'item_embeddings' not found")

        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise

    def load_additional_items(self):
        """Load more sample items into database"""
        additional_items = [
            # Больше ноутбуков
            {
                'name': 'Dell XPS 13',
                'description': 'Ультрабук с безрамочным дисплеем и долгой автономностью',
                'category_id': 2,
                'price': 79999,
                'rating': 4.4,
                'rating_count': 156,
                'attributes': '{"brand": "Dell", "processor": "Intel i7", "ram": "16GB", "storage": "512GB", "display": "13.3\"}'
            },
            {
                'name': 'Acer Aspire 5',
                'description': 'Бюджетный ноутбук для учебы и работы',
                'category_id': 2,
                'price': 38999,
                'rating': 3.9,
                'rating_count': 89,
                'attributes': '{"brand": "Acer", "processor": "AMD Ryzen 5", "ram": "8GB", "storage": "256GB"}'
            },
            {
                'name': 'Microsoft Surface Laptop',
                'description': 'Стильный ноутбук с сенсорным экраном',
                'category_id': 2,
                'price': 94999,
                'rating': 4.3,
                'rating_count': 134,
                'attributes': '{"brand": "Microsoft", "processor": "Intel i5", "ram": "8GB", "storage": "256GB", "touchscreen": true}'
            },

            # Больше смартфонов
            {
                'name': 'OnePlus 11',
                'description': 'Флагманский смартфон с быстрой зарядкой',
                'category_id': 3,
                'price': 54999,
                'rating': 4.5,
                'rating_count': 267,
                'attributes': '{"brand": "OnePlus", "display": "6.7", "storage": "128GB", "camera": "50MP", "charging": "100W"}'
            },
            {
                'name': 'Huawei P60 Pro',
                'description': 'Камерофон с профессиональной съемкой',
                'category_id': 3,
                'price': 67999,
                'rating': 4.4,
                'rating_count': 178,
                'attributes': '{"brand": "Huawei", "display": "6.67", "storage": "256GB", "camera": "48MP", "zoom": "5x"}'
            },
            {
                'name': 'Nothing Phone 2',
                'description': 'Уникальный дизайн с Glyph-интерфейсом',
                'category_id': 3,
                'price': 45999,
                'rating': 4.1,
                'rating_count': 92,
                'attributes': '{"brand": "Nothing", "display": "6.7", "storage": "128GB", "camera": "50MP", "glyph": true}'
            },

            # Планшеты (новая подкатегория)
            {
                'name': 'iPad Air',
                'description': 'Мощный планшет для творчества и работы',
                'category_id': 1,
                'price': 59999,
                'rating': 4.6,
                'rating_count': 234,
                'attributes': '{"brand": "Apple", "display": "10.9", "storage": "64GB", "processor": "M1"}'
            },
            {
                'name': 'Samsung Galaxy Tab S8',
                'description': 'Android планшет с S Pen в комплекте',
                'category_id': 1,
                'price': 49999,
                'rating': 4.3,
                'rating_count': 156,
                'attributes': '{"brand": "Samsung", "display": "11", "storage": "128GB", "s_pen": true}'
            },

            # Больше книг
            {
                'name': 'Алгоритмы: построение и анализ',
                'description': 'Классический учебник по алгоритмам',
                'category_id': 7,
                'price': 3499,
                'rating': 4.8,
                'rating_count': 445,
                'attributes': '{"author": "Кормен, Лейзерсон, Ривест", "pages": 1296, "genre": "Техническая литература"}'
            },
            {
                'name': 'Чистый код',
                'description': 'Руководство по написанию качественного кода',
                'category_id': 7,
                'price': 2299,
                'rating': 4.7,
                'rating_count': 678,
                'attributes': '{"author": "Роберт Мартин", "pages": 464, "genre": "Программирование"}'
            },
            {
                'name': 'Машинное обучение',
                'description': 'Современный подход к машинному обучению',
                'category_id': 7,
                'price': 4199,
                'rating': 4.6,
                'rating_count': 234,
                'attributes': '{"author": "Том Митчелл", "pages": 432, "genre": "Искусственный интеллект"}'
            }
        ]

        try:
            cursor = self.db_conn.cursor()

            for item in additional_items:
                cursor.execute("""
                    INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes)
                    VALUES (%(name)s, %(description)s, %(category_id)s, %(price)s, %(rating)s, %(rating_count)s, %(attributes)s)
                    ON CONFLICT (name) DO NOTHING
                """, item)

            self.db_conn.commit()
            logger.info(f"Loaded {len(additional_items)} additional items")

        except Exception as e:
            logger.error(f"Failed to load additional items: {e}")
            self.db_conn.rollback()

    def generate_embeddings(self):
        """Generate embeddings for all items and load into Milvus"""
        try:
            cursor = self.db_conn.cursor()

            # Get all items
            cursor.execute("""
                SELECT id, name, description, price, rating, 
                       c.name as category_name, attributes
                FROM items i
                LEFT JOIN categories c ON i.category_id = c.id
                WHERE i.is_available = true
            """)

            items = cursor.fetchall()
            logger.info(f"Found {len(items)} items to process")

            if not items:
                logger.warning("No items found in database")
                return

            # Prepare data for Milvus
            ids = []
            item_ids = []
            names = []
            categories = []
            embeddings = []
            metadata = []

            for item in items:
                item_id, name, description, price, rating, category_name, attributes = item

                # Create text for embedding
                text_parts = [name]
                if description:
                    text_parts.append(description)
                if category_name:
                    text_parts.append(category_name)

                text_for_embedding = " ".join(text_parts)

                # Generate embedding
                embedding = self.embedder.encode(text_for_embedding)

                # Prepare data
                ids.append(len(ids))  # Auto-increment ID for Milvus
                item_ids.append(item_id)
                names.append(name[:200])  # Truncate to fit VARCHAR limit
                categories.append(category_name[:100] if category_name else "")
                embeddings.append(embedding.tolist())

                # Create metadata
                item_metadata = {
                    "price": price,
                    "rating": float(rating) if rating else 0.0,
                    "attributes": json.loads(attributes) if attributes else {}
                }
                metadata.append(json.dumps(item_metadata, ensure_ascii=False)[:1000])

            # Insert into Milvus
            if self.milvus_collection and embeddings:
                # Clear existing data
                self.milvus_collection.delete("id >= 0")
                self.milvus_collection.flush()

                # Insert new data
                entities = [ids, item_ids, names, categories, embeddings, metadata]
                insert_result = self.milvus_collection.insert(entities)

                # Flush to make data searchable
                self.milvus_collection.flush()

                logger.info(f"Inserted {len(embeddings)} embeddings into Milvus")

                # Create index if not exists
                if not self.milvus_collection.has_index():
                    index_params = {
                        "metric_type": "COSINE",
                        "index_type": "HNSW",
                        "params": {"M": 16, "efConstruction": 200}
                    }
                    self.milvus_collection.create_index("embedding", index_params)
                    logger.info("Created index on embeddings")

                # Load collection
                self.milvus_collection.load()
                logger.info("Collection loaded and ready for search")

        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise

    def create_sample_interactions(self):
        """Create more sample user interactions"""
        interactions = [
            # User 2 (testuser) interactions
            (2, 1, 'view', None, None),  # MacBook Air
            (2, 1, 'like', 5, 'Отличная производительность'),
            (2, 2, 'view', None, None),  # ThinkPad
            (2, 2, 'like', 4, 'Хорошая клавиатура'),
            (2, 5, 'purchase', 5, 'Купил, очень доволен'),  # iPhone

            # User 3 (alice) interactions  
            (3, 9, 'view', None, None),   # Python книга
            (3, 9, 'purchase', 5, 'Отличный учебник'),
            (3, 10, 'view', None, None),  # Гарри Поттер
            (3, 10, 'like', 5, 'Любимая книга детства'),
            (3, 11, 'view', None, None),  # Мастер и Маргарита
            (3, 11, 'like', 4, 'Классика русской литературы'),

            # User 4 (bob) interactions
            (4, 13, 'view', None, None),  # Toyota
            (4, 13, 'like', 4, 'Надежный автомобиль'),
            (4, 14, 'view', None, None),  # BMW
            (4, 14, 'like', 5, 'Отличная управляемость'),
            (4, 15, 'view', None, None),  # Tesla
            (4, 15, 'dislike', 2, 'Слишком дорого'),
            (4, 3, 'view', None, None),   # ASUS ROG
            (4, 3, 'like', 5, 'Мощный игровой ноутбук')
        ]

        try:
            cursor = self.db_conn.cursor()

            for interaction in interactions:
                user_id, item_id, int_type, rating, feedback = interaction
                cursor.execute("""
                    INSERT INTO user_interactions (user_id, item_id, interaction_type, rating, feedback)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (user_id, item_id, int_type, rating, feedback))

            self.db_conn.commit()
            logger.info(f"Created {len(interactions)} sample interactions")

        except Exception as e:
            logger.error(f"Failed to create interactions: {e}")
            self.db_conn.rollback()

    def run(self):
        """Run the full data loading process"""
        logger.info("Starting data loading process...")

        try:
            # Connect to databases
            self.connect_databases()

            # Load additional items
            self.load_additional_items()

            # Generate embeddings
            if self.milvus_collection:
                self.generate_embeddings()
            else:
                logger.warning("Skipping embedding generation - Milvus collection not available")

            # Create sample interactions
            self.create_sample_interactions()

            logger.info("Data loading completed successfully!")

        except Exception as e:
            logger.error(f"Data loading failed: {e}")
            raise

        finally:
            # Close connections
            if self.db_conn:
                self.db_conn.close()
                logger.info("Closed database connection")

def main():
    loader = DataLoader()
    loader.run()

if __name__ == "__main__":
    main()
