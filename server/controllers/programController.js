const db = require('../models/database');

const programController = {
    getAllPrograms: async (req, res) => {
        try {
            const programs = await db.query(`
                SELECT p.*, 
                       COUNT(DISTINCT pc.chemical_id) as chemical_count
                FROM programs p
                LEFT JOIN program_chemicals pc ON p.id = pc.program_id
                GROUP BY p.id
                ORDER BY p.name ASC
            `);
            
            res.json(programs);
        } catch (error) {
            console.error('Error fetching programs:', error);
            res.status(500).json({ error: 'Failed to fetch programs' });
        }
    },

    createProgram: async (req, res) => {
        try {
            const { 
                name, 
                description, 
                crop_type, 
                season,
                application_method,
                application_rate,
                chemicals,
                notes
            } = req.body;

            // Input validation
            if (!name || !crop_type || !application_method || !application_rate) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Start a transaction
            await db.query('BEGIN TRANSACTION');

            // Insert program
            const programResult = await db.query(
                `INSERT INTO programs (
                    name, description, crop_type, season, application_method,
                    application_rate, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [name, description, crop_type, season, application_method, application_rate, notes]
            );

            const programId = programResult.insertId;

            // Insert program chemicals
            if (chemicals && chemicals.length > 0) {
                const chemicalValues = chemicals.map(chemical => 
                    [programId, chemical.chemical_id, chemical.rate, chemical.unit]);
                
                await db.query(
                    `INSERT INTO program_chemicals (
                        program_id, chemical_id, rate, unit
                    ) VALUES ?`,
                    [chemicalValues]
                );
            }

            // Commit transaction
            await db.query('COMMIT');

            res.status(201).json({ 
                id: programId,
                message: 'Program created successfully' 
            });
        } catch (error) {
            // Rollback transaction on error
            await db.query('ROLLBACK');
            console.error('Error creating program:', error);
            res.status(500).json({ error: 'Failed to create program' });
        }
    },

    getProgramById: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Get program details
            const [program] = await db.query('SELECT * FROM programs WHERE id = ?', [id]);
            
            if (!program) {
                return res.status(404).json({ error: 'Program not found' });
            }
            
            // Get program chemicals
            const programChemicals = await db.query(`
                SELECT pc.*, c.name as chemical_name, c.type as chemical_type
                FROM program_chemicals pc
                JOIN chemicals c ON pc.chemical_id = c.id
                WHERE pc.program_id = ?
            `, [id]);
            
            program.chemicals = programChemicals;
            
            res.json(program);
        } catch (error) {
            console.error('Error fetching program:', error);
            res.status(500).json({ error: 'Failed to fetch program' });
        }
    },

    updateProgram: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                name, 
                description, 
                crop_type, 
                season,
                application_method,
                application_rate,
                chemicals,
                notes
            } = req.body;

            // Start transaction
            await db.query('BEGIN TRANSACTION');

            // Update program
            const result = await db.query(
                `UPDATE programs SET 
                    name = ?, 
                    description = ?, 
                    crop_type = ?, 
                    season = ?, 
                    application_method = ?,
                    application_rate = ?,
                    notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [name, description, crop_type, season, application_method, application_rate, notes, id]
            );
            
            if (result.affectedRows === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Program not found' });
            }
            
            // Update chemicals if provided
            if (chemicals) {
                // Delete existing program chemicals
                await db.query('DELETE FROM program_chemicals WHERE program_id = ?', [id]);
                
                // Insert new program chemicals
                if (chemicals.length > 0) {
                    const chemicalValues = chemicals.map(chemical => 
                        [id, chemical.chemical_id, chemical.rate, chemical.unit]);
                    
                    await db.query(
                        `INSERT INTO program_chemicals (
                            program_id, chemical_id, rate, unit
                        ) VALUES ?`,
                        [chemicalValues]
                    );
                }
            }

            // Commit transaction
            await db.query('COMMIT');
            
            res.json({ message: 'Program updated successfully' });
        } catch (error) {
            // Rollback transaction on error
            await db.query('ROLLBACK');
            console.error('Error updating program:', error);
            res.status(500).json({ error: 'Failed to update program' });
        }
    },

    deleteProgram: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Start transaction
            await db.query('BEGIN TRANSACTION');
            
            // Delete program chemicals first (foreign key constraint)
            await db.query('DELETE FROM program_chemicals WHERE program_id = ?', [id]);
            
            // Delete program
            const result = await db.query('DELETE FROM programs WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Program not found' });
            }
            
            // Commit transaction
            await db.query('COMMIT');
            
            res.json({ message: 'Program deleted successfully' });
        } catch (error) {
            // Rollback transaction on error
            await db.query('ROLLBACK');
            console.error('Error deleting program:', error);
            res.status(500).json({ error: 'Failed to delete program' });
        }
    }
};

module.exports = programController;