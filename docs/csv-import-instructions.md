# M77 AG - Data Import Instructions for Claude Projects

## Overview

Upload your master workbooks (Excel/PDF) to this Claude Project. I will extract the data into CSV files that can be imported directly into the M77 AG Field Manager system at m77ag.com/admin/field-manager.

---

## What I Need From You

Upload any/all of these for each year you have data:
- Master farming workbooks (Excel .xlsx files)
- Crop budgets or cost-of-production sheets
- Yield/harvest reports
- Soil sample reports
- Crop insurance declarations (Schedule of Insurance)
- Tax records (property tax statements)
- Lease agreements or rent payment records

Label each upload with the year if possible (e.g., "2025 Master Workbook", "2023 Harvest Report").

---

## CSV Formats I Will Produce

### 1. crop-history.csv

One row per field per year. This is the primary data file.

```
farm,field,year,crop,variety,yieldPerAcre,pricePerBushel,seed,fertilizer,chemicals,cropInsurance,fuelOil,repairs,customHire,landRent,dryingHauling,taxes,misc,notes
LAFARMS,10.S OURS,2025,SORGHUM,Pioneer 84P80,92.5,4.85,18.50,35.00,22.00,12.50,18.00,15.00,8.00,0,3.50,4.20,5.00,Good year
KBFARMS,23.E SW PAULI,2025,CORN,DeKalb 42-60,118.0,4.52,42.00,65.00,28.00,18.00,22.00,18.00,12.00,25.00,8.50,4.20,6.00,Irrigated corner
```

**Column definitions:**
- `farm` - Must match exactly: LAFARMS, KBFARMS, PETERSON, HDFARMS, MEFARMS, or A1FARMS
- `field` - Must match the field name in the system exactly (e.g., "10.S OURS", "23.E SW PAULI")
- `year` - 4-digit year (2020, 2021, 2022, 2023, 2024, 2025)
- `crop` - Crop type in uppercase (CORN, WHEAT, SORGHUM, PEARL MILLET, TRITICALE, FALLOW, PASTURE)
- `variety` - Seed variety/hybrid name (leave blank if unknown)
- `yieldPerAcre` - Bushels per acre harvested (0 for fallow/pasture)
- `pricePerBushel` - Sale price in dollars (0 for fallow/pasture)
- All cost columns are **per acre** amounts in dollars:
  - `seed` - Seed cost per acre
  - `fertilizer` - All fertilizer (N, P, K, micro) per acre
  - `chemicals` - Herbicide, insecticide, fungicide per acre
  - `cropInsurance` - Insurance premium per acre (net of subsidy)
  - `fuelOil` - Fuel and oil per acre
  - `repairs` - Equipment repairs and maintenance per acre
  - `customHire` - Custom application, custom harvest, hired labor per acre
  - `landRent` - Cash rent per acre (0 if owned)
  - `dryingHauling` - Grain drying and hauling per acre
  - `taxes` - Property tax allocated per acre
  - `misc` - Any other costs per acre
- `notes` - Optional free text

**Important notes for extraction:**
- If the workbook has costs as total dollars for a field, divide by the field acres to get per-acre
- If costs are lumped together (e.g., "chemicals & seed"), split them into the right columns as best you can, and note the assumption
- If yield or price data is missing for a year, use 0 and add a note
- Include fallow years with crop=FALLOW, yield=0, price=0 (still may have chemical costs for weed control)
- Include pasture with crop=PASTURE, yield=0, price=0

---

### 2. field-details.csv

One row per field. Static information about each field.

```
farm,field,county,soilType,soilClass,leaseType,landlord,rentPerAcre,sharePercentage,insProvider,insType,insLevel,insGuaranteedYield,insGuaranteedPrice,insPremiumPerAcre,insSubsidy,insNetPremium,propertyTaxPerAcre,assessedValue,taxAuthority,notes
LAFARMS,10.S OURS,Logan,Weld Loam,II,owned,,,,,Revenue Protection,75,95,4.85,8.50,5.10,3.40,4.20,15000,Logan County,
KBFARMS,23.E SW PAULI,Logan,Platner Sandy Loam,III,cash-rent,John Smith,25.00,0,Rain & Hail,Revenue Protection,70,110,4.52,12.00,7.20,4.80,3.85,12000,Logan County,Corner irrigated
```

**Column definitions:**
- `farm`, `field` - Must match system exactly
- `county` - County name
- `soilType` - Soil series name (e.g., "Weld Loam", "Platner Sandy Loam")
- `soilClass` - Land capability class: I, II, III, or IV
- `leaseType` - One of: owned, cash-rent, crop-share, flex-lease
- `landlord` - Landlord name (blank if owned)
- `rentPerAcre` - Cash rent per acre (0 if owned or crop-share)
- `sharePercentage` - Landlord's share % for crop-share (0 otherwise)
- Insurance fields (prefix `ins`):
  - `insProvider` - Insurance company name
  - `insType` - "Revenue Protection", "Yield Protection", etc.
  - `insLevel` - Coverage level percentage (e.g., 75)
  - `insGuaranteedYield` - APH/guarantee yield in bu/ac
  - `insGuaranteedPrice` - Projected/guarantee price
  - `insPremiumPerAcre` - Total premium per acre
  - `insSubsidy` - Government subsidy per acre
  - `insNetPremium` - Producer-paid premium per acre
- `propertyTaxPerAcre` - Annual property tax per acre
- `assessedValue` - Total assessed value of the field
- `taxAuthority` - Taxing jurisdiction
- `notes` - Any additional notes

---

### 3. soil-samples.csv (if soil test data is available)

One row per sample per field.

```
farm,field,date,depth,ph,nitrogen,phosphorus,potassium,sulfur,zinc,iron,organicMatter,cec,salts,notes
LAFARMS,10.S OURS,2024-10-15,0-6,7.2,12.5,18.0,245,8.5,1.2,15.0,2.1,14.5,0.8,Fall sample
LAFARMS,10.S OURS,2024-10-15,6-12,7.4,8.0,12.0,210,6.2,0.8,12.0,1.8,13.2,0.6,Fall sample subsoil
```

**Column definitions:**
- `farm`, `field` - Must match system exactly
- `date` - Sample date in YYYY-MM-DD format
- `depth` - Sample depth (e.g., "0-6", "6-12", "12-24" in inches)
- `ph` - Soil pH
- `nitrogen` - Nitrate-N in ppm
- `phosphorus` - Olsen P in ppm
- `potassium` - K in ppm
- `sulfur` - S in ppm
- `zinc` - Zn in ppm
- `iron` - Fe in ppm
- `organicMatter` - Organic matter percentage
- `cec` - Cation Exchange Capacity (meq/100g)
- `salts` - Soluble salts in mmhos/cm
- `notes` - Lab name, sample ID, or other notes

---

## Field Name Reference

These are the exact field names in the system. The farm and field columns in the CSV must match these exactly.

### LAFARMS (23 fields)
10.S OURS, 12.W BAM W, 1001 ROSCOE HOME, 101 WEST L, 102 ROSCOE BIG PAST, 102 ROSCOE HOME, 14.N BAM S, 14.S BAM S, 16.W BIG FIELD, 17.E MULVIHILL, 17.W MULVIHILL, 13.W BAM E, 198 BAM E, 199 BAM S, 16.M BIG FIELD, 12.E BAM W, 36.W POLE RD SEC 15, 4001 HQ HOME, 16.E BIG FIELD, 10.N OURS, 13.E BAM E

### KBFARMS (18 fields)
23.E SW PAULI, 23.W SW PAULI, 24.E SE PAULI, 24.W SE PAULI, 201 BY NEAL'S, 202 SECTION, 298 HWY HOUSE, 299 BY NEALS, 25.P NW MICHAEL PAST, 26.E SW MICHAEL, 20 NORTH, 26.W SW MICHAEL, 29.N MICHAEL, 29.S MICHAEL, 25.C NW MICHAEL CROP, 21 SMALL, 22 TOP HILL

### PETERSON (8 fields)
32.S HIGHLAND W, 35.W POLE RD SEC 14, 26 SW MICHAEL, 32.N HIGHLAND W, 35.E POLE RD SEC 14, 33.N ORPHAS, 36.E POLE RD SEC 15, 33.S ORPHAS

### HDFARMS (13 fields)
43.E E/2 S/4, 44.E S. TOWN, 46 HOME W, 47 HOME E, 41.E E/4, 42.W E/2 N/4, 401 HOME PLACE, 42.E E/2 N/4, 44.W S. TOWN, 45 W. TOWN, 499 S TOWN, 41.W E/4, 43.W E/2 S/4

### MEFARMS (11 fields)
55 KIRBY HOUSEB, 55.S KIRBY HOUSE, 56.E KIRBY SOUTH, 56.W KIRBY SOUTH, 54.S PAULS, 55.N KIRBY HOUSE, 54.N PAULS, 599 PAULS, 53 DICKS N, 53 DICKS S

### A1FARMS (4 fields)
60.W DAILEYRD, 61.S HIGHLAND E, 61.N HIGHLAND E, 60.S DAILEYRD

---

## Tips for Extraction

1. **Field name matching is critical.** If the spreadsheet uses a slightly different name (e.g., "10S OURS" vs "10.S OURS"), use the exact name from the reference list above.

2. **Cost allocation:** If the workbook tracks costs at the farm level rather than field level, divide total farm costs by total farm acres to get a per-acre figure, then apply that to each field. Note this assumption.

3. **Multi-year workbooks:** If one workbook contains multiple years, produce one crop-history.csv with all years included.

4. **Missing data:** Use 0 for missing numeric values, leave strings blank. Add a note explaining what's missing.

5. **Fallow and non-productive fields:** Include these in crop-history.csv with crop=FALLOW or PASTURE or WASTE. They may still have costs (weed control, taxes, rent).

6. **Government payments:** If ARC/PLC or other government payments are tracked, include them in the `misc` cost column as a negative number (since they reduce cost), or note them.

7. **Output format:** Plain CSV with headers. No quotes needed unless a value contains a comma. Use UTF-8 encoding.
