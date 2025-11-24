// API Base URL
const API_URL = window.location.origin + '/api';

// State
let currentUser = null;
let properties = [];
let fields = [];
let transactions = [];
let ledgerEntries = [];
let harvestRecords = [];
let landlords = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/farmer/login.html';
        return;
    }

    try {
        // Load user info
        await loadCurrentUser();

        // Check if user is farmer or admin
        if (currentUser.role !== 'farmer' && currentUser.role !== 'admin') {
            alert('Access denied. This dashboard is for farmers only.');
            logout();
            return;
        }

        // Load initial data
        await Promise.all([
            loadProperties(),
            loadFields(),
            loadTransactions(),
            loadLedger(),
            loadHarvest(),
            loadLandlords()
        ]);

        // Setup navigation
        setupNavigation();

        // Render overview
        renderOverview();

    } catch (error) {
        console.error('Initialization error:', error);
        if (error.message.includes('401') || error.message.includes('Authentication')) {
            logout();
        } else {
            showAlert('Error loading dashboard: ' + error.message, 'error');
        }
    }
});

// API Functions
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Authentication failed');
        }
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

// Load Data Functions
async function loadCurrentUser() {
    const data = await apiCall('/auth/me');
    currentUser = data.user;
    document.getElementById('userName').textContent = currentUser.username;
}

async function loadProperties() {
    const data = await apiCall('/properties');
    properties = data.properties || [];
    renderPropertiesList();
}

async function loadFields() {
    const data = await apiCall('/fields');
    fields = data.fields || [];
    renderFieldsList();
}

async function loadTransactions() {
    const data = await apiCall('/transactions');
    transactions = data.transactions || [];
    renderTransactionsList();
}

async function loadLedger() {
    const data = await apiCall('/ledger');
    ledgerEntries = data.entries || [];
    renderLedgerList();
}

async function loadHarvest() {
    const data = await apiCall('/harvest');
    harvestRecords = data.harvestRecords || [];
    renderHarvestList();
}

async function loadLandlords() {
    // Get unique landlords from properties
    const landlordIds = [...new Set(properties.map(p => p.landlord?._id).filter(Boolean))];
    landlords = properties
        .map(p => p.landlord)
        .filter((l, i, arr) => l && arr.findIndex(x => x._id === l._id) === i);
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });
}

function switchView(viewName) {
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    // Update view active state
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(viewName).classList.add('active');

    // Refresh view data if needed
    if (viewName === 'analytics') {
        renderAnalytics();
    }
}

// Render Functions
function renderOverview() {
    // Calculate stats
    const totalAcres = properties.reduce((sum, p) => sum + (p.totalAcres || 0), 0);
    const activeFields = fields.filter(f => f.status === 'active').length;

    const currentYear = new Date().getFullYear();
    const ytdTransactions = transactions.filter(t => {
        const tYear = new Date(t.date).getFullYear();
        return tYear === currentYear && t.type === 'income';
    });
    const ytdRevenue = ytdTransactions.reduce((sum, t) => sum + t.amount, 0);

    document.getElementById('statTotalProperties').textContent = properties.length;
    document.getElementById('statTotalAcres').textContent = totalAcres.toFixed(0);
    document.getElementById('statActiveFields').textContent = activeFields;
    document.getElementById('statYTDRevenue').textContent = '$' + ytdRevenue.toLocaleString();

    // Recent properties
    renderRecentProperties();

    // Outstanding balances
    renderOutstandingBalances();
}

function renderRecentProperties() {
    const container = document.getElementById('recentPropertiesList');

    if (properties.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏡</div><p>No properties yet. Click "Add Property" to get started.</p></div>';
        return;
    }

    const recentProps = properties.slice(0, 5);
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Property Name</th>
                    <th>Landlord</th>
                    <th>Total Acres</th>
                    <th>Fields</th>
                </tr>
            </thead>
            <tbody>
                ${recentProps.map(p => `
                    <tr>
                        <td><strong>${p.name}</strong></td>
                        <td>${p.landlord ? `${p.landlord.firstName || ''} ${p.landlord.lastName || ''}` : 'N/A'}</td>
                        <td>${p.totalAcres || 0} acres</td>
                        <td>${p.fields ? p.fields.length : 0} fields</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderOutstandingBalances() {
    const container = document.getElementById('outstandingBalancesList');

    // Group ledger entries by landlord
    const balancesByLandlord = {};
    ledgerEntries.filter(e => e.status !== 'paid' && e.status !== 'cancelled').forEach(entry => {
        const landlordId = entry.landlord?._id;
        if (!landlordId) return;

        if (!balancesByLandlord[landlordId]) {
            balancesByLandlord[landlordId] = {
                landlord: entry.landlord,
                farmerOwes: 0,
                landlordOwes: 0
            };
        }

        const balance = entry.balanceRemaining || entry.amount;
        if (entry.owedBy === 'farmer') {
            balancesByLandlord[landlordId].farmerOwes += balance;
        } else {
            balancesByLandlord[landlordId].landlordOwes += balance;
        }
    });

    const balances = Object.values(balancesByLandlord);

    if (balances.length === 0) {
        container.innerHTML = '<p style="padding: 1rem; color: #666;">All accounts settled! 🎉</p>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Landlord</th>
                    <th>You Owe</th>
                    <th>They Owe</th>
                    <th>Net Balance</th>
                </tr>
            </thead>
            <tbody>
                ${balances.map(b => {
                    const net = b.farmerOwes - b.landlordOwes;
                    const netDisplay = net >= 0
                        ? `<span style="color: #dc3545;">-$${Math.abs(net).toLocaleString()}</span>`
                        : `<span style="color: #28a745;">+$${Math.abs(net).toLocaleString()}</span>`;

                    return `
                        <tr>
                            <td><strong>${b.landlord.firstName || ''} ${b.landlord.lastName || ''}</strong></td>
                            <td>$${b.farmerOwes.toLocaleString()}</td>
                            <td>$${b.landlordOwes.toLocaleString()}</td>
                            <td>${netDisplay}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function renderPropertiesList() {
    const container = document.getElementById('propertiesList');

    if (properties.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏡</div><p>No properties yet. Click "Add Property" to get started.</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Property Name</th>
                        <th>Landlord</th>
                        <th>Location</th>
                        <th>Total Acres</th>
                        <th>Farmable Acres</th>
                        <th>Fields</th>
                        <th>Lease Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${properties.map(p => `
                        <tr>
                            <td><strong>${p.name}</strong></td>
                            <td>${p.landlord ? `${p.landlord.firstName || ''} ${p.landlord.lastName || ''}` : 'N/A'}</td>
                            <td>${p.address?.city || ''}, ${p.address?.state || ''}</td>
                            <td>${p.totalAcres || 0}</td>
                            <td>${p.farmableAcres || 0}</td>
                            <td>${p.fields ? p.fields.length : 0}</td>
                            <td><span class="badge badge-info">${(p.leaseDetails?.leaseType || 'N/A').replace('_', ' ')}</span></td>
                            <td>
                                <button class="btn btn-secondary btn-small" onclick="viewProperty('${p._id}')">View</button>
                                <button class="btn btn-primary btn-small" onclick="editProperty('${p._id}')">Edit</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderFieldsList() {
    const container = document.getElementById('fieldsList');

    if (fields.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🌾</div><p>No fields yet. Click "Add Field" to get started.</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Field Name</th>
                        <th>Property</th>
                        <th>Acres</th>
                        <th>Current Crop</th>
                        <th>Crop Year</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${fields.map(f => `
                        <tr>
                            <td><strong>${f.name}</strong></td>
                            <td>${f.property?.name || 'N/A'}</td>
                            <td>${f.acres || 0}</td>
                            <td>${f.currentCrop?.cropType || 'None'}</td>
                            <td>${f.currentCrop?.year || '-'}</td>
                            <td><span class="badge badge-${f.status === 'active' ? 'success' : 'warning'}">${f.status || 'unknown'}</span></td>
                            <td>
                                <button class="btn btn-secondary btn-small" onclick="viewField('${f._id}')">View</button>
                                <button class="btn btn-primary btn-small" onclick="editField('${f._id}')">Edit</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderTransactionsList() {
    const container = document.getElementById('transactionsList');

    if (transactions.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💰</div><p>No transactions yet. Click "Add Transaction" to get started.</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Property/Field</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.slice(0, 50).map(t => `
                        <tr>
                            <td>${new Date(t.date).toLocaleDateString()}</td>
                            <td><span class="badge badge-${t.type === 'income' ? 'success' : 'danger'}">${t.type}</span></td>
                            <td>${t.category.replace('_', ' ')}</td>
                            <td>${t.description}</td>
                            <td>${t.property?.name || t.field?.name || 'General'}</td>
                            <td style="font-weight: 600; color: ${t.type === 'income' ? '#28a745' : '#dc3545'}">
                                ${t.type === 'income' ? '+' : '-'}$${t.amount.toLocaleString()}
                            </td>
                            <td>
                                <button class="btn btn-secondary btn-small" onclick="editTransaction('${t._id}')">Edit</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderLedgerList() {
    const container = document.getElementById('ledgerList');

    if (ledgerEntries.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📒</div><p>No ledger entries yet.</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Landlord</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${ledgerEntries.map(e => `
                        <tr>
                            <td>${new Date(e.entryDate).toLocaleDateString()}</td>
                            <td><strong>${e.landlord?.firstName || ''} ${e.landlord?.lastName || ''}</strong></td>
                            <td><span class="badge badge-info">${e.entryType.replace('_', ' ')}</span></td>
                            <td>${e.description}</td>
                            <td>$${e.amount.toLocaleString()}<br><small>Balance: $${(e.balanceRemaining || 0).toLocaleString()}</small></td>
                            <td><span class="badge badge-${e.status === 'paid' ? 'success' : e.status === 'overdue' ? 'danger' : 'warning'}">${e.status}</span></td>
                            <td>
                                ${e.status !== 'paid' ? `<button class="btn btn-primary btn-small" onclick="recordPayment('${e._id}')">Pay</button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderHarvestList() {
    const container = document.getElementById('harvestList');

    if (harvestRecords.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🚜</div><p>No harvest data yet. Add individual records or use bulk import.</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Crop Year</th>
                        <th>Field</th>
                        <th>Crop Type</th>
                        <th>Acres</th>
                        <th>Yield/Acre</th>
                        <th>Total Bushels</th>
                        <th>Revenue</th>
                        <th>Verified</th>
                    </tr>
                </thead>
                <tbody>
                    ${harvestRecords.map(h => `
                        <tr>
                            <td><strong>${h.cropYear}</strong></td>
                            <td>${h.field?.name || 'N/A'}</td>
                            <td>${h.cropType}</td>
                            <td>${h.acresHarvested}</td>
                            <td>${h.yieldPerAcre.toFixed(1)} bu/ac</td>
                            <td>${h.totalBushels.toLocaleString()}</td>
                            <td>$${(h.calculations?.grossRevenue || 0).toLocaleString()}</td>
                            <td>${h.verified ? '<span class="badge badge-success">✓</span>' : '<span class="badge badge-warning">Pending</span>'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderAnalytics() {
    // Analytics rendering will be implemented
    console.log('Analytics view loaded');
}

// Modal Functions
function openPropertyModal(propertyId = null) {
    showAlert('Property form will be implemented in the next update', 'info');
    // Full implementation coming in next part
}

function openFieldModal(fieldId = null) {
    showAlert('Field form will be implemented in the next update', 'info');
}

function openTransactionModal(transactionId = null) {
    showAlert('Transaction form will be implemented in the next update', 'info');
}

function openLedgerModal(entryId = null) {
    showAlert('Ledger form will be implemented in the next update', 'info');
}

function openHarvestModal(harvestId = null) {
    showAlert('Harvest form will be implemented in the next update', 'info');
}

function openBulkImportModal() {
    showAlert('Bulk import feature will be implemented in the next update', 'info');
}

// Action Functions
function viewProperty(id) {
    console.log('View property:', id);
}

function editProperty(id) {
    openPropertyModal(id);
}

function viewField(id) {
    console.log('View field:', id);
}

function editField(id) {
    openFieldModal(id);
}

function editTransaction(id) {
    openTransactionModal(id);
}

function recordPayment(entryId) {
    const amount = prompt('Enter payment amount:');
    if (!amount) return;

    apiCall(`/ledger/${entryId}/payment`, {
        method: 'POST',
        body: JSON.stringify({
            amount: parseFloat(amount),
            method: 'check',
            notes: 'Payment recorded from dashboard'
        })
    })
    .then(() => {
        showAlert('Payment recorded successfully', 'success');
        loadLedger();
        renderOverview();
    })
    .catch(error => {
        showAlert('Error recording payment: ' + error.message, 'error');
    });
}

// Utility Functions
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '80px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/farmer/login.html';
}
