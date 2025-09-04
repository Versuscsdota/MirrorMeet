# MirrorCRM VPS Deployment Guide

## Подключение к VPS

```bash
ssh root@77.73.131.100
# Пароль: oSmy3OIFIAFq
```

## Быстрое развертывание

### 1. Установка Docker и Docker Compose

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Проверка установки
docker --version
docker-compose --version
```

### 2. Загрузка проекта

```bash
# Клонирование репозитория (если используете Git)
git clone <your-repo-url> /opt/mirrorcrm
cd /opt/mirrorcrm

# ИЛИ загрузка файлов через SCP/SFTP
# scp -r ./MirrorMeet root@77.73.131.100:/opt/mirrorcrm
```

### 3. Настройка окружения

```bash
cd /opt/mirrorcrm

# Копирование production конфигурации
cp .env.production .env

# Генерация безопасного JWT секрета
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s/your-super-secure-jwt-secret-key-change-this/$JWT_SECRET/g" .env

# Создание необходимых директорий
mkdir -p server/data server/uploads ssl
chmod 755 server/data server/uploads
```

### 4. Запуск приложения

```bash
# Сделать скрипт исполняемым
chmod +x deploy.sh

# Запуск развертывания
./deploy.sh
```

## Ручное развертывание

Если автоматический скрипт не работает:

```bash
# Сборка и запуск
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps
```

## Управление сервисами

```bash
# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Остановка сервисов
docker-compose -f docker-compose.prod.yml down

# Перезапуск сервисов
docker-compose -f docker-compose.prod.yml restart

# Обновление приложения
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## Доступ к приложению

- **Frontend**: http://77.73.131.100
- **Backend API**: http://77.73.131.100:3001
- **База данных**: `/opt/mirrorcrm/server/data/mirrorcrm.db`
- **Загрузки**: `/opt/mirrorcrm/server/uploads/`

## Настройка SSL (опционально)

### Использование Let's Encrypt

```bash
# Установка Certbot
apt install certbot python3-certbot-nginx -y

# Получение сертификата (замените на ваш домен)
certbot --nginx -d yourdomain.com

# Автообновление сертификатов
crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Обновление nginx конфигурации для SSL

Отредактируйте `client/nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... остальная конфигурация
}
```

## Мониторинг и обслуживание

### Резервное копирование

```bash
# Создание бэкапа базы данных
cp /opt/mirrorcrm/server/data/mirrorcrm.db /backup/mirrorcrm-$(date +%Y%m%d).db

# Создание бэкапа загрузок
tar -czf /backup/uploads-$(date +%Y%m%d).tar.gz /opt/mirrorcrm/server/uploads/

# Автоматизация бэкапов
crontab -e
# Добавить: 0 2 * * * /path/to/backup-script.sh
```

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Логи в реальном времени
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Проверка дискового пространства
df -h
```

## Устранение неполадок

### Проблемы с подключением

```bash
# Проверка портов
netstat -tlnp | grep -E '(80|443|3001)'

# Проверка firewall
ufw status
ufw allow 80
ufw allow 443
ufw allow 3001
```

### Проблемы с базой данных

```bash
# Проверка файла базы данных
ls -la /opt/mirrorcrm/server/data/
sqlite3 /opt/mirrorcrm/server/data/mirrorcrm.db ".tables"
```

### Очистка Docker

```bash
# Очистка неиспользуемых образов
docker system prune -a

# Очистка volumes
docker volume prune
```

## Первый запуск

1. Откройте http://77.73.131.100 в браузере
2. Создайте первого администратора
3. Настройте роли и разрешения
4. Импортируйте данные (если необходимо)

## Безопасность

- Смените пароль root на VPS
- Настройте SSH ключи
- Обновите JWT_SECRET в .env
- Настройте firewall
- Регулярно обновляйте систему и Docker образы
