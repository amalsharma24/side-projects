#!/usr/bin/env python3
"""
Standardized CLI Tool to add ANY apartment unit to the Lease & Move Optimizer engine.

Usage Example (Model dynamically calculates freeze days & drift rate from trend data):
    python3 tools/new_apartment.py \
      --id modera-312 \
      --name "Modera Redmond - Unit 312" \
      --community "Modera Redmond" \
      --details "2 Bed / 2 Bath (1,280 sq ft)" \
      --url "https://..."
"""

import os
import sys
import argparse
import re
import subprocess

def main():
    parser = argparse.ArgumentParser(description="Add a new apartment unit to the predictive dataset.")
    parser.add_argument("--id", required=True, help="Unique unit ID (e.g. modera-312, wa027-502)")
    parser.add_argument("--name", required=True, help="Display Name (e.g. Modera Redmond - Unit 312)")
    parser.add_argument("--community", required=True, help="Community Name (e.g. Modera Redmond, Avalon Esterra)")
    parser.add_argument("--details", default="2 Bed / 2 Bath", help="Details string (e.g. 2 Bed / 2 Bath (1,280 sq ft))")
    parser.add_argument("--rent", "--base-rent", type=float, default=None, help="Base Rent / Anchor Price today (optional - auto-calculated if omitted)")
    parser.add_argument("--freeze-days", type=int, default=None, help="Freeze Window days (optional - auto-calculated if omitted)")
    parser.add_argument("--drift-rate", type=float, default=None, help="Lead-time drift rate $/day (optional - auto-calculated if omitted)")
    parser.add_argument("--special", default="Standard Pricing", help="Special offer description")
    parser.add_argument("--has-special", action="store_true", help="Set flag if promo special applies")
    parser.add_argument("--url", default="", help="Listing URL (optional)")
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    matrix_script = os.path.join(base_dir, "extract_predictive_matrix.py")

    with open(matrix_script, "r", encoding="utf-8") as f:
        content = f.read()

    new_apt_dict = {
        "id": args.id,
        "name": args.name,
        "community": args.community,
        "unitNumber": args.id.split("-")[-1],
        "details": args.details,
        "baseAnchorPrice": args.rent,
        "freezeDays": args.freeze_days,
        "driftRate": args.drift_rate,
        "special": args.special,
        "hasSpecial": args.has_special or ("2 months" in args.special.lower()),
        "url": args.url
    }

    # Inject into APARTMENTS array
    if f'"id": "{args.id}"' in content:
        print(f"Unit {args.id} is already registered in extract_predictive_matrix.py!")
    else:
        pattern = r'(APARTMENTS\s*=\s*\[)'
        replacement = r'\1\n    ' + str(new_apt_dict).replace("True", "True").replace("False", "False") + ','
        content = re.sub(pattern, replacement, content)
        with open(matrix_script, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Successfully added {args.name} ({args.community}) to extract_predictive_matrix.py!")

    print("\nRunning live calibration & dataset extraction for all units...")
    subprocess.run([sys.executable, matrix_script], cwd=base_dir)
    print("\nDone! Open index.html in your browser to view the updated options.")

if __name__ == '__main__':
    main()

