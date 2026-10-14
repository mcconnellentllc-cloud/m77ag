// 2026 winter wheat crop insurance for M77 AG, LLC.
// Sources:
//   - RCIS MPCI Summary of Loss, claim 3154486, dated 9/23/2026 (check 02721041, $54,513.00)
//   - Hofmeister Ins Agency 2026 Insurance Summary (printed 10/22/2025): APH, guaranteed
//     bushels and planting dates per unit.
// fieldHint is the field number used to suggest the matching field card. The unit is
// only attached to a card when a person confirms it on the Fields page.

const POLICY = {
  cropYear: 2026,
  crop: 'WHEAT',
  company: 'RCIS',
  policyNumber: '05-951-455141',
  insuredName: 'M77 AG, LLC',
  agent: 'Hofmeister Ins Agency (Alicia L Schram), 970-774-6600',
  plan: 'RP',
  coverageLevel: 70,
  projectedPrice: 5.75,
  harvestPrice: 7.00,
  claimNumber: '3154486',
  claimDate: '2026-09-23',
  checkNumber: '02721041',
  checkAmount: 54513.00,
  source: 'RCIS Summary of Loss 9/23/2026; 2026 Insurance Summary 10/22/2025'
};

const UNITS = [
  { unitNumber: '0002-0001-EU', fsn: '3702', county: 'Logan', location: 'T7N R48W sec 14, East & West Bam',
    practice: 'Summer fallow', insuredAcres: 70.50, aph: 50, guaranteeBuPerAcre: 35.0, guaranteeBu: 2467.50,
    plantedDate: '2025-10-02', stage: 'H', adjustedGuarantee: 17272.50, productionToCountBu: 535.3,
    productionToCountValue: 3747.10, insuredShare: 1.0, productionPayable: 11110, revenuePayable: 2415,
    totalPayable: 13525, fieldHint: '13' },
  { unitNumber: '0002-0003-EU', fsn: '3704', county: 'Logan', location: 'T7N R48W sec 28, Daily Road',
    practice: 'Summer fallow', insuredAcres: 76.36, aph: 43, guaranteeBuPerAcre: 30.1, guaranteeBu: 2298.44,
    plantedDate: '2025-10-02', stage: 'H', adjustedGuarantee: 16089.05, productionToCountBu: 1089.6,
    productionToCountValue: 7627.20, insuredShare: 1.0, productionPayable: 6951, revenuePayable: 1511,
    totalPayable: 8462, fieldHint: '60' },
  { unitNumber: '0004-0003-EU', fsn: '3705', county: 'Phillips', location: 'T8N R47W sec 11-12, E Half & Over East Home',
    practice: 'Summer fallow', insuredAcres: 78.18, aph: 55, guaranteeBuPerAcre: 38.5, guaranteeBu: 3009.93,
    plantedDate: '2025-09-29', stage: 'H', adjustedGuarantee: 21069.51, productionToCountBu: 360.2,
    productionToCountValue: 2521.40, insuredShare: 0.5, otherShare: 'McConnell Enterprises 0.5',
    productionPayable: 7618, revenuePayable: 1656, totalPayable: 9274, fieldHint: '41' },
  { unitNumber: '0004-0004-EU', fsn: '3705', county: 'Phillips', location: 'T8N R47W sec 11-12, E Half & Over East Home',
    practice: 'Summer fallow', insuredAcres: 79.00, aph: 56, guaranteeBuPerAcre: 39.2, guaranteeBu: 3096.80,
    plantedDate: '2025-09-30', stage: 'H', adjustedGuarantee: 21677.60, productionToCountBu: 2075.0,
    productionToCountValue: 14525.00, insuredShare: 0.5, otherShare: 'McConnell Enterprises 0.5',
    productionPayable: 2938, revenuePayable: 638, totalPayable: 3576, fieldHint: '42.W' },
  { unitNumber: '0005-0002-EU', fsn: '3701', county: 'Phillips', location: 'T6N R47W sec 17, KB Section',
    practice: 'Continuous cropping', insuredAcres: 69.70, aph: 36, guaranteeBuPerAcre: 25.2, guaranteeBu: 1756.44,
    plantedDate: '2025-10-11', stage: 'UH', adjustedGuarantee: 12295.08, productionToCountBu: 48.8,
    productionToCountValue: 341.60, insuredShare: 1.0, productionPayable: 9819, revenuePayable: 2134,
    totalPayable: 11953, fieldHint: '23' },
  { unitNumber: '0005-0007-EU', fsn: '7646', county: 'Phillips', location: 'T8N R47W sec 20, West Town Atkins',
    practice: 'Summer fallow', insuredAcres: 75.67, aph: 47, guaranteeBuPerAcre: 32.9, guaranteeBu: 2489.54,
    plantedDate: '2025-09-22', stage: 'H', adjustedGuarantee: 17426.80, productionToCountBu: 1386.3,
    productionToCountValue: 9704.10, insuredShare: 1.0, productionPayable: 6344, revenuePayable: 1379,
    totalPayable: 7723, fieldHint: '55' }
];

module.exports = { POLICY, UNITS };
