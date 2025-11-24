// Form Submission Handlers for Farmer Dashboard

// Open Property Modal
function openPropertyModal(propertyId = null) {
    showModal('propertyModal', modalTemplates.property);
    populateLandlordDropdown();

    if (propertyId) {
        // Edit mode
        document.getElementById('propertyModalTitle').textContent = 'Edit Property';
        loadPropertyData(propertyId);
    }

    document.getElementById('propertyForm').onsubmit = async (e) => {
        e.preventDefault();
        await saveProperty();
    };
}

// Load property data for editing
function loadPropertyData(propertyId) {
    const property = properties.find(p => p._id === propertyId);
    if (!property) return;

    document.getElementById('propertyId').value = property._id;
    document.getElementById('propertyName').value = property.name;
    document.getElementById('propertyLandlord').value = property.landlord?._id || '';
    document.getElementById('propertyTotalAcres').value = property.totalAcres || '';
    document.getElementById('propertyFarmableAcres').value = property.farmableAcres || '';
    document.getElementById('propertyDescription').value = property.description || '';
    document.getElementById('propertyStreet').value = property.address?.street || '';
    document.getElementById('propertyCity').value = property.address?.city || '';
    document.getElementById('propertyCounty').value = property.address?.county || '';
    document.getElementById('propertyState').value = property.address?.state || 'CO';
    document.getElementById('propertyZip').value = property.address?.zip || '';
    document.getElementById('propertyLegalDescription').value = property.legalDescription || '';
    document.getElementById('propertyParcelId').value = property.parcelId || '';
    document.getElementById('propertyLeaseType').value = property.leaseDetails?.leaseType || 'cash_rent';
    document.getElementById('propertyLeaseRate').value = property.leaseDetails?.leaseRate || '';

    if (property.leaseDetails?.leaseStartDate) {
        document.getElementById('propertyLeaseStart').value = property.leaseDetails.leaseStartDate.split('T')[0];
    }
    if (property.leaseDetails?.leaseEndDate) {
        document.getElementById('propertyLeaseEnd').value = property.leaseDetails.leaseEndDate.split('T')[0];
    }

    document.getElementById('propertyMarketValue').value = property.marketValue?.estimatedValue || '';
    document.getElementById('propertyNotes').value = property.notes || '';
}

// Save property
async function saveProperty() {
    const propertyId = document.getElementById('propertyId').value;
    const saveBtn = document.getElementById('savePropertyBtn');

    const propertyData = {
        name: document.getElementById('propertyName').value,
        landlord: document.getElementById('propertyLandlord').value,
        totalAcres: parseFloat(document.getElementById('propertyTotalAcres').value),
        farmableAcres: parseFloat(document.getElementById('propertyFarmableAcres').value) || null,
        description: document.getElementById('propertyDescription').value,
        address: {
            street: document.getElementById('propertyStreet').value,
            city: document.getElementById('propertyCity').value,
            county: document.getElementById('propertyCounty').value,
            state: document.getElementById('propertyState').value,
            zip: document.getElementById('propertyZip').value
        },
        legalDescription: document.getElementById('propertyLegalDescription').value,
        parcelId: document.getElementById('propertyParcelId').value,
        leaseDetails: {
            leaseType: document.getElementById('propertyLeaseType').value,
            leaseRate: parseFloat(document.getElementById('propertyLeaseRate').value) || null,
            leaseStartDate: document.getElementById('propertyLeaseStart').value || null,
            leaseEndDate: document.getElementById('propertyLeaseEnd').value || null
        },
        marketValue: {
            estimatedValue: parseFloat(document.getElementById('propertyMarketValue').value) || null
        },
        notes: document.getElementById('propertyNotes').value
    };

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        if (propertyId) {
            // Update existing
            await apiCall(`/properties/${propertyId}`, {
                method: 'PUT',
                body: JSON.stringify(propertyData)
            });
            showAlert('Property updated successfully!', 'success');
        } else {
            // Create new
            await apiCall('/properties', {
                method: 'POST',
                body: JSON.stringify(propertyData)
            });
            showAlert('Property added successfully!', 'success');
        }

        closeModal('propertyModal');
        await loadProperties();
        renderOverview();

    } catch (error) {
        showAlert('Error saving property: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Property';
    }
}

// Open Field Modal
function openFieldModal(fieldId = null) {
    showModal('fieldModal', modalTemplates.field);
    populatePropertyDropdown('fieldProperty');

    if (fieldId) {
        // Edit mode
        document.getElementById('fieldModalTitle').textContent = 'Edit Field';
        loadFieldData(fieldId);
    }

    document.getElementById('fieldForm').onsubmit = async (e) => {
        e.preventDefault();
        await saveField();
    };
}

// Load field data for editing
function loadFieldData(fieldId) {
    const field = fields.find(f => f._id === fieldId);
    if (!field) return;

    document.getElementById('fieldId').value = field._id;
    document.getElementById('fieldName').value = field.name;
    document.getElementById('fieldProperty').value = field.property?._id || '';
    document.getElementById('fieldNumber').value = field.fieldNumber || '';
    document.getElementById('fieldAcres').value = field.acres || '';
    document.getElementById('fieldDescription').value = field.description || '';
    document.getElementById('fieldSoilType').value = field.soilType || '';
    document.getElementById('fieldSoilClass').value = field.soilClass || '';
    document.getElementById('fieldDrainageTile').checked = field.drainageTile || false;
    document.getElementById('fieldIrrigated').checked = field.irrigated || false;
    document.getElementById('fieldCropType').value = field.currentCrop?.cropType || '';
    document.getElementById('fieldCropYear').value = field.currentCrop?.year || new Date().getFullYear();
    document.getElementById('fieldVariety').value = field.currentCrop?.variety || '';

    if (field.currentCrop?.plantingDate) {
        document.getElementById('fieldPlantingDate').value = field.currentCrop.plantingDate.split('T')[0];
    }
    if (field.currentCrop?.expectedHarvestDate) {
        document.getElementById('fieldHarvestDate').value = field.currentCrop.expectedHarvestDate.split('T')[0];
    }

    document.getElementById('fieldEstimatedYield').value = field.currentCrop?.estimatedYield || '';
    document.getElementById('fieldStatus').value = field.status || 'active';
    document.getElementById('fieldNotes').value = field.notes || '';
}

// Save field
async function saveField() {
    const fieldId = document.getElementById('fieldId').value;
    const saveBtn = document.getElementById('saveFieldBtn');

    const propertyId = document.getElementById('fieldProperty').value;
    const property = properties.find(p => p._id === propertyId);

    const fieldData = {
        name: document.getElementById('fieldName').value,
        property: propertyId,
        landlord: property?.landlord?._id,
        fieldNumber: document.getElementById('fieldNumber').value,
        acres: parseFloat(document.getElementById('fieldAcres').value),
        description: document.getElementById('fieldDescription').value,
        soilType: document.getElementById('fieldSoilType').value,
        soilClass: document.getElementById('fieldSoilClass').value,
        drainageTile: document.getElementById('fieldDrainageTile').checked,
        irrigated: document.getElementById('fieldIrrigated').checked,
        currentCrop: {
            cropType: document.getElementById('fieldCropType').value,
            year: parseInt(document.getElementById('fieldCropYear').value),
            variety: document.getElementById('fieldVariety').value,
            plantingDate: document.getElementById('fieldPlantingDate').value || null,
            expectedHarvestDate: document.getElementById('fieldHarvestDate').value || null,
            estimatedYield: parseFloat(document.getElementById('fieldEstimatedYield').value) || null
        },
        status: document.getElementById('fieldStatus').value,
        notes: document.getElementById('fieldNotes').value
    };

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        if (fieldId) {
            // Update existing
            await apiCall(`/fields/${fieldId}`, {
                method: 'PUT',
                body: JSON.stringify(fieldData)
            });
            showAlert('Field updated successfully!', 'success');
        } else {
            // Create new
            await apiCall('/fields', {
                method: 'POST',
                body: JSON.stringify(fieldData)
            });
            showAlert('Field added successfully!', 'success');
        }

        closeModal('fieldModal');
        await loadFields();
        renderOverview();

    } catch (error) {
        showAlert('Error saving field: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Field';
    }
}

// Open Transaction Modal
function openTransactionModal(transactionId = null) {
    showModal('transactionModal', modalTemplates.transaction);
    populatePropertyDropdown('transactionProperty');

    if (transactionId) {
        // Edit mode
        document.getElementById('transactionModalTitle').textContent = 'Edit Transaction';
        loadTransactionData(transactionId);
    }

    document.getElementById('transactionForm').onsubmit = async (e) => {
        e.preventDefault();
        await saveTransaction();
    };
}

// Load transaction data for editing
function loadTransactionData(transactionId) {
    const transaction = transactions.find(t => t._id === transactionId);
    if (!transaction) return;

    document.getElementById('transactionId').value = transaction._id;
    document.getElementById('transactionType').value = transaction.type;
    updateTransactionCategories();
    document.getElementById('transactionCategory').value = transaction.category;
    document.getElementById('transactionDescription').value = transaction.description;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionDate').value = transaction.date.split('T')[0];
    document.getElementById('transactionProperty').value = transaction.property?._id || '';
    document.getElementById('transactionField').value = transaction.field?._id || '';
    document.getElementById('transactionPaymentMethod').value = transaction.paymentMethod || 'check';
    document.getElementById('transactionReference').value = transaction.checkNumber || transaction.invoiceNumber || '';
    document.getElementById('transactionVendor').value = transaction.vendor?.name || transaction.customer?.name || '';
    document.getElementById('transactionTaxDeductible').checked = transaction.taxDeductible || false;
    document.getElementById('transactionNotes').value = transaction.notes || '';

    if (transaction.cropDetails) {
        document.getElementById('transactionBushels').value = transaction.cropDetails.bushels || '';
        document.getElementById('transactionPricePerBushel').value = transaction.cropDetails.pricePerBushel || '';
        document.getElementById('transactionBuyer').value = transaction.cropDetails.buyer || '';
    }
}

// Save transaction
async function saveTransaction() {
    const transactionId = document.getElementById('transactionId').value;
    const saveBtn = document.getElementById('saveTransactionBtn');

    const type = document.getElementById('transactionType').value;
    const vendorName = document.getElementById('transactionVendor').value;

    const transactionData = {
        type: type,
        category: document.getElementById('transactionCategory').value,
        description: document.getElementById('transactionDescription').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        date: document.getElementById('transactionDate').value,
        property: document.getElementById('transactionProperty').value || null,
        field: document.getElementById('transactionField').value || null,
        paymentMethod: document.getElementById('transactionPaymentMethod').value,
        checkNumber: document.getElementById('transactionReference').value,
        taxDeductible: document.getElementById('transactionTaxDeductible').checked,
        notes: document.getElementById('transactionNotes').value
    };

    // Add vendor or customer based on type
    if (type === 'income') {
        transactionData.customer = { name: vendorName };

        // Add crop details if it's a crop sale
        const bushels = parseFloat(document.getElementById('transactionBushels').value);
        const pricePerBushel = parseFloat(document.getElementById('transactionPricePerBushel').value);

        if (bushels || pricePerBushel) {
            transactionData.cropDetails = {
                bushels: bushels || null,
                pricePerBushel: pricePerBushel || null,
                buyer: document.getElementById('transactionBuyer').value
            };
        }
    } else {
        transactionData.vendor = { name: vendorName };
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        if (transactionId) {
            // Update existing
            await apiCall(`/transactions/${transactionId}`, {
                method: 'PUT',
                body: JSON.stringify(transactionData)
            });
            showAlert('Transaction updated successfully!', 'success');
        } else {
            // Create new
            await apiCall('/transactions', {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });
            showAlert('Transaction added successfully!', 'success');
        }

        closeModal('transactionModal');
        await loadTransactions();
        renderOverview();

    } catch (error) {
        showAlert('Error saving transaction: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Transaction';
    }
}

// Open Ledger Modal
function openLedgerModal(entryId = null) {
    const modalHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Add Ledger Entry</h3>
                <button class="modal-close" onclick="closeModal('ledgerModal')">&times;</button>
            </div>
            <form id="ledgerForm">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Landlord *</label>
                        <select id="ledgerLandlord" class="form-control" required onchange="updateLedgerProperty()">
                            <option value="">Select landlord...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Property *</label>
                        <select id="ledgerProperty" class="form-control" required>
                            <option value="">Select property...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Entry Type *</label>
                        <select id="ledgerEntryType" class="form-control" required>
                            <option value="lease_payment_due">Lease Payment Due (You owe landlord)</option>
                            <option value="lease_payment_made">Lease Payment Made (You paid landlord)</option>
                            <option value="crop_share_due">Crop Share Due (Landlord's share)</option>
                            <option value="crop_share_paid">Crop Share Paid</option>
                            <option value="expense_reimbursement">Expense Reimbursement (Landlord owes you)</option>
                            <option value="custom_work_due">Custom Work Due (Landlord owes you)</option>
                            <option value="custom_work_paid">Custom Work Paid</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Amount ($) *</label>
                            <input type="number" id="ledgerAmount" class="form-control" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date *</label>
                            <input type="date" id="ledgerDate" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Due Date</label>
                        <input type="date" id="ledgerDueDate" class="form-control">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description *</label>
                        <textarea id="ledgerDescription" class="form-control" rows="2" required></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Crop Year (Optional)</label>
                        <input type="number" id="ledgerCropYear" class="form-control" value="${new Date().getFullYear()}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea id="ledgerNotes" class="form-control" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('ledgerModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="saveLedgerBtn">Save Entry</button>
                </div>
            </form>
        </div>
    `;

    showModal('ledgerModal', modalHTML);

    // Populate landlords
    const landlordSelect = document.getElementById('ledgerLandlord');
    landlords.forEach(landlord => {
        const option = document.createElement('option');
        option.value = landlord._id;
        option.textContent = `${landlord.firstName || ''} ${landlord.lastName || ''}`.trim() || landlord.username;
        landlordSelect.appendChild(option);
    });

    document.getElementById('ledgerForm').onsubmit = async (e) => {
        e.preventDefault();
        await saveLedgerEntry();
    };
}

// Update ledger property dropdown based on landlord
function updateLedgerProperty() {
    const landlordId = document.getElementById('ledgerLandlord').value;
    const propertySelect = document.getElementById('ledgerProperty');

    propertySelect.innerHTML = '<option value="">Select property...</option>';

    const landlordProperties = properties.filter(p => p.landlord?._id === landlordId);
    landlordProperties.forEach(property => {
        const option = document.createElement('option');
        option.value = property._id;
        option.textContent = property.name;
        propertySelect.appendChild(option);
    });
}

// Save ledger entry
async function saveLedgerEntry() {
    const saveBtn = document.getElementById('saveLedgerBtn');

    const entryType = document.getElementById('ledgerEntryType').value;

    // Determine who owes whom based on entry type
    let owedBy, owedTo;
    if (entryType.includes('payment_due') || entryType.includes('share_due')) {
        owedBy = 'farmer';
        owedTo = 'landlord';
    } else if (entryType.includes('reimbursement') || entryType.includes('work_due')) {
        owedBy = 'landlord';
        owedTo = 'farmer';
    } else {
        // Payment made entries
        owedBy = 'farmer';
        owedTo = 'landlord';
    }

    const ledgerData = {
        landlord: document.getElementById('ledgerLandlord').value,
        property: document.getElementById('ledgerProperty').value,
        entryType: entryType,
        amount: parseFloat(document.getElementById('ledgerAmount').value),
        owedBy: owedBy,
        owedTo: owedTo,
        description: document.getElementById('ledgerDescription').value,
        entryDate: document.getElementById('ledgerDate').value,
        dueDate: document.getElementById('ledgerDueDate').value || null,
        cropYear: parseInt(document.getElementById('ledgerCropYear').value) || null,
        notes: document.getElementById('ledgerNotes').value,
        status: entryType.includes('_paid') || entryType.includes('_made') ? 'paid' : 'pending'
    };

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        await apiCall('/ledger', {
            method: 'POST',
            body: JSON.stringify(ledgerData)
        });

        showAlert('Ledger entry added successfully!', 'success');
        closeModal('ledgerModal');
        await loadLedger();
        renderOverview();

    } catch (error) {
        showAlert('Error saving ledger entry: ' + error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Entry';
    }
}

// Open Harvest Modal
function openHarvestModal(harvestId = null) {
    showAlert('Harvest form coming in next update. Use bulk import for now.', 'info');
}

// Open Bulk Import Modal
function openBulkImportModal() {
    const modalHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Bulk Import Harvest Data</h3>
                <button class="modal-close" onclick="closeModal('bulkImportModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="alert alert-info">
                    <strong>CSV Format Expected:</strong><br>
                    Field Name, Crop Type, Crop Year, Acres, Yield per Acre, Total Bushels, Moisture, Test Weight
                </div>

                <div class="form-group">
                    <label class="form-label">Select CSV File</label>
                    <input type="file" id="csvFile" class="form-control" accept=".csv">
                </div>

                <div class="form-group">
                    <label class="form-label">Import Source</label>
                    <select id="importSource" class="form-control">
                        <option value="csv">Manual CSV</option>
                        <option value="combine_data">Combine Data</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div id="importPreview" style="margin-top: 1rem; display: none;">
                    <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Preview:</h4>
                    <div id="previewContent" style="font-size: 0.85rem; max-height: 200px; overflow-y: auto;"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('bulkImportModal')">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="processBulkImport()" id="importBtn">Import Data</button>
            </div>
        </div>
    `;

    showModal('bulkImportModal', modalHTML);

    document.getElementById('csvFile').addEventListener('change', previewCSV);
}

// Preview CSV
function previewCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').slice(0, 5);

        document.getElementById('importPreview').style.display = 'block';
        document.getElementById('previewContent').innerHTML = `<pre>${lines.join('\n')}</pre>`;
    };
    reader.readAsText(file);
}

// Process bulk import
async function processBulkImport() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        showAlert('Please select a file', 'error');
        return;
    }

    const importBtn = document.getElementById('importBtn');
    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';

    try {
        // Read and parse CSV
        const text = await file.text();
        const records = parseCSV(text);

        showAlert(`Importing ${records.length} records...`, 'info');

        // Send to API
        await apiCall('/harvest/bulk-import', {
            method: 'POST',
            body: JSON.stringify({
                harvestRecords: records,
                importSource: document.getElementById('importSource').value,
                originalFileName: file.name
            })
        });

        showAlert('Harvest data imported successfully!', 'success');
        closeModal('bulkImportModal');
        await loadHarvest();

    } catch (error) {
        showAlert('Error importing data: ' + error.message, 'error');
    } finally {
        importBtn.disabled = false;
        importBtn.textContent = 'Import Data';
    }
}

// Parse CSV (simple parser)
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 2) continue;

        const fieldName = values[0];
        const field = fields.find(f => f.name.toLowerCase() === fieldName.toLowerCase());

        if (!field) {
            console.warn(`Field not found: ${fieldName}`);
            continue;
        }

        records.push({
            field: field._id,
            property: field.property,
            landlord: field.landlord,
            cropType: values[1].toLowerCase(),
            cropYear: parseInt(values[2]) || new Date().getFullYear(),
            acresHarvested: parseFloat(values[3]) || field.acres,
            yieldPerAcre: parseFloat(values[4]),
            totalBushels: parseFloat(values[5]),
            moisture: parseFloat(values[6]) || null,
            testWeight: parseFloat(values[7]) || null,
            harvestStartDate: new Date().toISOString()
        });
    }

    return records;
}
