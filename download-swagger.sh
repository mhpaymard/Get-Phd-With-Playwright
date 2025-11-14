#!/bin/bash

# اسکریپت دانلود خودکار Swagger JSON
# استفاده: ./download-swagger.sh

echo ""
echo "📥 دانلود فایل Swagger JSON..."
echo ""

# رنگ‌ها
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# چک کردن سرور
echo -n "🔍 در حال بررسی سرور... "
if curl -s http://91.99.13.17:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo ""
    echo -e "${RED}❌ سرور در حال اجرا نیست!${NC}"
    echo -e "${YELLOW}💡 ابتدا سرور را start کنید:${NC}"
    echo "   npm start"
    echo ""
    exit 1
fi

# دانلود فایل
echo -n "⬇️  در حال دانلود... "
if curl -s -o swagger.json http://91.99.13.17:3001/swagger.json; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}❌ دانلود ناموفق!${NC}"
    exit 1
fi

# بررسی فایل
if [ ! -f swagger.json ]; then
    echo -e "${RED}❌ فایل ایجاد نشد!${NC}"
    exit 1
fi

# گرفتن اطلاعات
FILE_SIZE=$(du -h swagger.json | cut -f1)
echo ""
echo -e "${GREEN}✅ دانلود موفقیت‌آمیز!${NC}"
echo ""
echo "📄 نام فایل: swagger.json"
echo "📊 حجم: $FILE_SIZE"
echo "📍 مسیر: $(pwd)/swagger.json"
echo ""

# اطلاعات بیشتر (اگر jq نصب باشد)
if command -v jq &> /dev/null; then
    ENDPOINTS=$(cat swagger.json | jq '.paths | length')
    SCHEMAS=$(cat swagger.json | jq '.components.schemas | length')
    TITLE=$(cat swagger.json | jq -r '.info.title')
    VERSION=$(cat swagger.json | jq -r '.info.version')
    
    echo "📋 محتویات:"
    echo "   • عنوان: $TITLE"
    echo "   • نسخه: $VERSION"
    echo "   • تعداد Endpoints: $ENDPOINTS"
    echo "   • تعداد Schemas: $SCHEMAS"
    echo ""
fi

echo -e "${GREEN}🎉 آماده استفاده!${NC}"
echo ""
