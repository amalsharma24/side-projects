# 🧪 Labs Shared Repository

A collection of interactive decision engines, quantitative financial modeling tools, and optimization dashboards.

---

## 🗂 Sub-Project Modules

### 1. 💳 [Credit Card ROI & Renewal Optimizer](card-optimizer/README.md) (`card-optimizer/`)
An interactive quantitative modeling tool to evaluate credit card annual fees versus recurring perks, statement credits, spend multiplier edges, and organic baseline opportunity costs.

- **Dashboard**: `card-optimizer/index.html`
- **Supported Cards**: Bank of America Atmos Summit, Atmos Ascent, Citi Strata Elite, Amex Gold, etc.
- **Documentation**: See [`card-optimizer/README.md`](card-optimizer/README.md)

---

### 📦 [Lease & Move Optimum Decision Engine](lease-move-optimizer/README.md) (`lease-move-optimizer/`)
An interactive, live-calibrated decision web application designed to evaluate 3D revenue matrices (**Lease Sign Date × Move-In Date × Lease Term**) and identify mathematically optimal move strategies when transitioning from an existing lease.

- **Dashboard**: `lease-move-optimizer/index.html`
- **Key Features**:
  - Live price drift calibration & freeze window detection
  - Net rate differential analysis anchored to Recommended Optimum
  - Multi-community standardized onboarding CLI (`python3 tools/new_apartment.py`)
- **Documentation**: See [`lease-move-optimizer/README.md`](lease-move-optimizer/README.md)

---

## 🚀 Quick Start

Open any module's dashboard directly in your web browser:

```bash
# Credit Card ROI Dashboard
open card-optimizer/index.html

# Lease Move Optimizer Dashboard
open lease-move-optimizer/index.html
```
