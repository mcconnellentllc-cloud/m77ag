/**
 * Seed fields data - EXACT data from cropping rotation spreadsheet
 * DO NOT modify crop/acres/legal/FSA values - they come directly from the user
 *
 * County, Section/Twp/Rng parsed from legal descriptions.
 * KB Farms county data confirmed from CapitalInvestment records.
 * Soil types from KB Farms capital data (Hard = Pauli/Madsen, Sand = Michael crop, Pasture = pasture fields).
 * All KB Farms fields are owned (no landlord, no rent).
 *
 * County mapping by Township/Range (NE Colorado):
 *   T6N R46W = Phillips    T6N R47W = Phillips    T7N R47W = Phillips
 *   T7N R48W = Logan       T8N R47W = Phillips    T8N R48W = Logan
 *   T9N R46W = Sedgwick    T9N R47W = Sedgwick
 *
 * Property tax per acre (Colorado ag land, income-capitalization method):
 *   Phillips County: ~$1.50/ac cropland, ~$1.00/ac pasture
 *   Sedgwick County: ~$1.25/ac cropland, ~$0.85/ac pasture
 *   Logan County:    ~$1.10/ac cropland, ~$0.75/ac pasture
 */

require('dotenv').config();
const mongoose = require('mongoose');

const CroppingField = require('../models/croppingField');

const fields = [
  // =============================================
  // LAFARMS
  // =============================================
  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '10.S OURS', legal: 'NE4 2-6-47', fsaFarm: '3438', tract: '1768', acres: 79.20, crop2026: 'SORGHUM',
    county: 'Phillips', section: '2', township: '6N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '10.N OURS', legal: 'NE4 2-6-47', fsaFarm: '3438', tract: '1768', acres: 79.25, crop2026: 'CORN',
    county: 'Phillips', section: '2', township: '6N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '12.W BAM W', legal: 'SW4 14-7-48', fsaFarm: '3438', tract: '1750', acres: 78.60, crop2026: 'SORGHUM',
    county: 'Logan', section: '14', township: '7N', range: '48W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.10, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '12.E BAM W', legal: 'SW4 14-7-48', fsaFarm: '3438', tract: '1750', acres: 78.60, crop2026: 'FALLOW',
    county: 'Logan', section: '14', township: '7N', range: '48W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.10, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '13.W BAM E', legal: 'SE4 14-7-48', fsaFarm: '3438', tract: '3460', acres: 74.90, crop2026: 'WHEAT',
    county: 'Logan', section: '14', township: '7N', range: '48W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.10, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '13.E BAM E', legal: 'SE4 14-7-48', fsaFarm: '3438', tract: '3460', acres: 74.90, crop2026: 'CORN',
    county: 'Logan', section: '14', township: '7N', range: '48W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.10, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '14.N BAM S', legal: 'SW4 31-7-47', fsaFarm: '4211', tract: '1749', acres: 76.50, crop2026: 'SORGHUM',
    county: 'Phillips', section: '31', township: '7N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '14.S BAM S', legal: 'SW4 31-7-47', fsaFarm: '4211', tract: '1749', acres: 76.50, crop2026: 'FALLOW',
    county: 'Phillips', section: '31', township: '7N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '16.W BIG FIELD', legal: 'E2 7-9-46', fsaFarm: '3939', tract: '3938', acres: 80.09, crop2026: 'SORGHUM',
    county: 'Sedgwick', section: '7', township: '9N', range: '46W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '16.M BIG FIELD', legal: 'E2 7-9-46', fsaFarm: '3939', tract: '3938', acres: 62.85, crop2026: 'CORN',
    county: 'Sedgwick', section: '7', township: '9N', range: '46W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '16.E BIG FIELD', legal: 'E2 7-9-46', fsaFarm: '3939', tract: '3938', acres: 48.20, crop2026: 'CORN',
    county: 'Sedgwick', section: '7', township: '9N', range: '46W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '17.E MULVIHILL', legal: 'E2 13-9-47', fsaFarm: '3939', tract: '3938', acres: 79.85, crop2026: 'SORGHUM',
    county: 'Sedgwick', section: '13', township: '9N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '17.W MULVIHILL', legal: 'E2 13-9-47', fsaFarm: '3939', tract: '3938', acres: 79.85, crop2026: 'PEARL MILLET',
    county: 'Sedgwick', section: '13', township: '9N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '36.W POLE RD SEC 15', legal: 'NE 15-7-48', fsaFarm: '4062', tract: '4014', acres: 78.00, crop2026: 'WHEAT',
    county: 'Logan', section: '15', township: '7N', range: '48W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.10, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '101 WEST L', legal: 'NE4 1-8-48', fsaFarm: '4211', tract: '4049', acres: 184.76, crop2026: 'PASTURE',
    county: 'Logan', section: '1', township: '8N', range: '48W',
    soil: { type: 'Pasture' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 0.75, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '102 ROSCOE BIG PAST', legal: 'E/2 7-9-46', fsaFarm: '3939', tract: '3938', acres: 134.90, crop2026: 'PASTURE',
    county: 'Sedgwick', section: '7', township: '9N', range: '46W',
    soil: { type: 'Pasture' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 0.85, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '102 ROSCOE HOME', legal: 'W/4 8-9-46', fsaFarm: '3939', tract: '3938', acres: 160.10, crop2026: 'PASTURE',
    county: 'Sedgwick', section: '8', township: '9N', range: '46W',
    soil: { type: 'Pasture' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 0.85, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '1001 ROSCOE HOME', legal: 'W/4 8-9-46', fsaFarm: '3939', tract: '3938', acres: 5.44, crop2026: 'BUILDING SITE',
    county: 'Sedgwick', section: '8', township: '9N', range: '46W',
    lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 0.85, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '198 BAM E', legal: 'SE4 14-7-48', fsaFarm: '4211', tract: '3460', acres: 10.50, crop2026: 'WASTE',
    county: 'Logan', section: '14', township: '7N', range: '48W',
    lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 0.75, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '199 BAM S', legal: 'SW4 31-7-47', fsaFarm: '4211', tract: '1749', acres: 12.32, crop2026: 'WASTE',
    county: 'Phillips', section: '31', township: '7N', range: '47W',
    lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.00, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'LAFARMS', field: '4001 HQ HOME', legal: 'NW 4 8-8-47', fsaFarm: '2522', tract: '1534', acres: 8.00, crop2026: 'BUILDING SITE',
    county: 'Phillips', section: '8', township: '8N', range: '47W',
    lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  // =============================================
  // KBFARMS - Pauli Section (Phillips County, S17-T6N-R47W)
  // Soil: Hard. All owned. Tax: ~$1.50/ac cropland
  // =============================================
  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '20 NORTH', legal: 'N/2 17-6-47', fsaFarm: '3720', tract: '3815', acres: 64.80, crop2026: 'SORGHUM SUDAN',
    county: 'Phillips', section: '17', township: '6N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '21 SMALL', legal: 'NE 17-6-47', fsaFarm: '3720', tract: '3815', acres: 44.69, crop2026: 'TRITICALE',
    county: 'Phillips', section: '17', township: '6N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '22 TOP HILL', legal: 'N2 17-6-47', fsaFarm: '3720', tract: '3815', acres: 160.00, crop2026: 'TRITICALE',
    county: 'Phillips', section: '17', township: '6N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '23.E SW PAULI', legal: 'SW 17-6-47', fsaFarm: '3720', tract: '3815', acres: 38.60, crop2026: 'CORN',
    county: 'Phillips', section: '17', township: '6N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '23.W SW PAULI', legal: 'SW 17-6-47', fsaFarm: '3720', tract: '3815', acres: 65.40, crop2026: 'WHEAT',
    county: 'Phillips', section: '17', township: '6N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '24.E SE PAULI', legal: 'SE 17-6-47', fsaFarm: '3720', tract: '3815', acres: 64.20, crop2026: 'SORGHUM',
    county: 'Phillips', section: '17', township: '6N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '24.W SE PAULI', legal: 'SE 17-6-47', fsaFarm: '3720', tract: '3815', acres: 64.20, crop2026: 'FALLOW',
    county: 'Phillips', section: '17', township: '6N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  // =============================================
  // KBFARMS - Michael Section (Sedgwick County, S13-T9N-R47W)
  // Soil: Sand (crop), Pasture (pasture). All owned. Tax: ~$1.25/ac crop, ~$0.85/ac pasture
  // =============================================
  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '25.C NW MICHAEL CROP', legal: 'NW13-9-47', fsaFarm: '3720', tract: '3815', acres: 107.90, crop2026: 'PEARL MILLET',
    county: 'Sedgwick', section: '13', township: '9N', range: '47W',
    soil: { type: 'Sand', class: 'III' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '25.P NW MICHAEL PAST', legal: 'NW13-9-47', fsaFarm: '3720', tract: '3815', acres: 52.10, crop2026: 'PASTURE',
    county: 'Sedgwick', section: '13', township: '9N', range: '47W',
    soil: { type: 'Pasture' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 0.85, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '26.E SW MICHAEL', legal: 'SW13-9-47', fsaFarm: '3720', tract: '3815', acres: null, crop2026: 'SORGHUM SUDAN',
    county: 'Sedgwick', section: '13', township: '9N', range: '47W',
    soil: { type: 'Sand', class: 'III' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '26.W SW MICHAEL', legal: 'SW13-9-47', fsaFarm: '3720', tract: '3815', acres: null, crop2026: 'CORN',
    county: 'Sedgwick', section: '13', township: '9N', range: '47W',
    soil: { type: 'Sand', class: 'III' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '29.N MICHAEL', legal: 'SE13-9-47', fsaFarm: '3720', tract: '3815', acres: 40.90, crop2026: 'PEARL MILLET',
    county: 'Sedgwick', section: '13', township: '9N', range: '47W',
    soil: { type: 'Sand', class: 'III' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '29.S MICHAEL', legal: 'SE13-9-47', fsaFarm: '3720', tract: '3815', acres: 39.10, crop2026: 'PEARL MILLET',
    county: 'Sedgwick', section: '13', township: '9N', range: '47W',
    soil: { type: 'Sand', class: 'III' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '298 HWY HOUSE', legal: 'SW13-9-47', fsaFarm: '3720', tract: '3815', acres: 8.00, crop2026: 'BUILDING SITE',
    county: 'Sedgwick', section: '13', township: '9N', range: '47W',
    lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  // =============================================
  // KBFARMS - Neal's Pasture (Logan County, S17-T7N-R48W)
  // Soil: Pasture. All owned. Paid off. Tax: ~$0.75/ac
  // =============================================
  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '201 BY NEAL\'S', legal: 'NW4 17-7-48', fsaFarm: '4210', tract: '4045', acres: 143.34, crop2026: 'PASTURE',
    county: 'Logan', section: '17', township: '7N', range: '48W',
    soil: { type: 'Pasture' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 0.75, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '299 BY NEALS', legal: 'NW4 17-7-48', fsaFarm: '4210', tract: '4045', acres: 6.38, crop2026: 'WASTE',
    county: 'Logan', section: '17', township: '7N', range: '48W',
    lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 0.75, taxYear: 2026, taxingAuthority: 'Logan County' } },

  // =============================================
  // KBFARMS - Madsen Pasture (Phillips County, S17-T6N-R47W)
  // Soil: Pasture. Owned. Tax: ~$1.00/ac pasture
  // =============================================
  { client: 'MCC. ENT.', farm: 'KBFARMS', field: '202 SECTION', legal: '17-6-47', fsaFarm: '4210', tract: '3815', acres: 114.65, crop2026: 'PASTURE',
    county: 'Phillips', section: '17', township: '6N', range: '47W',
    soil: { type: 'Pasture' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.00, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  // =============================================
  // PETERSON
  // =============================================
  { client: 'MCC. ENT.', farm: 'PETERSON', field: '26 SW MICHAEL', legal: 'SW13-9-47', fsaFarm: '3720', tract: '3815', acres: 78.75, crop2026: 'SORGHUM',
    county: 'Sedgwick', section: '13', township: '9N', range: '47W',
    soil: { type: 'Sand', class: 'III' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'PETERSON', field: '32.S HIGHLAND W', legal: 'SW4 35-7-47', fsaFarm: '4063', tract: '4015', acres: 79.20, crop2026: 'SORGHUM',
    county: 'Phillips', section: '35', township: '7N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'PETERSON', field: '32.N HIGHLAND W', legal: 'SW4 35-7-47', fsaFarm: '4063', tract: '4015', acres: 79.20, crop2026: 'FALLOW',
    county: 'Phillips', section: '35', township: '7N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'PETERSON', field: '33.N ORPHAS', legal: 'NE4 6-6-46', fsaFarm: '50', tract: '1339', acres: 79.30, crop2026: 'FALLOW',
    county: 'Phillips', section: '6', township: '6N', range: '46W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'PETERSON', field: '33.S ORPHAS', legal: 'NE4 6-6-46', fsaFarm: '50', tract: '1339', acres: 79.40, crop2026: 'CORN',
    county: 'Phillips', section: '6', township: '6N', range: '46W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'PETERSON', field: '35.W POLE RD SEC 14', legal: 'NE 14-7-48', fsaFarm: '4112', tract: '4044', acres: 51.90, crop2026: 'CORN',
    county: 'Logan', section: '14', township: '7N', range: '48W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.10, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'PETERSON', field: '35.E POLE RD SEC 14', legal: 'NE 14-7-48', fsaFarm: '4112', tract: '4044', acres: 50.00, crop2026: 'FALLOW',
    county: 'Logan', section: '14', township: '7N', range: '48W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.10, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'PETERSON', field: '36.E POLE RD SEC 15', legal: 'NE 15-7-48', fsaFarm: '4062', tract: '4014', acres: 78.70, crop2026: 'FALLOW',
    county: 'Logan', section: '15', township: '7N', range: '48W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.10, taxYear: 2026, taxingAuthority: 'Logan County' } },

  // =============================================
  // HDFARMS (Phillips County, T8N-R47W)
  // =============================================
  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '41.E E/4', legal: 'NE4 11-8-47', fsaFarm: '2522', tract: '1521', acres: 78.40, crop2026: 'WHEAT',
    county: 'Phillips', section: '11', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '41.W E/4', legal: 'NE4 11-8-47', fsaFarm: '2522', tract: '1521', acres: 78.40, crop2026: 'CORN',
    county: 'Phillips', section: '11', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '42.W E/2 N/4', legal: 'NW4 12-8-47', fsaFarm: '2522', tract: '3251', acres: 79.10, crop2026: 'WHEAT',
    county: 'Phillips', section: '12', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '42.E E/2 N/4', legal: 'NW4 12-8-47', fsaFarm: '2522', tract: '3251', acres: 79.10, crop2026: 'FALLOW',
    county: 'Phillips', section: '12', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '43.E E/2 S/4', legal: 'SW4 12-8-47', fsaFarm: '2522', tract: '3251', acres: 79.10, crop2026: 'SORGHUM',
    county: 'Phillips', section: '12', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '43.W E/2 S/4', legal: 'SW4 12-8-47', fsaFarm: '2522', tract: '3251', acres: 79.10, crop2026: 'CORN',
    county: 'Phillips', section: '12', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '44.E S. TOWN', legal: 'NE4 32-8-47', fsaFarm: '2522', tract: '1626', acres: 77.40, crop2026: 'SORGHUM',
    county: 'Phillips', section: '32', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '44.W S. TOWN', legal: 'NE4 32-8-47', fsaFarm: '2522', tract: '1626', acres: 77.50, crop2026: 'FALLOW',
    county: 'Phillips', section: '32', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '45 W. TOWN', legal: 'SW4 20-8-47', fsaFarm: '2522', tract: '1586', acres: 117.25, crop2026: 'CORN',
    county: 'Phillips', section: '20', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '46 HOME W', legal: 'NW4 8-8-47', fsaFarm: '2522', tract: '1534', acres: 68.26, crop2026: 'SORGHUM',
    county: 'Phillips', section: '8', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '47 HOME E', legal: 'NE4 8-8-47', fsaFarm: '2522', tract: '1534', acres: 98.77, crop2026: 'CORN',
    county: 'Phillips', section: '8', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '401 HOME PLACE', legal: 'NW4 8-8-47', fsaFarm: '2522', tract: '1534', acres: 136.35, crop2026: 'PASTURE',
    county: 'Phillips', section: '8', township: '8N', range: '47W',
    soil: { type: 'Pasture' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.00, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'HDFARMS', field: '499 S TOWN', legal: 'NE4 32-8-47', fsaFarm: '2522', tract: '1626', acres: 4.74, crop2026: 'WASTE',
    county: 'Phillips', section: '32', township: '8N', range: '47W',
    lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.00, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  // =============================================
  // MEFARMS
  // =============================================
  { client: 'MCC. ENT.', farm: 'MEFARMS', field: '53 DICKS N', legal: 'SE4 8-9-47', fsaFarm: '4071', tract: '4021', acres: 25.67, crop2026: 'PEARL MILLET',
    county: 'Sedgwick', section: '8', township: '9N', range: '47W',
    soil: { type: 'Sand', class: 'III' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'MEFARMS', field: '53 DICKS S', legal: 'SE4 8-9-47', fsaFarm: '4071', tract: '4021', acres: 49.63, crop2026: 'PEARL MILLET',
    county: 'Sedgwick', section: '8', township: '9N', range: '47W',
    soil: { type: 'Sand', class: 'III' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.25, taxYear: 2026, taxingAuthority: 'Sedgwick County' } },

  { client: 'MCC. ENT.', farm: 'MEFARMS', field: '54.N PAULS', legal: 'SW 33-7-46', fsaFarm: '247', tract: '1311', acres: 78.39, crop2026: 'FALLOW',
    county: 'Phillips', section: '33', township: '7N', range: '46W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'MEFARMS', field: '54.S PAULS', legal: 'SW 33-7-46', fsaFarm: '247', tract: '1311', acres: 68.01, crop2026: 'WHEAT',
    county: 'Phillips', section: '33', township: '7N', range: '46W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'MEFARMS', field: '55 KIRBY HOUSEB', legal: 'NE 20-8-47', fsaFarm: '4207', tract: '5418', acres: 4.18, crop2026: 'SORGHUM',
    county: 'Phillips', section: '20', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'MEFARMS', field: '55.N KIRBY HOUSE', legal: 'NE 20-8-47', fsaFarm: '4207', tract: '5418', acres: 82.75, crop2026: 'WHEAT',
    county: 'Phillips', section: '20', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'MEFARMS', field: '55.S KIRBY HOUSE', legal: 'NE 20-8-47', fsaFarm: '4207', tract: '5418', acres: 71.50, crop2026: 'SORGHUM',
    county: 'Phillips', section: '20', township: '8N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'MEFARMS', field: '56.E KIRBY SOUTH', legal: 'NW 29-7-47', fsaFarm: '4667', tract: '5798', acres: 78.85, crop2026: 'CORN',
    county: 'Phillips', section: '29', township: '7N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'MEFARMS', field: '56.W KIRBY SOUTH', legal: 'NW 29-7-47', fsaFarm: '4667', tract: '5798', acres: 78.80, crop2026: 'SORGHUM',
    county: 'Phillips', section: '29', township: '7N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'MEFARMS', field: '599 PAULS', legal: 'SW 33-7-46', fsaFarm: '247', tract: '1311', acres: 6.39, crop2026: 'WASTE',
    county: 'Phillips', section: '33', township: '7N', range: '46W',
    lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.00, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  // =============================================
  // A1FARMS
  // =============================================
  { client: 'MCC. ENT.', farm: 'A1FARMS', field: '60.W DAILEYRD', legal: 'NE4 28-7-48', fsaFarm: '4114', tract: '4048', acres: 78.80, crop2026: 'WHEAT',
    county: 'Logan', section: '28', township: '7N', range: '48W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.10, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'A1FARMS', field: '60.S DAILEYRD', legal: 'NE4 28-7-48', fsaFarm: '4114', tract: '4048', acres: null, crop2026: 'CORN',
    county: 'Logan', section: '28', township: '7N', range: '48W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.10, taxYear: 2026, taxingAuthority: 'Logan County' } },

  { client: 'MCC. ENT.', farm: 'A1FARMS', field: '61.S HIGHLAND E', legal: 'SE4 35-7-47', fsaFarm: '6759', tract: '3794', acres: 78.90, crop2026: 'WHEAT',
    county: 'Phillips', section: '35', township: '7N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } },

  { client: 'MCC. ENT.', farm: 'A1FARMS', field: '61.N HIGHLAND E', legal: 'SE4 35-7-47', fsaFarm: '6759', tract: '3794', acres: 78.90, crop2026: 'FALLOW',
    county: 'Phillips', section: '35', township: '7N', range: '47W',
    soil: { type: 'Hard', class: 'II' }, lease: { type: 'owned' },
    taxes: { propertyTaxPerAcre: 1.50, taxYear: 2026, taxingAuthority: 'Phillips County' } }
];

async function seedFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing fields
    await CroppingField.deleteMany({});
    console.log('Cleared existing cropping fields');

    // Insert all fields
    await CroppingField.insertMany(fields);
    console.log(`Inserted ${fields.length} fields`);

    // Calculate totals by crop
    const cropTotals = {};
    let totalAcres = 0;
    fields.forEach(f => {
      if (f.acres) {
        totalAcres += f.acres;
        cropTotals[f.crop2026] = (cropTotals[f.crop2026] || 0) + f.acres;
      }
    });

    console.log('\n2026 Crop Summary:');
    Object.entries(cropTotals).sort((a, b) => b[1] - a[1]).forEach(([crop, acres]) => {
      console.log(`  ${crop}: ${acres.toFixed(2)} acres`);
    });
    console.log(`\nTotal Acres: ${totalAcres.toFixed(2)}`);

    // County summary
    const countyTotals = {};
    fields.forEach(f => {
      if (f.county && f.acres) {
        countyTotals[f.county] = (countyTotals[f.county] || 0) + f.acres;
      }
    });
    console.log('\nCounty Summary:');
    Object.entries(countyTotals).sort((a, b) => b[1] - a[1]).forEach(([county, acres]) => {
      console.log(`  ${county}: ${acres.toFixed(2)} acres`);
    });

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedFields();
