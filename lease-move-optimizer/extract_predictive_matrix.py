#!/usr/bin/env python3
"""
Live Dynamic Pricing Calibration & Dataset Generator (Today Oct 8 vs Yesterday Oct 7).
Calibrates dynamic freeze windows, lead-time drift slopes, and base anchor shifts per unit.
"""

import urllib.request
import json
import re
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
        "baseAnchorPrice": None, # Auto-calculated by model if None
        "freezeDays": None,      # Auto-calculated by model if None
        "driftRate": None,       # Auto-calculated by model if None
        "special": "Apply by 10-15 for 2 months off!",
        "hasSpecial": True,
        "url": "https://www.avaloncommunities.com/washington/redmond-apartments/avalon-esterra-park/apartment/WA027-WA027-002-380/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12"
    },
    {
        "id": "wa027-391",
        "name": "Avalon Esterra Park - Unit 391",
        "community": "Avalon Esterra Park",
        "unitNumber": "391",
        "details": "2 Bed / 2 Bath (1,240 sq ft)",
        "baseAnchorPrice": None,
        "freezeDays": None,
        "driftRate": None,
        "special": "Standard Pricing",
        "hasSpecial": False,
        "url": "https://www.avaloncommunities.com/washington/redmond-apartments/avalon-esterra-park/apartment/WA027-WA027-002-391/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12"
    },
    {
        "id": "wa031-430",
        "name": "AVA Esterra Park - Unit 430",
        "community": "AVA Esterra Park",
        "unitNumber": "430",
        "details": "2 Bed / 2 Bath (1,408 sq ft)",
        "baseAnchorPrice": None,
        "freezeDays": None,
        "driftRate": None,
        "special": "Apply by 10-15 for 2 months off!",
        "hasSpecial": True,
        "url": "https://www.avaloncommunities.com/washington/redmond-apartments/ava-esterra-park/apartment/WA031-WA031-001-430/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12"
    },
    {
        "id": "riverpark-a542",
        "name": "Riverpark Apartments - Unit A-542 (B20L Loft)",
        "community": "Riverpark Apartments",
        "unitNumber": "A-542",
        "details": "2 Bed / 2 Bath Loft (1,472 sq ft)",
        "baseAnchorPrice": 3310.0,
        "freezeDays": 10,
        "driftRate": 8.75,
        "special": "Up to 1 Month Free Special!",
        "hasSpecial": True,
        "url": "https://www.lifeatriverparkapartments.com/wa/redmond/rentestimate/b20l-loft?unitid=43055641"
    },
    {
        "id": "riverpark-b517",
        "name": "Riverpark Apartments - Unit B-517 (B20L Loft)",
        "community": "Riverpark Apartments",
        "unitNumber": "B-517",
        "details": "2 Bed / 2 Bath Loft (1,415 sq ft)",
        "baseAnchorPrice": 3816.0,
        "freezeDays": 10,
        "driftRate": 9.0,
        "special": "Up to 1 Month Free Special!",
        "hasSpecial": True,
        "url": "https://www.lifeatriverparkapartments.com/wa/redmond/rentestimate/b20l-loft?unitid=43055730"
    }
]

headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}

def fetch_live_unit_matrix(apt):
    print(f"Fetching/generating pricing matrix for {apt['name']} ({apt.get('community', 'Custom Community')})...")
    prices_by_date = {}
    
    # If URL is an Avalon URL, scrape live
    if apt.get('url') and 'avaloncommunities.com' in apt.get('url'):
        try:
            req = urllib.request.Request(apt['url'], headers=headers)
            with urllib.request.urlopen(req) as resp:
                html = resp.read().decode('utf-8')
                m_iter = re.finditer(r'\"moveInDate\":\"([0-9/]+)[^\"]*\",\"pricesPerTerms\":(\{.*?\})\},', html)
                for m in m_iter:
                    raw_date = m.group(1)
                    dt = datetime.strptime(raw_date, "%m/%d/%Y")
                    iso_date = dt.strftime("%Y-%m-%d")
                    terms_str = m.group(2)
                    
                    p_match = re.search(r'\"12\":\{\"price\":([0-9.]+)', terms_str)
                    if p_match:
                        prices_by_date[iso_date] = float(p_match.group(1))
        except Exception as e:
            print(f"  Note: Live HTTP fetch for {apt['id']} returned: {e}. Falling back to dynamic baseline calculation.")

    # For manual baseline entries without live URL endpoints:
    if not prices_by_date:
        base_price = apt.get('baseAnchorPrice', 0.0)
        freeze_days = apt.get('freezeDays', 0)
        drift_rate = apt.get('driftRate', 0.0)
        today = datetime(2026, 10, 11)
        
        for d in range(30):
            dt = today + timedelta(days=d)
            iso_date = dt.strftime("%Y-%m-%d")
            if d < freeze_days:
                prices_by_date[iso_date] = base_price
            else:
                prices_by_date[iso_date] = base_price + ((d - freeze_days) * drift_rate)

    return prices_by_date

def main():
    today = datetime(2026, 10, 11)
    promo_deadline_dt = datetime(2026, 10, 15)

    dataset = []
    calibration_report = {}
    comparison_report = {}

    try:
        with open("apartment_extracted_options.json", "r") as f:
            yesterday_dataset = json.load(f)
    except Exception as e:
        yesterday_dataset = []

    for apt in APARTMENTS:
        live_prices = fetch_live_unit_matrix(apt)
        if not live_prices:
            continue

        sorted_dates = sorted(live_prices.keys())
        auto_min_price = min(live_prices.values())
        auto_freeze_dates = [d for d in sorted_dates if live_prices[d] == auto_min_price]
        auto_freeze_days = len(auto_freeze_dates)

        post_freeze_dates = [d for d in sorted_dates if d not in auto_freeze_dates]
        if len(post_freeze_dates) >= 2:
            d1, d2 = post_freeze_dates[0], post_freeze_dates[-1]
            days_delta = (datetime.strptime(d2, "%Y-%m-%d") - datetime.strptime(d1, "%Y-%m-%d")).days
            auto_drift_rate = (live_prices[d2] - live_prices[d1]) / days_delta if days_delta > 0 else 10.0
        else:
            auto_drift_rate = 10.0

        # Use explicitly provided values if present, else calculate automatically from live data!
        min_price = apt.get('baseAnchorPrice') if apt.get('baseAnchorPrice') is not None else auto_min_price
        freeze_days = apt.get('freezeDays') if apt.get('freezeDays') is not None else auto_freeze_days
        drift_rate = apt.get('driftRate') if apt.get('driftRate') is not None else auto_drift_rate

        # Extract yesterday's baseline for comparison
        y_unit_opts = [o for o in yesterday_dataset if o.get('aptId') == apt["id"]]
        y_prices = {o['moveInDate']: o['baseRent'] for o in y_unit_opts if o.get('termMonths') == 12}
        y_min_price = min(y_prices.values()) if y_prices else min_price
        anchor_delta = min_price - y_min_price

        # Detect yesterday's freeze window
        y_freeze_dates = [d for d, p in y_prices.items() if p == y_min_price]
        y_freeze_days = len(y_freeze_dates) if y_freeze_dates else 3

        # Sample comparison array for UI
        sample_comparison = []
        for d in sorted_dates[:10]:
            y_val = y_prices.get(d, None)
            delta_val = live_prices[d] - y_val if isinstance(y_val, (int, float)) else None
            sample_comparison.append({
                "date": d,
                "todayPrice": live_prices[d],
                "yesterdayPrice": y_val,
                "delta": delta_val
            })

        calibration_report[apt["id"]] = {
            "aptName": apt["name"],
            "baseAnchorPrice": min_price,
            "yesterdayAnchorPrice": y_min_price,
            "anchorDelta": anchor_delta,
            "freezeDays": freeze_days,
            "yesterdayFreezeDays": y_freeze_days,
            "freezeDates": f"{auto_freeze_dates[0]} to {auto_freeze_dates[-1]}" if auto_freeze_dates else "N/A",
            "driftRate": round(drift_rate, 2),
            "sampleComparison": sample_comparison
        }

        # Daily anchor drift when delaying lease sign date
        anchor_drift_per_day = anchor_delta if anchor_delta > 0 else 5.0

        # Generate Sign Dates from Day 0 (Oct 8) up to Day 30 (Nov 7)
        for sign_offset in range(31):
            sign_dt = today + timedelta(days=sign_offset)
            max_move_in = datetime(2026, 11, 30)
            curr_move_in = sign_dt

            # Adjust anchor price for delayed sign date
            effective_anchor = min_price + (sign_offset * anchor_drift_per_day)

            while curr_move_in <= max_move_in:
                # Dynamic freeze window measured relative to sign date
                freeze_end_dt = sign_dt + timedelta(days=freeze_days)
                if curr_move_in <= freeze_end_dt:
                    predicted_base_rent = effective_anchor
                    lead_days = 0
                else:
                    lead_days = (curr_move_in - freeze_end_dt).days
                    predicted_base_rent = effective_anchor + (lead_days * drift_rate)

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
                        "baseAnchorPrice": min_price,
                        "baseRent": round(predicted_base_rent),
                        "leadDays": lead_days
                    })

                curr_move_in += timedelta(days=1)

    print(f"\nSuccessfully generated {len(dataset)} live-calibrated scenarios.")
    print("Calibration Summary Today (Oct 8 vs Oct 7):", json.dumps(calibration_report, indent=2))

    with open("apartment_predictive_dataset.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)

    with open("apartment_predictive_dataset.js", "w", encoding="utf-8") as f:
        f.write(f"window.PREDICTIVE_DATASET = {json.dumps(dataset, indent=2)};\n")
        f.write(f"window.CALIBRATION_REPORT = {json.dumps(calibration_report, indent=2)};\n")

    print("Saved apartment_predictive_dataset.js successfully!")

if __name__ == "__main__":
    main()

