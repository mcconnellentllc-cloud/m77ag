// Auth functions for M77 AG website

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Get current user
function getCurrentUser() {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Update UI based on auth status
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!loginBtn || !registerBtn || !logoutBtn) return;
    
    if (isLoggedIn()) {
        loginBtn.classList.add('d-none');
        registerBtn.classList.add('d-none');
        logoutBtn.classList.remove('d-none');
    } else {
        loginBtn.classList.remove('d-none');
        registerBtn.classList.remove('d-none');
        logoutBtn.classList.add('d-none');
    }
}

// Logout function
function logout() {
    const token = localStorage.getItem('token');
    
    if (token) {
        // Call logout API
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(() => {
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to homepage
            window.location.href = '/';
        })
        .catch(error => {
            console.error('Logout error:', error);
            
            // Even if API call fails, clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            window.location.href = '/';
        });
    }
}

// Initialize auth functionality
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    
    // Add logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Add auth-required protection
    const authRequiredElements = document.querySelectorAll('[data-auth-required]');
    if (authRequiredElements.length > 0 && !isLoggedIn()) {
        alert('You must be logged in to access this page.');
        window.location.href = '/account/login.html';
    }
    
    // Add admin-only protection
    const adminOnlyElements = document.querySelectorAll('[data-admin-only]');
    if (adminOnlyElements.length > 0 && !isAdmin()) {
        alert('You must be an administrator to access this page.');
        window.location.href = '/';
    }
});