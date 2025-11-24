// Modal Management System for Farmer Dashboard

// Modal HTML Templates
const modalTemplates = {
    property: `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title" id="propertyModalTitle">Add Property</h3>
                <button class="modal-close" onclick="closeModal('propertyModal')">&times;</button>
            </div>
            <form id="propertyForm">
                <div class="modal-body">
                    <input type="hidden" id="propertyId">

                    <div class="form-group">
                        <label class="form-label">Property Name *</label>
                        <input type="text" id="propertyName" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Landlord *</label>
                        <select id="propertyLandlord" class="form-control" required>
                            <option value="">Select landlord...</option>
                        </select>
                        <small style="color: #666; margin-top: 0.25rem; display: block;">
                            Don't see the landlord? <a href="#" onclick="openAddLandlordModal(); return false;">Add New Landlord</a>
                        </small>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Total Acres *</label>
                            <input type="number" id="propertyTotalAcres" class="form-control" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Farmable Acres</label>
                            <input type="number" id="propertyFarmableAcres" class="form-control" step="0.01">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea id="propertyDescription" class="form-control" rows="2"></textarea>
                    </div>

                    <h4 style="margin: 1.5rem 0 1rem; color: #2c5f2d; font-size: 1rem;">Location</h4>

                    <div class="form-group">
                        <label class="form-label">Street Address</label>
                        <input type="text" id="propertyStreet" class="form-control">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">City</label>
                            <input type="text" id="propertyCity" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">County</label>
                            <input type="text" id="propertyCounty" class="form-control">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">State</label>
                            <input type="text" id="propertyState" class="form-control" value="CO">
                        </div>
                        <div class="form-group">
                            <label class="form-label">ZIP Code</label>
                            <input type="text" id="propertyZip" class="form-control">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Legal Description</label>
                        <textarea id="propertyLegalDescription" class="form-control" rows="2"></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Parcel ID</label>
                        <input type="text" id="propertyParcelId" class="form-control">
                    </div>

                    <h4 style="margin: 1.5rem 0 1rem; color: #2c5f2d; font-size: 1rem;">Lease Information</h4>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Lease Type</label>
                            <select id="propertyLeaseType" class="form-control">
                                <option value="cash_rent">Cash Rent</option>
                                <option value="crop_share">Crop Share</option>
                                <option value="custom_work">Custom Work</option>
                                <option value="flexible_lease">Flexible Lease</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Lease Rate ($/acre or %)</label>
                            <input type="number" id="propertyLeaseRate" class="form-control" step="0.01">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Lease Start Date</label>
                            <input type="date" id="propertyLeaseStart" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Lease End Date</label>
                            <input type="date" id="propertyLeaseEnd" class="form-control">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Market Value (Estimated)</label>
                        <input type="number" id="propertyMarketValue" class="form-control" step="1000">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea id="propertyNotes" class="form-control" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('propertyModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="savePropertyBtn">Save Property</button>
                </div>
            </form>
        </div>
    `,

    field: `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title" id="fieldModalTitle">Add Field</h3>
                <button class="modal-close" onclick="closeModal('fieldModal')">&times;</button>
            </div>
            <form id="fieldForm">
                <div class="modal-body">
                    <input type="hidden" id="fieldId">

                    <div class="form-group">
                        <label class="form-label">Field Name *</label>
                        <input type="text" id="fieldName" class="form-control" required placeholder="e.g., North 40, Home Field">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Property *</label>
                            <select id="fieldProperty" class="form-control" required onchange="updateFieldLandlord()">
                                <option value="">Select property...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Field Number</label>
                            <input type="text" id="fieldNumber" class="form-control" placeholder="Optional">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Acres *</label>
                        <input type="number" id="fieldAcres" class="form-control" step="0.01" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea id="fieldDescription" class="form-control" rows="2"></textarea>
                    </div>

                    <h4 style="margin: 1.5rem 0 1rem; color: #2c5f2d; font-size: 1rem;">Soil Information</h4>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Soil Type</label>
                            <input type="text" id="fieldSoilType" class="form-control" placeholder="e.g., Loam, Clay">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Soil Class</label>
                            <input type="text" id="fieldSoilClass" class="form-control" placeholder="e.g., Class I, II">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="checkbox" id="fieldDrainageTile">
                                <span>Drainage Tile Installed</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="checkbox" id="fieldIrrigated">
                                <span>Irrigated</span>
                            </label>
                        </div>
                    </div>

                    <h4 style="margin: 1.5rem 0 1rem; color: #2c5f2d; font-size: 1rem;">Current Crop</h4>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Crop Type</label>
                            <select id="fieldCropType" class="form-control">
                                <option value="">None / Fallow</option>
                                <option value="corn">Corn</option>
                                <option value="soybeans">Soybeans</option>
                                <option value="wheat">Wheat</option>
                                <option value="milo">Milo (Sorghum)</option>
                                <option value="sunflower">Sunflower</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Crop Year</label>
                            <input type="number" id="fieldCropYear" class="form-control" value="${new Date().getFullYear()}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Variety/Hybrid</label>
                        <input type="text" id="fieldVariety" class="form-control" placeholder="e.g., Pioneer 1234">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Planting Date</label>
                            <input type="date" id="fieldPlantingDate" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Expected Harvest Date</label>
                            <input type="date" id="fieldHarvestDate" class="form-control">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Estimated Yield (bu/acre)</label>
                        <input type="number" id="fieldEstimatedYield" class="form-control" step="0.1">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Field Status</label>
                        <select id="fieldStatus" class="form-control">
                            <option value="active">Active</option>
                            <option value="fallow">Fallow</option>
                            <option value="CRP">CRP</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea id="fieldNotes" class="form-control" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('fieldModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="saveFieldBtn">Save Field</button>
                </div>
            </form>
        </div>
    `,

    transaction: `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title" id="transactionModalTitle">Add Transaction</h3>
                <button class="modal-close" onclick="closeModal('transactionModal')">&times;</button>
            </div>
            <form id="transactionForm">
                <div class="modal-body">
                    <input type="hidden" id="transactionId">

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Transaction Type *</label>
                            <select id="transactionType" class="form-control" required onchange="updateTransactionCategories()">
                                <option value="">Select type...</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Category *</label>
                            <select id="transactionCategory" class="form-control" required>
                                <option value="">Select type first...</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description *</label>
                        <input type="text" id="transactionDescription" class="form-control" required placeholder="e.g., Corn sale to ADM">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Amount ($) *</label>
                            <input type="number" id="transactionAmount" class="form-control" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date *</label>
                            <input type="date" id="transactionDate" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Property (Optional)</label>
                            <select id="transactionProperty" class="form-control" onchange="updateTransactionFields()">
                                <option value="">General / All properties</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Field (Optional)</label>
                            <select id="transactionField" class="form-control">
                                <option value="">General / All fields</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Payment Method</label>
                            <select id="transactionPaymentMethod" class="form-control">
                                <option value="check">Check</option>
                                <option value="cash">Cash</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Check/Invoice #</label>
                            <input type="text" id="transactionReference" class="form-control">
                        </div>
                    </div>

                    <div id="cropDetailsSection" style="display: none;">
                        <h4 style="margin: 1.5rem 0 1rem; color: #2c5f2d; font-size: 1rem;">Crop Sale Details</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Bushels Sold</label>
                                <input type="number" id="transactionBushels" class="form-control" step="0.01">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Price per Bushel</label>
                                <input type="number" id="transactionPricePerBushel" class="form-control" step="0.01">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Buyer</label>
                            <input type="text" id="transactionBuyer" class="form-control">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Vendor/Customer Name</label>
                        <input type="text" id="transactionVendor" class="form-control">
                    </div>

                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" id="transactionTaxDeductible">
                            <span>Tax Deductible</span>
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea id="transactionNotes" class="form-control" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('transactionModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="saveTransactionBtn">Save Transaction</button>
                </div>
            </form>
        </div>
    `,

    landlord: `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Add New Landlord</h3>
                <button class="modal-close" onclick="closeModal('landlordModal')">&times;</button>
            </div>
            <form id="landlordForm">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">First Name *</label>
                            <input type="text" id="landlordFirstName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Last Name *</label>
                            <input type="text" id="landlordLastName" class="form-control" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" id="landlordEmail" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Phone</label>
                        <input type="tel" id="landlordPhone" class="form-control">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Username *</label>
                        <input type="text" id="landlordUsername" class="form-control" required>
                        <small style="color: #666;">This will be used for portal login</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Temporary Password *</label>
                        <input type="password" id="landlordPassword" class="form-control" required>
                        <small style="color: #666;">They'll be asked to change this on first login</small>
                    </div>

                    <h4 style="margin: 1.5rem 0 1rem; color: #2c5f2d; font-size: 1rem;">Address</h4>

                    <div class="form-group">
                        <label class="form-label">Street</label>
                        <input type="text" id="landlordStreet" class="form-control">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">City</label>
                            <input type="text" id="landlordCity" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">State</label>
                            <input type="text" id="landlordState" class="form-control" value="CO">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">ZIP Code</label>
                        <input type="text" id="landlordZip" class="form-control">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('landlordModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Landlord</button>
                </div>
            </form>
        </div>
    `
};

// Transaction categories by type
const transactionCategories = {
    income: [
        { value: 'crop_sale', label: 'Crop Sale' },
        { value: 'custom_work', label: 'Custom Work' },
        { value: 'government_payment', label: 'Government Payment' },
        { value: 'hunting_lease', label: 'Hunting Lease' },
        { value: 'other_income', label: 'Other Income' }
    ],
    expense: [
        { value: 'seed', label: 'Seed' },
        { value: 'fertilizer', label: 'Fertilizer' },
        { value: 'chemicals', label: 'Chemicals' },
        { value: 'fuel', label: 'Fuel' },
        { value: 'labor', label: 'Labor' },
        { value: 'repairs', label: 'Repairs & Maintenance' },
        { value: 'equipment_rental', label: 'Equipment Rental' },
        { value: 'insurance', label: 'Insurance' },
        { value: 'utilities', label: 'Utilities' },
        { value: 'rent_lease_payment', label: 'Rent/Lease Payment' },
        { value: 'property_tax', label: 'Property Tax' },
        { value: 'loan_payment', label: 'Loan Payment' },
        { value: 'equipment_purchase', label: 'Equipment Purchase' },
        { value: 'supplies', label: 'Supplies' },
        { value: 'professional_fees', label: 'Professional Fees' },
        { value: 'other_expense', label: 'Other Expense' }
    ]
};

// Show modal
function showModal(modalId, template) {
    let modal = document.getElementById(modalId);

    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = template;
    modal.classList.add('active');

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Update transaction categories based on type
function updateTransactionCategories() {
    const type = document.getElementById('transactionType').value;
    const categorySelect = document.getElementById('transactionCategory');
    const cropDetails = document.getElementById('cropDetailsSection');

    categorySelect.innerHTML = '<option value="">Select category...</option>';

    if (type && transactionCategories[type]) {
        transactionCategories[type].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.label;
            categorySelect.appendChild(option);
        });
    }

    // Show crop details for crop sales
    if (type === 'income') {
        cropDetails.style.display = 'block';
    } else {
        cropDetails.style.display = 'none';
    }
}

// Update transaction fields based on property
function updateTransactionFields() {
    const propertyId = document.getElementById('transactionProperty').value;
    const fieldSelect = document.getElementById('transactionField');

    fieldSelect.innerHTML = '<option value="">General / All fields</option>';

    if (propertyId) {
        const propertyFields = fields.filter(f => f.property?._id === propertyId);
        propertyFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field._id;
            option.textContent = field.name;
            fieldSelect.appendChild(option);
        });
    }
}

// Update field landlord automatically
function updateFieldLandlord() {
    const propertyId = document.getElementById('fieldProperty').value;
    const property = properties.find(p => p._id === propertyId);
    // Landlord is automatically set from property on backend
}

// Populate landlord dropdown
function populateLandlordDropdown() {
    const select = document.getElementById('propertyLandlord');
    select.innerHTML = '<option value="">Select landlord...</option>';

    landlords.forEach(landlord => {
        const option = document.createElement('option');
        option.value = landlord._id;
        option.textContent = `${landlord.firstName || ''} ${landlord.lastName || ''}`.trim() || landlord.username;
        select.appendChild(option);
    });
}

// Populate property dropdown
function populatePropertyDropdown(selectId = 'fieldProperty') {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select property...</option>';

    properties.forEach(property => {
        const option = document.createElement('option');
        option.value = property._id;
        option.textContent = property.name;
        option.dataset.landlord = property.landlord?._id;
        select.appendChild(option);
    });
}

// Open Add Landlord Modal
function openAddLandlordModal() {
    showModal('landlordModal', modalTemplates.landlord);

    document.getElementById('landlordForm').onsubmit = async (e) => {
        e.preventDefault();
        await saveLandlord();
    };
}

// Save landlord
async function saveLandlord() {
    const landlordData = {
        firstName: document.getElementById('landlordFirstName').value,
        lastName: document.getElementById('landlordLastName').value,
        email: document.getElementById('landlordEmail').value,
        phone: document.getElementById('landlordPhone').value,
        username: document.getElementById('landlordUsername').value,
        password: document.getElementById('landlordPassword').value,
        role: 'landlord',
        address: {
            street: document.getElementById('landlordStreet').value,
            city: document.getElementById('landlordCity').value,
            state: document.getElementById('landlordState').value,
            zip: document.getElementById('landlordZip').value
        }
    };

    try {
        const response = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(landlordData)
        });

        showAlert('Landlord added successfully!', 'success');
        closeModal('landlordModal');

        // Reload landlords and update dropdown
        await loadProperties(); // This will update landlords list
        await loadLandlords();
        populateLandlordDropdown();

    } catch (error) {
        showAlert('Error adding landlord: ' + error.message, 'error');
    }
}
