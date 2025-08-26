const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const proposalController = require('../controllers/proposalController');

// Create new proposal
router.post('/', auth, proposalController.createProposal);

// Get all proposals (admin only)
router.get('/', auth, adminOnly, proposalController.getAllProposals);

// Get user proposals
router.get('/me', auth, proposalController.getUserProposals);

// Get proposal by ID
router.get('/:id', auth, proposalController.getProposalById);

// Update proposal status (admin only)
router.patch('/:id/status', auth, adminOnly, proposalController.updateProposalStatus);

// Delete proposal (admin only)
router.delete('/:id', auth, adminOnly, proposalController.deleteProposal);

module.exports = router;