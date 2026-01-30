const { equipmentData } = require('./seed-equipment');

console.log('=== EQUIPMENT NEEDING VALUES ===\n');

const needsValues = equipmentData.filter(e => !e.currentValue || e.currentValue === 0);

needsValues.forEach((item, i) => {
  console.log(`${i+1}. ${item.title}`);
  console.log(`   Category: ${item.category}`);
  console.log(`   Year: ${item.year || 'Unknown'}`);
  console.log(`   Make: ${item.make || 'Unknown'}`);
  console.log(`   Model: ${item.model || 'Unknown'}`);
  console.log(`   Serial: ${item.serialNumber || 'N/A'}`);
  console.log(`   Current Value: $0 (NEEDS VALUE)`);
  console.log('');
});

console.log(`\nTOTAL: ${needsValues.length} items need values`);
