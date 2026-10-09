#!/usr/bin/env python3
"""
Compare today's live pricing grid against yesterday's captured pricing data for Avalon units.
Measures Freeze Window length, Lead-Time Drift slope ($/day), and Base Anchor Shifts.
"""

import urllib.request
import json
import re
from datetime import datetime

URLS = {
    "wa027-380": "https://www.avaloncommunities.com/washington/redmond-apartments/avalon-esterra-park/apartment/WA027-WA027-002-380/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12",
    "wa027-391": "https://www.avaloncommunities.com/washington/redmond-apartments/avalon-esterra-park/apartment/WA027-WA027-002-391/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12",
    "wa031-430": "https://www.avaloncommunities.com/washington/redmond-apartments/ava-esterra-park/apartment/WA031-WA031-001-430/?furnished=false&moveInDate=10%2F09%2F2026&leaseTerm=12"
}

headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}

def fetch_live_prices(url):
    req = urllib.request.Request(url, headers=headers)
    prices_by_date = {}
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        m_iter = re.finditer(r'\"moveInDate\":\"([0-9/]+)[^\"]*\",\"pricesPerTerms\":(\{.*?\})\},', html)
        for m in m_iter:
            raw_date = m.group(1) # e.g. 10/8/2026
            dt = datetime.strptime(raw_date, "%m/%d/%Y")
            iso_date = dt.strftime("%Y-%m-%d")
            terms_str = m.group(2)
            
            # Extract 12-month base price using regex
            p_match = re.search(r'\"12\":\{\"price\":([0-9.]+)', terms_str)
            if p_match:
                base_price = float(p_match.group(1))
                prices_by_date[iso_date] = base_price

    return prices_by_date

def main():
    print("=== LIVE PRICING GRID ANALYSIS & CALIBRATION (TODAY vs YESTERDAY) ===")
    
    try:
        with open("apartment_extracted_options.json", "r") as f:
            yesterday_dataset = json.load(f)
    except Exception as e:
        print("Error loading yesterday's dataset:", e)
        yesterday_dataset = []

    for apt_id, url in URLS.items():
        print(f"\n-------------------------------------------------------------")
        print(f"📊 Unit: {apt_id.upper()}")
        print(f"-------------------------------------------------------------")
        
        live_prices = fetch_live_prices(url)
        if not live_prices:
            print("Could not fetch live prices.")
            continue
        
        sorted_dates = sorted(live_prices.keys())
        print(f"Fetched {len(sorted_dates)} move-in date prices for 12-month terms.")

        min_price = min(live_prices.values())
        freeze_dates = [d for d in sorted_dates if live_prices[d] == min_price]
        freeze_window_days = len(freeze_dates)
        
        print(f"  • Base Anchor Price Today: ${min_price:,.0f}/mo")
        print(f"  • Freeze Window Dates: {freeze_dates[0]} to {freeze_dates[-1]} ({freeze_window_days} Days)")

        post_freeze_dates = [d for d in sorted_dates if d not in freeze_dates]
        if len(post_freeze_dates) >= 2:
            d1, d2 = post_freeze_dates[0], post_freeze_dates[-1]
            price_delta = live_prices[d2] - live_prices[d1]
            days_delta = (datetime.strptime(d2, "%Y-%m-%d") - datetime.strptime(d1, "%Y-%m-%d")).days
            drift_rate = price_delta / days_delta if days_delta > 0 else 0
            print(f"  • Lead-Time Drift Rate: +${drift_rate:.2f} / day (From ${live_prices[d1]:,.0f} on {d1} to ${live_prices[d2]:,.0f} on {d2})")
        
        yesterday_unit_opts = [o for o in yesterday_dataset if o.get('aptId') == apt_id]
        if yesterday_unit_opts:
            y_prices = {o['moveInDate']: o['baseRent'] for o in yesterday_unit_opts if o['termMonths'] == 12}
            y_min = min(y_prices.values()) if y_prices else min_price
            diff_anchor = min_price - y_min
            print(f"  • Anchor Price Change vs Yesterday: {f'+${diff_anchor:.0f}' if diff_anchor >= 0 else f'-${abs(diff_anchor):.0f}'} (Yesterday: ${y_min:,.0f} -> Today: ${min_price:,.0f})")

        print("\n  Sample Move-In Date Prices (Today vs Yesterday):")
        for d in sorted_dates[:10]:
            y_p = y_prices.get(d, 'N/A') if yesterday_unit_opts else 'N/A'
            diff_str = f"(Delta: {live_prices[d] - y_p:+.0f})" if isinstance(y_p, (int, float)) else ""
            print(f"    - {d}: Today ${live_prices[d]:,.0f} | Yesterday: ${y_p} {diff_str}")

if __name__ == "__main__":
    main()
