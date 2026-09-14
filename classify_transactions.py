import os
import glob
import csv
import re

base_dir = os.path.dirname(os.path.abspath(__file__))
processed_dir = os.path.join(base_dir, 'statements', 'processed')
csv_files = sorted(glob.glob(os.path.join(processed_dir, '*.csv')))

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

print(f"Total purchases: {len(all_purchases)}, Total spend: ${sum(p['amount'] for p in all_purchases):,.2f}")
print(f"Total payments/credits: {len(all_payments)}, Total: ${sum(p['amount'] for p in all_payments):,.2f}")

# Categorize purchases into 4 buckets:
# 1. Alaska / Hawaiian Airlines
# 2. Foreign Transactions (non-USD or foreign currency present, excluding Alaska if already counted)
# 3. Dining (Domestic restaurants/takeout/cafes)
# 4. All Other

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
    print(f"{cat:<18}: {len(items):>3} transactions, Total = ${total_amt:>10.2f} ({(total_amt/sum(p['amount'] for p in all_purchases)*100):>5.1f}%)")

print("\n--- SAMPLE DINING TRANSACTIONS ---")
for p in categorized['dining'][:15]:
    print(f"  {p['date']} | ${p['amount']:>6.2f} | {p['description']}")

print("\n--- SAMPLE ALASKA/HAWAIIAN TRANSACTIONS ---")
for p in categorized['alaska_hawaiian']:
    print(f"  {p['date']} | ${p['amount']:>6.2f} | {p['description']}")

print("\n--- TOP 15 'ALL OTHER' TRANSACTIONS ---")
sorted_other = sorted(categorized['all_other'], key=lambda x: x['amount'], reverse=True)
for p in sorted_other[:15]:
    print(f"  {p['date']} | ${p['amount']:>8.2f} | {p['description']}")
