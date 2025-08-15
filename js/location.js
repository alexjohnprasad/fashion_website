// Location services for finding nearby shops
function fetchUserLocation() {
    console.log('Attempting to fetch user location...');
    if (!navigator.geolocation) {
        const errorMsg = "Geolocation is not supported by your browser";
        console.error(errorMsg);
        showLocationError(errorMsg);
        return;
    }

    const locationBtn = document.getElementById('location-btn');
    if (locationBtn) {
        locationBtn.disabled = true;
        locationBtn.textContent = 'Locating...';
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            console.log('Exact Location Coordinates:');
            console.log(`Latitude: ${latitude}`);
            console.log(`Longitude: ${longitude}`);
            console.log('Google Maps Link:');
            console.log(`https://www.google.com/maps?q=${latitude},${longitude}`);
            // Show coordinates in the modal
            const status = document.getElementById('location-fetch-status');
            if (status) {
                status.innerHTML = `<span style='color:green;'>Location detected!</span><br>Latitude: <b>${latitude}</b><br>Longitude: <b>${longitude}</b>`;
            }
            // Optionally, you can keep the modal open for a few seconds, then hide it automatically:
            // setTimeout(() => {
            //     const locationModal = document.getElementById('location-modal');
            //     const mainContent = document.getElementById('main-content');
            //     if (locationModal) locationModal.style.display = 'none';
            //     if (mainContent) mainContent.style.display = 'block';
            // }, 2000);
            showNearbyShops(latitude, longitude);
            if (locationBtn) {
                locationBtn.textContent = 'Location Found';
            }
        },
        error => {
            console.error('Location error:', error);
            handleLocationError(error);
            if (locationBtn) {
                locationBtn.disabled = false;
                locationBtn.textContent = 'Try Again';
            }
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function showNearbyShops(latitude, longitude) {
    console.log('Finding shops near:', { latitude, longitude });
    // Save location to localStorage
    localStorage.setItem('userLocation', JSON.stringify({
        type: 'auto',
        coordinates: { latitude, longitude }
    }));

    // Use relative path from root to avoid CORS issues
    fetch('/data/shops.json')
        .then(response => response.json())
        .then(data => {
            const maxDistance = document.getElementById('distance-filter')?.value || 10;
            const shopsContainer = document.getElementById('nearby-shops');
            const productsGrid = document.getElementById('products-grid');

            if (!shopsContainer || !productsGrid) return;

            // Clear previous results
            shopsContainer.innerHTML = '<h3>Nearby Shops</h3>';
            productsGrid.innerHTML = '';

            // Calculate distances and filter shops
            const nearbyShops = data.shops.map(shop => {
                const distance = calculateDistance(
                    latitude,
                    longitude,
                    shop.latitude,
                    shop.longitude
                );
                console.log(`Shop: ${shop.name}, Distance: ${distance.toFixed(1)} km`);
                return { ...shop, distance };
            }).filter(shop => shop.distance <= maxDistance)
              .sort((a, b) => a.distance - b.distance);

            console.log(`Found ${nearbyShops.length} shops within ${maxDistance} km`);

            if (nearbyShops.length === 0) {
                showLocationError('No shops found within your selected distance');
                return;
            }

            // Display nearby shops
            nearbyShops.forEach(shop => {
                const shopElement = document.createElement('div');
                shopElement.className = 'shop-card';
                shopElement.innerHTML = `
                    <h4>${shop.name}</h4>
                    <p>${shop.address}</p>
                    <p class="distance">${shop.distance.toFixed(1)} km away</p>
                `;
                shopsContainer.appendChild(shopElement);

                // Display products from this shop
                shop.products.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card';
                    productCard.innerHTML = `
                        <img src="images/${product.image}" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <p>$${(product.price / 100).toFixed(2)}</p>
                        <p class="shop-name">${shop.name}</p>
                        <div class="product-actions">
                            <button onclick="addToCart(${product.id})">Add to Cart</button>
                        </div>
                    `;
                    productsGrid.appendChild(productCard);
                });
            });
        })
        .catch(error => {
            console.error('Error loading shops:', error);
            showLocationError('Failed to load shop data');
        });
}

function handleLocationError(error) {
    let message = 'Error getting location: ';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message += "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            message += "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            message += "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            message += "An unknown error occurred.";
            break;
    }
    showLocationError(message);
}

function showLocationError(message) {
    const errorElement = document.getElementById('location-error') || 
                         document.createElement('div');
    errorElement.id = 'location-error';
    errorElement.className = 'error';
    errorElement.textContent = message;
    
    if (!document.getElementById('location-error')) {
        document.querySelector('.container').prepend(errorElement);
    }
}

// Initialize location services
document.addEventListener('DOMContentLoaded', () => {
    // Auto-fetch location if no previous location exists
    if (!localStorage.getItem('userLocation')) {
        fetchUserLocation();
    }

    // Still keep button functionality if it exists
    const locationBtn = document.getElementById('location-btn');
    if (locationBtn) {
        locationBtn.addEventListener('click', fetchUserLocation);
    }

    // Add event for sending name/location to Google Form
    const submitNameBtn = document.getElementById('submit-name-btn');
    if (submitNameBtn) {
        submitNameBtn.addEventListener('click', async () => {
            const name = document.getElementById('name-input').value.trim();
            let location = localStorage.getItem('userLocation');
            if (!name) {
                alert('Please enter your name.');
                return;
            }
            if (!location) {
                alert('Location not detected yet. Please allow location access.');
                return;
            }
            location = JSON.parse(location);
            let locString = '';
            if (location.type === 'auto' && location.coordinates) {
                locString = `${location.coordinates.latitude},${location.coordinates.longitude}`;
            } else {
                locString = 'Manual/Unknown';
            }
            // Google Form POST
            const formData = new URLSearchParams();
            formData.append('entry.540055953', locString);
            formData.append('entry.1753949979', name);
            try {
                await fetch('https://docs.google.com/forms/d/e/1FAIpQLSfRlVP-XNLl6EzimuRL_gzcS2387tN1lQj-8pRDQW92kVdGFw/formResponse', {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData.toString(),
                });
                alert('Location sent successfully!');
            } catch (e) {
                alert('Failed to send location.');
            }
        });
    }
});
