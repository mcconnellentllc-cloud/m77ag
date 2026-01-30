/**
 * Equipment Seed Script
 * Imports all equipment from CSV data into MongoDB
 * All equipment is set to forSale: false (private) by default
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Equipment = require('../models/equipment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

// CSV data parsed into equipment records
const equipmentData = [
  // GVW Trucks
  {
    title: '1984 International Water Truck',
    subtitle: '3200 gal tank - 3" pump',
    category: 'Trucks',
    year: 1984,
    make: 'International',
    description: 'Water Truck - 3200 gal tank - 3" pump',
    purchasePrice: 12500,
    currentValue: 18000,
    vin: '1HSZBJWR0EHA52860',
    serialNumber: '1HSZBJWR0EHA52860',
    purchaseDate: new Date('2000-01-01'),
    notes: 'Unit #1, License: 158AUV, Title: 37E089299, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '1996 International 9300',
    subtitle: 'White Int. Semi',
    category: 'Trucks',
    year: 1996,
    make: 'International',
    model: '9300',
    description: '03 White Int.',
    purchasePrice: 18264,
    currentValue: 17000,
    vin: '2HSFBASR3TC064091',
    serialNumber: '2HSFBASR3TC064091',
    purchaseDate: new Date('2009-11-01'),
    notes: 'Unit #3, License: 044EXT, Title: 37E085728, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '1999 International 9300',
    subtitle: 'White Int. Semi',
    category: 'Trucks',
    year: 1999,
    make: 'International',
    model: '9300',
    description: '04 White Int.',
    purchasePrice: 30024,
    currentValue: 25000,
    vin: '2HSFBAER8XC071832',
    serialNumber: '2HSFBAER8XC071832',
    purchaseDate: new Date('2012-04-01'),
    notes: 'Unit #4, License: 547HSG, Title: 37E090038, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // Titled Vehicles
  {
    title: '2011 Ford F250',
    subtitle: "Kyle's Silver Pickup",
    category: 'Trucks',
    year: 2011,
    make: 'Ford',
    model: 'F250',
    description: "Kyle's Silver Pickup",
    purchasePrice: 32100,
    currentValue: 45000,
    currentMiles: 160000,
    vin: '1FT7W2BT4BEB88396',
    serialNumber: '1FT7W2BT4BEB88396',
    purchaseDate: new Date('2013-02-01'),
    notes: 'Unit #53, License: 225YOO, Owner: Personal (Kyle), Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '1979 Pontiac Trans AM',
    subtitle: 'Classic Trans AM',
    category: 'Other',
    year: 1979,
    make: 'Pontiac',
    model: 'Trans AM',
    purchasePrice: 6753,
    currentValue: 7000,
    currentMiles: 65000,
    vin: '2W87K9L155721',
    serialNumber: '2W87K9L155721',
    purchaseDate: new Date('1979-07-01'),
    notes: 'Unit #57, Title: 37E061442, Owner: Personal, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2001 Roadmaster Diplomat RV',
    subtitle: 'Motor Home',
    category: 'Other',
    year: 2001,
    make: 'Roadmaster',
    model: 'Diplomat',
    description: 'RV',
    purchasePrice: 37878,
    currentValue: 37500,
    currentMiles: 92000,
    amountOwed: 28274.95,
    hasLoan: true,
    vin: '1RF12051312013422',
    serialNumber: '1RF12051312013422',
    purchaseDate: new Date('2019-07-01'),
    notes: 'Unit #58, Owner: Personal, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Toyota Camry',
    subtitle: "Brandi's Grey Camry",
    category: 'Other',
    make: 'Toyota',
    model: 'Camry',
    description: 'Grey Camry',
    notes: 'Owner: Personal (Brandi), Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Dodge Ram 1500',
    subtitle: 'Red Pickup',
    category: 'Trucks',
    make: 'Dodge',
    model: 'Ram 1500',
    description: 'Red Dodge 1500',
    currentMiles: 65000,
    notes: 'Owner: Personal, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Cadillac Escalade',
    subtitle: 'SUV',
    category: 'Other',
    make: 'Cadillac',
    model: 'Escalade',
    currentMiles: 104000,
    notes: 'Owner: Personal, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // NON Titled Vehicles
  {
    title: '1998 Chevrolet S10',
    subtitle: 'White Pickup',
    category: 'Trucks',
    year: 1998,
    make: 'Chevrolet',
    model: 'S10',
    description: 'White Pickup',
    purchasePrice: 2750,
    currentValue: 4000,
    vin: '1GCCT19WOW8196128',
    serialNumber: '1GCCT19WOW8196128',
    purchaseDate: new Date('2018-07-01'),
    notes: 'Unit #80, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Green Truck',
    subtitle: 'Farm Truck',
    category: 'Trucks',
    currentValue: 4000,
    notes: 'Unit #81, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // Titled Trailers
  {
    title: '1991 Travelong Cattle Trailer 20ft',
    subtitle: '20\' Cattle Trailer',
    category: 'Trailers',
    year: 1991,
    make: 'Travelong',
    description: 'Cattle 20\'',
    purchasePrice: 4600,
    currentValue: 4000,
    serialNumber: '138GS2022M1009531',
    purchaseDate: new Date('1991-02-01'),
    notes: 'Unit #100, License: P55143, Title: 37E089298, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2008 Titan Cattle Trailer 24ft',
    subtitle: '24\' Tan Cattle Trailer',
    category: 'Trailers',
    year: 2008,
    make: 'Titan',
    description: 'Cattle 24\' Tan',
    purchasePrice: 7500,
    currentValue: 6000,
    purchaseDate: new Date('2020-02-01'),
    notes: 'Unit #101, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2005 Titan Cattle Trailer 24ft',
    subtitle: '24\' White Cattle Trailer',
    category: 'Trailers',
    year: 2005,
    make: 'Titan',
    description: 'Cattle 24\' White',
    purchasePrice: 7500,
    currentValue: 6000,
    serialNumber: '4TGG2420151035629',
    purchaseDate: new Date('2020-02-01'),
    notes: 'Unit #102, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2011 Titan Cattle Trailer 24ft',
    subtitle: '24\' Silver Cattle Trailer',
    category: 'Trailers',
    year: 2011,
    make: 'Titan',
    description: 'Cattle 24\' Silver',
    purchasePrice: 10500,
    currentValue: 8000,
    serialNumber: '4TGG24207C1060970',
    purchaseDate: new Date('2011-01-01'),
    notes: 'Unit #103, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2000 Mauer Grain Trailer',
    subtitle: 'Grain Trailer',
    category: 'Trailers',
    year: 2000,
    make: 'Mauer',
    description: 'Grain Trailer',
    purchasePrice: 16000,
    currentValue: 300,
    serialNumber: '1M9KG4220YS152965',
    purchaseDate: new Date('2001-05-01'),
    notes: 'Unit #104, License: 673ATG, Title: 37E089282, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '1986 DMH Fontaine Trailer',
    subtitle: 'Flatbed Trailer',
    category: 'Trailers',
    year: 1986,
    make: 'DMH',
    model: 'Fontaine',
    purchasePrice: 10500,
    currentValue: 9000,
    serialNumber: '13N1422C4G1540298',
    purchaseDate: new Date('2007-11-01'),
    notes: 'Unit #105, License: 843SBH, Title: 37E089303, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2000 Timpte Grain Trailer',
    subtitle: 'Grain Trailer',
    category: 'Trailers',
    year: 2000,
    make: 'Timpte',
    description: 'Grain Trailer',
    purchasePrice: 25000,
    currentValue: 23000,
    serialNumber: '1TDH45022YB098230',
    purchaseDate: new Date('2009-07-01'),
    notes: 'Unit #106, License: 410VYJ, Title: 37E086808, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2012 Doolittle Deckover Trailer',
    subtitle: 'Deckover Trailer',
    category: 'Trailers',
    year: 2012,
    make: 'Doolittle',
    model: 'Deckover',
    purchasePrice: 7250,
    currentValue: 7500,
    serialNumber: '1DGDV2526CM099435',
    purchaseDate: new Date('2012-08-01'),
    notes: 'Unit #107, License: 578WFK, Title: 37E090978, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2011 GR Dump Trailer',
    subtitle: 'Dump Trailer',
    category: 'Trailers',
    year: 2011,
    make: 'GR',
    description: 'Dump Trailer',
    purchasePrice: 9000,
    currentValue: 5300,
    serialNumber: '3BZBN162XBC006118',
    purchaseDate: new Date('2012-08-01'),
    notes: 'Unit #108, License: 577WFK, Title: 37E090977, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // NON Titled Trailers
  {
    title: '1984 Golf Trailer',
    subtitle: 'Golf Cart Trailer',
    category: 'Trailers',
    year: 1984,
    make: 'Golf Trailer',
    purchasePrice: 1000,
    currentValue: 500,
    serialNumber: 'ID134224CO',
    purchaseDate: new Date('1998-01-01'),
    notes: 'Unit #150, License: P056594, Title: 37E089287, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2012 Wemhoff Header Trailer',
    subtitle: 'Header Trailer',
    category: 'Trailers',
    year: 2012,
    make: 'Wemhoff',
    model: 'Header',
    purchasePrice: 4500,
    currentValue: 4500,
    serialNumber: '12111952',
    purchaseDate: new Date('2012-11-01'),
    notes: 'Unit #152, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '1982 Old Pioneer Weigh Trailer',
    subtitle: 'Weigh Wagon',
    category: 'Trailers',
    year: 1982,
    description: 'Old Pioneer Weigh',
    purchasePrice: 8000,
    currentValue: 1000,
    notes: 'Unit #153, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2009 Parkan Weigh Wagon',
    subtitle: 'PK-302618 Weigh Wagon',
    category: 'Trailers',
    year: 2009,
    make: 'Parkan',
    model: 'PK-302618',
    description: 'Weigh Wagon',
    purchasePrice: 15000,
    currentValue: 3500,
    serialNumber: '1P9AB19339S276116',
    notes: 'Unit #154, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Donahue Lowboy Draper Head Trailer',
    subtitle: 'Draper Head Trailer',
    category: 'Trailers',
    make: 'Donahue',
    model: 'Lowboy',
    description: 'Draper Head Trailer',
    purchasePrice: 400,
    currentValue: 400,
    purchaseDate: new Date('2009-03-01'),
    notes: 'Unit #155, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '1975 Belly Dump Trailer',
    subtitle: 'C238 Belly Dump',
    category: 'Trailers',
    year: 1975,
    model: 'C238',
    description: 'Belly Dump',
    purchasePrice: 3200,
    currentValue: 2500,
    notes: 'Unit #156, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2005 ADS Bulk Seed Buggy',
    subtitle: 'Seed Tender',
    category: 'Trailers',
    year: 2005,
    make: 'ADS',
    description: 'Bulk Seed Buggy',
    purchasePrice: 5000,
    currentValue: 5000,
    serialNumber: '7888',
    notes: 'Unit #158, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2002 Seed Tender',
    subtitle: 'Seed Tender Trailer',
    category: 'Trailers',
    year: 2002,
    description: 'Seed Tender',
    purchasePrice: 4500,
    currentValue: 1000,
    notes: 'Unit #159, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // Power Units
  {
    title: '2006 John Deere 8420',
    subtitle: 'Tractor w/o Loader',
    category: 'Tractors',
    year: 2006,
    make: 'John Deere',
    model: '8420',
    description: 'w/o Loader',
    purchasePrice: 149000,
    currentValue: 90000,
    serialNumber: 'RW8420P037284',
    currentHours: 7000,
    purchaseDate: new Date('2010-04-01'),
    notes: 'Unit #200, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2014 John Deere H480 Loader',
    subtitle: 'Loader for 8420',
    category: 'Attachments',
    year: 2014,
    make: 'John Deere',
    model: 'H480',
    description: 'Loader for 8420',
    purchasePrice: 19736,
    currentValue: 15900,
    serialNumber: '1P0H480XCEC004614',
    purchaseDate: new Date('2014-11-01'),
    notes: 'Unit #201, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Cat 930 Loader',
    subtitle: 'Wheel Loader',
    category: 'Tractors',
    make: 'Caterpillar',
    model: '930',
    description: 'Wheel Loader',
    hasLoan: true,
    amountOwed: 6161.03,
    lender: 'Points West Bank',
    loanAccountNumber: '9719',
    paymentAmount: 6263.62,
    nextPaymentDate: new Date('2026-07-01'),
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere 3020 Tractor w/ Loader',
    subtitle: 'Tractor with Loader',
    category: 'Tractors',
    make: 'John Deere',
    model: '3020',
    description: 'Tractor w/ loader',
    purchasePrice: 8000,
    currentValue: 8000,
    serialNumber: 'T113P099434R',
    notes: 'Unit #204, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2022 John Deere 8370RT',
    subtitle: 'Track Tractor',
    category: 'Tractors',
    year: 2022,
    make: 'John Deere',
    model: '8370RT',
    serialNumber: '1RW8370REJD920111',
    currentHours: 3252,
    currentValue: 230000,
    marketValue: 230000,
    marketValueSource: 'TractorHouse/Agriaffaires comparables',
    marketValueDate: new Date('2026-01-30'),
    hasLoan: true,
    amountOwed: 222738.76,
    lender: 'Points West Bank',
    loanAccountNumber: '9914',
    paymentAmount: 65243.91,
    nextPaymentDate: new Date('2026-09-01'),
    notes: 'Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2023 John Deere 6145R',
    subtitle: 'Row Crop Tractor',
    category: 'Tractors',
    year: 2023,
    make: 'John Deere',
    model: '6145R',
    serialNumber: '1L06145RCNP149997',
    currentHours: 496,
    currentValue: 185000,
    marketValue: 185000,
    marketValueSource: 'TractorHouse comparables',
    marketValueDate: new Date('2026-01-30'),
    hasLoan: true,
    amountOwed: 153807.97,
    lender: 'Points West Bank',
    loanAccountNumber: '9885',
    paymentAmount: 43335.07,
    nextPaymentDate: new Date('2026-03-01'),
    notes: 'Owner: M77 AG, Insured: No - Loan split 50/50 with 8320R (total $307,615.94)',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2021 John Deere 8320R',
    subtitle: 'Row Crop Tractor',
    category: 'Tractors',
    year: 2021,
    make: 'John Deere',
    model: '8320R',
    serialNumber: '1RW8320REGD113101',
    currentHours: 5686,
    currentValue: 175000,
    marketValue: 175000,
    marketValueSource: 'Machinery Pete comparables',
    marketValueDate: new Date('2026-01-30'),
    hasLoan: true,
    amountOwed: 153807.97,
    lender: 'Points West Bank',
    loanAccountNumber: '9885',
    paymentAmount: 43335.07,
    nextPaymentDate: new Date('2026-03-01'),
    notes: 'Owner: M77 AG, Insured: No - Loan split 50/50 with 6145R (total $307,615.94)',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'International 666 Tractor',
    subtitle: "Roscoe's Tractor",
    category: 'Tractors',
    make: 'International',
    model: '666',
    description: "Roscoe's",
    purchasePrice: 2500,
    currentValue: 2500,
    notes: 'Unit #205, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Ag Chem 1603 Terra Gator Floater',
    subtitle: 'Floater Sprayer',
    category: 'Sprayer Equipment',
    make: 'Ag Chem',
    model: '1603',
    description: 'Terra Gator Floater',
    purchasePrice: 35000,
    currentValue: 22000,
    serialNumber: '1632504',
    purchaseDate: new Date('2015-02-01'),
    notes: 'Unit #207, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'AG CHEM 1300 Rogator',
    subtitle: 'Sprayer',
    category: 'Sprayer Equipment',
    make: 'AG CHEM',
    model: '1300',
    description: 'Rogator',
    purchasePrice: 80000,
    currentValue: 80000,
    serialNumber: 'AGCA1300JCNSL1103',
    notes: 'Unit #208, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2002 Schaben 1600 Gal Chemical Tender',
    subtitle: '1600 Gal Chem Trailer',
    category: 'Sprayer Equipment',
    year: 2002,
    make: 'Schaben',
    description: '1600 gallon water tender with chemical eductor',
    currentValue: 6000,
    notes: 'Unit #209, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Mitsubishi FG25N Forklift',
    subtitle: 'Forklift',
    category: 'Other',
    make: 'Mitsubishi',
    model: 'FG25N',
    description: 'Forklift',
    purchasePrice: 24000,
    currentValue: 19000,
    serialNumber: 'AF17D32650',
    purchaseDate: new Date('1996-01-01'),
    notes: 'Unit #210, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Mitsubishi FG260 Lifting Unit',
    subtitle: 'Lifting unit on Forklift',
    category: 'Attachments',
    make: 'Mitsubishi',
    model: 'FG260',
    description: 'Lifting unit on Forklift',
    purchasePrice: 6000,
    currentValue: 6000,
    serialNumber: 'SSH039P251',
    notes: 'Unit #211, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2007 Donkey Forklift',
    subtitle: 'Forklift',
    category: 'Other',
    year: 2007,
    make: 'Donkey',
    description: 'Forklift',
    purchasePrice: 30000,
    currentValue: 10000,
    purchaseDate: new Date('2007-01-01'),
    notes: 'Unit #212, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // Equipment
  {
    title: 'Westfield MK100-71 Auger',
    subtitle: '10x71 Auger',
    category: 'Other',
    make: 'Westfield',
    model: 'MK100-71',
    description: '10*17 Auger',
    purchasePrice: 7200,
    currentValue: 5000,
    serialNumber: '170708',
    purchaseDate: new Date('2006-11-01'),
    notes: 'Unit #300, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2019 Quick Belt 18-40 Conveyor',
    subtitle: 'Grain Conveyor',
    category: 'Other',
    year: 2019,
    make: 'Quick Belt',
    model: '18-40',
    description: 'Conveyor',
    purchasePrice: 10000,
    currentValue: 10000,
    notes: 'Unit #301, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Claas 760 Combine',
    subtitle: 'Combine Harvester',
    category: 'Harvest Equipment',
    make: 'Claas',
    model: 'Lexion 760',
    description: 'Combine Harvester - 2200 engine hours, 1750 separator hours',
    serialNumber: 'C7900519',
    currentHours: 2200,
    currentValue: 205000,
    marketValue: 205000,
    marketValueSource: 'Machinery Pete/Agriaffaires comparables',
    marketValueDate: new Date('2026-01-30'),
    notes: 'Unit #302, Owner: M77 AG, Insured: Yes, Separator Hours: 1750',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: "Honey Bee 36' Draper Head",
    subtitle: '36\' Draper Head',
    category: 'Harvest Equipment',
    make: 'Honey Bee',
    description: "36' Draper Head for Combine",
    serialNumber: '',
    purchasePrice: 0,
    currentValue: 0,
    notes: 'Unit #303, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Drago GT 12 Row Corn Head',
    subtitle: '12 Row Corn Head',
    category: 'Harvest Equipment',
    year: 2012,
    make: 'Drago',
    model: 'GT',
    description: '12 Row corn head',
    serialNumber: '',
    purchasePrice: 102000,
    currentValue: 25000,
    hasLoan: true,
    amountOwed: 34803.59,
    lender: 'Points West Bank',
    loanAccountNumber: '9910',
    paymentAmount: 10046.27,
    nextPaymentDate: new Date('2026-07-01'),
    notes: 'Unit #304, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Brent Avalanche 1196 Grain Cart',
    subtitle: 'Grain Cart',
    category: 'Harvest Equipment',
    make: 'Brent',
    model: 'Avalanche 1196',
    description: 'Grain Cart for harvest operations - 1100 bushel capacity',
    currentValue: 45000,
    marketValue: 45000,
    marketValueSource: 'TractorHouse/Machinery Pete comparables',
    marketValueDate: new Date('2026-01-30'),
    hasLoan: true,
    amountOwed: 16692.18,
    lender: 'Points West Bank',
    loanAccountNumber: '9679',
    paymentAmount: 16697.20,
    nextPaymentDate: new Date('2026-02-01'),
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Ripper',
    subtitle: 'Tillage Ripper',
    category: 'Tillage',
    description: 'Ripper',
    currentValue: 750,
    purchaseDate: new Date('1997-01-01'),
    notes: 'Unit #305, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Orthman Coulter Ripper',
    subtitle: 'Tillage Ripper',
    category: 'Tillage',
    make: 'Orthman',
    model: 'Coulter',
    description: 'Ripper',
    purchasePrice: 10250,
    currentValue: 10000,
    serialNumber: '625883 997-117',
    purchaseDate: new Date('2010-09-01'),
    notes: 'Unit #306, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: "3pt 90' Sprayer",
    subtitle: 'Field Sprayer',
    category: 'Sprayer Equipment',
    description: "3pt 90' Sprayer - Einspahr",
    purchasePrice: 10000,
    currentValue: 10000,
    purchaseDate: new Date('2012-04-01'),
    notes: 'Unit #307, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Sharpe Speed Mover',
    subtitle: 'Speed Mover',
    category: 'Other',
    make: 'Sharpe',
    description: 'Speed Mover',
    purchasePrice: 400,
    currentValue: 400,
    purchaseDate: new Date('2009-09-01'),
    notes: 'Unit #308, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Speed Mover 2',
    subtitle: 'Speed Mover',
    category: 'Other',
    description: 'Speed Mover 2',
    purchasePrice: 1400,
    currentValue: 1400,
    notes: 'Unit #309, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2013 Case IH DC162 Swather',
    subtitle: 'Swather/Windrower',
    category: 'Hay Equipment',
    year: 2013,
    make: 'Case IH',
    model: 'DC162',
    description: 'Swather',
    currentValue: 32900,
    amountOwed: 0,
    hasLoan: false,
    serialNumber: 'YDN097066',
    notes: 'Unit #310, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'New Holland HS Hay Rake',
    subtitle: 'Hay Rake',
    category: 'Hay Equipment',
    make: 'New Holland',
    model: 'HS',
    description: 'Hay Rake',
    serialNumber: '',
    purchasePrice: 0,
    currentValue: 0,
    notes: 'Unit #319, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'New Holland 560 Baler',
    subtitle: 'Round Baler',
    category: 'Hay Equipment',
    make: 'New Holland',
    model: '560',
    description: 'Round Baler',
    serialNumber: '',
    purchasePrice: 0,
    currentValue: 0,
    notes: 'Unit #320, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2015 New Holland P2085 Air Drill',
    subtitle: 'Air Seeder',
    category: 'Planting',
    year: 2015,
    make: 'New Holland',
    model: 'P2085',
    description: 'Air Drill',
    currentValue: 95000,
    amountOwed: 0,
    hasLoan: false,
    serialNumber: 'YES046407',
    notes: 'Unit #311, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere 24 Row Planter',
    subtitle: '24 Row Planter',
    category: 'Planting',
    make: 'John Deere',
    description: '24 Row Planter',
    hasLoan: true,
    amountOwed: 59560.67,
    lender: 'Points West Bank',
    loanAccountNumber: '9843',
    paymentAmount: 21767.44,
    nextPaymentDate: new Date('2026-06-15'),
    notes: 'Unit #330, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere Cultivator',
    subtitle: 'Row Crop Cultivator',
    category: 'Tillage',
    make: 'John Deere',
    description: 'Row Crop Cultivator',
    notes: 'Unit #331, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'AGCO 1435-36 Sunflower Disk',
    subtitle: 'Disk',
    category: 'Tillage',
    make: 'AGCO',
    model: '1435-36',
    description: 'Sunflower Disk',
    purchasePrice: 29500,
    currentValue: 22000,
    serialNumber: '1435008166',
    purchaseDate: new Date('2017-07-01'),
    notes: 'Unit #312, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'AGCO 6432-33 Sunflower Land Finisher',
    subtitle: 'Land Finisher',
    category: 'Tillage',
    make: 'AGCO',
    model: '6432-33',
    description: 'Sunflower Land Finisher',
    purchasePrice: 21000,
    currentValue: 11000,
    serialNumber: '6495-009',
    purchaseDate: new Date('2016-08-01'),
    notes: 'Unit #313, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere Chisel Plow',
    subtitle: 'Chisel Plow',
    category: 'Tillage',
    make: 'John Deere',
    description: 'John Deere Chisel Plow',
    purchasePrice: 3500,
    currentValue: 5500,
    notes: 'Unit #314, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '6000 Gallon Cone Bottom Tank',
    subtitle: 'Storage Tank',
    category: 'Other',
    description: '6000gal Cone Bottom',
    purchasePrice: 6000,
    currentValue: 6000,
    purchaseDate: new Date('2011-09-01'),
    notes: 'Unit #315, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '3000 Gallon Tanks (15)',
    subtitle: 'Storage Tanks',
    category: 'Other',
    description: '3000 gal Tanks (15)',
    purchasePrice: 18448,
    currentValue: 16000,
    purchaseDate: new Date('2011-09-01'),
    notes: 'Unit #316, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2012 Bale King BK 5532 Bale Processor',
    subtitle: 'Bale Processor',
    category: 'Hay Equipment',
    year: 2012,
    make: 'Bale King',
    model: 'BK 5532',
    description: 'Bale Processor',
    purchasePrice: 19000,
    currentValue: 19000,
    serialNumber: '1843514',
    purchaseDate: new Date('2012-12-01'),
    notes: 'Unit #317, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Farm King Bale Mover',
    subtitle: 'Bale Mover',
    category: 'Hay Equipment',
    make: 'Farm King',
    description: 'Bale Mover',
    hasLoan: true,
    amountOwed: 6843.84,
    lender: 'Points West Bank',
    loanAccountNumber: '9713',
    paymentAmount: 6622.38,
    nextPaymentDate: new Date('2026-07-01'),
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Demco Sidequest Tanks',
    subtitle: 'Saddle Tanks',
    category: 'Sprayer Equipment',
    make: 'Demco',
    model: 'Sidequest',
    description: 'Tanks',
    purchasePrice: 9500,
    currentValue: 9500,
    purchaseDate: new Date('2010-04-01'),
    notes: 'Unit #318, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // Work Trucks
  {
    title: '2006 Dodge Ram 2500',
    subtitle: 'Krogman Bale Bed',
    category: 'Trucks',
    year: 2006,
    make: 'Dodge',
    model: 'Ram 2500',
    description: 'Work truck with Krogman bale bed',
    currentMiles: 140000,
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2022 Dodge Ram 3500',
    subtitle: "9' Flatbed",
    category: 'Trucks',
    year: 2022,
    make: 'Dodge',
    model: 'Ram 3500',
    description: "Work truck with 9' flatbed",
    currentMiles: 30000,
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // Yard Equipment
  {
    title: '1998 Walker GHS 42"',
    subtitle: 'Mower with Self Dump',
    category: 'Other',
    year: 1998,
    make: 'Walker',
    model: 'GHS 42"',
    description: '42" mower with self dump',
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2015 Walker Super Bee 72"',
    subtitle: 'Commercial Mower',
    category: 'Other',
    year: 2015,
    make: 'Walker',
    model: 'Super Bee 72"',
    description: '72" commercial mower',
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Yard Sprayer',
    subtitle: 'Lawn Sprayer',
    category: 'Other',
    description: 'Yard sprayer',
    notes: 'Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere Zero Turn 54"',
    subtitle: 'Zero Turn Mower',
    category: 'Other',
    make: 'John Deere',
    description: '54" zero turn mower',
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Sharpe Box Blade',
    subtitle: 'Box Blade',
    category: 'Attachments',
    make: 'Sharpe',
    description: 'Box blade',
    notes: 'Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Cammond Box Blade',
    subtitle: 'Box Blade',
    category: 'Attachments',
    make: 'Cammond',
    description: 'Box blade',
    notes: 'Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Grey Box Blade',
    subtitle: 'Box Blade',
    category: 'Attachments',
    description: 'Grey box blade',
    notes: 'Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // ATV/MISC
  {
    title: 'Honda Rancher #1',
    subtitle: 'ATV',
    category: 'Other',
    make: 'Honda',
    model: 'Rancher',
    currentValue: 1500,
    notes: 'Unit #401, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Honda Rancher #2',
    subtitle: 'ATV',
    category: 'Other',
    make: 'Honda',
    model: 'Rancher',
    currentValue: 1500,
    notes: 'Unit #404, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Honda Rancher #3',
    subtitle: 'ATV',
    category: 'Other',
    make: 'Honda',
    model: 'Rancher',
    currentValue: 1500,
    notes: 'Unit #405, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2008 Arctic Cat Prowler',
    subtitle: 'Side by Side',
    category: 'Other',
    year: 2008,
    make: 'Arctic Cat',
    model: 'Prowler',
    purchasePrice: 10000,
    currentValue: 8000,
    vin: '4UF08MPV18T307004',
    serialNumber: '4UF08MPV18T307004',
    purchaseDate: new Date('2009-11-01'),
    notes: 'Unit #402, Title: 82894634, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Polaris Snowmobile #1',
    subtitle: 'Snowmobile',
    category: 'Other',
    make: 'Polaris',
    currentValue: 1500,
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Polaris Snowmobile #2',
    subtitle: 'Snowmobile',
    category: 'Other',
    make: 'Polaris',
    currentValue: 1500,
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Ski-Doo Snowmobile',
    subtitle: 'Snowmobile',
    category: 'Other',
    make: 'Ski-Doo',
    currentValue: 1500,
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2007 Honda 4 Wheeler',
    subtitle: 'ATV',
    category: 'Other',
    year: 2007,
    make: 'Honda',
    description: '4 Wheeler',
    purchasePrice: 1800,
    currentValue: 1500,
    vin: '1HFTE350174010120',
    serialNumber: '1HFTE350174010120',
    purchaseDate: new Date('2016-02-01'),
    specs: new Map([['Hours', '1042']]),
    notes: 'Unit #403, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // Cattle Equipment
  {
    title: 'ATV Catch Pen',
    subtitle: 'Portable Cattle Pen',
    category: 'Other',
    description: 'ATV Catch Pen',
    purchasePrice: 1500,
    currentValue: 1300,
    notes: 'Unit #500, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2018 O.K. Corral Cattle Pen',
    subtitle: 'Portable Cattle Pen',
    category: 'Other',
    year: 2018,
    make: 'O.K. Corral',
    description: 'Cattle Pen',
    purchasePrice: 11000,
    currentValue: 9000,
    serialNumber: '0324163842',
    notes: 'Unit #501, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2019 Wheat Heart Post Pounder',
    subtitle: 'Post Pounder',
    category: 'Other',
    year: 2019,
    make: 'Wheat Heart',
    description: 'Post Pounder',
    purchasePrice: 10000,
    currentValue: 9500,
    notes: 'Unit #502, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Chevrolet Feed Truck w/ Harsh Box',
    subtitle: 'Feed Truck',
    category: 'Feed Truck',
    make: 'Chevrolet',
    description: 'Feed Truck W/ Harsh Box',
    purchasePrice: 7000,
    currentValue: 15000,
    notes: 'Unit #503, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Cattle Chute',
    subtitle: 'Working Chute',
    category: 'Other',
    description: 'Chute',
    purchasePrice: 200,
    currentValue: 200,
    purchaseDate: new Date('1991-01-01'),
    notes: 'Unit #504, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Feeding Trailer',
    subtitle: 'Cattle Feeding Trailer',
    category: 'Trailers',
    description: 'Feeding Trailer',
    purchasePrice: 5000,
    currentValue: 5000,
    purchaseDate: new Date('1991-12-01'),
    notes: 'Unit #505, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Purple Feeder',
    subtitle: 'Cattle Feeder',
    category: 'Other',
    description: 'Purple Feeder',
    purchasePrice: 3500,
    currentValue: 3000,
    notes: 'Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Calf Cradle',
    subtitle: 'Calf Working Cradle',
    category: 'Other',
    description: 'Calf Cradle',
    purchasePrice: 300,
    currentValue: 100,
    purchaseDate: new Date('1991-01-01'),
    notes: 'Unit #506, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Calving Pen',
    subtitle: 'Calving Pen',
    category: 'Other',
    description: 'Calving Pen',
    purchasePrice: 1250,
    currentValue: 800,
    purchaseDate: new Date('1993-12-01'),
    notes: 'Unit #507, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Stock Tanks/Drilling',
    subtitle: 'Water Tanks',
    category: 'Other',
    description: 'Stock Tanks/drilling',
    purchasePrice: 6750,
    currentValue: 5000,
    purchaseDate: new Date('2011-08-01'),
    notes: 'Unit #508, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2012 Sioux Squeeze Chute',
    subtitle: 'Hydraulic Squeeze Chute',
    category: 'Other',
    year: 2012,
    make: 'Sioux',
    description: 'Squeeze chute',
    purchasePrice: 6499.71,
    currentValue: 6000,
    purchaseDate: new Date('2012-08-01'),
    notes: 'Unit #509, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // Shop Equipment
  {
    title: 'Lincoln Ranger Welder',
    subtitle: 'Portable Welder',
    category: 'Other',
    make: 'Lincoln',
    model: 'Ranger',
    description: 'Lincoln Welder',
    purchasePrice: 5800,
    currentValue: 5400,
    notes: 'Unit #600, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Shop Air Compressor',
    subtitle: 'Air Compressor',
    category: 'Other',
    description: 'Air Compressor',
    purchasePrice: 1200,
    currentValue: 1000,
    purchaseDate: new Date('2020-11-01'),
    notes: 'Unit #601, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Ingersoll Rand 275 CFM Air Compressor',
    subtitle: 'Industrial Compressor',
    category: 'Other',
    make: 'Ingersoll Rand',
    model: '275 CFM',
    description: 'Air Compressor',
    purchasePrice: 4800,
    currentValue: 3800,
    notes: 'Unit #602, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Miller Plasma Cutter',
    subtitle: 'Plasma Cutter',
    category: 'Other',
    make: 'Miller',
    description: 'Plasma',
    purchasePrice: 2200,
    currentValue: 2000,
    notes: 'Unit #603, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Shop Heater',
    subtitle: 'Building Heater',
    category: 'Other',
    description: 'Heater for Shop',
    purchasePrice: 6000,
    currentValue: 5000,
    purchaseDate: new Date('2008-01-01'),
    notes: 'Unit #604, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2015 KBE5L Infrared Heater',
    subtitle: 'Shop Heater',
    category: 'Other',
    year: 2015,
    model: 'KBE5L',
    description: 'Infrared Heater',
    purchasePrice: 2040.15,
    currentValue: 2000,
    serialNumber: '50330-B-010149',
    purchaseDate: new Date('2015-01-01'),
    notes: 'Unit #605, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2020 Porta Cool',
    subtitle: 'Portable Cooler',
    category: 'Other',
    year: 2020,
    make: 'Porta Cool',
    description: 'Porta Cool',
    purchasePrice: 2350,
    currentValue: 2150,
    purchaseDate: new Date('2020-07-01'),
    notes: 'Unit #606, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // Loader Attachments
  {
    title: '2015 Box Unloader',
    subtitle: 'Loader Attachment',
    category: 'Attachments',
    year: 2015,
    description: 'Box Unloader',
    purchasePrice: 2395,
    currentValue: 1500,
    purchaseDate: new Date('2015-03-01'),
    notes: 'Unit #700, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2012 Grapple Hoe',
    subtitle: 'Loader Attachment',
    category: 'Attachments',
    year: 2012,
    description: 'Grapple Hoe',
    purchasePrice: 3850,
    currentValue: 3800,
    purchaseDate: new Date('2012-05-01'),
    notes: 'Unit #702, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2012 Pallet Forks',
    subtitle: 'Loader Attachment',
    category: 'Attachments',
    year: 2012,
    description: 'Pallet Forks',
    purchasePrice: 850,
    currentValue: 800,
    purchaseDate: new Date('2012-05-01'),
    notes: 'Unit #703, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2012 Posthole Digger',
    subtitle: 'Loader Attachment',
    category: 'Attachments',
    year: 2012,
    description: 'Posthole Digger',
    purchasePrice: 3377,
    currentValue: 3300,
    purchaseDate: new Date('2012-05-01'),
    notes: 'Unit #704, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2012 Grapple Bucket',
    subtitle: 'Loader Attachment',
    category: 'Attachments',
    year: 2012,
    description: 'Grapple Bucket',
    purchasePrice: 2800,
    currentValue: 2700,
    purchaseDate: new Date('2012-05-01'),
    notes: 'Unit #705, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2012 Bale Spear',
    subtitle: 'Loader Attachment',
    category: 'Attachments',
    year: 2012,
    description: 'Bale Spear',
    purchasePrice: 680,
    currentValue: 650,
    purchaseDate: new Date('2012-05-01'),
    notes: 'Unit #706, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: '2014 Frontier AB13K Bale Spear',
    subtitle: 'Loader Attachment',
    category: 'Attachments',
    year: 2014,
    make: 'Frontier',
    model: 'AB13K',
    description: 'Bale Spear',
    purchasePrice: 1263,
    currentValue: 1263,
    serialNumber: '1XFAB13KVD0000155',
    purchaseDate: new Date('2014-11-01'),
    notes: 'Unit #707, Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'JD High Capacity Bucket for 8420',
    subtitle: 'Loader Bucket',
    category: 'Attachments',
    make: 'John Deere',
    description: 'High Capacity Bucket JD 8420',
    purchasePrice: 1500,
    currentValue: 1500,
    notes: 'Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'JD 3 Bale Spear for 8420',
    subtitle: '3 Bale Spear',
    category: 'Attachments',
    make: 'John Deere',
    description: '3 Bale 8420',
    purchasePrice: 2500,
    currentValue: 2500,
    notes: 'Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'JD Blade',
    subtitle: 'Tractor Blade',
    category: 'Attachments',
    make: 'John Deere',
    description: 'JD Blade',
    purchasePrice: 8000,
    currentValue: 7500,
    notes: 'Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },

  // Digital Equipment
  {
    title: 'John Deere Gen5 Display',
    subtitle: 'G5 Display',
    category: 'Other',
    make: 'John Deere',
    model: 'G5',
    description: 'Gen5 Display',
    purchasePrice: 10000,
    currentValue: 10000,
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere 7000 Receiver RTK Unlock #1',
    subtitle: 'GPS Receiver',
    category: 'Other',
    make: 'John Deere',
    model: '7000',
    description: 'Receiver RTK Unlock',
    purchasePrice: 3500,
    currentValue: 3500,
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere 7000 Receiver RTK Unlock #2',
    subtitle: 'GPS Receiver',
    category: 'Other',
    make: 'John Deere',
    model: '7000',
    description: 'Receiver RTK Unlock',
    purchasePrice: 3500,
    currentValue: 3500,
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere 2630 Display',
    subtitle: 'GPS Display',
    category: 'Other',
    make: 'John Deere',
    model: '2630',
    description: 'Display',
    purchasePrice: 4200,
    currentValue: 4200,
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere 3000 Receiver RTK Unlock',
    subtitle: 'GPS Receiver',
    category: 'Other',
    make: 'John Deere',
    model: '3000',
    description: 'Receiver RTK Unlock',
    purchasePrice: 3500,
    currentValue: 3500,
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'CONNEX System #1',
    subtitle: 'Farm Management System',
    category: 'Other',
    make: 'CONNEX',
    purchasePrice: 7000,
    currentValue: 7000,
    notes: 'Owner: Personal, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'CONNEX System #2',
    subtitle: 'Farm Management System',
    category: 'Other',
    make: 'CONNEX',
    purchasePrice: 5000,
    currentValue: 5000,
    notes: 'Owner: M77 AG, Insured: No',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'CONNEX System #3',
    subtitle: 'Farm Management System',
    category: 'Other',
    make: 'CONNEX',
    purchasePrice: 5000,
    currentValue: 5000,
    notes: 'Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'Raven Viper Pro Rogator Display',
    subtitle: 'Sprayer Display',
    category: 'Other',
    make: 'Raven',
    model: 'Viper Pro',
    description: 'Rogator Display',
    purchasePrice: 12000,
    currentValue: 8000,
    serialNumber: '316669953',
    notes: 'Unit #805, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere 2600 TerrGator Display',
    subtitle: 'Sprayer Display',
    category: 'Other',
    make: 'John Deere',
    model: '2600',
    description: 'TerrGator Display',
    purchasePrice: 5000,
    currentValue: 3000,
    serialNumber: 'PCGU26H214709',
    notes: 'Unit #806, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere StarFire ITC Receiver Terra Gator',
    subtitle: 'GPS Receiver',
    category: 'Other',
    make: 'John Deere',
    model: 'StarFire',
    description: 'ITC Receiver Terra Gator',
    purchasePrice: 1200,
    currentValue: 1000,
    serialNumber: '502575',
    notes: 'Unit #807, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere Rate Controller',
    subtitle: 'Rate Controller',
    category: 'Other',
    make: 'John Deere',
    model: 'Controller',
    description: 'Rate Controller',
    purchasePrice: 3500,
    currentValue: 3500,
    serialNumber: '154011',
    notes: 'Unit #808, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere 2600 Display for 8420',
    subtitle: 'Tractor Display',
    category: 'Other',
    make: 'John Deere',
    model: '2600',
    description: '8420 Display',
    purchasePrice: 5000,
    currentValue: 3000,
    notes: 'Unit #809, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  },
  {
    title: 'John Deere 8420 Receiver',
    subtitle: 'GPS Receiver',
    category: 'Other',
    make: 'John Deere',
    description: '8420 Receiver',
    purchasePrice: 1200,
    currentValue: 1000,
    notes: 'Unit #810, Owner: M77 AG, Insured: Yes',
    forSale: false,
    saleStatus: 'not-for-sale'
  }
];

async function seedEquipment() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Check current equipment count
    const existingCount = await Equipment.countDocuments();
    console.log(`Existing equipment count: ${existingCount}`);

    // Check for --force flag to clear existing data
    const forceImport = process.argv.includes('--force');

    if (existingCount > 0 && forceImport) {
      console.log('\n--force flag detected. Clearing existing equipment...');
      await Equipment.deleteMany({});
      console.log('Cleared existing equipment data.');
    } else if (existingCount > 0) {
      console.log('\nWARNING: There is existing equipment in the database.');
      console.log('Use --force flag to clear existing data and reimport.');
      console.log('Proceeding to add equipment (may create duplicates)...');
    }

    // Import equipment
    console.log(`\nImporting ${equipmentData.length} equipment items...`);

    let imported = 0;
    let errors = 0;

    for (const item of equipmentData) {
      try {
        const equipment = new Equipment(item);
        await equipment.save();
        imported++;
        process.stdout.write(`\rImported: ${imported}/${equipmentData.length}`);
      } catch (err) {
        errors++;
        console.error(`\nError importing "${item.title}": ${err.message}`);
      }
    }

    console.log(`\n\nImport complete!`);
    console.log(`Successfully imported: ${imported}`);
    console.log(`Errors: ${errors}`);

    // Calculate and display summary
    const allEquipment = await Equipment.find();
    let totalValue = 0;
    let totalOwed = 0;

    allEquipment.forEach(item => {
      totalValue += item.currentValue || 0;
      totalOwed += item.amountOwed || 0;
    });

    console.log(`\n=== Equipment Summary ===`);
    console.log(`Total Equipment: ${allEquipment.length}`);
    console.log(`Total Value: $${totalValue.toLocaleString()}`);
    console.log(`Total Owed: $${totalOwed.toLocaleString()}`);
    console.log(`Net Worth: $${(totalValue - totalOwed).toLocaleString()}`);

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  seedEquipment();
}

module.exports = { equipmentData, seedEquipment };
