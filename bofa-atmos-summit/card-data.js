// Card Data and Configuration for Atmos™ Rewards / Bank of America Alaska & Hawaiian Airlines Premium Card

(function () {
const CARD_CONFIG = {
  cardName: "Atmos™ Rewards Premium Card",
  issuer: "Bank of America / Alaska Airlines & Hawaiian Airlines",
  defaultAnnualFee: 395, // Verified from actual statement eStmt_2025-10-16.md
  pointValuationCents: 1.4, // Standard conservative Alaska/Atmos valuation: 1.4¢ per point
  hasBofaBonus: true,
  
  // Benchmark comparison for spend (e.g. standard 2% flat cash back card)
  baselineCashbackRate: 0.02,

  // Renewal Perks (Year 2+ recurring benefits)
  benefits: [
    {
      id: "companion_award_anniversary",
      category: "Travel Credits & Awards",
      title: "25,000-Point Global Companion Award (Annual Anniversary)",
      description: "Receive a 25,000-point companion award every account anniversary to discount or cover companion fares on Alaska, Hawaiian, and partners.",
      faceValue: 350,
      defaultValue: 0, // Defaulted to $0 per your actual usage (unable to use last year)
      unit: "fixed",
      helpText: "Worth up to $350+ if used on companion airfare, but worth $0 if unused or companion plans don't materialize.",
      details: {
        pointsAmount: 25000,
        canDisable: true
      }
    },
    {
      id: "lounge_passes",
      category: "Lounge & Comfort",
      title: "8 Alaska Lounge Passes (2 per Calendar Quarter)",
      description: "8 one-time lounge passes annually, issued as 2 per quarter. Valid at Alaska Lounges (SEA, PDX, SFO, LAX, ANC, JFK).",
      faceValue: 480, // 8 * $60 standard day pass
      defaultValue: 30, // 2 passes used @ $15
      unit: "usage_based",
      helpText: "Set to $30 (2 visits @ $15/visit). Subject to the strict 2-per-quarter expiration rule.",
      usageConfig: {
        totalAvailable: 8,
        defaultUsed: 2,
        unitValue: 15,
        sliderMin: 0,
        sliderMax: 8,
        step: 1
      }
    },
    {
      id: "status_boost",
      category: "Elite Status",
      title: "10,000 Atmos™ Status Points Boost",
      description: "Boost your Atmos™ Rewards membership status with 10,000 status qualifying points every account anniversary, enabling Silver status alongside flown miles.",
      faceValue: 300,
      defaultValue: 202.5, // $202.50 Silver status valuation
      unit: "fixed",
      helpText: "Valued at $202.50 ($203): Unlocks Silver status (20k tier). Breakdown: Preferred & exit row seating ($90 = 6 flights @ $15), Premium Class upgrades ($60 = 2 @ $30), 25% bonus points on ~15K flown miles ($52.50 = 3,750 pts @ 1.4¢), Free checked bags ($0 - already covered by card), Priority check-in/boarding ($0 - card perk), First Class upgrades ($0).",
      details: {
        pointsAmount: 10000,
        canDisable: true
      }
    },
    {
      id: "checked_bags",
      category: "Travel Credits & Awards",
      title: "Free Checked Bags (Cardholder + Up to 6 Guests)",
      description: "First checked bag free for you and up to 6 companions on the same reservation when paying flight with card.",
      faceValue: 490, // Up to $490 per roundtrip for 7 people
      defaultValue: 270, // 6 flights @ $45/bag = $270
      unit: "usage_based",
      helpText: "Set to $270 (6 flights per year @ ~$45/flight). Solid recurring value if you regularly check a bag.",
      usageConfig: {
        defaultTrips: 6,
        costPerBag: 45
      }
    },
    {
      id: "same_day_change",
      category: "Flexibility & Protection",
      title: "Waived Same-Day Confirmed Flight Changes",
      description: "Waived fees for same-day confirmed Alaska flight changes – savings of up to $75 per change.",
      faceValue: 150,
      defaultValue: 0, // Never used
      unit: "usage_based",
      helpText: "Set to $0 (never used).",
      usageConfig: {
        defaultChanges: 0,
        feePerChange: 75,
        sliderMax: 6
      }
    },
    {
      id: "preferred_boarding",
      category: "Lounge & Comfort",
      title: "Preferred Boarding (Cardholder + Up to 6 Guests)",
      description: "Priority boarding group ensures early overhead bin space access and smoother boarding experience.",
      faceValue: 50,
      defaultValue: 0, // Valued at $0
      unit: "fixed",
      helpText: "Set to $0 (minimal incremental monetary value).",
      details: {
        canDisable: true
      }
    },
    {
      id: "airport_security",
      category: "Travel Credits & Awards",
      title: "Airport Security Credit ($120 every 4 years)",
      description: "Up to $120 statement credit every 4 years for TSA PreCheck® or Global Entry application / renewal fees.",
      faceValue: 30, // $120 / 4
      defaultValue: 0, // Already covered or unused
      unit: "fixed",
      helpText: "Set to $0 (redundant with another card or unused).",
      details: {
        annualizedAmount: 30,
        canDisable: true
      }
    },
    {
      id: "instant_delay_credit",
      category: "Flexibility & Protection",
      title: "$50 Instant Travel Delay Credit (2hr+ Delays)",
      description: "Receive a $50 instant statement credit when a flight cancellation or departure delay exceeds 2 hours.",
      faceValue: 100,
      defaultValue: 50, // Used once in last year
      unit: "fixed",
      helpText: "Set to $50 (easy to use, received once in the past year).",
      details: {
        canDisable: true
      }
    },
    {
      id: "point_sharing_perk",
      category: "Flexibility & Protection",
      title: "Free Family/Group Point Sharing (Up to 10 Members)",
      description: "Pool and share accumulated points across up to 10 Atmos™ Rewards accounts with no transfer fees and no expiration.",
      faceValue: 50,
      defaultValue: 0, // Unused
      unit: "fixed",
      helpText: "Set to $0 (unused).",
      details: {
        canDisable: true
      }
    },
    {
      id: "spend_tier_60k_companion",
      category: "Spend Threshold Tier",
      title: "$60,000 Spend Perk: 100,000-Point Global Companion Award",
      description: "Spend $60,000+ on purchases in a year to earn a massive 100,000-point Global Companion Award.",
      faceValue: 1400, // 100,000 * 1.4¢
      defaultValue: 0, // Inactive by default unless user hits $60k spend
      unit: "threshold",
      helpText: "Only applies if you put $60k+ of annual purchases on this card. Yields a 100,000-point companion award (~$1,400 value).",
      details: {
        thresholdSpend: 60000,
        awardPoints: 100000,
        enabledByDefault: false
      }
    }
  ],

  // Spend multipliers with wallet baseline comparisons
  spendCategories: [
    {
      id: "dining",
      name: "Dining",
      multiplier: 3,
      defaultAnnualSpend: 0, // Zeroed going forward (put on Amex Gold 4X)
      helpText: "Restaurants, cafes, takeout, delivery",
      baselineCard: "Amex Gold",
      baselineMultiplier: 4,
      baselineRatePct: 7.0,
      baselineMultiplierText: "4X (7.0%)",
      baselineFormula: "4X MR points valued at 1.75¢/pt"
    },
    {
      id: "alaska_hawaiian",
      name: "Alaska & Hawaiian Airlines",
      multiplier: 3,
      defaultAnnualSpend: 996, // Statement 12-mo interpolated (Required to unlock bag perks)
      helpText: "Direct flights, seat upgrades, inflight purchases",
      baselineCard: "Amex Platinum",
      baselineMultiplier: 5,
      baselineRatePct: 8.75,
      baselineMultiplierText: "5X (8.75%)",
      baselineFormula: "5X MR points valued at 1.75¢/pt"
    },
    {
      id: "foreign_tx",
      name: "Foreign Transactions",
      multiplier: 3,
      defaultAnnualSpend: 12136, // Statement 12-mo interpolated
      helpText: "Purchases made in foreign currencies / abroad",
      baselineCard: "Venture X",
      baselineMultiplier: 2,
      baselineRatePct: 3.5,
      baselineMultiplierText: "2X (3.5%)",
      baselineFormula: "2X Capital One miles valued at 1.75¢/pt"
    },
    {
      id: "all_other",
      name: "Other",
      multiplier: 1,
      defaultAnnualSpend: 0, // Zeroed going forward (put on Venture X 2X)
      helpText: "Groceries, retail, utilities, subscriptions",
      baselineCard: "Venture X",
      baselineMultiplier: 2,
      baselineRatePct: 3.5,
      baselineMultiplierText: "2X (3.5%)",
      baselineFormula: "2X Capital One miles valued at 1.75¢/pt"
    }
  ],

  // Year 1 Welcome Offer Data
  yearOneWelcomeOffer: {
    bonusPoints: 80000,
    companionAwardPoints: 25000,
    requiredSpend: 4000,
    daysToSpend: 90,
    estimatedValue: 1470 // (80k + 25k) * 1.4¢ = $1,470
  },

  // Presets
  presets: {
    personalized_default: {
      name: "Personalized Default",
      description: "Going forward: $0 dining (Amex Gold) & $0 other (Venture X). Only Alaska flights ($996 to unlock bags) and Foreign spend ($12,136). Fee: $395.",
      annualFee: 395,
      bofaBonus: false,
      hasOtherPrecheck: true,
      hit60kSpend: false,
      benefits: {
        companion_award_anniversary: 0,
        lounge_passes: 30, // 2 visits @ $15
        status_boost: 202.5, // $202.50 Silver status valuation
        checked_bags: 270, // 6 flights @ $45
        same_day_change: 0,
        preferred_boarding: 0,
        airport_security: 0,
        instant_delay_credit: 50,
        point_sharing_perk: 0,
        spend_tier_60k_companion: 0
      },
      annualSpend: {
        dining: 0,
        alaska_hawaiian: 996,
        foreign_tx: 12136,
        all_other: 0
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.CARDS_DATA = window.CARDS_DATA || {};
  window.CARDS_DATA['bofa-atmos-summit'] = CARD_CONFIG;
  if (!window.CARD_CONFIG) {
    window.CARD_CONFIG = CARD_CONFIG;
  }
}
})();


