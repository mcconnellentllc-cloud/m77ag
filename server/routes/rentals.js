const express = require('express');
const router = express.Router();
const RentalProperty = require('../models/rentalProperty');
const Tenant = require('../models/tenant');
const Lease = require('../models/lease');
const RentPayment = require('../models/rentPayment');
const PropertyMessage = require('../models/propertyMessage');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'm77ag-rental-secret-key';

// Middleware to verify tenant token
const verifyTenant = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const tenant = await Tenant.findById(decoded.id);
    if (!tenant) {
      return res.status(401).json({ success: false, message: 'Tenant not found' });
    }
    req.tenant = tenant;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ============================================
// PUBLIC ROUTES
// ============================================

// Get available rental properties (public listing)
router.get('/properties', async (req, res) => {
  try {
    const properties = await RentalProperty.find({
      status: 'available',
      isActive: true
    }).select('-disclosures.uninhabitableReportingEmail -notes');

    res.json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single property details (public)
router.get('/properties/:id', async (req, res) => {
  try {
    const property = await RentalProperty.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    res.json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// TENANT AUTHENTICATION
// ============================================

// Tenant registration
router.post('/tenant/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({ email: email.toLowerCase() });
    if (existingTenant) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const tenant = new Tenant({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone,
      status: 'pending'
    });

    await tenant.save();

    const token = jwt.sign({ id: tenant._id, type: 'tenant' }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Account created successfully',
      token,
      tenant: {
        id: tenant._id,
        email: tenant.email,
        firstName: tenant.firstName,
        lastName: tenant.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tenant login
router.post('/tenant/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const tenant = await Tenant.findOne({ email: email.toLowerCase() });
    if (!tenant) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await tenant.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    tenant.lastLogin = new Date();
    await tenant.save();

    const token = jwt.sign({ id: tenant._id, type: 'tenant' }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      tenant: {
        id: tenant._id,
        email: tenant.email,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        currentProperty: tenant.currentProperty,
        currentLease: tenant.currentLease
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// TENANT PORTAL ROUTES (Protected)
// ============================================

// Get tenant dashboard data
router.get('/tenant/dashboard', verifyTenant, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenant._id)
      .populate('currentProperty')
      .populate('currentLease');

    // Get recent payments
    const payments = await RentPayment.find({ tenant: tenant._id })
      .sort({ createdAt: -1 })
      .limit(12);

    // Get unread messages count
    const unreadMessages = await PropertyMessage.countDocuments({
      tenant: tenant._id,
      direction: 'landlord_to_tenant',
      isRead: false
    });

    // Get active repair requests
    const activeRepairs = await PropertyMessage.find({
      tenant: tenant._id,
      messageType: 'repair_request',
      'repairDetails.status': { $in: ['reported', 'acknowledged', 'scheduled', 'in_progress'] }
    });

    res.json({
      success: true,
      tenant,
      payments,
      unreadMessages,
      activeRepairs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get tenant's lease
router.get('/tenant/lease', verifyTenant, async (req, res) => {
  try {
    const lease = await Lease.findById(req.tenant.currentLease)
      .populate('property');

    if (!lease) {
      return res.status(404).json({ success: false, message: 'No active lease found' });
    }

    res.json({ success: true, lease });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get payment history
router.get('/tenant/payments', verifyTenant, async (req, res) => {
  try {
    const payments = await RentPayment.find({ tenant: req.tenant._id })
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalPaid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({ success: true, payments, totalPaid });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit rent payment
router.post('/tenant/payments', verifyTenant, async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, paypalOrderId, rentPeriod } = req.body;

    const lease = await Lease.findById(req.tenant.currentLease);
    if (!lease) {
      return res.status(400).json({ success: false, message: 'No active lease' });
    }

    const payment = new RentPayment({
      lease: lease._id,
      tenant: req.tenant._id,
      property: lease.property,
      paymentType: 'rent',
      amount,
      rentPeriod,
      paymentMethod,
      transactionId,
      paypalOrderId,
      status: 'completed',
      paidDate: new Date()
    });

    await payment.save();

    // TODO: Send confirmation email

    res.json({ success: true, payment, message: 'Payment recorded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get messages/communication
router.get('/tenant/messages', verifyTenant, async (req, res) => {
  try {
    const messages = await PropertyMessage.find({ tenant: req.tenant._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send message to landlord
router.post('/tenant/messages', verifyTenant, async (req, res) => {
  try {
    const { subject, message, messageType, repairDetails, parentMessage } = req.body;

    const newMessage = new PropertyMessage({
      property: req.tenant.currentProperty,
      lease: req.tenant.currentLease,
      tenant: req.tenant._id,
      messageType: messageType || 'general',
      direction: 'tenant_to_landlord',
      subject,
      message,
      repairDetails
    });

    if (parentMessage) {
      const parent = await PropertyMessage.findById(parentMessage);
      if (parent) {
        newMessage.parentMessage = parentMessage;
        newMessage.threadId = parent.threadId;
      }
    }

    await newMessage.save();

    // TODO: Send email notification to landlord

    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit repair request
router.post('/tenant/repair-request', verifyTenant, async (req, res) => {
  try {
    const { category, urgency, location, description, preferredAccessTimes } = req.body;

    const repairRequest = new PropertyMessage({
      property: req.tenant.currentProperty,
      lease: req.tenant.currentLease,
      tenant: req.tenant._id,
      messageType: 'repair_request',
      direction: 'tenant_to_landlord',
      subject: `Repair Request: ${category} - ${urgency}`,
      message: description,
      repairDetails: {
        category,
        urgency,
        location,
        description,
        preferredAccessTimes,
        status: 'reported'
      }
    });

    await repairRequest.save();

    // TODO: Send email notification for urgent/emergency repairs

    res.json({ success: true, repairRequest, message: 'Repair request submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark message as read
router.put('/tenant/messages/:id/read', verifyTenant, async (req, res) => {
  try {
    const message = await PropertyMessage.findOneAndUpdate(
      { _id: req.params.id, tenant: req.tenant._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get tenant documents
router.get('/tenant/documents', verifyTenant, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenant._id);
    const lease = await Lease.findById(req.tenant.currentLease);

    // Combine tenant documents with lease document
    const documents = [...(tenant.documents || [])];

    if (lease && lease.leaseDocumentUrl) {
      documents.unshift({
        name: 'Lease Agreement',
        type: 'lease',
        url: lease.leaseDocumentUrl,
        uploadedAt: lease.leaseDocumentGeneratedAt
      });
    }

    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update tenant profile
router.put('/tenant/profile', verifyTenant, async (req, res) => {
  try {
    const allowedUpdates = ['phone', 'emergencyContact', 'communicationPreferences', 'autopayEnabled', 'autopayDay'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const tenant = await Tenant.findByIdAndUpdate(
      req.tenant._id,
      updates,
      { new: true }
    );

    res.json({ success: true, tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Get all properties (admin)
router.get('/admin/properties', async (req, res) => {
  try {
    const properties = await RentalProperty.find()
      .populate('currentTenant', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create property (admin)
router.post('/admin/properties', async (req, res) => {
  try {
    const property = new RentalProperty(req.body);
    await property.save();
    res.json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update property (admin)
router.put('/admin/properties/:id', async (req, res) => {
  try {
    const property = await RentalProperty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all tenants (admin)
router.get('/admin/tenants', async (req, res) => {
  try {
    const tenants = await Tenant.find()
      .populate('currentProperty', 'name address')
      .select('-password -ssn')
      .sort({ createdAt: -1 });

    res.json({ success: true, tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all leases (admin)
router.get('/admin/leases', async (req, res) => {
  try {
    const leases = await Lease.find()
      .populate('property', 'name address')
      .populate('tenant', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, leases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create lease (admin)
router.post('/admin/leases', async (req, res) => {
  try {
    const lease = new Lease(req.body);
    await lease.save();

    // Update tenant with current lease
    if (req.body.tenant) {
      await Tenant.findByIdAndUpdate(req.body.tenant, {
        currentLease: lease._id,
        currentProperty: req.body.property,
        status: 'active'
      });
    }

    // Update property status
    await RentalProperty.findByIdAndUpdate(req.body.property, {
      status: 'rented',
      currentTenant: req.body.tenant,
      currentLease: lease._id
    });

    res.json({ success: true, lease });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all payments (admin)
router.get('/admin/payments', async (req, res) => {
  try {
    const { propertyId, tenantId, status, startDate, endDate } = req.query;

    const query = {};
    if (propertyId) query.property = propertyId;
    if (tenantId) query.tenant = tenantId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await RentPayment.find(query)
      .populate('property', 'name address')
      .populate('tenant', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalReceived = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPending = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({ success: true, payments, totalReceived, totalPending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Record manual payment (admin)
router.post('/admin/payments', async (req, res) => {
  try {
    const payment = new RentPayment(req.body);
    await payment.save();
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all messages (admin)
router.get('/admin/messages', async (req, res) => {
  try {
    const { propertyId, type } = req.query;

    const query = {};
    if (propertyId) query.property = propertyId;
    if (type) query.messageType = type;

    const messages = await PropertyMessage.find(query)
      .populate('property', 'name')
      .populate('tenant', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send message to tenant (admin)
router.post('/admin/messages', async (req, res) => {
  try {
    const { propertyId, tenantId, leaseId, subject, message, messageType, isImportant } = req.body;

    const newMessage = new PropertyMessage({
      property: propertyId,
      lease: leaseId,
      tenant: tenantId,
      messageType: messageType || 'general',
      direction: 'landlord_to_tenant',
      subject,
      message,
      isImportant
    });

    await newMessage.save();

    // TODO: Send email to tenant

    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update repair request status (admin)
router.put('/admin/repairs/:id', async (req, res) => {
  try {
    const { status, scheduledDate, vendorName, vendorPhone, cost, paidBy, adminNotes } = req.body;

    const message = await PropertyMessage.findByIdAndUpdate(
      req.params.id,
      {
        'repairDetails.status': status,
        'repairDetails.scheduledDate': scheduledDate,
        'repairDetails.vendorName': vendorName,
        'repairDetails.vendorPhone': vendorPhone,
        'repairDetails.cost': cost,
        'repairDetails.paidBy': paidBy,
        'repairDetails.completedDate': status === 'completed' ? new Date() : undefined
      },
      { new: true }
    );

    // Send update to tenant
    if (status !== message.repairDetails?.status) {
      const updateMessage = new PropertyMessage({
        property: message.property,
        lease: message.lease,
        tenant: message.tenant,
        messageType: 'repair_update',
        direction: 'landlord_to_tenant',
        subject: `Repair Request Update: ${status}`,
        message: `Your repair request has been updated to: ${status}${scheduledDate ? `. Scheduled for: ${new Date(scheduledDate).toLocaleDateString()}` : ''}`,
        parentMessage: message._id,
        threadId: message.threadId
      });
      await updateMessage.save();
    }

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get rental summary/report (admin)
router.get('/admin/summary', async (req, res) => {
  try {
    const properties = await RentalProperty.find({ isActive: true });
    const tenants = await Tenant.find({ status: 'active' });
    const activeLeases = await Lease.find({ status: 'active' });

    // Get payments for current year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const payments = await RentPayment.find({
      status: 'completed',
      createdAt: { $gte: startOfYear }
    });

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    // Get overdue payments
    const today = new Date();
    const overduePayments = await RentPayment.find({
      status: 'pending',
      dueDate: { $lt: today }
    }).populate('tenant', 'firstName lastName');

    // Get pending repair requests
    const pendingRepairs = await PropertyMessage.find({
      messageType: 'repair_request',
      'repairDetails.status': { $in: ['reported', 'acknowledged', 'scheduled'] }
    });

    res.json({
      success: true,
      summary: {
        totalProperties: properties.length,
        occupiedProperties: properties.filter(p => p.status === 'rented').length,
        vacantProperties: properties.filter(p => p.status === 'available').length,
        totalTenants: tenants.length,
        activeLeases: activeLeases.length,
        totalCollectedYTD: totalCollected,
        overduePayments: overduePayments.length,
        overdueAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
        pendingRepairs: pendingRepairs.length
      },
      overduePayments,
      pendingRepairs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export communication history for court (admin)
router.get('/admin/export/communication/:leaseId', async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.leaseId)
      .populate('property')
      .populate('tenant');

    const messages = await PropertyMessage.find({ lease: req.params.leaseId })
      .sort({ createdAt: 1 });

    const payments = await RentPayment.find({ lease: req.params.leaseId })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      exportData: {
        generatedAt: new Date(),
        lease,
        communicationHistory: messages,
        paymentHistory: payments,
        summary: {
          totalMessages: messages.length,
          totalPayments: payments.length,
          totalPaid: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
          latePayments: payments.filter(p => p.isLate).length,
          repairRequests: messages.filter(m => m.messageType === 'repair_request').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// RENTAL PROPERTY CHATBOT
// ============================================

// Chat endpoint for rental property questions
router.post('/chat', async (req, res) => {
  try {
    const { message, history, propertyKnowledge } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Try to use Anthropic API if available
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (ANTHROPIC_API_KEY) {
      try {
        const systemPrompt = `You are a helpful property assistant for M77 AG Rentals. You're answering questions about a 3-bedroom rental property in rural Phillips County, Colorado.

PROPERTY DETAILS:
- Address: 168 Hwy 59, Sedgwick, CO 80749
- Location: About half a mile north of Sedgwick County line
- Bedrooms: 3
- Bathrooms: 1.5
- Features: Central heat & AC, refrigerator, stove, washer/dryer hookups, off-street parking, large yard, enclosed porch
- All utilities included (electricity, gas, water, sewer, trash)
- Pet friendly

PRICING (utilities included):
- Month-to-month: $1,400/month
- 6-month lease: $1,300/month (save $600/year)
- 12-month lease: $1,250/month (save $1,800/year)
- Security deposit: 1 month rent, refundable per Colorado law

SCHOOLS:
- Families can choose between Haxtun or Ovid-Sedgwick (Revere) school districts
- Both are excellent small-town schools with great community involvement and small class sizes

COUNTRY LIVING:
- This is authentic country living - wide open spaces, peaceful nights, friendly neighbors
- Tenants need a mower for summer and snowblower for winter - that's part of rural life
- Not in town, so reliable transportation needed
- The landlord values good relationships - if tenants treat the property well, they'll do the same

CONTACT:
- Kyle at 970-571-1015
- Email: rentals@m77ag.com

Keep responses friendly, conversational, and concise. Focus on being helpful and informative.`;

        const anthropicMessages = (history || []).slice(-10).map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }));

        anthropicMessages.push({ role: 'user', content: message });

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: systemPrompt,
            messages: anthropicMessages
          })
        });

        const data = await response.json();

        if (data.content && data.content[0]) {
          return res.json({
            success: true,
            response: data.content[0].text
          });
        }
      } catch (apiError) {
        console.error('Anthropic API error:', apiError.message);
        // Fall through to local response
      }
    }

    // Fallback: Generate local response based on keywords
    const localResponse = generateLocalChatResponse(message, propertyKnowledge);
    res.json({ success: true, response: localResponse });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Local response generator
function generateLocalChatResponse(message, knowledge) {
  const msg = message.toLowerCase();

  // Schools
  if (msg.includes('school') || msg.includes('education') || msg.includes('kids')) {
    return "Families can choose between Haxtun or Ovid-Sedgwick (Revere) school systems - both are excellent small-town schools with great teachers and strong community involvement. Class sizes are small so kids get individual attention.";
  }

  // Utilities
  if (msg.includes('utilit') || msg.includes('electric') || msg.includes('gas') || msg.includes('water') || msg.includes('bill')) {
    return "All utilities are included in the rent - electricity, gas, water, sewer, and trash. You won't have any extra utility bills!";
  }

  // Pets
  if (msg.includes('pet') || msg.includes('dog') || msg.includes('cat') || msg.includes('animal')) {
    return "Yes, we are pet-friendly! We just ask that you let us know about your pets during the application so we can note it on the lease.";
  }

  // Country living
  if (msg.includes('country') || msg.includes('rural') || msg.includes('neighbor') || msg.includes('mow') || msg.includes('snow')) {
    return "This is authentic country living. You'll want a mower for the yard in summer and a snowblower for the driveway in winter - that's just part of life out here. The trade-off is peace and quiet, beautiful sunsets, and knowing your neighbors. We work really well with tenants who treat us and our property well.";
  }

  // Location
  if (msg.includes('where') || msg.includes('location') || msg.includes('address') || msg.includes('sedgwick')) {
    return "The property is located at 168 Hwy 59, Sedgwick, CO 80749 - about half a mile north of the Sedgwick County line. It's true country living - wide open spaces, peaceful nights, and friendly neighbors.";
  }

  // Price
  if (msg.includes('price') || msg.includes('cost') || msg.includes('rent') || msg.includes('month')) {
    return "We have flexible lease options: $1,400/month for month-to-month, $1,300/month for a 6-month lease (save $600/year), or $1,250/month for a 12-month lease (save $1,800/year). All utilities are included!";
  }

  // Deposit
  if (msg.includes('deposit') || msg.includes('security')) {
    return "Security deposit equals one month's rent, refundable per Colorado law within 30 days of move-out minus any damages beyond normal wear.";
  }

  // Bedrooms
  if (msg.includes('bedroom') || msg.includes('bathroom') || msg.includes('room') || msg.includes('size')) {
    return "This home has 3 bedrooms and 1.5 bathrooms. It includes an enclosed porch, good-sized yard, and all the essentials - fridge, stove, and washer/dryer hookups.";
  }

  // Application
  if (msg.includes('apply') || msg.includes('application') || msg.includes('process') || msg.includes('move in')) {
    return "Fill out the application on this page and submit your first month's rent plus security deposit. We review applications within 24-48 hours, run a background check, and get back to you quickly. We can typically get you moved in within a week or two of approval!";
  }

  // Contact
  if (msg.includes('contact') || msg.includes('call') || msg.includes('phone') || msg.includes('email')) {
    return "You can reach Kyle at 970-571-1015 or email rentals@m77ag.com. We're happy to answer any questions or schedule a showing!";
  }

  // Features
  if (msg.includes('feature') || msg.includes('ameniti') || msg.includes('include') || msg.includes('have')) {
    return "The property includes: Central heat & AC, refrigerator, stove, washer/dryer hookups, off-street parking, large yard, and an enclosed porch. Plus all utilities are paid!";
  }

  // Available
  if (msg.includes('available') || msg.includes('when') || msg.includes('ready')) {
    return "The property is available now! You can select your desired move-in date on the application form. We can typically get you moved in within a week or two of approval.";
  }

  // Default
  return "This is a 3-bedroom, 1.5-bath country home about half a mile north of the Sedgwick County line. All utilities are included, pets are welcome, and you can choose between Haxtun or Ovid schools. Is there something specific you'd like to know about the property, location, or application process?";
}

module.exports = router;
