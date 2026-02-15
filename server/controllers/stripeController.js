const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const EquipmentOffer = require('../models/equipmentOffer');
const { sendEquipmentPurchaseConfirmation } = require('../utils/emailservice');

// Create a PaymentIntent for ACH Direct Debit
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, offerId, customerEmail, customerName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: {
          source: 'm77ag',
          offerId: offerId || ''
        }
      });
    }

    // Create PaymentIntent with ACH Direct Debit
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['us_bank_account'],
      payment_method_options: {
        us_bank_account: {
          financial_connections: {
            permissions: ['payment_method', 'balances']
          },
          verification_method: 'automatic'
        }
      },
      metadata: {
        offerId: offerId || '',
        source: 'm77ag_equipment_purchase'
      }
    });

    // Update offer with payment intent ID if offerId provided
    if (offerId) {
      await EquipmentOffer.findByIdAndUpdate(offerId, {
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customer.id,
        paymentStatus: 'pending'
      });
    }

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
};

// Check payment status
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      paymentMethod: paymentIntent.payment_method_types[0]
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check payment status'
    });
  }
};

// Handle Stripe webhooks
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;

    case 'payment_intent.processing':
      await handlePaymentProcessing(event.data.object);
      break;

    case 'payment_intent.requires_action':
      console.log('Payment requires action:', event.data.object.id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

// Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  const offerId = paymentIntent.metadata?.offerId;
  if (!offerId) return;

  try {
    const offer = await EquipmentOffer.findById(offerId);
    if (!offer) return;

    offer.paymentStatus = 'succeeded';
    offer.paymentCompletedAt = new Date();
    offer.status = 'sold';

    offer.negotiationHistory.push({
      type: 'bot',
      message: `Payment received via ACH: $${(paymentIntent.amount / 100).toLocaleString()}`,
      amount: paymentIntent.amount / 100
    });

    await offer.save();

    // Send confirmation email
    try {
      await sendEquipmentPurchaseConfirmation({
        buyerName: offer.buyerName,
        buyerEmail: offer.buyerEmail,
        buyerPhone: offer.buyerPhone,
        equipmentTitle: offer.equipmentTitle,
        equipmentId: offer.equipmentId,
        listPrice: offer.listPrice,
        finalPrice: offer.finalPrice || paymentIntent.amount / 100,
        acceptedAt: new Date(),
        paymentMethod: 'ACH Bank Transfer',
        paymentStatus: 'Completed'
      });
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
    }

  } catch (error) {
    console.error('Error updating offer after payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  const offerId = paymentIntent.metadata?.offerId;
  if (!offerId) return;

  try {
    const offer = await EquipmentOffer.findById(offerId);
    if (!offer) return;

    offer.paymentStatus = 'failed';
    offer.paymentFailureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

    offer.negotiationHistory.push({
      type: 'bot',
      message: `Payment failed: ${offer.paymentFailureReason}`
    });

    await offer.save();

  } catch (error) {
    console.error('Error updating offer after payment failure:', error);
  }
}

// Handle payment processing
async function handlePaymentProcessing(paymentIntent) {
  console.log('Payment processing:', paymentIntent.id);

  const offerId = paymentIntent.metadata?.offerId;
  if (!offerId) return;

  try {
    const offer = await EquipmentOffer.findById(offerId);
    if (!offer) return;

    offer.paymentStatus = 'processing';

    offer.negotiationHistory.push({
      type: 'bot',
      message: 'ACH payment is being processed (typically 4 business days)'
    });

    await offer.save();

  } catch (error) {
    console.error('Error updating offer for processing:', error);
  }
}

// Get publishable key
exports.getPublishableKey = (req, res) => {
  res.json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
};
