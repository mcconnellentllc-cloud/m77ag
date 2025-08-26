const db = require('../models/database');

const analyticsController = {
    getDashboardAnalytics: async (req, res) => {
        try {
            // Get proposal statistics
            const proposalStats = await db.query(`
                SELECT 
                    COUNT(*) as totalProposals,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingProposals,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvedProposals,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedProposals,
                    SUM(total_cost) as totalRevenue
                FROM proposals
            `);

            // Get chemical inventory statistics
            const chemicalStats = await db.query(`
                SELECT 
                    COUNT(*) as totalChemicals,
                    SUM(CASE WHEN quantity <= min_stock_level THEN 1 ELSE 0 END) as lowStockItems,
                    SUM(quantity * cost_per_unit) as inventoryValue
                FROM chemicals
            `);

            // Get customer statistics
            const customerStats = await db.query(`
                SELECT COUNT(*) as totalCustomers
                FROM customers
            `);

            // Get recent proposals (last 5)
            const recentProposals = await db.query(`
                SELECT id, customer_name, service_type, acres, total_cost, status, created_at
                FROM proposals
                ORDER BY created_at DESC
                LIMIT 5
            `);

            res.json({
                proposalStats: proposalStats[0],
                chemicalStats: chemicalStats[0],
                customerStats: customerStats[0],
                recentProposals
            });
        } catch (error) {
            console.error('Error fetching dashboard analytics:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
        }
    }
};

module.exports = analyticsController;