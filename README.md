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

---

## What Was Set Up

1. **Remote Repository**:
   - Private GitHub repository created at [shipunicorn/labs_shared](https://github.com/shipunicorn/labs_shared).
   - Write access collaborator invitation sent to `amalsharma24`.
   - Linked as git remote `labs-shared` in the primary `C:\dev\labs` repository.

2. **Git Subtree Workflow**:
   - `credit-card-roi` is maintained inside the monorepo at `C:\dev\labs\credit-card-roi`.
   - Configured local Git aliases in `C:\dev\labs` to seamlessly push and pull from `labs_shared`:
     - `git push-shared`: pushes subtree commits from `credit-card-roi` to `labs_shared:main`.
     - `git pull-shared`: pulls incoming commits from `labs_shared:main` into `credit-card-roi`.
   - Both aliases run with `!git subtree ...`, allowing them to be executed either from the root `C:\dev\labs` or directly inside `C:\dev\labs\credit-card-roi`.

3. **Privacy & PII Protection**:
   - Raw statement exports (`statements/raw/*.pdf`) are gitignored in the parent repository and never pushed to GitHub.

---

## Your Daily Workflow Going Forward

### For the Owner (Editing in `C:\dev\labs\credit-card-roi`)
Always perform your edits in your primary working directory at `C:\dev\labs\credit-card-roi`:

1. **Make changes and commit to `labs`**:
   ```powershell
   cd C:\dev\labs\credit-card-roi
   # Make edits to files...
   git add .
   git commit -m "feat: describe your change"
   ```

2. **Push updates to `labs_shared`**:
   ```powershell
   git push-shared
   ```
   *(Pushes the changes to https://github.com/shipunicorn/labs_shared on GitHub).*

3. **Pull collaborator updates (if any)**:
   ```powershell
   git pull-shared
   ```

### For Collaborators (`amalsharma24`)
Collaborators clone and work with `labs_shared` as a normal, standalone repository:

1. **Clone the repository**:
   ```powershell
   git clone https://github.com/shipunicorn/labs_shared.git
   cd labs_shared
   ```

2. **Run and edit**:
   - Open `index.html` in browser.
   - Commit and push to `main` (or a feature branch and pull request) using standard git commands:
     ```powershell
     git add .
     git commit -m "feat: describe change"
     git push origin main
     ```
