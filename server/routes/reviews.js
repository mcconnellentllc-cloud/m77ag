const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const upload = require('../middleware/upload');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
// Submit a review (with optional photo uploads - max 5)
router.post('/submit', upload.array('photos', 5), reviewController.submitReview);

// Get approved reviews (for public display)
router.get('/approved', reviewController.getApprovedReviews);

// Admin routes (require authentication)
// Get all reviews
router.get('/all', authenticate, isAdmin, reviewController.getAllReviews);

// Update review status (approve/reject)
router.put('/:id/status', authenticate, isAdmin, reviewController.updateReviewStatus);

// Delete review
router.delete('/:id', authenticate, isAdmin, reviewController.deleteReview);

module.exports = router;
