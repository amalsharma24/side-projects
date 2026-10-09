#!/usr/bin/env python3
"""
Process American Express Gold Card PDF statements into CSV transactions and summary statistics.
"""

import os
import glob
import re
import csv
import pypdf

def classify_description(desc, amount):
    d = desc.upper()
    
    # 1. Flights / Airlines
    if any(k in d for k in ['AIRLINES', 'AIRWAYS', 'ALASKA AIR', 'DELTA AIR', 'UNITED AIR', 'AMERICAN AIR', 'JETBLUE', 'SOUTHWEST', 'AMEX TRAVEL', 'FLIGHT']):
        return 'flights'
    
    # 2. U.S. Supermarkets & Groceries
    if any(k in d for k in ['GROCERY', 'SUPERMARKET', 'TRADER JOE', 'WHOLE FOODS', 'SAFEWAY', 'KROGER', 'ALDI', 'HEB', 'WEGMANS', 'PUBLIX', 'SPROUTS', 'H MART', 'INDIAN GROCERY', 'DESI BAZAAR', 'PATEL BROTHERS']):
        return 'groceries'
    
    # 3. Dining / Restaurants & Takeout
    if any(k in d for k in ['RESTAURANT', 'CAFE', 'COFFEE', 'DINING', 'GRUBHUB', 'UBER EATS', 'DOORDASH', 'DUNKIN', 'CHEESECAKE', 'STARBUCKS', 'SWEETGREEN', 'RESY', 'TST*', 'SQ *', 'BAKERY', 'BURGER', 'PIZZA', 'TACO', 'SUSHI', 'THAI', 'CHINESE', 'MEXICAN', 'BAR & GRILL']):
        return 'dining'
    
    # Default fallback
    return 'all_other'

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_dir = os.path.join(base_dir, 'amex-gold', 'statements', 'raw')
    processed_dir = os.path.join(base_dir, 'amex-gold', 'statements', 'processed')
    os.makedirs(processed_dir, exist_ok=True)

    pdf_files = sorted(glob.glob(os.path.join(raw_dir, '*.pdf')))
    print(f"Found {len(pdf_files)} PDF statement files in {raw_dir}.\n")

    all_txs = []
    statement_summaries = []
    credits_breakdown = {
        'dining_credit': 0.0,
        'uber_cash': 0.0,
        'resy_credit': 0.0,
        'dunkin_credit': 0.0,
        'other_credits': 0.0
    }

    for pdf_path in pdf_files:
        fname = os.path.basename(pdf_path)
        reader = pypdf.PdfReader(pdf_path)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n"

        # Extract statement date
        closing_date_match = re.search(r'Closing Date\s+([0-9/]{8,10})', full_text)
        closing_date = closing_date_match.group(1) if closing_date_match else fname.replace('.pdf', '')

        # Extract totals summary
        purchases_match = re.search(r'Plus New Charges\s+\$([0-9,.]+)', full_text)
        fees_match = re.search(r'Plus Fees\s+\$([0-9,.]+)', full_text)
        credits_match = re.search(r'Less Payments/Credits\s+\$([0-9,.]+)', full_text)

        purchases_tot = float(purchases_match.group(1).replace(',', '')) if purchases_match else 0.0
        fees_tot = float(fees_match.group(1).replace(',', '')) if fees_match else 0.0

        # Parse transaction lines in "New Charges Details" and "Credits Details"
        lines = full_text.split('\n')
        current_section = None
        
        for idx, line in enumerate(lines):
            line_str = line.strip()
            if 'New Charges Details' in line_str:
                current_section = 'charges'
                continue
            elif 'Credits Details' in line_str:
                current_section = 'credits'
                continue
            elif 'Fees' in line_str and 'Summary' in line_str:
                current_section = None
                continue
            elif 'Pay Over Time' in line_str:
                current_section = None

            # Match lines starting with MM/DD/YY Date
            m = re.match(r'^([0-9]{2}/[0-9]{2}/[0-9]{2})\*?\s+(.+)', line_str)
            if m:
                tx_date = m.group(1)
                rest = m.group(2).strip()
                
                # Check if amount is at the end of line or next lines
                amt_match = re.search(r'(-?\$?[0-9,]+\.[0-9]{2})$', rest)
                if amt_match:
                    amt_val = float(amt_match.group(1).replace('$', '').replace(',', ''))
                    desc = rest[:amt_match.start()].strip()
                else:
                    # Look ahead 1-2 lines for amount
                    amt_val = 0.0
                    desc = rest
                    for look_ahead in range(1, 3):
                        if idx + look_ahead < len(lines):
                            nxt = lines[idx + look_ahead].strip()
                            amt_match2 = re.search(r'^(-?\$?[0-9,]+\.[0-9]{2})$', nxt)
                            if amt_match2:
                                amt_val = float(amt_match2.group(1).replace('$', '').replace(',', ''))
                                break

                if current_section == 'charges' and amt_val > 0:
                    cat = classify_description(desc, amt_val)
                    all_txs.append({
                        'statement': fname,
                        'closing_date': closing_date,
                        'date': tx_date,
                        'type': 'Charge',
                        'category': cat,
                        'description': desc,
                        'amount': amt_val
                    })
                elif current_section == 'credits' and amt_val < 0:
                    c_abs = abs(amt_val)
                    d_upper = desc.upper()
                    if 'DUNKIN' in d_upper:
                        credits_breakdown['dunkin_credit'] += c_abs
                    elif 'DINING' in d_upper or 'CHEESECAKE' in d_upper or 'GRUBHUB' in d_upper:
                        credits_breakdown['dining_credit'] += c_abs
                    elif 'RESY' in d_upper:
                        credits_breakdown['resy_credit'] += c_abs
                    elif 'UBER' in d_upper:
                        credits_breakdown['uber_cash'] += c_abs
                    else:
                        credits_breakdown['other_credits'] += c_abs

                    all_txs.append({
                        'statement': fname,
                        'closing_date': closing_date,
                        'date': tx_date,
                        'type': 'Credit',
                        'category': 'credit',
                        'description': desc,
                        'amount': amt_val
                    })

        statement_summaries.append({
            'file': fname,
            'closing_date': closing_date,
            'purchases': purchases_tot,
            'fees': fees_tot
        })

    # Save to consolidated CSV
    csv_out = os.path.join(processed_dir, 'all_transactions.csv')
    with open(csv_out, 'w', newline='', encoding='utf-8') as fp:
        writer = csv.DictWriter(fp, fieldnames=['statement', 'closing_date', 'date', 'type', 'category', 'description', 'amount'])
        writer.writeheader()
        writer.writerows(all_txs)

    # Compute category totals
    category_totals = {
        'dining': 0.0,
        'groceries': 0.0,
        'flights': 0.0,
        'all_other': 0.0
    }

    for tx in all_txs:
        if tx['type'] == 'Charge' and tx['category'] in category_totals:
            category_totals[tx['category']] += tx['amount']

    total_spend_all = sum(category_totals.values())
    total_fees_all = sum(s['fees'] for s in statement_summaries)

    print("=== AMEX GOLD 1-YEAR STATEMENT ANALYSIS ===")
    print(f"Statements Processed: {len(statement_summaries)}")
    print(f"Total Transactions Parsed: {len(all_txs)}")
    print(f"Total Annual Fees Paid: ${total_fees_all:,.2f}")
    print(f"Total Card Spend: ${total_spend_all:,.2f}\n")

    print("--- Spend Breakdown by Category ---")
    print(f"  • Restaurants & Dining (4X MR): ${category_totals['dining']:,.2f}")
    print(f"  • U.S. Supermarkets (4X MR):   ${category_totals['groceries']:,.2f}")
    print(f"  • Flights & Airfare (3X MR):     ${category_totals['flights']:,.2f}")
    print(f"  • All Other Spend (1X MR):       ${category_totals['all_other']:,.2f}\n")

    print("--- Statement Credits Redeemed ---")
    print(f"  • Dining Credits ($120 cap):  ${credits_breakdown['dining_credit']:,.2f}")
    print(f"  • Uber Cash / Eats ($120 cap): ${credits_breakdown['uber_cash']:,.2f}")
    print(f"  • Resy Credits ($100 cap):     ${credits_breakdown['resy_credit']:,.2f}")
    print(f"  • Dunkin' Credits ($84 cap):   ${credits_breakdown['dunkin_credit']:,.2f}")

    return category_totals, credits_breakdown, total_fees_all

if __name__ == '__main__':
    main()
