/* =========================================
   main.js — NovaCart
   Single script for all pages.
   Each section guards with an existence check
   so nothing errors on pages where the
   relevant elements don't exist.
   ========================================= */

/* =========================================
   INDEX — Product catalog + Cart
   ========================================= */
if (document.getElementById("productsGrid")) {

    let allProducts      = [];
    let filteredProducts = [];
    let cart             = JSON.parse(localStorage.getItem("novaCart")) || [];
    let currentPage      = 1;
    const productsPerPage = 10;

    /* ----- LOAD PRODUCTS ----- */
    async function loadProducts() {
        try {
            const response = await fetch(
                'https://cdn.jsdelivr.net/gh/adarshahelvar/NovaCart/products.json'
            );
            allProducts      = await response.json();
            filteredProducts = [...allProducts];
            createCategoryOptions();
            displayProducts();
            createPagination();
        } catch (error) {
            console.log(error);
            document.getElementById("productsGrid").innerHTML =
                "<h2>Failed to load products</h2>";
        }
    }

    /* ----- CATEGORY DROPDOWN ----- */
    function createCategoryOptions() {
        const categoryFilter = document.getElementById("categoryFilter");
        const categories = [...new Set(allProducts.map(p => p.category))];
        categories.forEach(category => {
            categoryFilter.innerHTML +=
                `<option value="${category}">${category}</option>`;
        });
    }

    /* ----- RENDER PRODUCT CARDS ----- */
    // addToCart(id) is called via inline onclick on each card's Add button
    function displayProducts() {
        const grid  = document.getElementById("productsGrid");
        const start = (currentPage - 1) * productsPerPage;
        const end   = start + productsPerPage;
        const page  = filteredProducts.slice(start, end);

        if (filteredProducts.length === 0) {
            grid.innerHTML = `<p class="no-results">No products found. Try a different search.</p>`;
            document.getElementById("productInfo").innerHTML = "";
            return;
        }

        grid.innerHTML = page.map(product => `
            <article class="product-card">
                <div class="image-container">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="card-content">
                    <span class="category">${product.category}</span>
                    <h3>${product.name}</h3>
                    <p class="description">${product.description}</p>
                    <div class="card-footer">
                        <span class="price">$${product.price}</span>
                        <button class="add-btn" onclick="addToCart(${product.id})">Add</button>
                    </div>
                </div>
            </article>
        `).join("");

        document.getElementById("productInfo").innerHTML = `
            Showing <span>${start + 1}</span> –
            <span>${Math.min(end, filteredProducts.length)}</span>
            of <span>${filteredProducts.length}</span> products
        `;
    }

    /* ----- PAGINATION ----- */
    function createPagination() {
        const pagination = document.getElementById("pagination");
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        pagination.innerHTML = "";

        const prevBtn = document.createElement("button");
        prevBtn.innerText = "Previous";
        prevBtn.disabled  = currentPage === 1;
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) { currentPage--; displayProducts(); createPagination(); }
        });
        pagination.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.innerText = i;
            if (i === currentPage) btn.classList.add("active");
            btn.addEventListener("click", () => {
                currentPage = i; displayProducts(); createPagination();
            });
            pagination.appendChild(btn);
        }

        const nextBtn = document.createElement("button");
        nextBtn.innerText = "Next";
        nextBtn.disabled  = currentPage === totalPages;
        nextBtn.addEventListener("click", () => {
            if (currentPage < totalPages) { currentPage++; displayProducts(); createPagination(); }
        });
        pagination.appendChild(nextBtn);
    }

    /* ----- FILTER & SORT ----- */
    document.getElementById("categoryFilter").addEventListener("change", function () {
        currentPage      = 1;
        filteredProducts = this.value === "all"
            ? [...allProducts]
            : allProducts.filter(p => p.category === this.value);
        displayProducts();
        createPagination();
    });

    document.getElementById("sortSelect").addEventListener("change", function () {
        if (this.value === "price-low")  filteredProducts.sort((a, b) => a.price - b.price);
        if (this.value === "price-high") filteredProducts.sort((a, b) => b.price - a.price);
        currentPage = 1;
        displayProducts();
        createPagination();
    });

    /* ----- CART: ADD ----- */
    function addToCart(productId) {
        const product         = allProducts.find(item => item.id === productId);
        const existingProduct = cart.find(item => item.id === productId);

        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCart();
    }

    /* ----- CART: UPDATE / RENDER ----- */
    function updateCart() {
        const cartItems    = document.getElementById("cartItems");
        const cartBadge    = document.querySelector(".cart-badge");
        const cartCount    = document.getElementById("cartCount");
        const cartSubtotal = document.getElementById("cartSubtotal");
        const cartTotal    = document.getElementById("cartTotal");
        const shippingCost = document.getElementById("shippingCost");

        cartItems.innerHTML = "";

        let total      = 0;
        let totalItems = 0;

        cart.forEach(item => {
            total      += item.price * item.quantity;
            totalItems += item.quantity;

            cartItems.innerHTML += `
                <div class="cart-item">
                    <img src="${item.image}" class="cart-item-img" alt="${item.name}">
                    <div class="cart-item-details">
                        <div class="cart-item-top">
                            <h6 class="cart-item-name">${item.name}</h6>
                            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">✕</button>
                        </div>
                        <small class="cart-item-price">$${item.price}</small>
                        <div class="cart-item-bottom">
                            <div class="qty-group">
                                <button class="qty-btn" onclick="decreaseQty(${item.id})">−</button>
                                <span class="qty-display">${item.quantity}</span>
                                <button class="qty-btn" onclick="increaseQty(${item.id})">+</button>
                            </div>
                            <span class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        cartBadge.innerText    = totalItems;
        cartCount.innerText    = totalItems + " items";
        cartSubtotal.innerText = "$" + total.toFixed(2);
        shippingCost.innerText = total === 0 ? "$0.00" : "$10.00";
        cartTotal.innerText    = total === 0 ? "$0.00" : "$" + (total + 10).toFixed(2);

        // Persist cart across page refreshes
        localStorage.setItem("novaCart", JSON.stringify(cart));
    }

    /* ----- CART SIDEBAR OPEN / CLOSE (plain JS, no Bootstrap) ----- */
    window.openCart = function () {
        document.getElementById("cartSidebar").classList.add("cart-sidebar--open");
        document.getElementById("cartOverlay").classList.add("cart-overlay--visible");
    };

    window.closeCart = function () {
        document.getElementById("cartSidebar").classList.remove("cart-sidebar--open");
        document.getElementById("cartOverlay").classList.remove("cart-overlay--visible");
    };

    /* ----- CART: QUANTITY ----- */
    function increaseQty(id) {
        const item = cart.find(p => p.id === id);
        item.quantity++;
        updateCart();
    }

    function decreaseQty(id) {
        const item = cart.find(p => p.id === id);
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            cart = cart.filter(p => p.id !== id);
        }
        updateCart();
    }

    /* ----- CART: REMOVE & CLEAR ----- */
    function removeFromCart(id) {
        cart = cart.filter(p => p.id !== id);
        updateCart();
    }

    // clearCart() is called from onclick in the sidebar HTML — must be on window
    window.clearCart = function () {
        cart = [];
        updateCart();
    };

    // Expose cart functions used in inline onclicks inside cartItems innerHTML
    window.addToCart      = addToCart;
    window.increaseQty    = increaseQty;
    window.decreaseQty    = decreaseQty;
    window.removeFromCart = removeFromCart;

    // Load products into the grid
    loadProducts();

    // Restore saved cart from localStorage immediately — no need to wait for products
    updateCart();

    /* ----- SEARCH — toggles dropdown, filters product grid live ----- */
    const searchBtn   = document.getElementById("searchBtn");
    const searchBox   = document.getElementById("searchBox");
    const searchInput = document.getElementById("searchInput");

    // Toggle dropdown open/closed on button click
    searchBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        searchBox.classList.toggle("active");
        if (searchBox.classList.contains("active")) searchInput.focus();
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
        if (!searchBox.contains(e.target) && e.target !== searchBtn) {
            searchBox.classList.remove("active");
        }
    });

    // Filter the product grid live as the user types
    searchInput.addEventListener("input", function () {
        const query = this.value.trim().toLowerCase();
        currentPage = 1;

        if (!query) {
            const activeCategory = document.getElementById("categoryFilter").value;
            filteredProducts = activeCategory === "all"
                ? [...allProducts]
                : allProducts.filter(p => p.category === activeCategory);
        } else {
            filteredProducts = allProducts.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
        }

        displayProducts();
        createPagination();
    });

}

/* =========================================
   LOGIN — Form validation
   ========================================= */
if (document.getElementById("loginForm")) {

    document.getElementById("loginForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const email    = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        document.getElementById("emailError").innerHTML    = "";
        document.getElementById("passwordError").innerHTML = "";

        let valid = true;
        const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;

        if (!email) {
            document.getElementById("emailError").innerHTML = "Email is required";
            valid = false;
        } else if (!email.match(emailPattern)) {
            document.getElementById("emailError").innerHTML = "Enter a valid email";
            valid = false;
        }

        if (!password) {
            document.getElementById("passwordError").innerHTML = "Password is required";
            valid = false;
        } else if (password.length < 8) {
            document.getElementById("passwordError").innerHTML =
                "Password must be at least 8 characters";
            valid = false;
        }

        if (valid) {
            alert("Login Successful");
            this.reset();
        }
    });
}

/* =========================================
   REGISTRATION — Form validation & storage
   ========================================= */
if (document.getElementById("registerForm")) {

    document.getElementById("registerForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const name            = document.getElementById("name").value.trim();
        const email           = document.getElementById("email").value.trim();
        const password        = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();
        const terms           = document.getElementById("terms").checked;

        ["nameError", "emailError", "passwordError", "confirmPasswordError", "termsError"]
            .forEach(id => document.getElementById(id).innerHTML = "");

        let valid = true;
        const emailPattern    = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!name) {
            document.getElementById("nameError").innerHTML = "Full name is required";
            valid = false;
        }

        if (!email) {
            document.getElementById("emailError").innerHTML = "Email is required";
            valid = false;
        } else if (!email.match(emailPattern)) {
            document.getElementById("emailError").innerHTML = "Enter a valid email";
            valid = false;
        }

        if (!password) {
            document.getElementById("passwordError").innerHTML = "Password is required";
            valid = false;
        } else if (!password.match(passwordPattern)) {
            document.getElementById("passwordError").innerHTML =
                "Password must contain uppercase, lowercase, number and symbol";
            valid = false;
        }

        if (!confirmPassword) {
            document.getElementById("confirmPasswordError").innerHTML = "Confirm your password";
            valid = false;
        } else if (password !== confirmPassword) {
            document.getElementById("confirmPasswordError").innerHTML = "Passwords do not match";
            valid = false;
        }

        if (!terms) {
            document.getElementById("termsError").innerHTML =
                "Please accept terms and conditions";
            valid = false;
        }

        if (valid) {
            localStorage.setItem("user", JSON.stringify({ name, email, password }));
            alert("Account Created Successfully");
            this.reset();
        }
    });
}
