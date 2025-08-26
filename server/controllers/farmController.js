const db = require('../models/database');

const farmController = {
    getAllCosts: async (req, res) => {
        try {
            const costs = await db.query(`
                SELECT * FROM farm_costs
                ORDER BY date DESC
            `);
            
            res.json(costs);
        } catch (error) {
            console.error('Error fetching farm costs:', error);
            res.status(500).json({ error: 'Failed to fetch farm costs' });
        }
    },

    createCost: async (req, res) => {
        try {
            const { 
                category, 
                description, 
                amount, 
                date,
                field_id,
                crop_type,
                payment_method,
                receipt_image,
                notes
            } = req.body;

            // Input validation
            if (!category || !amount || !date) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const result = await db.query(
                `INSERT INTO farm_costs (
                    category, description, amount, date, field_id,
                    crop_type, payment_method, receipt_image, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [category, description, amount, date, field_id, crop_type, payment_method, receipt_image, notes]
            );

            res.status(201).json({ 
                id: result.insertId,
                message: 'Farm cost added successfully' 
            });
        } catch (error) {
            console.error('Error creating farm cost:', error);
            res.status(500).json({ error: 'Failed to add farm cost' });
        }
    },

    getCostById: async (req, res) => {
        try {
            const { id } = req.params;
            const [cost] = await db.query('SELECT * FROM farm_costs WHERE id = ?', [id]);
            
            if (!cost) {
                return res.status(404).json({ error: 'Farm cost not found' });
            }
            
            res.json(cost);
        } catch (error) {
            console.error('Error fetching farm cost:', error);
            res.status(500).json({ error: 'Failed to fetch farm cost' });
        }
    },

    updateCost: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                category, 
                description, 
                amount, 
                date,
                field_id,
                crop_type,
                payment_method,
                receipt_image,
                notes
            } = req.body;

            const result = await db.query(
                `UPDATE farm_costs SET 
                    category = ?, 
                    description = ?, 
                    amount = ?, 
                    date = ?, 
                    field_id = ?,
                    crop_type = ?,
                    payment_method = ?,
                    receipt_image = ?,
                    notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [category, description, amount, date, field_id, crop_type, payment_method, receipt_image, notes, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Farm cost not found' });
            }
            
            res.json({ message: 'Farm cost updated successfully' });
        } catch (error) {
            console.error('Error updating farm cost:', error);
            res.status(500).json({ error: 'Failed to update farm cost' });
        }
    },

    deleteCost: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query('DELETE FROM farm_costs WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Farm cost not found' });
            }
            
            res.json({ message: 'Farm cost deleted successfully' });
        } catch (error) {
            console.error('Error deleting farm cost:', error);
            res.status(500).json({ error: 'Failed to delete farm cost' });
        }
    }
};

module.exports = farmController;