// Corrections and service records gathered from photos and work sessions,
// applied once to the live equipment records at startup. Each entry:
//  key      - applied once; stored on the record in appliedUpdates
//  match    - how to find the record (first match wins)
//  replace  - field: { from: [old values], to } set only when the record still
//             holds one of the old values or is empty, so edits made on the
//             site are never overwritten
//  atLeast  - numeric fields raised to this value, never lowered
//  addNote  - text appended to notes when not already present
//  service  - maintenance records added unless one with the same date exists
module.exports = [
  {
    key: 'escalade-2026-09-23',
    match: [{ vin: '1GYS4HKJ3HR132303' }, { title: /^cadillac escalade$/i }, { title: /escalade/i }],
    replace: {
      title: { from: ['Cadillac Escalade'], to: '2017 Cadillac Escalade ESV' },
      subtitle: { from: ['SUV'], to: 'ESV Luxury 4WD - 6.2L V8' },
      model: { from: ['Escalade'], to: 'Escalade ESV' },
      year: { from: [], to: 2017 },
      vin: { from: [], to: '1GYS4HKJ3HR132303' }
    },
    atLeast: { currentMiles: 114933 },
    addNote: 'Engine 6.2L V8 (L86), 4WD, built Arlington TX. Oil filter ACDelco PF63E (GM 19330000), ' +
      'air filter ACDelco A3218C (GM 23349854), cabin filter ACDelco CF188 (GM 23281440). ' +
      'No serviceable fuel filter (integral to the in-tank pump module). Oil: 8.0 qt SAE 0W-20 dexos1.',
    service: [{
      date: '2026-09-23T19:37:00Z',
      type: 'oil_change',
      description: 'Pre-trip service: engine oil and filter, engine air filter, cabin air filter',
      milesAtService: 114933,
      parts: [
        { name: 'Engine oil filter', partNumber: 'ACDelco PF63E (GM 19330000)', quantity: 1 },
        { name: 'Engine air filter', partNumber: 'ACDelco A3218C (GM 23349854)', quantity: 1 },
        { name: 'Cabin air filter', partNumber: 'ACDelco CF188 (GM 23281440)', quantity: 1 },
        { name: 'Engine oil, SAE 0W-20 dexos1 full synthetic', partNumber: '0W-20', quantity: 8 }
      ],
      performedBy: 'self',
      vendor: "O'Reilly Auto Parts (parts)",
      nextServiceDue: { date: '2027-09-23', description: 'Oil at oil life 0% or Sept 2027; engine air filter 135,000 mi or Sept 2030; cabin air filter 135,000 mi or Sept 2028' },
      notes: 'No fuel filter serviced; not a serviceable part on this vehicle. Oil life system reset.'
    }]
  },
  {
    key: 'walker-2026-09-30',
    match: [{ make: /walker/i, model: /mbssd|super b/i }, { title: /walker super b/i }],
    replace: {
      title: { from: ['2015 Walker Super Bee 72"'], to: '2008 Walker MBSSD Super B 72"' },
      subtitle: { from: ['Commercial Mower'], to: 'Commercial Mower - 27 HP' },
      year: { from: [2015], to: 2008 },
      model: { from: ['Super Bee 72"'], to: 'MBSSD' },
      serialNumber: { from: [], to: '07208' },
      description: { from: ['72" commercial mower'], to: '72" commercial Super B mower, 27 HP, dual fuel tanks, GHS collection deck. Unit weight 730 lbs.' }
    },
    addNote: 'Model MBSSD, serial 07208, Walker Mfg. Co., Fort Collins CO, (970) 221-5614. 27 HP / 20.1 kW engine ' +
      '(likely Kohler Command Pro CH740; confirm from the engine tag). Main drive belt, engine to hydro pumps: Walker PN 2248. ' +
      'Walker Parts (800) 279-8537.',
    service: [{
      date: '2026-09-30T18:00:00Z',
      type: 'belt',
      description: 'Main drive belt (engine to hydro pumps): part identified for replacement',
      parts: [{ name: 'Main drive belt', partNumber: 'Walker MFG. 2248', quantity: 1 }],
      performedBy: 'self',
      notes: 'Part number read off the OEM belt (date code 2919MX). Not yet replaced; update this record when the belt goes on.'
    }]
  },
  {
    key: 'weigh-wagon-2026-09-22',
    match: [{ serialNumber: '1P9AB19339S276116' }],
    addNote: 'Avery Weigh-Tronix 640 scale head, hydraulic auger drive, 3000 RPM maximum. Engine: Briggs Vanguard 16 HP V-twin 479cc ' +
      '(series 305447), 1 in. shaft, 1/4 in. key. Replacement: Harbor Freight Predator 459cc item 58383. Wagon manual line 800-291-5487.'
  },
  {
    key: 'ram2500-2026-10-15',
    // From photos 2026-10-15, VIN and ratings from the driver door label.
    match: [{ vin: '1D7KS28C27J501253' }, { title: /^2006 dodge ram 2500/i }, { year: 2006, make: /dodge/i, model: /2500/ }],
    replace: {
      vin: { from: [], to: '1D7KS28C27J501253' },
      subtitle: { from: ['Krogman Bale Bed'], to: 'Krogmann Balehandler Bed' },
      description: { from: ['Work truck with Krogman bale bed'], to: 'Work truck with Krogmann Balehandler bale bed, Cummins Turbo Diesel, Heavy Duty' },
      licensePlate: { from: [], to: 'DMA-941 (Colorado)' },
      repairsNeeded: { from: [], to: 'Check engine light on at 142,210 mi (Oct 15, 2026); read the code. Windshield cracked across the driver side; replace.' }
    },
    atLeast: { currentMiles: 142210 },
    addNote: 'Cummins Turbo Diesel, Ram 2500 Heavy Duty, automatic. Krogmann Balehandler bale bed with headache rack and ' +
      'underbody toolboxes. TrailFX grille guard with LED light bar. Odometer 142,210 mi on Oct 15, 2026, check engine light on. ' +
      'Door label: built 7-06 by DaimlerChrysler (VIN model-year code 7 = 2007), GVWR 9,000 lb, GAWR front 5,200 / rear 6,010 lb, ' +
      'tires LT265/70R17E on 17x8.0 rims, cold pressure front 60 psi / rear 70 psi, paint code PDM, trim M9D5. ' +
      'Transmission: Jasper Engines & Transmissions remanufactured unit (sticker on the door jamb); install date and warranty not on file.'
  },
  {
    key: 'ram2500-jasper-transmission',
    // Confirmed 2026-10-15: the Jasper sticker is for the transmission.
    match: [{ vin: '1D7KS28C27J501253' }, { title: /^2006 dodge ram 2500/i }],
    addNote: 'Transmission: Jasper Engines & Transmissions remanufactured unit (sticker on the door jamb); install date and warranty not on file.'
  },
  {
    key: 'ram1500-2026-10-15',
    // From photos 2026-10-15; VIN and ratings from the driver door label.
    match: [{ vin: '1D7RV1CT9BS668428' }, { title: /^dodge ram 1500$/i }, { make: /dodge/i, model: /ram 1500/i }],
    replace: {
      title: { from: ['Dodge Ram 1500'], to: '2011 Dodge Ram 1500' },
      subtitle: { from: ['Red Pickup'], to: 'Red 4-Door Pickup - 5.7L HEMI' },
      year: { from: [], to: 2011 },
      vin: { from: [], to: '1D7RV1CT9BS668428' },
      licensePlate: { from: [], to: 'DMA-942 (Colorado)' }
    },
    addNote: '5.7L HEMI V8. Door label: built 5-11 by Chrysler Group LLC, GVWR 6,800 lb, GAWR front 3,900 / rear 3,900 lb, ' +
      'tires P275/60R20 on 20x9.0 rims, cold pressure 35 psi front and rear, paint code PR4. ' +
      'Two-tone red and tan, chrome mirror caps, hood bug deflector, running boards, bed tonneau cover.'
  },
  {
    key: 'intl-9300-unit4-battery-2026-10-15',
    // Battery label photo at O'Reilly, Oct 15, 2026.
    match: [{ serialNumber: '2HSFBAER8XC071832' }, { vin: '2HSFBAER8XC071832' }],
    addNote: "Battery: Super Start 31-5TJ (O'Reilly), BCI Group 31, standard flooded, 950 CCA, reserve capacity 195 min; " +
      'date sticker 9/26. Super Start warranty line 1-866-830-4351.'
  },
  {
    key: 'ram1500-filters-2026-10-15',
    // Bought at O'Reilly Oct 15, 2026 (box photos).
    match: [{ vin: '1D7RV1CT9BS668428' }, { title: /^2011 dodge ram 1500$/i }],
    addNote: 'Filters: oil WIX 57899XP (the 57060 does not fit per O\'Reilly lookup), engine air WIX 42725. ' +
      'No serviceable fuel filter on 2011 and later: it is part of the in-tank fuel pump module.'
  },
  ...(() => {
    // Winterizing, Oct 16, 2026: 30 gal RV antifreeze at $2.99/gal (before tax),
    // 14 gal per sprayer and 2 gal for the water truck pump and plumbing.
    const fluid = qty => ({ name: 'RV antifreeze, -50 F (propylene glycol type)', quantity: qty, cost: Math.round(qty * 2.99 * 100) / 100 });
    const sprayerSteps = 'Winterizing: rinse the tank; drain tank, pump, strainers, low points and boom-end flush caps; blow out each boom section with air; ' +
      'run RV antifreeze (propylene glycol, -50 F) through the pump, every boom section, nozzles, agitation and bypass lines and the flow meter until it shows at each outlet; ' +
      'pull strainer screens and leave valves half open. In spring catch and reuse the antifreeze. 14 gal per sprayer. ' +
      'Avoid washer fluid and alcohol-based RV antifreeze: alcohol dries out pump and valve seals.';
    const service = (qty, what) => [{
      date: '2026-10-16T18:00:00Z', type: 'preventive',
      description: 'Winterized ' + (what || 'spray system') + ' with RV antifreeze (' + qty + ' gal)',
      parts: [fluid(qty)], totalCost: Math.round(qty * 2.99 * 100) / 100, performedBy: 'self',
      nextServiceDue: { date: '2027-03-15', description: 'Spring: catch and reuse antifreeze, flush with water before first load' },
      notes: '$2.99/gal before tax, from 30 gal bought for both sprayers and the water truck. Confirm the jug says propylene glycol.'
    }];
    return [
      { key: 'winterize-rogator-2026', match: [{ serialNumber: 'AGCA1300JCNSL1103' }, { title: /^ag ?chem 1300 rogator$/i }],
        addNote: sprayerSteps, service: service(14) },
      { key: 'winterize-terragator-2026', match: [{ serialNumber: '1632504' }, { title: /terra ?gator floater/i }],
        addNote: sprayerSteps, service: service(14) },
      { key: 'winterize-water-truck-2026', match: [{ vin: '1HSZBJWR0EHA52860' }, { serialNumber: '1HSZBJWR0EHA52860' }, { title: /water truck/i }],
        addNote: 'Winterizing: drain the 3200 gal tank and the 3 in pump, open low-point drains and the pump drain plug, then run RV antifreeze ' +
          '(propylene glycol, -50 F) through the pump and discharge plumbing until it shows at the outlet. 2 gal.',
        service: service(2, 'tank pump and plumbing') }
    ];
  })(),
  {
    key: 'rogator-coolant-tank-2026-10-16',
    // Reservoir and cap photos, Oct 16, 2026.
    match: [{ serialNumber: 'AGCA1300JCNSL1103' }, { title: /^ag ?chem 1300 rogator$/i }],
    replace: {
      repairsNeeded: { from: [], to: 'Replace coolant reservoir, AGCO 4280681M1 (polypropylene), and its pressure cap, 95 kPa (about 14 psi), marked TVS 5659.' }
    },
    addNote: 'Coolant reservoir: AGCO 4280681M1, polypropylene (marked PP), pressure cap 95 kPa / about 14 psi (TVS 5659). ' +
      'No dealer. Sources: NAPA by AGCO number, Abilene Machine, All States Ag Parts, eBay. Cap: match neck size and pressure at O\'Reilly ' +
      '(13-14 psi, not higher). Fallback: plastic-weld the old PP tank, or fit a universal heavy-duty expansion tank matching volume, hose nipples and cap neck.'
  },
  {
    key: 'rogator-coolant-tank-supersede-2026-10-16',
    match: [{ serialNumber: 'AGCA1300JCNSL1103' }, { title: /^ag ?chem 1300 rogator$/i }],
    replace: {
      repairsNeeded: {
        from: ['Replace coolant reservoir, AGCO 4280681M1 (polypropylene), and its pressure cap, 95 kPa (about 14 psi), marked TVS 5659.'],
        to: 'Replace coolant reservoir, AGCO 4348254M3 (supersedes 4280681M1), and its pressure cap, 95 kPa (about 14 psi), marked TVS 5659.'
      }
    },
    addNote: 'Coolant reservoir current part number: AGCO 4348254M3, superseding 4280681M1.'
  },
  {
    key: 'rogator-coolant-tank-bought-2026-10-16',
    match: [{ serialNumber: 'AGCA1300JCNSL1103' }, { title: /^ag ?chem 1300 rogator$/i }],
    replace: {
      repairsNeeded: {
        from: [
          'Replace coolant reservoir, AGCO 4348254M3 (supersedes 4280681M1), and its pressure cap, 95 kPa (about 14 psi), marked TVS 5659.',
          'Replace coolant reservoir, AGCO 4280681M1 (polypropylene), and its pressure cap, 95 kPa (about 14 psi), marked TVS 5659.'
        ],
        to: 'Install the new coolant expansion tank (AGCO 4348254M5, in hand). Pressure cap still needed: 95 kPa (about 14 psi), marked TVS 5659.'
      }
    },
    addNote: 'Coolant expansion tank bought Oct 16, 2026: AGCO 4348254M5 (current number, supersedes 4348254M3 and 4280681M1), ' +
      'Regier Equipment, Madrid NE, invoice 50353, $201.47 with tax and card surcharge.'
  },
  {
    key: 'rogator-threaded-cap-2026-10-16',
    match: [{ serialNumber: 'AGCA1300JCNSL1103' }, { title: /^ag ?chem 1300 rogator$/i }],
    replace: {
      repairsNeeded: {
        from: ['Install the new coolant expansion tank (AGCO 4348254M5, in hand). Pressure cap still needed: 95 kPa (about 14 psi), marked TVS 5659.'],
        to: 'Install the new coolant expansion tank (AGCO 4348254M5, in hand). Needs the AGCO threaded pressure cap for 4348254M5 (sold separately; ' +
          'the old 95 kPa twist-on cap does not fit). Get the cap number from Regier, (308) 326-4245. New tank has no overflow nipple: plug or remove the old overflow hose.'
      }
    },
    addNote: 'New tank 4348254M5 takes a threaded cap (not included) and has no overflow nipple; 1.88 gal, about 13.8 x 6.0 x 8.8 in. ' +
      'Check every other hose on the old tank, especially the small top air-bleed line, has a matching port before installing.'
  }
];

