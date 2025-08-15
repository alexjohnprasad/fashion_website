// Main application script
document.addEventListener('DOMContentLoaded', function() {
    // Check if location is set
    const userLocation = localStorage.getItem('userLocation');
    const locationModal = document.getElementById('location-modal');
    const mainContent = document.getElementById('main-content');

    if (userLocation) {
        if (locationModal) locationModal.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
    } else {
        // Show the location modal and button, do not auto-fetch
        const autoLocationBtn = document.getElementById('auto-location-btn');
        if (autoLocationBtn) autoLocationBtn.style.display = '';
        const status = document.getElementById('location-fetch-status');
        if (status) status.textContent = 'Click the button below to use your current location.';
        if (locationModal) locationModal.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
    }

    // Initialize navigation
    initNavigation();

    // Initialize cart counter
    updateCartCounter();

    // Load featured products on homepage
    if (document.getElementById('featured-products')) {
        loadFeaturedProducts();
    }

    // Initialize location buttons
    const autoLocationBtn = document.getElementById('auto-location-btn');
    if (autoLocationBtn) {
        autoLocationBtn.addEventListener('click', function() {
            if (typeof fetchUserLocation === 'function') {
                fetchUserLocation();
            }
        });
    }

    // Initialize address submission
    const submitAddressBtn = document.getElementById('submit-address-btn');
    if (submitAddressBtn) {
        submitAddressBtn.addEventListener('click', saveManualLocation);
    }
});

function initNavigation() {
    // Mobile navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            document.querySelector('nav ul').classList.toggle('active');
        });
    }
}

function loadFeaturedProducts() {
    // Use relative path from root to avoid CORS issues
    fetch('/data/shops.json')
        .then(response => response.json())
        .then(data => {
            const featuredContainer = document.getElementById('featured-products');
            if (!featuredContainer) return;

            // Get 6 random featured products
            const allProducts = data.shops.flatMap(shop => shop.products);
            const featuredProducts = allProducts
                .sort(() => 0.5 - Math.random())
                .slice(0, 6);

            featuredProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <img src="images/${product.image}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>$${(product.price / 100).toFixed(2)}</p>
                    <div class="product-actions">
                        <button onclick="addToCart(${product.id})">Add to Cart</button>
                    </div>
                `;
                featuredContainer.appendChild(productCard);
            });
        })
        .catch(error => console.error('Error loading products:', error));
}

function saveManualLocation() {
    const address = document.getElementById('address-input').value;
    const city = document.getElementById('city-input').value;
    const zip = document.getElementById('zip-input').value;

    if (!address || !city || !zip) {
        alert('Please fill in all address fields');
        return;
    }

    const location = {
        type: 'manual',
        address: `${address}, ${city}, ${zip}`
    };

    localStorage.setItem('userLocation', JSON.stringify(location));
    document.getElementById('location-modal').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
}

// Update cart counter from localStorage
function updateCartCounter() {
    const cartCounter = document.getElementById('cart-counter');
    if (cartCounter) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cartCounter.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    }
}

// Utility function to show/hide elements
function toggleElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}
