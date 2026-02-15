/**
 * Image Upload Routes
 * Handles image uploads to Cloudinary for equipment and other assets
 */

const express = require('express');
const router = express.Router();
const { uploadEquipment, uploadGeneral, deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');
const Equipment = require('../models/equipment');

// Upload single equipment image
router.post('/equipment/:id', uploadEquipment.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    // Add the new image URL to the equipment's images array
    const imageUrl = req.file.path;
    equipment.images = equipment.images || [];
    equipment.images.push(imageUrl);
    await equipment.save();

    res.json({
      success: true,
      imageUrl,
      message: 'Image uploaded successfully',
      totalImages: equipment.images.length
    });
  } catch (error) {
    console.error('Error uploading equipment image:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

// Upload multiple equipment images
router.post('/equipment/:id/multiple', uploadEquipment.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No image files provided' });
    }

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    // Add all new image URLs
    const imageUrls = req.files.map(file => file.path);
    equipment.images = equipment.images || [];
    equipment.images.push(...imageUrls);
    await equipment.save();

    res.json({
      success: true,
      imageUrls,
      message: `${imageUrls.length} images uploaded successfully`,
      totalImages: equipment.images.length
    });
  } catch (error) {
    console.error('Error uploading equipment images:', error);
    res.status(500).json({ success: false, error: 'Failed to upload images' });
  }
});

// Upload image for new equipment (returns URL to include in create request)
router.post('/equipment/temp', uploadEquipment.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    res.json({
      success: true,
      imageUrl: req.file.path,
      message: 'Image uploaded - include this URL when creating equipment'
    });
  } catch (error) {
    console.error('Error uploading temp image:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

// Delete equipment image
router.delete('/equipment/:id/image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'No image URL provided' });
    }

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    // Remove from equipment's images array
    equipment.images = equipment.images.filter(img => img !== imageUrl);
    await equipment.save();

    // Delete from Cloudinary
    const publicId = getPublicIdFromUrl(imageUrl);
    if (publicId) {
      await deleteImage(publicId);
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
      remainingImages: equipment.images.length
    });
  } catch (error) {
    console.error('Error deleting equipment image:', error);
    res.status(500).json({ success: false, error: 'Failed to delete image' });
  }
});

// General image upload (for other purposes)
router.post('/general', uploadGeneral.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    res.json({
      success: true,
      imageUrl: req.file.path,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

module.exports = router;
