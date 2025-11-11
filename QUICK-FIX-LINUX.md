# 🔧 Quick Fix برای Linux Server

## مشکل: `invalid ELF header` در better-sqlite3

این یعنی `better-sqlite3` برای Linux compile نشده.

---

## ✅ راه حل 1: نصب Build Tools و Rebuild

```bash
# 1. نصب build tools
sudo apt-get update
sudo apt-get install -y python3 make g++ build-essential

# 2. پاک کردن و نصب مجدد
rm -rf node_modules package-lock.json
npm install

# 3. Rebuild better-sqlite3
npm rebuild better-sqlite3

# 4. تست
npm start
```

یا استفاده از script:

```bash
chmod +x fix-sqlite-linux.sh
./fix-sqlite-linux.sh
```

---

## ✅ راه حل 2: استفاده از PostgreSQL (توصیه می‌شه)

PostgreSQL برای production بهتره و مشکل native module نداره.

### Setup سریع:

```bash
# 1. نصب PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# 2. ایجاد Database
sudo -u postgres psql << EOF
CREATE DATABASE findaphd;
CREATE USER findaphd_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE findaphd TO findaphd_user;
\q
EOF

# 3. ایجاد فایل .env
cat > .env << EOF
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=findaphd
DB_USER=findaphd_user
DB_PASSWORD=your_secure_password
EOF

# 4. نصب pg (اگه نصب نشده)
npm install pg

# 5. اجرا
npm start
```

---

## 🔍 تشخیص مشکل:

```bash
# چک کردن architecture
uname -m

# چک کردن Node.js version
node --version

# چک کردن که better-sqlite3 compile شده
file node_modules/better-sqlite3/build/Release/better_sqlite3.node
```

اگه output نشون بده `ELF 64-bit LSB shared object` یعنی درسته.
اگه `PE32` یا `Mach-O` باشه یعنی برای Windows/Mac compile شده.

---

## 🚀 دستورات کامل (Copy & Paste):

```bash
# در سرور Linux
cd /root/Get-Phd-With-Playwright

# نصب build tools
sudo apt-get update
sudo apt-get install -y python3 make g++ build-essential

# پاک و نصب
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm rebuild better-sqlite3

# تست
npm start
```

---

**توصیه:** برای production از PostgreSQL استفاده کن! 🎯

