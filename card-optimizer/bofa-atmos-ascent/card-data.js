// Card Data and Configuration for Atmos™ Rewards Ascent Card (Bank of America / Alaska & Hawaiian Airlines)

(function () {
const CARD_CONFIG = {
  cardName: "Atmos™ Rewards Ascent Card",
  issuer: "Bank of America / Alaska Airlines & Hawaiian Airlines",
  defaultAnnualFee: 95, // Official annual fee
  pointValuationCents: 1.4, // Standard conservative Alaska/Atmos valuation: 1.4¢ per point
  hasBofaBonus: true,
  
  // Benchmark comparison for spend
  baselineCashbackRate: 0.02,

  // Renewal Perks (Year 2+ recurring benefits)
  benefits: [
    {
      id: "checked_bags",
      category: "Travel Credits & Awards",
      title: "Free Checked Bags (Cardholder + Up to 6 Guests)",
      description: "First checked bag free for you and up to 6 companions on the same reservation on Alaska and Hawaiian flights when paying with card.",
      faceValue: 490, // Up to $490 per roundtrip for 7 people
      defaultValue: 270, // 6 flights @ $45/bag = $270
      unit: "usage_based",
      helpText: "Set to $270 (6 flights per year @ ~$45/bag). The primary anchor benefit of the $95 card.",
      usageConfig: {
        defaultTrips: 6,
        costPerBag: 45
      }
    },
    {
      id: "companion_fare_spend",
      category: "Travel Credits & Awards",
      title: "Annual $99 Companion Fare (Requires $6,000 Annual Spend)",
      description: "Buy one roundtrip coach ticket and get a companion ticket from $99 plus taxes and fees (from $23). Unlocked after spending $6,000+ in prior anniversary year.",
      faceValue: 300,
      defaultValue: 0, // $0 if spend is routed elsewhere
      unit: "threshold",
      helpText: "Worth $200–$350+ if you route $6,000 spend to this card and use it for a companion flight.",
      details: {
        thresholdSpend: 6000,
        canDisable: true
      }
    },
    {
      id: "inflight_discount",
      category: "In-Flight Perks",
      title: "20% In-Flight Purchases Rebate",
      description: "Get 20% back as a statement credit on inflight food, beverages, and Wi-Fi on Alaska and Hawaiian flights.",
      faceValue: 30,
      defaultValue: 0,
      unit: "fixed",
      helpText: "Set to $0 by default (disabled). Approx. $10–$25 savings per year on inflight refreshments if used.",
      details: {
        canDisable: true,
        enabledByDefault: false
      }
    },
    {
      id: "preferred_boarding",
      category: "Travel Convenience",
      title: "Preferred Boarding (Cardholder + Up to 6 Guests)",
      description: "Early boarding group ensures overhead bin space access on Alaska and Hawaiian flights.",
      faceValue: 40,
      defaultValue: 0,
      unit: "fixed",
      helpText: "Set to $0 (convenience perk with minimal direct cash equivalent).",
      details: {
        canDisable: true
      }
    },
    {
      id: "no_foreign_fees",
      category: "Fee Waivers",
      title: "No Foreign Transaction Fees",
      description: "Save 3% foreign transaction fees on all purchases outside the United States.",
      faceValue: 150,
      defaultValue: 0,
      unit: "fixed",
      helpText: "Valued at $0 if you already carry Venture X or other 0% FTF cards.",
      details: {
        canDisable: true
      }
    }
  ],

  // Spend multipliers with wallet baseline comparisons
  spendCategories: [
    {
      id: "alaska_hawaiian",
      name: "Alaska & Hawaiian Airlines Purchases",
      multiplier: 3,
      defaultAnnualSpend: 996, // Statement 12-mo interpolated
      helpText: "Direct flights, upgrades, seat selections (Required to unlock bag perks)",
      baselineCard: "Amex Platinum",
      baselineRatePct: 10.0,
      baselineMultiplierText: "5X (10.0%)",
      baselineFormula: "5X MR points valued at 2.0¢/pt"
    },
    {
      id: "gas_transit",
      name: "Gas, EV Charging Station, Local Transit, Cable & Select Streaming",
      multiplier: 2,
      defaultAnnualSpend: 0,
      helpText: "2X on gas, EV charging, local transit, cable & streaming. Same as Chase Sapphire Preferred (already held) — $0 spend",
      baselineCard: "Chase Sapphire Preferred",
      baselineRatePct: 4.0,
      baselineMultiplierText: "2X–3X (4.0%)",
      baselineFormula: "2X travel/transit, 3X streaming on Chase Sapphire Preferred (2.0¢/pt)"
    },
    {
      id: "all_other",
      name: "All Other Purchases",
      multiplier: 1,
      defaultAnnualSpend: 0,
      helpText: "Everyday retail, foreign transactions, groceries, utilities (put on Venture X 2X)",
      baselineCard: "Venture X",
      baselineRatePct: 4.0,
      baselineMultiplierText: "2X (4.0%)",
      baselineFormula: "2X Capital One miles valued at 2.0¢/pt"
    }
  ],

  // Year 1 Welcome Offer Data
  yearOneWelcomeOffer: {
    bonusPoints: 60000,
    companionAwardPoints: 0, // $99 companion fare code
    requiredSpend: 3000,
    daysToSpend: 90,
    estimatedValue: 840 // 60,000 * 1.4¢ = $840
  },

  // Presets
  presets: {
    personalized_default: {
      name: "Personalized Default",
      description: "Only put Alaska flights ($996) on card to trigger free bags ($270). No other spend. Low $95 fee easily beat by bags.",
      annualFee: 95,
      bofaBonus: false,
      benefits: {
        checked_bags: 270, // 6 flights @ $45
        companion_fare_spend: 0,
        inflight_discount: 0,
        preferred_boarding: 0,
        no_foreign_fees: 0
      },
      annualSpend: {
        alaska_hawaiian: 996,
        gas_transit: 0,
        all_other: 0
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.CARDS_DATA = window.CARDS_DATA || {};
  window.CARDS_DATA['bofa-atmos-ascent'] = CARD_CONFIG;
  if (!window.CARD_CONFIG) {
    window.CARD_CONFIG = CARD_CONFIG;
  }
}
})();


