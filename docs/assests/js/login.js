document.addEventListener('DOMContentLoaded', function() {
    console.log('Login script loaded');
    
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const alertBox = document.getElementById('alert');
    const loginButton = document.getElementById('login-button');
    
    // Handle login form submission
    if (loginForm) {
        console.log('Login form found, attaching event listener');
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Login form submitted');
            
            // Get form values
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            // Clear previous error messages
            alertBox.className = 'hidden';
            
            // Demo account handling (client-side for backward compatibility)
            if (email === 'demo@m77ag.com' && password === 'password123') {
                console.log('Demo login successful');
                localStorage.setItem('token', 'demo-token');
                localStorage.setItem('userRole', 'user');
                window.location.href = '/account/dashboard.html';
                return;
            }
            
            try {
                // Show loading state
                loginButton.textContent = 'Signing in...';
                loginButton.disabled = true;
                
                console.log('Sending login request to server');
                
                // Send login request to backend
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                console.log('Server response:', data);
                
                if (response.ok && data.token) {
                    // Store auth data
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userRole', data.user.role);
                    
                    // Redirect based on role
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/account/dashboard.html';
                    }
                } else {
                    // Show error message
                    showError(data.message || 'Invalid email or password');
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Server error. Please try again later.');
            } finally {
                // Reset button state
                loginButton.textContent = 'Log In';
                loginButton.disabled = false;
            }
        });
    } else {
        console.error('Login form not found!');
    }
    
    // Demo button functionality
    const demoBtn = document.getElementById('demoBtn');
    if (demoBtn) {
        demoBtn.addEventListener('click', function() {
            emailInput.value = 'demo@m77ag.com';
            passwordInput.value = 'password123';
        });
    }
    
    // Function to display error messages
    function showError(message) {
        alertBox.textContent = message;
        alertBox.className = 'mb-4 p-4 bg-red-900 text-red-100 rounded-md';
    }
});