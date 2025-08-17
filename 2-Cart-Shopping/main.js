// Global Variables
let currentUser = null;
let products = [];
let cart = [];
let currentPage = 1;
let itemsPerPage = 12;
let currentFilter = '';
let currentCategory = '';
let appliedDiscount = null;

// Discount Codes - Will be loaded from database
let discountCodes = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Clear localStorage if there are issues
    try {
        const testUser = localStorage.getItem('currentUser');
        if (testUser) {
            JSON.parse(testUser);
        }
    } catch (error) {
        console.log('Clearing corrupted localStorage...');
        localStorage.clear();
    }
    
    initializeApp();
});

async function initializeApp() {
    console.log('Initializing app...');
    
    loadTheme();
    loadUser();
    
    console.log('After loadUser - currentUser:', currentUser ? currentUser.username : 'null', 'Cart items:', cart.length);
    
    await generateProducts();
    setupEventListeners();
    showPage('home');
    renderHomeProducts();
    updateUI();
    
    console.log('App initialized - currentUser:', currentUser ? currentUser.username : 'null', 'Cart items:', cart.length);
    
    // Display product statistics in console
    displayProductStats();
    
    // Display discount codes info in console
    displayDiscountCodesInfo();
}

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const mobileIcon = document.querySelector('#mobileThemeToggle i');
    const mobileText = document.querySelector('#mobileThemeToggle span');
    const desktopIcon = document.querySelector('#desktopThemeToggle i');
    
    if (mobileIcon) {
        mobileIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    if (mobileText) {
        mobileText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
    
    if (desktopIcon) {
        desktopIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// User Management
function loadUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('User loaded from localStorage:', currentUser.username, 'Cart items:', currentUser.cart ? currentUser.cart.length : 0);
            loadUserCart();
        } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem('currentUser');
            currentUser = null;
        }
    } else {
        console.log('No saved user found in localStorage');
        // Load anonymous cart if no user is logged in
        loadAnonymousCart();
    }
}

function saveUser() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Also update in users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
}

function registerUser(userData) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if username already exists
    if (users.find(user => user.username === userData.username)) {
        throw new Error('Username already exists');
    }
    
    const newUser = {
        id: Date.now(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        password: userData.password, // In real app, hash the password
        cart: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    return newUser;
}

function loginUser(username, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        throw new Error('Invalid username or password');
    }
    
    return user;
}

function logoutUser() {
    // Save current cart as anonymous cart before logging out
    if (cart.length > 0) {
        localStorage.setItem('anonymousCart', JSON.stringify(cart));
        console.log('Cart saved as anonymous cart before logout:', cart.length, 'items');
    }
    
    currentUser = null;
    localStorage.removeItem('currentUser');
    cart = [];
    updateUI();
    showPage('home');
    
    // Clear cart display
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        cartItems.innerHTML = '<div class="empty-cart"><img src="/images/empty-cart.svg" /></div>';
    }
    
    // Reset cart summary
    const cartItemCount = document.getElementById('cartItemCount');
    const summaryItemCount = document.getElementById('summaryItemCount');
    const totalPrice = document.getElementById('totalPrice');
    
    if (cartItemCount) cartItemCount.textContent = '0 items';
    if (summaryItemCount) summaryItemCount.textContent = '0';
    if (totalPrice) totalPrice.textContent = '$0';
}

// Product Management
async function generateProducts() {
    try {
        const response = await fetch('db/db-products.json');
        const data = await response.json();
        products = data.products;
        console.log('Products loaded from database:', products.length, 'products');
        
        // Load categories dynamically
        await loadCategories(data.categories);
        
        // Load discount codes from separate file
        await loadDiscountCodesFromFile();
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to default products if database fails
        products = [
            {
                id: 1,
                name: "Apple MacBook Pro",
                category: "electronics",
                categoryName: "Electronics",
                price: 85000000,
                stock: 15,
                rating: 4.7,
                image: "https://picsum.photos/300/200?random=1",
                description: "Powerful Apple laptop with M2 processor"
            }
        ];
    }
}

async function loadCategories(categoriesData) {
    try {
        // Update category select options dynamically (only for products page)
        const categorySelect = document.getElementById('categoryFilter');
        
        if (categorySelect) {
            // Clear existing options except the first one
            const firstOption = categorySelect.querySelector('option[value=""]');
            categorySelect.innerHTML = '';
            if (firstOption) {
                categorySelect.appendChild(firstOption);
            }
            
            // Add new category options
            categoriesData.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        }
        
        console.log('Categories loaded:', categoriesData.length, 'categories');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadDiscountCodesFromFile() {
    try {
        const response = await fetch('db/db-discount-code.json');
        const data = await response.json();
        
        // Convert array to object for easier access
        discountCodes = {};
        data.discountCodes.forEach(discount => {
            discountCodes[discount.code] = {
                percentage: discount.percentage,
                description: discount.description,
                active: discount.active,
                expiryDate: discount.expiryDate,
                usageLimit: discount.usageLimit,
                usedCount: discount.usedCount
            };
        });
        
        console.log('Discount codes loaded from file:', data.discountCodes.length, 'codes');
        console.log('Available codes:', Object.keys(discountCodes));
    } catch (error) {
        console.error('Error loading discount codes from file:', error);
        // Set default discount codes if file loading fails
        discountCodes = {
            'SAVE10': {
                percentage: 10,
                description: '10% Discount',
                active: true,
                expiryDate: '2024-12-31',
                usageLimit: 100,
                usedCount: 0
            }
        };
        console.log('Using default discount codes');
    }
}

// Function to get active discount codes
function getActiveDiscountCodes() {
    const today = new Date();
    return Object.values(discountCodes).filter(discount => 
        discount.active && 
        new Date(discount.expiryDate) > today && 
        discount.usedCount < discount.usageLimit
    );
}

// Function to add new discount code
async function addDiscountCode(newDiscount) {
    try {
        const response = await fetch('db/db-discount-code.json');
        const data = await response.json();
        
        // Add new discount code
        data.discountCodes.push(newDiscount);
        
        // Update local discount codes
        discountCodes[newDiscount.code] = {
            percentage: newDiscount.percentage,
            description: newDiscount.description,
            active: newDiscount.active,
            expiryDate: newDiscount.expiryDate,
            usageLimit: newDiscount.usageLimit,
            usedCount: newDiscount.usedCount
        };
        
        console.log('New discount code added:', newDiscount.code);
        return newDiscount;
    } catch (error) {
        console.error('Error adding discount code:', error);
        throw error;
    }
}

// Function to update discount code usage
function updateDiscountUsage(code) {
    if (discountCodes[code]) {
        discountCodes[code].usedCount++;
        console.log(`Discount code ${code} usage updated: ${discountCodes[code].usedCount}/${discountCodes[code].usageLimit}`);
    }
}

// Function to display discount codes info
function displayDiscountCodesInfo() {
    const activeCodes = getActiveDiscountCodes();
    console.log('🎫 Active Discount Codes:');
    activeCodes.forEach(discount => {
        const expiryDate = new Date(discount.expiryDate).toLocaleDateString('en-US');
        console.log(`  ${discount.description}: ${discount.percentage}% off (Expires: ${expiryDate}, Used: ${discount.usedCount}/${discount.usageLimit})`);
    });
}

// Function to add new product to database
async function addProductToDatabase(newProduct) {
    try {
        const response = await fetch('db.json');
        const data = await response.json();
        
        // Add new product with unique ID
        newProduct.id = Math.max(...data.products.map(p => p.id)) + 1;
        data.products.push(newProduct);
        
        // In a real application, you would save this back to the server
        // For now, we'll just add it to the local products array
        products.push(newProduct);
        
        console.log('New product added:', newProduct.name);
        return newProduct;
    } catch (error) {
        console.error('Error adding product:', error);
        throw error;
    }
}

// Function to get products by category
function getProductsByCategory(categoryId) {
    return products.filter(product => product.category === categoryId);
}

// Function to clear all filters
function clearFilters() {
    currentFilter = '';
    currentCategory = '';
    currentPage = 1;
    
    // Reset form inputs
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    
    // Re-render products
    renderProducts();
}

// Function to search products
function searchProducts(query) {
    const searchTerm = query.toLowerCase();
    return products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.categoryName.toLowerCase().includes(searchTerm)
    );
}

// Function to get product statistics
function getProductStats() {
    const stats = {
        totalProducts: products.length,
        totalCategories: new Set(products.map(p => p.category)).size,
        totalValue: products.reduce((sum, p) => sum + p.price, 0),
        lowStock: products.filter(p => p.stock < 5).length,
        outOfStock: products.filter(p => p.stock === 0).length,
        byCategory: {}
    };
    
    // Group by category
    products.forEach(product => {
        if (!stats.byCategory[product.category]) {
            stats.byCategory[product.category] = {
                name: product.categoryName,
                count: 0,
                totalValue: 0
            };
        }
        stats.byCategory[product.category].count++;
        stats.byCategory[product.category].totalValue += product.price;
    });
    
    return stats;
}

// Function to display product statistics
function displayProductStats() {
    const stats = getProductStats();
    console.log('📊 Product Statistics:');
    console.log(`📦 Total Products: ${stats.totalProducts}`);
    console.log(`🏷️ Total Categories: ${stats.totalCategories}`);
    console.log(`💰 Total Value: $${formatPrice(stats.totalValue)}`);
    console.log(`⚠️ Low Stock: ${stats.lowStock}`);
    console.log(`❌ Out of Stock: ${stats.outOfStock}`);
    
    console.log('\n📋 By Category:');
    Object.values(stats.byCategory).forEach(cat => {
        console.log(`  ${cat.name}: ${cat.count} products - $${formatPrice(cat.totalValue)}`);
    });
}

// Function to filter products by price range
function filterProductsByPrice(minPrice, maxPrice) {
    return products.filter(product => 
        product.price >= minPrice && product.price <= maxPrice
    );
}

// Function to get products in stock
function getProductsInStock() {
    return products.filter(product => product.stock > 0);
}

// Function to get low stock products
function getLowStockProducts(threshold = 5) {
    return products.filter(product => product.stock > 0 && product.stock <= threshold);
}

// Function to sort products
function sortProducts(products, sortBy = 'name', order = 'asc') {
    const sorted = [...products];
    
    switch (sortBy) {
        case 'name':
            sorted.sort((a, b) => order === 'asc' ? 
                a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
            break;
        case 'price':
            sorted.sort((a, b) => order === 'asc' ? a.price - b.price : b.price - a.price);
            break;
        case 'stock':
            sorted.sort((a, b) => order === 'asc' ? a.stock - b.stock : b.stock - a.stock);
            break;
        case 'category':
            sorted.sort((a, b) => order === 'asc' ? 
                a.categoryName.localeCompare(b.categoryName) : b.categoryName.localeCompare(a.categoryName));
            break;
    }
    
    return sorted;
}

function getFilteredProducts() {
    let filtered = products;
    
    if (currentFilter) {
        filtered = searchProducts(currentFilter);
    }
    
    if (currentCategory) {
        filtered = filtered.filter(product => product.category === currentCategory);
    }
    
    // iPhone ها را اول نمایش بده
    filtered.sort((a, b) => {
        // اگر هر دو iPhone هستند، بر اساس قیمت مرتب کن
        if (a.category === 'phones' && b.category === 'phones') {
            return b.price - a.price; // گران‌ترین اول
        }
        // اگر فقط یکی iPhone است، آن را اول بگذار
        if (a.category === 'phones') return -1;
        if (b.category === 'phones') return 1;
        // بقیه محصولات بر اساس ID مرتب شوند
        return a.id - b.id;
    });
    
    return filtered;
}

function getPaginatedProducts() {
    const filtered = getFilteredProducts();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
}

function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const filteredProducts = getFilteredProducts();
    const paginatedProducts = getPaginatedProducts();

    productsGrid.innerHTML = '';
       // اگر هیچ محصولی پیدا نشد، پیام مناسب نمایش بده
       if (filteredProducts.length === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.style.gridColumn = '1 / -1'; // کل عرض grid را بگیرد
        noResultsDiv.style.display = 'flex';
        noResultsDiv.style.justifyContent = 'center';
        noResultsDiv.style.alignItems = 'center';
        noResultsDiv.style.minHeight = '400px';
        noResultsDiv.innerHTML = `
                <img class="no-results-image" src="images/original-7aa7090efc88959fa585be336358a674-removebg-preview.png" class="no-results-image">
        `;
        productsGrid.appendChild(noResultsDiv);
        
        // pagination را مخفی کن
        const pagination = document.getElementById('pagination');
        if (pagination) {
            pagination.innerHTML = '';
        }
        return;
    }
    
    
 
    
    // اگر محصولی وجود دارد، آن‌ها را نمایش بده
    paginatedProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    renderPagination();
}

function renderHomeProducts() {
    const productsGrid = document.getElementById('homeProductsGrid');
    
    // از هر کتگوری 2 محصول نمایش بده (مجموع 10 محصول)
    const categories = [
        { id: 'phones', name: 'Phones' },
        { id: 'mac', name: 'Mac' },
        { id: 'airpods', name: 'AirPods' },
    ];
    
    productsGrid.innerHTML = '';
    
    categories.forEach(category => {
        // عنوان کتگوری را اضافه کن
        const categoryProducts = products.filter(p => p.category === category.id);
        const selectedProducts = categoryProducts.slice(0, 3);
        
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        
        selectedProducts.forEach(product => {
            const productCard = createProductCard(product);
            categorySection.appendChild(productCard);
        });
        
        productsGrid.appendChild(categorySection);
    });
    
    // حذف pagination از صفحه خانه
    const homePagination = document.getElementById('homePagination');
    if (homePagination) {
        homePagination.innerHTML = '';
    }
}

// Helper function to generate star rating HTML
function generateStarRating(rating) {
    if (!rating || rating === 0) {
        return '<div class="star-rating no-rating">No ratings yet</div>';
    }
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '<div class="star-rating">';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star star-full"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt star-half"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star star-empty"></i>';
    }
    
    starsHTML += '</div>';
    
    return starsHTML;
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Generate star rating
    const starRating = generateStarRating(product.rating);
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            ${starRating}
            <p class="product-price">$${formatPrice(product.price)}</p>
            <p class="product-stock">Stock: ${product.stock} units</p>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})" 
                    ${!currentUser ? 'disabled' : ''} 
                    ${product.stock === 0 ? 'disabled' : ''}>
                ${!currentUser ? 'Please login to add' : 
                  product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('add-to-cart-btn')) {
            showProductDetail(product);
        }
    });
    
    return card;
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const filtered = getFilteredProducts();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = 'Previous';
        prevBtn.onclick = () => changePage(currentPage - 1);
        pagination.appendChild(prevBtn);
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => changePage(i);
            pagination.appendChild(pageBtn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '0.5rem';
            pagination.appendChild(ellipsis);
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = 'Next';
        nextBtn.onclick = () => changePage(currentPage + 1);
        pagination.appendChild(nextBtn);
    }
}

function changePage(page) {
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cart Management
function loadUserCart() {
    if (currentUser && currentUser.cart && Array.isArray(currentUser.cart)) {
        cart = [...currentUser.cart]; // Create a copy to avoid reference issues
    } else {
        cart = [];
        // Ensure currentUser has a cart property
        if (currentUser) {
            currentUser.cart = [];
        }
    }
}

function loadAnonymousCart() {
    const anonymousCart = localStorage.getItem('anonymousCart');
    if (anonymousCart) {
        try {
            cart = JSON.parse(anonymousCart);
            console.log('Anonymous cart loaded:', cart.length, 'items');
        } catch (error) {
            console.error('Error parsing anonymous cart:', error);
            cart = [];
            localStorage.removeItem('anonymousCart');
        }
    } else {
        cart = [];
        console.log('No anonymous cart found in localStorage');
    }
}

function saveUserCart() {
    if (currentUser) {
        // Ensure cart is properly set
        currentUser.cart = [...cart]; // Create a copy to avoid reference issues
        
        // Save to localStorage immediately
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Also save to users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        console.log('Cart saved for user:', currentUser.username, 'Cart items:', cart.length);
    } else {
        // Save as anonymous cart if no user is logged in
        localStorage.setItem('anonymousCart', JSON.stringify(cart));
        console.log('Cart saved as anonymous cart:', cart.length, 'items');
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert('Not enough stock');
            return;
        }
    } else {
        if (product.stock > 0) {
            cart.push({
                id: product.id,
                name: product.name,
                category: product.category,
                categoryName: product.categoryName,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        } else {
            alert('Product out of stock');
            return;
        }
    }
    
    saveUserCart();
    updateUI();
    
    // Update cart display if on cart page
    if (document.getElementById('cartPage').classList.contains('active')) {
        renderCart();
        updateCartSummary();
    }
    
    // Show different messages for anonymous vs logged-in users
    if (currentUser) {
        alert('Product added to cart');
    } else {
        alert('Product added to cart! Your items are saved locally. Login to checkout and access your cart across devices.');
    }
    
    console.log('Product added to cart. User:', currentUser ? currentUser.username : 'Anonymous', 'Cart items:', cart.length);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveUserCart();
    updateUI();
    
    // Update cart display immediately
    renderCart();
    updateCartSummary();
}

function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (!item || !product) return;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > product.stock) {
        alert('Not enough stock');
        return;
    }
    
    item.quantity = newQuantity;
    saveUserCart();
    updateUI();
    
    // Update cart display immediately
    renderCart();
    updateCartSummary();
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartItemCount = document.getElementById('cartItemCount');
    const summaryItemCount = document.getElementById('summaryItemCount');
    
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart"><img src="/images/empty-cart.svg" /></div>';
        cartItemCount.textContent = '0 items';
        summaryItemCount.textContent = '0';
        return;
    }
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-category">${item.categoryName}</p>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" 
                       onchange="updateCartQuantity(${item.id}, parseInt(this.value) || 1)" 
                       onblur="updateCartQuantity(${item.id}, parseInt(this.value) || 1)" min="1">
                <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-price">${formatPrice(item.price * item.quantity)} $</div>
            <button class="remove-item-btn" onclick="removeFromCart(${item.id})">×</button>
        `;
        cartItems.appendChild(cartItem);
    });
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartItemCount.textContent = `${totalItems} items`;
    summaryItemCount.textContent = totalItems;
}

function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = parseInt(document.getElementById('shippingSelect').value) * 1000;
    let total = subtotal + shipping;
    
    if (appliedDiscount) {
        const discountAmount = (subtotal * appliedDiscount.percentage) / 100;
        total -= discountAmount;
    }
    
    return { subtotal, shipping, total };
}

function updateCartSummary() {
    const { subtotal, shipping, total } = calculateTotal();
    const subtotalElement = document.getElementById('subtotal');
    const totalPrice = document.getElementById('totalPrice');
    const itemCount = document.getElementById('summaryItemCount');
    
    if (subtotalElement) {
        subtotalElement.textContent = `$${formatPrice(subtotal)}`;
    }
    
    if (totalPrice) {
        totalPrice.textContent = `$${formatPrice(total)}`;
    }
    
    if (itemCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        itemCount.textContent = totalItems;
    }
}

function applyDiscount() {
    const code = document.getElementById('discountCode').value.trim().toUpperCase();
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    
    if (!code) {
        alert('Please enter a discount code');
        return;
    }
    
    console.log('Trying to apply code:', code);
    console.log('Available codes:', Object.keys(discountCodes));
    console.log('Discount codes object:', discountCodes);
    
    if (!discountCodes[code]) {
        alert(`Invalid discount code: ${code}\n\nAvailable codes: ${Object.keys(discountCodes).join(', ')}`);
        return;
    }
    
    const discount = discountCodes[code];
    
    // Check if discount is active
    if (!discount.active) {
        alert('This discount code is not active');
        return;
    }
    
    // Check if discount has expired
    const today = new Date();
    const expiryDate = new Date(discount.expiryDate);
    if (today > expiryDate) {
        alert('This discount code has expired');
        return;
    }
    
    // Check usage limit
    if (discount.usedCount >= discount.usageLimit) {
        alert('This discount code has reached its usage limit');
        return;
    }
    
    appliedDiscount = discount;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountValue = (subtotal * appliedDiscount.percentage) / 100;
    
    discountRow.style.display = 'flex';
    discountAmount.textContent = `$${formatPrice(discountValue)}`;
    
    updateCartSummary();
    alert(`Discount code ${appliedDiscount.description} applied`);
}

function removeDiscount() {
    appliedDiscount = null;
    const discountRow = document.getElementById('discountRow');
    const discountCode = document.getElementById('discountCode');
    
    if (discountRow) {
        discountRow.style.display = 'none';
    }
    
    if (discountCode) {
        discountCode.value = '';
    }
    
    updateCartSummary();
    alert('Discount code removed');
}

// Related Products
function renderRelatedProducts() {
    const relatedGrid = document.getElementById('relatedProductsGrid');
    const cartCategories = [...new Set(cart.map(item => item.category))];
    
    if (cartCategories.length === 0) {
        relatedGrid.innerHTML = '<p>No products in cart</p>';
        return;
    }
    
    const relatedProducts = products.filter(product => 
        cartCategories.includes(product.category) && 
        !cart.find(item => item.id === product.id)
    ).slice(0, 4);
    
    relatedGrid.innerHTML = '';
    
    relatedProducts.forEach(product => {
        const productCard = createProductCard(product);
        relatedGrid.appendChild(productCard);
    });
}

// Product Detail Modal
function showProductDetail(product) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalProductTitle');
    const content = document.getElementById('productDetailContent');
    
    // Generate star rating for product detail
    const starRating = generateStarRating(product.rating);
    
    title.textContent = product.name;
    content.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-detail-image">
        <div class="product-detail-info">
            <h4>${product.name}</h4>
            ${starRating}
            <p class="product-detail-price">$${formatPrice(product.price)}</p>
            <p class="product-detail-stock">Stock: ${product.stock} units</p>
            <p>${product.description}</p>
            <div class="product-detail-actions">
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})" 
                        ${!currentUser ? 'disabled' : ''} 
                        ${product.stock === 0 ? 'disabled' : ''}>
                    ${!currentUser ? 'Please login to add' : 
                      product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `;
    
    openModal('productModal');
}

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Page Navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageName + 'Page').classList.add('active');
    
    // Add active class to nav link
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    // Load page-specific content
    switch (pageName) {
        case 'home':
            renderHomeProducts();
            break;
        case 'products':
            renderProducts();
            break;
        case 'cart':
            renderCart();
            renderRelatedProducts();
            updateCartSummary();
            break;
    }
}

// UI Updates
function updateUI() {
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const userGreeting = document.getElementById('userGreeting');
    
    if (currentUser) {
        authSection.style.display = 'none';
        userSection.style.display = 'flex';
        userGreeting.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    } else {
        authSection.style.display = 'flex';
        userSection.style.display = 'none';
    }
    
    // Update cart summary and display
    updateCartSummary();
    
    // Update cart display if on cart page
    if (document.getElementById('cartPage').classList.contains('active')) {
        renderCart();
    }
    
    // Update anonymous cart notice visibility
    updateAnonymousCartNotice();
}

// Function to show/hide anonymous cart notice
function updateAnonymousCartNotice() {
    const notice = document.getElementById('anonymousCartNotice');
    if (notice) {
        if (!currentUser && cart.length > 0) {
            notice.style.display = 'block';
        } else {
            notice.style.display = 'none';
        }
    }
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
            
            // Close mobile menu after navigation
            closeMobileMenu();
        });
    });
    
    // Mobile menu toggle
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);
    
    // Theme toggle (desktop and mobile)
    document.getElementById('desktopThemeToggle').addEventListener('click', toggleTheme);
    document.getElementById('mobileThemeToggle').addEventListener('click', toggleTheme);
    
    // Authentication
    document.getElementById('loginBtn').addEventListener('click', () => openModal('loginModal'));
    document.getElementById('registerBtn').addEventListener('click', () => openModal('registerModal'));
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);
    
    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    

    
    // Search and filters for products page
    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentFilter = e.target.value;
        currentPage = 1;
        renderProducts();
    });
    
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        currentCategory = e.target.value;
        currentPage = 1;
        renderProducts();
    });
    
    // Cart functionality
    document.getElementById('shippingSelect').addEventListener('change', updateCartSummary);
    document.getElementById('applyDiscountBtn').addEventListener('click', applyDiscount);
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
    document.getElementById('invoiceBtn').addEventListener('click', generateInvoice);
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Form Handlers
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        currentUser = loginUser(username, password);
        console.log('User logged in:', currentUser.username, 'Cart items:', currentUser.cart ? currentUser.cart.length : 0);
        
        // Merge anonymous cart with user cart if both exist
        const anonymousCart = localStorage.getItem('anonymousCart');
        if (anonymousCart) {
            try {
                const anonymousCartData = JSON.parse(anonymousCart);
                if (anonymousCartData.length > 0) {
                    console.log('Merging anonymous cart with user cart:', anonymousCartData.length, 'items');
                    mergeCarts(anonymousCartData, currentUser.cart || []);
                    // Clear anonymous cart after merging
                    localStorage.removeItem('anonymousCart');
                }
            } catch (error) {
                console.error('Error parsing anonymous cart during login:', error);
                localStorage.removeItem('anonymousCart');
            }
        }
        
        loadUserCart();
        saveUser(); // Save user to localStorage after successful login
        
        console.log('User saved to localStorage, currentUser:', currentUser.username, 'Cart items:', currentUser.cart ? currentUser.cart.length : 0);
        
        updateUI();
        closeModal('loginModal');
        document.getElementById('loginForm').reset();
        alert('Successfully logged in');
    } catch (error) {
        alert(error.message);
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        currentUser = registerUser({ firstName, lastName, username, password });
        
        // Merge anonymous cart with new user account if it exists
        const anonymousCart = localStorage.getItem('anonymousCart');
        if (anonymousCart) {
            try {
                const anonymousCartData = JSON.parse(anonymousCart);
                if (anonymousCartData.length > 0) {
                    console.log('Merging anonymous cart with new user account:', anonymousCartData.length, 'items');
                    mergeCarts(anonymousCartData, []);
                    // Clear anonymous cart after merging
                    localStorage.removeItem('anonymousCart');
                }
            } catch (error) {
                console.error('Error parsing anonymous cart during registration:', error);
                localStorage.removeItem('anonymousCart');
            }
        }
        
        loadUserCart();
        saveUser();
        updateUI();
        closeModal('registerModal');
        document.getElementById('registerForm').reset();
        alert('Registration successful');
    } catch (error) {
        alert(error.message);
    }
}

// Checkout and Invoice
function handleCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    if (!currentUser) {
        alert('Please login to proceed with checkout');
        showModal('loginModal');
        return;
    }
    
    const { total } = calculateTotal();
    alert(`Total payable: $${formatPrice(total)}\n\nIn a real application, the user would be redirected to a payment gateway.`);
}

function generateInvoice() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    if (!currentUser) {
        alert('Please login to generate invoice');
        showModal('loginModal');
        return;
    }
    
    const { subtotal, shipping, total } = calculateTotal();
    const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percentage) / 100 : 0;
    
    let invoiceContent = `
        <html dir="ltr">
        <head>
            <meta charset="UTF-8">
            <title>Purchase Invoice</title>
            <style>
                body { font-family: 'Arial', sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .customer-info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Purchase Invoice</h1>
                <p>Date: ${new Date().toLocaleDateString('en-US')}</p>
            </div>
            
            <div class="customer-info">
                <h3>Customer Information:</h3>
                <p>Name: ${currentUser.firstName} ${currentUser.lastName}</p>
                <p>Username: ${currentUser.username}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Price</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    cart.forEach(item => {
        invoiceContent += `
            <tr>
                <td>${item.name}</td>
                <td>${item.categoryName}</td>
                <td>${item.quantity}</td>
                <td>$${formatPrice(item.price)}</td>
                <td>$${formatPrice(item.price * item.quantity)}</td>
            </tr>
        `;
    });
    
    invoiceContent += `
                </tbody>
            </table>
            
            <div class="total">
                <p>Subtotal: $${formatPrice(subtotal)}</p>
                <p>Shipping: $${formatPrice(shipping)}</p>
                ${appliedDiscount ? `<p>Discount (${appliedDiscount.percentage}%): $${formatPrice(discountAmount)}</p>` : ''}
                <p>Total Payable: $${formatPrice(total)}</p>
            </div>
        </body>
        </html>
    `;
    
    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Invoice downloaded successfully');
}

// Utility Functions
function formatPrice(price) {
    return price.toLocaleString('en-US');
}

// Global functions for HTML onclick
window.showPage = showPage;
window.closeModal = closeModal;
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.showProductDetail = showProductDetail;

// Global functions for database operations
window.addProductToDatabase = addProductToDatabase;
window.getProductsByCategory = getProductsByCategory;
window.searchProducts = searchProducts;
window.getProductStats = getProductStats;
window.displayProductStats = displayProductStats;
window.filterProductsByPrice = filterProductsByPrice;
window.getProductsInStock = getProductsInStock;
window.getLowStockProducts = getLowStockProducts;
window.sortProducts = sortProducts;

// Global functions for discount code operations
window.addDiscountCode = addDiscountCode;
window.getActiveDiscountCodes = getActiveDiscountCodes;
window.updateDiscountUsage = updateDiscountUsage;
window.displayDiscountCodesInfo = displayDiscountCodesInfo;

// Global function for clearing filters
window.clearFilters = clearFilters;

// Helper function to clear anonymous cart
function clearAnonymousCart() {
    localStorage.removeItem('anonymousCart');
    console.log('Anonymous cart cleared');
}

// Helper function to merge anonymous cart with user cart
function mergeCarts(anonymousCart, userCart) {
    console.log('Starting cart merge. Anonymous items:', anonymousCart.length, 'User items:', userCart.length);
    
    const mergedCart = [...userCart];
    
    anonymousCart.forEach(anonymousItem => {
        const existingUserItem = mergedCart.find(item => item.id === anonymousItem.id);
        
        if (existingUserItem) {
            // If item exists in user cart, add quantities (respecting stock limit)
            const product = products.find(p => p.id === anonymousItem.id);
            if (product) {
                const oldQuantity = existingUserItem.quantity;
                const maxQuantity = Math.min(existingUserItem.quantity + anonymousItem.quantity, product.stock);
                existingUserItem.quantity = maxQuantity;
                console.log(`Merged item ${anonymousItem.name}: ${oldQuantity} + ${anonymousItem.quantity} = ${maxQuantity} (stock limit: ${product.stock})`);
            }
        } else {
            // If item doesn't exist in user cart, add it
            mergedCart.push({...anonymousItem});
            console.log(`Added new item to user cart: ${anonymousItem.name} (quantity: ${anonymousItem.quantity})`);
        }
    });
    
    // Update currentUser cart with merged result
    currentUser.cart = mergedCart;
    console.log('Carts merged successfully. Total items:', mergedCart.length);
    
    // Log final cart contents
    mergedCart.forEach(item => {
        console.log(`- ${item.name}: ${item.quantity} x $${formatPrice(item.price)}`);
    });
}

// Function to test discount codes (for debugging)
function testDiscountCodes() {
    console.log('🧪 Testing Discount Codes:');
    console.log('Available codes:', Object.keys(discountCodes));
    console.log('Discount codes object:', discountCodes);
    
    if (Object.keys(discountCodes).length === 0) {
        console.log('❌ No discount codes loaded!');
    } else {
        console.log('✅ Discount codes loaded successfully');
        Object.entries(discountCodes).forEach(([code, discount]) => {
            console.log(`  ${code}: ${discount.description} (${discount.percentage}%) - Active: ${discount.active}`);
        });
    }
}

// Call test function after page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        testDiscountCodes();
    }, 1000);
});

// Mobile Menu Functions
function toggleMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    
    mobileMenuBtn.classList.toggle('active');
    navMenu.classList.toggle('active');
}

function closeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    
    mobileMenuBtn.classList.remove('active');
    navMenu.classList.remove('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    
    if (!mobileMenuBtn.contains(e.target) && !navMenu.contains(e.target)) {
        closeMobileMenu();
    }
});
