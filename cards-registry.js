// Credit Card ROI Analyzer - Card Registry
// Central catalog of credit cards analyzed in this lab.

const CARDS_REGISTRY = [
  {
    id: "bofa-atmos-summit",
    name: "Bank of America Atmos™ Summit Card ($395)",
    shortName: "Atmos™ Summit",
    annualFee: 395,
    folder: "bofa-atmos-summit",
    tag: "Premium Travel",
    badgeColor: "#3b82f6",
    issuer: "Bank of America / Alaska Airlines & Hawaiian Airlines",
    dataFile: "bofa-atmos-summit/card-data.js",
    analysisDoc: "bofa-atmos-summit/statements_analysis.md"
  },
  {
    id: "bofa-atmos-ascent",
    name: "Bank of America Atmos™ Ascent Card ($95)",
    shortName: "Atmos™ Ascent",
    annualFee: 95,
    folder: "bofa-atmos-ascent",
    tag: "Baggage / Keeper",
    badgeColor: "#10b981",
    issuer: "Bank of America / Alaska Airlines & Hawaiian Airlines",
    dataFile: "bofa-atmos-ascent/card-data.js",
    analysisDoc: "bofa-atmos-ascent/card_analysis.md"
  },
  {
    id: "citi-strata-elite",
    name: "Citi Strata Elite℠ Card ($595)",
    shortName: "Citi Strata Elite℠",
    annualFee: 595,
    folder: "citi-strata-elite",
    tag: "Ultra-Premium Travel",
    badgeColor: "#0284c7",
    issuer: "Citi / ThankYou® Rewards",
    dataFile: "citi-strata-elite/card-data.js",
    analysisDoc: "citi-strata-elite/card_analysis.md"
  }
];

if (typeof window !== 'undefined') {
  window.CARDS_REGISTRY = CARDS_REGISTRY;
  if (!window.CARDS_DATA) {
    window.CARDS_DATA = {};
  }
}
