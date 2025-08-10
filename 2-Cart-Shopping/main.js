// Global Variables
let currentUser = null;
let products = [];
let cart = [];
let currentPage = 1;
let itemsPerPage = 12;
let currentFilter = '';
let currentCategory = '';
let appliedDiscount = null;

// Discount Codes
const discountCodes = {
    'SAVE10': { percentage: 10, description: '۱۰٪ تخفیف' },
    'SAVE20': { percentage: 20, description: '۲۰٪ تخفیف' },
    'SAVE30': { percentage: 30, description: '۳۰٪ تخفیف' },
    'WELCOME': { percentage: 15, description: '۱۵٪ تخفیف برای کاربران جدید' }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadTheme();
    loadUser();
    generateProducts();
    setupEventListeners();
    showPage('home');
    updateUI();
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
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// User Management
function loadUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadUserCart();
    }
}

function saveUser() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        saveUserCart();
    }
}

function registerUser(userData) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if username already exists
    if (users.find(user => user.username === userData.username)) {
        throw new Error('نام کاربری قبلاً استفاده شده است');
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
        throw new Error('نام کاربری یا رمز عبور اشتباه است');
    }
    
    return user;
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    cart = [];
    updateUI();
    showPage('home');
}

// Product Management
function generateProducts() {
    const categories = {
        electronics: ['لپتاپ', 'موبایل', 'تبلت', 'هدفون', 'کیبورد', 'موس', 'مانیتور', 'پرینتر'],
        clothing: ['پیراهن', 'شلوار', 'کت', 'کفش', 'کلاه', 'کیف', 'ساعت', 'عینک'],
        books: ['رمان', 'کتاب علمی', 'کتاب آموزشی', 'مجله', 'کتاب کودک', 'کتاب آشپزی'],
        sports: ['توپ فوتبال', 'توپ بسکتبال', 'کفش ورزشی', 'لباس ورزشی', 'دمبل', 'طناب'],
        home: ['میز', 'صندلی', 'کمد', 'فرش', 'پرده', 'گلدان', 'چراغ', 'ساعت دیواری']
    };
    
    const categoryNames = {
        electronics: 'الکترونیک',
        clothing: 'پوشاک',
        books: 'کتاب',
        sports: 'ورزشی',
        home: 'خانه و آشپزخانه'
    };
    
    products = [];
    
    Object.keys(categories).forEach(category => {
        categories[category].forEach((productName, index) => {
            products.push({
                id: products.length + 1,
                name: productName,
                category: category,
                categoryName: categoryNames[category],
                price: Math.floor(Math.random() * 900000) + 100000, // 100k to 1M
                stock: Math.floor(Math.random() * 20) + 1,
                image: `https://picsum.photos/300/200?random=${products.length + 1}`,
                description: `توضیحات کامل برای ${productName}`
            });
        });
    });
    
    // Add more products to reach 50+
    for (let i = 0; i < 20; i++) {
        const category = Object.keys(categories)[Math.floor(Math.random() * Object.keys(categories).length)];
        const productName = `محصول ${i + 1}`;
        products.push({
            id: products.length + 1,
            name: productName,
            category: category,
            categoryName: categoryNames[category],
            price: Math.floor(Math.random() * 900000) + 100000,
            stock: Math.floor(Math.random() * 20) + 1,
            image: `https://picsum.photos/300/200?random=${products.length + 1}`,
            description: `توضیحات کامل برای ${productName}`
        });
    }
}

function getFilteredProducts() {
    let filtered = products;
    
    if (currentFilter) {
        filtered = filtered.filter(product => 
            product.name.includes(currentFilter) || 
            product.categoryName.includes(currentFilter)
        );
    }
    
    if (currentCategory) {
        filtered = filtered.filter(product => product.category === currentCategory);
    }
    
    return filtered;
}

function getPaginatedProducts() {
    const filtered = getFilteredProducts();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
}

function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const paginatedProducts = getPaginatedProducts();
    
    productsGrid.innerHTML = '';
    
    paginatedProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    renderPagination();
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-category">${product.categoryName}</p>
            <p class="product-price">${formatPrice(product.price)} تومان</p>
            <p class="product-stock">موجودی: ${product.stock} عدد</p>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})" 
                    ${!currentUser ? 'disabled' : ''} 
                    ${product.stock === 0 ? 'disabled' : ''}>
                ${!currentUser ? 'برای افزودن وارد شوید' : 
                  product.stock === 0 ? 'ناموجود' : 'افزودن به سبد خرید'}
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
        prevBtn.textContent = 'قبلی';
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
        nextBtn.textContent = 'بعدی';
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
    if (currentUser && currentUser.cart) {
        cart = currentUser.cart;
    }
}

function saveUserCart() {
    if (currentUser) {
        currentUser.cart = cart;
        saveUser();
    }
}

function addToCart(productId) {
    if (!currentUser) {
        alert('لطفاً ابتدا وارد شوید');
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert('موجودی کافی نیست');
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
            alert('محصول ناموجود است');
            return;
        }
    }
    
    saveUserCart();
    updateUI();
    alert('محصول به سبد خرید اضافه شد');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveUserCart();
    updateUI();
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
        alert('موجودی کافی نیست');
        return;
    }
    
    item.quantity = newQuantity;
    saveUserCart();
    updateUI();
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartItemCount = document.getElementById('cartItemCount');
    const summaryItemCount = document.getElementById('summaryItemCount');
    
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-center">سبد خرید شما خالی است</p>';
        cartItemCount.textContent = '0 آیتم';
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
                       onchange="updateCartQuantity(${item.id}, parseInt(this.value))" min="1">
                <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-price">${formatPrice(item.price * item.quantity)} تومان</div>
            <button class="remove-item-btn" onclick="removeFromCart(${item.id})">×</button>
        `;
        cartItems.appendChild(cartItem);
    });
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartItemCount.textContent = `${totalItems} آیتم`;
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
    const totalPrice = document.getElementById('totalPrice');
    
    totalPrice.textContent = `${formatPrice(total)} تومان`;
}

function applyDiscount() {
    const code = document.getElementById('discountCode').value.trim().toUpperCase();
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    
    if (!code) {
        alert('لطفاً کد تخفیف را وارد کنید');
        return;
    }
    
    if (!discountCodes[code]) {
        alert('کد تخفیف معتبر نیست');
        return;
    }
    
    appliedDiscount = discountCodes[code];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountValue = (subtotal * appliedDiscount.percentage) / 100;
    
    discountRow.style.display = 'flex';
    discountAmount.textContent = `${formatPrice(discountValue)} تومان`;
    
    updateCartSummary();
    alert(`کد تخفیف ${appliedDiscount.description} اعمال شد`);
}

// Related Products
function renderRelatedProducts() {
    const relatedGrid = document.getElementById('relatedProductsGrid');
    const cartCategories = [...new Set(cart.map(item => item.category))];
    
    if (cartCategories.length === 0) {
        relatedGrid.innerHTML = '<p>محصولی در سبد خرید نیست</p>';
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
    
    title.textContent = product.name;
    content.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-detail-image">
        <div class="product-detail-info">
            <h4>${product.name}</h4>
            <p class="product-detail-category">دسته‌بندی: ${product.categoryName}</p>
            <p class="product-detail-price">${formatPrice(product.price)} تومان</p>
            <p class="product-detail-stock">موجودی: ${product.stock} عدد</p>
            <p>${product.description}</p>
            <div class="product-detail-actions">
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})" 
                        ${!currentUser ? 'disabled' : ''} 
                        ${product.stock === 0 ? 'disabled' : ''}>
                    ${!currentUser ? 'برای افزودن وارد شوید' : 
                      product.stock === 0 ? 'ناموجود' : 'افزودن به سبد خرید'}
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
        case 'products':
            renderProducts();
            break;
        case 'cart':
            renderCart();
            renderRelatedProducts();
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
        userGreeting.textContent = `سلام ${currentUser.firstName} ${currentUser.lastName}`;
    } else {
        authSection.style.display = 'flex';
        userSection.style.display = 'none';
    }
    
    updateCartSummary();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
        });
    });
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Authentication
    document.getElementById('loginBtn').addEventListener('click', () => openModal('loginModal'));
    document.getElementById('registerBtn').addEventListener('click', () => openModal('registerModal'));
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);
    
    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Search and filters
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
        loadUserCart();
        updateUI();
        closeModal('loginModal');
        document.getElementById('loginForm').reset();
        alert('با موفقیت وارد شدید');
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
        updateUI();
        closeModal('registerModal');
        document.getElementById('registerForm').reset();
        alert('ثبت نام با موفقیت انجام شد');
    } catch (error) {
        alert(error.message);
    }
}

// Checkout and Invoice
function handleCheckout() {
    if (cart.length === 0) {
        alert('سبد خرید شما خالی است');
        return;
    }
    
    const { total } = calculateTotal();
    alert(`مجموع قابل پرداخت: ${formatPrice(total)} تومان\n\nدر حالت واقعی، کاربر به درگاه پرداخت هدایت می‌شود.`);
}

function generateInvoice() {
    if (cart.length === 0) {
        alert('سبد خرید شما خالی است');
        return;
    }
    
    const { subtotal, shipping, total } = calculateTotal();
    const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percentage) / 100 : 0;
    
    let invoiceContent = `
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>فاکتور خرید</title>
            <style>
                body { font-family: 'Vazirmatn', sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .customer-info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>فاکتور خرید</h1>
                <p>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
            </div>
            
            <div class="customer-info">
                <h3>اطلاعات مشتری:</h3>
                <p>نام: ${currentUser.firstName} ${currentUser.lastName}</p>
                <p>نام کاربری: ${currentUser.username}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>محصول</th>
                        <th>دسته‌بندی</th>
                        <th>تعداد</th>
                        <th>قیمت واحد</th>
                        <th>قیمت کل</th>
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
                <td>${formatPrice(item.price)} تومان</td>
                <td>${formatPrice(item.price * item.quantity)} تومان</td>
            </tr>
        `;
    });
    
    invoiceContent += `
                </tbody>
            </table>
            
            <div class="total">
                <p>جمع کل: ${formatPrice(subtotal)} تومان</p>
                <p>هزینه ارسال: ${formatPrice(shipping)} تومان</p>
                ${appliedDiscount ? `<p>تخفیف (${appliedDiscount.percentage}%): ${formatPrice(discountAmount)} تومان</p>` : ''}
                <p>مجموع قابل پرداخت: ${formatPrice(total)} تومان</p>
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
    
    alert('فاکتور با موفقیت دانلود شد');
}

// Utility Functions
function formatPrice(price) {
    return price.toLocaleString('fa-IR');
}

// Global functions for HTML onclick
window.showPage = showPage;
window.closeModal = closeModal;
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.showProductDetail = showProductDetail;
