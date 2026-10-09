#!/usr/bin/env python3
"""
Extract complete dynamic pricing matrix (Move-In Dates x Lease Terms) for the 3 Avalon / AVA Esterra Park apartments.
Calculate double-rent overlap against current lease end (Nov 2, 2026), special offers, and movers costs.
"""

import urllib.request
import json
import re
from datetime import datetime

CURRENT_LEASE_END = "2026-11-02"
CURRENT_RENT = 2400.0
CURRENT_DAILY_RENT = CURRENT_RENT / 30.0
BASE_MOVERS_COST = 650.0
WEEKEND_MOVERS_SURCHARGE = 150.0

APARTMENTS = [
    {
        "id": "wa027-380",
        "name": "Avalon Esterra Park - Unit 380",
        "community": "Avalon Esterra Park",
        "unitNumber": "380",
        "details": "2 Bed / 2 Bath (1,373 sq ft)",
        "special": "Apply by 10-15 for 2 months off! (Leases 12+ mos)",
        "url": "https://www.avaloncommunities.com/washington/redmond-apartments/avalon-esterra-park/apartment/WA027-WA027-002-380/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12"
    },
    {
        "id": "wa027-391",
        "name": "Avalon Esterra Park - Unit 391",
        "community": "Avalon Esterra Park",
        "unitNumber": "391",
        "details": "2 Bed / 2 Bath (1,240 sq ft)",
        "special": "Standard Pricing (No active special)",
        "url": "https://www.avaloncommunities.com/washington/redmond-apartments/avalon-esterra-park/apartment/WA027-WA027-002-391/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12"
    },
    {
        "id": "wa031-430",
        "name": "AVA Esterra Park - Unit 430",
        "community": "AVA Esterra Park",
        "unitNumber": "430",
        "details": "2 Bed / 2 Bath (1,408 sq ft)",
        "special": "Apply by 10-15 for 2 months off! (Leases 12+ mos)",
        "url": "https://www.avaloncommunities.com/washington/redmond-apartments/ava-esterra-park/apartment/WA031-WA031-001-430/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12"
    }
]

headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}

def calculate_overlap_days(move_in_str, lease_end_str):
    m_date = datetime.strptime(move_in_str, "%Y-%m-%d")
    l_date = datetime.strptime(lease_end_str, "%Y-%m-%d")
    if m_date >= l_date:
        return 0
    return (l_date - m_date).days

def is_weekend(date_str):
    d = datetime.strptime(date_str, "%Y-%m-%d")
    return d.weekday() in (5, 6) # Sat, Sun

def parse_apartment_data(apt):
    print(f"Fetching data for {apt['name']}...")
    req = urllib.request.Request(apt['url'], headers=headers)
    all_options = []
    
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        
        # Look for pricesPerMoveinDate pattern
        pos = html.find('pricesPerMoveinDate')
        if pos == -1:
            print(f"Error: pricesPerMoveinDate not found for {apt['name']}")
            return []
        
        # Find json payload snippet
        snippet_start = html.rfind('{', 0, pos)
        snippet_end = html.find(']', pos) + 500
        
        # Search for all moveInDate entries
        move_in_matches = re.finditer(r'\"moveInDate\":\"([0-9/]+)[^\"]*\",\"pricesPerTerms\":(\{.*?\})\},', html)
        
        for m in move_in_matches:
            raw_date = m.group(1) # e.g. 10/8/2026
            dt = datetime.strptime(raw_date, "%m/%d/%Y")
            iso_date = dt.strftime("%Y-%m-%d")
            
            terms_json_str = m.group(2)
            try:
                terms_dict = json.loads(terms_json_str)
            except Exception:
                continue

            for term_months_str, price_data in terms_dict.items():
                term_months = int(term_months_str)
                base_rent = float(price_data.get('price', 0))
                total_rent_month = float(price_data.get('totalPrice', base_rent))
                
                # Check for 2 months off promo adjustment if applicable
                discounted_monthly = base_rent
                if "2 months off" in apt['special'] and term_months >= 12:
                    # Net effective rent factoring 2 months free spread over term
                    discounted_monthly = (base_rent * (term_months - 2)) / term_months

                days_overlap = calculate_overlap_days(iso_date, CURRENT_LEASE_END)
                overlap_cost = days_overlap * CURRENT_DAILY_RENT
                weekend = is_weekend(iso_date)
                movers_cost = BASE_MOVERS_COST + (WEEKEND_MOVERS_SURCHARGE if weekend else 0.0)

                total_contract_cost = (discounted_monthly * term_months) + overlap_cost + movers_cost
                effective_monthly = total_contract_cost / term_months

                all_options.append({
                    "aptId": apt["id"],
                    "aptName": apt["name"],
                    "community": apt["community"],
                    "unitNumber": apt["unitNumber"],
                    "details": apt["details"],
                    "special": apt["special"],
                    "signDate": "2026-10-08", # Today's sign date
                    "moveInDate": iso_date,
                    "moveInFormatted": dt.strftime("%b %d, %Y (%a)"),
                    "termMonths": term_months,
                    "baseRent": base_rent,
                    "totalRentWithFees": total_rent_month,
                    "discountedMonthly": round(discounted_monthly, 2),
                    "daysOverlap": days_overlap,
                    "overlapCost": round(overlap_cost, 2),
                    "isWeekend": weekend,
                    "moversCost": movers_cost,
                    "totalOutlay": round(total_contract_cost, 2),
                    "effectiveMonthlyCost": round(effective_monthly, 2)
                })

    print(f"Extracted {len(all_options)} pricing options for {apt['name']}.")
    return all_options

def main():
    all_dataset = []
    for apt in APARTMENTS:
        opts = parse_apartment_data(apt)
        all_dataset.extend(opts)

    # Sort dataset by effectiveMonthlyCost ascending
    all_dataset.sort(key=lambda x: x['effectiveMonthlyCost'])

    # Save to JSON for the web application
    base_dir = os.path.dirname(os.path.abspath(__file__))
    out_file = os.path.join(base_dir, "apartment_extracted_options.json")
    with open(out_file, "w", encoding="utf-8") as fp:
        json.dump(all_dataset, fp, indent=2)

    print(f"\nSuccessfully generated {len(all_dataset)} total option scenarios!")
    print(f"Saved dataset to {out_file}")

    # Display Top 5 Best Value Options
    print("\n🏆 TOP 5 BEST VALUE MOVE OPTIONS (Lowest Effective Monthly Cost):")
    print("-" * 105)
    print(f"{'Apartment Unit':<30} | {'Move-In Date':<15} | {'Term':<6} | {'Base Rent':<10} | {'Net/Promo':<10} | {'Overlap':<10} | {'Effective $/mo':<14}")
    print("-" * 105)

    for item in all_dataset[:10]:
        print(f"{item['aptName']:<30} | {item['moveInFormatted']:<15} | {item['termMonths']:<2} Mos | ${item['baseRent']:<9.0f} | ${item['discountedMonthly']:<9.0f} | ${item['overlapCost']:<9.0f} | ${item['effectiveMonthlyCost']:<12.2f}")

if __name__ == "__main__":
    main()
