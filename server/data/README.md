# Chemical Products Database

This directory contains seed data and scripts for managing chemical products and pricing in the M77 AG system.

## Overview

The chemical products system includes:
- **21 Chemical Products** from Crop Protect Direct and alternative suppliers
- **3 Default Programs** (Basic, Standard, Premium)
- **2 Drop-off Points** (M77 AG, Mollohan Farms)
- Full pricing history and supplier comparison

## Database Seeding

### Prerequisites
- MongoDB must be running (local or cloud)
- Set `MONGODB_URI` in your `.env` file (defaults to `mongodb://localhost:27017/m77ag`)

### Seed the Database

```bash
npm run seed
```

This will:
1. Connect to MongoDB
2. Clear existing chemical products and programs (optional)
3. Import all products from `seedChemicalProducts.js`
4. Create default chemical programs
5. Display a summary of imported data

### Seed Data Files

- **`seedChemicalProducts.js`** - All chemical products with pricing
- **`seedDatabase.js`** - Main seeding script

## Products Included

### Herbicides
- Dicamba DMA (2x2.5, Shuttle)
- Dicamba HD (Shuttle)
- LV 6 (2x2.5, Shuttle)
- RT3 (Shuttle)
- Glystar Supreme (Shuttle)
- Aatex (Shuttle)
- Level Best Pro (2x2.5, Shuttle)
- Tapran (2x2.5, Shuttle)
- Aggrestrol (2x2.5, Shuttle)
- Sulfentrazone (2x2.5)
- Valor SX (4x5)

### Fungicides
- Artect F1 (2x2.5, Shuttle) - *Pricing needed*

### Other
- Autumn Super (20 oz) - *Pricing needed*

## Pricing Data Source

All pricing data is from the latest Crop Protect Direct quotes, with alternative supplier comparisons included. Each product includes:
- Current price
- Primary supplier
- Alternative suppliers with pricing
- Pack sizes and container options
- Savings compared to CPD

## Default Programs

### 1. Basic Burndown Program
- **Type:** Basic
- **Target:** Early season weed control
- **Minimum:** 50 acres
- **Discounts:** 5% at 100 acres, 7% at 250 acres, 10% at 500 acres

### 2. Standard Post-Emerge Program
- **Type:** Standard
- **Target:** Comprehensive post-emergence control
- **Minimum:** 50 acres
- **Discounts:** 5% at 100 acres, 7% at 250 acres, 10% at 500 acres

### 3. Premium Full Season Program
- **Type:** Premium
- **Target:** Complete season-long control
- **Minimum:** 100 acres
- **Discounts:** 5% at 250 acres, 8% at 500 acres, 12% at 1000 acres

## Drop-off Points

1. **M77 AG** - Primary location (No delivery fee)
2. **Mollohan Farms** - Secondary location (No delivery fee)

## Payment Terms

All chemical programs include:
- Payment due **10 days prior to delivery**
- Automated invoice generation
- Payment tracking system

## API Endpoints

### Public Endpoints
- `GET /api/chemicals/products` - List all products
- `GET /api/chemicals/programs` - List all programs
- `POST /api/chemicals/calculate` - Calculate program costs
- `POST /api/chemicals/quote` - Create custom quotes
- `GET /api/chemicals/price-comparison` - Compare supplier pricing

### Admin Endpoints (Protected)
- `PATCH /api/chemicals/products/:id/price` - Update product price

## Adding New Products

To add new chemical products:

1. Edit `seedChemicalProducts.js`
2. Add product object with required fields:
   ```javascript
   {
     productName: 'Product Name',
     packSize: '2x2.5',
     units: 'gl',
     currentPrice: 25.00,
     supplier: 'Supplier Name',
     category: 'herbicide',
     applicationTiming: 'post-emerge',
     containerSizes: [{ size: 2.5, unit: 'gl', available: true }],
     inStock: true,
     active: true
   }
   ```
3. Run `npm run seed` to update database

## Updating Prices

Prices can be updated via:
1. **API** - Use the PATCH endpoint (requires admin auth)
2. **Direct DB** - Update via MongoDB client
3. **Re-seed** - Update `seedChemicalProducts.js` and re-run seed script

All price updates are tracked in the `priceHistory` field.

## Notes

- Products marked with "Need to get equivalents" or "Need to get pricing" require additional supplier quotes
- Container sizes are automatically calculated to round up to full containers
- Volume discounts apply automatically based on acreage
- All prices are per gallon, ounce, or pound depending on the product
