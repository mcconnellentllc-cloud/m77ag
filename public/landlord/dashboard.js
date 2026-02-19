// =============================================
// Auth
// =============================================
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
if (!token || !userStr) window.location.href = '/landlord/login.html';
const user = JSON.parse(userStr);

async function apiCall(endpoint, options = {}) {
    const defaults = {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    };
    const response = await fetch(endpoint, { ...defaults, ...options });
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

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/landlord/login.html';
}

function showAlert(msg, type = 'success') {
    const el = document.getElementById('alert');
    el.textContent = msg;
    el.className = `alert alert-${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function fmt(n) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDollar(n) { return '$' + fmt(n); }

// =============================================
// Crop colors
// =============================================
const CROP_COLORS = {
    CORN: '#f59e0b', WHEAT: '#d97706', SORGHUM: '#ea580c', FALLOW: '#9ca3af',
    PASTURE: '#10b981', 'PEARL MILLET': '#6366f1', TRITICALE: '#3b82f6',
    'SORGHUM SUDAN': '#f97316', 'BUILDING SITE': '#6b7280', WASTE: '#d1d5db'
};

function cropBadgeClass(crop) {
    return 'crop-' + (crop || '').replace(/\s+/g, '-').toUpperCase();
}

// =============================================
// Tab Navigation
// =============================================
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
});

// =============================================
// Load Dashboard
// =============================================
async function loadDashboard() {
    document.getElementById('userInfo').textContent = user.name || user.email;
    await Promise.all([loadSummary(), loadFields(), loadPreferences()]);
}

// =============================================
// Overview Tab: Summary
// =============================================
async function loadSummary() {
    try {
        const data = await apiCall('/api/landlord/summary');
        if (!data.success) return;
        const s = data.summary;

        document.getElementById('totalAcres').textContent = fmt(s.totalAcres);
        document.getElementById('cropAcres').textContent = fmt(s.cropAcres);
        document.getElementById('totalFields').textContent = s.totalFields;
        document.getElementById('totalFarms').textContent = s.farms;
        document.getElementById('totalTax').textContent = fmtDollar(s.totalPropertyTax);

        renderCropMix(s.cropMix, s.totalAcres);
        renderCountyBreakdown(s.countyBreakdown);
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

function renderCropMix(cropMix, totalAcres) {
    const bar = document.getElementById('cropMixBar');
    const legend = document.getElementById('cropMixLegend');
    if (!cropMix || totalAcres === 0) {
        bar.innerHTML = '';
        legend.innerHTML = '<div class="empty-state">No crop data</div>';
        return;
    }

    // Sort by acres descending
    const sorted = Object.entries(cropMix).sort((a, b) => b[1] - a[1]);

    bar.innerHTML = sorted.map(([crop, ac]) => {
        const pct = (ac / totalAcres * 100);
        const color = CROP_COLORS[crop] || '#94a3b8';
        return `<div class="crop-mix-segment" style="width:${pct}%;background:${color};" title="${crop}: ${fmt(ac)} ac (${pct.toFixed(1)}%)"></div>`;
    }).join('');

    legend.innerHTML = sorted.map(([crop, ac]) => {
        const color = CROP_COLORS[crop] || '#94a3b8';
        const pct = (ac / totalAcres * 100).toFixed(1);
        return `<div class="crop-mix-item"><div class="crop-mix-dot" style="background:${color}"></div>${crop} -- ${fmt(ac)} ac (${pct}%)</div>`;
    }).join('');
}

function renderCountyBreakdown(counties) {
    const grid = document.getElementById('countyGrid');
    if (!counties || Object.keys(counties).length === 0) {
        grid.innerHTML = '<div class="empty-state">No county data</div>';
        return;
    }

    grid.innerHTML = Object.entries(counties)
        .sort((a, b) => b[1].acres - a[1].acres)
        .map(([county, info]) => `
            <div class="county-card">
                <div class="county-name">${county} County</div>
                <div class="county-detail">${fmt(info.acres)} acres across ${info.fields} fields</div>
            </div>
        `).join('');
}

// =============================================
// Fields Tab
// =============================================
async function loadFields() {
    try {
        const data = await apiCall('/api/landlord/fields');
        const container = document.getElementById('fieldsContainer');

        if (!data.success || !data.farms || data.farms.length === 0) {
            container.innerHTML = '<div class="empty-state">No fields assigned. Contact M77 AG at office@m77ag.com.</div>';
            return;
        }

        let html = '';
        for (const farmGroup of data.farms) {
            html += `
                <div class="farm-header">
                    <div class="farm-name">${farmGroup.farm}</div>
                    <div class="farm-stats">
                        <span>Total: <strong>${fmt(farmGroup.totalAcres)} ac</strong></span>
                        <span>Crop: <strong>${fmt(farmGroup.cropAcres)} ac</strong></span>
                        <span>Fields: <strong>${farmGroup.fields.length}</strong></span>
                    </div>
                </div>
                <div class="field-grid">
            `;

            for (const f of farmGroup.fields) {
                html += renderFieldCard(f);
            }
            html += '</div>';
        }

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading fields:', error);
        document.getElementById('fieldsContainer').innerHTML = '<div class="empty-state">Error loading fields</div>';
    }
}

function renderFieldCard(f) {
    const crop = f.crop2026 || '--';
    const cropClass = cropBadgeClass(crop);
    const hasCropClass = CROP_COLORS[crop.toUpperCase()] ? cropClass : 'crop-default';
    const ac = f.acres ? fmt(f.acres) : '--';
    const leaseType = (f.lease && f.lease.type) || '--';
    const soilType = (f.soil && typeof f.soil === 'object' && f.soil.type) || '--';
    const soilClass = (f.soil && typeof f.soil === 'object' && f.soil.class) || '--';
    const county = f.county || '--';
    const section = f.section || '--';
    const twp = f.township || '--';
    const rng = f.range || '--';
    const taxPerAcre = (f.taxes && f.taxes.propertyTaxPerAcre) ? fmtDollar(f.taxes.propertyTaxPerAcre) : '--';
    const totalTax = (f.taxes && f.taxes.propertyTaxPerAcre && f.acres)
        ? fmtDollar(f.taxes.propertyTaxPerAcre * f.acres) : '--';
    const mktVal = f.marketValuePerAcre ? fmtDollar(f.marketValuePerAcre) + '/ac' : '--';

    // Cost summary
    const costPerAcre = f.totalCostPerAcre || 0;
    const revPerAcre = f.revenuePerAcre || 0;
    const netPerAcre = f.netPerAcre || 0;

    // Rotation
    const years = [2025, 2026, 2027, 2028, 2029, 2030];
    const rotation = years.map(yr => {
        const c = f['crop' + yr] || '';
        const shortCrop = c.length > 8 ? c.substring(0, 7) + '.' : c;
        return { year: yr, crop: shortCrop || '--', isCurrent: yr === 2026 };
    });

    return `
        <div class="field-card">
            <div class="field-card-header">
                <div>
                    <span class="field-name">${f.field}</span>
                    <span class="field-acres" style="margin-left:8px;">${ac} ac</span>
                </div>
                <span class="crop-badge ${hasCropClass}">${crop}</span>
            </div>
            <div class="field-card-body">
                <div class="field-info-grid">
                    <div class="field-info-item">
                        <div class="field-info-label">County</div>
                        <div class="field-info-value">${county}</div>
                    </div>
                    <div class="field-info-item">
                        <div class="field-info-label">Section / Twp / Rng</div>
                        <div class="field-info-value">${section} / ${twp} / ${rng}</div>
                    </div>
                    <div class="field-info-item">
                        <div class="field-info-label">Soil Type</div>
                        <div class="field-info-value">${soilType}</div>
                    </div>
                    <div class="field-info-item">
                        <div class="field-info-label">Soil Class</div>
                        <div class="field-info-value">${soilClass}</div>
                    </div>
                    <div class="field-info-item">
                        <div class="field-info-label">Lease</div>
                        <div class="field-info-value" style="text-transform:capitalize;">${leaseType}</div>
                    </div>
                    <div class="field-info-item">
                        <div class="field-info-label">Market Value</div>
                        <div class="field-info-value">${mktVal}</div>
                    </div>
                    <div class="field-info-item">
                        <div class="field-info-label">Tax / Acre</div>
                        <div class="field-info-value">${taxPerAcre}</div>
                    </div>
                    <div class="field-info-item">
                        <div class="field-info-label">Total Tax</div>
                        <div class="field-info-value">${totalTax}</div>
                    </div>
                </div>

                ${costPerAcre > 0 || revPerAcre > 0 ? `
                <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;">
                    <div>
                        <div class="field-info-label">Cost/Ac</div>
                        <div style="font-family:'Oswald',sans-serif;font-size:15px;color:#666;margin-top:2px;">${fmtDollar(costPerAcre)}</div>
                    </div>
                    <div>
                        <div class="field-info-label">Rev/Ac</div>
                        <div style="font-family:'Oswald',sans-serif;font-size:15px;color:#2d5016;margin-top:2px;">${fmtDollar(revPerAcre)}</div>
                    </div>
                    <div>
                        <div class="field-info-label">Net/Ac</div>
                        <div style="font-family:'Oswald',sans-serif;font-size:15px;color:${netPerAcre >= 0 ? '#2d5016' : '#dc2626'};margin-top:2px;">${fmtDollar(netPerAcre)}</div>
                    </div>
                </div>
                ` : ''}

                <div class="rotation-row">
                    ${rotation.map(r => `
                        <div class="rotation-year ${r.isCurrent ? 'current' : ''}">
                            <div class="yr">${r.year}</div>
                            <div class="crop">${r.crop}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="field-card-footer">
                Legal: ${f.legal || '--'} | FSA: ${f.fsaFarm || '--'} / ${f.tract || '--'}
            </div>
        </div>
    `;
}

// =============================================
// Preferences Tab
// =============================================
async function loadPreferences() {
    try {
        const data = await apiCall('/api/landlord/preferences');
        if (!data.success || !data.preferences) return;
        const p = data.preferences;

        if (p.grainSalePrice) {
            if (p.grainSalePrice.corn) document.getElementById('cornPrice').value = p.grainSalePrice.corn;
            if (p.grainSalePrice.wheat) document.getElementById('wheatPrice').value = p.grainSalePrice.wheat;
            if (p.grainSalePrice.milo) document.getElementById('miloPrice').value = p.grainSalePrice.milo;
        }
        if (p.paymentTiming) document.getElementById('paymentTiming').value = p.paymentTiming;
        if (p.paymentMethod) document.getElementById('paymentMethod').value = p.paymentMethod;
        if (p.specialInstructions) document.getElementById('specialInstructions').value = p.specialInstructions;
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

// Save grain prices
document.getElementById('grainPriceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await apiCall('/api/landlord/preferences', {
            method: 'PUT',
            body: JSON.stringify({
                grainSalePrice: {
                    corn: parseFloat(document.getElementById('cornPrice').value) || null,
                    wheat: parseFloat(document.getElementById('wheatPrice').value) || null,
                    milo: parseFloat(document.getElementById('miloPrice').value) || null
                }
            })
        });
        showAlert('Grain price targets saved.');
    } catch (error) {
        showAlert('Error saving prices.', 'error');
    }
});

// Save payment prefs
document.getElementById('paymentPrefForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await apiCall('/api/landlord/preferences', {
            method: 'PUT',
            body: JSON.stringify({
                paymentTiming: document.getElementById('paymentTiming').value,
                paymentMethod: document.getElementById('paymentMethod').value,
                specialInstructions: document.getElementById('specialInstructions').value || null
            })
        });
        showAlert('Payment preferences saved.');
    } catch (error) {
        showAlert('Error saving preferences.', 'error');
    }
});

// =============================================
// Init
// =============================================
window.addEventListener('DOMContentLoaded', loadDashboard);
