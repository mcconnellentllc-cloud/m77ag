/**
 * Seed the 168 Hwy 59 rental property, Jeremy Kinzie tenant record,
 * and a draft 12-month lease starting July 1, 2026 at $1,250/mo,
 * with Amy Kinzie recorded as an additional tenant.
 *
 * Idempotent — safe to re-run. Prints the signing URL at the end.
 *
 * Run: node scripts/seedKinzieLease.js
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config();

const RentalProperty = require('../server/models/rentalProperty');
const Tenant = require('../server/models/tenant');
const Lease = require('../server/models/lease');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

const PROPERTY_NAME = '168 Hwy 59';
const PROPERTY_STREET = '168 Hwy 59';
const PROPERTY_CITY = 'Sedgwick';
const PROPERTY_STATE = 'CO';
const PROPERTY_ZIP = '80749';

const TENANT_EMAIL = 'kinzjer33@yahoo.com';
const TENANT_FIRST = 'Jeremy';
const TENANT_LAST = 'Kinzie';
const TENANT_PHONE = '720-601-3243';
const TENANT_PREV_ADDRESS = '1302 85th Ave, Greeley, CO 80634';

const CO_TENANT_FIRST = 'Amy';
const CO_TENANT_LAST = 'Kinzie';

const LEASE_START = new Date('2026-07-01T00:00:00');
const LEASE_TYPE = 'twelve_month';
const BASE_RENT = 1400;
const SECURITY_DEPOSIT = 1400;
const PET_DEPOSIT = 300;

// Standard discount menu. Tenants may opt into any of these on the
// signing page; each pairs a dollar credit with a real responsibility.
// Landlord may revoke any discount if the tenant fails to hold up
// the trade — see POST /api/rentals/admin/leases/:id/discounts/:code/revoke.
const DISCOUNT_MENU = [
  {
    code: 'twelve_month_lease',
    label: 'Sign a 12-month lease commitment',
    responsibility: 'Tenants commit to remain in possession through the full 12-month term. Early termination forfeits the discount and any remaining months of the credit are back-charged.',
    monthlyValue: 150
  },
  {
    code: 'autopay',
    label: 'Enroll in ACH autopay on the 1st of each month',
    responsibility: 'Tenants keep an active ACH autopay authorization. If autopay is cancelled or fails two consecutive months, this discount is revoked going forward.',
    monthlyValue: 25
  },
  {
    code: 'yard_care',
    label: 'Handle yard mowing April through October',
    responsibility: 'Tenants mow and trim the yard at least every two weeks during the growing season. If Landlord must arrange mowing because grass exceeds 8 inches, this discount is revoked and the mowing cost is back-charged.',
    monthlyValue: 50
  },
  {
    code: 'snow_removal',
    label: 'Handle snow removal from driveway and walkways',
    responsibility: 'Tenants clear driveway and walkways within 24 hours of any snowfall of 2 inches or more. If Landlord must arrange clearing, this discount is revoked and the clearing cost is back-charged.',
    monthlyValue: 50
  },
  {
    code: 'minor_repairs',
    label: 'Handle minor repairs and consumables under $50',
    responsibility: 'Tenants handle light bulbs, HVAC filter changes, minor caulking, and other repairs under $50 without invoicing Landlord. If unaddressed items become larger repairs, this discount is revoked.',
    monthlyValue: 25
  }
];

async function upsertProperty() {
  const existing = await RentalProperty.findOne({
    'address.street': PROPERTY_STREET,
    'address.city': PROPERTY_CITY
  });
  if (existing) {
    console.log('Property already exists:', existing._id.toString());
    return existing;
  }
  const property = new RentalProperty({
    name: PROPERTY_NAME,
    description: '2-bedroom, 1-bath country home about half a mile north of the Sedgwick County line. All utilities paid by landlord.',
    propertyType: 'house',
    address: {
      street: PROPERTY_STREET,
      city: PROPERTY_CITY,
      county: 'Sedgwick',
      state: PROPERTY_STATE,
      zip: PROPERTY_ZIP
    },
    features: {
      bedrooms: 2,
      bathrooms: 1,
      petFriendly: true,
      utilitiesIncluded: true,
      laundry: 'in_unit',
      appliances: ['stove', 'microwave', 'washer_dryer_hookups'],
      amenities: ['enclosed_porch', 'large_yard', 'off_street_parking', 'central_heat']
    },
    pricing: {
      monthToMonth: 1400,
      sixMonth: 1300,
      twelveMonth: 1250,
      securityDeposit: 1250,
      petDeposit: 300
    },
    status: 'available',
    disclosures: {
      radonTested: false,
      leadPaint: false,
      bedBugHistory: false,
      uninhabitableReportingEmail: 'office@m77ag.com',
      uninhabitableReportingAddress: 'M77 AG, Sedgwick, CO 80749'
    },
    managerContact: {
      name: 'Kyle McConnell',
      phone: '970-571-1015',
      email: 'office@m77ag.com'
    },
    isActive: true
  });
  await property.save();
  console.log('Property created:', property._id.toString());
  return property;
}

async function upsertTenant() {
  const existing = await Tenant.findOne({ email: TENANT_EMAIL });
  if (existing) {
    console.log('Tenant already exists:', existing._id.toString());
    let dirty = false;
    if (!existing.phone) { existing.phone = TENANT_PHONE; dirty = true; }
    if (!existing.firstName) { existing.firstName = TENANT_FIRST; dirty = true; }
    if (!existing.lastName) { existing.lastName = TENANT_LAST; dirty = true; }
    if (dirty) await existing.save();
    return existing;
  }
  // Password is placeholder — tenant can reset via forgot-password flow if
  // they want portal access. Signing does not require a login.
  const tenant = new Tenant({
    email: TENANT_EMAIL,
    password: crypto.randomBytes(16).toString('hex'),
    firstName: TENANT_FIRST,
    lastName: TENANT_LAST,
    phone: TENANT_PHONE,
    rentalHistory: [{
      address: TENANT_PREV_ADDRESS,
      moveInDate: null,
      moveOutDate: null
    }],
    paymentMethod: 'ach',
    status: 'pending',
    communicationPreferences: {
      emailNotifications: true,
      paymentReminders: true,
      reminderDaysBefore: 3
    }
  });
  await tenant.save();
  console.log('Tenant created:', tenant._id.toString());
  return tenant;
}

async function upsertLease(propertyId, tenantId) {
  const existing = await Lease.findOne({
    property: propertyId,
    tenant: tenantId,
    status: { $in: ['draft', 'pending_signature', 'active'] }
  });
  if (existing) {
    console.log('Lease already exists:', existing._id.toString(), 'status:', existing.status);
    if (!existing.signingToken || (existing.signingTokenExpiresAt && existing.signingTokenExpiresAt < new Date())) {
      existing.signingToken = crypto.randomBytes(24).toString('hex');
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      existing.signingTokenExpiresAt = expires;
      await existing.save();
      console.log('Signing token refreshed.');
    }
    return existing;
  }
  const signingToken = crypto.randomBytes(24).toString('hex');
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  // Seed the discount menu. The 12-month discount is pre-selected because
  // the Kinzies already chose the 12-month leaseType; the remaining
  // discounts are un-selected and offered to them on the signing page.
  const discounts = DISCOUNT_MENU.map(d => ({
    ...d,
    selected: d.code === 'twelve_month_lease',
    selectedAt: d.code === 'twelve_month_lease' ? new Date() : undefined
  }));
  const lease = new Lease({
    property: propertyId,
    tenant: tenantId,
    additionalTenants: [{
      name: `${CO_TENANT_FIRST} ${CO_TENANT_LAST}`,
      relationship: 'spouse'
    }],
    leaseType: LEASE_TYPE,
    startDate: LEASE_START,
    baseRent: BASE_RENT,
    monthlyRent: BASE_RENT, // recomputed by pre-save hook from discounts
    discounts,
    securityDeposit: SECURITY_DEPOSIT,
    petDeposit: PET_DEPOSIT,
    rentDueDay: 1,
    lateFeeAmount: 50,
    lateFeeGracePeriod: 7,
    utilitiesIncluded: true,
    utilitiesDetails: 'Landlord pays electricity, propane, water, sewer, and trash. Historical monthly averages: electricity ~$150/mo year-round, propane ~$250/mo during heating season (November–March). If tenant usage exceeds 20% above these averages in any calendar month, the parties agree to renegotiate the utility allowance in good faith or Landlord may back-charge the excess.',
    petPolicy: 'Tenants may keep pets identified on the pet addendum. Pet deposit is required and refundable per Colorado law. Tenants are responsible for all pet-related damage and for cleanup of the yard.',
    specialTerms: 'Tenants are responsible for routine yard care (mowing) in summer and snow removal from driveway/walkways in winter. Property is offered furnished with appliances noted; refrigerator is NOT included and must be supplied by tenant.',
    status: 'draft',
    signingToken,
    signingTokenExpiresAt: expires
  });
  await lease.save();
  console.log('Lease created:', lease._id.toString());
  return lease;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  try {
    const property = await upsertProperty();
    const tenant = await upsertTenant();
    const lease = await upsertLease(property._id, tenant._id);

    // Update the tenant's currentProperty pointer so the admin view lines up.
    if (!tenant.currentProperty || tenant.currentProperty.toString() !== property._id.toString()) {
      tenant.currentProperty = property._id;
      tenant.currentLease = lease._id;
      await tenant.save();
    }

    const baseUrl = process.env.PUBLIC_URL || 'https://m77ag.com';
    const signingUrl = `${baseUrl}/rental-agreement?token=${lease.signingToken}`;
    console.log('\n=================================================');
    console.log('Kinzie lease seeded.');
    console.log('Property:', property.name, `(${property._id})`);
    console.log('Tenant:  ', `${tenant.firstName} ${tenant.lastName}`, `(${tenant._id})`);
    console.log('Lease:   ', lease._id.toString(), 'status:', lease.status);
    console.log('Signing URL:');
    console.log(' ', signingUrl);
    console.log('Token expires:', lease.signingTokenExpiresAt?.toISOString());
    console.log('=================================================\n');
  } catch (err) {
    console.error('Seed error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
