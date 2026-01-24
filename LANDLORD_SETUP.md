# Land Management System - Landlord Setup

## Overview
This document outlines the landlord accounts that need to be created for the M77 AG Land Management tracking system.

## Landlord Accounts

Based on the 2025 M77AG MASTER WORKBOOK analysis, the following landlord accounts should be created:

| Landlord | Email | Username | Password | Farms |
|----------|-------|----------|----------|-------|
| HD Farms | hdfarms@m77ag.com | hdfarms | Farm2026 | HDFARMS |
| KB Farms | kbfarms@m77ag.com | kbfarms | Farm2026 | KBFARMS |
| LA Farms | lafarms@m77ag.com | lafarms | Farm2026 | LAFARMS |
| ME Farms | mefarms@m77ag.com | mefarms | Farm2026 | MEFARMS |
| Peterson Farms | peterson@m77ag.com | peterson | Farm2026 | PETERSON |
| A1 Farms | a1farms@m77ag.com | a1farms | Farm2026 | A1FARMS |
| Vandenbark | vandenbark@m77ag.com | vandenbark | Farm2026 | VANDENBARK |

## Setup Options

### Option 1: Run Setup Script Locally or on Render

```bash
node create-landlords.js
```

This script will:
- Connect to MongoDB Atlas
- Create landlord user accounts with role='landlord'
- Set all passwords to 'Farm2026'
- Skip any accounts that already exist

### Option 2: Manual API Calls

If you're on Render.com, you can use the terminal to run:

```bash
curl -X POST https://m77ag-com.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "hdfarms",
    "email": "hdfarms@m77ag.com",
    "password": "Farm2026",
    "role": "landlord",
    "firstName": "HD",
    "lastName": "Farms"
  }'
```

Repeat for each landlord in the table above.

### Option 3: Database Direct

If you have access to MongoDB Compass or Atlas, you can manually create users in the `users` collection with:
- role: "landlord"
- password: (hashed version of "Farm2026")
- email/username from table above

## Farm Summary

Total landlords: **7**

**HD Farms (HDFARMS)**
- Total acres managed: ~2,595 acres
- Number of fields: ~32 fields
- Rental type: Per-acre agreements

**KB Farms (KBFARMS)**
- Total acres managed: ~1,234 acres
- Number of fields: ~12 fields
- Rental type: Per-acre agreements

**LA Farms (LAFARMS)**
- Total acres managed: ~3,440 acres
- Number of fields: ~32 fields
- Rental type: Per-acre agreements

**ME Farms (MEFARMS)**
- Total acres managed: ~1,836 acres
- Number of fields: ~21 fields
- Rental type: Per-acre agreements

**Peterson Farms (PETERSON)**
- Total acres managed: ~2,587 acres
- Number of fields: ~25 fields
- Rental type: Per-acre agreements

**A1 Farms (A1FARMS)**
- Total acres managed: ~237 acres
- Number of fields: ~7 fields
- Rental type: Per-acre agreements

**Vandenbark (VANDENBARK)**
- Total acres managed: TBD
- Number of fields: ~25 fields
- Rental type: Per-acre agreements

## Next Steps

After creating landlord accounts:

1. **Import Property Data**: Use the M77AG Master Workbook import feature in the farmer dashboard
2. **Assign Properties**: Link each property to the correct landlord
3. **Import Field Data**: Bulk import all field information including crop rotation history
4. **Set up Transactions**: Import historical expense and income data
5. **Configure Ledgers**: Set up ledger entries for rent owed/paid

## Comprehensive Tracking System

The system will track:

### Per Bushel Costs
- Seed costs / total bushels
- Fertilizer costs / total bushels
- Chemical costs / total bushels
- Labor costs / total bushels
- Equipment costs / total bushels
- **Total cost per bushel**

### Per Acre Analysis
- Revenue per acre
- Expenses per acre
- Net profit/loss per acre

### Per Field Analysis
- Total revenue by field
- Total expenses by field
- Yield per field
- Profit per field

### Per Landlord Analysis
- Total revenue from landlord's fields
- Total rent paid/owed
- Net profitability per landlord
- Acres farmed per landlord

### Per M77 AG (Overall Business)
- Total revenue across all operations
- Total expenses across all operations
- Net profitability
- Cost efficiency metrics
- ROI by crop type

## Data Source

All landlord and farm data extracted from:
- **File**: `2025 M77AG MASTER WORKBOOK.xlsm`
- **Sheet**: OVERVIEW (Rental Agreements)
- **Date**: 2025 rental year
