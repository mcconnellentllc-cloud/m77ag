// Chemical Products from Crop Protect Direct
// Data source: Price comparison spreadsheet

const chemicalProducts = [
  // Dicamba Products
  {
    productName: 'Dicamba DMA',
    packSize: '2x2.5',
    units: 'gl',
    currentPrice: 30.25,
    supplier: 'CPD Alternate',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 31.24, packSize: '2x2.5' }
    ],
    category: 'herbicide',
    applicationTiming: 'post-emerge',
    containerSizes: [{ size: 2.5, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },
  {
    productName: 'Dicamba DMA',
    packSize: 'Shuttle',
    units: 'gl',
    currentPrice: 28.25,
    supplier: 'CPD Alternate',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 30.89, packSize: 'Shuttle' }
    ],
    category: 'herbicide',
    applicationTiming: 'post-emerge',
    containerSizes: [{ size: 105, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },
  {
    productName: 'Dicamba HD',
    packSize: 'Shuttle',
    units: 'gl',
    currentPrice: 30.57,
    supplier: 'CPD Alternate',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 35.31, packSize: 'Shuttle' }
    ],
    category: 'herbicide',
    applicationTiming: 'post-emerge',
    containerSizes: [{ size: 105, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },

  // LV 6 Products
  {
    productName: 'LV 6',
    packSize: '2x2.5',
    units: 'gl',
    currentPrice: 30.57,
    supplier: 'CPD Alternate',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 32.43, packSize: '2x2.5' }
    ],
    category: 'herbicide',
    applicationTiming: 'post-emerge',
    containerSizes: [{ size: 2.5, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },
  {
    productName: 'LV 6',
    packSize: 'Shuttle',
    units: 'gl',
    currentPrice: 28.57,
    supplier: 'CPD Alternate',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 30.14, packSize: 'Shuttle' }
    ],
    category: 'herbicide',
    applicationTiming: 'post-emerge',
    containerSizes: [{ size: 105, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },

  // RT3 and Glyphosate Products
  {
    productName: 'RT3',
    packSize: 'Shuttle',
    units: 'gl',
    currentPrice: 14.95,
    supplier: 'AgSaver',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 17.50, packSize: 'Shuttle' }
    ],
    category: 'herbicide',
    applicationTiming: 'burndown',
    notes: 'Formulation equiv -11%',
    containerSizes: [{ size: 105, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },
  {
    productName: 'Glystar Supreme',
    packSize: 'Shuttle',
    units: 'gl',
    currentPrice: 14.95,
    supplier: 'AgSaver',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 15.53, packSize: 'Shuttle' }
    ],
    category: 'herbicide',
    applicationTiming: 'burndown',
    notes: 'Formulation equiv -25%',
    containerSizes: [{ size: 105, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },
  {
    productName: 'Aatex',
    packSize: 'Shuttle',
    units: 'gl',
    currentPrice: 13.35,
    supplier: 'Aatex',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 12.78, packSize: 'Shuttle' }
    ],
    category: 'herbicide',
    applicationTiming: 'pre-emerge',
    containerSizes: [{ size: 105, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },

  // Level Best Pro Products
  {
    productName: 'Level Best Pro',
    packSize: '2x2.5',
    units: 'gl',
    currentPrice: 39.25,
    supplier: 'Agri-Star',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 43.83, packSize: '2x2.5' }
    ],
    category: 'herbicide',
    applicationTiming: 'post-emerge',
    notes: 'Need to get equivalents',
    containerSizes: [{ size: 2.5, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },
  {
    productName: 'Level Best Pro',
    packSize: 'Shuttle',
    units: 'gl',
    currentPrice: 38.13,
    supplier: 'Agri-Star',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 42.42, packSize: 'Shuttle' }
    ],
    category: 'herbicide',
    applicationTiming: 'post-emerge',
    notes: 'Need to get equivalents',
    containerSizes: [{ size: 105, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },

  // Tapran Products
  {
    productName: 'Tapran',
    packSize: '2x2.5',
    units: 'gl',
    currentPrice: 19.00,
    supplier: 'Agri-Star',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 28.71, packSize: '2x2.5' }
    ],
    category: 'herbicide',
    notes: 'Need to get equivalents',
    containerSizes: [{ size: 2.5, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },
  {
    productName: 'Tapran',
    packSize: 'Shuttle',
    units: 'gl',
    currentPrice: 18.00,
    supplier: 'Agri-Star',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 28.16, packSize: 'Shuttle' }
    ],
    category: 'herbicide',
    notes: 'Need to get equivalents',
    containerSizes: [{ size: 105, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },

  // Aggrestrol Products
  {
    productName: 'Aggrestrol',
    packSize: '2x2.5',
    units: 'gl',
    currentPrice: 21.00,
    supplier: 'Aggrestrol',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 33.81, packSize: '2x2.5' }
    ],
    category: 'herbicide',
    notes: 'Need to get equivalents',
    containerSizes: [{ size: 2.5, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },
  {
    productName: 'Aggrestrol',
    packSize: 'Shuttle',
    units: 'gl',
    currentPrice: 20.00,
    supplier: 'Aggrestrol',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 32.37, packSize: 'Shuttle' }
    ],
    category: 'herbicide',
    notes: 'Need to get equivalents',
    containerSizes: [{ size: 105, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },

  // Artect F1 Products (NA - Need pricing)
  {
    productName: 'Artect F1',
    packSize: '2x2.5',
    units: 'gl',
    currentPrice: 0,
    supplier: 'Artect F1',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 84.71, packSize: '2x2.5' }
    ],
    category: 'fungicide',
    notes: 'Need to get pricing',
    containerSizes: [{ size: 2.5, unit: 'gl', available: false }],
    inStock: false,
    active: false
  },
  {
    productName: 'Artect F1',
    packSize: 'Shuttle',
    units: 'gl',
    currentPrice: 0,
    supplier: 'Artect F1',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 84.71, packSize: 'Shuttle' }
    ],
    category: 'fungicide',
    notes: 'Need to get pricing',
    containerSizes: [{ size: 105, unit: 'gl', available: false }],
    inStock: false,
    active: false
  },

  // Sulfentrazone
  {
    productName: 'Sulfentrazone',
    packSize: '2x2.5',
    units: 'gl',
    currentPrice: 70.50,
    supplier: 'Sulfentrazone',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 75.20, packSize: '2x2.5' }
    ],
    category: 'herbicide',
    applicationTiming: 'pre-emerge',
    containerSizes: [{ size: 2.5, unit: 'gl', available: true }],
    inStock: true,
    active: true
  },

  // Autumn Super (NA - Need pricing)
  {
    productName: 'Autumn Super',
    packSize: '20',
    units: 'oz',
    currentPrice: 0,
    supplier: 'Autumn Super',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 22.58, packSize: '20' }
    ],
    category: 'herbicide',
    notes: 'Need to get pricing',
    containerSizes: [{ size: 20, unit: 'oz', available: false }],
    inStock: false,
    active: false
  },

  // Valor SX
  {
    productName: 'Valor SX',
    packSize: '4x5',
    units: 'lb',
    currentPrice: 14.25,
    supplier: 'Valor SX',
    alternativeSuppliers: [
      { supplierName: 'Crop Protect Direct', price: 15.06, packSize: '4x5' }
    ],
    category: 'herbicide',
    applicationTiming: 'pre-emerge',
    containerSizes: [{ size: 5, unit: 'lb', available: true }],
    inStock: true,
    active: true
  }
];

module.exports = chemicalProducts;
