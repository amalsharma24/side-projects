import os
import glob
import csv
import re
import argparse

def main():
    parser = argparse.ArgumentParser(description="Classify transactions for card spend analysis.")
    parser.add_argument("--card", default="bofa-atmos-summit", help="Card subfolder name (default: bofa-atmos-summit)")
    parser.add_argument("--dir", default=None, help="Explicit path to statements directory (overrides --card)")
    args = parser.parse_args()

    base_lab_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if args.dir:
        statements_dir = os.path.abspath(args.dir)
    else:
        statements_dir = os.path.join(base_lab_dir, args.card, 'statements')

    processed_dir = os.path.join(statements_dir, 'processed')

    if not os.path.exists(processed_dir):
        print(f"Error: Processed statements directory not found at {processed_dir}")
        return

    csv_files = sorted(glob.glob(os.path.join(processed_dir, '*.csv')))
    print(f"Classifying transactions for card: {args.card}")
    print(f"Found {len(csv_files)} CSV files in {processed_dir}.\n")

    all_purchases = []
    all_payments = []

    for f in csv_files:
        fname = os.path.basename(f)
        with open(f, encoding='utf-8') as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                cat = row.get('category', '').strip()
                desc = row.get('description', '').strip()
                amount_str = row.get('amount', '0').replace(',', '')
                try:
                    amt = float(amount_str)
                except ValueError:
                    amt = 0.0
                
                item = {
                    'stmt': fname,
                    'date': row.get('date'),
                    'post_date': row.get('post_date'),
                    'category': cat,
                    'description': desc,
                    'amount': amt,
                    'foreign_amount': row.get('foreign_amount', '').strip(),
                    'foreign_currency': row.get('foreign_currency', '').strip(),
                    'ref': row.get('reference_number', '').strip()
                }
                if cat == 'Purchase':
                    all_purchases.append(item)
                elif cat == 'Payment':
                    all_payments.append(item)

    if not all_purchases:
        print("No purchase transactions found.")
        return

    total_spend = sum(p['amount'] for p in all_purchases)
    print(f"Total purchases: {len(all_purchases)}, Total spend: ${total_spend:,.2f}")
    print(f"Total payments/credits: {len(all_payments)}, Total: ${sum(p['amount'] for p in all_payments):,.2f}")

    def classify_purchase(p):
        desc = p['description'].upper()
        is_foreign = bool(p['foreign_currency'] or p['foreign_amount'])
        
        # 1. Alaska & Hawaiian Airlines
        if 'ALASKA AIR' in desc or 'HAWAIIAN AIR' in desc:
            return 'alaska_hawaiian'
        
        # 2. Foreign Transactions
        if is_foreign:
            return 'foreign_tx'
        
        # 3. Dining keywords
        dining_keywords = [
            'REST', 'CAFE', 'COFFEE', 'BAKERY', 'BURGER', 'PIZZA', 'TACO', 'SUSHI',
            'GRILL', 'KITCHEN', 'DINER', 'BAR ', 'PUB', 'BISTRO', 'STEAK', 'NOODLE',
            'CHIPOTLE', 'STARBUCKS', 'MCDONALD', 'SUBWAY', 'PANERA', 'DOMINO',
            'DOORDASH', 'UBER EATS', 'GRUBHUB', 'EAT', 'FOOD', 'BREW', 'SWEETGREEN',
            'SHAKE SHACK', 'TAVERN', 'CATERING', 'BAGEL', 'CREPE', 'DELI', 'POKE',
            'RAMEN', 'BBQ', 'BARBEQUE', 'CHUKAR CHERRY', 'KELLI?S COFFEE'
        ]
        for kw in dining_keywords:
            if kw in desc:
                return 'dining'
                
        return 'all_other'

    categorized = {
        'alaska_hawaiian': [],
        'foreign_tx': [],
        'dining': [],
        'all_other': []
    }

    for p in all_purchases:
        cat = classify_purchase(p)
        categorized[cat].append(p)

    print("\n--- TRANSACTION BREAKDOWN BY CATEGORY ---")
    for cat, items in categorized.items():
        total_amt = sum(x['amount'] for x in items)
        pct = (total_amt / total_spend * 100) if total_spend > 0 else 0
        print(f"{cat:<18}: {len(items):>3} transactions, Total = ${total_amt:>10.2f} ({pct:>5.1f}%)")

if __name__ == '__main__':
    main()
