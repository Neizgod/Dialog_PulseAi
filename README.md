# DialogPulse AI

DialogPulse AI — web‑сервис для AI‑аналитики диалогов продаж и клиентской поддержки.

Сервис помогает руководителю быстро разбирать переписки, транскрипты звонков и ручные диалоги: выявлять ошибки менеджеров, возражения клиентов, причины потери заявок, риски в коммуникации и точки роста команды. Результат анализа отображается в карточке диалога, списке диалогов, дашборде и отчётах.

>Важно: в этом репозитории размещена только фронтенд‑часть проекта. Бэкенд не выкладывается, так как я не имею на него прав. Описание ниже относится к фронтенду и общему сценарию работы сервиса.

## Возможности

- Авторизация через JWT.
- Роли пользователей: `admin`, `user`.
- Импорт диалогов из CSV.
- Импорт текстовых диалогов из TXT/Markdown.
- Ручное добавление диалога через интерфейс.
- Импорт аудио с постановкой задачи на расшифровку через Celery.
- Расшифровка аудио через OpenAI transcription model.
- Настройка сопоставления колонок при CSV‑импорте.
- Настройка ролей участников диалога: клиент / менеджер.
- Маскирование персональных данных перед предпросмотром и анализом.
- Предпросмотр импорта перед сохранением диалогов.
- Карточка диалога с сообщениями и результатом AI‑анализа.
- AI‑анализ диалога: итог, температура клиента, оценка качества, возражения, ошибки менеджера, причины потери, рекомендации и флаги риска.
- Дашборд с общей статистикой.
- Отчёты по менеджерам и проблемным диалогам.
- Настройки AI‑модели и проверка подключения.
- Фоновая обработка задач через Celery + Redis.

## Стек технологий

### Backend

- Python 3.12
- FastAPI
- SQLAlchemy async 2.x
- Alembic
- PostgreSQL
- Pydantic v2
- Pydantic Settings
- JWT через `python-jose`
- Argon2 hashing через `pwdlib[argon2]`
- Celery + Redis
- OpenAI SDK
- httpx
- orjson
- pytest
- Ruff

### Frontend

- React
- TypeScript
- Vite
- Redux Toolkit
- React Redux
- React Router
- lucide-react
- ESLint
- Nginx для production-сборки

### Infrastructure

- Docker
- Docker Compose
- PostgreSQL 16
- Redis 7
- Nginx
- Celery worker

## Быстрый запуск через Docker Compose

Docker Compose поднимает весь проект:

- `postgres`
- `redis`
- `migrations`
- `backend`
- `celery-worker`
- `frontend`

### 1. Подготовить переменные окружения

Из корня проекта:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Проверьте `backend/.env`.

Для Docker Compose backend подключается к PostgreSQL и Redis по внутренним именам сервисов, поэтому эти значения переопределяются в `docker-compose.yml`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/dialogpulse
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1
```

Для AI‑анализа и расшифровки аудио укажите OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Собрать и запустить контейнеры

Из корня проекта:

```bash
docker compose up -d --build
```

Проверить состояние сервисов:

```bash
docker compose ps
```

Посмотреть логи:

```bash
docker compose logs -f backend
docker compose logs -f celery-worker
docker compose logs -f frontend
```

### 3. Открыть приложение

Frontend:

```text
http://127.0.0.1:3000
```

Backend Swagger:

```text
http://127.0.0.1:8000/docs
```

OpenAPI JSON:

```text
http://127.0.0.1:8000/openapi.json
```

### 4. Остановить проект

```bash
docker compose down
```

Полностью удалить контейнеры и volumes с данными БД/Redis:

```bash
docker compose down -v
```

> `down -v` удалит локальные данные PostgreSQL и Redis. Используйте эту команду только если нужно начать с чистой базы.

## Локальный запуск для разработки

### 1. Поднять PostgreSQL и Redis

Из корня проекта:

```bash
docker compose up -d postgres redis
```

### 2. Настроить backend

```bash
cd backend
cp .env.example .env
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Для Windows PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

В `backend/.env` для локального запуска используйте host‑порты Docker Compose:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/dialogpulse
CELERY_BROKER_URL=redis://localhost:6380/0
CELERY_RESULT_BACKEND=redis://localhost:6380/1
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000","http://127.0.0.1:3000"]
```

Применить миграции:

```bash
alembic upgrade head
```

Запустить backend:

```bash
uvicorn app.main:app --reload
```

Backend будет доступен по адресу:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

### 3. Запустить Celery worker

В отдельном терминале из папки `backend`:

```bash
source venv/bin/activate
celery -A app.core.celery_app:celery_app worker --loglevel=info --pool=solo
```

Для Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
celery -A app.core.celery_app:celery_app worker --loglevel=info --pool=solo
```

### 4. Настроить frontend

В отдельном терминале:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

В `frontend/.env` должен быть URL backend:

```env
VITE_DIALOG_PULSE_URL=http://127.0.0.1:8000
```

Frontend в dev‑режиме будет доступен по адресу:

```text
http://localhost:5173
```

## Основной сценарий проверки

1. Открыть frontend.
2. Зарегистрироваться или войти в существующий аккаунт.
3. Открыть страницу загрузок.
4. Загрузить CSV, TXT/Markdown, аудио или добавить диалог вручную.
5. Проверить предпросмотр.
6. Настроить сопоставление колонок и роли участников, если это требуется.
7. Подтвердить импорт.
8. Открыть список диалогов.
9. Открыть карточку диалога.
10. Запустить AI‑анализ.
11. Проверить результат анализа в карточке.
12. Открыть дашборд.
13. Открыть отчёты.

## Работа с аудио

Для аудио используется фоновая обработка через Celery worker.

Типовой flow:

1. Пользователь загружает аудио.
2. Backend создаёт импорт со статусом `transcription_queued`.
3. Celery worker забирает задачу.
4. Аудио отправляется в OpenAI transcription model.
5. После успешной расшифровки импорт получает статус `preview_ready`.
6. Пользователь проверяет preview, настраивает роли и подтверждает импорт.

Для диагностики Celery:

```bash
docker compose exec celery-worker celery -A app.core.celery_app:celery_app inspect ping
docker compose exec celery-worker celery -A app.core.celery_app:celery_app inspect active
docker compose exec celery-worker celery -A app.core.celery_app:celery_app inspect reserved
```

## Переменные окружения

### Backend

Основные переменные находятся в `backend/.env.example`.

| Переменная | Назначение |
|---|---|
| `APP_TITLE` | Название приложения |
| `APP_ENV` | Окружение: `local`, `dev`, `prod` |
| `DEBUG` | Debug-режим |
| `DATABASE_URL` | URL подключения к PostgreSQL |
| `SECRET_KEY` | Секрет JWT |
| `ALGORITHM` | Алгоритм подписи JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Время жизни access token |
| `BACKEND_CORS_ORIGINS` | Разрешённые origins frontend |
| `AI_PROVIDER` | Провайдер AI‑анализа |
| `OPENAI_API_KEY` | API‑ключ OpenAI |
| `OPENAI_MODEL` | Модель для анализа диалогов |
| `OPENAI_REQUEST_TIMEOUT_SECONDS` | Timeout запроса к модели анализа |
| `TRANSCRIPTION_PROVIDER` | Провайдер расшифровки аудио |
| `OPENAI_TRANSCRIPTION_MODEL` | Модель расшифровки аудио |
| `TRANSCRIPTION_REQUEST_TIMEOUT_SECONDS` | Timeout расшифровки аудио |
| `CELERY_BROKER_URL` | Redis URL для Celery broker |
| `CELERY_RESULT_BACKEND` | Redis URL для результатов Celery |
| `OLLAMA_BASE_URL` | URL Ollama, если используется локальная модель |
| `OLLAMA_MODEL` | Название локальной модели Ollama |
| `FIRST_SUPERUSER_EMAIL` | Email первого администратора |
| `FIRST_SUPERUSER_PASSWORD` | Пароль первого администратора |
| `FIRST_SUPERUSER_FULL_NAME` | Имя первого администратора |

### Frontend

Основная переменная находится в `frontend/.env.example`.

| Переменная | Назначение |
|---|---|
| `VITE_DIALOG_PULSE_URL` | URL backend API, к которому обращается браузер |

## Полезные команды

### Backend checks

Из папки `backend`:

```bash
ruff check app tests
pytest -q
python -m compileall app tests
alembic heads
alembic upgrade head
```

### Frontend checks

Из папки `frontend`:

```bash
npm run lint
npm run build
npm run preview
```

### Docker checks

Из корня проекта:

```bash
docker compose config -q
docker compose build
docker compose up -d
docker compose ps
```

## Основные backend endpoints

Полный список доступен в Swagger:

```text
http://127.0.0.1:8000/docs
```

Ключевые группы:

```text
/auth
/users
/imports
/dialogs
/analysis
/dashboard
/reports
/ai-settings
```

Важный endpoint запуска анализа одного диалога:

```text
POST /analysis/dialogs/{dialog_id}/run
```

## Ограничения текущей версии

- Проект является MVP и требует дополнительных изменений перед реальным внедрением.
- Качество анализа зависит от выбранной AI‑модели и качества исходных диалогов.
- Расшифровка аудио зависит от доступности внешнего AI‑провайдера.
- Docker Compose подходит для локального и демонстрационного запуска. Для production нужны отдельные настройки HTTPS, доменов, секретов, резервного копирования, мониторинга и логирования.

## Рекомендации перед запуском

- Заменить все значения секретов из примеров.
- Использовать сильный `SECRET_KEY`.
- Не коммитить реальные `.env` файлы.
- Настроить HTTPS и reverse proxy.
- Ограничить публичную регистрацию, если сервис используется в закрытом контуре.
- Настроить резервное копирование PostgreSQL.
- Настроить мониторинг backend, Celery worker и Redis.
- Проверить CORS только для реальных доменов.
- Настроить хранение и ротацию API‑ключей.
- Добавить rate limiting для авторизации.

## Авторы

- Backend: Егор Белозеров https://github.com/Gosbea
- Frontend: Тимур https://github.com/Neizgod
- Design: Ульяна Чистякова (TG: @x09k2i7 Behance: https://www.behance.net/ulyanachistia)