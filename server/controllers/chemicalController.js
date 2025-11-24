const ChemicalProduct = require('../models/chemicalProduct');
const ChemicalProgram = require('../models/chemicalProgram');
const ServiceRequest = require('../models/service');

// Get all chemical products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, applicationTiming, supplier, active = true } = req.query;

    const filter = { active };
    if (category) filter.category = category;
    if (applicationTiming) filter.applicationTiming = applicationTiming;
    if (supplier) filter.supplier = supplier;

    const products = await ChemicalProduct.find(filter)
      .sort({ productName: 1, packSize: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching chemical products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chemical products',
      error: error.message
    });
  }
};

// Get all chemical programs
exports.getAllPrograms = async (req, res) => {
  try {
    const { programType, active = true } = req.query;

    const filter = { active };
    if (programType) filter.programType = programType;

    const programs = await ChemicalProgram.find(filter)
      .populate('products.productId')
      .sort({ programType: 1 });

    res.json({
      success: true,
      count: programs.length,
      data: programs
    });
  } catch (error) {
    console.error('Error fetching chemical programs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chemical programs',
      error: error.message
    });
  }
};

// Calculate chemical program cost
exports.calculateProgramCost = async (req, res) => {
  try {
    const { programId, acres, dropOffPoint } = req.body;

    if (!programId || !acres) {
      return res.status(400).json({
        success: false,
        message: 'Program ID and acres are required'
      });
    }

    const program = await ChemicalProgram.findById(programId)
      .populate('products.productId');

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    const costCalculation = program.calculateCost(acres);

    // Add drop-off point fee if applicable
    let deliveryFee = 0;
    if (dropOffPoint) {
      const location = program.availableDropOffPoints.find(
        loc => loc.locationName === dropOffPoint
      );
      if (location) {
        deliveryFee = location.deliveryFee || 0;
      }
    }

    res.json({
      success: true,
      data: {
        program: {
          name: program.programName,
          type: program.programType,
          description: program.description
        },
        acres: acres,
        dropOffPoint: dropOffPoint,
        deliveryFee: deliveryFee,
        ...costCalculation,
        grandTotal: costCalculation.finalTotal + deliveryFee
      }
    });
  } catch (error) {
    console.error('Error calculating program cost:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate program cost',
      error: error.message
    });
  }
};

// Create custom chemical quote
exports.createCustomQuote = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      acres,
      programType,
      selectedProducts,
      dropOffPoint,
      deliveryDate,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !phone || !acres || !selectedProducts || selectedProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate costs for each product
    let totalGallons = 0;
    let totalCost = 0;
    const processedProducts = [];

    for (const item of selectedProducts) {
      const product = await ChemicalProduct.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      const ratePerAcre = item.ratePerAcre || product.recommendedRateMin;
      const totalNeeded = ratePerAcre * acres;

      // Get container size
      const containerSize = item.containerSize ||
        (product.containerSizes.length > 0 ? product.containerSizes[0].size : 2.5);

      const containersNeeded = Math.ceil(totalNeeded / containerSize);
      const actualGallons = containersNeeded * containerSize;
      const productCost = actualGallons * product.currentPrice;

      totalGallons += actualGallons;
      totalCost += productCost;

      processedProducts.push({
        name: product.productName,
        ratePerAcre: ratePerAcre,
        totalGallons: actualGallons,
        containerSize: containerSize,
        numberOfContainers: containersNeeded,
        pricePerGallon: product.currentPrice,
        totalPrice: productCost
      });
    }

    // Calculate payment due date (10 days before delivery)
    const paymentDueDate = deliveryDate
      ? new Date(new Date(deliveryDate).getTime() - (10 * 24 * 60 * 60 * 1000))
      : null;

    // Create service request
    const serviceRequest = new ServiceRequest({
      name,
      phone,
      email,
      serviceType: programType || 'custom',
      acres,
      notes,
      chemicalProgram: {
        programName: programType || 'Custom Chemical Program',
        products: processedProducts,
        totalGallons: totalGallons,
        totalCost: totalCost,
        deliveryDate: deliveryDate,
        paymentDueDate: paymentDueDate,
        dropOffPoint: dropOffPoint,
        invoiceSent: false,
        invoicePaid: false
      }
    });

    await serviceRequest.save();

    res.status(201).json({
      success: true,
      message: 'Chemical quote created successfully',
      data: {
        quoteId: serviceRequest._id,
        totalGallons: totalGallons,
        totalCost: totalCost,
        pricePerAcre: (totalCost / acres).toFixed(2),
        products: processedProducts,
        paymentDueDate: paymentDueDate,
        dropOffPoint: dropOffPoint
      }
    });
  } catch (error) {
    console.error('Error creating custom quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create custom quote',
      error: error.message
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await ChemicalProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Update product price (admin)
exports.updateProductPrice = async (req, res) => {
  try {
    const { price, supplier } = req.body;

    const product = await ChemicalProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.addPriceHistory(price, supplier);

    res.json({
      success: true,
      message: 'Product price updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product price',
      error: error.message
    });
  }
};

// Get price comparison
exports.getPriceComparison = async (req, res) => {
  try {
    const products = await ChemicalProduct.find({ active: true })
      .sort({ productName: 1, currentPrice: 1 });

    // Group products by name and compare prices
    const comparison = {};

    products.forEach(product => {
      if (!comparison[product.productName]) {
        comparison[product.productName] = [];
      }

      comparison[product.productName].push({
        packSize: product.packSize,
        supplier: product.supplier,
        price: product.currentPrice,
        pricePerUnit: product.currentPrice,
        alternativeSuppliers: product.alternativeSuppliers
      });
    });

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error fetching price comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price comparison',
      error: error.message
    });
  }
};

module.exports = exports;
