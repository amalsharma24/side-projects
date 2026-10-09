// Card Data and Configuration for American Express® Gold Card

(function () {
const CARD_CONFIG = {
  cardName: "American Express® Gold Card",
  issuer: "American Express / Membership Rewards®",
  defaultAnnualFee: 325,
  pointValuationCents: 2.0, // Standard Amex MR valuation with transfer partners: 2.0¢ per point
  
  // Baseline benchmark comparison for spend
  baselineCashbackRate: 0.02,

  // Renewal Perks (Year 2+ recurring benefits)
  benefits: [
    {
      id: "dining_credit",
      category: "Dining Credits",
      title: "Annual $120 Dining Credit ($10/mo)",
      description: "Earn up to $10/month in statement credits at Grubhub, Five Guys, Goldbelly, Milk Bar, and select merchant partners.",
      faceValue: 120,
      defaultValue: 120,
      unit: "fixed",
      helpText: "Actual redeemed in 12-mo statements: $120.00",
      details: {
        canDisable: true
      }
    },
    {
      id: "uber_cash",
      category: "Dining & Rideshare Credits",
      title: "Annual $120 Uber Cash ($10/mo)",
      description: "Receive $10/month in Uber Cash for Uber Eats orders or Uber rides in the US when card is added to your Uber account.",
      faceValue: 120,
      defaultValue: 120,
      unit: "fixed",
      helpText: "Directly deposited into Uber App: $120.00 (Fully utilized)",
      details: {
        canDisable: true
      }
    },
    {
      id: "resy_credit",
      category: "Dining Credits",
      title: "Annual $100 Resy Credit ($50 semi-annually)",
      description: "Up to $50 in statement credits every 6 months at U.S. Resy restaurants or eligible Resy purchases.",
      faceValue: 100,
      defaultValue: 100,
      unit: "fixed",
      helpText: "Actual redeemed in 12-mo statements: $100.00 (Fully utilized)",
      details: {
        canDisable: true
      }
    },
    {
      id: "dunkin_credit",
      category: "Dining Credits",
      title: "Annual $84 Dunkin' Credit ($7/mo)",
      description: "Up to $7/month in statement credits on eligible Dunkin' purchases in the U.S.",
      faceValue: 84,
      defaultValue: 84,
      unit: "fixed",
      helpText: "Actual redeemed in 12-mo statements: $84.00 (Fully utilized)",
      details: {
        canDisable: true
      }
    }
  ],

  // Spend multipliers with wallet baseline comparisons
  spendCategories: [
    {
      id: "dining",
      name: "Restaurants & Dining Worldwide",
      multiplier: 4,
      defaultAnnualSpend: 2655,
      helpText: "4X MR points on restaurants worldwide & takeaway (Actual spend: $2,655.33)",
      baselineCard: "Baseline 2% Card",
      baselineRatePct: 2.0,
      baselineMultiplierText: "2% Cashback",
      baselineFormula: "2% flat cash back"
    },
    {
      id: "groceries",
      name: "U.S. Supermarkets / Groceries",
      multiplier: 4,
      defaultAnnualSpend: 219,
      helpText: "4X MR points at U.S. supermarkets (Actual spend: $219.03)",
      baselineCard: "Baseline 2% Card",
      baselineRatePct: 2.0,
      baselineMultiplierText: "2% Cashback",
      baselineFormula: "2% flat cash back"
    },
    {
      id: "flights",
      name: "Flights Booked Directly or Amex Travel",
      multiplier: 3,
      defaultAnnualSpend: 0,
      helpText: "3X MR points on flights (Actual spend: $0.00)",
      baselineCard: "Baseline 2% Card",
      baselineRatePct: 2.0,
      baselineMultiplierText: "2% Cashback",
      baselineFormula: "2% flat cash back"
    },
    {
      id: "all_other",
      name: "All Other Everyday Purchases",
      multiplier: 1,
      defaultAnnualSpend: 3267,
      helpText: "1X MR points on non-category spend (Actual spend: $3,266.87)",
      baselineCard: "Baseline 2% Card",
      baselineRatePct: 2.0,
      baselineMultiplierText: "2% Cashback",
      baselineFormula: "2% flat cash back"
    }
  ],

  // Year 1 Welcome Offer Data
  yearOneWelcomeOffer: {
    bonusPoints: 60000,
    requiredSpend: 6000,
    daysToSpend: 180,
    estimatedValue: 1200
  },

  // Presets for quick evaluation
  presets: {
    actual_1yr: {
      name: "Actual 1-Year Usage (Statements + Uber)",
      description: "Exact parsed numbers from 13 statements plus 100% Uber Cash utilization.",
      annualFee: 325,
      benefits: {
        dining_credit: 120,
        uber_cash: 120,
        resy_credit: 100,
        dunkin_credit: 84
      },
      annualSpend: {
        dining: 2655,
        groceries: 219,
        flights: 0,
        all_other: 3267
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.CARDS_DATA = window.CARDS_DATA || {};
  window.CARDS_DATA['amex-gold'] = CARD_CONFIG;
  if (!window.CARD_CONFIG) {
    window.CARD_CONFIG = CARD_CONFIG;
  }
}
})();
