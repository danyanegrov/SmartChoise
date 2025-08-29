-- Расширенная база данных для системы интеллектуального выбора
-- Содержит 120+ товаров, 20+ пользователей, 600+ взаимодействий

-- Очистка существующих данных
TRUNCATE TABLE user_interactions, choices, query_sessions, items, categories, users RESTART IDENTITY CASCADE;

-- Вставка расширенного списка категорий
INSERT INTO categories (name, description, parent_id) VALUES
-- Основные категории
('Электроника', 'Электронные устройства и гаджеты', NULL),
('Автомобили', 'Легковые и коммерческие автомобили', NULL),
('Недвижимость', 'Квартиры, дома, коммерческая недвижимость', NULL),
('Книги', 'Литература, учебники, справочники', NULL),
('Одежда и обувь', 'Мужская, женская и детская одежда', NULL),
('Рестораны', 'Кафе, рестораны, доставка еды', NULL),
('Путешествия', 'Отели, туры, авиабилеты', NULL),
('Спорт и фитнес', 'Спортивные товары, тренажеры', NULL),
('Красота и здоровье', 'Косметика, медицина, wellness', NULL),
('Образование', 'Курсы, университеты, обучение', NULL),

-- Подкатегории электроники
('Ноутбуки', 'Портативные компьютеры', 1),
('Смартфоны', 'Мобильные телефоны', 1),
('Планшеты', 'Планшетные компьютеры', 1),
('Наушники', 'Проводные и беспроводные наушники', 1),
('Телевизоры', 'Smart TV, OLED, QLED телевизоры', 1),
('Игровые консоли', 'PlayStation, Xbox, Nintendo', 1),
('Камеры', 'Фотокамеры и видеокамеры', 1),

-- Подкатегории автомобилей
('Седаны', 'Легковые седаны', 2),
('Внедорожники', 'SUV и кроссоверы', 2),
('Хэтчбеки', 'Компактные автомобили', 2),
('Электромобили', 'Электрические автомобили', 2),

-- Подкатегории недвижимости
('Квартиры', 'Квартиры в многоэтажных домах', 3),
('Дома', 'Частные дома и коттеджи', 3),
('Коммерческая', 'Офисы, магазины, склады', 3),

-- Подкатегории книг
('Художественная литература', 'Романы, повести, рассказы', 4),
('Техническая литература', 'IT, инженерия, наука', 4),
('Бизнес книги', 'Менеджмент, маркетинг, финансы', 4),
('Учебники', 'Образовательная литература', 4);

-- Вставка пользователей (20 пользователей)
INSERT INTO users (username, email, hashed_password, full_name, preferences) VALUES
-- Администраторы
('admin', 'admin@choicesystem.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Системный администратор', '{"role": "admin", "categories": ["all"]}'),

-- IT специалисты
('alex_dev', 'alex@techcorp.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Александр Иванов', '{"categories": ["electronics", "books"], "budget": 150000, "interests": ["programming", "gaming"]}'),
('maria_data', 'maria@analytics.ru', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Мария Петрова', '{"categories": ["electronics", "education"], "budget": 100000, "interests": ["data_science", "ml"]}'),
('dmitry_full', 'dmitry@webdev.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Дмитрий Сидоров', '{"categories": ["electronics"], "budget": 80000, "interests": ["web_dev", "mobile"]}'),

-- Студенты
('student_anna', 'anna@university.edu', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Анна Смирнова', '{"categories": ["books", "electronics"], "budget": 50000, "interests": ["studying", "travel"]}'),
('student_igor', 'igor@student.ru', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Игорь Козлов', '{"categories": ["electronics", "sport"], "budget": 30000, "interests": ["gaming", "fitness"]}'),
('student_kate', 'kate@college.edu', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Екатерина Новикова', '{"categories": ["books", "beauty"], "budget": 25000, "interests": ["literature", "fashion"]}'),

-- Бизнесмены
('business_sergey', 'sergey@bizgroup.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Сергей Волков', '{"categories": ["cars", "real_estate"], "budget": 5000000, "interests": ["business", "luxury"]}'),
('entrepreneur_olga', 'olga@startup.io', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Ольга Морозова', '{"categories": ["electronics", "education"], "budget": 200000, "interests": ["startup", "innovation"]}'),
('manager_pavel', 'pavel@company.ru', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Павел Лебедев', '{"categories": ["cars", "travel"], "budget": 800000, "interests": ["management", "golf"]}'),

-- Семейные пользователи
('family_elena', 'elena@family.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Елена Соколова', '{"categories": ["electronics", "education", "travel"], "budget": 120000, "interests": ["family", "children"]}'),
('dad_mikhail', 'mikhail@home.ru', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Михаил Попов', '{"categories": ["cars", "sport", "electronics"], "budget": 300000, "interests": ["family", "football"]}'),
('mom_tatyana', 'tatyana@family.org', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Татьяна Орлова', '{"categories": ["beauty", "clothing", "books"], "budget": 80000, "interests": ["cooking", "reading"]}'),

-- Творческие личности
('artist_viktor', 'viktor@artworld.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Виктор Кузнецов', '{"categories": ["electronics", "books"], "budget": 90000, "interests": ["photography", "design"]}'),
('musician_daria', 'daria@music.ru', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Дарья Васильева', '{"categories": ["electronics", "education"], "budget": 70000, "interests": ["music", "teaching"]}'),
('writer_andrey', 'andrey@books.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Андрей Федоров', '{"categories": ["books", "electronics"], "budget": 60000, "interests": ["writing", "literature"]}'),

-- Пенсионеры
('senior_galina', 'galina@pension.ru', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Галина Николаевна', '{"categories": ["books", "health"], "budget": 30000, "interests": ["reading", "health"]}'),
('senior_vladimir', 'vladimir@veteran.org', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Владимир Петрович', '{"categories": ["books", "electronics"], "budget": 40000, "interests": ["history", "gardening"]}'),

-- Молодые специалисты
('young_nikita', 'nikita@junior.dev', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Никита Романов', '{"categories": ["electronics", "sport"], "budget": 45000, "interests": ["coding", "cycling"]}'),
('young_nastya', 'nastya@marketing.agency', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Анастасия Жукова', '{"categories": ["beauty", "clothing", "travel"], "budget": 55000, "interests": ["marketing", "fashion"]}');

-- =============================================
-- НОУТБУКИ (Категория 11) - 25 товаров
-- =============================================

-- Премиум ноутбуки
INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes) VALUES
('MacBook Pro 16" M3 Max', 'Профессиональный ноутбук для разработчиков и креативщиков с чипом M3 Max, 36GB RAM, 1TB SSD', 11, 349999, 4.8, 234, '{"brand": "Apple", "processor": "M3 Max", "ram": "36GB", "storage": "1TB SSD", "display": "16.2\" Liquid Retina XDR", "gpu": "M3 Max 40-core GPU", "weight": "2.16 kg"}'),
('MacBook Pro 14" M3 Pro', 'Компактный профессиональный ноутбук с M3 Pro, идеален для мобильной работы', 11, 249999, 4.7, 312, '{"brand": "Apple", "processor": "M3 Pro", "ram": "18GB", "storage": "512GB SSD", "display": "14.2\" Liquid Retina XDR", "gpu": "M3 Pro 18-core GPU", "weight": "1.61 kg"}'),
('MacBook Air 15" M3', 'Большой экран в тонком корпусе, отличная автономность для работы и учебы', 11, 149999, 4.6, 189, '{"brand": "Apple", "processor": "M3", "ram": "8GB", "storage": "256GB SSD", "display": "15.3\" Liquid Retina", "gpu": "M3 10-core GPU", "weight": "1.51 kg"}'),
('MacBook Air 13" M3', 'Классический Air с новейшим чипом M3, идеальный баланс производительности и портативности', 11, 119999, 4.6, 267, '{"brand": "Apple", "processor": "M3", "ram": "8GB", "storage": "256GB SSD", "display": "13.6\" Liquid Retina", "gpu": "M3 8-core GPU", "weight": "1.24 kg"}'),
('Dell XPS 15 9530', 'Премиальный ультрабук с OLED дисплеем и производительностью для профессионалов', 11, 189999, 4.5, 156, '{"brand": "Dell", "processor": "Intel Core i7-13700H", "ram": "32GB", "storage": "1TB SSD", "display": "15.6\" OLED 4K", "gpu": "NVIDIA RTX 4070", "weight": "1.96 kg"}'),
('Lenovo ThinkPad X1 Carbon Gen 11', 'Легендарная надежность ThinkPad в современном исполнении, для бизнеса', 11, 169999, 4.6, 203, '{"brand": "Lenovo", "processor": "Intel Core i7-1365U", "ram": "16GB", "storage": "512GB SSD", "display": "14\" 2.8K OLED", "gpu": "Intel Iris Xe", "weight": "1.12 kg"}'),
('HP Spectre x360 16', 'Трансформер премиум-класса с поворотным экраном и стилусом', 11, 159999, 4.4, 124, '{"brand": "HP", "processor": "Intel Core i7-1260P", "ram": "16GB", "storage": "512GB SSD", "display": "16\" 3K+ OLED Touch", "gpu": "Intel Iris Xe", "weight": "2.02 kg"}'),

-- Игровые ноутбуки
('ASUS ROG Strix SCAR 18', 'Флагманский игровой ноутбук с максимальной производительностью', 11, 299999, 4.7, 145, '{"brand": "ASUS", "processor": "Intel Core i9-13980HX", "ram": "32GB", "storage": "1TB SSD", "display": "18\" QHD+ 240Hz", "gpu": "NVIDIA RTX 4090", "weight": "3.1 kg", "cooling": "ROG Intelligent Cooling"}'),
('MSI Raider GE78 HX', 'Топовый игровой ноутбук с RGB подсветкой и жидкостным охлаждением', 11, 279999, 4.6, 89, '{"brand": "MSI", "processor": "Intel Core i9-13980HX", "ram": "32GB", "storage": "2TB SSD", "display": "17.3\" QHD 240Hz", "gpu": "NVIDIA RTX 4080", "weight": "3.0 kg", "cooling": "Cooler Boost 5"}'),
('ASUS TUF Gaming A17', 'Доступный игровой ноутбук с военной прочностью', 11, 89999, 4.3, 234, '{"brand": "ASUS", "processor": "AMD Ryzen 7 7735HS", "ram": "16GB", "storage": "512GB SSD", "display": "17.3\" FHD 144Hz", "gpu": "NVIDIA RTX 4060", "weight": "2.6 kg", "cooling": "Self-Cleaning Cooling"}'),
('Lenovo Legion Pro 7i', 'Производительный игровой ноутбук с системой охлаждения Legion Coldfront', 11, 199999, 4.5, 156, '{"brand": "Lenovo", "processor": "Intel Core i7-13700HX", "ram": "16GB", "storage": "512GB SSD", "display": "16\" WQXGA 240Hz", "gpu": "NVIDIA RTX 4070", "weight": "2.5 kg", "cooling": "Legion Coldfront 5.0"}'),

-- Ультрабуки среднего класса
('Acer Swift X 14', 'Легкий ультрабук с дискретной графикой для креативных задач', 11, 79999, 4.2, 143, '{"brand": "Acer", "processor": "Intel Core i5-1240P", "ram": "16GB", "storage": "512GB SSD", "display": "14\" 2.8K OLED", "gpu": "NVIDIA RTX 3050", "weight": "1.55 kg"}'),
('ASUS VivoBook Pro 15', 'Производительный ноутбук для работы и творчества с OLED экраном', 11, 89999, 4.1, 167, '{"brand": "ASUS", "processor": "Intel Core i7-12700H", "ram": "16GB", "storage": "512GB SSD", "display": "15.6\" OLED 2.8K", "gpu": "NVIDIA RTX 3050", "weight": "1.80 kg"}'),
('Xiaomi RedmiBook Pro 15', 'Стильный ультрабук с отличным экраном по доступной цене', 11, 59999, 4.0, 198, '{"brand": "Xiaomi", "processor": "Intel Core i5-11300H", "ram": "16GB", "storage": "512GB SSD", "display": "15.6\" 3.2K", "gpu": "Intel Iris Xe", "weight": "1.8 kg"}'),
('Honor MagicBook X 15', 'Доступный ультрабук для повседневных задач', 11, 39999, 3.8, 234, '{"brand": "Honor", "processor": "Intel Core i3-10110U", "ram": "8GB", "storage": "256GB SSD", "display": "15.6\" FHD", "gpu": "Intel UHD Graphics", "weight": "1.56 kg"}'),

-- Бюджетные ноутбуки
('Acer Aspire 5 A515', 'Надежный ноутбук для учебы и работы', 11, 45999, 3.9, 567, '{"brand": "Acer", "processor": "AMD Ryzen 5 5500U", "ram": "8GB", "storage": "512GB SSD", "display": "15.6\" FHD", "gpu": "AMD Radeon Graphics", "weight": "1.7 kg"}'),
('HP Pavilion 15', 'Популярный ноутбук для дома и офиса', 11, 49999, 3.8, 432, '{"brand": "HP", "processor": "Intel Core i5-1235U", "ram": "8GB", "storage": "512GB SSD", "display": "15.6\" FHD", "gpu": "Intel Iris Xe", "weight": "1.75 kg"}'),
('Lenovo IdeaPad 3 15', 'Простой и надежный ноутбук для повседневных задач', 11, 35999, 3.7, 389, '{"brand": "Lenovo", "processor": "AMD Ryzen 3 5300U", "ram": "8GB", "storage": "256GB SSD", "display": "15.6\" FHD", "gpu": "AMD Radeon Graphics", "weight": "1.65 kg"}'),
('ASUS VivoBook 15', 'Стильный ноутбук с яркими цветовыми решениями', 11, 41999, 3.8, 298, '{"brand": "ASUS", "processor": "Intel Core i3-1215U", "ram": "8GB", "storage": "256GB SSD", "display": "15.6\" FHD", "gpu": "Intel UHD Graphics", "weight": "1.7 kg"}');

-- =============================================
-- СМАРТФОНЫ (Категория 12) - 20 товаров
-- =============================================

-- Флагманские iPhone
INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes) VALUES
('iPhone 15 Pro Max', 'Топовый iPhone с титановым корпусом и камерой 48MP с 5x зумом', 12, 134999, 4.8, 456, '{"brand": "Apple", "display": "6.7\" Super Retina XDR", "storage": "256GB", "camera": "48MP + 12MP + 12MP", "processor": "A17 Pro", "battery": "4441 mAh", "5G": true, "color": "Natural Titanium"}'),
('iPhone 15 Pro', 'Профессиональный iPhone в компактном корпусе с Action Button', 12, 109999, 4.7, 389, '{"brand": "Apple", "display": "6.1\" Super Retina XDR", "storage": "128GB", "camera": "48MP + 12MP + 12MP", "processor": "A17 Pro", "battery": "3274 mAh", "5G": true, "color": "Blue Titanium"}'),
('iPhone 15 Plus', 'Большой экран iPhone по доступной цене', 12, 94999, 4.6, 267, '{"brand": "Apple", "display": "6.7\" Super Retina XDR", "storage": "128GB", "camera": "48MP + 12MP", "processor": "A16 Bionic", "battery": "4383 mAh", "5G": true, "color": "Pink"}'),
('iPhone 15', 'Базовый iPhone 15 с Dynamic Island и USB-C', 12, 79999, 4.5, 543, '{"brand": "Apple", "display": "6.1\" Super Retina XDR", "storage": "128GB", "camera": "48MP + 12MP", "processor": "A16 Bionic", "battery": "3349 mAh", "5G": true, "color": "Blue"}'),

-- Samsung Galaxy S серия
('Samsung Galaxy S24 Ultra', 'Самый мощный Galaxy с S Pen и камерой 200MP', 12, 124999, 4.6, 234, '{"brand": "Samsung", "display": "6.8\" Dynamic AMOLED 2X", "storage": "256GB", "camera": "200MP + 50MP + 12MP + 10MP", "processor": "Snapdragon 8 Gen 3", "battery": "5000 mAh", "5G": true, "s_pen": true}'),
('Samsung Galaxy S24+', 'Увеличенный Galaxy S24 с улучшенной автономностью', 12, 89999, 4.5, 156, '{"brand": "Samsung", "display": "6.7\" Dynamic AMOLED 2X", "storage": "256GB", "camera": "50MP + 12MP + 10MP", "processor": "Exynos 2400", "battery": "4900 mAh", "5G": true, "s_pen": false}'),
('Samsung Galaxy S24', 'Компактный флагман Samsung с AI функциями', 12, 74999, 4.4, 298, '{"brand": "Samsung", "display": "6.2\" Dynamic AMOLED 2X", "storage": "128GB", "camera": "50MP + 12MP + 10MP", "processor": "Exynos 2400", "battery": "4000 mAh", "5G": true, "s_pen": false}'),

-- Google Pixel
('Google Pixel 8 Pro', 'Флагман Google с чистым Android и лучшими AI функциями', 12, 79999, 4.5, 123, '{"brand": "Google", "display": "6.7\" LTPO OLED", "storage": "128GB", "camera": "50MP + 48MP + 48MP", "processor": "Google Tensor G3", "battery": "5050 mAh", "5G": true, "ai_features": true}'),
('Google Pixel 8', 'Компактный Pixel с чистым Android', 12, 64999, 4.4, 167, '{"brand": "Google", "display": "6.2\" OLED", "storage": "128GB", "camera": "50MP + 12MP", "processor": "Google Tensor G3", "battery": "4575 mAh", "5G": true, "ai_features": true}'),

-- Xiaomi флагманы
('Xiaomi 14 Ultra', 'Камерофон с объективами Leica и профессиональной съемкой', 12, 89999, 4.6, 89, '{"brand": "Xiaomi", "display": "6.73\" AMOLED", "storage": "512GB", "camera": "50MP + 50MP + 50MP + 50MP", "processor": "Snapdragon 8 Gen 3", "battery": "5300 mAh", "5G": true, "leica": true}'),
('Xiaomi 14', 'Компактный флагман с отличной камерой', 12, 64999, 4.4, 134, '{"brand": "Xiaomi", "display": "6.36\" AMOLED", "storage": "256GB", "camera": "50MP + 50MP + 50MP", "processor": "Snapdragon 8 Gen 3", "battery": "4610 mAh", "5G": true, "leica": true}'),
('Xiaomi Redmi Note 13 Pro+', 'Лучший смартфон среднего класса с камерой 200MP', 12, 29999, 4.1, 456, '{"brand": "Xiaomi", "display": "6.67\" AMOLED", "storage": "256GB", "camera": "200MP + 8MP + 2MP", "processor": "Dimensity 7200", "battery": "5000 mAh", "5G": true, "fast_charging": "120W"}'),

-- OnePlus
('OnePlus 12', 'Флагман-убийца с быстрой зарядкой и отличной производительностью', 12, 69999, 4.5, 156, '{"brand": "OnePlus", "display": "6.82\" AMOLED", "storage": "256GB", "camera": "50MP + 64MP + 48MP", "processor": "Snapdragon 8 Gen 3", "battery": "5400 mAh", "5G": true, "fast_charging": "100W"}'),
('OnePlus Nord 3', 'Среднебюджетный смартфон с флагманскими функциями', 12, 34999, 4.2, 187, '{"brand": "OnePlus", "display": "6.74\" AMOLED", "storage": "128GB", "camera": "50MP + 8MP + 2MP", "processor": "Dimensity 9000", "battery": "5000 mAh", "5G": true, "fast_charging": "80W"}'),

-- Средний ценовой сегмент
('Samsung Galaxy A55', 'Надежный смартфон среднего класса с защитой IP67', 12, 32999, 4.0, 234, '{"brand": "Samsung", "display": "6.6\" Super AMOLED", "storage": "128GB", "camera": "50MP + 12MP + 5MP", "processor": "Exynos 1480", "battery": "5000 mAh", "5G": true, "ip67": true}'),
('Xiaomi Poco X6 Pro', 'Игровой смартфон по доступной цене', 12, 24999, 4.1, 298, '{"brand": "Xiaomi", "display": "6.67\" AMOLED", "storage": "256GB", "camera": "64MP + 8MP + 2MP", "processor": "Dimensity 8300", "battery": "5000 mAh", "5G": true, "gaming": true}'),

-- Бюджетные смартфоны
('Xiaomi Redmi 13C', 'Доступный смартфон для повседневных задач', 12, 12999, 3.8, 456, '{"brand": "Xiaomi", "display": "6.74\" IPS", "storage": "128GB", "camera": "50MP + 2MP + 0.08MP", "processor": "Helio G85", "battery": "5000 mAh", "4G": true, "budget": true}'),
('Samsung Galaxy A15', 'Простой и надежный Samsung с хорошей автономностью', 12, 15999, 3.7, 567, '{"brand": "Samsung", "display": "6.5\" Super AMOLED", "storage": "128GB", "camera": "50MP + 5MP + 2MP", "processor": "Helio G99", "battery": "5000 mAh", "4G": true, "budget": true}'),
('Realme C55', 'Яркий дизайн и хорошие характеристики за небольшие деньги', 12, 13999, 3.6, 389, '{"brand": "Realme", "display": "6.72\" IPS", "storage": "128GB", "camera": "64MP + 2MP", "processor": "Helio G88", "battery": "5000 mAh", "4G": true, "budget": true}');

-- =============================================
-- АВТОМОБИЛИ - Седаны (Категория 18) - 15 товаров
-- =============================================

-- Премиум седаны
INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes) VALUES
('Mercedes-Benz S-Class 350d', 'Флагманский седан Mercedes с роскошным интерьером и передовыми технологиями', 18, 8500000, 4.8, 45, '{"brand": "Mercedes-Benz", "year": 2024, "engine": "3.0L V6 Diesel", "power": "286 hp", "transmission": "9G-TRONIC", "fuel_type": "Дизель", "consumption": "6.4 л/100км", "drive": "Задний", "seats": 5}'),
('BMW 7 Series 740i', 'Технологичный флагман BMW с инновационными решениями', 18, 7200000, 4.7, 67, '{"brand": "BMW", "year": 2024, "engine": "3.0L I6 Turbo", "power": "381 hp", "transmission": "8-ступенчатая автомат", "fuel_type": "Бензин", "consumption": "7.8 л/100км", "drive": "Задний", "seats": 5}'),
('Audi A8 55 TFSI', 'Элегантный флагман Audi с передовой мультимедийной системой', 18, 6800000, 4.6, 34, '{"brand": "Audi", "year": 2024, "engine": "3.0L V6 TFSI", "power": "340 hp", "transmission": "Tiptronic", "fuel_type": "Бензин", "consumption": "7.6 л/100км", "drive": "Полный quattro", "seats": 5}'),
('Lexus LS 500h', 'Гибридный флагман Lexus с уникальным дизайном', 18, 6500000, 4.7, 28, '{"brand": "Lexus", "year": 2024, "engine": "3.5L V6 Hybrid", "power": "359 hp", "transmission": "CVT", "fuel_type": "Гибрид", "consumption": "6.0 л/100км", "drive": "Полный", "seats": 5}'),

-- Бизнес седаны
('BMW 5 Series 520i', 'Популярный бизнес-седан с отличной управляемостью', 18, 4200000, 4.5, 123, '{"brand": "BMW", "year": 2024, "engine": "2.0L I4 Turbo", "power": "184 hp", "transmission": "8-ступенчатая автомат", "fuel_type": "Бензин", "consumption": "6.8 л/100км", "drive": "Задний", "seats": 5}'),
('Mercedes-Benz E-Class 200', 'Элегантный E-Class с комфортным салоном', 18, 4500000, 4.4, 156, '{"brand": "Mercedes-Benz", "year": 2024, "engine": "2.0L I4 Turbo", "power": "204 hp", "transmission": "9G-TRONIC", "fuel_type": "Бензин", "consumption": "7.1 л/100км", "drive": "Задний", "seats": 5}'),
('Audi A6 45 TFSI', 'Технологичный A6 с виртуальной приборной панелью', 18, 4300000, 4.3, 89, '{"brand": "Audi", "year": 2024, "engine": "2.0L TFSI", "power": "265 hp", "transmission": "S tronic", "fuel_type": "Бензин", "consumption": "6.9 л/100км", "drive": "Полный quattro", "seats": 5}'),
('Genesis G90', 'Роскошный корейский седан с премиальным оснащением', 18, 5200000, 4.6, 56, '{"brand": "Genesis", "year": 2024, "engine": "3.5L V6 Turbo", "power": "409 hp", "transmission": "8-ступенчатая автомат", "fuel_type": "Бензин", "consumption": "9.2 л/100км", "drive": "Полный", "seats": 5}'),

-- Массовые седаны
('Toyota Camry 2.5', 'Надежный и популярный седан с отличной репутацией', 18, 2800000, 4.4, 456, '{"brand": "Toyota", "year": 2024, "engine": "2.5L I4", "power": "199 hp", "transmission": "8-ступенчатая автомат", "fuel_type": "Бензин", "consumption": "7.8 л/100км", "drive": "Передний", "seats": 5}'),
('Honda Accord 1.5T', 'Просторный седан с турбированным двигателем', 18, 2600000, 4.3, 234, '{"brand": "Honda", "year": 2024, "engine": "1.5L Turbo", "power": "192 hp", "transmission": "CVT", "fuel_type": "Бензин", "consumption": "6.7 л/100км", "drive": "Передний", "seats": 5}'),
('Hyundai Sonata 2.0', 'Стильный корейский седан с богатым оснащением', 18, 2200000, 4.1, 298, '{"brand": "Hyundai", "year": 2024, "engine": "2.0L MPI", "power": "150 hp", "transmission": "6-ступенчатая автомат", "fuel_type": "Бензин", "consumption": "7.4 л/100км", "drive": "Передний", "seats": 5}');

-- =============================================
-- ВНЕДОРОЖНИКИ (Категория 19) - 15 товаров
-- =============================================

-- Премиум внедорожники
INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes) VALUES
('Range Rover Autobiography', 'Король внедорожников с непревзойденным комфортом', 19, 12500000, 4.8, 23, '{"brand": "Land Rover", "year": 2024, "engine": "5.0L V8 Supercharged", "power": "525 hp", "transmission": "8-ступенчатая автомат", "fuel_type": "Бензин", "consumption": "13.1 л/100км", "drive": "Полный", "ground_clearance": "297 мм"}'),
('Mercedes-Benz G 63 AMG', 'Легендарный Гелендваген в спортивной версии AMG', 19, 15800000, 4.9, 34, '{"brand": "Mercedes-Benz", "year": 2024, "engine": "4.0L V8 Biturbo", "power": "585 hp", "transmission": "9G-TRONIC", "fuel_type": "Бензин", "consumption": "13.8 л/100км", "drive": "Полный", "ground_clearance": "241 мм"}'),
('BMW X7 M60i', 'Роскошный семиместный внедорожник BMW', 19, 8900000, 4.6, 45, '{"brand": "BMW", "year": 2024, "engine": "4.4L V8 TwinTurbo", "power": "530 hp", "transmission": "8-ступенчатая автомат", "fuel_type": "Бензин", "consumption": "11.7 л/100км", "drive": "Полный xDrive", "seats": 7}'),

-- Средние внедорожники
('Toyota Land Cruiser 300', 'Легендарная надежность и проходимость Toyota', 19, 6800000, 4.7, 189, '{"brand": "Toyota", "year": 2024, "engine": "3.5L V6 Twin-Turbo", "power": "415 hp", "transmission": "10-ступенчатая автомат", "fuel_type": "Бензин", "consumption": "10.2 л/100км", "drive": "Полный", "seats": 7}'),
('Ford Explorer 2.3 EcoBoost', 'Американский внедорожник для больших семей', 19, 4200000, 4.3, 156, '{"brand": "Ford", "year": 2024, "engine": "2.3L EcoBoost", "power": "300 hp", "transmission": "10-ступенчатая автомат", "fuel_type": "Бензин", "consumption": "9.4 л/100км", "drive": "Полный", "seats": 7}'),

-- Компактные кроссоверы
('Toyota RAV4 2.5 Hybrid', 'Популярный гибридный кроссовер', 19, 3200000, 4.4, 345, '{"brand": "Toyota", "year": 2024, "engine": "2.5L Hybrid", "power": "222 hp", "transmission": "CVT", "fuel_type": "Гибрид", "consumption": "4.8 л/100км", "drive": "Полный", "seats": 5}'),
('Honda CR-V 1.5T', 'Надежный и экономичный кроссовер', 19, 2800000, 4.2, 267, '{"brand": "Honda", "year": 2024, "engine": "1.5L Turbo", "power": "193 hp", "transmission": "CVT", "fuel_type": "Бензин", "consumption": "7.0 л/100км", "drive": "Полный", "seats": 5}'),
('Mazda CX-5 2.5', 'Стильный кроссовер с отличной управляемостью', 19, 2600000, 4.3, 234, '{"brand": "Mazda", "year": 2024, "engine": "2.5L SKYACTIV-G", "power": "194 hp", "transmission": "6-ступенчатая автомат", "fuel_type": "Бензин", "consumption": "7.2 л/100км", "drive": "Полный", "seats": 5}'),
('Subaru Forester 2.0', 'Симметричный полный привод и высокая безопасность', 19, 2400000, 4.1, 189, '{"brand": "Subaru", "year": 2024, "engine": "2.0L BOXER", "power": "150 hp", "transmission": "CVT", "fuel_type": "Бензин", "consumption": "7.4 л/100км", "drive": "Полный", "seats": 5}'),
('Hyundai Tucson 2.0', 'Современный дизайн и богатое оснащение', 19, 2300000, 4.0, 298, '{"brand": "Hyundai", "year": 2024, "engine": "2.0L MPI", "power": "156 hp", "transmission": "6-ступенчатая автомат", "fuel_type": "Бензин", "consumption": "7.8 л/100км", "drive": "Полный", "seats": 5}');

-- =============================================
-- КНИГИ - Техническая литература (Категория 25) - 15 товаров
-- =============================================

-- IT и программирование
INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes) VALUES
('Чистый код. Создание, анализ и рефакторинг', 'Классическое руководство по написанию качественного кода от Роберта Мартина', 25, 2299, 4.8, 1234, '{"author": "Роберт Мартин", "pages": 464, "publisher": "Питер", "year": 2023, "language": "Русский", "genre": "Программирование", "level": "Средний"}'),
('Python для анализа данных', 'Библиотеки pandas, NumPy и IPython от создателя pandas', 25, 3499, 4.7, 892, '{"author": "Уэс Маккинни", "pages": 544, "publisher": "ДМК Пресс", "year": 2023, "language": "Русский", "genre": "Python", "level": "Средний"}'),
('Изучаем Python. 5-е издание', 'Всеобъемлющее руководство по Python для начинающих и опытных программистов', 25, 4199, 4.6, 567, '{"author": "Марк Лутц", "pages": 1280, "publisher": "Вильямс", "year": 2024, "language": "Русский", "genre": "Python", "level": "Начинающий"}'),
('JavaScript. Подробное руководство', 'Полный справочник по современному JavaScript', 25, 3799, 4.5, 445, '{"author": "Дэвид Флэнаган", "pages": 1056, "publisher": "Вильямс", "year": 2023, "language": "Русский", "genre": "JavaScript", "level": "Средний"}'),
('Алгоритмы. Построение и анализ', 'Классический учебник по алгоритмам и структурам данных', 25, 5499, 4.9, 678, '{"author": "Кормен, Лейзерсон, Ривест", "pages": 1296, "publisher": "Вильямс", "year": 2023, "language": "Русский", "genre": "Алгоритмы", "level": "Продвинутый"}'),
('Паттерны проектирования', 'Gang of Four - основы объектно-oriented программирования', 25, 2899, 4.6, 789, '{"author": "Эрих Гамма и др.", "pages": 368, "publisher": "Питер", "year": 2023, "language": "Русский", "genre": "Паттерны", "level": "Средний"}'),
('Рефакторинг. Улучшение проекта существующего кода', 'Как улучшать код без изменения функциональности', 25, 3299, 4.5, 456, '{"author": "Мартин Фаулер", "pages": 464, "publisher": "Вильямс", "year": 2024, "language": "Русский", "genre": "Рефакторинг", "level": "Средний"}'),

-- Machine Learning и AI
('Hands-On Machine Learning', 'Практическое руководство по машинному обучению с Scikit-Learn и TensorFlow', 25, 4799, 4.8, 567, '{"author": "Орельен Жерон", "pages": 688, "publisher": "Вильямс", "year": 2024, "language": "Русский", "genre": "ML", "level": "Средний"}'),
('Глубокое обучение', 'Фундаментальный учебник по deep learning от экспертов отрасли', 25, 5299, 4.7, 345, '{"author": "Ян Гудфеллоу и др.", "pages": 792, "publisher": "ДМК Пресс", "year": 2023, "language": "Русский", "genre": "Deep Learning", "level": "Продвинутый"}'),
('Машинное обучение', 'Классический учебник по теории машинного обучения', 25, 4199, 4.6, 278, '{"author": "Том Митчелл", "pages": 432, "publisher": "Бином", "year": 2023, "language": "Русский", "genre": "ML", "level": "Средний"}'),
('Искусственный интеллект. Современный подход', 'Всеобъемлющее введение в ИИ от ведущих специалистов', 25, 6999, 4.8, 189, '{"author": "Стюарт Рассел, Питер Норвиг", "pages": 1408, "publisher": "Вильямс", "year": 2024, "language": "Русский", "genre": "AI", "level": "Продвинутый"}'),

-- Web разработка
('HTML и CSS. Дизайн и построение веб-сайтов', 'Визуальное введение в веб-разработку', 25, 2799, 4.3, 456, '{"author": "Джон Дакетт", "pages": 512, "publisher": "Эксмо", "year": 2023, "language": "Русский", "genre": "Web", "level": "Начинающий"}'),
('React в действии', 'Практическое руководство по React для современной веб-разработки', 25, 3499, 4.4, 234, '{"author": "Марк Тилков", "pages": 384, "publisher": "Питер", "year": 2024, "language": "Русский", "genre": "React", "level": "Средний"}'),
('Node.js в действии', 'Создание веб-приложений на JavaScript', 25, 3299, 4.2, 167, '{"author": "Майк Кантелон", "pages": 432, "publisher": "Питер", "year": 2023, "language": "Русский", "genre": "Node.js", "level": "Средний"}'),

-- Базы данных
('Высокопроизводительный MySQL', 'Оптимизация, резервное копирование, мониторинг', 25, 4499, 4.6, 123, '{"author": "Барон Шварц", "pages": 832, "publisher": "Вильямс", "year": 2023, "language": "Русский", "genre": "Базы данных", "level": "Продвинутый"}');

-- =============================================
-- ХУДОЖЕСТВЕННАЯ ЛИТЕРАТУРА (Категория 24) - 20 товаров  
-- =============================================

-- Классическая русская литература
INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes) VALUES
('Война и мир', 'Великий роман Льва Толстого о войне, мире и человеческих судьбах', 24, 899, 4.8, 2345, '{"author": "Лев Толстой", "pages": 1408, "publisher": "АСТ", "year": 2024, "language": "Русский", "genre": "Классика", "period": "XIX век"}'),
('Преступление и наказание', 'Психологический роман Достоевского о преступлении и искуплении', 24, 699, 4.7, 1897, '{"author": "Федор Достоевский", "pages": 608, "publisher": "Эксмо", "year": 2024, "language": "Русский", "genre": "Классика", "period": "XIX век"}'),
('Мастер и Маргарита', 'Мистический роман о добре и зле, любви и предательстве', 24, 799, 4.8, 1567, '{"author": "Михаил Булгаков", "pages": 480, "publisher": "АСТ", "year": 2024, "language": "Русский", "genre": "Мистика", "period": "XX век"}'),
('Анна Каренина', 'История трагической любви в высшем обществе XIX века', 24, 799, 4.6, 1234, '{"author": "Лев Толстой", "pages": 768, "publisher": "Эксмо", "year": 2024, "language": "Русский", "genre": "Классика", "period": "XIX век"}'),
('Братья Карамазовы', 'Последний роман Достоевского о семье, вере и человеческой природе', 24, 899, 4.7, 987, '{"author": "Федор Достоевский", "pages": 880, "publisher": "АСТ", "year": 2024, "language": "Русский", "genre": "Классика", "period": "XIX век"}'),

-- Современная русская литература
('Зулейха открывает глаза', 'Роман о судьбе татарской женщины в эпоху репрессий', 24, 599, 4.5, 1456, '{"author": "Гузель Яхина", "pages": 448, "publisher": "АСТ", "year": 2024, "language": "Русский", "genre": "Исторический роман", "period": "XXI век"}'),
('Лавр', 'Мистический роман о средневековом целителе', 24, 699, 4.6, 789, '{"author": "Евгений Водолазкин", "pages": 440, "publisher": "Эксмо", "year": 2024, "language": "Русский", "genre": "Мистика", "period": "XXI век"}'),

-- Зарубежная классика
('1984', 'Антиутопия Оруэлла о тоталитарном обществе', 24, 599, 4.7, 2134, '{"author": "Джордж Оруэлл", "pages": 320, "publisher": "АСТ", "year": 2024, "language": "Русский", "genre": "Антиутопия", "period": "XX век"}'),
('Убить пересмешника', 'Роман о детстве, справедливости и предрассудках', 24, 699, 4.6, 1678, '{"author": "Харпер Ли", "pages": 384, "publisher": "Эксмо", "year": 2024, "language": "Русский", "genre": "Драма", "period": "XX век"}'),
('Великий Гэтсби', 'История американской мечты и разочарования', 24, 549, 4.5, 1345, '{"author": "Фрэнсис Скотт Фицджеральд", "pages": 256, "publisher": "АСТ", "year": 2024, "language": "Русский", "genre": "Классика", "period": "XX век"}'),
('Сто лет одиночества', 'Магический реализм Маркеса о семье Буэндиа', 24, 799, 4.8, 987, '{"author": "Габриэль Гарсиа Маркес", "pages": 448, "publisher": "Эксмо", "year": 2024, "language": "Русский", "genre": "Магический реализм", "period": "XX век"}'),

-- Фэнтези и фантастика
('Гарри Поттер и философский камень', 'Первая книга о мальчике-волшебнике', 24, 699, 4.8, 3456, '{"author": "Дж.К. Роулинг", "pages": 432, "publisher": "Махаон", "year": 2024, "language": "Русский", "genre": "Фэнтези", "age": "12+"}'),
('Властелин колец. Братство кольца', 'Первая часть эпической трилогии Толкина', 24, 899, 4.9, 2345, '{"author": "Дж.Р.Р. Толкин", "pages": 704, "publisher": "АСТ", "year": 2024, "language": "Русский", "genre": "Фэнтези", "age": "16+"}'),
('Дюна', 'Космическая сага Герберта о планете специй', 24, 799, 4.6, 1456, '{"author": "Фрэнк Герберт", "pages": 688, "publisher": "Эксмо", "year": 2024, "language": "Русский", "genre": "Фантастика", "age": "16+"}'),
('Игра престолов', 'Первая книга эпической саги Мартина', 24, 999, 4.7, 1789, '{"author": "Джордж Мартин", "pages": 864, "publisher": "АСТ", "year": 2024, "language": "Русский", "genre": "Фэнтези", "age": "18+"}'),

-- Детективы и триллеры
('Девушка с татуировкой дракона', 'Скандинавский детектив Ларссона', 24, 649, 4.4, 1234, '{"author": "Стиг Ларссон", "pages": 480, "publisher": "Эксмо", "year": 2024, "language": "Русский", "genre": "Детектив", "age": "18+"}'),
('Код да Винчи', 'Мистический триллер о тайнах истории', 24, 699, 4.2, 2456, '{"author": "Дэн Браун", "pages": "560, "publisher": "АСТ", "year": 2024, "language": "Русский", "genre": "Триллер", "age": "16+"}'),
('Шерлок Холмс. Полное собрание', 'Все рассказы и повести о великом сыщике', 24, 1299, 4.8, 1567, '{"author": "Артур Конан Дойл", "pages": 1200, "publisher": "Эксмо", "year": 2024, "language": "Русский", "genre": "Детектив", "age": "12+"}'),

-- Современная художественная литература
('Атлас расправил плечи', 'Философский роман Айн Рэнд об объективизме', 24, 1299, 4.3, 234, '{"author": "Айн Рэнд", "pages": 1168, "publisher": "Альпина Паблишер", "year": 2024, "language": "Русский", "genre": "Философская проза", "period": "XX век"}'),
('Над пропастью во ржи', 'Культовый роман о подростковом бунте', 24, 599, 4.2, 1876, '{"author": "Дж.Д. Сэлинджер", "pages": 272, "publisher": "АСТ", "year": 2024, "language": "Русский", "genre": "Современная проза", "period": "XX век"}');

-- =============================================
-- РЕСТОРАНЫ (Категория 6) - 10 товаров
-- =============================================

-- Рестораны высокой кухни
INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes) VALUES
('White Rabbit', 'Ресторан высокой русской кухни с панорамным видом на Москву', 6, 8000, 4.8, 567, '{"cuisine": "Русская", "city": "Москва", "michelin": false, "price_range": "Дорого", "avg_check": 8000, "dress_code": "Smart casual", "features": ["Панорамный вид", "Веранда"]}'),
('Twins Garden', 'Авторская кухня от братьев Березуцких с собственной фермой', 6, 12000, 4.9, 234, '{"cuisine": "Авторская", "city": "Москва", "michelin": true, "price_range": "Очень дорого", "avg_check": 12000, "dress_code": "Formal", "features": ["Мишлен", "Дегустационное меню"]}'),
('Pushkin', 'Легендарный ресторан русской кухни в историческом особняке', 6, 6000, 4.7, 456, '{"cuisine": "Русская", "city": "Москва", "michelin": false, "price_range": "Дорого", "avg_check": 6000, "dress_code": "Smart casual", "features": ["Историческое здание", "Антикварная мебель"]}'),
('Cococo', 'Современная русская кухня в Санкт-Петербурге', 6, 7000, 4.6, 189, '{"cuisine": "Русская", "city": "Санкт-Петербург", "michelin": false, "price_range": "Дорого", "avg_check": 7000, "dress_code": "Smart casual", "features": ["Авторские блюда", "Винная карта"]}'),

-- Этническая кухня
('Nobu Moscow', 'Японская кухня от знаменитого шеф-повара Нобу', 6, 9000, 4.5, 345, '{"cuisine": "Японская", "city": "Москва", "michelin": false, "price_range": "Очень дорого", "avg_check": 9000, "dress_code": "Smart casual", "features": ["Суши-бар", "Сашими", "Роллы"]}'),
('Madras Cafe', 'Аутентичная индийская кухня с традиционными специями', 6, 2500, 4.3, 567, '{"cuisine": "Индийская", "city": "Москва", "michelin": false, "price_range": "Средне", "avg_check": 2500, "dress_code": "Casual", "features": ["Веганские блюда", "Острая кухня"]}'),
('Bianco', 'Настоящая итальянская кухня с пиццей из дровяной печи', 6, 3000, 4.4, 789, '{"cuisine": "Итальянская", "city": "Москва", "michelin": false, "price_range": "Средне", "avg_check": 3000, "dress_code": "Casual", "features": ["Дровяная печь", "Домашняя паста"]}'),
('Selfie', 'Современная грузинская кухня от Анатолия Казакова', 6, 4000, 4.6, 234, '{"cuisine": "Грузинская", "city": "Москва", "michelin": false, "price_range": "Средне", "avg_check": 4000, "dress_code": "Casual", "features": ["Хачапури", "Вино из Грузии"]}'),

-- Бистро и кафе
('Cafe Pushkin Bakery', 'Французская пекарня с традиционной выпечкой', 6, 1500, 4.2, 456, '{"cuisine": "Французская", "city": "Москва", "michelin": false, "price_range": "Недорого", "avg_check": 1500, "dress_code": "Casual", "features": ["Свежая выпечка", "Кофе", "Завтраки"]}'),
('Double B', 'Бургерная с крафтовыми бургерами и пивом', 6, 1200, 4.0, 567, '{"cuisine": "Американская", "city": "Москва", "michelin": false, "price_range": "Недорого", "avg_check": 1200, "dress_code": "Casual", "features": ["Крафтовое пиво", "Бургеры", "Картофель фри"]}');

-- =============================================
-- ОТЕЛИ И ПУТЕШЕСТВИЯ (Категория 7) - 8 товаров
-- =============================================

-- Роскошные отели
INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes) VALUES
('Four Seasons Hotel Moscow', 'Роскошный отель в самом центре Москвы рядом с Красной площадью', 7, 25000, 4.8, 234, '{"type": "Отель", "city": "Москва", "stars": 5, "price_per_night": 25000, "features": ["Спа-центр", "Фитнес", "Ресторан", "Вид на Кремль"], "rooms": 180}'),
('Ritz-Carlton Moscow', 'Элегантный отель с видом на Красную площадь и Кремль', 7, 30000, 4.9, 156, '{"type": "Отель", "city": "Москва", "stars": 5, "price_per_night": 30000, "features": ["Клуб-этаж", "Спа", "Ресторан", "Консьерж"], "rooms": 334}'),
('Belmond Grand Hotel Europe', 'Исторический отель в самом сердце Санкт-Петербурга', 7, 20000, 4.7, 189, '{"type": "Отель", "city": "Санкт-Петербург", "stars": 5, "price_per_night": 20000, "features": ["Историческое здание", "Спа", "Ресторан"], "rooms": 301}'),

-- Бутик-отели
('Hotel Metropol Moscow', 'Легендарный отель в стиле модерн с богатой историей', 7, 15000, 4.6, 267, '{"type": "Бутик-отель", "city": "Москва", "stars": 5, "price_per_night": 15000, "features": ["Историческое наследие", "Уникальная архитектура"], "rooms": 362}'),
('Angleterre Hotel', 'Классический отель в центре Петербурга', 7, 12000, 4.4, 145, '{"type": "Бутик-отель", "city": "Санкт-Петербург", "stars": 4, "price_per_night": 12000, "features": ["Центральное расположение", "Классический интерьер"], "rooms": 193}'),

-- Курорты и санатории
('Rosa Ski Inn', 'Горнолыжный курорт в Красной Поляне с прекрасными видами', 7, 8000, 4.5, 234, '{"type": "Курорт", "city": "Сочи", "stars": 4, "price_per_night": 8000, "features": ["Горные лыжи", "Спа", "Бассейн", "Горный воздух"], "season": "Зима"}'),
('Санаторий Белые Ночи', 'Здравница на берегу Черного моря с лечебными программами', 7, 4500, 4.2, 156, '{"type": "Санаторий", "city": "Сочи", "stars": 3, "price_per_night": 4500, "features": ["Лечебные процедуры", "Море", "Диетическое питание"], "season": "Лето"}'),

-- Хостелы
('Hostel Rus - Red Square', 'Современный хостел рядом с главными достопримечательностями', 7, 1500, 4.0, 567, '{"type": "Хостел", "city": "Москва", "stars": 2, "price_per_night": 1500, "features": ["Общая кухня", "Wi-Fi", "Прачечная"], "rooms": 50}');

-- =============================================
-- СПОРТ И ФИТНЕС (Категория 8) - 6 товаров
-- =============================================

-- Тренажеры для дома
INSERT INTO items (name, description, category_id, price, rating, rating_count, attributes) VALUES
('NordicTrack Commercial 2950', 'Профессиональная беговая дорожка с интерактивными тренировками', 8, 189999, 4.6, 123, '{"type": "Беговая дорожка", "brand": "NordicTrack", "features": ["iFit", "Наклон до 15%", "Скорость до 20 км/ч"], "warranty": "2 года"}'),
('Bowflex SelectTech 552', 'Регулируемые гантели с быстрой сменой веса', 8, 45999, 4.5, 234, '{"type": "Гантели", "brand": "Bowflex", "weight_range": "2.3-24 кг", "features": ["Быстрая регулировка", "Компактность"], "warranty": "2 года"}'),
('Concept2 Model D', 'Профессиональный гребной тренажер для кардио', 8, 129999, 4.8, 89, '{"type": "Гребной тренажер", "brand": "Concept2", "features": ["PM5 монитор", "Складная конструкция"], "warranty": "2 года"}'),

-- Спортивная одежда
('Nike Air Zoom Pegasus 40', 'Универсальные беговые кроссовки для ежедневных тренировок', 8, 12999, 4.4, 567, '{"type": "Кроссовки", "brand": "Nike", "sport": "Бег", "features": ["Zoom Air", "Дышащий верх"], "sizes": "36-47"}'),
('Adidas Ultraboost 23', 'Энергичные кроссовки с технологией BOOST', 8, 15999, 4.3, 345, '{"type": "Кроссовки", "brand": "Adidas", "sport": "Бег", "features": ["BOOST пена", "Primeknit верх"], "sizes": "36-47"}'),
('Under Armour HeatGear', 'Компрессионная футболка для интенсивных тренировок', 8, 3999, 4.2, 234, '{"type": "Одежда", "brand": "Under Armour", "sport": "Фитнес", "features": ["Влагоотводящая ткань", "4-way stretch"], "sizes": "XS-XXL"}');

-- =============================================
-- ВЗАИМОДЕЙСТВИЯ ПОЛЬЗОВАТЕЛЕЙ (600+ записей)
-- =============================================

-- IT специалист alex_dev (id=2) - интересуется техникой и книгами по программированию
INSERT INTO user_interactions (user_id, item_id, interaction_type, rating, feedback) VALUES
-- Ноутбуки
(2, 1, 'view', NULL, NULL),   -- MacBook Pro 16" M3 Max
(2, 1, 'like', 5, 'Отличная производительность для разработки'),
(2, 2, 'view', NULL, NULL),   -- MacBook Pro 14" M3 Pro
(2, 2, 'like', 4, 'Хорошая портативность'),
(2, 5, 'view', NULL, NULL),   -- Dell XPS 15
(2, 5, 'like', 4, 'Красивый OLED дисплей'),
(2, 8, 'view', NULL, NULL),  -- ASUS ROG Strix (игровой)
(2, 8, 'like', 5, 'Мощный для игр и работы'),
(2, 8, 'purchase', 5, 'Купил для работы и игр, очень доволен'),

-- Смартфоны
(2, 21, 'view', NULL, NULL),  -- iPhone 15 Pro
(2, 21, 'like', 4, 'Хорошая камера и производительность'),
(2, 25, 'view', NULL, NULL),  -- Google Pixel 8
(2, 25, 'like', 5, 'Чистый Android и отличные AI функции'),
(2, 25, 'purchase', 5, 'Перешел с iPhone, очень нравится'),

-- Книги по программированию  
(2, 46, 'view', NULL, NULL),  -- Чистый код
(2, 46, 'purchase', 5, 'Must-have для каждого разработчика'),
(2, 47, 'view', NULL, NULL),  -- Python для анализа данных
(2, 47, 'like', 4, 'Хорошая книга по pandas'),
(2, 50, 'view', NULL, NULL),  -- Алгоритмы
(2, 50, 'like', 5, 'Классический учебник'),

-- Дата-сайентист maria_data (id=3) - ML, книги, ноутбуки
(3, 3, 'view', NULL, NULL),   -- MacBook Air 15"
(3, 3, 'like', 4, 'Хорошо для мобильной работы'),
(3, 6, 'view', NULL, NULL),   -- Lenovo ThinkPad X1 Carbon
(3, 6, 'purchase', 5, 'Отличная клавиатура для программирования'),
(3, 54, 'view', NULL, NULL),  -- Hands-On Machine Learning
(3, 54, 'purchase', 5, 'Лучшая книга по практическому ML'),
(3, 55, 'view', NULL, NULL),  -- Глубокое обучение
(3, 55, 'like', 4, 'Хорошая теоретическая база'),
(3, 56, 'view', NULL, NULL),  -- Машинное обучение
(3, 56, 'like', 4, 'Классика ML'),

-- Веб-разработчик dmitry_full (id=4)  
(4, 4, 'view', NULL, NULL),   -- MacBook Air 13"
(4, 4, 'purchase', 4, 'Компактный и производительный'),
(4, 58, 'view', NULL, NULL),  -- HTML и CSS
(4, 58, 'like', 3, 'Для начинающих, мне уже не нужно'),
(4, 59, 'view', NULL, NULL),  -- React в действии
(4, 59, 'purchase', 5, 'Отличное руководство по React'),
(4, 60, 'view', NULL, NULL),  -- Node.js в действии
(4, 60, 'like', 4, 'Хорошо структурированная книга'),

-- Студентка anna (id=5) - ограниченный бюджет, книги, доступная техника
(5, 17, 'view', NULL, NULL),  -- Acer Aspire 5 (бюджетный)
(5, 17, 'purchase', 4, 'Отличный ноутбук для учебы за свои деньги'),
(5, 32, 'view', NULL, NULL),  -- Xiaomi Redmi Note 13 Pro+ 
(5, 32, 'like', 4, 'Хорошая камера за небольшие деньги'),
(5, 62, 'view', NULL, NULL),  -- Война и мир
(5, 62, 'like', 5, 'Изучаем в университете'),
(5, 66, 'view', NULL, NULL),  -- 1984
(5, 66, 'purchase', 5, 'Актуальная антиутопия'),
(5, 70, 'view', NULL, NULL),  -- Гарри Поттер
(5, 70, 'like', 5, 'Любимая книга детства'),

-- Студент игрок igor (id=6) - игры, спорт, бюджетная техника
(6, 10, 'view', NULL, NULL),  -- ASUS TUF Gaming (доступный игровой)
(6, 10, 'like', 4, 'Хорошее соотношение цена-качество для игр'),
(6, 10, 'purchase', 4, 'Купил для учебы и игр'),
(6, 37, 'view', NULL, NULL),  -- Xiaomi Poco X6 Pro (игровой)
(6, 37, 'like', 4, 'Быстрый и недорогой'),
(6, 37, 'purchase', 4, 'Отличный игровой смартфон за свои деньги'),
(6, 104, 'view', NULL, NULL), -- Nike беговые кроссовки
(6, 104, 'like', 4, 'Удобные для бега'),
(6, 72, 'view', NULL, NULL),  -- Дюна
(6, 72, 'like', 4, 'Интересная фантастика'),

-- Студентка kate (id=7) - литература, красота
(7, 16, 'view', NULL, NULL),  -- Honor MagicBook (доступный)
(7, 16, 'purchase', 3, 'Подойдет для учебы, но хотелось бы лучше'),
(7, 63, 'view', NULL, NULL),  -- Преступление и наказание
(7, 63, 'like', 5, 'Гениальное произведение Достоевского'),
(7, 64, 'view', NULL, NULL),  -- Мастер и Маргарита
(7, 64, 'purchase', 5, 'Обожаю этот роман'),
(7, 68, 'view', NULL, NULL),  -- Зулейха открывает глаза
(7, 68, 'like', 4, 'Сильный современный роман'),

-- Бизнесмен sergey (id=8) - дорогие авто, премиум техника
(8, 42, 'view', NULL, NULL),  -- Mercedes S-Class
(8, 42, 'purchase', 5, 'Флагман Mercedes - лучшее что есть'),
(8, 57, 'view', NULL, NULL),  -- Range Rover
(8, 57, 'like', 5, 'Король внедорожников'),
(8, 57, 'purchase', 5, 'Купил для загородных поездок'),
(8, 1, 'view', NULL, NULL),   -- MacBook Pro 16" (топовый)
(8, 1, 'purchase', 4, 'Дорого, но качественно'),
(8, 86, 'view', NULL, NULL),  -- Four Seasons отель
(8, 86, 'like', 5, 'Всегда останавливаюсь здесь'),

-- Предприниматель olga (id=9) - средний премиум, образование
(9, 2, 'view', NULL, NULL),   -- MacBook Pro 14"
(9, 2, 'purchase', 4, 'Хорошая мобильность для работы'),
(9, 20, 'view', NULL, NULL),  -- iPhone 15 Pro
(9, 20, 'purchase', 4, 'Нужен для работы'),
(9, 51, 'view', NULL, NULL),  -- Рефакторинг
(9, 51, 'like', 4, 'Полезно для управления командой разработки'),

-- Менеджер pavel (id=10) - авто, путешествия
(10, 46, 'view', NULL, NULL), -- BMW 5 Series
(10, 46, 'purchase', 4, 'Хороший автомобиль для бизнеса'),
(10, 60, 'view', NULL, NULL), -- Toyota RAV4 (семейный)
(10, 60, 'like', 4, 'Рассматриваю как второй автомобиль'),
(10, 87, 'view', NULL, NULL), -- Ritz-Carlton
(10, 87, 'like', 5, 'Отличный сервис'),
(10, 88, 'view', NULL, NULL), -- Belmond отель СПБ
(10, 88, 'like', 4, 'Красивое историческое здание'),

-- Семейная elena (id=11) - практичность, образование, путешествия
(11, 15, 'view', NULL, NULL), -- Xiaomi RedmiBook Pro 15 (средний класс)
(11, 15, 'purchase', 4, 'Хороший ноутбук для домашней работы'),
(11, 36, 'view', NULL, NULL), -- Samsung Galaxy A55 (средний класс)
(11, 36, 'like', 4, 'Надежный Samsung по разумной цене'),
(11, 60, 'view', NULL, NULL), -- Toyota RAV4
(11, 60, 'purchase', 5, 'Идеально для семьи - надежно и просторно'),
(11, 92, 'view', NULL, NULL), -- Rosa Ski Inn
(11, 92, 'like', 4, 'Хороший семейный курорт'),

-- Папа mikhail (id=12) - авто, спорт  
(12, 43, 'view', NULL, NULL), -- BMW 7 Series
(12, 43, 'like', 4, 'Дорого, но красиво'),
(12, 44, 'view', NULL, NULL), -- Audi A8
(12, 44, 'like', 4, 'Технологичный автомобиль'),
(12, 61, 'view', NULL, NULL), -- Honda CR-V
(12, 61, 'purchase', 4, 'Практичный семейный кроссовер'),
(12, 101, 'view', NULL, NULL), -- Беговая дорожка NordicTrack
(12, 101, 'like', 4, 'Хочу заниматься дома'),
(12, 104, 'view', NULL, NULL), -- Nike кроссовки
(12, 104, 'purchase', 4, 'Удобные для утренних пробежек'),

-- Мама tatyana (id=13) - книги, красота
(13, 64, 'view', NULL, NULL), -- Мастер и Маргарита
(13, 64, 'like', 5, 'Перечитываю регулярно'),
(13, 65, 'view', NULL, NULL), -- Анна Каренина
(13, 65, 'like', 4, 'Классика русской литературы'),
(13, 70, 'view', NULL, NULL), -- Гарри Поттер
(13, 70, 'purchase', 5, 'Читаю с детьми'),
(13, 96, 'view', NULL, NULL), -- Cafe Pushkin Bakery
(13, 96, 'like', 4, 'Прекрасные десерты'),

-- Фотограф viktor (id=14) - техника для творчества
(14, 5, 'view', NULL, NULL),  -- Dell XPS 15 (с хорошим экраном)
(14, 5, 'purchase', 5, 'OLED экран отлично подходит для обработки фото'),
(14, 23, 'view', NULL, NULL), -- Samsung Galaxy S24 Ultra (хорошая камера)
(14, 23, 'like', 4, 'Камера 200MP впечатляет'),
(14, 27, 'view', NULL, NULL), -- Xiaomi 14 Ultra (Leica камера)
(14, 27, 'purchase', 5, 'Объективы Leica делают свое дело'),

-- Музыкант daria (id=15) - образование, техника для творчества
(15, 7, 'view', NULL, NULL),  -- HP Spectre x360 (для творчества)
(15, 7, 'like', 4, 'Сенсорный экран удобен для нот'),
(15, 48, 'view', NULL, NULL), -- Изучаем Python
(15, 48, 'like', 3, 'Изучаю программирование как хобби'),
(15, 96, 'view', NULL, NULL), -- Cafe Pushkin Bakery
(15, 96, 'like', 4, 'Приятная атмосфера для работы'),

-- Писатель andrey (id=16) - книги, простая техника
(16, 4, 'view', NULL, NULL),  -- MacBook Air 13" (для письма)
(16, 4, 'purchase', 4, 'Тихий и с хорошей автономностью для письма'),
(16, 62, 'view', NULL, NULL), -- Война и мир
(16, 62, 'like', 5, 'Эталон русской литературы'),
(16, 66, 'view', NULL, NULL), -- 1984  
(16, 66, 'like', 5, 'Актуально как никогда'),
(16, 69, 'view', NULL, NULL), -- Лавр
(16, 69, 'purchase', 4, 'Интересный современный роман'),
(16, 79, 'view', NULL, NULL), -- Шерлок Холмс
(16, 79, 'like', 5, 'Классика детективного жанра'),

-- Пенсионерка galina (id=17) - книги, здоровье
(17, 62, 'view', NULL, NULL), -- Война и мир
(17, 62, 'like', 5, 'Перечитываю в зрелом возрасте'),
(17, 63, 'view', NULL, NULL), -- Преступление и наказание
(17, 63, 'like', 5, 'Гениальный писатель'),
(17, 93, 'view', NULL, NULL), -- Санаторий Белые Ночи
(17, 93, 'like', 4, 'Хочу поправить здоровье'),

-- Пенсионер vladimir (id=18) - книги, простая техника
(18, 18, 'view', NULL, NULL), -- HP Pavilion 15 (простой)
(18, 18, 'like', 3, 'Для интернета и почты хватит'),
(18, 39, 'view', NULL, NULL), -- Samsung Galaxy A15 (простой)
(18, 39, 'purchase', 3, 'Простой телефон для звонков'),
(18, 79, 'view', NULL, NULL), -- Шерлок Холмс
(18, 79, 'purchase', 5, 'Люблю перечитывать классику'),

-- Молодой разработчик nikita (id=19) - техника, спорт
(19, 11, 'view', NULL, NULL), -- Lenovo Legion Pro (игровой)
(19, 11, 'like', 4, 'Хорошая производительность'),
(19, 34, 'view', NULL, NULL), -- OnePlus Nord 3
(19, 34, 'purchase', 4, 'Быстрый и недорогой смартфон'),
(19, 104, 'view', NULL, NULL), -- Nike кроссовки
(19, 104, 'like', 4, 'Нужны для пробежек'),
(19, 47, 'view', NULL, NULL), -- Python для анализа данных
(19, 47, 'like', 4, 'Изучаю data science'),

-- Маркетолог nastya (id=20) - красота, путешествия, техника
(20, 3, 'view', NULL, NULL),  -- MacBook Air 15"
(20, 3, 'like', 4, 'Большой экран для презентаций'),
(20, 22, 'view', NULL, NULL), -- iPhone 15 Plus
(20, 22, 'purchase', 4, 'Нужен большой экран для работы'),
(20, 86, 'view', NULL, NULL), -- Four Seasons отель
(20, 86, 'like', 5, 'Мечтаю остановиться здесь'),
(20, 96, 'view', NULL, NULL), -- Cafe Pushkin Bakery
(20, 96, 'like', 4, 'Инстаграмное место');

-- Добавляем еще взаимодействия для увеличения количества данных (300 дополнительных записей)
INSERT INTO user_interactions (user_id, item_id, interaction_type, rating, feedback)
SELECT 
    (RANDOM() * 19 + 2)::int as user_id,  -- От 2 до 20 (исключаем admin)
    (RANDOM() * 105 + 1)::int as item_id, -- От 1 до 105
    CASE WHEN RANDOM() < 0.6 THEN 'view'
         WHEN RANDOM() < 0.8 THEN 'like'
         WHEN RANDOM() < 0.9 THEN 'dislike'
         ELSE 'purchase' END as interaction_type,
    CASE WHEN RANDOM() < 0.7 THEN NULL
         ELSE (RANDOM() * 5 + 1)::int END as rating,
    NULL as feedback
FROM generate_series(1, 300);

-- =============================================
-- ОБРАЗЦЫ ЗАПРОСОВ И СЕССИЙ
-- =============================================

-- Примеры пользовательских запросов с результатами
INSERT INTO choices (user_id, query_text, processed_query, intent, selected_items, user_feedback, feedback_text, algorithm_version) VALUES
(2, 'Хочу купить мощный ноутбук для разработки игр до 200000 рублей', 'мощный ноутбук разработка игр 200000', 'purchase', '[1, 8, 9]', 5, 'Отличные рекомендации, купил ASUS ROG', 'v1.0'),
(3, 'Посоветуй книги по машинному обучению для начинающих', 'книги машинное обучение начинающих', 'recommend', '[54, 56, 47]', 4, 'Хорошая подборка, начала с Hands-On ML', 'v1.0'),
(5, 'Нужен недорогой ноутбук для учебы в университете', 'недорогой ноутбук учеба университет', 'purchase', '[17, 18, 19]', 4, 'Купила Acer Aspire, подходит для учебы', 'v1.0'),
(6, 'Какой игровой смартфон выбрать до 30000', 'игровой смартфон выбрать 30000', 'recommend', '[37, 32, 36]', 5, 'Poco X6 Pro - именно то что нужно!', 'v1.0'),
(8, 'Сравни Mercedes S-Class и BMW 7 Series', 'сравни mercedes s-class bmw 7 series', 'compare', '[42, 43]', 4, 'Выбрал Mercedes, больше нравится комфорт', 'v1.0'),
(11, 'Семейный автомобиль для поездок с детьми', 'семейный автомобиль поездки дети', 'recommend', '[60, 61, 62]', 5, 'Toyota RAV4 - отличный выбор для семьи', 'v1.0'),
(7, 'Какие книги почитать из русской классики', 'книги русская классика', 'recommend', '[62, 63, 64]', 5, 'Перечитала Мастера и Маргариту - восхитительно', 'v1.0'),
(14, 'Ноутбук с хорошим экраном для обработки фото', 'ноутбук хороший экран обработка фото', 'purchase', '[5, 1, 7]', 5, 'Dell XPS 15 с OLED - то что нужно фотографу', 'v1.0'),
(9, 'Где остановиться в Москве в центре', 'остановиться москва центр', 'search', '[86, 87, 89]', 3, 'Дорого, но рассмотрю Four Seasons', 'v1.0'),
(12, 'Хочу заниматься спортом дома, что купить', 'заниматься спорт дома купить', 'recommend', '[101, 102, 104]', 4, 'Беговая дорожка - хорошая идея', 'v1.0'),
(4, 'Лучшие книги по React и фронтенд разработке', 'лучшие книги react фронтенд разработка', 'recommend', '[59, 60, 58]', 4, 'React в действии помог разобраться с хуками', 'v1.0'),
(16, 'Тихий ноутбук для письма с хорошей автономностью', 'тихий ноутбук письмо автономность', 'purchase', '[4, 3, 15]', 4, 'MacBook Air 13" - идеален для писателя', 'v1.0'),
(10, 'Рестораны высокой кухни в Москве для бизнес ужина', 'рестораны высокая кухня москва бизнес', 'search', '[78, 79, 82]', 4, 'White Rabbit произвел впечатление на партнеров', 'v1.0'),
(15, 'Планшет или ноутбук для музыкальных заметок', 'планшет ноутбук музыкальные заметки', 'compare', '[7, 13, 14]', 3, 'Пока склоняюсь к ноутбуку-трансформеру', 'v1.0'),
(13, 'Где вкусно поужинать с семьей в Москве', 'вкусно поужинать семья москва', 'search', '[96, 84, 85]', 4, 'Cafe Pushkin Bakery понравился детям', 'v1.0');

-- Создание сессий пользователей
INSERT INTO query_sessions (session_id, user_id, queries, context, expires_at) VALUES
('sess_alex_' || extract(epoch from now())::text, 2, '["мощный ноутбук разработка", "книги python", "игровая мышь"]', '{"preferences": {"budget": 150000, "category": "electronics"}, "location": "Москва"}', now() + interval '24 hours'),
('sess_maria_' || extract(epoch from now())::text, 3, '["машинное обучение книги", "ноутбук для ML", "курсы AI"]', '{"preferences": {"interests": ["ML", "AI"], "level": "intermediate"}}', now() + interval '24 hours'),
('sess_student_' || extract(epoch from now())::text, 5, '["ноутбук учеба недорого", "книги литература", "смартфон бюджет"]', '{"preferences": {"budget": 40000, "student": true}}', now() + interval '24 hours'),
('sess_business_' || extract(epoch from now())::text, 8, '["автомобиль премиум", "отель москва люкс", "ресторан бизнес"]', '{"preferences": {"budget": 10000000, "luxury": true}}', now() + interval '24 hours'),
('sess_family_' || extract(epoch from now())::text, 11, '["семейный автомобиль", "курорт дети", "ноутбук дом"]', '{"preferences": {"family": true, "children": 2, "practical": true}}', now() + interval '24 hours');

-- =============================================
-- СОЗДАНИЕ ИНДЕКСОВ ДЛЯ ОПТИМИЗАЦИИ
-- =============================================

-- Индексы для быстрого поиска товаров
CREATE INDEX IF NOT EXISTS idx_items_price_range ON items(price) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_items_rating_desc ON items(rating DESC) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_items_category_rating ON items(category_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_items_fulltext ON items USING GIN(to_tsvector('russian', name || ' ' || COALESCE(description, '')));

-- Индексы для аналитики взаимодействий
CREATE INDEX IF NOT EXISTS idx_interactions_user_type ON user_interactions(user_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_item_rating ON user_interactions(item_id, rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON user_interactions(timestamp DESC);

-- Индексы для выборов и сессий
CREATE INDEX IF NOT EXISTS idx_choices_user_created ON choices(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_choices_intent ON choices(intent);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON query_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON query_sessions(expires_at);

-- =============================================
-- ПРЕДСТАВЛЕНИЯ ДЛЯ АНАЛИТИКИ
-- =============================================

-- Представление популярных товаров
CREATE OR REPLACE VIEW popular_items AS
SELECT 
    i.id,
    i.name,
    i.category_id,
    c.name as category_name,
    i.price,
    i.rating,
    i.rating_count,
    COUNT(ui.id) as interaction_count,
    COUNT(CASE WHEN ui.interaction_type = 'like' THEN 1 END) as likes,
    COUNT(CASE WHEN ui.interaction_type = 'purchase' THEN 1 END) as purchases,
    AVG(CASE WHEN ui.rating IS NOT NULL THEN ui.rating END) as avg_user_rating
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN user_interactions ui ON i.id = ui.item_id
WHERE i.is_available = true
GROUP BY i.id, i.name, i.category_id, c.name, i.price, i.rating, i.rating_count
ORDER BY interaction_count DESC, i.rating DESC;

-- Представление активности пользователей
CREATE OR REPLACE VIEW user_activity AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    COUNT(ui.id) as total_interactions,
    COUNT(CASE WHEN ui.interaction_type = 'view' THEN 1 END) as views,
    COUNT(CASE WHEN ui.interaction_type = 'like' THEN 1 END) as likes,
    COUNT(CASE WHEN ui.interaction_type = 'purchase' THEN 1 END) as purchases,
    COUNT(DISTINCT ui.item_id) as unique_items,
    AVG(CASE WHEN ui.rating IS NOT NULL THEN ui.rating END) as avg_rating,
    MAX(ui.timestamp) as last_activity
FROM users u
LEFT JOIN user_interactions ui ON u.id = ui.user_id
GROUP BY u.id, u.username, u.full_name
ORDER BY total_interactions DESC;

-- Представление статистики по категориям
CREATE OR REPLACE VIEW category_stats AS
SELECT 
    c.id,
    c.name,
    c.parent_id,
    COUNT(i.id) as items_count,
    AVG(i.price) as avg_price,
    AVG(i.rating) as avg_rating,
    COUNT(ui.id) as total_interactions,
    COUNT(CASE WHEN ui.interaction_type = 'purchase' THEN 1 END) as purchases
FROM categories c
LEFT JOIN items i ON c.id = i.category_id AND i.is_available = true
LEFT JOIN user_interactions ui ON i.id = ui.item_id
GROUP BY c.id, c.name, c.parent_id
ORDER BY items_count DESC;

-- =============================================
-- ФУНКЦИИ ДЛЯ РЕКОМЕНДАЦИЙ
-- =============================================

-- Функция для получения похожих пользователей
CREATE OR REPLACE FUNCTION get_similar_users(target_user_id INTEGER, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(user_id INTEGER, similarity_score DECIMAL) AS $$
BEGIN
    RETURN QUERY
    WITH user_items AS (
        SELECT user_id, item_id
        FROM user_interactions 
        WHERE interaction_type IN ('like', 'purchase')
    ),
    target_items AS (
        SELECT item_id
        FROM user_items 
        WHERE user_id = target_user_id
    ),
    user_similarity AS (
        SELECT 
            ui.user_id,
            COUNT(*)::DECIMAL / (
                SELECT COUNT(*) FROM target_items
            ) as similarity_score
        FROM user_items ui
        INNER JOIN target_items ti ON ui.item_id = ti.item_id
        WHERE ui.user_id != target_user_id
        GROUP BY ui.user_id
    )
    SELECT us.user_id, us.similarity_score
    FROM user_similarity us
    ORDER BY similarity_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения рекомендаций на основе коллаборативной фильтрации
CREATE OR REPLACE FUNCTION get_collaborative_recommendations(target_user_id INTEGER, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(item_id INTEGER, recommendation_score DECIMAL) AS $$
BEGIN
    RETURN QUERY
    WITH similar_users AS (
        SELECT user_id, similarity_score
        FROM get_similar_users(target_user_id, 20)
    ),
    user_items AS (
        SELECT item_id
        FROM user_interactions 
        WHERE user_id = target_user_id AND interaction_type IN ('like', 'purchase')
    ),
    recommendations AS (
        SELECT 
            ui.item_id,
            SUM(su.similarity_score)::DECIMAL as recommendation_score
        FROM user_interactions ui
        INNER JOIN similar_users su ON ui.user_id = su.user_id
        WHERE ui.interaction_type IN ('like', 'purchase')
        AND ui.item_id NOT IN (SELECT item_id FROM user_items)
        GROUP BY ui.item_id
    )
    SELECT r.item_id, r.recommendation_score
    FROM recommendations r
    INNER JOIN items i ON r.item_id = i.id
    WHERE i.is_available = true
    ORDER BY recommendation_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Обновление статистики таблиц
ANALYZE users;
ANALYZE items; 
ANALYZE categories;
ANALYZE user_interactions;
ANALYZE choices;
ANALYZE query_sessions;

-- Вывод итоговой статистики
SELECT 
    'Пользователи' as entity,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Товары' as entity,
    COUNT(*) as count  
FROM items
UNION ALL
SELECT 
    'Категории' as entity,
    COUNT(*) as count
FROM categories
UNION ALL
SELECT 
    'Взаимодействия' as entity,
    COUNT(*) as count
FROM user_interactions
UNION ALL
SELECT 
    'Запросы' as entity,
    COUNT(*) as count
FROM choices
ORDER BY entity;

COMMIT;