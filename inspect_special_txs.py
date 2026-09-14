import os
import glob
import csv

base_dir = os.path.dirname(os.path.abspath(__file__))
processed_dir = os.path.join(base_dir, 'statements', 'processed')
csv_files = sorted(glob.glob(os.path.join(processed_dir, '*.csv')))

all_txs = []
for f in csv_files:
    fname = os.path.basename(f)
    with open(f, encoding='utf-8') as fp:
        for row in csv.DictReader(fp):
            row['stmt'] = fname
            row['amount_val'] = float(row['amount']) if row.get('amount') else 0.0
            all_txs.append(row)

# Let's see all rows that are NOT regular online payments (e.g. merchant refunds)
non_payment_credits = [t for t in all_txs if t['amount_val'] < 0 and 'ONLINE/MOBILE' not in t['description']]
print("Merchant refunds / credits:")
for c in non_payment_credits:
    print(f"  {c['stmt']} | {c['date']} | ${c['amount_val']} | {c['description']}")

# Check ACH balance refund
ach_rows = [t for t in all_txs if 'ACH CREDIT BALANCE' in t['description']]
print("\nACH balance refunds:")
for a in ach_rows:
    print(f"  {a['stmt']} | {a['date']} | ${a['amount_val']} | {a['description']}")

# Check IRS Tax payments
tax_rows = [t for t in all_txs if 'US TREAS TAX' in t['description'] or 'SERVICE FEE' in t['description']]
print("\nTax payments:")
for t in tax_rows:
    print(f"  {t['stmt']} | {t['date']} | ${t['amount_val']} | {t['description']}")
