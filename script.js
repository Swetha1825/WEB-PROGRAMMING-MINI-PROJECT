// ============ GLOBAL STATE ============

let currentUser = null;
let currentCart = [];
let allProducts = [];
let allOrders = [];
let allUsers = [];
let allAdminRequests = [];
let currentOrderFilter = 'all';

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    initializeMockData();
});

async function initializeApp() {
    // Check if user is already logged in
    const session = getSession();
    
    if (session && session.user) {
        currentUser = session.user;
        
        if (currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showStore();
        }
    } else {
        showAuthSection();
    }
}

function setupEventListeners() {
    // Login form
    const loginFormElement = document.getElementById('login-form-element');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }

    // Register form
    const registerFormElement = document.getElementById('register-form-element');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', handleRegister);
    }

    // Product form (admin)
    const productFormElement = document.getElementById('product-form-element');
    if (productFormElement) {
        productFormElement.addEventListener('submit', handleAddProduct);
    }

    // Checkout form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

// ============ MOCK DATA ============

function initializeMockData() {
    // Initialize with some sample products
    let products = JSON.parse(localStorage.getItem('click2cart_products') || '[]');
    
    if (products.length === 0) {
        products = [
            {
                id: generateUUID(),
                name: 'Premium Wireless Headphones',
                price: 99.99,
                quantity: 25,
                category: 'Electronics',
                description: 'High-quality wireless headphones with noise cancellation',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: generateUUID(),
                name: 'Smart Watch Pro',
                price: 249.99,
                quantity: 15,
                category: 'Electronics',
                description: 'Advanced fitness tracking with 7-day battery life',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: generateUUID(),
                name: 'USB-C Fast Charger',
                price: 29.99,
                quantity: 50,
                category: 'Accessories',
                description: '65W fast charging compatible with all devices',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: generateUUID(),
                name: 'Portable SSD 1TB',
                price: 129.99,
                quantity: 20,
                category: 'Storage',
                description: 'Ultra-fast external solid state drive with 1TB capacity',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: generateUUID(),
                name: 'Mechanical Keyboard',
                price: 149.99,
                quantity: 12,
                category: 'Peripherals',
                description: 'RGB mechanical keyboard with custom switches',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: generateUUID(),
                name: '4K Webcam',
                price: 199.99,
                quantity: 8,
                category: 'Electronics',
                description: '4K resolution webcam for streaming and video calls',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('click2cart_products', JSON.stringify(products));
    }
    
    allProducts = products;
}

// ============ AUTHENTICATION ============

function switchAuthForm(formType) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (formType === 'register') {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    } else {
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const result = await signInUser(email, password);
        currentUser = result.user;
        
        showNotification(`Welcome back, ${currentUser.name}!`, 'success');
        
        if (currentUser.is_admin) {
            loadAdminRequests();
            showAdminDashboard();
        } else {
            showStore();
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    const requestAdmin = document.getElementById('admin-request').checked;
    
    const errorDiv = document.getElementById('register-error');
    
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.add('show');
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.classList.add('show');
        return;
    }
    
    try {
        const result = await signUpUser(email, password, name, requestAdmin);
        currentUser = result.user;
        
        if (requestAdmin) {
            showNotification('Account created! Admin request submitted for approval.', 'success');
        } else {
            showNotification('Account created successfully!', 'success');
        }
        
        switchAuthForm('login');
        
        // Clear form
        document.getElementById('register-form-element').reset();
        errorDiv.classList.remove('show');
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('show');
    }
}

function loginAsGuest() {
    showNotification('Browsing as guest', 'info');
    showStore();
}

// DEMO ONLY: creates or promotes a local demo admin so the admin dashboard
// can be demonstrated without relying on the registration checkbox.
// This is not secure authentication and must be removed before production.
function openDemoAdmin() {
    const demoEmail = 'admin@click2cart.demo';
    const demoName = 'Click2Cart Demo Admin';
    const users = JSON.parse(localStorage.getItem('click2cart_users') || '[]');
    let admin = users.find(user => user.email === demoEmail);

    if (!admin) {
        admin = {
            id: generateUUID(),
            email: demoEmail,
            password: hashPassword('Admin@123'),
            name: demoName,
            is_admin: true,
            created_at: new Date().toISOString()
        };
        users.push(admin);
    } else {
        admin.is_admin = true;
        admin.name = demoName;
    }

    localStorage.setItem('click2cart_users', JSON.stringify(users));
    const token = generateToken(admin.id);
    currentUser = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        is_admin: true
    };
    localStorage.setItem('click2cart_session', JSON.stringify({
        access_token: token,
        user: currentUser
    }));

    loadAdminRequests();
    showAdminDashboard();
    showNotification('Demo admin dashboard opened.', 'success');
}

function logout() {
    signOutUser();
    currentUser = null;
    currentCart = [];
    showAuthSection();
    showNotification('Logged out successfully', 'info');
}

// ============ SECTION VISIBILITY ============

function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('store-section').classList.add('hidden');
    document.getElementById('admin-section').classList.add('hidden');
    document.getElementById('checkout-modal').classList.add('hidden');
}

function showStore() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('store-section').classList.remove('hidden');
    document.getElementById('admin-section').classList.add('hidden');
    
    loadProducts();
    loadCart();
    updateUserDisplay();
}

function showAdminDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('store-section').classList.add('hidden');
    document.getElementById('admin-section').classList.remove('hidden');
    
    switchAdminTab('products');
    updateUserDisplay();
}

function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('user-email-display').textContent = currentUser.email;
    }
}

// ============ PRODUCTS ============

function loadProducts() {
    allProducts = JSON.parse(localStorage.getItem('click2cart_products') || '[]');
    renderProducts(allProducts);
}

function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #7f8c8d;">No products available</p>';
        return;
    }
    
    grid.innerHTML = products.map(product => {
        const inStock = product.quantity > 0;
        const stockStatus = inStock ? 
            `<span class="product-stock in-stock">${product.quantity} in stock</span>` :
            `<span class="product-stock out-of-stock">Out of Stock</span>`;
        
        return `
            <div class="product-card">
                <div class="product-image">📦</div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                        ${stockStatus}
                    </div>
                    <div class="product-actions">
                        <button class="add-to-cart-btn" 
                            onclick="addToCart('${product.id}')"
                            ${!inStock ? 'disabled' : ''}>
                            ${inStock ? '🛒 Add to Cart' : 'Out of Stock'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (!query) {
        renderProducts(allProducts);
        return;
    }
    
    const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );
    
    renderProducts(filtered);
}

// ============ CART ============

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    
    if (!product || product.quantity <= 0) {
        showNotification('Product is out of stock', 'warning');
        return;
    }
    
    const existingItem = currentCart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.quantity) {
            existingItem.quantity += 1;
        } else {
            showNotification('Cannot add more than available stock', 'warning');
            return;
        }
    } else {
        currentCart.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: 1,
            category: product.category
        });
    }
    
    saveCart();
    updateCartBadge();
    showNotification(`${product.name} added to cart!`, 'success');
}

function saveCart() {
    localStorage.setItem('click2cart_cart', JSON.stringify(currentCart));
}

function loadCart() {
    currentCart = JSON.parse(localStorage.getItem('click2cart_cart') || '[]');
    updateCartBadge();
}

function updateCartBadge() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const total = currentCart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = total;
    }
}

function toggleCart() {
    const cartPreview = document.getElementById('cart-preview');
    
    if (cartPreview.classList.contains('hidden')) {
        cartPreview.classList.remove('hidden');
        renderCart();
    } else {
        cartPreview.classList.add('hidden');
    }
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const subtotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = currentCart.length > 0 ? 9.99 : 0;
    const total = subtotal + shipping;
    
    if (currentCart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Your cart is empty</p>';
        document.getElementById('cart-subtotal').textContent = '$0.00';
        document.getElementById('cart-shipping').textContent = '$0.00';
        document.getElementById('cart-total').textContent = '$0.00';
        return;
    }
    
    cartItems.innerHTML = currentCart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)">−</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
    `).join('');
    
    document.getElementById('cart-subtotal').textContent = '$' + subtotal.toFixed(2);
    document.getElementById('cart-shipping').textContent = '$' + shipping.toFixed(2);
    document.getElementById('cart-total').textContent = '$' + total.toFixed(2);
}

function updateCartQty(productId, change) {
    const item = currentCart.find(item => item.id === productId);
    const product = allProducts.find(p => p.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else if (item.quantity > product.quantity) {
            item.quantity = product.quantity;
            showNotification('Cannot exceed available stock', 'warning');
        }
        
        saveCart();
        renderCart();
        updateCartBadge();
    }
}

function removeFromCart(productId) {
    currentCart = currentCart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
    renderCart();
    showNotification('Item removed from cart', 'info');
}

function closeCart() {
    document.getElementById('cart-preview').classList.add('hidden');
}

// ============ CHECKOUT ============

function proceedToCheckout() {
    if (currentCart.length === 0) {
        showNotification('Your cart is empty', 'warning');
        return;
    }
    
    if (!currentUser || !currentUser.email) {
        showNotification('Please login to checkout', 'warning');
        switchAuthForm('login');
        return;
    }
    
    document.getElementById('checkout-modal').classList.remove('hidden');
    renderCheckoutSummary();
}

function renderCheckoutSummary() {
    const itemsHtml = currentCart.map(item => `
        <div class="checkout-item">
            <span>${item.name} x${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 9.99;
    
    document.getElementById('checkout-items').innerHTML = itemsHtml;
    document.getElementById('checkout-total').textContent = '$' + total.toFixed(2);
}

async function handleCheckout(e) {
    e.preventDefault();
    
    const name = document.getElementById('address-name').value;
    const street = document.getElementById('address-street').value;
    const city = document.getElementById('address-city').value;
    const zip = document.getElementById('address-zip').value;
    const phone = document.getElementById('address-phone').value;
    
    const deliveryAddress = `${street}, ${city} ${zip}`;
    const totalAmount = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 9.99;
    
    const order = {
        id: generateUUID(),
        user_id: currentUser.id,
        user_name: currentUser.name,
        user_email: currentUser.email,
        total_amount: totalAmount,
        status: 'pending',
        delivery_address: deliveryAddress,
        phone_number: phone,
        items: currentCart.map(item => ({
            ...item,
            id: item.id
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    // Deduct from stock
    currentCart.forEach(cartItem => {
        const product = allProducts.find(p => p.id === cartItem.id);
        if (product) {
            product.quantity -= cartItem.quantity;
        }
    });
    
    // Save order
    let orders = JSON.parse(localStorage.getItem('click2cart_orders') || '[]');
    orders.push(order);
    localStorage.setItem('click2cart_orders', JSON.stringify(orders));
    localStorage.setItem('click2cart_products', JSON.stringify(allProducts));
    
    // Clear cart
    currentCart = [];
    saveCart();
    updateCartBadge();
    
    showNotification('Order placed successfully! Order ID: ' + order.id.slice(0, 8).toUpperCase(), 'success');
    closeCheckout();
    showStore();
}

function closeCheckout() {
    document.getElementById('checkout-modal').classList.add('hidden');
    document.getElementById('checkout-form').reset();
}

// ============ ADMIN - TAB MANAGEMENT ============

function switchAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
        
        // Add active to clicked button
        event.target.classList.add('active');
        
        // Load data for the tab
        if (tabName === 'products') {
            loadAdminProducts();
        } else if (tabName === 'orders') {
            loadAdminOrders();
        } else if (tabName === 'users') {
            loadAdminUsers();
        } else if (tabName === 'admin-requests') {
            loadAdminRequests();
        }
    }
}

// ============ ADMIN - PRODUCTS ============

function loadAdminProducts() {
    allProducts = JSON.parse(localStorage.getItem('click2cart_products') || '[]');
    renderAdminProducts();
}

function renderAdminProducts() {
    const list = document.getElementById('products-list');
    
    if (allProducts.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No products yet. Create your first product!</p>';
        return;
    }
    
    list.innerHTML = allProducts.map(product => `
        <div class="admin-product-card">
            <div class="product-header">
                <div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category}</div>
                </div>
            </div>
            
            <div class="product-details">
                <div class="detail-item">
                    <span class="label">Price:</span>
                    <span class="value">$${product.price.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Stock:</span>
                    <span class="value">${product.quantity}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Status:</span>
                    <span class="value">${product.quantity > 0 ? '✓ In Stock' : '✗ Out of Stock'}</span>
                </div>
            </div>
            
            <div class="product-description">${product.description}</div>
            
            <div class="product-actions">
                <button class="edit-btn" onclick="editProduct('${product.id}')">✏️ Edit</button>
                <button class="delete-btn" onclick="deleteProduct('${product.id}')">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function showAddProductForm() {
    document.getElementById('form-title').textContent = 'Add New Product';
    document.getElementById('product-form-element').reset();
    document.getElementById('product-form-element').removeAttribute('data-product-id');
    document.getElementById('product-form').classList.remove('hidden');
    document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
}

function hideAddProductForm() {
    document.getElementById('product-form').classList.add('hidden');
}

async function handleAddProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const quantity = parseInt(document.getElementById('product-quantity').value);
    const category = document.getElementById('product-category').value;
    const description = document.getElementById('product-description').value;
    
    const form = document.getElementById('product-form-element');
    const productId = form.getAttribute('data-product-id');
    
    if (productId) {
        // Edit existing
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            product.name = name;
            product.price = price;
            product.quantity = quantity;
            product.category = category;
            product.description = description;
            product.updated_at = new Date().toISOString();
            showNotification('Product updated successfully!', 'success');
        }
    } else {
        // Add new
        const product = {
            id: generateUUID(),
            name,
            price,
            quantity,
            category,
            description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        allProducts.push(product);
        showNotification('Product added successfully!', 'success');
    }
    
    localStorage.setItem('click2cart_products', JSON.stringify(allProducts));
    hideAddProductForm();
    loadAdminProducts();
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    
    if (product) {
        document.getElementById('form-title').textContent = 'Edit Product';
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-quantity').value = product.quantity;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-form-element').dataset.productId = productId;
        
        const form = document.getElementById('product-form');
        form.classList.remove('hidden');
        form.scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        allProducts = allProducts.filter(p => p.id !== productId);
        localStorage.setItem('click2cart_products', JSON.stringify(allProducts));
        showNotification('Product deleted successfully!', 'success');
        loadAdminProducts();
    }
}

// ============ ADMIN - ORDERS ============

function loadAdminOrders() {
    allOrders = JSON.parse(localStorage.getItem('click2cart_orders') || '[]');
    renderAdminOrders();
}

function renderAdminOrders() {
    const list = document.getElementById('orders-list');
    
    let filteredOrders = allOrders;
    if (currentOrderFilter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === currentOrderFilter);
    }
    
    if (filteredOrders.length === 0) {
        list.innerHTML = `<p style="text-align: center; color: #7f8c8d;">No orders found</p>`;
        return;
    }
    
    list.innerHTML = filteredOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-id">Order #${order.id.slice(0, 8).toUpperCase()}</div>
                <div class="order-status ${order.status}">${order.status.toUpperCase()}</div>
            </div>
            
            <div class="order-customer">
                <div class="customer-name">${order.user_name}</div>
                <div class="customer-email">${order.user_email}</div>
            </div>
            
            <div class="order-details">
                <div class="detail-row">
                    <span class="label">Date:</span>
                    <span class="value">${new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Items:</span>
                    <span class="value">${order.items.length}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Total:</span>
                    <span class="value">$${order.total_amount.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="order-items">
                <div class="items-title">Items Ordered:</div>
                ${order.items.map(item => `
                    <div class="item">
                        <span>${item.name} x${item.quantity}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-address">
                <div class="address-title">📍 Delivery Address:</div>
                ${order.delivery_address}
                <br>
                📞 ${order.phone_number}
            </div>
            
            <div class="order-actions">
                ${order.status === 'pending' ? `
                    <button class="accept-btn" onclick="acceptOrder('${order.id}')">Accept Order</button>
                    <button class="reject-btn" onclick="rejectOrder('${order.id}')">Reject Order</button>
                ` : `
                    <button class="accept-btn" disabled>${order.status === 'accepted' ? '✓ Accepted' : '✗ Rejected'}</button>
                `}
            </div>
        </div>
    `).join('');
}

function filterOrders(status) {
    currentOrderFilter = status;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderAdminOrders();
}

function acceptOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    
    if (order) {
        order.status = 'accepted';
        order.updated_at = new Date().toISOString();
        localStorage.setItem('click2cart_orders', JSON.stringify(allOrders));
        
        showNotification(`Order #${orderId.slice(0, 8)} accepted!`, 'success');
        loadAdminOrders();
    }
}

function rejectOrder(orderId) {
    if (confirm('Are you sure you want to reject this order?')) {
        const order = allOrders.find(o => o.id === orderId);
        
        if (order) {
            order.status = 'rejected';
            order.updated_at = new Date().toISOString();
            
            // Restore product quantities
            for (const item of order.items) {
                const product = allProducts.find(p => p.id === item.id);
                if (product) {
                    product.quantity += item.quantity;
                }
            }
            
            localStorage.setItem('click2cart_orders', JSON.stringify(allOrders));
            localStorage.setItem('click2cart_products', JSON.stringify(allProducts));
            
            showNotification(`Order #${orderId.slice(0, 8)} rejected!`, 'warning');
            loadAdminOrders();
        }
    }
}

// ============ ADMIN - USERS ============

function loadAdminUsers() {
    const users = JSON.parse(localStorage.getItem('click2cart_users') || '[]');
    allOrders = JSON.parse(localStorage.getItem('click2cart_orders') || '[]');
    
    allUsers = users.map(user => {
        const userOrders = allOrders.filter(order => order.user_id === user.id);
        const totalSpent = userOrders.reduce((sum, order) => sum + order.total_amount, 0);
        
        return {
            ...user,
            orders_count: userOrders.length,
            total_spent: totalSpent
        };
    });
    
    renderAdminUsers();
}

function renderAdminUsers() {
    const list = document.getElementById('users-list');
    
    if (allUsers.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No users yet</p>';
        return;
    }
    
    list.innerHTML = allUsers.map(user => `
        <div class="user-card">
            <div class="user-info">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
            </div>
            <div class="user-stats">
                <div class="stat">
                    <div class="stat-value">${user.orders_count}</div>
                    <div class="stat-label">Orders</div>
                </div>
                <div class="stat">
                    <div class="stat-value">$${user.total_spent.toFixed(2)}</div>
                    <div class="stat-label">Total Spent</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${user.is_admin ? '👑 Admin' : 'User'}</div>
                    <div class="stat-label">Role</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ============ ADMIN - ADMIN REQUESTS ============

function loadAdminRequests() {
    const users = JSON.parse(localStorage.getItem('click2cart_users') || '[]');
    const requests = JSON.parse(localStorage.getItem('click2cart_admin_requests') || '[]');
    
    // Clean up approved/rejected requests
    allAdminRequests = requests.filter(req => {
        // Check if user is now an admin (was approved)
        const user = users.find(u => u.id === req.user_id);
        return !user || !user.is_admin;
    });
    
    localStorage.setItem('click2cart_admin_requests', JSON.stringify(allAdminRequests));
    renderAdminRequests();
}

function renderAdminRequests() {
    const list = document.getElementById('admin-requests-list');
    
    if (allAdminRequests.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No pending admin requests</p>';
        return;
    }
    
    list.innerHTML = allAdminRequests.map(request => `
        <div class="admin-request-card">
            <div class="request-header">
                <div class="request-user">
                    <div class="request-name">${request.user_name}</div>
                    <div class="request-email">${request.user_email}</div>
                </div>
                <div class="request-date">${new Date(request.created_at).toLocaleDateString()}</div>
            </div>
            
            <div class="request-actions">
                <button class="approve-btn" onclick="approveAdminRequest('${request.user_id}')">✓ Approve</button>
                <button class="reject-btn" onclick="rejectAdminRequest('${request.user_id}')">✕ Reject</button>
            </div>
        </div>
    `).join('');
}

function approveAdminRequest(userId) {
    const users = JSON.parse(localStorage.getItem('click2cart_users') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (user) {
        user.is_admin = true;
        localStorage.setItem('click2cart_users', JSON.stringify(users));
        
        // Remove from requests
        allAdminRequests = allAdminRequests.filter(req => req.user_id !== userId);
        localStorage.setItem('click2cart_admin_requests', JSON.stringify(allAdminRequests));
        
        showNotification(`Admin access granted to ${user.name}!`, 'success');
        loadAdminRequests();
    }
}

function rejectAdminRequest(userId) {
    if (confirm('Are you sure you want to reject this admin request?')) {
        // Just remove from requests
        allAdminRequests = allAdminRequests.filter(req => req.user_id !== userId);
        localStorage.setItem('click2cart_admin_requests', JSON.stringify(allAdminRequests));
        
        showNotification('Admin request rejected', 'warning');
        loadAdminRequests();
    }
}

// ============ UTILITY FUNCTIONS ============

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
