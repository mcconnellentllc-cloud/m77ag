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
  }
];
