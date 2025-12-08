const Testimonial = require('../models/testimonial');
const Booking = require('../models/booking');
const User = require('../models/user');
const path = require('path');
const fs = require('fs');

const testimonialController = {
  // Create a new testimonial
  createTestimonial: async (req, res) => {
    try {
      const { property, rating, title, text, huntType, huntDate, bookingId } = req.body;

      // Validate required fields
      if (!property || !rating || !title || !text) {
        return res.status(400).json({
          success: false,
          message: 'Property, rating, title, and text are required'
        });
      }

      // Process uploaded photos
      const photos = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          photos.push({
            filename: file.filename,
            originalName: file.originalname,
            path: `/uploads/testimonials/${file.filename}`
          });
        });
      }

      // Create testimonial
      const testimonial = new Testimonial({
        user: req.user.id,
        booking: bookingId || null,
        property,
        rating: parseInt(rating),
        title,
        text,
        huntType,
        huntDate: huntDate ? new Date(huntDate) : null,
        photos,
        status: 'pending'
      });

      await testimonial.save();

      res.status(201).json({
        success: true,
        message: 'Thank you for your testimonial! It will be reviewed and published soon.',
        testimonial
      });
    } catch (error) {
      console.error('Create testimonial error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit testimonial'
      });
    }
  },

  // Get user's own testimonials
  getMyTestimonials: async (req, res) => {
    try {
      const testimonials = await Testimonial.find({ user: req.user.id })
        .populate('booking', 'checkinDate checkoutDate parcel')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        testimonials
      });
    } catch (error) {
      console.error('Get my testimonials error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get testimonials'
      });
    }
  },

  // Get approved testimonials for a property (public)
  getApprovedTestimonials: async (req, res) => {
    try {
      const { property } = req.query;

      const query = {
        status: 'approved',
        isPublic: true
      };

      if (property && property !== 'all') {
        query.property = property;
      }

      const testimonials = await Testimonial.find(query)
        .populate('user', 'name')
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(50);

      res.json({
        success: true,
        testimonials
      });
    } catch (error) {
      console.error('Get approved testimonials error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get testimonials'
      });
    }
  },

  // Get all testimonials (admin only)
  getAllTestimonials: async (req, res) => {
    try {
      const { status } = req.query;

      const query = {};
      if (status) {
        query.status = status;
      }

      const testimonials = await Testimonial.find(query)
        .populate('user', 'name email phone')
        .populate('booking', 'checkinDate checkoutDate parcel')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        testimonials
      });
    } catch (error) {
      console.error('Get all testimonials error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get testimonials'
      });
    }
  },

  // Approve testimonial (admin only)
  approveTestimonial: async (req, res) => {
    try {
      const { id } = req.params;
      const { isFeatured } = req.body;

      const testimonial = await Testimonial.findById(id);

      if (!testimonial) {
        return res.status(404).json({
          success: false,
          message: 'Testimonial not found'
        });
      }

      testimonial.status = 'approved';
      testimonial.approvedBy = req.user.id;
      testimonial.approvedAt = new Date();
      
      if (isFeatured !== undefined) {
        testimonial.isFeatured = isFeatured;
      }

      await testimonial.save();

      res.json({
        success: true,
        message: 'Testimonial approved',
        testimonial
      });
    } catch (error) {
      console.error('Approve testimonial error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve testimonial'
      });
    }
  },

  // Reject testimonial (admin only)
  rejectTestimonial: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const testimonial = await Testimonial.findById(id);

      if (!testimonial) {
        return res.status(404).json({
          success: false,
          message: 'Testimonial not found'
        });
      }

      testimonial.status = 'rejected';
      testimonial.rejectionReason = reason;

      await testimonial.save();

      res.json({
        success: true,
        message: 'Testimonial rejected',
        testimonial
      });
    } catch (error) {
      console.error('Reject testimonial error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject testimonial'
      });
    }
  },

  // Delete testimonial
  deleteTestimonial: async (req, res) => {
    try {
      const { id } = req.params;

      const testimonial = await Testimonial.findById(id);

      if (!testimonial) {
        return res.status(404).json({
          success: false,
          message: 'Testimonial not found'
        });
      }

      // Check if user owns this testimonial or is admin
      if (testimonial.user.toString() !== req.user.id.toString() && req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this testimonial'
        });
      }

      // Delete associated photos
      if (testimonial.photos && testimonial.photos.length > 0) {
        testimonial.photos.forEach(photo => {
          const filePath = path.join(__dirname, '../../public', photo.path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      await Testimonial.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Testimonial deleted'
      });
    } catch (error) {
      console.error('Delete testimonial error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete testimonial'
      });
    }
  },

  // Toggle featured status (admin only)
  toggleFeatured: async (req, res) => {
    try {
      const { id } = req.params;

      const testimonial = await Testimonial.findById(id);

      if (!testimonial) {
        return res.status(404).json({
          success: false,
          message: 'Testimonial not found'
        });
      }

      testimonial.isFeatured = !testimonial.isFeatured;
      await testimonial.save();

      res.json({
        success: true,
        message: `Testimonial ${testimonial.isFeatured ? 'featured' : 'unfeatured'}`,
        testimonial
      });
    } catch (error) {
      console.error('Toggle featured error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update testimonial'
      });
    }
  }
};

module.exports = testimonialController;
