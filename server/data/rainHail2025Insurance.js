// 2025 crop insurance, Rain and Hail L.L.C. (ACE Property and Casualty),
// agent Grainbelt Risk Management LLC (Art Henrickson). Built from the 2025
// Summaries of Information (printed Sep 10, 2025) and the claim summaries
// Kyle sent Oct 18, 2026:
//   MP-0884377  M77 AG, LLC             corn, wheat   claims 25-056483 (corn), 25-088877 (wheat)
//   MP-0798771  Kyle McConnell          corn, wheat   no claim summary on file
//   MP-0759227  McConnell Enterprises   corn, milo, wheat   claims 25-089442 (milo), 25-089439 (corn, no loss)
//   MP-0906525  Kyle McConnell          annual forage, zero acres (nothing to attach)
//
// Each unit is matched to a field card by its legal description, acres and the
// crop grown there in 2025; the cards keep their John Deere Operations Center
// names (Kyle). fieldHint is the card when that match is certain, a list of
// [card, acres] when the unit covers more than one card (split by acres), and
// null when the section holds more than one field with that crop (chosen on
// Field Setup).
//
// Premium is the unit's net premium (premium less subsidy) from the Summary of
// Information, plus the county administrative fee and the interest billed for
// the crop, allocated over that crop's units in the county by acres.

const AGENT = 'Grainbelt Risk Management LLC (Art Henrickson), 785-543-4410';
const COMPANY = 'Rain and Hail (ACE Property and Casualty)';
const COVERAGE = { CORN: 80, SORGHUM: 85, WHEAT: 70 };
const round2 = n => Math.round(n * 100) / 100;

// Unit row: [line, unit, county, legal "sec twp rng", fsn, share, aph, acres,
//   planted, netPremium, unitDescription, otherPersons, fieldHint, note]
// Claim row by line: [stage, guarantee $, production bu, production $, payable $]
function build({ crop, rows, fees, claim }) {
  const out = [];
  for (const [line, unit, county, legal, fsn, share, aph, acres, planted, netPremium, description, others, hint, note] of rows) {
    const [sec, twp, rng] = legal.split(' ');
    const groupAcres = rows.filter(r => r[2] === county).reduce((t, r) => t + r[7], 0);
    const fee = fees[county] || 0;
    const premium = netPremium + fee * acres / groupAcres;
    const c = claim && claim.lines ? claim.lines[line] : null;
    const base = {
      county, location: `Sec ${sec} T${twp} R${rng}`, fsn, insuredShare: share, aph,
      guaranteeBuPerAcre: round2(aph * COVERAGE[crop] / 100), plantedDate: planted,
      otherShare: others || '',
      stage: c ? c[0] : undefined,
      notes: [description ? 'Unit: ' + description : '', note || '',
        claim ? '' : 'No claim summary on file for this crop.'].filter(Boolean).join(' ')
    };
    const value = c ? { adjustedGuarantee: c[1], productionToCountBu: c[2], productionToCountValue: c[3], totalPayable: c[4] }
      : { totalPayable: claim && claim.noLoss ? 0 : null };
    const id = `${unit} line ${line}`;
    if (Array.isArray(hint)) {
      // One unit over several cards: acres, premium and claim split by acres.
      const total = hint.reduce((t, h) => t + h[1], 0);
      for (const [card, cardAcres] of hint) {
        const f = cardAcres / total;
        const part = {};
        for (const [k, v] of Object.entries(value)) part[k] = v == null ? v : round2(v * f);
        out.push({ ...base, ...part, unitNumber: `${id} ${card}`, insuredAcres: round2(acres * f),
          premium: round2(premium * f), fieldHint: card,
          notes: [base.notes, `${acres} ac unit split by acres; this card ${cardAcres} ac.`].filter(Boolean).join(' ') });
      }
    } else {
      out.push({ ...base, ...value, unitNumber: id, insuredAcres: acres, premium: round2(premium), fieldHint: hint });
    }
  }
  return out;
}

function policy(p, crop, claim) {
  return {
    cropYear: 2025, crop, company: COMPANY, agent: AGENT, plan: 'RP', coverageLevel: COVERAGE[crop],
    ...p,
    ...(claim ? { claimNumber: claim.claimNumber, claimDate: claim.claimDate, checkNumber: claim.checkNumber } : {}),
    source: `Rain and Hail 2025 Summary of Information, policy ${p.policyNumber}` + (claim ? `; claim summary ${claim.claimNumber}` : '')
  };
}

const M77 = { policyNumber: 'MP-0884377', insuredName: 'M77 AG, LLC' };
const KYLE = { policyNumber: 'MP-0798771', insuredName: 'Kyle McConnell' };
const ME = { policyNumber: 'MP-0759227', insuredName: 'McConnell Enterprises LLC' };

// ---- M77 AG, LLC --------------------------------------------------------
const M77_CORN_CLAIM = { claimNumber: '25-056483', claimDate: '2025-12-04', checkNumber: 'ACH 7546467', lines: {
  7: ['H', 13292, 1188.1, 5014, 4139],
  8: ['H', 22334, 3328.7, 14047, 8287],
  9: ['H', 39706, 2016.9, 8511, 31194],
  10: ['H', 22222, 1035.5, 4370, 17852],
  11: ['H', 43146, 4397.7, 18558, 24588]
} };
const M77_CORN = {
  POLICY: { ...policy(M77, 'CORN', M77_CORN_CLAIM), projectedPrice: 4.70, harvestPrice: 4.22 },
  UNITS: build({ crop: 'CORN', claim: M77_CORN_CLAIM, fees: { Logan: 30, Phillips: 30 }, rows: [
    [7, '1.0000 BU', 'Logan', '14 7N 48W', '3709', 0.5, 72, 49.1, '2025-05-16', 589, 'POLE RD SEC. 14', 'Kyle McConnell', '31.W POLE RD SEC 14'],
    [8, '2.0000 EU (3.0005)', 'Phillips', '35 7N 47W', '3707', 1, 75, 79.2, '2025-05-20', 1024, 'HIGHLAND CENTER', '', '32.S HIGHLAND W'],
    [9, '2.0000 EU (3.0001)', 'Phillips', '17 6N 47W', '3701', 1, 75, 140.8, '2025-05-21', 1820, 'KB SECTION', '', null,
      'Section 17 holds 23.E/W and 24.E/W SW and SE Pauli; pick the corn fields.'],
    [10, '2.0000 EU (3.0003)', 'Phillips', '29 7N 47W', '7655', 1, 75, 78.8, '2025-05-20', 1019, 'KIRBY', '', null,
      '56.E or 56.W Kirby South: one half was corn (this unit), the other milo (McConnell Enterprises).'],
    [11, '2.0000 EU (3.0004)', 'Phillips', '31 7N 47W', '3702', 1, 75, 153.0, '2025-05-19', 1978, 'BAMFORD S.', '',
      [['14.N BAM S', 76.5], ['14.S BAM S', 76.5]]]
  ] })
};

const M77_WHEAT_CLAIM = { claimNumber: '25-088877', claimDate: '2025-10-03', checkNumber: 'Premium credit', lines: {
  1: ['H', 17895, 3159.7, 16652, 1243],
  2: ['H', 15688, 2800.0, 14756, 466],
  3: ['PR', 16779, 3709.3, 19548, 0],
  4: ['PR', 16995, 1349.2, 7110, 0],
  5: ['PR', 16506, 5153.3, 27158, 0],
  6: ['PR', 17940, 4074.0, 21470, 0]
} };
const M77_WHEAT = {
  POLICY: { ...policy(M77, 'WHEAT', M77_WHEAT_CLAIM), projectedPrice: 6.00, harvestPrice: 5.27 },
  UNITS: build({ crop: 'WHEAT', claim: M77_WHEAT_CLAIM, fees: { Logan: 30 + 16, Phillips: 30 + 18 }, rows: [
    [1, '1.0000 EU (2.0001)', 'Logan', '14 7N 48W', '3702', 1, 54, 78.9, '2024-09-24', 488, '', '', '13.E BAM E'],
    [2, '1.0000 EU (1.0000)', 'Logan', '28 7N 48W', '3704', 0.5, 46, 81.2, '2024-09-23', 162, '', 'Kyle McConnell', '60.E DAILEYRD'],
    [3, '2.0000 EU (4.0002)', 'Phillips', '2 6N 47W', '3702', 0.5, 50, 79.9, '2024-09-19', 183, '10- LA OURS', 'McConnell Enterprises', '10.N OURS'],
    [4, '2.0000 EU (4.0001)', 'Phillips', '6 6N 46W', '3711', 0.5, 48, 84.3, '2024-09-20', 222, '33- BBI ORPHA', 'McConnell Enterprises', '33.S ORPHAS'],
    [5, '2.0000 EU (4.0003)', 'Phillips', '11 8N 47W', '3705', 0.5, 50, 78.6, '2024-09-25', 159, '41-HD E/4', 'McConnell Enterprises', '41.W E/4',
      '41.W was fallow in 2024 (FSA-578 tract 6949 CLU 1B) and is corn for 2026; 41.E was milo in 2024 and is wheat for 2026.'],
    [6, '2.0000 EU (4.0004)', 'Phillips', '12 8N 47W', '3705', 0.5, 54, 79.1, '2024-09-26', 246, '42 43 HD 1/2 SECTION', 'McConnell Enterprises', '43.W E/2 S/4']
  ] })
};

// ---- Kyle McConnell -----------------------------------------------------
const KYLE_CORN = {
  POLICY: { ...policy(KYLE, 'CORN', null), projectedPrice: 4.70 },
  UNITS: build({ crop: 'CORN', claim: null, fees: { Logan: 30, Phillips: 30, Sedgwick: 30 }, rows: [
    [4, '1.0000 EU (1.0000)', 'Logan', '14 7N 48W', '3702', 0.5, 72, 78.6, '2025-05-17', 532, '13-14 LA BAM E', 'M77 AG, LLC', '12.W BAM W',
      'Matched by acres: 12.W BAM W is the 78.6 ac corn field in section 14 for 2025 (13.E was wheat).'],
    [5, '1.0000 EU (2.0001)', 'Logan', '15 7N 48W', '3708', 1, 78, 78.8, '2025-05-16', 1105, 'POLE RD SEC. 15', '', '30.W POLE RD SEC 15'],
    [7, '2.0000 EU (3.0002)', 'Phillips', '2 6N 47W', '3702', 1, 75, 78.6, '2025-05-18', 1074, 'OURS S.', '', '10.S OURS'],
    [6, '2.0000 EU (3.0007)', 'Phillips', '12 8N 47W', '3705', 1, 75, 79.0, '2025-05-14', 1625, '42 43 HD 1/2 SECTION', '', '43.E E/2 S/4',
      '43.E is the corn field in section 12 for 2025; 42.E was milo (McConnell Enterprises).'],
    [8, '4.0000 BU', 'Sedgwick', '13 9N 47W', '3703', 1, 68, 288.0, '2025-05-15', 9205, '17 LA MALVIHILL', '', null,
      '288.0 ac of corn in section 13: 17.E and 17.W Mulvihill are 159.7 ac; pick the other corn fields.']
  ] })
};
const KYLE_WHEAT = {
  POLICY: { ...policy(KYLE, 'WHEAT', null), projectedPrice: 6.00 },
  UNITS: build({ crop: 'WHEAT', claim: null, fees: { Logan: 30 + 12, Sedgwick: 30 + 10 }, rows: [
    [1, '1.0002 BU', 'Logan', '28 7N 48W', '4114', 0.5, 49, 81.2, '2024-09-23', 518, 'DAILEY ROAD', 'M77 AG, LLC', '60.E DAILEYRD'],
    [3, '6.0000 BU', 'Sedgwick', '8 9N 47W', '3706', 1, 31, 75.3, '2024-10-15', 385, 'Continuous crop', '',
      [['53 DICKS N', 25.67], ['53 DICKS S', 49.63]]]
  ] })
};

// ---- McConnell Enterprises LLC ------------------------------------------
const ME_MILO_CLAIM = { claimNumber: '25-089442', claimDate: '2026-01-28', checkNumber: 'ACH 7555176', lines: {
  5: ['UH', 12317, 70.7, 300, 12017],
  6: ['UH', 7625, 39.3, 167, 7458],
  7: ['UH', 12534, 70.9, 301, 12234],
  10: ['H', 15647, 5300.6, 22475, -6828],
  11: ['H', 15529, 1797.8, 7623, 7907],
  12: ['H', 14249, 2541.4, 10776, 3473],
  13: ['H', 17816, 2115.8, 8971, 8846],
  14: ['H', 28236, 4316.3, 18301, 9935],
  15: ['H', 16119, 3037.5, 12879, 3240],
  16: ['H', 31111, 2204.5, 9347, 21764],
  17: ['H', 16769, 1972.0, 8361, 8407],
  18: ['UH', 17072, 70.9, 301, 16771],
  19: ['H', 14140, 801.0, 3396, 10744],
  20: ['H', 15274, 1495.7, 6342, 8932]
} };
const ME_MILO = {
  POLICY: { ...policy(ME, 'SORGHUM', ME_MILO_CLAIM), projectedPrice: 4.72, harvestPrice: 4.24 },
  UNITS: build({ crop: 'SORGHUM', claim: ME_MILO_CLAIM, fees: { Logan: 30, Phillips: 30, Sedgwick: 30 }, rows: [
    [5, '1.0000 EU (1.0001)', 'Logan', '14 7N 48W', '3702', 1, 39, 78.6, '2025-06-10', 1614, 'POLE RD/ BAMFORD', '', '12.E BAM W'],
    [6, '1.0000 EU (1.0001)', 'Logan', '14 7N 48W', '3702', 1, 39, 49.1, '2025-06-16', 1008, 'POLE RD/ BAMFORD', '', '31.E POLE RD SEC 14',
      'Reduced guarantee, late planted.'],
    [7, '1.0000 EU (1.0002)', 'Logan', '15 7N 48W', '3708', 1, 40, 78.8, '2025-06-16', 1638, '', '', '30.E POLE RD SEC 15',
      'Reduced guarantee, late planted.'],
    [10, '2.0000 EU (2.0003)', 'Phillips', '33 7N 46W', '3710', 1, 50, 78.0, '2025-06-10', 1692, 'PAULS', '', '54.N PAULS',
      'Production over the guarantee: negative line offsets the other units.'],
    [11, '2.0000 EU (2.0005)', 'Phillips', '35 7N 47W', '3704', 1, 49, 78.9, '2025-06-11', 1697, 'HIGHLAND', '', '61.N HIGHLAND E'],
    [12, '2.0000 EU (2.0006)', 'Phillips', '8 8N 47W', '3705', 1, 52, 68.3, '2025-06-04', 1501, '', '', '46 HOME W',
      'Milo by the insurance and the Operations Center seeding report; the card shows corn for 2025.'],
    [13, '2.0000 EU (2.0008)', 'Phillips', '12 8N 47W', '3705', 1, 56, 79.3, '2025-06-10', 1805, '', '', '42.E E/2 N/4'],
    [14, '2.0000 EU (2.0009)', 'Phillips', '20 8N 47W', '3705', 1, 60, 117.3, '2025-06-04', 2749, 'W TOWN', '', '45 W. TOWN'],
    [15, '2.0000 EU (2.0001)', 'Phillips', '6 6N 46W', '3711', 1, 54, 74.4, '2025-06-12', 1664, '', '', '33.N ORPHAS'],
    [16, '2.0000 EU (2.0002)', 'Phillips', '17 6N 47W', '3701', 1, 54, 143.6, '2025-06-09', 3212, '', '', null,
      'Section 17 holds 23.E/W and 24.E/W SW and SE Pauli; pick the milo fields.'],
    [17, '2.0000 EU (2.0010)', 'Phillips', '32 8N 47W', '3705', 1, 54, 77.4, '2025-06-05', 1731, '', '', '44.W S. TOWN',
      '44.W is the milo field in section 32 for 2025; 44.E was corn (unit 8.0, same policy).'],
    [18, '2.0000 EU (2.0004)', 'Phillips', '29 7N 47W', '7655', 1, 54, 78.8, '2025-06-10', 1763, '', '', null,
      '56.E or 56.W Kirby South: one half was milo (this unit), the other corn (M77 AG).'],
    [19, '3.0000 EU (3.0001)', 'Sedgwick', '7 9N 46W', '3703', 1, 44, 80.1, '2025-06-13', 1394, 'ROSCOES', '', '16.W BIG FIELD',
      'Matched by acres: 16.W is the 80.09 ac field in section 7. Milo by the insurance; the card shows corn for 2025.'],
    [20, '3.0000 EU (3.0002)', 'Sedgwick', '13 9N 47W', '3712', 1, 47, 80.9, '2025-06-11', 1451, 'KB MICHAELS', '', '26.E SW MICHAEL']
  ] })
};

const ME_CORN_CLAIM = { claimNumber: '25-089439', claimDate: '2025-11-25', checkNumber: 'Released, no payable loss', noLoss: true };
const ME_CORN = {
  POLICY: { ...policy(ME, 'CORN', ME_CORN_CLAIM), projectedPrice: 4.70 },
  UNITS: build({ crop: 'CORN', claim: ME_CORN_CLAIM, fees: { Phillips: 30 }, rows: [
    [9, '3.0000 EU (7.0004)', 'Phillips', '20 8N 47W', '7646', 1, 87, 75.7, '2025-05-16', 1446, '45 HD W TOWN', '',
      [['55.S KIRBY HOUSE', 71.5], ['55 KIRBY HOUSEB', 4.18]],
      'Matched by acres: the 2025 corn in section 20 is 55.S Kirby House and 55 Kirby HouseB (75.68 ac); 45 W. Town was milo.'],
    [8, '3.0000 EU (7.0005)', 'Phillips', '32 8N 47W', '3705', 1, 92, 77.4, '2025-05-16', 1609, '44 HD S TOWN', '', '44.E S. TOWN']
  ] })
};

const ME_WHEAT = {
  POLICY: { ...policy(ME, 'WHEAT', null), projectedPrice: 6.00, harvestPrice: 5.27 },
  UNITS: build({ crop: 'WHEAT', claim: null, fees: { Phillips: 30 + 18 }, rows: [
    [4, '4.0000 EU (7.0002)', 'Phillips', '2 6N 47W', '3702', 0.5, 50, 79.9, '2024-09-19', 183, '10 LA OURS', 'M77 AG, LLC', '10.N OURS'],
    [1, '4.0000 EU (7.0001)', 'Phillips', '6 6N 46W', '3711', 0.5, 48, 84.3, '2024-09-20', 222, '33- BBI ORPHA', 'M77 AG, LLC', '33.S ORPHAS'],
    [3, '4.0000 EU (7.0003)', 'Phillips', '11 8N 47W', '3705', 0.5, 50, 78.6, '2024-09-25', 159, '41-HD E/4', 'M77 AG, LLC', '41.W E/4',
      '41.W was fallow in 2024 (FSA-578 tract 6949 CLU 1B) and is corn for 2026; 41.E was milo in 2024 and is wheat for 2026.'],
    [2, '4.0000 EU (7.0004)', 'Phillips', '12 8N 47W', '3705', 0.5, 54, 79.1, '2024-09-26', 246, '42 43 HD 1/2 SECTION', 'M77 AG, LLC', '43.W E/2 S/4']
  ] })
};

module.exports = { M77_CORN, M77_WHEAT, KYLE_CORN, KYLE_WHEAT, ME_MILO, ME_CORN, ME_WHEAT };
