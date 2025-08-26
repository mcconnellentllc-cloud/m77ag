const db = require('../models/database');

const orderController = {
    getAllOrders: async (req, res) => {
        try {
            const orders = await db.query(`
                SELECT o.*, 
                       c.name as customer_name,
                       COUNT(DISTINCT oi.id) as item_count,
                       SUM(oi.quantity * oi.price) as total_amount
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                GROUP BY o.id
                ORDER BY o.created_at DESC
            `);
            
            res.json(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ error: 'Failed to fetch orders' });
        }
    },

    createOrder: async (req, res) => {
        try {
            const { 
                customer_id, 
                order_date, 
                status, 
                payment_method,
                payment_status,
                shipping_address,
                notes,
                items
            } = req.body;

            // Input validation
            if (!customer_id || !items || items.length === 0) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Start transaction
            await db.query('BEGIN TRANSACTION');

            // Calculate total amount
            const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

            // Insert order
            const orderResult = await db.query(
                `INSERT INTO orders (
                    customer_id, order_date, status, payment_method, payment_status,
                    shipping_address, notes, total_amount, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [customer_id, order_date || new Date().toISOString().split('T')[0], 
                 status || 'pending', payment_method, payment_status || 'unpaid',
                 shipping_address, notes, total_amount]
            );

            const orderId = orderResult.insertId;

            // Insert order items
            const itemValues = items.map(item => 
                [orderId, item.chemical_id, item.quantity, item.price, item.unit]);
            
            await db.query(
                `INSERT INTO order_items (
                    order_id, chemical_id, quantity, price, unit
                ) VALUES ?`,
                [itemValues]
            );

            // Update chemical inventory
            for (const item of items) {
                await db.query(
                    `UPDATE chemicals 
                     SET quantity = quantity - ?
                     WHERE id = ?`,
                    [item.quantity, item.chemical_id]
                );
            }

            // Commit transaction
            await db.query('COMMIT');

            res.status(201).json({ 
                id: orderId,
                message: 'Order created successfully' 
            });
        } catch (error) {
            // Rollback transaction on error
            await db.query('ROLLBACK');
            console.error('Error creating order:', error);
            res.status(500).json({ error: 'Failed to create order' });
        }
    },

    getOrderById: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Get order details
            const [order] = await db.query(`
                SELECT o.*, c.name as customer_name
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                WHERE o.id = ?
            `, [id]);
            
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }
            
            // Get order items
            const orderItems = await db.query(`
                SELECT oi.*, c.name as chemical_name, c.type as chemical_type
                FROM order_items oi
                JOIN chemicals c ON oi.chemical_id = c.id
                WHERE oi.order_id = ?
            `, [id]);
            
            order.items = orderItems;
            
            res.json(order);
        } catch (error) {
            console.error('Error fetching order:', error);
            res.status(500).json({ error: 'Failed to fetch order' });
        }
    },

    updateOrder: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                customer_id, 
                order_date, 
                status, 
                payment_method,
                payment_status,
                shipping_address,
                notes,
                items
            } = req.body;

            // Start transaction
            await db.query('BEGIN TRANSACTION');

            // Update order
            const result = await db.query(
                `UPDATE orders SET 
                    customer_id = ?, 
                    order_date = ?, 
                    status = ?, 
                    payment_method = ?, 
                    payment_status = ?,
                    shipping_address = ?,
                    notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [customer_id, order_date, status, payment_method, payment_status, 
                 shipping_address, notes, id]
            );
            
            if (result.affectedRows === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Order not found' });
            }
            
            // Update items if provided
            if (items) {
                // Get existing order items
                const existingItems = await db.query(
                    'SELECT chemical_id, quantity FROM order_items WHERE order_id = ?',
                    [id]
                );
                
                // Create a map of chemical_id to quantity for existing items
                const existingItemMap = existingItems.reduce((map, item) => {
                    map[item.chemical_id] = item.quantity;
                    return map;
                }, {});
                
                // Return quantities to inventory
                for (const [chemicalId, quantity] of Object.entries(existingItemMap)) {
                    await db.query(
                        `UPDATE chemicals 
                         SET quantity = quantity + ?
                         WHERE id = ?`,
                        [quantity, chemicalId]
                    );
                }
                
                // Delete existing order items
                await db.query('DELETE FROM order_items WHERE order_id = ?', [id]);
                
                // Insert new order items
                if (items.length > 0) {
                    const itemValues = items.map(item => 
                        [id, item.chemical_id, item.quantity, item.price, item.unit]);
                    
                    await db.query(
                        `INSERT INTO order_items (
                            order_id, chemical_id, quantity, price, unit
                        ) VALUES ?`,
                        [itemValues]
                    );
                    
                    // Update chemical inventory for new items
                    for (const item of items) {
                        await db.query(
                            `UPDATE chemicals 
                             SET quantity = quantity - ?
                             WHERE id = ?`,
                            [item.quantity, item.chemical_id]
                        );
                    }
                    
                    // Update total amount
                    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                    await db.query(
                        'UPDATE orders SET total_amount = ? WHERE id = ?',
                        [total_amount, id]
                    );
                }
            }

            // Commit transaction
            await db.query('COMMIT');
            
            res.json({ message: 'Order updated successfully' });
        } catch (error) {
            // Rollback transaction on error
            await db.query('ROLLBACK');
            console.error('Error updating order:', error);
            res.status(500).json({ error: 'Failed to update order' });
        }
    },

    deleteOrder: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Start transaction
            await db.query('BEGIN TRANSACTION');
            
            // Get order items to return to inventory
            const orderItems = await db.query(
                'SELECT chemical_id, quantity FROM order_items WHERE order_id = ?',
                [id]
            );
            
            // Return quantities to inventory
            for (const item of orderItems) {
                await db.query(
                    `UPDATE chemicals 
                     SET quantity = quantity + ?
                     WHERE id = ?`,
                    [item.quantity, item.chemical_id]
                );
            }
            
            // Delete order items first (foreign key constraint)
            await db.query('DELETE FROM order_items WHERE order_id = ?', [id]);
            
            // Delete order
            const result = await db.query('DELETE FROM orders WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Order not found' });
            }
            
            // Commit transaction
            await db.query('COMMIT');
            
            res.json({ message: 'Order deleted successfully' });
        } catch (error) {
            // Rollback transaction on error
            await db.query('ROLLBACK');
            console.error('Error deleting order:', error);
            res.status(500).json({ error: 'Failed to delete order' });
        }
    }
};

module.exports = orderController;