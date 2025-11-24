// Enhanced Bulk Import System with Excel Support

// Open enhanced bulk import modal
function openEnhancedBulkImport() {
    const modalHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3 class="modal-title">Bulk Import Properties & Fields</h3>
                <button class="modal-close" onclick="closeModal('bulkImportEnhancedModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="alert alert-info">
                    <strong>📊 Import your complete farm data in one step!</strong><br>
                    Upload an Excel or CSV file with your properties and fields, or download our template to get started.
                </div>

                <div style="margin-bottom: 2rem;">
                    <h4 style="margin-bottom: 1rem; font-size: 1rem;">Step 1: Download Template</h4>
                    <div style="display: flex; gap: 1rem;">
                        <button type="button" class="btn btn-secondary" onclick="downloadPropertiesTemplate()">
                            📥 Download Properties Template
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="downloadFieldsTemplate()">
                            📥 Download Fields Template
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="downloadCombinedTemplate()">
                            📥 Download Combined Template
                        </button>
                    </div>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h4 style="margin-bottom: 1rem; font-size: 1rem;">Step 2: Fill In Your Data</h4>
                    <p style="color: #666; font-size: 0.9rem;">
                        Open the template in Excel, fill in your farm information, and save the file.
                    </p>
                </div>

                <div>
                    <h4 style="margin-bottom: 1rem; font-size: 1rem;">Step 3: Upload File</h4>
                    <div class="form-group">
                        <label class="form-label">Select Excel or CSV File</label>
                        <input type="file" id="bulkImportFile" class="form-control"
                               accept=".xlsx,.xls,.csv"
                               onchange="previewBulkImport(event)">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Import Type</label>
                        <select id="bulkImportType" class="form-control">
                            <option value="combined">Properties & Fields (Combined)</option>
                            <option value="properties">Properties Only</option>
                            <option value="fields">Fields Only</option>
                        </select>
                    </div>
                </div>

                <div id="bulkImportPreview" style="margin-top: 1.5rem; display: none;">
                    <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Preview:</h4>
                    <div id="bulkPreviewContent" style="max-height: 300px; overflow: auto; font-size: 0.85rem; background: #f8f9fa; padding: 1rem; border-radius: 4px;">
                    </div>
                    <div id="bulkImportStats" style="margin-top: 1rem; padding: 1rem; background: #e7f3ff; border-radius: 4px;">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('bulkImportEnhancedModal')">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="processBulkImportEnhanced()" id="bulkImportBtn" disabled>
                    Import Data
                </button>
            </div>
        </div>
    `;

    showModal('bulkImportEnhancedModal', modalHTML);
}

// Download templates
function downloadPropertiesTemplate() {
    const wb = XLSX.utils.book_new();

    const propertiesData = [
        ['Property Name', 'Landlord First Name', 'Landlord Last Name', 'Landlord Email', 'Total Acres', 'Farmable Acres', 'City', 'County', 'State', 'Lease Type', 'Lease Rate', 'Notes'],
        ['Smith Farm', 'John', 'Smith', 'john.smith@example.com', '320', '310', 'Sterling', 'Logan', 'CO', 'cash_rent', '150', 'Good soil, irrigation available'],
        ['Jones Ranch', 'Mary', 'Jones', 'mary.jones@example.com', '480', '460', 'Fleming', 'Logan', 'CO', 'crop_share', '33', 'Dryland, needs fertilizer']
    ];

    const ws = XLSX.utils.aoa_to_sheet(propertiesData);

    // Set column widths
    ws['!cols'] = [
        {wch: 15}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 12}, {wch: 12},
        {wch: 12}, {wch: 12}, {wch: 8}, {wch: 12}, {wch: 12}, {wch: 30}
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Properties');
    XLSX.writeFile(wb, 'M77AG_Properties_Template.xlsx');

    showAlert('Properties template downloaded! Fill it in and upload.', 'success');
}

function downloadFieldsTemplate() {
    const wb = XLSX.utils.book_new();

    const fieldsData = [
        ['Property Name', 'Field Name', 'Field Number', 'Acres', 'Soil Type', 'Current Crop 2024', 'Crop 2023', 'Crop 2022', 'Crop 2021', 'Status', 'Notes'],
        ['Smith Farm', 'North 40', 'N-40', '40.5', 'Loam', 'corn', 'soybeans', 'corn', 'soybeans', 'active', 'Good drainage'],
        ['Smith Farm', 'South Field', 'S-80', '82.3', 'Clay Loam', 'soybeans', 'wheat', 'soybeans', 'corn', 'active', 'Needs tile'],
        ['Jones Ranch', 'East Quarter', 'E-160', '160', 'Sandy Loam', 'corn', 'corn', 'fallow', 'wheat', 'active', 'Dryland']
    ];

    const ws = XLSX.utils.aoa_to_sheet(fieldsData);

    // Set column widths
    ws['!cols'] = [
        {wch: 15}, {wch: 15}, {wch: 12}, {wch: 10}, {wch: 12},
        {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 30}
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Fields');
    XLSX.writeFile(wb, 'M77AG_Fields_Template.xlsx');

    showAlert('Fields template downloaded! Fill it in and upload.', 'success');
}

function downloadCombinedTemplate() {
    const wb = XLSX.utils.book_new();

    // Properties sheet
    const propertiesData = [
        ['Property Name', 'Landlord First Name', 'Landlord Last Name', 'Landlord Email', 'Total Acres', 'Farmable Acres', 'City', 'County', 'State', 'Lease Type', 'Lease Rate', 'Notes'],
        ['Smith Farm', 'John', 'Smith', 'john.smith@example.com', '320', '310', 'Sterling', 'Logan', 'CO', 'cash_rent', '150', ''],
        ['Jones Ranch', 'Mary', 'Jones', 'mary.jones@example.com', '480', '460', 'Fleming', 'Logan', 'CO', 'crop_share', '33', '']
    ];

    const wsProperties = XLSX.utils.aoa_to_sheet(propertiesData);
    wsProperties['!cols'] = [
        {wch: 15}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 12}, {wch: 12},
        {wch: 12}, {wch: 12}, {wch: 8}, {wch: 12}, {wch: 12}, {wch: 30}
    ];
    XLSX.utils.book_append_sheet(wb, wsProperties, 'Properties');

    // Fields sheet
    const fieldsData = [
        ['Property Name', 'Field Name', 'Field Number', 'Acres', 'Soil Type', 'Current Crop 2024', 'Crop 2023', 'Crop 2022', 'Crop 2021', 'Status', 'Notes'],
        ['Smith Farm', 'North 40', 'N-40', '40.5', 'Loam', 'corn', 'soybeans', 'corn', 'soybeans', 'active', ''],
        ['Smith Farm', 'South Field', 'S-80', '82.3', 'Clay Loam', 'soybeans', 'wheat', 'soybeans', 'corn', 'active', ''],
        ['Jones Ranch', 'East Quarter', 'E-160', '160', 'Sandy Loam', 'corn', 'corn', 'fallow', 'wheat', 'active', '']
    ];

    const wsFields = XLSX.utils.aoa_to_sheet(fieldsData);
    wsFields['!cols'] = [
        {wch: 15}, {wch: 15}, {wch: 12}, {wch: 10}, {wch: 12},
        {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 30}
    ];
    XLSX.utils.book_append_sheet(wb, wsFields, 'Fields');

    // Instructions sheet
    const instructionsData = [
        ['M77 AG Bulk Import Instructions'],
        [''],
        ['How to use this template:'],
        ['1. Fill in the Properties sheet with your farm properties'],
        ['2. Fill in the Fields sheet with your fields'],
        ['3. Make sure Property Name matches exactly between sheets'],
        ['4. Save the file and upload it to the M77 AG Dashboard'],
        [''],
        ['Lease Types:'],
        ['- cash_rent: Fixed $ per acre'],
        ['- crop_share: Percentage split'],
        ['- custom_work: Service only'],
        ['- flexible_lease: Variable rate'],
        [''],
        ['Crop Types:'],
        ['corn, soybeans, wheat, milo, sunflower, fallow, other'],
        [''],
        ['Field Status:'],
        ['active, fallow, CRP, retired']
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{wch: 60}];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    XLSX.writeFile(wb, 'M77AG_Complete_Template.xlsx');

    showAlert('Combined template downloaded! Fill in both sheets and upload.', 'success');
}

// Global variable to store parsed data
let bulkImportData = null;

// Preview bulk import
async function previewBulkImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const importBtn = document.getElementById('bulkImportBtn');
    const preview = document.getElementById('bulkImportPreview');
    const previewContent = document.getElementById('bulkPreviewContent');
    const statsDiv = document.getElementById('bulkImportStats');

    try {
        const data = await readFile(file);
        const workbook = XLSX.read(data, { type: 'binary' });

        bulkImportData = {
            properties: [],
            fields: [],
            landlords: new Map()
        };

        // Parse properties sheet
        if (workbook.SheetNames.includes('Properties')) {
            const propertiesSheet = workbook.Sheets['Properties'];
            const propertiesJson = XLSX.utils.sheet_to_json(propertiesSheet);
            bulkImportData.properties = propertiesJson;

            // Extract unique landlords
            propertiesJson.forEach(prop => {
                const landlordKey = prop['Landlord Email'];
                if (landlordKey && !bulkImportData.landlords.has(landlordKey)) {
                    bulkImportData.landlords.set(landlordKey, {
                        firstName: prop['Landlord First Name'],
                        lastName: prop['Landlord Last Name'],
                        email: prop['Landlord Email']
                    });
                }
            });
        }

        // Parse fields sheet
        if (workbook.SheetNames.includes('Fields')) {
            const fieldsSheet = workbook.Sheets['Fields'];
            const fieldsJson = XLSX.utils.sheet_to_json(fieldsSheet);
            bulkImportData.fields = fieldsJson;
        }

        // Show preview
        preview.style.display = 'block';

        let previewHTML = '';
        if (bulkImportData.properties.length > 0) {
            previewHTML += `<strong>Properties (${bulkImportData.properties.length}):</strong><br>`;
            bulkImportData.properties.slice(0, 3).forEach(prop => {
                previewHTML += `- ${prop['Property Name']} (${prop['Total Acres']} acres) - ${prop['Landlord First Name']} ${prop['Landlord Last Name']}<br>`;
            });
            if (bulkImportData.properties.length > 3) {
                previewHTML += `... and ${bulkImportData.properties.length - 3} more<br>`;
            }
            previewHTML += '<br>';
        }

        if (bulkImportData.fields.length > 0) {
            previewHTML += `<strong>Fields (${bulkImportData.fields.length}):</strong><br>`;
            bulkImportData.fields.slice(0, 3).forEach(field => {
                previewHTML += `- ${field['Field Name']} (${field['Acres']} acres) - ${field['Property Name']}<br>`;
            });
            if (bulkImportData.fields.length > 3) {
                previewHTML += `... and ${bulkImportData.fields.length - 3} more<br>`;
            }
        }

        previewContent.innerHTML = previewHTML;

        statsDiv.innerHTML = `
            <strong>📊 Import Summary:</strong><br>
            ${bulkImportData.landlords.size} unique landlords<br>
            ${bulkImportData.properties.length} properties<br>
            ${bulkImportData.fields.length} fields<br>
            Total acres: ${bulkImportData.properties.reduce((sum, p) => sum + (parseFloat(p['Total Acres']) || 0), 0).toFixed(1)}
        `;

        importBtn.disabled = false;

    } catch (error) {
        showAlert('Error reading file: ' + error.message, 'error');
        importBtn.disabled = true;
    }
}

// Read file as binary
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsBinaryString(file);
    });
}

// Process bulk import
async function processBulkImportEnhanced() {
    if (!bulkImportData) {
        showAlert('Please select a file first', 'error');
        return;
    }

    const importBtn = document.getElementById('bulkImportBtn');
    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';

    try {
        // Step 1: Create or find landlords
        const landlordMap = new Map();

        for (const [email, landlordData] of bulkImportData.landlords) {
            showAlert(`Creating landlord: ${landlordData.firstName} ${landlordData.lastName}...`, 'info');

            try {
                // Try to register new landlord
                const response = await apiCall('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({
                        firstName: landlordData.firstName,
                        lastName: landlordData.lastName,
                        email: landlordData.email,
                        username: landlordData.email,
                        password: 'TempPassword123!', // They'll change on first login
                        role: 'landlord'
                    })
                });

                landlordMap.set(email, response.user._id);
            } catch (error) {
                // Landlord might already exist, that's okay
                console.log('Landlord might already exist:', email);
            }
        }

        // Reload properties to get landlord IDs
        await loadProperties();
        await loadLandlords();

        // Step 2: Create properties
        showAlert(`Creating ${bulkImportData.properties.length} properties...`, 'info');

        const propertyMap = new Map();

        for (const propData of bulkImportData.properties) {
            const landlord = landlords.find(l => l.email === propData['Landlord Email']);

            if (!landlord) {
                console.warn(`Landlord not found for property: ${propData['Property Name']}`);
                continue;
            }

            const propertyPayload = {
                name: propData['Property Name'],
                landlord: landlord._id,
                totalAcres: parseFloat(propData['Total Acres']) || 0,
                farmableAcres: parseFloat(propData['Farmable Acres']) || null,
                address: {
                    city: propData['City'] || '',
                    county: propData['County'] || '',
                    state: propData['State'] || 'CO'
                },
                leaseDetails: {
                    leaseType: propData['Lease Type'] || 'cash_rent',
                    leaseRate: parseFloat(propData['Lease Rate']) || null
                },
                notes: propData['Notes'] || ''
            };

            const response = await apiCall('/properties', {
                method: 'POST',
                body: JSON.stringify(propertyPayload)
            });

            propertyMap.set(propData['Property Name'], response.property._id);
        }

        // Step 3: Create fields
        showAlert(`Creating ${bulkImportData.fields.length} fields...`, 'info');

        await loadProperties(); // Reload to get new properties

        for (const fieldData of bulkImportData.fields) {
            const property = properties.find(p => p.name === fieldData['Property Name']);

            if (!property) {
                console.warn(`Property not found for field: ${fieldData['Field Name']}`);
                continue;
            }

            const fieldPayload = {
                name: fieldData['Field Name'],
                property: property._id,
                landlord: property.landlord._id,
                fieldNumber: fieldData['Field Number'] || '',
                acres: parseFloat(fieldData['Acres']) || 0,
                soilType: fieldData['Soil Type'] || '',
                currentCrop: {
                    cropType: fieldData['Current Crop 2024'] || '',
                    year: 2024
                },
                cropHistory: [],
                status: fieldData['Status'] || 'active',
                notes: fieldData['Notes'] || ''
            };

            // Add crop history
            const years = [2023, 2022, 2021, 2020];
            years.forEach(year => {
                const cropType = fieldData[`Crop ${year}`];
                if (cropType) {
                    fieldPayload.cropHistory.push({
                        year: year,
                        cropType: cropType.toLowerCase()
                    });
                }
            });

            await apiCall('/fields', {
                method: 'POST',
                body: JSON.stringify(fieldPayload)
            });
        }

        showAlert(`✅ Import complete! Created ${bulkImportData.properties.length} properties and ${bulkImportData.fields.length} fields.`, 'success');

        closeModal('bulkImportEnhancedModal');

        // Reload all data
        await Promise.all([
            loadProperties(),
            loadFields(),
            loadLandlords()
        ]);

        renderOverview();

    } catch (error) {
        showAlert('Error during import: ' + error.message, 'error');
    } finally {
        importBtn.disabled = false;
        importBtn.textContent = 'Import Data';
    }
}
