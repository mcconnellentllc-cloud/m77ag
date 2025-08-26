// dashboard.js - Handle dashboard data loading and display

// Format currency values
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        // Get admin token from storage
        const token = localStorage.getItem('adminToken');
        
        // Fetch dashboard data from API
        const response = await fetch('/api/analytics', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Check if request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Parse response data
        const data = await response.json();
        
        // Update dashboard cards with data
        document.getElementById('totalProposals').textContent = data.totalProposals || 0;
        document.getElementById('pendingProposals').textContent = data.pendingProposals || 0;
        document.getElementById('approvedProposals').textContent = data.approvedProposals || 0;
        document.getElementById('totalRevenue').textContent = formatCurrency(data.totalRevenue || 0);
        
        // Display recent activity
        if (data.recentActivity && data.recentActivity.length > 0) {
            displayRecentActivity(data.recentActivity);
        } else {
            displayNoActivityMessage();
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        displayErrorMessage('Failed to load dashboard data. Please try again later.');
    }
}

// Display recent activity items
function displayRecentActivity(activities) {
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = ''; // Clear existing content
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        // Format date
        const activityDate = new Date(activity.timestamp);
        const formattedDate = activityDate.toLocaleDateString() + ' ' + 
                              activityDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Create activity content based on type
        activityItem.innerHTML = `
            <div class="activity-content">
                <p class="activity-text">${activity.description}</p>
                <p class="activity-meta">${activity.user || 'System'} • ${formattedDate}</p>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

// Display message when no activity is found
function displayNoActivityMessage() {
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '<p class="no-activity">No recent activity to display</p>';
}

// Display error message
function displayErrorMessage(message) {
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = `<p class="error-message">${message}</p>`;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Load dashboard statistics
    loadDashboardStats();
});