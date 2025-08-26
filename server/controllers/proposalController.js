const db = require('../models/database');
const { createCsvWriter } = require('csv-writer');
const ExcelJS = require('exceljs');

const proposalController = {
    createProposal: async (req, res) => {
        try {
            const { 
                customer_name, 
                email, 
                phone, 
                service_type, 
                acres, 
                application_rate,
                notes, 
                total_cost 
            } = req.body;

            // Input validation
            if (!customer_name || !email || !service_type || !acres) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Calculate discount based on acres
            let discount = 0;
            if (acres >= 300) {
                discount = 0.14; // 14% for 300+ acres
            } else if (acres >= 200) {
                discount = 0.10; // 10% for 200+ acres
            } else if (acres >= 100) {
                discount = 0.07; // 7% for 100+ acres
            }

            const result = await db.query(
                `INSERT INTO proposals (
                    customer_name, email, phone, service_type, acres, 
                    application_rate, notes, discount, total_cost, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
                [customer_name, email, phone, service_type, acres, application_rate, notes, discount, total_cost]
            );

            res.status(201).json({ 
                id: result.insertId,
                message: 'Proposal created successfully' 
            });
        } catch (error) {
            console.error('Error creating proposal:', error);
            res.status(500).json({ error: 'Failed to create proposal' });
        }
    },

    getAllProposals: async (req, res) => {
        try {
            const proposals = await db.query(`
                SELECT * FROM proposals
                ORDER BY created_at DESC
            `);
            
            res.json(proposals);
        } catch (error) {
            console.error('Error fetching proposals:', error);
            res.status(500).json({ error: 'Failed to fetch proposals' });
        }
    },

    getProposalById: async (req, res) => {
        try {
            const { id } = req.params;
            const [proposal] = await db.query('SELECT * FROM proposals WHERE id = ?', [id]);
            
            if (!proposal) {
                return res.status(404).json({ error: 'Proposal not found' });
            }
            
            res.json(proposal);
        } catch (error) {
            console.error('Error fetching proposal:', error);
            res.status(500).json({ error: 'Failed to fetch proposal' });
        }
    },

    updateProposalStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            
            const result = await db.query(
                'UPDATE proposals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Proposal not found' });
            }
            
            res.json({ message: 'Proposal status updated successfully' });
        } catch (error) {
            console.error('Error updating proposal status:', error);
            res.status(500).json({ error: 'Failed to update proposal status' });
        }
    },

    deleteProposal: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query('DELETE FROM proposals WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Proposal not found' });
            }
            
            res.json({ message: 'Proposal deleted successfully' });
        } catch (error) {
            console.error('Error deleting proposal:', error);
            res.status(500).json({ error: 'Failed to delete proposal' });
        }
    },

    exportToCsv: async (req, res) => {
        try {
            const proposals = await db.query(`
                SELECT id, customer_name, email, phone, service_type, acres, 
                       application_rate, notes, discount, total_cost, status, 
                       created_at, updated_at
                FROM proposals
                ORDER BY created_at DESC
            `);
            
            // Set up CSV file
            const csvWriter = createCsvWriter({
                path: './temp/proposals.csv',
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'customer_name', title: 'Customer Name' },
                    { id: 'email', title: 'Email' },
                    { id: 'phone', title: 'Phone' },
                    { id: 'service_type', title: 'Service Type' },
                    { id: 'acres', title: 'Acres' },
                    { id: 'application_rate', title: 'Application Rate' },
                    { id: 'notes', title: 'Notes' },
                    { id: 'discount', title: 'Discount' },
                    { id: 'total_cost', title: 'Total Cost' },
                    { id: 'status', title: 'Status' },
                    { id: 'created_at', title: 'Created At' },
                    { id: 'updated_at', title: 'Updated At' }
                ]
            });
            
            await csvWriter.writeRecords(proposals);
            
            res.download('./temp/proposals.csv', 'M77AG_Proposals.csv');
        } catch (error) {
            console.error('Error exporting proposals to CSV:', error);
            res.status(500).json({ error: 'Failed to export proposals to CSV' });
        }
    },

    exportToExcel: async (req, res) => {
        try {
            const proposals = await db.query(`
                SELECT id, customer_name, email, phone, service_type, acres, 
                       application_rate, notes, discount, total_cost, status, 
                       created_at, updated_at
                FROM proposals
                ORDER BY created_at DESC
            `);
            
            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Proposals');
            
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Customer Name', key: 'customer_name', width: 20 },
                { header: 'Email', key: 'email', width: 25 },
                { header: 'Phone', key: 'phone', width: 15 },
                { header: 'Service Type', key: 'service_type', width: 15 },
                { header: 'Acres', key: 'acres', width: 10 },
                { header: 'Application Rate', key: 'application_rate', width: 15 },
                { header: 'Notes', key: 'notes', width: 30 },
                { header: 'Discount', key: 'discount', width: 10 },
                { header: 'Total Cost', key: 'total_cost', width: 15 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Created At', key: 'created_at', width: 20 },
                { header: 'Updated At', key: 'updated_at', width: 20 }
            ];
            
            // Add rows
            worksheet.addRows(proposals);
            
            // Save to file
            await workbook.xlsx.writeFile('./temp/proposals.xlsx');
            
            res.download('./temp/proposals.xlsx', 'M77AG_Proposals.xlsx');
        } catch (error) {
            console.error('Error exporting proposals to Excel:', error);
            res.status(500).json({ error: 'Failed to export proposals to Excel' });
        }
    }
};

module.exports = proposalController;