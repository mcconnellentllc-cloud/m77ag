// Palmer Amaranth Control Program for Corn (Following Wheat)
// Location: Northeastern Colorado
// Target: Palmer amaranth (pigweed) - High resistance risk

const palmerAmaranthCornProgram = {
  programName: 'Palmer Amaranth Control - Corn After Wheat',
  programType: 'custom',
  description: 'Complete 4-pass Palmer amaranth control program for corn following wheat in northeastern Colorado. Multiple modes of action to prevent resistance.',

  targetCrops: ['Corn'],
  previousCrop: 'Wheat',
  targetPests: ['Palmer amaranth', 'Kochia', 'Russian thistle', 'Pigweed'],
  season: '2025',
  location: 'Northeastern Colorado',

  // Critical Notes
  criticalNotes: [
    'Palmer amaranth is highly resistant to multiple herbicide modes of action',
    'Use of multiple effective modes of action is critical for resistance management',
    'Pre-emerge residuals are essential - do not skip',
    'Scout fields regularly and control escapes before they reach 3 inches',
    'Clean equipment between fields to prevent seed spread'
  ],

  // 4-Pass Spray Calendar
  sprayPasses: [
    {
      passNumber: 1,
      timing: 'Fall Burndown',
      applicationWindow: 'October 15 - November 15',
      targetDate: 'October 15+',
      description: 'Post-harvest burndown to eliminate fall-emerging Palmer amaranth and winter annuals',
      temperature: '40-80°F',
      soilConditions: 'Any',
      cropStage: 'Post wheat harvest',
      weedStage: '2-6 inches',

      products: [
        {
          productName: 'RT3',
          activeIngredient: 'Glyphosate',
          moa: 'Group 9',
          ratePerAcre: 32, // oz per acre (1 qt)
          unit: 'oz',
          packSize: 'Shuttle',
          estimatedPrice: 14.95, // per gallon
          purpose: 'Burndown all existing vegetation',
          mixingOrder: 1,
          notes: 'Use high rate for tough weeds, add AMS'
        },
        {
          productName: 'LV 6',
          activeIngredient: '2,4-D',
          moa: 'Group 4',
          ratePerAcre: 16, // oz per acre (1 pint)
          unit: 'oz',
          packSize: 'Shuttle',
          estimatedPrice: 28.57,
          purpose: 'Broadleaf control, tank mix partner',
          mixingOrder: 2,
          notes: 'Enhances control of tough broadleaves'
        }
      ],

      totalCostPerAcre: 2.07,
      waterVolume: '10-20 gallons per acre',
      nozzleType: 'Standard flat fan',
      pressure: '30-40 PSI',
      carrier: 'Water + AMS at 8.5-17 lbs/100 gal'
    },

    {
      passNumber: 2,
      timing: 'Pre-Plant Burndown',
      applicationWindow: 'April 1 - April 20',
      targetDate: 'April 1 (approx)',
      description: 'Spring burndown before planting to control winter annuals and early-emerging Palmer amaranth',
      temperature: '45-80°F',
      soilConditions: 'Dry enough to support equipment',
      cropStage: 'Pre-plant (2-3 weeks before planting)',
      weedStage: '2-4 inches actively growing',

      products: [
        {
          productName: 'RT3',
          activeIngredient: 'Glyphosate',
          moa: 'Group 9',
          ratePerAcre: 32, // oz per acre
          unit: 'oz',
          packSize: 'Shuttle',
          estimatedPrice: 14.95,
          purpose: 'Burndown existing vegetation',
          mixingOrder: 1,
          notes: 'Apply to actively growing weeds'
        },
        {
          productName: 'LV 6',
          activeIngredient: '2,4-D',
          moa: 'Group 4',
          ratePerAcre: 16, // oz per acre
          unit: 'oz',
          packSize: 'Shuttle',
          estimatedPrice: 28.57,
          purpose: 'Broadleaf control',
          mixingOrder: 2,
          notes: '14-30 day plant-back for corn'
        }
      ],

      totalCostPerAcre: 2.07,
      waterVolume: '10-20 gallons per acre',
      nozzleType: 'Standard flat fan',
      pressure: '30-40 PSI',
      carrier: 'Water + AMS'
    },

    {
      passNumber: 3,
      timing: 'Pre-Emerge',
      applicationWindow: 'At planting or within 3 days',
      targetDate: 'May 15 (approx)',
      description: 'Critical residual application for Palmer amaranth prevention. Multiple modes of action for resistance management.',
      temperature: '50-85°F',
      soilConditions: 'At planting or shortly after, needs rainfall/irrigation within 7-10 days',
      cropStage: 'Planting to emergence',
      weedStage: 'Pre-emergence',

      products: [
        {
          productName: 'Aatex',
          activeIngredient: 'Atrazine',
          moa: 'Group 5',
          ratePerAcre: 48, // oz per acre (1.5 qt)
          unit: 'oz',
          packSize: 'Shuttle',
          estimatedPrice: 13.35,
          purpose: 'Residual control - Primary partner',
          mixingOrder: 1,
          notes: 'Key for Palmer control, provides 4-6 weeks residual'
        },
        {
          productName: 'Valor SX',
          activeIngredient: 'Flumioxazin',
          moa: 'Group 14',
          ratePerAcre: 3, // oz per acre
          unit: 'oz',
          packSize: '4x5',
          estimatedPrice: 14.25,
          purpose: 'Residual control - Critical for Palmer',
          mixingOrder: 2,
          notes: 'Excellent Palmer control, needs moisture, 2-3 week residual'
        },
        {
          productName: 'Sulfentrazone',
          activeIngredient: 'Sulfentrazone',
          moa: 'Group 14',
          ratePerAcre: 6, // oz per acre
          unit: 'oz',
          packSize: '2x2.5',
          estimatedPrice: 70.50,
          purpose: 'Extended residual control',
          mixingOrder: 3,
          notes: 'Alternative to Valor for longer residual'
        }
      ],

      totalCostPerAcre: 8.57,
      waterVolume: '15-20 gallons per acre',
      nozzleType: 'Medium to coarse droplets',
      pressure: '30-40 PSI',
      carrier: 'Water',
      criticalNotes: 'This is the most important application. Rainfall/irrigation within 7-10 days is critical for activation. Consider using Valor SX OR Sulfentrazone (not both) depending on soil type and budget.'
    },

    {
      passNumber: 4,
      timing: 'Post-Emerge',
      applicationWindow: 'Corn V3-V6 (8-18 inches)',
      targetDate: 'June 3 (approx)',
      description: 'Post-emerge application to control any escapes and extend residual control',
      temperature: '50-85°F (avoid high temps >85°F with dicamba)',
      soilConditions: 'Adequate soil moisture',
      cropStage: 'V3-V6 corn',
      weedStage: 'Palmer 1-3 inches (before 4 inches)',

      products: [
        {
          productName: 'RT3',
          activeIngredient: 'Glyphosate',
          moa: 'Group 9',
          ratePerAcre: 22, // oz per acre (glyphosate-tolerant corn)
          unit: 'oz',
          packSize: 'Shuttle',
          estimatedPrice: 14.95,
          purpose: 'Post control of escapes',
          mixingOrder: 1,
          notes: 'Only in Roundup Ready corn, lower rate acceptable with small weeds'
        },
        {
          productName: 'Dicamba DMA',
          activeIngredient: 'Dicamba',
          moa: 'Group 4',
          ratePerAcre: 16, // oz per acre (0.5 lb ae)
          unit: 'oz',
          packSize: 'Shuttle',
          estimatedPrice: 28.25,
          purpose: 'Broadleaf control',
          mixingOrder: 2,
          notes: 'Only in Xtend/dicamba-tolerant corn. Follow all label restrictions.'
        },
        {
          productName: 'Aatex',
          activeIngredient: 'Atrazine',
          moa: 'Group 5',
          ratePerAcre: 32, // oz per acre (1 qt)
          unit: 'oz',
          packSize: 'Shuttle',
          estimatedPrice: 13.35,
          purpose: 'Extended residual',
          mixingOrder: 3,
          notes: 'Extends control window, watch total atrazine use per year'
        }
      ],

      totalCostPerAcre: 4.84,
      waterVolume: '15-20 gallons per acre',
      nozzleType: 'TTI or AIXR (drift reduction)',
      pressure: '30-40 PSI',
      carrier: 'Water + AMS + crop oil or MSO',
      criticalNotes: 'Scout fields regularly. Apply when Palmer is small (<3 inches). If Palmer is larger than 4 inches, control will be difficult. Use drift-reduction nozzles with dicamba.'
    }
  ],

  // Program Summary
  totalPasses: 4,

  // Two program options
  programOptions: [
    {
      optionName: 'Standard Program (with Valor SX)',
      description: 'Most economical program using Valor SX for pre-emerge',
      passes: [1, 2, 3, 4],
      preEmergeOption: 'Valor SX',
      totalCostPerAcre: 17.55, // 2.07 + 2.07 + 8.57 (with Valor) + 4.84
      estimatedControl: '85-90%',
      notes: 'Good control, economical, requires timely rainfall'
    },
    {
      optionName: 'Premium Program (with Sulfentrazone)',
      description: 'Extended residual program using Sulfentrazone',
      passes: [1, 2, 3, 4],
      preEmergeOption: 'Sulfentrazone',
      totalCostPerAcre: 20.89, // Using Sulfentrazone instead
      estimatedControl: '90-95%',
      notes: 'Longer residual, better for heavier soils, more expensive'
    }
  ],

  // Resistance Management
  resistanceManagement: {
    modesOfAction: ['Group 4 (2,4-D, Dicamba)', 'Group 5 (Atrazine)', 'Group 9 (Glyphosate)', 'Group 14 (Valor, Sulfentrazone)'],
    strategy: 'Multiple effective modes of action across all applications',
    scoutingSchedule: 'Weekly after emergence until canopy closure',
    actionThreshold: 'Control Palmer when less than 3 inches tall',
    cleanEquipment: 'Clean equipment between fields to prevent seed spread'
  },

  // Chemical sales are at DIRECT COST - no volume discounts
  // Volume discounts only apply to custom farming services
  volumeDiscounts: [],

  // Drop-off points
  availableDropOffPoints: [
    { locationName: 'M77 AG', deliveryFee: 0 },
    { locationName: 'Mollohan Farms', deliveryFee: 0 }
  ],

  paymentTerms: 'Payment due 10 days prior to each delivery window',
  minimumAcres: 100,
  active: true
};

module.exports = palmerAmaranthCornProgram;
