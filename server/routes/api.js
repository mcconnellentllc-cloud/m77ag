const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Proposal = require('../models/proposal');

/**
 * @route   GET /api/proposals
 * @desc    Get all proposals (admin only)
 * @access  Private/Admin
 */
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    // Get all proposals, sorted by newest first
    const proposals = await Proposal.find().sort({ createdAt: -1 });
    res.json(proposals);
  } catch (err) {
    console.error('Get proposals error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/proposals/user
 * @desc    Get proposals for logged in user
 * @access  Private
 */
router.get('/user', auth, async (req, res) => {
  try {
    // Get proposals for this user
    const proposals = await Proposal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(proposals);
  } catch (err) {
    console.error('Get user proposals error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/proposals/:id
 * @desc    Get proposal by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    
    // Check if proposal exists
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    // Check if user owns this proposal or is admin
    if (proposal.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(proposal);
  } catch (err) {
    console.error('Get proposal error:', err.message);
    
    // Check for invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/proposals
 * @desc    Create a new proposal
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      services,
      acres,
      notes,
      totalCost
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !services || !acres || !totalCost) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Create new proposal
    const newProposal = new Proposal({
      userId: req.user.id,
      name,
      email,
      phone: phone || '',
      address: address || '',
      services,
      acres,
      notes: notes || '',
      totalCost,
      status: 'pending'
    });
    
    const proposal = await newProposal.save();
    res.status(201).json(proposal);
  } catch (err) {
    console.error('Create proposal error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/proposals/:id
 * @desc    Update a proposal
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    
    // Check if proposal exists
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    // Check if user owns this proposal or is admin
    if (proposal.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update fields
    const {
      name,
      email,
      phone,
      address,
      services,
      acres,
      notes,
      totalCost,
      status
    } = req.body;
    
    // Only update fields that were sent
    if (name) proposal.name = name;
    if (email) proposal.email = email;
    if (phone !== undefined) proposal.phone = phone;
    if (address !== undefined) proposal.address = address;
    if (services) proposal.services = services;
    if (acres) proposal.acres = acres;
    if (notes !== undefined) proposal.notes = notes;
    if (totalCost) proposal.totalCost = totalCost;
    
    // Only admins can update status
    if (status && req.user.isAdmin) {
      proposal.status = status;
    }
    
    // Save updated proposal
    const updatedProposal = await proposal.save();
    res.json(updatedProposal);
  } catch (err) {
    console.error('Update proposal error:', err.message);
    
    // Check for invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/proposals/:id
 * @desc    Delete a proposal
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    
    // Check if proposal exists
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    // Check if user owns this proposal or is admin
    if (proposal.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete proposal
    await proposal.deleteOne();
    res.json({ message: 'Proposal removed' });
  }
  catch (err) {
    console.error('Delete proposal error:', err.message);
    
    // Check for invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/proposals/analytics
 * @desc    Get proposal analytics (admin only)
 * @access  Private/Admin
 */
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    // Get counts by status
    const pending = await Proposal.countDocuments({ status: 'pending' });
    const approved = await Proposal.countDocuments({ status: 'approved' });
    const rejected = await Proposal.countDocuments({ status: 'rejected' });
    const completed = await Proposal.countDocuments({ status: 'completed' });
    
    // Get total revenue from approved and completed proposals
    const revenueResult = await Proposal.aggregate([
      { $match: { status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    // Get total acres
    const acresResult = await Proposal.aggregate([
      { $group: { _id: null, total: { $sum: '$acres' } } }
    ]);
    
    const totalAcres = acresResult.length > 0 ? acresResult[0].total : 0;
    
    // Get recent proposals
    const recentProposals = await Proposal.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      counts: {
        pending,
        approved,
        rejected,
        completed,
        total: pending + approved + rejected + completed
      },
      totalRevenue,
      totalAcres,
      recentProposals
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;