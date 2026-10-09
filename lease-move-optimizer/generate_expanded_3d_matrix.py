#!/usr/bin/env python3
"""
Generate complete 30-day dynamic predictive matrix across all Sign Dates (Oct 8 to Nov 7)
and all Move-In Dates (Oct 8 to Nov 30) for all 3 apartments.
"""

import json
from datetime import datetime, timedelta

CURRENT_LEASE_END = "2026-11-02"
CURRENT_RENT = 4500.0
CURRENT_DAILY_RENT = CURRENT_RENT / 30.0 # $150/day
DEFAULT_M2M_RENT = 3700.0 # $3,700/mo ($123.33/day M2M penalty)
BASE_MOVERS_COST = 2000.0
WEEKEND_MOVERS_SURCHARGE = 150.0

APARTMENTS = [
    {
        "id": "wa027-380",
        "name": "Avalon Esterra Park - Unit 380",
        "community": "Avalon Esterra Park",
        "unitNumber": "380",
        "details": "2 Bed / 2 Bath (1,373 sq ft)",
        "special": "Apply by 10-15 for 2 months off!",
        "baseAnchorPrice": 3635.0,
        "hasSpecial": True
    },
    {
        "id": "wa027-391",
        "name": "Avalon Esterra Park - Unit 391",
        "community": "Avalon Esterra Park",
        "unitNumber": "391",
        "details": "2 Bed / 2 Bath (1,240 sq ft)",
        "special": "Standard Pricing",
        "baseAnchorPrice": 3290.0,
        "hasSpecial": False
    },
    {
        "id": "wa031-430",
        "name": "AVA Esterra Park - Unit 430",
        "community": "AVA Esterra Park",
        "unitNumber": "430",
        "details": "2 Bed / 2 Bath (1,408 sq ft)",
        "special": "Apply by 10-15 for 2 months off!",
        "baseAnchorPrice": 4160.0,
        "hasSpecial": True
    }
]

def is_weekend(date_dt):
    return date_dt.weekday() in (5, 6) # Sat, Sun

def main():
    today = datetime(2026, 10, 8)
    promo_deadline_dt = datetime(2026, 10, 15)

    dataset = []

    for apt in APARTMENTS:
        # Generate Sign Dates from Day 0 (Oct 8) up to Day 30 (Nov 7)
        for sign_offset in range(31):
            sign_dt = today + timedelta(days=sign_offset)
            
            # Generate Move-In Dates from Sign Date up to Nov 30
            max_move_in = datetime(2026, 11, 30)
            curr_move_in = sign_dt
            
            while curr_move_in <= max_move_in:
                # 3-day freeze window relative to sign date
                freeze_end_dt = sign_dt + timedelta(days=2)
                lead_days = max(0, (curr_move_in - freeze_end_dt).days)
                predicted_base_rent = apt["baseAnchorPrice"] + (lead_days * 10.0)

                special_active = apt["hasSpecial"] and (sign_dt <= promo_deadline_dt)

                for term_months in [12, 13, 14, 15]:
                    dataset.append({
                        "aptId": apt["id"],
                        "aptName": apt["name"],
                        "details": apt["details"],
                        "special": apt["special"],
                        "hasSpecial": apt["hasSpecial"],
                        "specialActive": special_active,
                        "signDate": sign_dt.strftime("%Y-%m-%d"),
                        "signDateFormatted": sign_dt.strftime("%b %d, %Y (%a)"),
                        "moveInDate": curr_move_in.strftime("%Y-%m-%d"),
                        "moveInFormatted": curr_move_in.strftime("%b %d, %Y (%a)"),
                        "termMonths": term_months,
                        "baseAnchorPrice": apt["baseAnchorPrice"],
                        "baseRent": round(predicted_base_rent),
                        "leadDays": lead_days
                    })

                curr_move_in += timedelta(days=1)

    print(f"Generated {len(dataset)} expanded 30-day predictive matrix scenarios.")

    with open("apartment_predictive_dataset.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)

    with open("apartment_predictive_dataset.js", "w", encoding="utf-8") as f:
        f.write(f"window.PREDICTIVE_DATASET = {json.dumps(dataset, indent=2)};\n")

    print("Saved expanded dataset to apartment_predictive_dataset.js successfully!")

if __name__ == "__main__":
    main()
