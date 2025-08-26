// test-database.js
const database = require('./server/models/database');

async function testDatabase() {
  try {
    console.log('Starting database test...');
    
    // Ensure database is initialized before testing
    if (!database.initialized) {
      console.log('Initializing database...');
      await database.connect();
      await database.initSchema();
    }
    
    // Test 1: Insert a test proposal
    console.log('\nTest 1: Creating a test proposal...');
    const insertResult = await database.query(
      `INSERT INTO proposals (
        customer_name, email, phone, service_type, acres, 
        application_rate, notes, total_cost, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Test Customer', 
        'test@example.com', 
        '555-123-4567', 
        'Spraying', 
        100, 
        '2 gal/acre', 
        'Test notes', 
        1500, 
        'pending'
      ]
    );
    
    console.log('Insert result:', insertResult);
    const newProposalId = insertResult.lastID || insertResult.insertId;
    
    // Test 2: Query the inserted proposal
    console.log('\nTest 2: Retrieving the test proposal...');
    const proposals = await database.query(
      'SELECT * FROM proposals WHERE id = ?',
      [newProposalId]
    );
    
    console.log('Retrieved proposal:', proposals[0]);
    
    // Test 3: Update the proposal
    console.log('\nTest 3: Updating the test proposal...');
    const updateResult = await database.query(
      'UPDATE proposals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', newProposalId]
    );
    
    console.log('Update result:', updateResult);
    
    // Test 4: Query the updated proposal
    console.log('\nTest 4: Retrieving the updated proposal...');
    const updatedProposals = await database.query(
      'SELECT * FROM proposals WHERE id = ?',
      [newProposalId]
    );
    
    console.log('Updated proposal:', updatedProposals[0]);
    
    // Test 5: Delete the test proposal
    console.log('\nTest 5: Deleting the test proposal...');
    const deleteResult = await database.query(
      'DELETE FROM proposals WHERE id = ?',
      [newProposalId]
    );
    
    console.log('Delete result:', deleteResult);
    
    // Test 6: Verify deletion
    console.log('\nTest 6: Verifying deletion...');
    const remainingProposals = await database.query(
      'SELECT * FROM proposals WHERE id = ?',
      [newProposalId]
    );
    
    console.log('Remaining proposals:', remainingProposals);
    console.log('Deletion verification:', remainingProposals.length === 0 ? 'Success' : 'Failed');
    
    // Test 7: Create a customer
    console.log('\nTest 7: Creating a test customer...');
    const customerResult = await database.query(
      `INSERT INTO customers (
        name, email, phone, address, city, state, zip, total_acres
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Test Farm', 
        'farm@example.com', 
        '555-987-6543', 
        '123 Farm Rd', 
        'Farmville', 
        'TX', 
        '12345', 
        500
      ]
    );
    
    console.log('Customer insert result:', customerResult);
    
    // Test 8: Test transaction (for SQLite only)
    console.log('\nTest 8: Testing transaction support...');
    try {
      // Begin transaction manually for test
      await database.query('BEGIN TRANSACTION');
      
      // Insert a chemical
      const chemicalResult = await database.query(
        `INSERT INTO chemicals (
          name, type, quantity, unit_of_measure, cost_per_unit
        ) VALUES (?, ?, ?, ?, ?)`,
        ['Test Chemical', 'Herbicide', 100, 'gallons', 25.50]
      );
      
      console.log('Chemical insert result:', chemicalResult);
      
      // Commit transaction
      await database.query('COMMIT');
      console.log('Transaction committed successfully');
    } catch (error) {
      // Rollback on error
      await database.query('ROLLBACK');
      console.error('Transaction failed, rolled back:', error.message);
    }
    
    console.log('\nDatabase test completed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    // Close the database connection
    await database.close();
  }
}

// Run the test
testDatabase();