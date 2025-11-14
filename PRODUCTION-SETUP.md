# 🚀 راهنمای Setup در Production (Linux Server)

## مشکل Native Modules

`better-sqlite3` یک native module است و باید برای هر سیستم عامل compile بشه. اگه `node_modules` رو از Windows به Linux منتقل کنی، کار نمی‌کنه.

---

## ✅ راه حل 1: Rebuild در سرور (سریع)

```bash
# در سرور Linux
cd /root/Get-Phd-With-Playwright

# پاک کردن node_modules
rm -rf node_modules

# نصب مجدد (برای Linux compile می‌شه)
npm install

# یا فقط rebuild better-sqlite3
npm rebuild better-sqlite3
```

---

## ✅ راه حل 2: استفاده از PostgreSQL (توصیه می‌شه برای Production)

PostgreSQL برای production بهتره چون:
- ✅ Native module نیست (مشکل compile نداره)
- ✅ Performance بهتر
- ✅ قابلیت scale کردن
- ✅ Backup و restore راحت‌تر

### Setup PostgreSQL:

#### 1. نصب PostgreSQL در سرور:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# یا CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
```

#### 2. ایجاد Database:

```bash
sudo -u postgres psql

# در PostgreSQL shell:
CREATE DATABASE findaphd;
CREATE USER findaphd_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE findaphd TO findaphd_user;
\q
```

#### 3. تنظیم Environment Variables:

ایجاد فایل `.env` در root پروژه:

```bash
# .env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=findaphd
DB_USER=findaphd_user
DB_PASSWORD=your_secure_password
```

#### 4. نصب pg package (اگه نصب نشده):

```bash
npm install pg
```

#### 5. اجرای پروژه:

```bash
npm start
```

---

## ✅ راه حل 3: استفاده از Docker (بهترین راه)

### Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# نصب dependencies برای better-sqlite3
RUN apk add --no-cache python3 make g++ sqlite

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

### docker-compose.yml:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001"
    environment:
      - DB_TYPE=sqlite
      - SQLITE_PATH=/app/data/findaphd.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### اجرا:

```bash
docker-compose up -d
```

---

## 🔍 تشخیص مشکل:

اگه خطای `invalid ELF header` دیدی، یعنی:
- ❌ `node_modules` از سیستم دیگه‌ای (Windows/Mac) منتقل شده
- ✅ باید در سرور Linux دوباره `npm install` بزنی

---

## 📋 Checklist برای Production:

- [ ] `node_modules` در سرور Linux نصب شده (نه از Windows منتقل شده)
- [ ] `better-sqlite3` برای Linux compile شده
- [ ] یا PostgreSQL setup شده
- [ ] Environment variables تنظیم شده
- [ ] Playwright browsers نصب شده: `npx playwright install chromium`
- [ ] Port 3001 باز است
- [ ] Firewall تنظیم شده

---

## 🚀 دستورات سریع:

```bash
# در سرور Linux
cd /root/Get-Phd-With-Playwright

# پاک و نصب مجدد
rm -rf node_modules package-lock.json
npm install

# نصب Playwright browser
npx playwright install chromium

# اجرا
npm start
```

---

**توصیه:** برای production از PostgreSQL استفاده کن! 🎯

