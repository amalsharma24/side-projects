// Card Data and Configuration for Citi Strata Elite℠ Card

(function () {
const CARD_CONFIG = {
  cardName: "Citi Strata Elite℠ Card",
  issuer: "Citi / ThankYou® Rewards",
  defaultAnnualFee: 595,
  pointValuationCents: 1.2, // User specified: 1.2¢ per point (1.2 cpp)
  hasBofaBonus: false,

  // Baseline benchmark comparison for spend
  baselineCashbackRate: 0.02,

  // Renewal Perks (Year 2+ recurring benefits)
  benefits: [
    {
      id: "hotel_benefit",
      category: "Travel Credits & Awards",
      title: "Up to $300 Annual Hotel Benefit (cititravel.com)",
      description: "Each calendar year, enjoy up to $300 off a hotel stay of 2 nights or more booked through cititravel.com.",
      faceValue: 300,
      defaultValue: 270, // User assumption: $270 value
      unit: "fixed",
      helpText: "Assumed $270 value: $300 face value with a slight haircut for portal requirement & 2-night stay minimum.",
      details: {
        canDisable: true
      }
    },
    {
      id: "splurge_credit",
      category: "Lifestyle Credits",
      title: "Up to $200 Annual Splurge Credit℠",
      description: "Every calendar year, earn up to $200 in statement credits on your choice of up to 2 brands: 1stDibs, American Airlines, Best Buy, Future Personal Training, Live Nation.",
      faceValue: 200,
      defaultValue: 200, // User assumption: $200 value
      unit: "fixed",
      helpText: "Assumed full $200 value: easily redeemed for American Airlines flights or Best Buy purchases.",
      details: {
        canDisable: true
      }
    },
    {
      id: "blacklane_credit",
      category: "Travel & Transit",
      title: "Up to $200 Annual Blacklane® Chauffeur Credit",
      description: "Up to $200 in statement credits annually for Blacklane premium chauffeur service (split as up to $100 Jan–Jun and up to $100 Jul–Dec).",
      faceValue: 200,
      defaultValue: 40, // User assumption: $40 value
      unit: "fixed",
      helpText: "Assumed $40 value: 2 rides/yr saving $20 each net (spending $40 out-of-pocket after $100 credit for a ride that would otherwise cost $60 with standard rideshare).",
      details: {
        canDisable: true
      }
    },
    {
      id: "admirals_club_passes",
      category: "Lounge & Comfort",
      title: "4 American Airlines Admirals Club® Lounge Passes",
      description: "Receive 4 Admirals Club Citi Strata Elite℠ Passes every calendar year for access to nearly 50 Admirals Club lounges worldwide.",
      faceValue: 300,
      defaultValue: 15, // User assumption: 1 visit used @ $15
      unit: "usage_based",
      helpText: "Assumed 1 visit used per year valued at $15 (out of 4 available passes).",
      usageConfig: {
        totalAvailable: 4,
        defaultUsed: 1,
        unitValue: 15,
        sliderMin: 0,
        sliderMax: 4,
        step: 1
      },
      details: {
        canDisable: true
      }
    },
    {
      id: "priority_pass",
      category: "Lounge & Comfort",
      title: "Priority Pass™ Select Membership (Cardholder + Up to 2 Guests)",
      description: "Complimentary access to 1,500+ airport lounges worldwide for primary cardholder, authorized users, and up to 2 guests.",
      faceValue: 469,
      defaultValue: 0, // User assumption: $0 value
      unit: "fixed",
      helpText: "Valued at $0: Redundant with existing lounge memberships held on other cards (e.g. Venture X / Amex Platinum).",
      details: {
        canDisable: true
      }
    },
    {
      id: "global_entry_tsa",
      category: "Travel Credits & Awards",
      title: "Global Entry® or TSA PreCheck® Credit ($120 every 4 years)",
      description: "Statement credit up to $120 every 4 years as reimbursement for Global Entry or TSA PreCheck application fee.",
      faceValue: 30, // $120 / 4
      defaultValue: 0,
      unit: "fixed",
      helpText: "Valued at $0: Application fee is already covered by other premium cards in wallet.",
      details: {
        annualizedAmount: 30,
        canDisable: true
      }
    },
    {
      id: "citigold_relationship_credit",
      category: "Relationship Credits",
      title: "Citigold® Banking Relationship Credit ($145 Annual Credit)",
      description: "Qualifying Citigold clients receive $145 Banking Relationship Annual Credit if holding an active Citi Strata Elite Card with $595 annual fee assessed.",
      faceValue: 145,
      defaultValue: 0,
      unit: "fixed",
      helpText: "Valued at $0 by default. Toggle on and set to $145 if you maintain a qualifying Citigold relationship.",
      details: {
        canDisable: true
      }
    }
  ],

  // Spend multipliers with wallet baseline comparisons
  spendCategories: [
    {
      id: "cititravel_hotels_cars",
      name: "Hotels, Car Rentals & Attractions (cititravel.com)",
      multiplier: 12,
      defaultAnnualSpend: 360, // ~$360 total spend to utilize the $300 annual hotel benefit (2+ night stay on cititravel.com)
      helpText: "Booked on cititravel.com (12X ThankYou Points = 14.4% return at 1.2 cpp)",
      baselineCard: "Venture X",
      baselineMultiplier: 2,
      baselineRatePct: 3.5,
      baselineMultiplierText: "2X (3.5%)",
      baselineFormula: "2X Capital One miles valued at 1.75¢/pt"
    },
    {
      id: "cititravel_air",
      name: "Air Travel (cititravel.com)",
      multiplier: 6,
      defaultAnnualSpend: 0, // Routed to Amex Platinum 5X (8.75% direct vs Citi 7.2% portal)
      helpText: "Air travel booked on cititravel.com (6X ThankYou Points = 7.2% return at 1.2 cpp)",
      baselineCard: "Amex Platinum",
      baselineMultiplier: 5,
      baselineRatePct: 8.75,
      baselineMultiplierText: "5X (8.75%)",
      baselineFormula: "5X MR points valued at 1.75¢/pt"
    },
    {
      id: "citi_nights_dining",
      name: "Restaurants on Citi Nights℠ (Fri & Sat, 6 PM – 6 AM ET)",
      multiplier: 6,
      defaultAnnualSpend: 2200, // Assumes ~$50/week on weekend dining ($2,000–$2,200/yr; 7.2% return beats Amex Gold 7.0%)
      helpText: "Weekend evening dining (6X ThankYou Points = 7.2% return at 1.2 cpp)",
      baselineCard: "Amex Gold",
      baselineMultiplier: 4,
      baselineRatePct: 7.0,
      baselineMultiplierText: "4X (7.0%)",
      baselineFormula: "4X MR points valued at 1.75¢/pt"
    },
    {
      id: "other_dining",
      name: "Restaurants & Delivery (All Other Times)",
      multiplier: 3,
      defaultAnnualSpend: 0, // Zeroed going forward (routed to Amex Gold 4X / 7.0% vs Citi 3X / 3.6%)
      helpText: "Dining & takeout any other time (3X ThankYou Points = 3.6% return at 1.2 cpp)",
      baselineCard: "Amex Gold",
      baselineMultiplier: 4,
      baselineRatePct: 7.0,
      baselineMultiplierText: "4X (7.0%)",
      baselineFormula: "4X MR points valued at 1.75¢/pt"
    },
    {
      id: "all_other",
      name: "All Other Purchases",
      multiplier: 1.5,
      defaultAnnualSpend: 520, // Bare minimum to harvest credits: Blacklane ($300/yr) + Splurge ($220/yr); remainder to Venture X 2X
      helpText: "General purchases (1.5X ThankYou Points = 1.8% return at 1.2 cpp)",
      baselineCard: "Venture X",
      baselineMultiplier: 2,
      baselineRatePct: 3.5,
      baselineMultiplierText: "2X (3.5%)",
      baselineFormula: "2X Capital One miles valued at 1.75¢/pt"
    }
  ],

  // Presets
  presets: {
    personalized_default: {
      name: "Personalized Default",
      description: "Personalized valuation: $270 hotel credit, $200 splurge credit, $40 Blacklane credit, $15 Admirals Club pass (1 visit @ $15), $0 Priority Pass/PreCheck. Calibrated spend: $360 hotel, $2,200 Citi Nights dining, $520 credit-harvesting other (fee: $595).",
      annualFee: 595,
      bofaBonus: false,
      benefits: {
        hotel_benefit: 270,
        splurge_credit: 200,
        blacklane_credit: 40,
        admirals_club_passes: 15,
        priority_pass: 0,
        global_entry_tsa: 0,
        citigold_relationship_credit: 0
      },
      annualSpend: {
        cititravel_hotels_cars: 360,
        cititravel_air: 0,
        citi_nights_dining: 2200,
        other_dining: 0,
        all_other: 520
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.CARDS_DATA = window.CARDS_DATA || {};
  window.CARDS_DATA['citi-strata-elite'] = CARD_CONFIG;
  if (!window.CARD_CONFIG) {
    window.CARD_CONFIG = CARD_CONFIG;
  }
}
})();
