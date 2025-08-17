# Online Shopping Cart - English Version

A complete online shopping cart application with dynamic database, user authentication, and discount code management.

## Features

### 🛒 Shopping Cart
- Add/remove products from cart
- Dynamic quantity adjustment
- Real-time price calculation
- Persistent cart data in localStorage

### 🎫 Dynamic Discount Codes
- Loaded from database
- Active/inactive status
- Expiry date validation
- Usage limit tracking
- Real-time validation

### 📊 Product Management
- 35+ products across 5 categories
- Dynamic category loading
- Search and filter functionality
- Stock management
- Product statistics

### 👤 User Authentication
- User registration and login
- Persistent user sessions
- User-specific cart data

## Database Structure

### Products
```json
{
  "id": 1,
  "name": "Apple MacBook Pro",
  "category": "electronics",
  "categoryName": "Electronics",
  "price": 85000000,
  "stock": 15,
  "image": "https://picsum.photos/300/200?random=1",
  "description": "Powerful Apple laptop with M2 processor..."
}
```

### Categories
```json
{
  "id": "electronics",
  "name": "Electronics",
  "description": "Electronic and digital products"
}
```

### Discount Codes
```json
{
  "code": "SAVE10",
  "percentage": 10,
  "description": "10% Discount",
  "active": true,
  "expiryDate": "2024-12-31",
  "usageLimit": 100,
  "usedCount": 0
}
```

## Available Discount Codes

| Code | Discount | Description | Status | Expiry |
|------|----------|-------------|--------|--------|
| SAVE10 | 10% | 10% Discount | Active | Dec 31, 2024 |
| SAVE20 | 20% | 20% Discount | Active | Dec 31, 2024 |
| SAVE30 | 30% | 30% Discount | Active | Dec 31, 2024 |
| WELCOME | 15% | 15% Discount for New Users | Active | Dec 31, 2024 |
| SUMMER2024 | 25% | Summer Sale 25% Off | Active | Aug 31, 2024 |
| FLASH50 | 50% | Flash Sale 50% Off | Inactive | Jun 30, 2024 |

## API Functions

### Product Management
```javascript
// Search products
const results = searchProducts("laptop");

// Filter by category
const electronics = getProductsByCategory("electronics");

// Filter by price
const affordable = filterProductsByPrice(0, 1000000);

// Get product statistics
const stats = getProductStats();
displayProductStats();
```

### Discount Code Management
```javascript
// Get active discount codes
const activeCodes = getActiveDiscountCodes();

// Add new discount code
const newDiscount = {
    code: "NEWCODE",
    percentage: 25,
    description: "New Customer Discount",
    active: true,
    expiryDate: "2024-12-31",
    usageLimit: 50,
    usedCount: 0
};
await addDiscountCode(newDiscount);

// Display discount codes info
displayDiscountCodesInfo();
```

## Usage Examples

### Apply Discount Code
```javascript
// In browser console
// Enter discount code in the cart page
// Or use: applyDiscount()
```

### Check Available Codes
```javascript
// In browser console
displayDiscountCodesInfo();
```

### Product Search
```javascript
// In browser console
const laptops = searchProducts("laptop");
console.log(laptops);
```

## Setup

1. Clone the repository
2. Open `index.html` in a web server (due to CORS)
3. Register a new account
4. Start shopping!

## File Structure

```
├── index.html          # Main HTML file
├── style.css           # CSS styles
├── main.js             # JavaScript functionality
├── db                  # Database with products, categories, and discount codes
└── README.md           # This file
```

## Technologies Used

- HTML5
- CSS3 (with CSS Variables for theming)
- Vanilla JavaScript (ES6+)
- JSON for data storage
- localStorage for user data persistence

## Features in Detail

### Dynamic Database Loading
- Products loaded from `db.json`
- Categories dynamically populated
- Discount codes with validation

### Responsive Design
- Mobile-friendly interface
- Dark/light theme support
- RTL/LTR language support

### Cart Functionality
- Add/remove items
- Quantity adjustment
- Real-time total calculation
- Shipping cost options
- Discount code application

### User Experience
- Smooth animations
- Modal dialogs
- Pagination
- Search and filtering
- Product details modal

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+


This project is open source and available under the MIT License. 