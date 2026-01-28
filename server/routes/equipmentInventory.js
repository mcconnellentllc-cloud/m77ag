const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Equipment = require('../models/equipment');

// Configure multer for equipment image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/equipment');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `equipment-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit (HEIC can be larger)
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|heic|heif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    // HEIC files may have mimetype image/heic or image/heif
    const isImage = file.mimetype.startsWith('image/') ||
                   file.mimetype === 'application/octet-stream'; // iOS sometimes sends HEIC as octet-stream
    if (extname || isImage) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Get all equipment (admin - includes private)
router.get('/', async (req, res) => {
  try {
    const { forSale, category } = req.query;
    const filter = {};

    if (forSale !== undefined) {
      filter.forSale = forSale === 'true';
    }
    if (category) {
      filter.category = category;
    }

    const equipment = await Equipment.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: equipment.length,
      equipment
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
  }
});

// Get public equipment only (for sale)
router.get('/public', async (req, res) => {
  try {
    const equipment = await Equipment.find({
      forSale: true,
      saleStatus: { $in: ['available', 'pending'] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: equipment.length,
      equipment
    });
  } catch (error) {
    console.error('Error fetching public equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
  }
});

// Get equipment summary/stats
router.get('/summary', async (req, res) => {
  try {
    const allEquipment = await Equipment.find();

    // Calculate totals
    let totalValue = 0;
    let totalOwed = 0;
    let forSaleCount = 0;
    let forSaleValue = 0;
    let upcomingPayments = [];

    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    allEquipment.forEach(item => {
      totalValue += item.currentValue || 0;
      totalOwed += item.amountOwed || 0;

      if (item.forSale) {
        forSaleCount++;
        forSaleValue += item.askingPrice || item.currentValue || 0;
      }

      // Check for upcoming payments
      if (item.hasLoan && item.nextPaymentDate) {
        const paymentDate = new Date(item.nextPaymentDate);
        if (paymentDate <= thirtyDaysOut && paymentDate >= now) {
          upcomingPayments.push({
            equipmentId: item._id,
            title: item.title,
            paymentAmount: item.paymentAmount,
            dueDate: item.nextPaymentDate,
            lender: item.lender
          });
        }
      }
    });

    // Sort upcoming payments by date
    upcomingPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json({
      success: true,
      summary: {
        totalEquipment: allEquipment.length,
        totalValue,
        totalOwed,
        netWorth: totalValue - totalOwed,
        forSaleCount,
        forSaleValue,
        upcomingPayments
      }
    });
  } catch (error) {
    console.error('Error fetching equipment summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
});

// Get single equipment item
router.get('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment' });
  }
});

// Create new equipment
router.post('/', async (req, res) => {
  try {
    const equipment = new Equipment(req.body);
    await equipment.save();

    res.status(201).json({
      success: true,
      equipment
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to create equipment' });
  }
});

// Update equipment
router.put('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to update equipment' });
  }
});

// Toggle for-sale status
router.patch('/:id/toggle-sale', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    equipment.forSale = !equipment.forSale;
    equipment.saleStatus = equipment.forSale ? 'available' : 'not-for-sale';
    await equipment.save();

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error toggling sale status:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle sale status' });
  }
});

// Update financial info
router.patch('/:id/financial', async (req, res) => {
  try {
    const {
      currentValue,
      amountOwed,
      lender,
      paymentAmount,
      paymentFrequency,
      nextPaymentDate,
      hasLoan
    } = req.body;

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    if (currentValue !== undefined) equipment.currentValue = currentValue;
    if (amountOwed !== undefined) equipment.amountOwed = amountOwed;
    if (lender !== undefined) equipment.lender = lender;
    if (paymentAmount !== undefined) equipment.paymentAmount = paymentAmount;
    if (paymentFrequency !== undefined) equipment.paymentFrequency = paymentFrequency;
    if (nextPaymentDate !== undefined) equipment.nextPaymentDate = nextPaymentDate;
    if (hasLoan !== undefined) equipment.hasLoan = hasLoan;

    await equipment.save();

    res.json({ success: true, equipment });
  } catch (error) {
    console.error('Error updating financial info:', error);
    res.status(500).json({ success: false, error: 'Failed to update financial info' });
  }
});

// Delete equipment
router.delete('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    res.json({ success: true, message: 'Equipment deleted' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete equipment' });
  }
});

// Bulk import equipment (for initial setup)
router.post('/bulk-import', async (req, res) => {
  try {
    const { equipment: equipmentList } = req.body;

    if (!Array.isArray(equipmentList)) {
      return res.status(400).json({ success: false, error: 'Equipment must be an array' });
    }

    const created = await Equipment.insertMany(equipmentList);

    res.status(201).json({
      success: true,
      count: created.length,
      equipment: created
    });
  } catch (error) {
    console.error('Error bulk importing equipment:', error);
    res.status(500).json({ success: false, error: 'Failed to import equipment' });
  }
});

// Upload images for equipment
router.post('/:id/images', upload.array('images', 10), async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      // Delete uploaded files if equipment not found
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    // Get the URLs for uploaded images
    const imageUrls = req.files.map(file => `/uploads/equipment/${file.filename}`);

    // Add to existing images
    equipment.images = [...(equipment.images || []), ...imageUrls];
    await equipment.save();

    res.json({
      success: true,
      images: equipment.images,
      newImages: imageUrls
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ success: false, error: 'Failed to upload images' });
  }
});

// Delete an image from equipment
router.delete('/:id/images', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    // Remove from array
    equipment.images = (equipment.images || []).filter(img => img !== imageUrl);
    await equipment.save();

    // Delete file from disk if it's a local upload
    if (imageUrl.startsWith('/uploads/equipment/')) {
      const filePath = path.join(__dirname, '../../public', imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ success: true, images: equipment.images });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ success: false, error: 'Failed to delete image' });
  }
});

module.exports = router;
