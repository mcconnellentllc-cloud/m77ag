// auth.js - Handle authentication for admin dashboard

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
        // Redirect to login page if no token found
        window.location.href = 'account/login.html';
        return false;
    }
    
    // Update admin name if available
    const adminName = localStorage.getItem('adminName') || 'Admin';
    document.getElementById('admin-name').textContent = adminName;
    
    return true;
}

// Handle logout
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Clear authentication data
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminName');
            
            // Redirect to login page
            window.location.href = 'account/login.html';
        });
    }
}

// Initialize authentication checks
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    if (checkAuth()) {
        // Setup logout functionality
        setupLogout();
    }
});