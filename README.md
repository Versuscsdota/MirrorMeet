# MirrorCRM

CRM система для управления моделями и слотами с синхронизацией данных.

## Функционал

- ✅ Управление моделями (создание, редактирование, удаление)
- ✅ Управление слотами расписания
- ✅ Статусы: не подтвердилась, не пришла, пришла, подтвердилась, слив, регистрация, отказы
- ✅ Синхронизация данных между моделями и слотами
- ✅ Загрузка и привязка файлов
- ✅ Привязка слота к модели после регистрации
- ✅ Аудит всех действий в системе
- ✅ Авторизация (только root пользователь)

## Технологии

**Backend:**
- Node.js + Express + TypeScript
- SQLite (better-sqlite3)
- JWT аутентификация
- Multer для загрузки файлов

**Frontend:**
- React 18 + TypeScript
- Vite
- React Router v6
- Zustand для state management
- Axios для API запросов
- SCSS для стилей

## Установка

### Автоматическая установка (Windows)
```bash
install.bat
```

### Ручная установка

1. Установите зависимости корневого проекта:
```bash
npm install
```

2. Установите зависимости сервера:
```bash
cd server
npm install
cd ..
```

3. Установите зависимости клиента:
```bash
cd client
npm install
cd ..
```

## Запуск

### Режим разработки (запускает и сервер, и клиент)
```bash
npm run dev
```

### Отдельный запуск сервера
```bash
cd server
npm run dev
```

### Отдельный запуск клиента
```bash
cd client
npm run dev
```

## Доступ к системе

После запуска:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

**Учетные данные по умолчанию:**
- Логин: `root`
- Пароль: `admin123`

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - вход в систему
- `GET /api/auth/me` - получить текущего пользователя

### Модели
- `GET /api/models` - список всех моделей
- `GET /api/models/:id` - получить модель по ID
- `POST /api/models` - создать новую модель
- `PUT /api/models/:id` - обновить модель
- `DELETE /api/models/:id` - удалить модель
- `POST /api/models/:id/files` - загрузить файлы для модели
- `POST /api/models/:modelId/sync/:slotId` - синхронизировать модель со слотом

### Слоты
- `GET /api/slots` - список всех слотов
- `GET /api/slots/:id` - получить слот по ID
- `POST /api/slots` - создать новый слот
- `PUT /api/slots/:id` - обновить слот
- `DELETE /api/slots/:id` - удалить слот
- `POST /api/slots/:id/files` - загрузить файлы для слота
- `POST /api/slots/:slotId/register-model` - зарегистрировать модель из слота

### Аудит
- `GET /api/audit` - получить логи аудита (только для root)

### Экспорт (модели/слоты/отчеты)
- `GET /api/export/models?format=xlsx|csv&download=0|1` — экспорт моделей
- `GET /api/export/slots?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&format=xlsx|csv&download=0|1` — экспорт слотов
- `GET /api/export/report?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&format=xlsx|csv&download=0|1` — сводный отчет

Параметр `download=1` включает сохранение файла на сервере в каталоге `EXPORTS_DIR` (по умолчанию `/var/lib/mirrorcrm/exports`) и отдачу через `res.download()`. Также папка доступна как статика по пути `/exports/` (через Express и Nginx).

## Структура проекта

```
MirrorCRM/
├── client/              # React фронтенд
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы приложения
│   │   ├── services/    # API сервисы
│   │   ├── store/       # Zustand store
│   │   ├── styles/      # SCSS стили
│   │   └── types/       # TypeScript типы
│   └── package.json
├── server/              # Node.js бэкенд
│   ├── src/
│   │   ├── db/          # База данных и операции
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API маршруты
│   │   └── types/       # TypeScript типы
│   ├── data/            # (локальная папка для dev) SQLite база данных
│   ├── uploads/         # (локальная папка для dev) Загруженные файлы
│   └── package.json
└── package.json         # Корневой package.json
```

## Безопасность

- Все API endpoints защищены JWT токеном
- Пароли хешируются с помощью bcrypt
- Только пользователь с ролью root имеет доступ к системе
- Все действия логируются в журнале аудита

## Примечания

- База данных SQLite создается автоматически при первом запуске
- Папка для загрузки файлов создается автоматически
- Токен авторизации действителен 24 часа

## Storage on VPS

В продакшене каталоги выносятся за пределы репозитория и настраиваются через переменные окружения (см. `server/.env`):

- `DATA_DIR` — путь к базе SQLite. По умолчанию: `/var/lib/mirrorcrm`
- `UPLOADS_DIR` — путь к загруженным файлам. По умолчанию: `/var/lib/mirrorcrm/uploads`
- `EXPORTS_DIR` — путь к экспортам (xlsx/csv). По умолчанию: `/var/lib/mirrorcrm/exports`
- `LOG_DIR` — путь к логам. По умолчанию: `/var/log/mirrorcrm`

Express раздает следующие статики:

- `GET /uploads/...` — файлы из `UPLOADS_DIR`
- `GET /exports/...` — файлы из `EXPORTS_DIR`

Nginx проксирует эти пути к backend (пример см. в `scripts/deploy.sh`).

Рекомендованные права:

```
mkdir -p /var/lib/mirrorcrm/uploads /var/lib/mirrorcrm/exports /var/log/mirrorcrm
chmod 750 /var/lib/mirrorcrm /var/lib/mirrorcrm/uploads /var/lib/mirrorcrm/exports
```

## Troubleshooting: Rollup optional deps

Если сборка клиента на сервере падает с ошибкой вида `Cannot find module @rollup/rollup-linux-x64-gnu`, это баг npm с optional dependencies.

Решение:

```
cd /opt/mirrorcrm/client
rm -rf node_modules package-lock.json
npm i
npm run build
# при необходимости
npm i -D @rollup/rollup-linux-x64-gnu && npm run build
```

Альтернатива: использовать pnpm через corepack.

## Скрипты деплоя

- `scripts/deploy.sh <IP>` — полный деплой на Ubuntu 24.04 (Nginx + PM2 + sslip.io). Пример: `sudo bash scripts/deploy.sh 77.73.131.100`
- `scripts/update.sh` — обновление проекта из GitHub, пересборка фронта/бэка и рестарт PM2.
