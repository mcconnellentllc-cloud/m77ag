// Crop Rotation Management Table

// Render rotation table
function renderRotationTable() {
    const container = document.getElementById('rotationTable');

    if (fields.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🌾</div>
                <p>No fields yet. Add fields to start planning rotations.</p>
                <button class="btn btn-primary" onclick="switchView('fields')">Go to Fields</button>
            </div>
        `;
        return;
    }

    // Group fields by property
    const fieldsByProperty = {};
    fields.forEach(field => {
        const propName = field.property?.name || 'Unknown';
        if (!fieldsByProperty[propName]) {
            fieldsByProperty[propName] = [];
        }
        fieldsByProperty[propName].push(field);
    });

    // Calculate current year + 7 years in advance
    const currentYear = new Date().getFullYear();
    const years = [
        currentYear - 2,  // 2 years back for reference
        currentYear - 1,  // last year
        currentYear,      // this year
        currentYear + 1,  // next 7 years
        currentYear + 2,
        currentYear + 3,
        currentYear + 4,
        currentYear + 5,
        currentYear + 6,
        currentYear + 7
    ];

    // Build table HTML
    let html = `
        <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
            <div>
                <h3 style="margin: 0; color: #2c5f2d;">7-Year Crop Rotation Planning</h3>
                <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #666;">
                    Click any editable cell (green border) to plan future crops. Historical data is locked.
                </p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-small" onclick="exportRotationToExcel()">📥 Export to Excel</button>
                <button class="btn btn-secondary btn-small" onclick="printRotationTable()">🖨️ Print</button>
                <button class="btn btn-primary btn-small" onclick="showRotationStats()">📊 Statistics</button>
            </div>
        </div>

        <div id="rotationStats" style="display: none; margin-bottom: 1.5rem;"></div>
    `;

    // Create table for each property
    Object.keys(fieldsByProperty).sort().forEach(propertyName => {
        const propertyFields = fieldsByProperty[propertyName];
        const totalAcres = propertyFields.reduce((sum, f) => sum + (f.acres || 0), 0);

        html += `
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h4 class="card-title">${propertyName} (${totalAcres.toFixed(1)} acres)</h4>
                </div>
                <div class="table-container" style="overflow-x: auto;">
                    <table class="rotation-table" style="font-size: 0.85rem; min-width: 1200px;">
                        <thead>
                            <tr>
                                <th style="width: 120px; position: sticky; left: 0; background: #f8f9fa; z-index: 10;">Field Name</th>
                                <th style="width: 60px; position: sticky; left: 120px; background: #f8f9fa; z-index: 10;">Acres</th>
                                ${years.map(y => {
                                    const isCurrent = y === currentYear;
                                    const isPast = y < currentYear;
                                    const headerStyle = isCurrent
                                        ? 'background: #fff3cd; font-weight: 700; border: 2px solid #ffc107;'
                                        : isPast
                                        ? 'background: #f1f1f1; color: #666;'
                                        : 'background: #d4edda; font-weight: 600; color: #2c5f2d;';
                                    return `<th style="width: 85px; ${headerStyle}">${y}</th>`;
                                }).join('')}
                                <th style="width: 80px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${propertyFields.map(field => renderRotationRow(field, years)).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: 600; background: #f8f9fa;">
                                <td>Total</td>
                                <td>${totalAcres.toFixed(1)}</td>
                                ${years.map(year => `<td>${calculateTotalByYear(propertyFields, year)}</td>`).join('')}
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Add rotation warnings
    highlightRotationIssues();
}

// Render individual rotation row
function renderRotationRow(field, years) {
    const currentYear = new Date().getFullYear();

    let html = `
        <tr data-field-id="${field._id}">
            <td><strong>${field.name}</strong></td>
            <td>${(field.acres || 0).toFixed(1)}</td>
    `;

    years.forEach(year => {
        let crop = '';
        let editable = false;

        if (year === currentYear) {
            // Current year from currentCrop
            crop = field.currentCrop?.cropType || '';
            editable = true;
        } else if (year < currentYear) {
            // Historical data from cropHistory
            const historyEntry = field.cropHistory?.find(h => h.year === year);
            crop = historyEntry?.cropType || '';
            editable = false; // History is locked
        } else {
            // Future year - plan from cropPlan
            const planEntry = field.cropPlan?.find(p => p.year === year);
            crop = planEntry?.cropType || '';
            editable = true; // Future plans are editable
        }

        const cropDisplay = crop ? formatCropName(crop) : '-';
        const cropColor = getCropColor(crop);
        const cellClass = editable ? 'editable-cell' : '';

        html += `
            <td class="${cellClass}" style="background-color: ${cropColor}; cursor: ${editable ? 'pointer' : 'default'}; border: ${editable ? '1px solid #2c5f2d' : '1px solid #ddd'};"
                ${editable ? `onclick="editCrop('${field._id}', ${year})"` : ''}>
                ${cropDisplay}
            </td>
        `;
    });

    html += `
        <td>
            <button class="btn btn-secondary btn-small" onclick="viewFieldRotation('${field._id}')">📊</button>
        </td>
    </tr>
    `;

    return html;
}

// Calculate totals by year
function calculateTotalByYear(propertyFields, year) {
    const cropTotals = {};

    propertyFields.forEach(field => {
        const currentYear = new Date().getFullYear();
        let crop = '';

        if (year === currentYear) {
            crop = field.currentCrop?.cropType || '';
        } else if (year < currentYear) {
            const historyEntry = field.cropHistory?.find(h => h.year === year);
            crop = historyEntry?.cropType || '';
        }

        if (crop) {
            cropTotals[crop] = (cropTotals[crop] || 0) + (field.acres || 0);
        }
    });

    const summary = Object.entries(cropTotals)
        .map(([crop, acres]) => `${formatCropName(crop)}: ${acres.toFixed(0)}`)
        .join(', ');

    return summary || '-';
}

// Format crop name
function formatCropName(crop) {
    if (!crop) return '';

    const cropNames = {
        'corn': 'Corn',
        'soybeans': 'Soybeans',
        'wheat': 'Wheat',
        'milo': 'Milo',
        'sunflower': 'Sunflower',
        'fallow': 'Fallow',
        'other': 'Other'
    };

    return cropNames[crop.toLowerCase()] || crop;
}

// Get crop color
function getCropColor(crop) {
    if (!crop) return '#ffffff';

    const cropColors = {
        'corn': '#fff3cd',
        'soybeans': '#d4edda',
        'wheat': '#f8d7da',
        'milo': '#fce4ec',
        'sunflower': '#fff9c4',
        'fallow': '#e0e0e0',
        'other': '#f5f5f5'
    };

    return cropColors[crop.toLowerCase()] || '#ffffff';
}

// Edit crop
function editCrop(fieldId, year) {
    const field = fields.find(f => f._id === fieldId);
    if (!field) return;

    const currentYear = new Date().getFullYear();
    let currentCrop = '';

    if (year === currentYear) {
        currentCrop = field.currentCrop?.cropType || '';
    } else if (year > currentYear) {
        // Future year - get from cropPlan
        const planEntry = field.cropPlan?.find(p => p.year === year);
        currentCrop = planEntry?.cropType || '';
    }

    const modalHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Edit Crop - ${field.name} (${year})</h3>
                <button class="modal-close" onclick="closeModal('editCropModal')">&times;</button>
            </div>
            <form id="editCropForm">
                <div class="modal-body">
                    <input type="hidden" id="editCropFieldId" value="${fieldId}">
                    <input type="hidden" id="editCropYear" value="${year}">

                    <div class="form-group">
                        <label class="form-label">Select Crop for ${year}</label>
                        <select id="editCropType" class="form-control" required>
                            <option value="">Select crop...</option>
                            <option value="corn" ${currentCrop === 'corn' ? 'selected' : ''}>Corn</option>
                            <option value="soybeans" ${currentCrop === 'soybeans' ? 'selected' : ''}>Soybeans</option>
                            <option value="wheat" ${currentCrop === 'wheat' ? 'selected' : ''}>Wheat</option>
                            <option value="milo" ${currentCrop === 'milo' ? 'selected' : ''}>Milo</option>
                            <option value="sunflower" ${currentCrop === 'sunflower' ? 'selected' : ''}>Sunflower</option>
                            <option value="fallow" ${currentCrop === 'fallow' ? 'selected' : ''}>Fallow</option>
                            <option value="other" ${currentCrop === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Variety (Optional)</label>
                        <input type="text" id="editCropVariety" class="form-control" value="${field.currentCrop?.variety || ''}">
                    </div>

                    <div id="rotationWarning" style="display: none;" class="alert alert-warning">
                        <strong>⚠️ Rotation Warning:</strong>
                        <span id="warningMessage"></span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('editCropModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
    `;

    showModal('editCropModal', modalHTML);

    // Check for rotation warnings
    document.getElementById('editCropType').addEventListener('change', function() {
        checkRotationWarning(fieldId, year, this.value);
    });

    document.getElementById('editCropForm').onsubmit = async (e) => {
        e.preventDefault();
        await saveCropEdit();
    };
}

// Check rotation warning
function checkRotationWarning(fieldId, year, newCrop) {
    const field = fields.find(f => f._id === fieldId);
    if (!field) return;

    const warning = document.getElementById('rotationWarning');
    const warningMessage = document.getElementById('warningMessage');

    // Get previous years
    const previousYears = [year - 1, year - 2];
    const previousCrops = previousYears.map(y => {
        if (y === new Date().getFullYear()) {
            return field.currentCrop?.cropType;
        } else {
            const entry = field.cropHistory?.find(h => h.year === y);
            return entry?.cropType;
        }
    }).filter(Boolean);

    // Check for consecutive corn (bad rotation)
    if (newCrop === 'corn' && previousCrops.includes('corn')) {
        warning.style.display = 'block';
        warningMessage.textContent = 'Consecutive corn years detected. Consider rotation for better soil health.';
    } else {
        warning.style.display = 'none';
    }
}

// Save crop edit
async function saveCropEdit() {
    const fieldId = document.getElementById('editCropFieldId').value;
    const year = parseInt(document.getElementById('editCropYear').value);
    const cropType = document.getElementById('editCropType').value;
    const variety = document.getElementById('editCropVariety').value;

    const currentYear = new Date().getFullYear();

    try {
        if (year === currentYear) {
            // Update current year crop
            await apiCall(`/fields/${fieldId}/current-crop`, {
                method: 'PATCH',
                body: JSON.stringify({
                    cropType,
                    year,
                    variety
                })
            });
        } else if (year > currentYear) {
            // Update future crop plan
            await apiCall(`/fields/${fieldId}/crop-plan`, {
                method: 'POST',
                body: JSON.stringify({
                    year,
                    cropType,
                    variety
                })
            });
        }

        showAlert('Crop plan updated successfully!', 'success');
        closeModal('editCropModal');

        await loadFields();
        renderRotationTable();

    } catch (error) {
        showAlert('Error updating crop: ' + error.message, 'error');
    }
}

// View field rotation details
function viewFieldRotation(fieldId) {
    const field = fields.find(f => f._id === fieldId);
    if (!field) return;

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 5, currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

    const rotationHTML = years.map(year => {
        let crop = '-';
        let yield_val = '';

        if (year === currentYear) {
            crop = field.currentCrop?.cropType ? formatCropName(field.currentCrop.cropType) : '-';
        } else {
            const historyEntry = field.cropHistory?.find(h => h.year === year);
            if (historyEntry) {
                crop = formatCropName(historyEntry.cropType);
                if (historyEntry.yield) {
                    yield_val = `(${historyEntry.yield.toFixed(1)} bu/ac)`;
                }
            }
        }

        return `${year}: <strong>${crop}</strong> ${yield_val}`;
    }).join('<br>');

    const modalHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${field.name} - Rotation History</h3>
                <button class="modal-close" onclick="closeModal('fieldRotationModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Property:</strong> ${field.property?.name || 'Unknown'}</p>
                <p><strong>Acres:</strong> ${field.acres}</p>
                <p><strong>Soil Type:</strong> ${field.soilType || 'Not specified'}</p>
                <hr style="margin: 1.5rem 0;">
                <h4 style="margin-bottom: 1rem;">Crop Rotation:</h4>
                <div style="line-height: 2;">${rotationHTML}</div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('fieldRotationModal')">Close</button>
            </div>
        </div>
    `;

    showModal('fieldRotationModal', modalHTML);
}

// Highlight rotation issues
function highlightRotationIssues() {
    // Add visual indicators for problematic rotations
    // This would check for things like corn-corn-corn, etc.
}

// Show rotation statistics
function showRotationStats() {
    const statsDiv = document.getElementById('rotationStats');

    if (statsDiv.style.display === 'none') {
        const currentYear = new Date().getFullYear();

        // Calculate stats by crop type
        const cropStats = {};
        let totalAcres = 0;

        fields.forEach(field => {
            const crop = field.currentCrop?.cropType || 'fallow';
            const acres = field.acres || 0;

            cropStats[crop] = (cropStats[crop] || 0) + acres;
            totalAcres += acres;
        });

        let statsHTML = '<h4 style="margin-bottom: 1rem; font-size: 1rem;">Current Year (' + currentYear + ') Statistics:</h4>';
        statsHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">';

        Object.entries(cropStats).sort((a, b) => b[1] - a[1]).forEach(([crop, acres]) => {
            const percentage = ((acres / totalAcres) * 100).toFixed(1);
            statsHTML += `
                <div style="padding: 1rem; background: ${getCropColor(crop)}; border-radius: 4px; border: 1px solid #ddd;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">${formatCropName(crop)}</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${acres.toFixed(0)} acres</div>
                    <div style="color: #666; font-size: 0.9rem;">${percentage}% of total</div>
                </div>
            `;
        });

        statsHTML += '</div>';
        statsDiv.innerHTML = statsHTML;
        statsDiv.style.display = 'block';
    } else {
        statsDiv.style.display = 'none';
    }
}

// Export rotation to Excel
function exportRotationToExcel() {
    const wb = XLSX.utils.book_new();
    const currentYear = new Date().getFullYear();
    const years = [
        currentYear - 2, currentYear - 1, currentYear,
        currentYear + 1, currentYear + 2, currentYear + 3,
        currentYear + 4, currentYear + 5, currentYear + 6, currentYear + 7
    ];

    const data = [
        ['Field Name', 'Property', 'Landlord', 'Acres', ...years.map(y => y.toString())],
    ];

    fields.forEach(field => {
        const row = [
            field.name,
            field.property?.name || '',
            field.property?.landlord?.name || field.property?.landlord?.username || '',
            field.acres || 0
        ];

        years.forEach(year => {
            let crop = '';
            if (year === currentYear) {
                crop = field.currentCrop?.cropType || '';
            } else if (year < currentYear) {
                const historyEntry = field.cropHistory?.find(h => h.year === year);
                crop = historyEntry?.cropType || '';
            } else {
                const planEntry = field.cropPlan?.find(p => p.year === year);
                crop = planEntry?.cropType || '';
            }
            row.push(formatCropName(crop) || '');
        });

        data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        {wch: 20}, {wch: 20}, {wch: 20}, {wch: 10},
        {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12},
        {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Crop Rotation Plan');
    XLSX.writeFile(wb, `M77AG_7Year_Rotation_Plan_${currentYear}.xlsx`);

    showAlert('7-Year Rotation Plan exported to Excel!', 'success');
}

// Print rotation table
function printRotationTable() {
    window.print();
}
