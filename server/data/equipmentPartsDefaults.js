// Starting parts list, built from the Unit #106 photos (Oct 2026).
// Amazon links are searches by size and type; open one, pick the listing that
// matches the spec, and save that product link on the part.
const amazon = q => 'https://www.amazon.com/s?k=' + encodeURIComponent(q);

module.exports = [
  {
    category: 'Lighting', seedKey: 'u106-marker-red', name: 'Red marker / clearance lamp',
    spec: 'Rectangular, 2-screw surface mount, red, DOT SAE P2',
    fits: 'Unit #106', qtyNeeded: 5,
    amazonUrl: amazon('red rectangular clearance marker light 2 screw surface mount trailer LED'),
    notes: '5 needed. One rear lens is cracked and broken out along the bottom edge.'
  },
  {
    category: 'Lighting', seedKey: 'u106-marker-amber', name: 'Amber side marker / clearance lamp',
    spec: 'Rectangular, 2-screw surface mount, amber, DOT SAE P2',
    fits: 'Unit #106', qtyNeeded: 4,
    amazonUrl: amazon('amber rectangular clearance marker light 2 screw surface mount trailer LED'),
    notes: '4 needed. Maker not readable on the lens; match size and screw spacing to the old lamp.'
  },
  {
    category: 'Lighting', seedKey: 'u106-stt-4in', name: '4 in round stop / turn / tail lamp',
    spec: '4 in round, red, grommet mount, SAE-IST (Peterson 426 on the existing lamp)',
    partNumber: 'Peterson 426', fits: 'Unit #106 (rear)', qtyNeeded: 0,
    amazonUrl: amazon('4 inch round red stop turn tail light grommet mount trailer'),
    notes: 'LED replacements need the matching 3-prong plug.'
  },
  {
    category: 'Lighting', seedKey: 'u106-grommet-4in', name: '4 in lamp grommet', spec: 'Rubber grommet for 4 in round lamp',
    fits: 'Unit #106 (rear)', qtyNeeded: 0,
    amazonUrl: amazon('4 inch round light grommet trailer')
  },
  {
    category: 'Lighting', seedKey: 'u106-conspicuity', name: 'Conspicuity tape', spec: 'DOT-C2, red and white, 2 in',
    fits: 'Unit #106 (lower rail, both sides)', qtyNeeded: 1,
    amazonUrl: amazon('DOT-C2 conspicuity tape red white 2 inch'),
    notes: 'Existing tape is faded and partly missing. Quantity is one roll; measure the run before ordering.'
  },
  {
    category: 'Brakes', seedKey: 'u106-drum', name: 'Brake drum, 16.5 in',
    spec: '16.5 in diameter, stamped MAX 16.620 in. Confirm width and outboard or inboard mount before ordering.',
    fits: 'Unit #106', qtyNeeded: 0,
    amazonUrl: amazon('16.5 brake drum trailer outboard'),
    notes: 'Replace any drum that measures at or over 16.620 in.'
  },
  {
    category: 'Brakes', seedKey: 'u106-shoes', name: 'Brake shoes, 16.5 in',
    spec: '16.5 in diameter. Confirm shoe width and brake type (Q or Q-Plus) from the old shoe.',
    fits: 'Unit #106', qtyNeeded: 0,
    amazonUrl: amazon('16.5 x 7 brake shoe kit trailer Q plus')
  },
  {
    category: 'Brakes', seedKey: 'u106-scam', name: 'S-cam brake camshaft',
    spec: 'Measure overall length, spline count and diameter, head type, and left or right hand before ordering.',
    fits: 'Unit #106', qtyNeeded: 0,
    amazonUrl: amazon('trailer S-cam brake camshaft 16.5')
  },
  {
    category: 'Brakes', seedKey: 'u106-cam-bushing', name: 'Camshaft bushing and seal kit',
    spec: 'Match to the camshaft diameter.', fits: 'Unit #106', qtyNeeded: 0,
    amazonUrl: amazon('brake camshaft bushing seal kit trailer')
  },
  {
    category: 'Brakes', seedKey: 'u106-meritor', name: 'Meritor brake component (labeled)',
    spec: 'Label: T30DR YEL / 23053-A15 J11154 / 1A15 3275J11154',
    partNumber: '23053-A15', fits: 'Unit #106', qtyNeeded: 0,
    amazonUrl: amazon('Meritor T30DR'),
    notes: 'Give the parts counter all three label lines to identify the part.'
  },
  {
    category: 'Tires and wheels', seedKey: 'u106-tire', name: 'Trailer tire 285/75R24.5',
    spec: '285/75R24.5, load range G, 100 psi cold. Existing: Bridgestone R195 Low Profile.',
    fits: 'Unit #106 (8 tires)', qtyNeeded: 0,
    amazonUrl: amazon('285/75R24.5 load range G trailer tire'),
    notes: 'Check DOT date codes; sidewall weathering seen on the tire photographed.'
  },
  {
    category: 'Tires and wheels', seedKey: 'u106-hub-cap', name: 'Oil hub cap',
    spec: 'Oil-bath trailer hub cap with clear window. Existing: Stemco cap, Meritor window ring. Match the bolt count and bolt circle.',
    fits: 'Unit #106', qtyNeeded: 2,
    amazonUrl: amazon('Stemco trailer oil hub cap window'),
    notes: 'Windows are clouded; oil level cannot be checked. Refill to the fill line with the axle oil in use after installing.'
  },
  {
    category: 'Suspension', seedKey: 'u106-air-spring', name: 'Air spring',
    spec: 'ContiTech, molded number partly read: ...910-17... Read the full number before ordering.',
    fits: 'Unit #106 (Neway Anchorlok)', qtyNeeded: 0,
    amazonUrl: amazon('ContiTech air spring trailer Neway')
  },
  {
    category: 'Air and electrical', seedKey: 'gladhand-seals', name: 'Glad hand seals', spec: 'Standard glad hand seal',
    fits: 'All trailers', qtyNeeded: 0,
    amazonUrl: amazon('glad hand seals trailer air brake')
  },
  {
    category: 'Tarp', seedKey: 'u106-tarp-stop', name: 'Roll tarp stop', spec: 'Tarp stop for the roll tube, Shur-Lok roll tarp',
    fits: 'Unit #106', qtyNeeded: 2,
    amazonUrl: amazon('roll tarp stop grain trailer'),
    notes: 'Take an existing stop to match.'
  },
  {
    category: 'Tires and wheels', seedKey: 'u3-drive-tire', name: 'Drive tire 11R22.5',
    spec: '11R22.5 radial, load range G (14 ply rating), 6,175 lb single / 5,840 lb dual at 105 psi.',
    fits: 'Unit #3 (drive axles, 8 tires)', qtyNeeded: 0,
    amazonUrl: amazon('11R22.5 drive tire load range G 14 ply')
  },
  {
    category: 'Tires and wheels', seedKey: 'u3-steer-tire', name: 'Steer tire 11R22.5',
    spec: '11R22.5 radial, tubeless, 6,175 lb single / 5,840 lb dual at 105 psi. Existing: BFGoodrich.',
    fits: 'Unit #3 (steer axle, 2 tires)', qtyNeeded: 0,
    amazonUrl: amazon('11R22.5 steer tire all position load range G')
  },
  {
    category: 'Other', seedKey: 'u3-wiper', name: 'Wiper blade',
    spec: 'Measure the blade length and check the arm connector before ordering.',
    fits: 'Unit #3', qtyNeeded: 2,
    amazonUrl: amazon('heavy duty truck wiper blade International 9300'),
    notes: 'Existing blade has lost its rubber.'
  },
  {
    category: 'Other', seedKey: 'u3-windshield', name: 'Windshield',
    spec: 'International 9300, two-piece windshield. Confirm one or both panes.',
    fits: 'Unit #3', qtyNeeded: 1,
    amazonUrl: amazon('International 9300 windshield'),
    notes: 'Local glass shop supplies and installs; update the quantity if both panes are replaced.'
  },
  {
    category: 'Tires and wheels', seedKey: 'u3-wheel-caps', name: 'Wheel caps (hub and axle covers)',
    spec: 'For aluminum 10-hole wheels: steer hub covers and drive axle covers. Measure the hub and axle flange diameter.',
    fits: 'Unit #3 (2 steer, 4 drive)', qtyNeeded: 6,
    amazonUrl: amazon('semi truck hub cover axle cover set 10 lug aluminum wheel')
  },
  {
    category: 'Tires and wheels', seedKey: 'u3-lug-caps', name: 'Lug nut caps',
    spec: 'Push-on caps for hub-piloted flange nuts, normally 33 mm. Check one nut with a wrench first.',
    fits: 'Unit #3 (10 per wheel, 6 wheel ends)', qtyNeeded: 60,
    amazonUrl: amazon('33mm lug nut covers semi truck 60 pack')
  },
  {
    category: 'Filters', seedKey: 'u3-fuel-1', name: 'Fuel filter 1', spec: 'NAPA 3384',
    partNumber: 'NAPA 3384', fits: 'Unit #3 (Cat 3406E)', qtyNeeded: 0,
    amazonUrl: amazon('NAPA 3384 fuel filter'),
    otherUrl: 'https://www.napaonline.com/en/search?text=3384'
  },
  {
    category: 'Filters', seedKey: 'u3-fuel-2', name: 'Fuel filter 2', spec: 'NAPA 3439',
    partNumber: 'NAPA 3439', fits: 'Unit #3 (Cat 3406E)', qtyNeeded: 0,
    amazonUrl: amazon('NAPA 3439 fuel filter'),
    otherUrl: 'https://www.napaonline.com/en/search?text=3439'
  },
  {
    category: 'Filters', seedKey: 'u3-air', name: 'Air filter', spec: 'Baldwin RS3530, radial seal',
    partNumber: 'Baldwin RS3530', fits: 'Unit #3 (International air cleaner)', qtyNeeded: 0,
    amazonUrl: amazon('Baldwin RS3530 air filter')
  },
  {
    category: 'Filters', seedKey: 'u3-oil', name: 'Oil filter', spec: 'NAPA 7792',
    partNumber: 'NAPA 7792', fits: 'Unit #3 (Cat 3406E)', qtyNeeded: 0,
    amazonUrl: amazon('NAPA 7792 oil filter'),
    otherUrl: 'https://www.napaonline.com/en/search?text=7792'
  }
];
