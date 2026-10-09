# 📦 Move & Lease Optimum Decision Engine

An interactive, live-calibrated decision web application designed to evaluate dual-variable revenue matrices (**Lease Sign Date × Move-In Date × Lease Term**) and identify the mathematically optimal move strategy when transitioning from a current lease.

---

## ⏰ Current Lease Baseline Parameters

- **Current Lease Expiration Date**: `November 2nd, 2026`
- **Current Rent**: `$4,500 / mo` (`$150.00 / day` overlap rate)
- **Month-to-Month (M2M) Rent**: `$3,700 / mo` (`$123.33 / day` penalty if moving after Nov 2nd)
- **Packers & Movers Quote**: `$2,000` (`+$150` weekend surcharge on Sat/Sun)

---

## 🚀 Quick Start

Launch the web app directly in your system web browser:

```bash
open index.html
```

---

## 🏢 How to Add a New Apartment Unit (Standardized Process for Any Community)

The decision engine uses a **single, consistent process** to register any apartment unit from any community (*Modera, Equity Residential, Prometheus, Greystar, Essex, Fairfield, Avalon, or independent landlords*).

### ⚡ Standard 1-Line CLI Command

Run this command from your terminal (leave `--rent`, `--freeze-days`, and `--drift-rate` blank so the model analyzes the pricing trend automatically):

```bash
python3 tools/new_apartment.py \
  --id wa027-502 \
  --name "Avalon Esterra Park - Unit 502" \
  --community "Avalon Esterra Park" \
  --details "2 Bed / 2 Bath (1,300 sq ft)" \
  --url "https://www.avaloncommunities.com/..."
```

### 📋 How Blank Parameter Trend Calculation Works:

- `--rent` (or `--base-rent`): *Left blank* $\rightarrow$ Model inspects the price array and sets Base Rent to $\min(\text{Prices})$.
- `--freeze-days`: *Left blank* $\rightarrow$ Model counts exact consecutive dates at base rent to find the exact Freeze Window.
- `--drift-rate`: *Left blank* $\rightarrow$ Model calculates the exact linear slope ($\$/\text{day}$) across post-freeze move-in dates.

> 🔍 **No Hardcoded Defaults**: There are **zero hardcoded fallback numbers** (no artificial 7 days or \$10/day). If left blank, the model evaluates 100% of the parameters dynamically from empirical trend data! You only specify explicit values if you want to perform a manual override test.

---

### 📝 Method 2: Manual Registration

Edit `APARTMENTS` inside [`extract_predictive_matrix.py`](extract_predictive_matrix.py):

```python
APARTMENTS = [
    {
        "id": "wa027-502",
        "name": "Avalon Esterra Park - Unit 502",
        "community": "Avalon Esterra Park",
        "unitNumber": "502",
        "details": "2 Bed / 2 Bath (1,300 sq ft)",
        "special": "Apply by 10-15 for 2 months off!",
        "url": "https://www.avaloncommunities.com/...",
        "hasSpecial": True
    }
]
```

Then run the extraction script:

```bash
python3 extract_predictive_matrix.py
```

---

## 🤖 Dynamic Model Calibration (Live Refreshes)

The engine automatically calibrates dynamic market parameters on every refresh:

1. **`baseAnchorPrice`**: Absolute minimum base rent for immediate move-ins today.
2. **`freezeDays`**: Exact count of consecutive move-in dates locked at the flat anchor price.
3. **`driftRate`**: Slope ($\$/\text{day}$) of linear rate increase for move-in dates past the freeze window.
4. **`anchorDelta`**: Shift in base anchor price compared to yesterday's baseline.

To perform a daily refresh and view Today vs. Yesterday calibration deltas:

```bash
python3 analyze_today_vs_yesterday.py
```

---

## 📊 Web Application Architecture

- **`index.html`**: Dual-View responsive interface (View 1: Single Unit Deep Dive | View 2: Cross-Apartment Comparison).
- **`styles.css`**: Modern Slate/Indigo dark-mode design system.
- **`app.js`**: Reactive sorting engine, real-time KPI card evaluator, Lease Term Differential analysis (anchored strictly to the active Recommended Optimum), and live parameter calibration overrides.
- **`extract_predictive_matrix.py`**: Live pricing fetcher and 3D revenue matrix generator.
- **`tools/new_apartment.py`**: 1-command unit scaffolding CLI tool.
