const Invoice = require('../models/invoice');
const Transaction = require('../models/transaction');

// Create a new invoice
exports.createInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      const prefixMap = {
        customer_invoice: 'INV',
        vendor_bill: 'BILL',
        landlord_statement: 'LS',
        custom_work: 'CW',
        hunting_lease: 'HL',
        rental: 'RNT',
        equipment_sale: 'EQ'
      };
      const prefix = prefixMap[invoiceData.type] || 'INV';
      invoiceData.invoiceNumber = await Invoice.generateInvoiceNumber(prefix);
    }

    // Calculate totals from line items
    if (invoiceData.items && invoiceData.items.length > 0) {
      let subtotal = 0;
      let taxTotal = 0;

      invoiceData.items.forEach(item => {
        item.amount = item.quantity * item.unitPrice;
        if (item.taxable && item.taxRate) {
          item.taxAmount = item.amount * (item.taxRate / 100);
          taxTotal += item.taxAmount;
        }
        subtotal += item.amount;
      });

      invoiceData.subtotal = subtotal;
      invoiceData.taxTotal = taxTotal;

      // Apply discount
      let discountAmount = 0;
      if (invoiceData.discount && invoiceData.discount.value) {
        if (invoiceData.discount.type === 'percentage') {
          discountAmount = subtotal * (invoiceData.discount.value / 100);
        } else {
          discountAmount = invoiceData.discount.value;
        }
      }
      invoiceData.discountAmount = discountAmount;
      invoiceData.total = subtotal + taxTotal - discountAmount;
      invoiceData.balanceDue = invoiceData.total;
    }

    invoiceData.createdBy = req.userId;

    const invoice = await Invoice.create(invoiceData);

    res.status(201).json({
      success: true,
      data: invoice,
      message: `Invoice ${invoice.invoiceNumber} created successfully`
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
};

// Get all invoices with filters
exports.getInvoices = async (req, res) => {
  try {
    const {
      status, type, customer, landlord, startDate, endDate,
      cropYear, page = 1, limit = 50, sort = '-issueDate'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (customer) filter.customer = customer;
    if (landlord) filter.landlord = landlord;
    if (cropYear) filter.cropYear = parseInt(cropYear);
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customer', 'name email')
        .populate('landlord', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Invoice.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: error.message
    });
  }
};

// Get single invoice
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('landlord', 'name email phone')
      .populate('farm', 'name')
      .populate('items.field', 'fieldName acres');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice',
      error: error.message
    });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Don't allow editing paid/cancelled invoices
    if (['paid', 'cancelled', 'refunded'].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit invoice with status: ${invoice.status}`
      });
    }

    const updateData = req.body;

    // Recalculate totals if items changed
    if (updateData.items) {
      let subtotal = 0;
      let taxTotal = 0;

      updateData.items.forEach(item => {
        item.amount = item.quantity * item.unitPrice;
        if (item.taxable && item.taxRate) {
          item.taxAmount = item.amount * (item.taxRate / 100);
          taxTotal += item.taxAmount;
        }
        subtotal += item.amount;
      });

      updateData.subtotal = subtotal;
      updateData.taxTotal = taxTotal;

      let discountAmount = 0;
      const discount = updateData.discount || invoice.discount;
      if (discount && discount.value) {
        if (discount.type === 'percentage') {
          discountAmount = subtotal * (discount.value / 100);
        } else {
          discountAmount = discount.value;
        }
      }
      updateData.discountAmount = discountAmount;
      updateData.total = subtotal + taxTotal - discountAmount;
    }

    Object.assign(invoice, updateData);
    await invoice.save();

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message
    });
  }
};

// Record payment on invoice
exports.recordPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const { amount, method, referenceNumber, checkNumber, transactionId, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required'
      });
    }

    if (amount > invoice.balanceDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ($${amount}) exceeds balance due ($${invoice.balanceDue})`
      });
    }

    const paymentData = {
      amount,
      method,
      referenceNumber,
      checkNumber,
      transactionId,
      notes,
      recordedBy: req.userId
    };

    await invoice.recordPayment(paymentData);

    // Create corresponding transaction record
    await Transaction.create({
      type: 'income',
      category: invoice.type === 'hunting_lease' ? 'hunting_lease' : 'custom_work',
      description: `Payment for ${invoice.invoiceNumber} - ${invoice.to.name}`,
      amount: amount,
      date: new Date(),
      paymentMethod: method === 'ach' ? 'bank_transfer' : method,
      checkNumber: checkNumber,
      invoiceNumber: invoice.invoiceNumber,
      farm: invoice.farm,
      status: 'completed',
      createdBy: req.userId
    });

    res.json({
      success: true,
      data: invoice,
      message: `Payment of $${amount.toLocaleString()} recorded successfully`
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
};

// Send invoice (mark as sent)
exports.sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    invoice.status = 'sent';
    invoice.emailSent = true;
    invoice.emailSentDate = new Date();
    await invoice.save();

    res.json({
      success: true,
      data: invoice,
      message: `Invoice ${invoice.invoiceNumber} marked as sent`
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice',
      error: error.message
    });
  }
};

// Cancel invoice
exports.cancelInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a fully paid invoice. Use refund instead.'
      });
    }

    invoice.status = 'cancelled';
    await invoice.save();

    res.json({
      success: true,
      data: invoice,
      message: `Invoice ${invoice.invoiceNumber} cancelled`
    });
  } catch (error) {
    console.error('Cancel invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel invoice',
      error: error.message
    });
  }
};

// Get aging report
exports.getAgingReport = async (req, res) => {
  try {
    const { customer, type } = req.query;
    const filters = {};
    if (customer) filters.customer = customer;
    if (type) filters.type = type;

    const aging = await Invoice.getAgingReport(filters);

    res.json({
      success: true,
      data: aging
    });
  } catch (error) {
    console.error('Aging report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate aging report',
      error: error.message
    });
  }
};

// Get revenue summary
exports.getRevenueSummary = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const summary = await Invoice.getRevenueSummary(year);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Revenue summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate revenue summary',
      error: error.message
    });
  }
};

// Get invoice dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalOutstanding,
      overdueInvoices,
      monthlyInvoiced,
      yearlyInvoiced,
      recentInvoices,
      agingReport
    ] = await Promise.all([
      Invoice.aggregate([
        { $match: { status: { $in: ['sent', 'viewed', 'partial', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$balanceDue' }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { status: 'overdue' } },
        { $group: { _id: null, total: { $sum: '$balanceDue' }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { issueDate: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' }, collected: { $sum: '$amountPaid' }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { issueDate: { $gte: startOfYear }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' }, collected: { $sum: '$amountPaid' }, count: { $sum: 1 } } }
      ]),
      Invoice.find({ status: { $ne: 'cancelled' } })
        .sort({ issueDate: -1 })
        .limit(10)
        .select('invoiceNumber type to.name total balanceDue status issueDate dueDate'),
      Invoice.getAgingReport()
    ]);

    res.json({
      success: true,
      data: {
        outstanding: {
          total: totalOutstanding[0]?.total || 0,
          count: totalOutstanding[0]?.count || 0
        },
        overdue: {
          total: overdueInvoices[0]?.total || 0,
          count: overdueInvoices[0]?.count || 0
        },
        monthly: {
          invoiced: monthlyInvoiced[0]?.total || 0,
          collected: monthlyInvoiced[0]?.collected || 0,
          count: monthlyInvoiced[0]?.count || 0
        },
        yearly: {
          invoiced: yearlyInvoiced[0]?.total || 0,
          collected: yearlyInvoiced[0]?.collected || 0,
          count: yearlyInvoiced[0]?.count || 0
        },
        recentInvoices,
        aging: agingReport
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard stats',
      error: error.message
    });
  }
};

module.exports = exports;
