// Card Data and Configuration Template
// Copy this template to <card-folder>/card-data.js and customize for your card.

(function () {
const CARD_CONFIG = {
  cardName: "TEMPLATE_CARD_NAME",
  issuer: "Issuer / Bank Name",
  defaultAnnualFee: TEMPLATE_ANNUAL_FEE,
  pointValuationCents: 1.0, // Point or cash back valuation in cents (e.g. 1.0¢ or 1.4¢)
  
  // Baseline benchmark comparison for spend
  baselineCashbackRate: 0.02,

  // Renewal Perks (Year 2+ recurring benefits)
  benefits: [
    {
      id: "annual_travel_credit",
      category: "Travel Credits & Awards",
      title: "Annual Travel Statement Credit",
      description: "Direct statement credit toward eligible travel purchases.",
      faceValue: 100,
      defaultValue: 100,
      unit: "fixed", // "fixed", "usage_based", or "threshold"
      helpText: "Direct credit against travel spend.",
      details: {
        canDisable: true
      }
    }
  ],

  // Spend multipliers with wallet baseline comparisons
  spendCategories: [
    {
      id: "travel",
      name: "Travel Purchases",
      multiplier: 3,
      defaultAnnualSpend: 1000,
      helpText: "Airlines, hotels, car rentals",
      baselineCard: "Venture X",
      baselineRatePct: 4.0,
      baselineMultiplierText: "2X (4.0%)",
      baselineFormula: "2X miles valued at 2.0¢/pt"
    },
    {
      id: "all_other",
      name: "All Other Purchases",
      multiplier: 1,
      defaultAnnualSpend: 5000,
      helpText: "General spending",
      baselineCard: "Venture X",
      baselineRatePct: 4.0,
      baselineMultiplierText: "2X (4.0%)",
      baselineFormula: "2X miles valued at 2.0¢/pt"
    }
  ],

  // Year 1 Welcome Offer Data
  yearOneWelcomeOffer: {
    bonusPoints: 50000,
    requiredSpend: 3000,
    daysToSpend: 90,
    estimatedValue: 500
  },

  // Presets for quick evaluation
  presets: {
    my_actual: {
      name: "Realistic Usage",
      description: "Expected realistic spend and benefit utilization.",
      annualFee: TEMPLATE_ANNUAL_FEE,
      bofaBonus: false,
      benefits: {
        annual_travel_credit: 100
      },
      annualSpend: {
        travel: 1000,
        all_other: 5000
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.CARDS_DATA = window.CARDS_DATA || {};
  window.CARDS_DATA['TEMPLATE_SLUG'] = CARD_CONFIG;
  if (!window.CARD_CONFIG) {
    window.CARD_CONFIG = CARD_CONFIG;
  }
}
})();
