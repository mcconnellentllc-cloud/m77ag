const express = require('express');
const router = express.Router();
const EquipmentOffer = require('../models/equipmentOffer');

// Submit a new offer (public)
router.post('/offers', async (req, res) => {
  try {
    const {
      equipmentId,
      equipmentTitle,
      buyerName,
      buyerEmail,
      buyerPhone,
      listPrice,
      offerAmount,
      utmSource
    } = req.body;

    // Validate required fields
    if (!equipmentId || !buyerName || !buyerEmail || !offerAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: equipmentId, buyerName, buyerEmail, offerAmount'
      });
    }

    const offer = new EquipmentOffer({
      equipmentId,
      equipmentTitle: equipmentTitle || equipmentId,
      buyerName,
      buyerEmail,
      buyerPhone,
      listPrice: listPrice || 0,
      offerAmount,
      utmSource,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      negotiationHistory: [{
        type: 'user',
        message: `Initial offer: $${offerAmount.toLocaleString()}`,
        amount: offerAmount
      }]
    });

    await offer.save();

    res.json({
      success: true,
      offerId: offer._id,
      message: 'Offer submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting offer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit offer'
    });
  }
});

// Add negotiation message to offer
router.post('/offers/:offerId/negotiate', async (req, res) => {
  try {
    const { type, message, amount } = req.body;
    const offer = await EquipmentOffer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    offer.negotiationHistory.push({
      type,
      message,
      amount
    });

    // Update offer amount if this is a new user offer
    if (type === 'user' && amount) {
      offer.offerAmount = amount;
    }

    await offer.save();

    res.json({ success: true, offer });
  } catch (error) {
    console.error('Error updating negotiation:', error);
    res.status(500).json({ success: false, error: 'Failed to update negotiation' });
  }
});

// Accept an offer (updates status to accepted)
router.post('/offers/:offerId/accept', async (req, res) => {
  try {
    const { finalPrice } = req.body;
    const offer = await EquipmentOffer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    offer.status = 'accepted';
    offer.finalPrice = finalPrice || offer.offerAmount;
    offer.acceptedAt = new Date();

    offer.negotiationHistory.push({
      type: 'bot',
      message: `Offer accepted at $${offer.finalPrice.toLocaleString()}`,
      amount: offer.finalPrice
    });

    await offer.save();

    res.json({ success: true, offer });
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ success: false, error: 'Failed to accept offer' });
  }
});

// Get all offers (admin)
router.get('/offers', async (req, res) => {
  try {
    const { status, equipmentId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (equipmentId) filter.equipmentId = equipmentId;

    const offers = await EquipmentOffer.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch offers' });
  }
});

// Get single offer
router.get('/offers/:offerId', async (req, res) => {
  try {
    const offer = await EquipmentOffer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    res.json({ success: true, offer });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch offer' });
  }
});

// Update offer status (admin)
router.patch('/offers/:offerId', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const offer = await EquipmentOffer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    if (status) offer.status = status;

    if (notes) {
      offer.negotiationHistory.push({
        type: 'bot',
        message: `Admin note: ${notes}`
      });
    }

    await offer.save();

    res.json({ success: true, offer });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ success: false, error: 'Failed to update offer' });
  }
});

// Delete offer (admin)
router.delete('/offers/:offerId', async (req, res) => {
  try {
    const result = await EquipmentOffer.findByIdAndDelete(req.params.offerId);

    if (!result) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    res.json({ success: true, message: 'Offer deleted' });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ success: false, error: 'Failed to delete offer' });
  }
});

// Get equipment stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalOffers,
      pendingOffers,
      acceptedOffers,
      totalValue
    ] = await Promise.all([
      EquipmentOffer.countDocuments(),
      EquipmentOffer.countDocuments({ status: 'pending' }),
      EquipmentOffer.countDocuments({ status: 'accepted' }),
      EquipmentOffer.aggregate([
        { $match: { status: 'accepted' } },
        { $group: { _id: null, total: { $sum: '$finalPrice' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalOffers,
        pendingOffers,
        acceptedOffers,
        totalSalesValue: totalValue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

module.exports = router;
