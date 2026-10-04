# Credit Card ROI & Renewal Analyzer

An interactive web application and quantitative modeling tool to evaluate credit card annual fees versus recurring perks, statement credits, spend multiplier edges, and opportunity costs against baseline cards.

## Features

- **Multi-Card Support**: Switch between modeled cards (Bank of America Atmos Summit, Atmos Ascent, Citi Strata Elite, etc.) via dynamic registry.
- **Valuation Breakdown**:
  - Face value vs. haircut/assumed valuation for statement credits and travel perks.
  - Organic baseline comparison (e.g. Blacklane net savings vs standard rideshare).
  - Opportunity cost vs. everyday 2X / baseline cards.
- **Interactive Modeling**: Adjust annual spend amounts by category and toggle relationship perks (e.g., Citigold credit) to recalculate net keeper value and renewal verdicts in real time.
- **Statement Ingestion**: CLI tooling under `tools/` to parse and classify card statement exports.

## Getting Started

Open `index.html` directly in any modern web browser:
```powershell
# Open locally
Start-Process "index.html"
```

## Repository Structure

- `index.html`: Main interactive single-page dashboard.
- `app.js` & `styles.css`: Dashboard logic, state management, and styling.
- `cards-registry.js`: Central registry of available card models and configs.
- `<card-slug>/`: Card-specific configurations, data models, and markdown analyses.
- `tools/`: Data processing scripts for statement classification and card creation.
- `templates/`: Boilerplates for adding new card models.

## Development & Syncing

Primary development is maintained in `C:\dev\labs\credit-card-roi`.

To push changes to the shared GitHub repository ([shipunicorn/labs_shared](https://github.com/shipunicorn/labs_shared)):
```powershell
git push-shared
```
*(Runs `git subtree push --prefix=credit-card-roi labs-shared main` under the hood).*
