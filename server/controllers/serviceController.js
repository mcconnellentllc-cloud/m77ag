const ServiceRequest = require('../models/service');
const { sendServiceContract } = require('../utils/emailservice');

// Service pricing structure
const SERVICE_PRICES = {
  planting: 35,
  disking: 25,
  ripping: 30,
  'deep-ripping': 40,
  'harvesting-corn': 45,
  'harvesting-wheat': 40,
  'harvesting-milo': 42,
  drilling: 28,
  'field-cultivation': 22
};

// Volume discount structure
const DISCOUNT_TIERS = [
  { minAcres: 300, discount: 0.14 },
  { minAcres: 200, discount: 0.10 },
  { minAcres: 100, discount: 0.07 }
];

// Calculate price and discount
const calculatePrice = (serviceType, acres) => {
  const pricePerAcre = SERVICE_PRICES[serviceType] || 0;
  const basePrice = pricePerAcre * acres;

  // Find applicable discount
  let discount = 0;
  for (const tier of DISCOUNT_TIERS) {
    if (acres >= tier.minAcres) {
      discount = tier.discount;
      break;
    }
  }

  const discountAmount = basePrice * discount;
  const totalPrice = basePrice - discountAmount;

  return {
    basePrice,
    discountPercentage: discount * 100,
    discountAmount,
    totalPrice
  };
};

// Create a new service request
exports.createServiceRequest = async (req, res) => {
  try {
    const { name, phone, email, serviceType, acres, notes } = req.body;

    // Validate required fields
    if (!name || !phone || !serviceType || !acres) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate pricing for custom farming services
    let pricing = { basePrice: 0, discountPercentage: 0, discountAmount: 0, totalPrice: 0 };
    if (SERVICE_PRICES[serviceType]) {
      pricing = calculatePrice(serviceType, acres);
    }

    // Create service request
    const serviceRequest = new ServiceRequest({
      name,
      phone,
      email,
      serviceType,
      acres,
      notes,
      ...pricing
    });

    await serviceRequest.save();

    // Send service contract email to customer and office
    try {
      await sendServiceContract({
        name,
        phone,
        email,
        serviceType,
        acres,
        notes,
        ...pricing
      });
    } catch (emailError) {
      console.error('Error sending service contract email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Service contract sent successfully',
      data: serviceRequest
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service request',
      error: error.message
    });
  }
};

// Get all service requests (admin)
exports.getAllServiceRequests = async (req, res) => {
  try {
    const { status, serviceType, startDate, endDate } = req.query;

    // Build query filter
    const filter = {};
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const serviceRequests = await ServiceRequest.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: serviceRequests.length,
      data: serviceRequests
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service requests',
      error: error.message
    });
  }
};

// Get a single service request by ID
exports.getServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    res.json({
      success: true,
      data: serviceRequest
    });
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service request',
      error: error.message
    });
  }
};

// Update service request status (admin)
exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    if (status) serviceRequest.status = status;
    if (adminNotes) serviceRequest.adminNotes = adminNotes;

    await serviceRequest.save();

    res.json({
      success: true,
      message: 'Service request updated successfully',
      data: serviceRequest
    });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service request',
      error: error.message
    });
  }
};

// Create chemical program quote
exports.createChemicalProgramQuote = async (req, res) => {
  try {
    const { name, phone, email, acres, programType, products, deliveryDate } = req.body;

    // Validate required fields
    if (!name || !phone || !acres || !programType || !products) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate total gallons and costs for each product
    let totalGallons = 0;
    let totalCost = 0;

    const processedProducts = products.map(product => {
      const totalProductGallons = product.ratePerAcre * acres;
      const numberOfContainers = Math.ceil(totalProductGallons / product.containerSize);
      const roundedGallons = numberOfContainers * product.containerSize;
      const productTotal = roundedGallons * product.pricePerGallon;

      totalGallons += roundedGallons;
      totalCost += productTotal;

      return {
        name: product.name,
        ratePerAcre: product.ratePerAcre,
        totalGallons: roundedGallons,
        containerSize: product.containerSize,
        numberOfContainers: numberOfContainers,
        pricePerGallon: product.pricePerGallon,
        totalPrice: productTotal
      };
    });

    // Calculate payment due date (10 days before delivery)
    const paymentDueDate = deliveryDate
      ? new Date(new Date(deliveryDate).getTime() - (10 * 24 * 60 * 60 * 1000))
      : null;

    // Create service request with chemical program details
    const serviceRequest = new ServiceRequest({
      name,
      phone,
      email,
      serviceType: programType,
      acres,
      chemicalProgram: {
        programName: programType,
        products: processedProducts,
        totalGallons: totalGallons,
        totalCost: totalCost,
        deliveryDate: deliveryDate,
        paymentDueDate: paymentDueDate,
        invoiceSent: false,
        invoicePaid: false
      }
    });

    await serviceRequest.save();

    res.status(201).json({
      success: true,
      message: 'Chemical program quote created successfully',
      data: serviceRequest
    });
  } catch (error) {
    console.error('Error creating chemical program quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chemical program quote',
      error: error.message
    });
  }
};

// Delete service request (admin)
exports.deleteServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findByIdAndDelete(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    res.json({
      success: true,
      message: 'Service request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service request',
      error: error.message
    });
  }
};
