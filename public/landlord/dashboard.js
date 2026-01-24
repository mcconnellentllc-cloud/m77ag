// Auth check
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');

if (!token || !userStr) {
    window.location.href = '/landlord/login.html';
}

const user = JSON.parse(userStr);

// API helper
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const response = await fetch(endpoint, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/landlord/login.html';
        }
        throw new Error(data.message || 'API call failed');
    }

    return data;
}

// Show alert
function showAlert(message, type = 'info') {
    const alertDiv = document.getElementById('alert');
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.display = 'block';

    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/landlord/login.html';
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format number
function formatNumber(num, decimals = 2) {
    return Number(num).toFixed(decimals);
}

// Load dashboard data
async function loadDashboard() {
    try {
        // Update user info in header
        document.getElementById('userInfo').textContent = user.name || user.email;

        // Load landlord preferences
        await loadPreferences();

        // Load financial summary
        await loadFinancialSummary();

        // Load properties and fields
        await loadProperties();

        // Load transactions
        await loadTransactions();

        // Load market prices
        await loadMarketPrices();

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Error loading dashboard data', 'error');
    }
}

// Load landlord preferences
async function loadPreferences() {
    try {
        const data = await apiCall('/api/landlord/preferences');

        if (data.success && data.preferences) {
            const prefs = data.preferences;

            // Grain prices
            if (prefs.grainSalePrice) {
                document.getElementById('cornPrice').value = prefs.grainSalePrice.corn || '';
                document.getElementById('soybeansPrice').value = prefs.grainSalePrice.soybeans || '';
                document.getElementById('wheatPrice').value = prefs.grainSalePrice.wheat || '';
                document.getElementById('miloPrice').value = prefs.grainSalePrice.milo || '';
            }

            // Payment preferences
            document.getElementById('paymentTiming').value = prefs.paymentTiming || 'after_harvest';
            document.getElementById('paymentMethod').value = prefs.paymentMethod || 'check';
            document.getElementById('specialInstructions').value = prefs.specialInstructions || '';

            if (prefs.customPaymentDate) {
                document.getElementById('customPaymentDate').value = prefs.customPaymentDate.split('T')[0];
            }

            // Show custom date field if needed
            if (prefs.paymentTiming === 'custom') {
                document.getElementById('customDateGroup').style.display = 'block';
            }

            // Show ACH section if ACH is selected
            if (prefs.paymentMethod === 'ach') {
                document.getElementById('achSection').style.display = 'block';

                // Check if ACH is already connected
                if (prefs.stripeCustomerId && prefs.stripeBankAccountId) {
                    document.getElementById('achSetupForm').style.display = 'none';
                    document.getElementById('achConnected').style.display = 'block';
                    document.getElementById('connectedAccount').textContent = 'Bank account ending in ****';
                }
            }
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

// Load financial summary (running bill)
async function loadFinancialSummary() {
    try {
        const data = await apiCall('/api/landlord/financial-summary');

        if (data.success && data.summary) {
            const summary = data.summary;

            // Update stats
            document.getElementById('totalAcres').textContent = formatNumber(summary.totalAcres, 2);
            document.getElementById('totalFields').textContent = summary.totalFields;

            // Running bill calculation
            const rentOwed = summary.rentOwed || 0;
            const expensesOwed = summary.expensesOwed || 0;
            const incomeOwed = summary.incomeOwed || 0;

            // Net balance: positive = owed to landlord, negative = owed to M77 AG
            const netBalance = (rentOwed + incomeOwed) - expensesOwed;

            document.getElementById('rentOwed').textContent = formatCurrency(netBalance);
            document.getElementById('ytdIncome').textContent = formatCurrency(summary.ytdIncome || 0);

            // Change color based on balance
            const rentOwedEl = document.getElementById('rentOwed');
            if (netBalance >= 0) {
                rentOwedEl.style.color = '#2c5f2d'; // Green - money owed to landlord
            } else {
                rentOwedEl.style.color = '#d9534f'; // Red - money owed to M77 AG
            }
        }
    } catch (error) {
        console.error('Error loading financial summary:', error);
    }
}

// Load properties and fields with crop data
async function loadProperties() {
    try {
        const data = await apiCall('/api/landlord/properties');

        const container = document.getElementById('propertiesList');

        if (data.success && data.properties && data.properties.length > 0) {
            let html = '';

            for (const property of data.properties) {
                html += `
                    <div style="margin-bottom: 2rem; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1.5rem;">
                        <h3 style="color: #2c5f2d; margin-bottom: 1rem;">${property.name}</h3>
                        <p style="color: #666; margin-bottom: 1rem;">
                            Total Acres: ${formatNumber(property.totalAcres, 2)} |
                            Fields: ${property.fields ? property.fields.length : 0}
                        </p>

                        ${property.fields && property.fields.length > 0 ? `
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Acres</th>
                                        <th>Current Crop</th>
                                        <th>Projected Yield</th>
                                        <th>Break-Even</th>
                                        <th>Profit/Loss per Acre</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${property.fields.map(field => `
                                        <tr>
                                            <td><strong>${field.name}</strong></td>
                                            <td>${formatNumber(field.acres, 2)}</td>
                                            <td>
                                                <span class="badge" style="background: ${getCropColor(field.currentCrop?.cropType)}; color: white;">
                                                    ${field.currentCrop?.cropType || 'No crop'}
                                                </span>
                                            </td>
                                            <td>${field.currentCrop?.estimatedYield ? formatNumber(field.currentCrop.estimatedYield, 2) + ' bu' : 'TBD'}</td>
                                            <td>${field.financials?.breakEvenPerAcre ? formatCurrency(field.financials.breakEvenPerAcre) : 'TBD'}</td>
                                            <td style="color: ${(field.financials?.profitPerAcre || 0) >= 0 ? '#2c5f2d' : '#d9534f'}">
                                                ${field.financials?.profitPerAcre ? formatCurrency(field.financials.profitPerAcre) : 'TBD'}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p style="color: #666;">No fields assigned yet</p>'}
                    </div>
                `;
            }

            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #666; text-align: center;">No properties assigned yet. Contact M77 AG for assistance.</p>';
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        document.getElementById('propertiesList').innerHTML = '<p style="color: #d9534f;">Error loading properties</p>';
    }
}

// Load recent transactions
async function loadTransactions() {
    try {
        const data = await apiCall('/api/landlord/transactions');

        const container = document.getElementById('transactionsList');

        if (data.success && data.transactions && data.transactions.length > 0) {
            let html = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Balance Impact</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            for (const txn of data.transactions) {
                const isIncome = txn.type === 'income' || txn.type === 'rent_payment';
                const balanceImpact = isIncome ? 'Owed to You' : 'You Owe';

                html += `
                    <tr>
                        <td>${new Date(txn.date).toLocaleDateString()}</td>
                        <td>${txn.description}</td>
                        <td>
                            <span class="badge ${isIncome ? 'badge-success' : 'badge-warning'}">
                                ${txn.type}
                            </span>
                        </td>
                        <td style="color: ${isIncome ? '#2c5f2d' : '#d9534f'}">
                            ${isIncome ? '+' : '-'}${formatCurrency(Math.abs(txn.amount))}
                        </td>
                        <td>${balanceImpact}</td>
                    </tr>
                `;
            }

            html += `
                    </tbody>
                </table>
            `;

            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #666; text-align: center;">No transactions yet</p>';
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionsList').innerHTML = '<p style="color: #d9534f;">Error loading transactions</p>';
    }
}

// Load market prices (mock data for now)
async function loadMarketPrices() {
    // TODO: Integrate with real market data API
    document.getElementById('cornMarket').textContent = '$4.25';
    document.getElementById('soybeansMarket').textContent = '$11.00';
    document.getElementById('wheatMarket').textContent = '$5.75';
    document.getElementById('miloMarket').textContent = '$3.85';
}

// Get crop color
function getCropColor(crop) {
    const colors = {
        'corn': '#f39c12',
        'soybeans': '#27ae60',
        'wheat': '#e67e22',
        'milo': '#d35400',
        'sunflower': '#f1c40f',
        'fallow': '#95a5a6'
    };
    return colors[crop] || '#7f8c8d';
}

// Form submissions
document.getElementById('grainPriceForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const grainPrices = {
            corn: parseFloat(document.getElementById('cornPrice').value) || null,
            soybeans: parseFloat(document.getElementById('soybeansPrice').value) || null,
            wheat: parseFloat(document.getElementById('wheatPrice').value) || null,
            milo: parseFloat(document.getElementById('miloPrice').value) || null
        };

        await apiCall('/api/landlord/preferences', {
            method: 'PUT',
            body: JSON.stringify({ grainSalePrice: grainPrices })
        });

        showAlert('Grain price preferences saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving grain prices:', error);
        showAlert('Error saving grain prices', 'error');
    }
});

document.getElementById('paymentPrefForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const paymentPrefs = {
            paymentTiming: document.getElementById('paymentTiming').value,
            customPaymentDate: document.getElementById('customPaymentDate').value || null,
            paymentMethod: document.getElementById('paymentMethod').value,
            specialInstructions: document.getElementById('specialInstructions').value || null
        };

        await apiCall('/api/landlord/preferences', {
            method: 'PUT',
            body: JSON.stringify(paymentPrefs)
        });

        showAlert('Payment preferences saved successfully!', 'success');

        // Reload preferences to update UI
        await loadPreferences();
    } catch (error) {
        console.error('Error saving payment preferences:', error);
        showAlert('Error saving payment preferences', 'error');
    }
});

// Payment timing change handler
document.getElementById('paymentTiming').addEventListener('change', (e) => {
    const customDateGroup = document.getElementById('customDateGroup');
    if (e.target.value === 'custom') {
        customDateGroup.style.display = 'block';
    } else {
        customDateGroup.style.display = 'none';
    }
});

// Payment method change handler
document.getElementById('paymentMethod').addEventListener('change', (e) => {
    const achSection = document.getElementById('achSection');
    if (e.target.value === 'ach') {
        achSection.style.display = 'block';
    } else {
        achSection.style.display = 'none';
    }
});

// Initialize dashboard
window.addEventListener('DOMContentLoaded', loadDashboard);

// Refresh dashboard every 30 seconds
setInterval(() => {
    loadFinancialSummary();
    loadProperties();
}, 30000);
