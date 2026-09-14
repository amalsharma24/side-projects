import os
import glob
import re
import csv
from datetime import datetime

base_dir = os.path.dirname(os.path.abspath(__file__))
processed_dir = os.path.join(base_dir, 'statements', 'processed')

md_files = sorted(glob.glob(os.path.join(processed_dir, '*.md')))
csv_files = sorted(glob.glob(os.path.join(processed_dir, '*.csv')))

print(f"Found {len(md_files)} statement markdown files and {len(csv_files)} CSV files.\n")

statement_summaries = []

for f in md_files:
    with open(f, encoding='utf-8') as fp:
        content = fp.read()
    
    date_match = re.search(r'# Credit Card Statement:\s*([0-9/]+)', content)
    cycle_match = re.search(r'>\s*\*\*Billing Cycle:\*\*\s*(.+)', content)
    purchases_match = re.search(r'\|\s*Purchases and Adjustments\s*\|\s*\$([0-9,.]+)', content)
    fees_match = re.search(r'\|\s*Fees Charged\s*\|\s*\$([0-9,.]+)', content)
    payments_match = re.search(r'\|\s*Payments and Other Credits\s*\|\s*-\$([0-9,.]+)', content)
    
    base_pts = re.search(r'\|\s*Base Purchase Points\s*\|\s*([0-9,]+)', content)
    ak_pts = re.search(r'\|\s*Alaska/Hawaiian Bonus Points\s*\|\s*([0-9,]+)', content)
    fd_pts = re.search(r'\|\s*Foreign/Dining Bonus Points\s*\|\s*([0-9,]+)', content)
    promo_pts = re.search(r'\|\s*Promotional Points\s*\|\s*([0-9,]+)', content)
    rel_pts = re.search(r'\|\s*Relationship Bonus Points\s*\|\s*([0-9,]+)', content)
    total_pts = re.search(r'\|\s*\*\*Points to Atmos Rewards\*\*\s*\|\s*\*\*([0-9,]+)\*\*', content)
    
    def parse_num(m):
        if not m:
            return 0.0
        return float(m.group(1).replace(',', ''))

    stmt = {
        'file': os.path.basename(f),
        'closing_date': date_match.group(1) if date_match else 'Unknown',
        'cycle': cycle_match.group(1).strip() if cycle_match else '',
        'purchases': parse_num(purchases_match),
        'fees': parse_num(fees_match),
        'payments': parse_num(payments_match),
        'base_pts': parse_num(base_pts),
        'ak_pts': parse_num(ak_pts),
        'fd_pts': parse_num(fd_pts),
        'promo_pts': parse_num(promo_pts),
        'rel_pts': parse_num(rel_pts),
        'total_pts': parse_num(total_pts),
    }
    statement_summaries.append(stmt)

# Print tabular monthly summaries
print(f"{'Statement':<18} | {'Purchases':>10} | {'Fees':>8} | {'Base Pts':>9} | {'AK Bonus':>9} | {'FD Bonus':>9} | {'Rel Bonus':>10} | {'Total Pts':>10}")
print("-" * 98)

totals = {
    'purchases': 0.0,
    'fees': 0.0,
    'payments': 0.0,
    'base_pts': 0.0,
    'ak_pts': 0.0,
    'fd_pts': 0.0,
    'promo_pts': 0.0,
    'rel_pts': 0.0,
    'total_pts': 0.0,
}

for s in statement_summaries:
    print(f"{s['file']:<18} | ${s['purchases']:>9.2f} | ${s['fees']:>7.2f} | {s['base_pts']:>9.0f} | {s['ak_pts']:>9.0f} | {s['fd_pts']:>9.0f} | {s['rel_pts']:>10.0f} | {s['total_pts']:>10.0f}")
    for k in totals:
        totals[k] += s[k]

print("-" * 98)
print(f"{'TOTAL (11 Stmts)':<18} | ${totals['purchases']:>9.2f} | ${totals['fees']:>7.2f} | {totals['base_pts']:>9.0f} | {totals['ak_pts']:>9.0f} | {totals['fd_pts']:>9.0f} | {totals['rel_pts']:>10.0f} | {totals['total_pts']:>10.0f}")

# Interpolate to 12 months (multiply by 12 / 11)
factor = 12.0 / len(statement_summaries)
print(f"{'ANNUALIZED (12 mo)':<18} | ${totals['purchases'] * factor:>9.2f} | ${totals['fees']:>7.2f} | {totals['base_pts'] * factor:>9.0f} | {totals['ak_pts'] * factor:>9.0f} | {totals['fd_pts'] * factor:>9.0f} | {totals['rel_pts'] * factor:>10.0f} | {totals['total_pts'] * factor:>10.0f}")

# Now analyze transaction CSVs to separate Dining vs Foreign and look at individual categories
print("\n" + "="*50)
print("TRANSACTION LEVEL CATEGORY BREAKDOWN ACROSS ALL STATEMENTS")
print("="*50)

all_transactions = []
for f in csv_files:
    with open(f, encoding='utf-8') as fp:
        reader = csv.DictReader(fp)
        for row in reader:
            if row.get('category') == 'Purchase':
                row['stmt'] = os.path.basename(f)
                row['amount_val'] = float(row['amount']) if row.get('amount') else 0.0
                all_transactions.append(row)

print(f"Total purchase transactions parsed: {len(all_transactions)}")

# Look for foreign transactions (foreign_amount or currency present or non-empty)
foreign_txs = [t for t in all_transactions if (t.get('foreign_currency') and t.get('foreign_currency').strip()) or (t.get('foreign_amount') and t.get('foreign_amount').strip())]
foreign_spend = sum(t['amount_val'] for t in foreign_txs)
print(f"Foreign Transactions: {len(foreign_txs)} transactions, Total = ${foreign_spend:.2f}")

# We know the bank's bonus points for:
# Alaska/Hawaiian bonus: 2 extra points per dollar -> ak_spend = totals['ak_pts'] / 2
# Foreign/Dining bonus: 2 extra points per dollar -> fd_spend = totals['fd_pts'] / 2
ak_spend = totals['ak_pts'] / 2.0
fd_spend = totals['fd_pts'] / 2.0
dining_spend = max(0, fd_spend - foreign_spend)
other_spend = totals['purchases'] - ak_spend - fd_spend

print(f"\nDerived Actual Spend from Bank Bonus Math (11 Months):")
print(f"  Alaska & Hawaiian Airlines (3x): ${ak_spend:,.2f}  ({totals['ak_pts']:,.0f} bonus pts)")
print(f"  Foreign Transactions (3x):       ${foreign_spend:,.2f}")
print(f"  Eligible Dining (3x):            ${dining_spend:,.2f}  (Total Foreign/Dining Bonus pts: {totals['fd_pts']:,.0f})")
print(f"  All Other Purchases (1x):        ${other_spend:,.2f}")
print(f"  Total Purchases:                 ${totals['purchases']:,.2f}")

print(f"\nInterpolated Full Year (12 Months):")
print(f"  Alaska & Hawaiian Airlines (3x): ${ak_spend * factor:,.2f}/yr")
print(f"  Foreign Transactions (3x):       ${foreign_spend * factor:,.2f}/yr")
print(f"  Eligible Dining (3x):            ${dining_spend * factor:,.2f}/yr")
print(f"  All Other Purchases (1x):        ${other_spend * factor:,.2f}/yr")
print(f"  Total Annual Spend:              ${totals['purchases'] * factor:,.2f}/yr")
