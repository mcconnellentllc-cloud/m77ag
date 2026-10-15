// Starting parts list, built from the Unit #106 photos (Oct 2026).
// Amazon links are searches by size and type; open one, pick the listing that
// matches the spec, and save that product link on the part.
const amazon = q => 'https://www.amazon.com/s?k=' + encodeURIComponent(q);

module.exports = [
  {
    category: 'Lighting', name: 'Red marker / clearance lamp',
    spec: 'Rectangular, 2-screw surface mount, red, DOT SAE P2',
    fits: 'Unit #106', qtyNeeded: 5,
    amazonUrl: amazon('red rectangular clearance marker light 2 screw surface mount trailer LED'),
    notes: '5 needed. One rear lens is cracked and broken out along the bottom edge.'
  },
  {
    category: 'Lighting', name: 'Amber side marker / clearance lamp',
    spec: 'Rectangular, 2-screw surface mount, amber, DOT SAE P2',
    fits: 'Unit #106', qtyNeeded: 4,
    amazonUrl: amazon('amber rectangular clearance marker light 2 screw surface mount trailer LED'),
    notes: '4 needed. Maker not readable on the lens; match size and screw spacing to the old lamp.'
  },
  {
    category: 'Lighting', name: '4 in round stop / turn / tail lamp',
    spec: '4 in round, red, grommet mount, SAE-IST (Peterson 426 on the existing lamp)',
    partNumber: 'Peterson 426', fits: 'Unit #106 (rear)', qtyNeeded: 0,
    amazonUrl: amazon('4 inch round red stop turn tail light grommet mount trailer'),
    notes: 'LED replacements need the matching 3-prong plug.'
  },
  {
    category: 'Lighting', name: '4 in lamp grommet', spec: 'Rubber grommet for 4 in round lamp',
    fits: 'Unit #106 (rear)', qtyNeeded: 0,
    amazonUrl: amazon('4 inch round light grommet trailer')
  },
  {
    category: 'Lighting', name: 'Conspicuity tape', spec: 'DOT-C2, red and white, 2 in',
    fits: 'Unit #106 (lower rail, both sides)', qtyNeeded: 1,
    amazonUrl: amazon('DOT-C2 conspicuity tape red white 2 inch'),
    notes: 'Existing tape is faded and partly missing. Quantity is one roll; measure the run before ordering.'
  },
  {
    category: 'Brakes', name: 'Brake drum, 16.5 in',
    spec: '16.5 in diameter, stamped MAX 16.620 in. Confirm width and outboard or inboard mount before ordering.',
    fits: 'Unit #106', qtyNeeded: 0,
    amazonUrl: amazon('16.5 brake drum trailer outboard'),
    notes: 'Replace any drum that measures at or over 16.620 in.'
  },
  {
    category: 'Brakes', name: 'Brake shoes, 16.5 in',
    spec: '16.5 in diameter. Confirm shoe width and brake type (Q or Q-Plus) from the old shoe.',
    fits: 'Unit #106', qtyNeeded: 0,
    amazonUrl: amazon('16.5 x 7 brake shoe kit trailer Q plus')
  },
  {
    category: 'Brakes', name: 'S-cam brake camshaft',
    spec: 'Measure overall length, spline count and diameter, head type, and left or right hand before ordering.',
    fits: 'Unit #106', qtyNeeded: 0,
    amazonUrl: amazon('trailer S-cam brake camshaft 16.5')
  },
  {
    category: 'Brakes', name: 'Camshaft bushing and seal kit',
    spec: 'Match to the camshaft diameter.', fits: 'Unit #106', qtyNeeded: 0,
    amazonUrl: amazon('brake camshaft bushing seal kit trailer')
  },
  {
    category: 'Brakes', name: 'Meritor brake component (labeled)',
    spec: 'Label: T30DR YEL / 23053-A15 J11154 / 1A15 3275J11154',
    partNumber: '23053-A15', fits: 'Unit #106', qtyNeeded: 0,
    amazonUrl: amazon('Meritor T30DR'),
    notes: 'Give the parts counter all three label lines to identify the part.'
  },
  {
    category: 'Tires and wheels', name: 'Trailer tire 285/75R24.5',
    spec: '285/75R24.5, load range G, 100 psi cold. Existing: Bridgestone R195 Low Profile.',
    fits: 'Unit #106 (8 tires)', qtyNeeded: 0,
    amazonUrl: amazon('285/75R24.5 load range G trailer tire'),
    notes: 'Check DOT date codes; sidewall weathering seen on the tire photographed.'
  },
  {
    category: 'Suspension', name: 'Air spring',
    spec: 'ContiTech, molded number partly read: ...910-17... Read the full number before ordering.',
    fits: 'Unit #106 (Neway Anchorlok)', qtyNeeded: 0,
    amazonUrl: amazon('ContiTech air spring trailer Neway')
  },
  {
    category: 'Air and electrical', name: 'Glad hand seals', spec: 'Standard glad hand seal',
    fits: 'All trailers', qtyNeeded: 0,
    amazonUrl: amazon('glad hand seals trailer air brake')
  },
  {
    category: 'Tarp', name: 'Roll tarp stop', spec: 'Tarp stop for the roll tube, Shur-Lok roll tarp',
    fits: 'Unit #106', qtyNeeded: 2,
    amazonUrl: amazon('roll tarp stop grain trailer'),
    notes: 'Take an existing stop to match.'
  }
];
