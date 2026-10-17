// Starting parts list, built from the Unit #106 photos (Oct 2026).
// Amazon links are searches by size and type; open one, pick the listing that
// matches the spec, and save that product link on the part.
// Raise seedRev on an entry to push corrected details to a saved copy that has
// not been edited on the site.
const amazon = q => 'https://www.amazon.com/s?k=' + encodeURIComponent(q);

module.exports = [
  {
    category: 'Lighting', seedKey: 'u106-marker-red', seedRev: 4, name: 'Red marker / clearance lamp',
    spec: 'Peterson 157R LED, red, 6 in x 2 in, 6 diodes, PC-rated, 2-screw surface mount on 4.8 in centers, plug-in receptacle on the back. Replaces the original Peterson 155 series red lamp.',
    partNumber: 'Peterson 157R', fits: 'Unit #106', qtyNeeded: 5,
    amazonUrl: amazon('Peterson 157R LED clearance marker light red'),
    otherUrl: 'https://www.vehiclesafetysupply.com/peterson-led-marker-clearance-pc-rated-rectangular-quot-x2-quot-157r-p-191386.html',
    notes: '5 needed. Vehicle Safety Supply listed $17.14 each, in stock (Oct 2026). Measure the screw-hole centers on an old lamp first; 4.8 in confirms the fit. Uses the Peterson 160-49 plug, the same family as the original 155.'
  },
  {
    category: 'Lighting', seedKey: 'u106-marker-amber', seedRev: 4, name: 'Amber side marker / clearance lamp',
    spec: 'Peterson 157A LED, amber, 6 in x 2 in, 6 diodes, PC-rated, 2-screw surface mount on 4.8 in centers, plug-in receptacle on the back. Replaces the original Peterson 155 series amber lamp.',
    partNumber: 'Peterson 157A', fits: 'Unit #106', qtyNeeded: 4,
    amazonUrl: amazon('Peterson 157A LED clearance marker light amber'),
    otherUrl: 'https://www.vehiclesafetysupply.com/peterson-led-marker-clearance-pc-rated-rectangular-quot-x2-quot-157a-p-191385.html',
    notes: '4 needed. Vehicle Safety Supply listed $17.14 each, in stock (Oct 2026). Measure the screw-hole centers on an old lamp first; 4.8 in confirms the fit. Uses the Peterson 160-49 plug, the same family as the original 155.'
  },
  {
    category: 'Lighting', seedKey: 'u106-plug-160-49', name: 'Marker lamp plug',
    spec: 'Peterson 160-49 right-angle two-wire plug, 8 in leads, #10 ring terminal and stripped end. Fits Peterson 155, 157, 158 and 160 series lamps.',
    partNumber: 'Peterson 160-49', fits: 'Unit #106 marker lamps', qtyNeeded: 0,
    amazonUrl: amazon('Peterson 160-49 marker lamp plug'),
    otherUrl: 'https://www.vehiclesafetysupply.com/peterson-160-49-marker-lamp-plug-quot-lead-p-190742.html',
    notes: 'Listed at $2.71 (Oct 2026). Replace any panel plug that is corroded; set the quantity once each socket is checked.'
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
    category: 'Other', seedKey: 'u3-windshield', seedRev: 4, name: 'Windshield panes (both, new)',
    spec: 'International 9300 flat two-piece windshield glass. Candidate: new glass, International OEM 3535579C2, listed for the 9300 by LKQ Evans Heavy Truck Parts, Athens GA, (855) 557-8782, $192.82. Side and year range not stated on the listing.',
    partNumber: '3535579C2 (confirm by VIN)', fits: 'Unit #3 (left and right)', qtyNeeded: 2,
    amazonUrl: amazon('International 9300 9370 9400 flat windshield glass left right'),
    otherUrl: 'https://www.heavytruckparts.net/item/International/9300/Glass-Windshield/254076/24/828196?oemnum=3535579C2',
    notes: 'Both panes, new. Installer: NOVUS Glass Sterling, (970) 520-2525, quote requested. Call with VIN 2HSFBASR3TC064091 to confirm 3535579C2 fits a 1996 9300 and whether one number covers both sides or each side has its own. Freight and installation by a glass shop are extra; get the shop quote first.'
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
  },
  {
    category: 'Filters', seedKey: 'ram1500-oil', name: 'Oil filter', spec: 'WIX 57899XP (XP synthetic media); O\'Reilly lookup: 57060 does not fit',
    partNumber: 'WIX 57899XP', fits: '2011 Dodge Ram 1500 5.7L HEMI (VIN 1D7RV1CT9BS668428)', qtyNeeded: 0,
    amazonUrl: amazon('WIX 57899XP oil filter'),
    otherUrl: 'https://www.oreillyauto.com/search?q=57899XP'
  },
  {
    category: 'Filters', seedKey: 'ram1500-air', name: 'Engine air filter', spec: 'WIX 42725, panel',
    partNumber: 'WIX 42725', fits: '2011 Dodge Ram 1500 5.7L HEMI (VIN 1D7RV1CT9BS668428)', qtyNeeded: 0,
    amazonUrl: amazon('WIX 42725 air filter'),
    otherUrl: 'https://www.oreillyauto.com/search?q=42725'
  },
  {
    category: 'Other', seedKey: 'rogator-coolant-tank', seedRev: 3, name: 'Coolant expansion tank', spec: 'AGCO 4348254M5 (supersedes 4348254M3 and 4280681M1); Regier Equipment, Madrid NE, $185.40 (Oct 2026)',
    partNumber: 'AGCO 4348254M5', fits: 'Unit #208 AG CHEM 1300 Rogator', qtyNeeded: 0,
    amazonUrl: amazon('4348254M5'),
    otherUrl: 'https://www.regierequipment.com'
  },
  {
    category: 'Other', seedKey: 'rogator-coolant-cap', seedRev: 2, name: 'Expansion tank threaded pressure cap', spec: 'AGCO threaded cap for tank 4348254M5 (not included with the tank); part number from Regier, (308) 326-4245. The old 95 kPa twist-on cap does not fit.',
    partNumber: 'AGCO cap for 4348254M5 (number pending)', fits: 'Unit #208 AG CHEM 1300 Rogator', qtyNeeded: 1,
    amazonUrl: amazon('AGCO expansion tank threaded cap 4348254M5'),
    otherUrl: 'https://www.regierequipment.com'
  },
  {
    category: 'Filters', seedKey: 'rogator-air-primary', name: 'Engine air filter, primary', spec: 'Donaldson PowerCore housing PSD10-0176 (OEM 544935D1); from the housing label',
    partNumber: 'AGCO 4286479M2', fits: 'Unit #208 RoGator RG1300 (AGCO SISU Power 8.4L)', qtyNeeded: 0,
    amazonUrl: amazon('4286479M2 air filter'),
    otherUrl: 'https://www.regierequipment.com'
  },
  {
    category: 'Filters', seedKey: 'rogator-air-safety', name: 'Engine air filter, safety', spec: 'Donaldson PowerCore housing PSD10-0176 (OEM 544935D1); from the housing label',
    partNumber: 'AGCO 4286474M1', fits: 'Unit #208 RoGator RG1300 (AGCO SISU Power 8.4L)', qtyNeeded: 0,
    amazonUrl: amazon('4286474M1 safety filter'),
    otherUrl: 'https://www.regierequipment.com'
  },
  {
    category: 'Other', seedKey: 'rogator-drive-belt', seedRev: 2, name: 'Drive belt, 4-rib (broke Oct 17, 2026)', spec: 'Old belt: 4 ribs, about 58.5 in measured along the back (rough; broken in two, 30.5 + 28 in), so about 57.5-58 in effective. ' +
      'Closest standard belt: Gates K040575 (4 rib, 57.5 in effective, 4PK1460). Have the counter measure the old pieces on a belt gauge, or string the pulleys with the tensioner mid-travel, to confirm. ' +
      'Not AGCO 564691D1: that is the C-series A/C and water pump belt, 1366 mm (53.75 in). The alternator/fan belt on the C-series is 588347D1, 12-rib.',
    partNumber: 'Gates K040575 (4PK1460), confirm length', fits: 'Unit #208 RoGator RG1300 (AGCO SISU Power 8.4L)', qtyNeeded: 1,
    amazonUrl: amazon('Gates K040575'),
    otherUrl: 'https://www.napaonline.com/en/search?text=K040575'
  }
];
