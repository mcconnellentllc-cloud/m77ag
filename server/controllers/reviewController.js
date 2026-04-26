const Review = require('../models/review');
const nodemailer = require('nodemailer');
const { getReviewThankYouEmail, getAdminReviewNotificationEmail } = require('../email-templates/review-thank-you-email');

// Create email transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'hunting@m77ag.com',
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send review thank you email with discount code (for positive reviews)
const sendReviewThankYouEmail = async (review) => {
  try {
    const transporter = createTransporter();

    // Generate HTML emails from templates
    const customerEmailHTML = getReviewThankYouEmail(review);
    const adminEmailHTML = getAdminReviewNotificationEmail(review);

    // Email to customer with REVIEW discount code
    await transporter.sendMail({
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'hunting@m77ag.com'}>`,
      replyTo: 'hunting@m77ag.com',
      to: review.email,
      subject: 'Thank You! Here\'s 75% Off Your Next Hunt 🎁',
      html: customerEmailHTML
    });

    // Email to admin/Kyle at hunting@m77ag.com
    await transporter.sendMail({
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'hunting@m77ag.com'}>`,
      replyTo: 'hunting@m77ag.com',
      to: 'hunting@m77ag.com',
      subject: `New Review: ${review.customerName} - ${review.rating} Stars`,
      html: adminEmailHTML
    });

    console.log('Review thank you emails sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending review thank you email:', error);
    throw error;
  }
};

// Send admin notification only (for negative reviews)
const sendAdminReviewNotification = async (review) => {
  try {
    const transporter = createTransporter();

    // Generate admin notification email
    const adminEmailHTML = getAdminReviewNotificationEmail(review);

    // Email to admin/Kyle at hunting@m77ag.com
    await transporter.sendMail({
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'hunting@m77ag.com'}>`,
      replyTo: 'hunting@m77ag.com',
      to: 'hunting@m77ag.com',
      subject: `⚠ New Review (Follow Up): ${review.customerName} - ${review.rating} Stars`,
      html: adminEmailHTML
    });

    console.log('Admin review notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending admin review notification:', error);
    throw error;
  }
};

// Submit a new review
exports.submitReview = async (req, res) => {
  try {
    const { customerName, email, property, rating, wouldRecommend, reviewText, huntDate } = req.body;

    // Validate required fields
    if (!customerName || !email || !property || !rating || wouldRecommend === undefined || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Process uploaded photos
    const photos = [];
    if (req.files && req.files.length > 0) {
      // Store relative paths for the photos
      req.files.forEach(file => {
        photos.push(`/uploads/testimonials/${file.filename}`);
      });
    }

    // Create review
    const review = new Review({
      customerName,
      email,
      property,
      rating: parseInt(rating),
      wouldRecommend: wouldRecommend === 'true' || wouldRecommend === true,
      reviewText,
      huntDate: huntDate || undefined,
      photos,
      status: 'pending'
    });

    await review.save();

    // Check if review is positive (rating >= 4 OR wouldRecommend === true)
    const isPositive = review.rating >= 4 || review.wouldRecommend === true;

    if (isPositive) {
      // Send thank you email with discount code
      try {
        await sendReviewThankYouEmail(review);
        review.discountCodeSent = true;
        await review.save();
      } catch (emailError) {
        console.error('Failed to send thank you email, but review was saved:', emailError);
        // Continue even if email fails - review is saved
      }
    } else {
      // Send admin notification only (no discount code for negative reviews)
      try {
        await sendAdminReviewNotification(review);
      } catch (emailError) {
        console.error('Failed to send admin notification, but review was saved:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Review submitted successfully',
      discountCodeSent: isPositive,
      review: {
        _id: review._id,
        customerName: review.customerName,
        rating: review.rating,
        wouldRecommend: review.wouldRecommend
      }
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

// Get all reviews (for admin)
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

// Get approved reviews (for public testimonials page)
exports.getApprovedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching approved reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

// Update review status (approve/reject)
exports.updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review status updated',
      review
    });

  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review status'
    });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
};
