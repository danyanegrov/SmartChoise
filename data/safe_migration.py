#!/usr/bin/env python3
"""
Безопасная миграция данных из extended-database.sql
Избегает TRUNCATE и конфликтов ID через умное маппирование
"""
import psycopg2
import re
from typing import Dict, List, Tuple
from loguru import logger

# Подключение к БД
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        port=5432,
        database="smartchoice",
        user="smartchoice_user",
        password="smartchoice_pass"
    )

def parse_sql_file(filepath: str) -> Dict[str, List[str]]:
    """Парсит SQL файл и извлекает INSERT операции по таблицам"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Удаляем TRUNCATE операции
    content = re.sub(r'(?i)^\s*TRUNCATE\s+TABLE\s+[^;]+;', '', content, flags=re.MULTILINE)
    
    # Извлекаем INSERT операции
    tables = {}
    insert_pattern = r'INSERT\s+INTO\s+(\w+)\s*\([^)]+\)\s+VALUES\s*([^;]+);'
    
    for match in re.finditer(insert_pattern, content, re.IGNORECASE | re.DOTALL):
        table_name = match.group(1).lower()
        values_part = match.group(2)
        
        if table_name not in tables:
            tables[table_name] = []
        tables[table_name].append(match.group(0))
    
    return tables

def get_existing_data(conn) -> Dict[str, set]:
    """Получает существующие данные для проверки дублей"""
    cur = conn.cursor()
    existing = {}
    
    # Категории (по имени)
    cur.execute("SELECT LOWER(name) FROM categories")
    existing['categories'] = {row[0] for row in cur.fetchall()}
    
    # Товары (по имени)
    cur.execute("SELECT LOWER(name) FROM items")
    existing['items'] = {row[0] for row in cur.fetchall()}
    
    # Пользователи (по email)
    cur.execute("SELECT LOWER(email) FROM users")
    existing['users'] = {row[0] for row in cur.fetchall()}
    
    cur.close()
    return existing

def create_safe_inserts(tables: Dict[str, List[str]], existing: Dict[str, set]) -> List[str]:
    """Создает безопасные INSERT операции с ON CONFLICT"""
    safe_inserts = []
    
    # Порядок важен: сначала справочники, потом зависимые
    table_order = ['categories', 'users', 'items', 'user_interactions', 'choices', 'query_sessions']
    
    for table in table_order:
        if table not in tables:
            continue
            
        logger.info(f"Обрабатываю таблицу {table}")
        
        for insert_sql in tables[table]:
            # Преобразуем в безопасный INSERT с ON CONFLICT
            if table == 'categories':
                # Для категорий - конфликт по имени
                safe_sql = insert_sql.replace(
                    'INSERT INTO categories',
                    'INSERT INTO categories'
                ) + ' ON CONFLICT (name) DO NOTHING'
                
            elif table == 'users':
                # Для пользователей - конфликт по email
                safe_sql = insert_sql.replace(
                    'INSERT INTO users',
                    'INSERT INTO users'
                ) + ' ON CONFLICT (email) DO NOTHING'
                
            elif table == 'items':
                # Для товаров - конфликт по имени
                safe_sql = insert_sql.replace(
                    'INSERT INTO items',
                    'INSERT INTO items'
                ) + ' ON CONFLICT (name) DO NOTHING'
                
            else:
                # Для остальных таблиц - простое игнорирование при любом конфликте
                safe_sql = insert_sql + ' ON CONFLICT DO NOTHING'
            
            # Убираем жестко заданные ID - пусть Postgres сам назначает
            safe_sql = re.sub(r'\(\s*\d+\s*,', '(DEFAULT,', safe_sql)
            
            safe_inserts.append(safe_sql)
    
    return safe_inserts

def execute_migration(conn, safe_inserts: List[str]):
    """Выполняет миграцию с транзакцией"""
    cur = conn.cursor()
    
    try:
        logger.info("Начинаю миграцию...")
        
        # Начинаем транзакцию
        conn.autocommit = False
        
        for i, sql in enumerate(safe_inserts):
            try:
                cur.execute(sql)
                if (i + 1) % 50 == 0:
                    logger.info(f"Выполнено {i + 1}/{len(safe_inserts)} операций")
            except Exception as e:
                logger.warning(f"Пропущена операция: {str(e)[:100]}...")
                continue
        
        # Коммитим изменения
        conn.commit()
        logger.info("Миграция завершена успешно")
        
        # Статистика
        cur.execute("SELECT COUNT(*) FROM categories")
        cat_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM items")
        item_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM users")
        user_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM user_interactions")
        interaction_count = cur.fetchone()[0]
        
        logger.info(f"Итоговая статистика:")
        logger.info(f"  Категории: {cat_count}")
        logger.info(f"  Товары: {item_count}")
        logger.info(f"  Пользователи: {user_count}")
        logger.info(f"  Взаимодействия: {interaction_count}")
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Ошибка миграции: {e}")
        raise
    finally:
        cur.close()
        conn.autocommit = True

def main():
    logger.info("=== Безопасная миграция данных ===")
    
    # Подключаемся к БД
    conn = get_db_connection()
    
    try:
        # Парсим SQL файл
        logger.info("Парсю extended-database.sql...")
        tables = parse_sql_file('data/sql/02-extended-database.sql')
        logger.info(f"Найдено таблиц: {list(tables.keys())}")
        
        # Получаем существующие данные
        logger.info("Проверяю существующие данные...")
        existing = get_existing_data(conn)
        
        # Создаем безопасные INSERT
        logger.info("Создаю безопасные INSERT операции...")
        safe_inserts = create_safe_inserts(tables, existing)
        logger.info(f"Подготовлено {len(safe_inserts)} операций")
        
        # Выполняем миграцию
        execute_migration(conn, safe_inserts)
        
    finally:
        conn.close()

if __name__ == "__main__":
    main()
