// Cart functionality using localStorage
const CART_KEY = 'textile-shop-cart';

// Initialize cart if it doesn't exist
function initCart() {
    if (!localStorage.getItem(CART_KEY)) {
        localStorage.setItem(CART_KEY, JSON.stringify([]));
    }
}

// Get current cart items
function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

// Add item to cart
function addToCart(productId, quantity = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            quantity: quantity,
            addedAt: new Date().toISOString()
        });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartDisplay();
}

// Remove item from cart
function removeFromCart(productId) {
    const cart = getCart().filter(item => item.id !== productId);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartDisplay();
}

// Update item quantity in cart
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity = newQuantity;
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartDisplay();
    }
}

// Get product data by ID
function getProductById(productId) {
    const shops = JSON.parse(localStorage.getItem('shops-data')) || [];
    for (const shop of shops) {
        const product = shop.products.find(p => p.id == productId);
        if (product) return product;
    }
    return null;
}

// Update cart display on page
function updateCartDisplay() {
    const cartItems = getCart();
    const cartTable = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const taxEl = document.getElementById('cart-tax');
    const totalEl = document.getElementById('cart-total');
    
    if (cartTable) {
        const tbody = cartTable.querySelector('tbody');
        tbody.innerHTML = '';
        let subtotal = 0;

        cartItems.forEach(item => {
            const product = getProductById(item.id);
            const price = product ? product.price : 0;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product ? product.name : `Product ${item.id}`}</td>
                <td>₹${price.toFixed(2)}</td>
                <td>
                    <input type="number" value="${item.quantity}" min="1" 
                           onchange="updateQuantity('${item.id}', this.value)">
                </td>
                <td>₹${itemTotal.toFixed(2)}</td>
                <td>
                    <button onclick="removeFromCart('${item.id}')">Remove</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Calculate totals
        if (subtotalEl && taxEl && totalEl) {
            const tax = subtotal * 0.18; // 18% GST
            const total = subtotal + tax;
            
            subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
            taxEl.textContent = `₹${tax.toFixed(2)}`;
            totalEl.textContent = `₹${total.toFixed(2)}`;
        }
    }

    // Update cart counter in navigation
    if (typeof updateCartCounter === 'function') {
        updateCartCounter();
    }
}

// Load shop data and initialize cart
function loadShopData() {
    fetch('data/shops.json')
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('shops-data', JSON.stringify(data.shops));
            updateCartDisplay();
        })
        .catch(error => console.error('Error loading shop data:', error));
}

// Handle checkout
function handleCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // In a real app, this would process payment
    alert('Order placed successfully!');
    localStorage.setItem(CART_KEY, JSON.stringify([]));
    updateCartDisplay();
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initCart();
    loadShopData();

    // Initialize location button for cart page
    const useLocationBtn = document.getElementById('use-location-btn');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', function() {
            if (typeof fetchUserLocation === 'function') {
                fetchUserLocation();
            }
        });
    }

    // Initialize checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
});
