// DOM Elements - use the actual IDs from your HTML
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const alertBox = document.getElementById('alert');

// Login form submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Clear previous error messages
    alertBox.className = 'hidden';
    
    // Get form values
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Basic validation
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Signing in...';
        submitButton.disabled = true;
        
        // Send login request
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        // Check if login was successful
        if (response.ok && data.token) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            
            // Redirect based on user role
            if (data.user.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/account/dashboard';
            }
        } else {
            // Display error message
            showError(data.message || 'Invalid email or password. For demo, use: demo@m77ag.com / password123');
        }
    } catch (error) {
        showError('Server error. Please try again later.');
        console.error('Login error:', error);
    } finally {
        // Reset button state
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.textContent = 'Login';
        submitButton.disabled = false;
    }
});

// Function to display error messages
function showError(message) {
    alertBox.className = 'mb-4 p-4 bg-red-900 text-red-100 rounded-md';
    alertBox.textContent = message;
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    if (token) {
        // Verify token validity
        fetch('/api/auth/check', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                if (data.isAdmin) {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/account/dashboard';
                }
            }
        })
        .catch(error => {
            console.error('Auth check error:', error);
            // If token verification fails, clear storage
            localStorage.removeItem('token');
        });
    }
});

// Demo button functionality
const demoBtn = document.getElementById('demoBtn');
if (demoBtn) {
    demoBtn.addEventListener('click', function() {
        document.getElementById('email').value = 'demo@m77ag.com';
        document.getElementById('password').value = 'password123';
    });
}