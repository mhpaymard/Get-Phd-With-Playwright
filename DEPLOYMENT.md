# راهنمای استقرار و نگهداری FindAPhD API
## Deployment & Maintenance Guide

---

## 🚀 استقرار در محیط Development

### پیش‌نیازها
```bash
- Node.js 16+
- npm یا yarn
- 2GB+ RAM
- Linux/Windows/MacOS
```

### مراحل نصب

```bash
# 1. Clone پروژه
git clone <repository-url>
cd get-phd

# 2. نصب وابستگی‌ها
npm install

# 3. نصب Playwright browsers
npx playwright install chromium

# 4. کپی و تنظیم environment variables
cp .env.example .env
nano .env  # ویرایش تنظیمات

# 5. اجرا
npm run api
```

سرور روی `http://localhost:3000` اجرا می‌شود.

---

## 🏭 استقرار در Production

### 1. استقرار روی VPS/Dedicated Server

#### مرحله 1: آماده‌سازی سرور

```bash
# به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# نصب PM2 (Process Manager)
sudo npm install -g pm2

# نصب وابستگی‌های Playwright
sudo apt install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2
```

#### مرحله 2: انتقال پروژه

```bash
# ایجاد دایرکتوری
sudo mkdir -p /var/www/findaphd-api
sudo chown $USER:$USER /var/www/findaphd-api

# Clone پروژه
cd /var/www/findaphd-api
git clone <repository-url> .

# نصب dependencies
npm install --production

# نصب Playwright
npx playwright install chromium --with-deps
```

#### مرحله 3: تنظیم Environment

```bash
# ایجاد فایل .env
cat > .env << EOF
NODE_ENV=production
PORT=3000
MAX_BROWSER_TABS=50

FAPHD_UA=FindAPhDBot/1.0 (+https://yoursite.com)
FAPHD_TIMEOUT_MS=30000
FAPHD_MAX_RPS=1
FAPHD_CACHE_TTL=900
EOF
```

#### مرحله 4: راه‌اندازی با PM2

```bash
# ایجاد فایل ecosystem
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'findaphd-api',
    script: 'src/api/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '2G',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    watch: false
  }]
};
EOF

# ایجاد دایرکتوری logs
mkdir -p logs

# شروع سرویس
pm2 start ecosystem.config.js --env production

# ذخیره PM2
pm2 save

# فعال‌سازی auto-start
pm2 startup
```

#### مرحله 5: تنظیم Reverse Proxy (Nginx)

```bash
# نصب Nginx
sudo apt install -y nginx

# تنظیم Nginx
sudo nano /etc/nginx/sites-available/findaphd-api
```

**محتوای فایل:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# فعال‌سازی سایت
sudo ln -s /etc/nginx/sites-available/findaphd-api /etc/nginx/sites-enabled/

# تست و restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

#### مرحله 6: SSL با Let's Encrypt

```bash
# نصب Certbot
sudo apt install -y certbot python3-certbot-nginx

# دریافت SSL
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

### 2. استقرار روی Docker

#### Dockerfile

```dockerfile
FROM node:18-alpine

# نصب وابستگی‌های Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/api/server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MAX_BROWSER_TABS=50
      - PORT=3000
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    mem_limit: 2g
    cpus: 2
```

#### استقرار

```bash
# Build
docker-compose build

# اجرا
docker-compose up -d

# مشاهده logs
docker-compose logs -f api

# Restart
docker-compose restart

# Stop
docker-compose down
```

---

## 🔍 Monitoring و Logging

### 1. PM2 Monitoring

```bash
# مشاهده وضعیت
pm2 status

# مشاهده logs
pm2 logs findaphd-api

# مشاهده metrics
pm2 monit

# Restart
pm2 restart findaphd-api

# Stop
pm2 stop findaphd-api
```

### 2. تنظیم Logging پیشرفته

```javascript
// src/api/server.js - اضافه کردن Winston logger
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### 3. Health Checks

```bash
# Health check اتوماتیک هر 5 دقیقه
crontab -e

# اضافه کردن این خط:
*/5 * * * * curl -f http://localhost:3000/api/health || systemctl restart findaphd-api
```

---

## 🛡️ امنیت

### 1. فایروال

```bash
# فعال‌سازی UFW
sudo ufw enable

# اجازه به پورت‌های ضروری
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# بستن پورت 3000 (فقط از طریق Nginx)
sudo ufw deny 3000/tcp
```

### 2. Rate Limiting (Nginx)

```nginx
# در فایل nginx config
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    server {
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            # ... rest of config
        }
    }
}
```

### 3. Authentication (اختیاری)

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
```

---

## 📊 Performance Tuning

### 1. تنظیمات Node.js

```bash
# در ecosystem.config.js
module.exports = {
  apps: [{
    name: 'findaphd-api',
    script: 'src/api/server.js',
    instances: 2,              // چندین instance
    exec_mode: 'cluster',
    max_memory_restart: '2G',
    node_args: '--max-old-space-size=2048'
  }]
};
```

### 2. کاهش تعداد تب‌ها

```bash
# در .env
MAX_BROWSER_TABS=30  # کاهش برای سرورهای کوچک
```

### 3. افزایش Cache TTL

```bash
FAPHD_CACHE_TTL=1800  # 30 دقیقه
```

---

## 🔄 Backup و Recovery

### 1. Backup خودکار

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/findaphd-api"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup code
tar -czf $BACKUP_DIR/code_$DATE.tar.gz \
    /var/www/findaphd-api \
    --exclude=node_modules \
    --exclude=logs

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz \
    /var/www/findaphd-api/logs

# حذف backup های قدیمی (بیشتر از 7 روز)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# اضافه به crontab (روزانه 3 صبح)
0 3 * * * /path/to/backup.sh
```

### 2. Recovery

```bash
# بازیابی از backup
cd /var/www
tar -xzf /var/backups/findaphd-api/code_YYYYMMDD_HHMMSS.tar.gz
cd findaphd-api
npm install
pm2 restart findaphd-api
```

---

## 🔧 Troubleshooting

### مشکل 1: سرور پاسخ نمی‌دهد

```bash
# بررسی وضعیت
pm2 status

# مشاهده logs
pm2 logs findaphd-api --lines 100

# Restart
pm2 restart findaphd-api
```

### مشکل 2: مصرف بالای حافظه

```bash
# بررسی مصرف
pm2 monit

# کاهش تعداد تب‌ها در .env
MAX_BROWSER_TABS=30

# Restart
pm2 restart findaphd-api
```

### مشکل 3: خطای Playwright

```bash
# نصب مجدد browsers
npx playwright install chromium --with-deps

# بررسی permissions
ls -la ~/.cache/ms-playwright
```

---

## 📈 Scaling

### Horizontal Scaling

```bash
# اجرای چندین instance روی پورت‌های مختلف
PORT=3001 pm2 start src/api/server.js --name api-1
PORT=3002 pm2 start src/api/server.js --name api-2
PORT=3003 pm2 start src/api/server.js --name api-3

# Load balancing با Nginx
upstream api_backend {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    location / {
        proxy_pass http://api_backend;
    }
}
```

---

## 📞 پشتیبانی و نگهداری

### Checklist روزانه
- [ ] بررسی health endpoint
- [ ] مشاهده error logs
- [ ] بررسی مصرف resource ها

### Checklist هفتگی
- [ ] بررسی و پاکسازی logs قدیمی
- [ ] به‌روزرسانی امنیتی
- [ ] بررسی backup ها

### Checklist ماهانه
- [ ] به‌روزرسانی dependencies
- [ ] بررسی performance metrics
- [ ] تست disaster recovery

---

**نسخه:** 1.0.0  
**آخرین به‌روزرسانی:** 2025-10-05
