#!/bin/bash

# Script برای fix کردن better-sqlite3 در Linux

echo "🔧 Fixing better-sqlite3 for Linux..."
echo ""

# چک کردن Node.js version
echo "📦 Node.js version:"
node --version
npm --version
echo ""

# نصب build tools (اگه نصب نباشن)
echo "📦 Installing build tools..."
if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    sudo apt-get update
    sudo apt-get install -y python3 make g++ build-essential
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    sudo yum groupinstall -y "Development Tools"
    sudo yum install -y python3 make gcc-c++
fi

echo ""
echo "🧹 Cleaning node_modules..."
rm -rf node_modules package-lock.json

echo ""
echo "📦 Reinstalling dependencies..."
npm install

echo ""
echo "🔨 Rebuilding better-sqlite3..."
npm rebuild better-sqlite3

echo ""
echo "✅ Done! Try: npm start"

