#!/usr/bin/env python3
"""
Scaffold a new credit card analysis subfolder.
Usage:
    python tools/new_card.py <card_slug> --name "Card Display Name" --fee 95
"""
import os
import sys
import argparse
import shutil

def main():
    parser = argparse.ArgumentParser(description="Scaffold a new card subfolder.")
    parser.add_argument("card_slug", help="Folder slug for the card (e.g. amex-gold, chase-sapphire-reserve)")
    parser.add_argument("--name", default=None, help="Display name of the card")
    parser.add_argument("--fee", type=int, default=95, help="Default annual fee (default: 95)")
    args = parser.parse_args()

    slug = args.card_slug.strip().lower().replace(' ', '-')
    card_name = args.name or slug.replace('-', ' ').title()

    base_lab_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dir = os.path.join(base_lab_dir, slug)

    if os.path.exists(target_dir):
        print(f"Error: Directory {target_dir} already exists.")
        sys.exit(1)

    # Create directory structure
    os.makedirs(os.path.join(target_dir, "statements", "raw"), exist_ok=True)
    os.makedirs(os.path.join(target_dir, "statements", "processed"), exist_ok=True)

    # Create card-data.js from template
    template_data_path = os.path.join(base_lab_dir, "templates", "card-data.template.js")
    if os.path.exists(template_data_path):
        with open(template_data_path, "r", encoding="utf-8") as fp:
            content = fp.read()
        content = content.replace("TEMPLATE_CARD_NAME", card_name)
        content = content.replace("TEMPLATE_ANNUAL_FEE", str(args.fee))
        with open(os.path.join(target_dir, "card-data.js"), "w", encoding="utf-8") as fp:
            fp.write(content)
    else:
        print("Notice: templates/card-data.template.js not found, skipping template copy.")

    # Create standalone index.html linking to root assets
    index_html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=../index.html?card={slug}">
  <title>{card_name} ROI Analyzer</title>
</head>
<body>
  <p>Loading {card_name} ROI Analyzer... <a href="../index.html?card={slug}">Click here if not redirected</a>.</p>
</body>
</html>
"""
    with open(os.path.join(target_dir, "index.html"), "w", encoding="utf-8") as fp:
        fp.write(index_html_content)

    print(f"Successfully scaffolded new card directory at: {target_dir}")
    print(f"Created:")
    print(f"  - {slug}/card-data.js")
    print(f"  - {slug}/index.html")
    print(f"  - {slug}/statements/raw/")
    print(f"  - {slug}/statements/processed/")
    print(f"\nNext steps:")
    print(f"  1. Register the card in cards-registry.js")
    print(f"  2. Customize {slug}/card-data.js with multipliers and benefits.")

if __name__ == '__main__':
    main()
