const db = require('../models/database');

const chemicalController = {
    getAllChemicals: async (req, res) => {
        try {
            const chemicals = await db.query(`
                SELECT * FROM chemicals
                ORDER BY name ASC
            `);
            
            res.json(chemicals);
        } catch (error) {
            console.error('Error fetching chemicals:', error);
            res.status(500).json({ error: 'Failed to fetch chemicals' });
        }
    },

    createChemical: async (req, res) => {
        try {
            const { 
                name, 
                type, 
                quantity, 
                unit_of_measure, 
                cost_per_unit,
                markup_percentage,
                min_stock_level,
                supplier,
                notes
            } = req.body;

            // Input validation
            if (!name || !type || !quantity || !unit_of_measure || !cost_per_unit) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const result = await db.query(
                `INSERT INTO chemicals (
                    name, type, quantity, unit_of_measure, cost_per_unit,
                    markup_percentage, min_stock_level, supplier, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [name, type, quantity, unit_of_measure, cost_per_unit, markup_percentage, min_stock_level, supplier, notes]
            );

            res.status(201).json({ 
                id: result.insertId,
                message: 'Chemical added successfully' 
            });
        } catch (error) {
            console.error('Error creating chemical:', error);
            res.status(500).json({ error: 'Failed to add chemical' });
        }
    },

    getChemicalById: async (req, res) => {
        try {
            const { id } = req.params;
            const [chemical] = await db.query('SELECT * FROM chemicals WHERE id = ?', [id]);
            
            if (!chemical) {
                return res.status(404).json({ error: 'Chemical not found' });
            }
            
            res.json(chemical);
        } catch (error) {
            console.error('Error fetching chemical:', error);
            res.status(500).json({ error: 'Failed to fetch chemical' });
        }
    },

    updateChemical: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                name, 
                type, 
                quantity, 
                unit_of_measure, 
                cost_per_unit,
                markup_percentage,
                min_stock_level,
                supplier,
                notes
            } = req.body;

            const result = await db.query(
                `UPDATE chemicals SET 
                    name = ?, 
                    type = ?, 
                    quantity = ?, 
                    unit_of_measure = ?, 
                    cost_per_unit = ?,
                    markup_percentage = ?,
                    min_stock_level = ?,
                    supplier = ?,
                    notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [name, type, quantity, unit_of_measure, cost_per_unit, markup_percentage, min_stock_level, supplier, notes, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Chemical not found' });
            }
            
            res.json({ message: 'Chemical updated successfully' });
        } catch (error) {
            console.error('Error updating chemical:', error);
            res.status(500).json({ error: 'Failed to update chemical' });
        }
    },

    deleteChemical: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query('DELETE FROM chemicals WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Chemical not found' });
            }
            
            res.json({ message: 'Chemical deleted successfully' });
        } catch (error) {
            console.error('Error deleting chemical:', error);
            res.status(500).json({ error: 'Failed to delete chemical' });
        }
    }
};

module.exports = chemicalController;