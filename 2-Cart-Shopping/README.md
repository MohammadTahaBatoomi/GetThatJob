# فروشگاه آنلاین - دیتابیس JSON

این پروژه یک فروشگاه آنلاین با دیتابیس JSON است که شامل محصولات، دسته‌بندی‌ها و قابلیت‌های مختلف می‌باشد.

## ساختار دیتابیس

### فایل `db.json`

دیتابیس شامل دو بخش اصلی است:

#### 1. محصولات (`products`)
هر محصول شامل فیلدهای زیر است:
- `id`: شناسه یکتا
- `name`: نام محصول
- `category`: دسته‌بندی (electronics, clothing, books, sports, home)
- `categoryName`: نام فارسی دسته‌بندی
- `price`: قیمت (به تومان)
- `stock`: موجودی
- `image`: آدرس تصویر
- `description`: توضیحات محصول

#### 2. دسته‌بندی‌ها (`categories`)
هر دسته‌بندی شامل:
- `id`: شناسه دسته‌بندی
- `name`: نام فارسی
- `description`: توضیحات

## قابلیت‌های دیتابیس

### 1. بارگذاری محصولات
```javascript
// محصولات به صورت خودکار از db.json بارگذاری می‌شوند
await generateProducts();
```

### 2. جستجو در محصولات
```javascript
// جستجو بر اساس نام، توضیحات یا دسته‌بندی
const results = searchProducts("لپتاپ");
```

### 3. فیلتر بر اساس دسته‌بندی
```javascript
// دریافت محصولات یک دسته‌بندی خاص
const electronics = getProductsByCategory("electronics");
```

### 4. فیلتر بر اساس قیمت
```javascript
// محصولات با قیمت بین 100,000 تا 1,000,000 تومان
const affordable = filterProductsByPrice(100000, 1000000);
```

### 5. مرتب‌سازی محصولات
```javascript
// مرتب‌سازی بر اساس قیمت (صعودی)
const sortedByPrice = sortProducts(products, "price", "asc");

// مرتب‌سازی بر اساس نام (نزولی)
const sortedByName = sortProducts(products, "name", "desc");
```

### 6. آمار محصولات
```javascript
// دریافت آمار کامل
const stats = getProductStats();

// نمایش آمار در کنسول
displayProductStats();
```

### 7. محصولات موجود
```javascript
// فقط محصولات موجود
const inStock = getProductsInStock();

// محصولات با موجودی کم (کمتر از 5 عدد)
const lowStock = getLowStockProducts(5);
```

### 8. اضافه کردن محصول جدید
```javascript
const newProduct = {
    name: "محصول جدید",
    category: "electronics",
    categoryName: "الکترونیک",
    price: 500000,
    stock: 10,
    image: "https://example.com/image.jpg",
    description: "توضیحات محصول جدید"
};

await addProductToDatabase(newProduct);
```

## دسته‌بندی‌های موجود

1. **الکترونیک** (`electronics`)
   - لپتاپ، موبایل، تبلت، هدفون، کیبورد، موس، مانیتور، پرینتر

2. **پوشاک** (`clothing`)
   - پیراهن، شلوار، کت، کفش، کلاه، کیف، ساعت، عینک

3. **کتاب** (`books`)
   - رمان، کتاب علمی، کتاب آموزشی، مجله، کتاب کودک، کتاب آشپزی

4. **ورزشی** (`sports`)
   - توپ فوتبال، توپ بسکتبال، کفش ورزشی، لباس ورزشی، دمبل، طناب

5. **خانه و آشپزخانه** (`home`)
   - میز، صندلی، کمد، فرش، پرده، گلدان، چراغ، ساعت دیواری

## نحوه استفاده

1. فایل `db.json` را در کنار فایل‌های HTML، CSS و JS قرار دهید
2. پروژه را در یک سرور محلی اجرا کنید (به دلیل CORS)
3. محصولات به صورت خودکار بارگذاری می‌شوند
4. دسته‌بندی‌ها به صورت داینامیک در فیلترها نمایش داده می‌شوند

## مثال‌های کاربردی

### نمایش محصولات ارزان
```javascript
const cheapProducts = filterProductsByPrice(0, 500000);
console.log("محصولات ارزان:", cheapProducts);
```

### جستجوی محصولات ورزشی
```javascript
const sportsProducts = getProductsByCategory("sports");
const footballProducts = searchProducts("فوتبال");
```

### مرتب‌سازی محصولات موجود بر اساس قیمت
```javascript
const availableProducts = getProductsInStock();
const sortedAvailable = sortProducts(availableProducts, "price", "asc");
```

### آمار موجودی
```javascript
const stats = getProductStats();
console.log(`تعداد محصولات موجود: ${stats.totalProducts - stats.outOfStock}`);
console.log(`محصولات با موجودی کم: ${stats.lowStock}`);
```

## نکات مهم

- تمام توابع در `window` object قرار دارند و از خارج قابل دسترسی هستند
- در صورت خطا در بارگذاری دیتابیس، محصولات پیش‌فرض نمایش داده می‌شوند
- دسته‌بندی‌ها به صورت داینامیک بارگذاری و نمایش داده می‌شوند
- آمار محصولات در کنسول مرورگر نمایش داده می‌شود 