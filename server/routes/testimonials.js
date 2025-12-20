const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const { authenticate, isAdmin, isCustomer } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/approved', testimonialController.getApprovedTestimonials);

// Customer routes (require authentication)
router.post('/', authenticate, isCustomer, upload.array('photos', 5), testimonialController.createTestimonial);
router.get('/my-testimonials', authenticate, isCustomer, testimonialController.getMyTestimonials);
router.delete('/:id', authenticate, testimonialController.deleteTestimonial);

// Admin routes
router.get('/all', authenticate, isAdmin, testimonialController.getAllTestimonials);
router.put('/:id/approve', authenticate, isAdmin, testimonialController.approveTestimonial);
router.put('/:id/reject', authenticate, isAdmin, testimonialController.rejectTestimonial);
router.put('/:id/toggle-featured', authenticate, isAdmin, testimonialController.toggleFeatured);

module.exports = router;
