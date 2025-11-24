// Spray Program Cost Calculator
// Calculates exact costs based on product rates and container sizes

/**
 * Calculate chemical cost per acre
 * @param {number} price - Price per gallon/lb/oz
 * @param {number} rate - Application rate per acre
 * @param {string} unit - Unit of measure (gl, oz, lb)
 * @param {string} priceUnit - Unit for price (usually same as unit)
 * @returns {number} Cost per acre
 */
function calculateCostPerAcre(price, rate, unit, priceUnit = 'gl') {
  // Convert rate to pricing unit if needed
  let costPerAcre = 0;

  if (unit === 'oz' && priceUnit === 'gl') {
    // Convert oz to gallons (128 oz per gallon)
    costPerAcre = (rate / 128) * price;
  } else if (unit === 'oz' && priceUnit === 'lb') {
    // Convert oz to pounds (16 oz per lb)
    costPerAcre = (rate / 16) * price;
  } else if (unit === 'lb' && priceUnit === 'lb') {
    costPerAcre = rate * price;
  } else if (unit === 'gl' && priceUnit === 'gl') {
    costPerAcre = rate * price;
  } else {
    // Assume same units
    costPerAcre = rate * price;
  }

  return costPerAcre;
}

/**
 * Calculate total containers needed
 * @param {number} acres - Total acres
 * @param {number} ratePerAcre - Rate per acre
 * @param {number} containerSize - Size of container
 * @param {string} unit - Unit of measure
 * @returns {object} Container calculation details
 */
function calculateContainers(acres, ratePerAcre, containerSize, unit) {
  const totalNeeded = acres * ratePerAcre;

  // Convert to container units if needed
  let totalInContainerUnits = totalNeeded;
  if (unit === 'oz') {
    // Most products are sold by gallon, so convert oz to gallons for container calc
    totalInContainerUnits = totalNeeded / 128; // 128 oz per gallon
  }

  const containersNeeded = Math.ceil(totalInContainerUnits / containerSize);
  const totalToOrder = containersNeeded * containerSize;
  const leftover = totalToOrder - totalInContainerUnits;

  return {
    totalNeeded: totalNeeded,
    totalInContainerUnits: totalInContainerUnits.toFixed(2),
    containersNeeded: containersNeeded,
    totalToOrder: totalToOrder.toFixed(2),
    leftover: leftover.toFixed(2),
    unit: unit
  };
}

// Palmer Amaranth Program - Pass by Pass Calculations

const palmerAmaranthProgram = {

  // Pass 1: Fall Burndown
  pass1: {
    products: [
      {
        name: 'RT3',
        price: 14.95, // per gallon
        rate: 32, // oz per acre
        unit: 'oz',
        priceUnit: 'gl',
        containerSize: 105, // gallon shuttle
        costPerAcre: calculateCostPerAcre(14.95, 32, 'oz', 'gl')
      },
      {
        name: 'LV 6',
        price: 28.57, // per gallon
        rate: 16, // oz per acre
        unit: 'oz',
        priceUnit: 'gl',
        containerSize: 105, // gallon shuttle
        costPerAcre: calculateCostPerAcre(28.57, 16, 'oz', 'gl')
      }
    ]
  },

  // Pass 2: Pre-Plant Burndown (same as Pass 1)
  pass2: {
    products: [
      {
        name: 'RT3',
        price: 14.95,
        rate: 32,
        unit: 'oz',
        priceUnit: 'gl',
        containerSize: 105,
        costPerAcre: calculateCostPerAcre(14.95, 32, 'oz', 'gl')
      },
      {
        name: 'LV 6',
        price: 28.57,
        rate: 16,
        unit: 'oz',
        priceUnit: 'gl',
        containerSize: 105,
        costPerAcre: calculateCostPerAcre(28.57, 16, 'oz', 'gl')
      }
    ]
  },

  // Pass 3: Pre-Emerge (Two Options)
  pass3_standard: {
    products: [
      {
        name: 'Aatex',
        price: 13.35,
        rate: 48, // oz per acre (1.5 qt)
        unit: 'oz',
        priceUnit: 'gl',
        containerSize: 105,
        costPerAcre: calculateCostPerAcre(13.35, 48, 'oz', 'gl')
      },
      {
        name: 'Valor SX',
        price: 14.25,
        rate: 3, // oz per acre
        unit: 'oz',
        priceUnit: 'lb',
        containerSize: 5, // 5 lb container
        costPerAcre: calculateCostPerAcre(14.25, 3, 'oz', 'lb')
      }
    ]
  },

  pass3_premium: {
    products: [
      {
        name: 'Aatex',
        price: 13.35,
        rate: 48,
        unit: 'oz',
        priceUnit: 'gl',
        containerSize: 105,
        costPerAcre: calculateCostPerAcre(13.35, 48, 'oz', 'gl')
      },
      {
        name: 'Sulfentrazone',
        price: 70.50,
        rate: 6, // oz per acre
        unit: 'oz',
        priceUnit: 'gl',
        containerSize: 2.5,
        costPerAcre: calculateCostPerAcre(70.50, 6, 'oz', 'gl')
      }
    ]
  },

  // Pass 4: Post-Emerge
  pass4: {
    products: [
      {
        name: 'RT3',
        price: 14.95,
        rate: 22, // oz per acre
        unit: 'oz',
        priceUnit: 'gl',
        containerSize: 105,
        costPerAcre: calculateCostPerAcre(14.95, 22, 'oz', 'gl')
      },
      {
        name: 'Dicamba DMA',
        price: 28.25,
        rate: 16, // oz per acre
        unit: 'oz',
        priceUnit: 'gl',
        containerSize: 105,
        costPerAcre: calculateCostPerAcre(28.25, 16, 'oz', 'gl')
      },
      {
        name: 'Aatex',
        price: 13.35,
        rate: 32, // oz per acre (1 qt)
        unit: 'oz',
        priceUnit: 'gl',
        containerSize: 105,
        costPerAcre: calculateCostPerAcre(13.35, 32, 'oz', 'gl')
      }
    ]
  }
};

// Calculate totals
function calculateProgramCosts() {
  const pass1Total = palmerAmaranthProgram.pass1.products.reduce((sum, p) => sum + p.costPerAcre, 0);
  const pass2Total = palmerAmaranthProgram.pass2.products.reduce((sum, p) => sum + p.costPerAcre, 0);
  const pass3StandardTotal = palmerAmaranthProgram.pass3_standard.products.reduce((sum, p) => sum + p.costPerAcre, 0);
  const pass3PremiumTotal = palmerAmaranthProgram.pass3_premium.products.reduce((sum, p) => sum + p.costPerAcre, 0);
  const pass4Total = palmerAmaranthProgram.pass4.products.reduce((sum, p) => sum + p.costPerAcre, 0);

  const standardProgram = pass1Total + pass2Total + pass3StandardTotal + pass4Total;
  const premiumProgram = pass1Total + pass2Total + pass3PremiumTotal + pass4Total;

  return {
    pass1: {
      total: pass1Total.toFixed(2),
      products: palmerAmaranthProgram.pass1.products.map(p => ({
        name: p.name,
        rate: `${p.rate} ${p.unit}`,
        cost: `$${p.costPerAcre.toFixed(2)}`
      }))
    },
    pass2: {
      total: pass2Total.toFixed(2),
      products: palmerAmaranthProgram.pass2.products.map(p => ({
        name: p.name,
        rate: `${p.rate} ${p.unit}`,
        cost: `$${p.costPerAcre.toFixed(2)}`
      }))
    },
    pass3_standard: {
      total: pass3StandardTotal.toFixed(2),
      products: palmerAmaranthProgram.pass3_standard.products.map(p => ({
        name: p.name,
        rate: `${p.rate} ${p.unit}`,
        cost: `$${p.costPerAcre.toFixed(2)}`
      }))
    },
    pass3_premium: {
      total: pass3PremiumTotal.toFixed(2),
      products: palmerAmaranthProgram.pass3_premium.products.map(p => ({
        name: p.name,
        rate: `${p.rate} ${p.unit}`,
        cost: `$${p.costPerAcre.toFixed(2)}`
      }))
    },
    pass4: {
      total: pass4Total.toFixed(2),
      products: palmerAmaranthProgram.pass4.products.map(p => ({
        name: p.name,
        rate: `${p.rate} ${p.unit}`,
        cost: `$${p.costPerAcre.toFixed(2)}`
      }))
    },
    standardProgramTotal: standardProgram.toFixed(2),
    premiumProgramTotal: premiumProgram.toFixed(2)
  };
}

// Calculate for specific acreage
function calculateForAcres(acres, programType = 'standard') {
  const costs = calculateProgramCosts();
  const pricePerAcre = programType === 'standard'
    ? parseFloat(costs.standardProgramTotal)
    : parseFloat(costs.premiumProgramTotal);

  const baseTotal = acres * pricePerAcre;

  // Apply volume discounts
  let discount = 0;
  if (acres >= 1000) discount = 0.10;
  else if (acres >= 500) discount = 0.07;
  else if (acres >= 250) discount = 0.05;
  else if (acres >= 100) discount = 0.03;

  const discountAmount = baseTotal * discount;
  const finalTotal = baseTotal - discountAmount;

  // Calculate containers needed for each product
  const pass3Products = programType === 'standard'
    ? palmerAmaranthProgram.pass3_standard.products
    : palmerAmaranthProgram.pass3_premium.products;

  const containerDetails = [];

  // Pass 1
  palmerAmaranthProgram.pass1.products.forEach(p => {
    containerDetails.push({
      pass: 1,
      product: p.name,
      ...calculateContainers(acres, p.rate, p.containerSize, p.unit)
    });
  });

  // Pass 2 (same as Pass 1)
  palmerAmaranthProgram.pass2.products.forEach(p => {
    containerDetails.push({
      pass: 2,
      product: p.name,
      ...calculateContainers(acres, p.rate, p.containerSize, p.unit)
    });
  });

  // Pass 3
  pass3Products.forEach(p => {
    const containerSize = p.unit === 'oz' && p.priceUnit === 'lb'
      ? p.containerSize // Valor SX in pounds
      : p.containerSize; // Others in gallons

    containerDetails.push({
      pass: 3,
      product: p.name,
      ...calculateContainers(acres, p.rate, containerSize, p.unit)
    });
  });

  // Pass 4
  palmerAmaranthProgram.pass4.products.forEach(p => {
    containerDetails.push({
      pass: 4,
      product: p.name,
      ...calculateContainers(acres, p.rate, p.containerSize, p.unit)
    });
  });

  return {
    acres: acres,
    programType: programType.toUpperCase(),
    pricePerAcre: pricePerAcre.toFixed(2),
    baseTotal: baseTotal.toFixed(2),
    discountPercentage: (discount * 100).toFixed(0),
    discountAmount: discountAmount.toFixed(2),
    finalTotal: finalTotal.toFixed(2),
    costBreakdown: costs,
    containerDetails: containerDetails
  };
}

module.exports = {
  calculateCostPerAcre,
  calculateContainers,
  calculateProgramCosts,
  calculateForAcres,
  palmerAmaranthProgram
};

// Example usage / Test
if (require.main === module) {
  console.log('\n=== PALMER AMARANTH CONTROL PROGRAM CALCULATOR ===\n');

  const costs = calculateProgramCosts();
  console.log('Cost per Acre by Pass:');
  console.log(`Pass 1 (Fall Burndown): $${costs.pass1.total}`);
  console.log(`Pass 2 (Pre-Plant): $${costs.pass2.total}`);
  console.log(`Pass 3 Standard (Pre-Emerge): $${costs.pass3_standard.total}`);
  console.log(`Pass 3 Premium (Pre-Emerge): $${costs.pass3_premium.total}`);
  console.log(`Pass 4 (Post-Emerge): $${costs.pass4.total}`);
  console.log(`\nTotal Standard Program: $${costs.standardProgramTotal}/acre`);
  console.log(`Total Premium Program: $${costs.premiumProgramTotal}/acre`);

  // Calculate for 500 acres
  console.log('\n--- 500 Acre Example ---');
  const example = calculateForAcres(500, 'standard');
  console.log(`Total Cost: $${example.finalTotal} (${example.discountPercentage}% discount)`);
  console.log(`\nContainer Requirements (Pass 1):`);
  example.containerDetails.filter(c => c.pass === 1).forEach(c => {
    console.log(`  ${c.product}: ${c.containersNeeded} containers`);
  });
}
