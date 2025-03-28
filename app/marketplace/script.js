document.addEventListener('DOMContentLoaded', () => {
    const itemForm = document.getElementById('itemForm');
    const marketplaceListings = document.getElementById('marketplaceListings');

    // Load existing listings
    async function loadListings() {
        try {
            const response = await fetch('listings.json');
            const listings = await response.json();
            displayListings(listings);
        } catch (error) {
            console.error('Error loading listings:', error);
        }
    }

    // Display listings
    function displayListings(listings) {
        marketplaceListings.innerHTML = ''; // Clear existing listings
        listings.forEach(item => {
            const listingCard = document.createElement('div');
            listingCard.classList.add('listing-card');
            listingCard.innerHTML = `
                <h3>${item.name}</h3>
                <p>Category: ${item.category}</p>
                <p>Price: $${item.price}</p>
                <p>Description: ${item.description}</p>
                <p>Contact: ${item.contact}</p>
            `;
            marketplaceListings.appendChild(listingCard);
        });
    }

    // Add new listing
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form values
        const newItem = {
            name: document.getElementById('itemName').value,
            price: parseFloat(document.getElementById('itemPrice').value),
            category: document.getElementById('itemCategory').value,
            description: document.getElementById('itemDescription').value,
            contact: document.getElementById('sellerContact').value
        };

        try {
            // Fetch existing listings
            const response = await fetch('listings.json');
            let listings = await response.json();

            // Add new item
            listings.push(newItem);

            // Save updated listings (in a real app, this would be a backend operation)
            await saveListings(listings);

            // Refresh listings
            displayListings(listings);

            // Reset form
            itemForm.reset();
        } catch (error) {
            console.error('Error adding listing:', error);
        }
    });

    // Save listings (Note: This is a client-side simulation)
    async function saveListings(listings) {
        // In a real application, this would be a server-side API call
        localStorage.setItem('marketplaceListings', JSON.stringify(listings));
    }

    // Initial load of listings
    loadListings();
});


document.addEventListener('DOMContentLoaded', () => {
    // Dark Mode Toggle
    const modeToggle = document.createElement('button');
    modeToggle.classList.add('mode-toggle');
    modeToggle.innerHTML = '🌓 Toggle Mode';
    
    // Add to navbar
    const navbar = document.querySelector('.navbar');
    navbar.appendChild(modeToggle);

    // Check for saved mode preference
    const savedMode = localStorage.getItem('marketplaceMode');
    
    if (savedMode === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Toggle mode
    modeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // Save preference
        const currentMode = document.body.classList.contains('dark-mode') 
            ? 'dark' 
            : 'light';
        localStorage.setItem('marketplaceMode', currentMode);
    });
});