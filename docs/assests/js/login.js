// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

// API URL
const API_URL = '/api'; // Relative URL for production

// Login form submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Clear previous error messages
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    
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
        document.getElementById('login-button').disabled = true;
        document.getElementById('login-button').textContent = 'Logging in...';
        
        // Send login request
        const response = await fetch(`${API_URL}/auth/login`, {
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
            localStorage.setItem('m77ag_token', data.token);
            localStorage.setItem('m77ag_user', JSON.stringify(data.user));
            
            // Redirect based on user role
            if (data.user.isAdmin) {
                window.location.href = '/admin/dashboard.html';
            } else {
                window.location.href = '/account/dashboard.html';
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
        document.getElementById('login-button').disabled = false;
        document.getElementById('login-button').textContent = 'Log In';
    }
});

// Function to display error messages
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('m77ag_token');
    const user = JSON.parse(localStorage.getItem('m77ag_user') || 'null');
    
    // If user is already logged in, redirect to appropriate dashboard
    if (token && user) {
        if (user.isAdmin) {
            window.location.href = '/admin/dashboard.html';
        } else {
            window.location.href = '/account/dashboard.html';
        }
    }
});