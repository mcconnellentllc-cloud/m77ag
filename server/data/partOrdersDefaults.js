// Starting vendors and orders. Orders link to parts by seed key and to the
// unit by serial/VIN when the record exists.
module.exports = {
  vendors: [
    {
      seedKey: 'vss', name: 'Vehicle Safety Supply',
      website: 'https://www.vehiclesafetysupply.com', phone: '877-295-6411',
      accountEmail: 'kyle@togoag.com',
      notes: 'Peterson lighting. Account under McConnell Enterprises. Password is kept in the browser password manager, not here.'
    },
    {
      seedKey: 'amazon', name: 'Amazon', website: 'https://www.amazon.com',
      notes: 'Business account delivering to McConnell Enterprises LLC, Haxtun.'
    },
    {
      seedKey: 'novus-sterling', name: 'NOVUS Glass - Sterling',
      website: 'https://www.novusglass.com/en-us/shop/sterling/', phone: '970-520-2525',
      notes: 'Glass shop for all M77 vehicles and equipment: trucks, semi tractors, trailers, tractors, combines, pickups. 932 Hamilton St, Sterling, CO 80751. Mon-Fri 8:30 AM-5:00 PM, closed weekends. Mobile service in Logan, Morgan, Phillips, Sedgwick, Washington and Yuma counties. Quote requested Oct 2026 for both Unit #3 windshield panes, installed.'
    }
  ],
  orders: [
    {
      seedKey: 'vss-2026-10-15', vendorKey: 'vss', orderDate: '2026-10-15',
      serial: '1TDH45022YB098230', unitLabel: 'Unit #106 Timpte',
      lines: [
        { partKey: 'u106-marker-red', name: 'Peterson 157R red LED marker / clearance', partNumber: 'PET-157R', qty: 5, unitPrice: 17.14 },
        { partKey: 'u106-marker-amber', name: 'Peterson 157A amber LED marker / clearance', partNumber: 'PET-157A', qty: 5, unitPrice: 17.14 },
        { partKey: 'u106-plug-160-49', name: 'Peterson 160-49 marker lamp plug, 8 in lead', partNumber: 'PET-160-49', qty: 5, unitPrice: 2.71 }
      ],
      shipping: 13.95, status: 'ordered',
      invoiceNumber: '218888', paidDate: '2026-10-15T17:26:16Z',
      notes: 'Ground shipping. Ship to McConnell Enterprises, Haxtun. One spare amber lamp.'
    },
    // One Amazon checkout ($360.67) split by unit. Tax $13.52 and regulatory
    // fee $0.31 are shared by each unit's share of the items: $6.78 and $7.05.
    {
      seedKey: 'amazon-2026-10-15-u106', vendorKey: 'amazon', orderDate: '2026-10-15',
      serial: '1TDH45022YB098230', unitLabel: 'Unit #106 Timpte',
      lines: [
        { partKey: 'u106-conspicuity', name: 'SWRT DOT-C2 reflective tape, red/white, 2 in x 200 ft', qty: 1, unitPrice: 26.99 },
        { partKey: 'u106-conspicuity', name: 'Seven Sparta DOT-C2 reflective tape, red/white, 2 in x 200 ft', qty: 1, unitPrice: 21.99 },
        { partKey: 'u106-tarp-stop', name: 'Easy-Off cast aluminum roll tarp stop upright kit (6 count)', partNumber: '1705454-6', qty: 1, unitPrice: 83.00, packOf: 6 },
        { partKey: 'u106-hub-cap', name: 'CheeMuii trailer hub oil caps, 4 pack, replaces Stemco 343-4009', partNumber: '343-4009', qty: 1, unitPrice: 37.99, packOf: 4 }
      ],
      shipping: 0, tax: 6.78, status: 'ordered',
      notes: 'Part of one Amazon checkout of $360.67 with Unit #3 parts. Tax and fees split by item share. Add the Amazon order number once placed.'
    },
    {
      seedKey: 'amazon-2026-10-15-u3', vendorKey: 'amazon', orderDate: '2026-10-15',
      serial: '2HSFBASR3TC064091', unitLabel: 'Unit #3 International 9300',
      lines: [
        { partKey: 'u3-wiper', name: 'PEAK Transport heavy duty wiper blade, 36 in, saddle arm', qty: 1, unitPrice: 34.99 },
        { partKey: 'u3-wheel-caps', name: 'Aeagle dome axle cover kit, 2 front and 4 rear, 10 hole, with screw-on 33 mm lug nut covers', qty: 1, unitPrice: 141.88, packOf: 6 },
        { partKey: 'u3-lug-caps', name: '33 mm lug nut covers (included in the Aeagle kit)', qty: 60, unitPrice: 0 }
      ],
      shipping: 0, tax: 7.05, status: 'ordered',
      notes: 'Part of one Amazon checkout of $360.67 with Unit #106 parts. Tax and fees split by item share. Add the Amazon order number once placed.'
    }
  ]
};
