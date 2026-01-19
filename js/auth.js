// Check if user is logged in
function isAuthenticated() {
    return localStorage.getItem('authToken') !== null;
}

// Get current user from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Handle Registration
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            position: document.getElementById('position').value.trim(),
            companyCode: document.getElementById('companyCode').value.trim(),
            password: document.getElementById('password').value
        };

        const errorDiv = document.getElementById('errorMessage');
        errorDiv.classList.remove('show');
        errorDiv.textContent = '';

        try {
            const response = await fetch(API_ENDPOINTS.register, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Registration successful
                // alert('Registration successful! Redirecting to login...');
                window.location.href = 'login.html';
            } else {
                // Show error
                errorDiv.textContent = data.detail || 'Registration failed. Please try again.';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            errorDiv.textContent = 'Network error. Please check your connection.';
            errorDiv.classList.add('show');
        }
    });
}

// Load saved email and password if Remember Me was checked
if (document.getElementById('email') && localStorage.getItem('rememberedEmail')) {
    document.getElementById('email').value = localStorage.getItem('rememberedEmail');
    if (document.getElementById('password') && localStorage.getItem('rememberedPassword')) {
        document.getElementById('password').value = localStorage.getItem('rememberedPassword');
    }
    if (document.getElementById('rememberMe')) {
        document.getElementById('rememberMe').checked = true;
    }
}

// Handle Login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const rememberMeCheckbox = document.getElementById('rememberMe');
        
        const formData = {
            email: emailInput.value.trim(),
            password: passwordInput.value
        };

        const errorDiv = document.getElementById('errorMessage');
        errorDiv.classList.remove('show');
        errorDiv.textContent = '';

        try {
            const response = await fetch(API_ENDPOINTS.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Handle Remember Me - save both email and password
                if (rememberMeCheckbox && rememberMeCheckbox.checked) {
                    localStorage.setItem('rememberedEmail', formData.email);
                    localStorage.setItem('rememberedPassword', formData.password);
                } else {
                    localStorage.removeItem('rememberedEmail');
                    localStorage.removeItem('rememberedPassword');
                }
                
                // Store token and user data
                localStorage.setItem('authToken', data.token || 'demo_token');
                setCurrentUser(data.user);
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Show error
                errorDiv.textContent = data.detail || 'Login failed. Please check your credentials.';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            errorDiv.textContent = 'Network error. Please check your connection.';
            errorDiv.classList.add('show');
        }
    });
}

// Handle Logout
if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await fetch(API_ENDPOINTS.logout, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage and redirect
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    });
}

// Protect dashboard route
if (window.location.pathname.includes('dashboard.html')) {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

