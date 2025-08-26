const db = require('../models/database');

const customerController = {
    getAllCustomers: async (req, res) => {
        try {
            const customers = await db.query(`
                SELECT c.*, 
                       COUNT(DISTINCT p.id) as proposal_count
                FROM customers c
                LEFT JOIN proposals p ON c.id = p.customer_id
                GROUP BY c.id
                ORDER BY c.name ASC
            `);
            
            res.json(customers);
        } catch (error) {
            console.error('Error fetching customers:', error);
            res.status(500).json({ error: 'Failed to fetch customers' });
        }
    },

    createCustomer: async (req, res) => {
        try {
            const { 
                name, 
                email, 
                phone, 
                address,
                city,
                state,
                zip,
                notes,
                total_acres
            } = req.body;

            // Input validation
            if (!name || !email) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const result = await db.query(
                `INSERT INTO customers (
                    name, email, phone, address, city, state, zip, notes, total_acres, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [name, email, phone, address, city, state, zip, notes, total_acres]
            );

            res.status(201).json({ 
                id: result.insertId,
                message: 'Customer created successfully' 
            });
        } catch (error) {
            console.error('Error creating customer:', error);
            res.status(500).json({ error: 'Failed to create customer' });
        }
    },

    getCustomerById: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Get customer details
            const [customer] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
            
            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            
            // Get customer proposals
            const proposals = await db.query(`
                SELECT id, service_type, acres, total_cost, status, created_at
                FROM proposals
                WHERE customer_id = ?
                ORDER BY created_at DESC
            `, [id]);
            
            customer.proposals = proposals;
            
            res.json(customer);
        } catch (error) {
            console.error('Error fetching customer:', error);
            res.status(500).json({ error: 'Failed to fetch customer' });
        }
    },

    updateCustomer: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                name, 
                email, 
                phone, 
                address,
                city,
                state,
                zip,
                notes,
                total_acres
            } = req.body;

            const result = await db.query(
                `UPDATE customers SET 
                    name = ?, 
                    email = ?, 
                    phone = ?, 
                    address = ?, 
                    city = ?,
                    state = ?,
                    zip = ?,
                    notes = ?,
                    total_acres = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [name, email, phone, address, city, state, zip, notes, total_acres, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            
            res.json({ message: 'Customer updated successfully' });
        } catch (error) {
            console.error('Error updating customer:', error);
            res.status(500).json({ error: 'Failed to update customer' });
        }
    },

    deleteCustomer: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Check if customer has proposals
            const [proposalCount] = await db.query(
                'SELECT COUNT(*) as count FROM proposals WHERE customer_id = ?',
                [id]
            );
            
            if (proposalCount.count > 0) {
                return res.status(400).json({ 
                    error: 'Cannot delete customer with existing proposals. Please delete or reassign proposals first.' 
                });
            }
            
            const result = await db.query('DELETE FROM customers WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            
            res.json({ message: 'Customer deleted successfully' });
        } catch (error) {
            console.error('Error deleting customer:', error);
            res.status(500).json({ error: 'Failed to delete customer' });
        }
    }
};

module.exports = customerController;