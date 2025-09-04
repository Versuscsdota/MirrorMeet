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
│   ├── data/            # SQLite база данных
│   ├── uploads/         # Загруженные файлы
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
