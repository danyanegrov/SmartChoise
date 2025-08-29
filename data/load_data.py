#!/usr/bin/env python3
"""
Data loader script for SmartChoice AI
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
                'category_id': 1,
                'price': 79999,
                'rating': 4.4,
                'rating_count': 156,
                'attributes': '{"brand": "Dell", "processor": "Intel i7", "ram": "16GB", "storage": "512GB", "display": "13.3"}'
            },
            {
                'name': 'Acer Aspire 5',
                'description': 'Бюджетный ноутбук для учебы и работы',
                'category_id': 1,
                'price': 38999,
                'rating': 3.9,
                'rating_count': 89,
                'attributes': '{"brand": "Acer", "processor": "AMD Ryzen 5", "ram": "8GB", "storage": "256GB"}'
            },
            {
                'name': 'Microsoft Surface Laptop',
                'description': 'Стильный ноутбук с сенсорным экраном',
                'category_id': 1,
                'price': 94999,
                'rating': 4.3,
                'rating_count': 134,
                'attributes': '{"brand": "Microsoft", "processor": "Intel i5", "ram": "8GB", "storage": "256GB", "touchscreen": true}'
            },

            # Больше смартфонов
            {
                'name': 'OnePlus 11',
                'description': 'Android смартфон с быстрой зарядкой',
                'category_id': 1,
                'price': 69990,
                'rating': 4.6,
                'rating_count': 234,
                'attributes': '{"brand": "OnePlus", "storage": "128GB", "ram": "8GB", "camera": "50MP"}'
            },
            {
                'name': 'Google Pixel 8',
                'description': 'Смартфон с лучшей камерой и чистым Android',
                'category_id': 1,
                'price': 79990,
                'rating': 4.8,
                'rating_count': 189,
                'attributes': '{"brand": "Google", "storage": "256GB", "ram": "8GB", "camera": "50MP", "ai": true}'
            },

            # Больше одежды
            {
                'name': 'Футболка Nike Dri-FIT',
                'description': 'Спортивная футболка с технологией отвода влаги',
                'category_id': 2,
                'price': 2990,
                'rating': 4.3,
                'rating_count': 67,
                'attributes': '{"brand": "Nike", "material": "polyester", "size": "M", "color": "black"}'
            },
            {
                'name': 'Куртка Columbia',
                'description': 'Теплая зимняя куртка с водоотталкивающим покрытием',
                'category_id': 2,
                'price': 15990,
                'rating': 4.7,
                'rating_count': 45,
                'attributes': '{"brand": "Columbia", "material": "nylon", "insulation": "down", "waterproof": true}'
            },

            # Больше книг
            {
                'name': 'Книга "1984"',
                'description': 'Антиутопический роман Джорджа Оруэлла',
                'category_id': 3,
                'price': 590,
                'rating': 4.8,
                'rating_count': 456,
                'attributes': '{"author": "Джордж Оруэлл", "genre": "антиутопия", "pages": 328}'
            },
            {
                'name': 'Книга "Мастер и Маргарита"',
                'description': 'Роман Михаила Булгакова',
                'category_id': 3,
                'price': 690,
                'rating': 4.9,
                'rating_count': 789,
                'attributes': '{"author": "Михаил Булгаков", "genre": "фантастика", "pages": 480}'
            },

            # Больше спортивных товаров
            {
                'name': 'Беговая дорожка ProForm',
                'description': 'Электрическая беговая дорожка для дома',
                'category_id': 4,
                'price': 89990,
                'rating': 4.2,
                'rating_count': 23,
                'attributes': '{"brand": "ProForm", "max_speed": "16 km/h", "incline": "10%", "foldable": true}'
            },
            {
                'name': 'Гантели Atlas Sport',
                'description': 'Разборные гантели для силовых тренировок',
                'category_id': 4,
                'price': 5990,
                'rating': 4.5,
                'rating_count': 89,
                'attributes': '{"brand": "Atlas Sport", "weight": "20kg", "adjustable": true, "material": "steel"}'
            }
        ]

        try:
            cursor = self.db_conn.cursor()
            
            for item in additional_items:
                cursor.execute("""
                    INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (name) DO NOTHING
                """, (
                    item['name'],
                    item['description'],
                    item['category_id'],
                    item['price'],
                    item['rating'],
                    item['rating_count'],
                    item['attributes']
                ))
            
            self.db_conn.commit()
            logger.info(f"Loaded {len(additional_items)} additional items")
            
        except Exception as e:
            logger.error(f"Failed to load additional items: {e}")
            self.db_conn.rollback()

    def generate_embeddings(self):
        """Generate embeddings for all items and store in Milvus"""
        try:
            if not self.milvus_collection:
                logger.warning("Milvus collection not available, skipping embedding generation")
                return

            # Get all items from database
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT i.id, i.name, i.description, c.name as category_name, i.attributes
                FROM items i
                LEFT JOIN categories c ON i.category_id = c.id
            """)
            
            items = cursor.fetchall()
            logger.info(f"Generating embeddings for {len(items)} items")

            # Prepare data for Milvus
            embeddings_data = []
            for item in items:
                # Combine name, description, and category for embedding
                text = f"{item[1]} {item[2]} {item[3]}"
                
                # Generate embedding
                embedding = self.embedder.encode(text)
                
                embeddings_data.append({
                    'id': len(embeddings_data),
                    'item_id': item[0],
                    'name': item[1],
                    'category': item[3] or '',
                    'embedding': embedding.tolist(),
                    'metadata': item[4] or '{}'
                })

            # Insert into Milvus
            if embeddings_data:
                # Prepare data arrays
                ids = [item['id'] for item in embeddings_data]
                item_ids = [item['item_id'] for item in embeddings_data]
                names = [item['name'] for item in embeddings_data]
                categories = [item['category'] for item in embeddings_data]
                embeddings = [item['embedding'] for item in embeddings_data]
                metadata = [item['metadata'] for item in embeddings_data]

                # Insert data
                data = [ids, item_ids, names, categories, embeddings, metadata]
                self.milvus_collection.insert(data)
                
                # Flush to ensure data is persisted
                self.milvus_collection.flush()
                
                logger.info(f"Successfully inserted {len(embeddings_data)} embeddings into Milvus")

        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")

    def load_sample_queries(self):
        """Load sample test queries"""
        sample_queries = [
            "Найди ноутбук для работы",
            "Покажи смартфоны с хорошей камерой",
            "Рекомендуй спортивную одежду",
            "Что выбрать для подарка на день рождения?",
            "Нужен бюджетный ноутбук для учебы",
            "Ищу качественные наушники",
            "Помоги выбрать подарок для мамы",
            "Какие книги почитать на выходных?",
            "Нужен велосипед для города",
            "Ищу кофемашину для дома"
        ]

        try:
            cursor = self.db_conn.cursor()
            
            for query in sample_queries:
                cursor.execute("""
                    INSERT INTO choices (query_text, processed_query, intent, algorithm_version)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (
                    query,
                    query.lower(),
                    'search',
                    'sample_v1'
                ))
            
            self.db_conn.commit()
            logger.info(f"Loaded {len(sample_queries)} sample queries")
            
        except Exception as e:
            logger.error(f"Failed to load sample queries: {e}")
            self.db_conn.rollback()

    def run(self):
        """Run the complete data loading process"""
        try:
            logger.info("Starting data loading process...")
            
            # Connect to databases
            self.connect_databases()
            
            # Load additional items
            self.load_additional_items()
            
            # Generate embeddings
            self.generate_embeddings()
            
            # Load sample queries
            self.load_sample_queries()
            
            logger.info("Data loading completed successfully!")
            
        except Exception as e:
            logger.error(f"Data loading failed: {e}")
        finally:
            if self.db_conn:
                self.db_conn.close()

if __name__ == "__main__":
    loader = DataLoader()
    loader.run()
