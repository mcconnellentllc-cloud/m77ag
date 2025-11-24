// Custom M77AG Master Workbook Parser

// Parse M77AG Master Workbook
async function parseM77AGMasterWorkbook(file) {
    const data = await readFile(file);
    const workbook = XLSX.read(data, { type: 'binary' });

    const result = {
        properties: [],
        fields: [],
        landlords: new Map(),
        ledgerEntries: []
    };

    // Parse OVERVIEW sheet (rental agreements)
    if (workbook.SheetNames.includes('OVERVIEW')) {
        const sheet = workbook.Sheets['OVERVIEW'];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find header row (row with "CLIENT", "FARM", etc.)
        let headerRow = null;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            if (rows[i].includes('CLIENT') || rows[i].includes('FARM')) {
                headerRow = i;
                break;
            }
        }

        if (headerRow !== null) {
            const headers = rows[headerRow];
            const clientIdx = headers.indexOf('CLIENT');
            const farmIdx = headers.indexOf('FARM');
            const fieldIdx = headers.indexOf('FIELD');
            const acresIdx = headers.indexOf('ACRES');
            const rateIdx = headers.findIndex(h => h && h.includes('RENTAL RATE'));
            const totalRentIdx = headers.findIndex(h => h && h.includes('TOTAL RENT'));
            const amtOwedIdx = headers.findIndex(h => h && h.includes('AMT OWED'));

            // Group by farm to create properties
            const farmMap = new Map();

            for (let i = headerRow + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row[clientIdx] && !row[farmIdx]) continue;

                const client = row[clientIdx] || 'MCC. ENT';
                const farm = row[farmIdx];
                const field = row[fieldIdx];
                const acres = parseFloat(row[acresIdx]) || 0;
                const rentalRate = parseFloat(row[rateIdx]) || 0;
                const totalRent = parseFloat(row[totalRentIdx]) || 0;
                const amtOwed = parseFloat(row[amtOwedIdx]) || 0;

                if (!farm || !field) continue;

                // Add to farm map
                if (!farmMap.has(farm)) {
                    farmMap.set(farm, {
                        name: farm,
                        client: client,
                        fields: [],
                        totalAcres: 0,
                        totalRent: 0
                    });
                }

                const farmData = farmMap.get(farm);
                farmData.fields.push({
                    name: field,
                    acres: acres
                });
                farmData.totalAcres += acres;
                farmData.totalRent += totalRent;

                // Track landlord
                if (!result.landlords.has(client)) {
                    result.landlords.set(client, {
                        name: client,
                        email: client.toLowerCase().replace(/[^a-z0-9]/g, '') + '@m77ag.com'
                    });
                }

                // Create ledger entry if there's rent owed
                if (amtOwed > 0) {
                    result.ledgerEntries.push({
                        client: client,
                        farm: farm,
                        field: field,
                        amount: amtOwed,
                        description: `Rent owed for ${field}`,
                        rentalRate: rentalRate
                    });
                }
            }

            // Convert farm map to properties array
            farmMap.forEach((farmData, farmName) => {
                result.properties.push({
                    name: farmName,
                    landlord: farmData.client,
                    totalAcres: farmData.totalAcres,
                    farmableAcres: farmData.totalAcres,
                    fields: farmData.fields,
                    leaseRate: farmData.totalRent / farmData.totalAcres,
                    leaseType: 'cash_rent'
                });
            });
        }
    }

    // Parse ROTATION PROGRAMS sheet
    if (workbook.SheetNames.includes('ROTATION  PROGRAMS')) {
        const sheet = workbook.Sheets['ROTATION  PROGRAMS'];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find header row
        let headerRow = null;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            if (rows[i].includes('CLIENT') || rows[i].includes('FARM')) {
                headerRow = i;
                break;
            }
        }

        if (headerRow !== null) {
            const headers = rows[headerRow];
            const clientIdx = headers.findIndex(h => h && h.includes('CLIENT'));
            const farmIdx = headers.indexOf('FARM');
            const fieldIdx = headers.indexOf('FIELD');
            const legalIdx = headers.indexOf('LEGAL');
            const fsaIdx = headers.findIndex(h => h && h.includes('FSA'));
            const tractIdx = headers.indexOf('TRACT');
            const acresIdx = headers.indexOf('ACRES');
            const kindIdx = headers.indexOf('KIND');
            const countyIdx = headers.indexOf('COUNTY');

            // Find year columns (2018 CROP, 2019 CROP, etc.)
            const yearColumns = [];
            for (let j = 0; j < headers.length; j++) {
                const header = headers[j];
                if (header && header.includes('CROP') && header.match(/\d{4}/)) {
                    const year = parseInt(header.match(/\d{4}/)[0]);
                    yearColumns.push({ index: j, year: year });
                }
            }

            // Parse each row
            for (let i = headerRow + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row[farmIdx]) continue;

                const client = row[clientIdx] || 'MCC. ENT';
                const farm = row[farmIdx];
                const field = row[fieldIdx];
                const legal = row[legalIdx];
                const fsaFarm = row[fsaIdx];
                const tract = row[tractIdx];
                const acres = parseFloat(row[acresIdx]) || 0;
                const kind = row[kindIdx];
                const county = row[countyIdx];

                if (!field) continue;

                // Build crop history
                const cropHistory = [];
                yearColumns.forEach(({ index, year }) => {
                    const crop = row[index];
                    if (crop) {
                        cropHistory.push({
                            year: year,
                            cropType: normalizeCropType(crop)
                        });
                    }
                });

                // Add field data
                result.fields.push({
                    name: field,
                    farm: farm,
                    client: client,
                    acres: acres,
                    legalDescription: legal,
                    fsaFarm: fsaFarm,
                    tract: tract,
                    kind: kind,
                    county: county,
                    cropHistory: cropHistory
                });
            }
        }
    }

    return result;
}

// Normalize crop type from spreadsheet format
function normalizeCropType(crop) {
    if (!crop) return '';

    const cropStr = crop.toString().toLowerCase().trim();

    // Map various formats to standard crop types
    if (cropStr.includes('corn') || cropStr.includes('crn')) return 'corn';
    if (cropStr.includes('soy') || cropStr.includes('bean')) return 'soybeans';
    if (cropStr.includes('wheat') || cropStr.includes('wht')) return 'wheat';
    if (cropStr.includes('milo') || cropStr.includes('sorghum')) return 'milo';
    if (cropStr.includes('sunflower') || cropStr.includes('sun')) return 'sunflower';
    if (cropStr.includes('fallow') || cropStr.includes('idle')) return 'fallow';
    if (cropStr.includes('pasture') || cropStr.includes('grass')) return 'fallow';

    return 'other';
}

// Open M77AG Master Workbook import
function openM77AGImport() {
    const modalHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3 class="modal-title">Import M77AG Master Workbook</h3>
                <button class="modal-close" onclick="closeModal('m77agImportModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="alert alert-info">
                    <strong>📊 Custom Import for Your Master Workbook</strong><br>
                    This will import data from your "2025 M77AG MASTER WORKBOOK.xlsm" file.
                    It will process the OVERVIEW and ROTATION PROGRAMS sheets.
                </div>

                <div class="form-group">
                    <label class="form-label">Select Your Master Workbook</label>
                    <input type="file" id="m77agFile" class="form-control"
                           accept=".xlsx,.xlsm,.xls"
                           onchange="previewM77AGImport(event)">
                </div>

                <div id="m77agPreview" style="margin-top: 1.5rem; display: none;">
                    <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Preview:</h4>
                    <div id="m77agPreviewContent" style="font-size: 0.85rem; max-height: 300px; overflow: auto; background: #f8f9fa; padding: 1rem; border-radius: 4px;">
                    </div>
                    <div id="m77agStats" style="margin-top: 1rem; padding: 1rem; background: #e7f3ff; border-radius: 4px;">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('m77agImportModal')">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="processM77AGImport()" id="m77agImportBtn" disabled>
                    Import Workbook
                </button>
            </div>
        </div>
    `;

    showModal('m77agImportModal', modalHTML);
}

// Preview M77AG import
async function previewM77AGImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const importBtn = document.getElementById('m77agImportBtn');
    const preview = document.getElementById('m77agPreview');
    const previewContent = document.getElementById('m77agPreviewContent');
    const statsDiv = document.getElementById('m77agStats');

    try {
        showAlert('Parsing workbook...', 'info');
        const parsedData = await parseM77AGMasterWorkbook(file);

        window.m77agParsedData = parsedData;

        // Show preview
        preview.style.display = 'block';

        let previewHTML = '';

        if (parsedData.properties.length > 0) {
            previewHTML += `<strong>Properties (${parsedData.properties.length}):</strong><br>`;
            parsedData.properties.slice(0, 5).forEach(prop => {
                previewHTML += `- ${prop.name} (${prop.totalAcres.toFixed(1)} acres) - ${prop.fields.length} fields<br>`;
            });
            if (parsedData.properties.length > 5) {
                previewHTML += `... and ${parsedData.properties.length - 5} more<br>`;
            }
            previewHTML += '<br>';
        }

        if (parsedData.fields.length > 0) {
            previewHTML += `<strong>Fields with Rotation Data (${parsedData.fields.length}):</strong><br>`;
            parsedData.fields.slice(0, 5).forEach(field => {
                previewHTML += `- ${field.name} (${field.acres} acres) - ${field.farm} - ${field.cropHistory.length} years history<br>`;
            });
            if (parsedData.fields.length > 5) {
                previewHTML += `... and ${parsedData.fields.length - 5} more<br>`;
            }
        }

        previewContent.innerHTML = previewHTML;

        const totalAcres = parsedData.properties.reduce((sum, p) => sum + p.totalAcres, 0);
        const totalRentOwed = parsedData.ledgerEntries.reduce((sum, e) => sum + e.amount, 0);

        statsDiv.innerHTML = `
            <strong>📊 Import Summary:</strong><br>
            ${parsedData.landlords.size} landlord(s)<br>
            ${parsedData.properties.length} properties (farms)<br>
            ${parsedData.fields.length} fields<br>
            ${totalAcres.toFixed(1)} total acres<br>
            ${parsedData.ledgerEntries.length} ledger entries (rent owed)<br>
            $${totalRentOwed.toLocaleString()} total rent owed
        `;

        importBtn.disabled = false;

    } catch (error) {
        showAlert('Error parsing workbook: ' + error.message, 'error');
        console.error(error);
        importBtn.disabled = true;
    }
}

// Process M77AG import
async function processM77AGImport() {
    if (!window.m77agParsedData) {
        showAlert('Please select a file first', 'error');
        return;
    }

    const data = window.m77agParsedData;
    const importBtn = document.getElementById('m77agImportBtn');

    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';

    try {
        // Use the same import logic as the enhanced bulk import
        // Step 1: Create landlords
        showAlert('Creating landlord accounts...', 'info');
        const landlordMap = new Map();

        for (const [name, landlordData] of data.landlords) {
            try {
                const response = await apiCall('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({
                        firstName: name.split(' ')[0] || name,
                        lastName: name.split(' ').slice(1).join(' ') || 'Farms',
                        email: landlordData.email,
                        username: landlordData.email,
                        password: 'TempPassword123!',
                        role: 'landlord'
                    })
                });
                landlordMap.set(name, response.user._id);
            } catch (error) {
                console.log('Landlord might already exist:', name);
            }
        }

        // Reload to get landlord IDs
        await loadProperties();
        await loadLandlords();

        // Step 2: Create properties
        showAlert(`Creating ${data.properties.length} properties...`, 'info');
        const propertyMap = new Map();

        for (const propData of data.properties) {
            const landlord = landlords.find(l => l.email && l.email.includes(propData.landlord.toLowerCase().replace(/[^a-z0-9]/g, '')));

            if (!landlord) {
                console.warn(`Landlord not found for: ${propData.name}`);
                continue;
            }

            const propertyPayload = {
                name: propData.name,
                landlord: landlord._id,
                totalAcres: propData.totalAcres,
                farmableAcres: propData.farmableAcres,
                leaseDetails: {
                    leaseType: propData.leaseType,
                    leaseRate: propData.leaseRate
                }
            };

            const response = await apiCall('/properties', {
                method: 'POST',
                body: JSON.stringify(propertyPayload)
            });

            propertyMap.set(propData.name, response.property._id);
        }

        // Step 3: Create fields with rotation data
        showAlert(`Creating ${data.fields.length} fields...`, 'info');
        await loadProperties();

        for (const fieldData of data.fields) {
            const property = properties.find(p => p.name === fieldData.farm);

            if (!property) {
                console.warn(`Property not found for field: ${fieldData.name}`);
                continue;
            }

            // Get current year crop
            const currentYear = new Date().getFullYear();
            const currentCrop = fieldData.cropHistory.find(c => c.year === currentYear);

            const fieldPayload = {
                name: fieldData.name,
                property: property._id,
                landlord: property.landlord._id,
                acres: fieldData.acres,
                legalDescription: fieldData.legalDescription,
                currentCrop: currentCrop ? {
                    cropType: currentCrop.cropType,
                    year: currentYear
                } : {},
                cropHistory: fieldData.cropHistory.filter(c => c.year < currentYear),
                status: 'active'
            };

            await apiCall('/fields', {
                method: 'POST',
                body: JSON.stringify(fieldPayload)
            });
        }

        showAlert(`✅ Import complete! Created ${data.properties.length} properties and ${data.fields.length} fields with rotation history.`, 'success');

        closeModal('m77agImportModal');

        // Reload all data
        await Promise.all([
            loadProperties(),
            loadFields(),
            loadLandlords()
        ]);

        renderOverview();
        renderRotationTable();

    } catch (error) {
        showAlert('Error during import: ' + error.message, 'error');
        console.error(error);
    } finally {
        importBtn.disabled = false;
        importBtn.textContent = 'Import Workbook';
    }
}
