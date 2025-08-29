import os
import json

# Создаем структуру проекта
project_structure = {
    "intelligent-choice-system": {
        "app": {
            "__init__.py": "",
            "main.py": "",
            "core": {
                "__init__.py": "",
                "config.py": "",
                "database.py": "",
                "logging.py": "",
                "security.py": ""
            },
            "models": {
                "__init__.py": "",
                "user.py": "",
                "choice.py": "",
                "schemas.py": ""
            },
            "services": {
                "__init__.py": "",
                "nlp_service.py": "",
                "recommendation_service.py": "",
                "vector_service.py": "",
                "database_service.py": ""
            },
            "api": {
                "__init__.py": "",
                "routes.py": "",
                "deps.py": ""
            },
            "utils": {
                "__init__.py": "",
                "helpers.py": ""
            }
        },
        "frontend": {
            "app.py": "",
            "requirements.txt": ""
        },
        "data": {
            "sample": {},
            "sql": {}
        },
        "tests": {
            "__init__.py": "",
            "test_main.py": ""
        },
        "requirements.txt": "",
        "docker-compose.yml": "",
        "Dockerfile": "",
        "README.md": ""
    }
}

print("Структура проекта создана. Теперь генерирую содержимое файлов...")
print("=" * 60)