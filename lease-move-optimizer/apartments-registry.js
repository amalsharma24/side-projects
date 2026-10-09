// Apartment Registry Catalog (Pluggable Architecture like cards-registry.js)

const APARTMENTS_REGISTRY = [
  {
    id: "unit-380",
    name: "Avalon Esterra Park - Unit 380",
    community: "Avalon Esterra Park",
    unitNumber: "380",
    details: "2 Bed / 2 Bath (1,373 sq ft)",
    special: "Apply by 10/15 for 2 Months Free (12+ Mos)",
    hasSpecial: true,
    freeMonths: 2,
    minTermForSpecial: 12,
    badgeColor: "#10b981",
    dataFile: "unit-380/apartment-data.js",
    url: "https://www.avaloncommunities.com/washington/redmond-apartments/avalon-esterra-park/apartment/WA027-WA027-002-380/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12"
  },
  {
    id: "unit-391",
    name: "Avalon Esterra Park - Unit 391",
    community: "Avalon Esterra Park",
    unitNumber: "391",
    details: "2 Bed / 2 Bath (1,240 sq ft)",
    special: "Standard Pricing (No active special)",
    hasSpecial: false,
    freeMonths: 0,
    minTermForSpecial: 0,
    badgeColor: "#3b82f6",
    dataFile: "unit-391/apartment-data.js",
    url: "https://www.avaloncommunities.com/washington/redmond-apartments/avalon-esterra-park/apartment/WA027-WA027-002-391/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12"
  },
  {
    id: "unit-430",
    name: "AVA Esterra Park - Unit 430",
    community: "AVA Esterra Park",
    unitNumber: "430",
    details: "2 Bed / 2 Bath (1,408 sq ft)",
    special: "Apply by 10/15 for 2 Months Free (12+ Mos)",
    hasSpecial: true,
    freeMonths: 2,
    minTermForSpecial: 12,
    badgeColor: "#8b5cf6",
    dataFile: "unit-430/apartment-data.js",
    url: "https://www.avaloncommunities.com/washington/redmond-apartments/ava-esterra-park/apartment/WA031-WA031-001-430/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12"
  }
];

if (typeof window !== 'undefined') {
  window.APARTMENTS_REGISTRY = APARTMENTS_REGISTRY;
  window.APARTMENTS_DATA = window.APARTMENTS_DATA || {};
}
