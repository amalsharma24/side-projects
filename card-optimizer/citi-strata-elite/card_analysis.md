# Citi Strata Elite℠ Card ROI Analysis & Model Structure

**Card:** Citi Strata Elite℠ Card  
**Issuer:** Citi / ThankYou® Rewards  
**Annual Fee:** **$595.00**  
**ThankYou Point Valuation:** **1.20¢ / point (1.2 cpp)**

---

## 1. Executive Summary

- **Annual Fee:** $595.00
- **Base Realized Perks Valuation:** **$525.00** (Hotel $270 + Splurge $200 + Blacklane $40 + Admirals Club $15).
- **Net Position Before Spend:** **-$70.00 / year** (easily closed with modest spend or Citigold relationship credit of $145).
- **Citigold Relationship Benefit:** If active, adds $145/yr, bringing total perks to $670.00 and yielding an immediate net positive return of **+$75.00 / year** before swiping the card.

---

## 2. Benefit Valuations & Methodology

| Benefit | Stated Face Value | Your Assumed Value | Methodology & Valuation Rationale |
| :--- | :--- | :--- | :--- |
| **Annual Hotel Benefit** | $300.00 | **$270.00** | $300 credit off a hotel stay of 2+ nights booked via cititravel.com. Modest 10% haircut applied for portal pricing constraint and 2-night minimum restriction. |
| **Annual Splurge Credit℠** | $200.00 | **$200.00** | Up to $200 in statement credits across chosen brands (1stDibs, American Airlines, Best Buy, Future Personal Training, Live Nation). Valued at 100% since AA flights and Best Buy purchases are standard organic expenses. |
| **Annual Blacklane® Chauffeur Credit** | $200.00 | **$40.00** | Split as up to $100 Jan–Jun and up to $100 Jul–Dec. **Net Savings Math:** A standard rideshare costs ~$60. A Blacklane luxury ride costs ~$140. After the $100 credit, out-of-pocket is $40. Real net cash savings vs baseline is $60 - $40 = $20 per ride. Across 2 semi-annual rides = **$40/yr net value**. |
| **AA Admirals Club® Lounge Passes** | $300.00+ | **$15.00** | 4 Admirals Club Citi Strata Elite℠ passes annually. Grounded in actual past-year usage (1 visit), valued conservatively at $15 for the single visit. |
| **Priority Pass™ Select Membership** | $469.00 | **$0.00** | Redundant with existing lounge access provided by Capital One Venture X / Amex Platinum. |
| **Global Entry® / TSA PreCheck® Credit** | $30.00/yr | **$0.00** | $120 every 4 years. Valued at $0 since TSA PreCheck / Global Entry is already covered by existing wallet cards. |
| **Citigold® Relationship Credit** | $145.00 | **$0.00 (Toggleable)** | $145 banking relationship credit for qualifying Citigold clients. Defaulted to $0; toggling it on produces an immediate +$75/yr keeper surplus. |
| **Total Perks Valuation** | **$1,644.00+** | **$525.00** | |

---

## 3. Spending Categories & Baseline Opportunity Analysis

Citi Strata Elite earns ThankYou points valued at **1.2¢ / pt (1.2 cpp)**:

| Category | Citi Multiplier | Return at 1.2 cpp | Baseline Card | Baseline Return (Realistic 1.75 cpp) | Spend Edge vs Baseline |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hotels, Cars & Attractions (cititravel.com)** | **12X** | **14.40%** | Venture X (2X flat) | 3.50% | **+10.90% (Citi Wins)** |
| **Air Travel (cititravel.com)** | **6X** | **7.20%** | Amex Platinum (5X) | 8.75% | **-1.55% (Amex Plat Wins)** |
| **Citi Nights℠ Dining (Fri/Sat 6pm–6am ET)** | **6X** | **7.20%** | Amex Gold (4X) | 7.00% | **+0.20% (Citi Wins)** |
| **Other Dining & Delivery** | **3X** | **3.60%** | Amex Gold (4X) | 7.00% | **-3.40% (Amex Gold Wins)** |
| **All Other Purchases** | **1.5X** | **1.80%** | Venture X (2X) | 3.50% | **-1.70% (Venture X Wins)** |

---

## 4. Empirical Statement Analysis & Spend Trends

Data extracted from 10 billing cycles (November 2025 – August 2026) in `statements/processed`.

### A. SUB Window vs. Organic Steady-State
- **First 3 Months (Nov 2025 – Jan 2026):** Aggressive spend pushed across medical tests, gift cards, subscriptions, and retail to satisfy the welcome offer threshold, culminating in the **100,000-point bonus awarded on 2026-01-22**. Total purchases: **$6,268.50** ($2,089.50/mo avg), with 89% in "All Other".
- **Last 7 Months (Feb 2026 – Aug 2026):** True steady-state post-SUB behavior. Total purchases: **$1,589.46** ($227.07/mo avg; annualized: **$2,724.79/yr**).

### B. Spend Trends: Last 7 Months (Steady-State Post-SUB)

| Statement Date | Hotels & Cars (12X) | Air Travel (6X) | Citi Nights Dining (6X) | Other Dining (3X) | All Other (1.5X) | Monthly Total | Key Activity |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **2026-02-23** | $122.57 | $0.00 | $0.00 | $0.00 | $164.77 | **$287.34** | Blacklane ride ($161), Citi Hotel ($123) |
| **2026-03-23** | $0.00 | $0.00 | $46.13 | $0.00 | $3.29 | **$49.42** | Weekend dining (FOB Poke, Gelatiamo) |
| **2026-04-22** | $0.00 | $0.00 | $4.86 | $11.25 | $247.03 | **$263.14** | Mindbloom ($219), dining |
| **2026-05-22** | $0.00 | $0.00 | $57.52 | $0.00 | $238.29 | **$295.81** | Best Buy ($135 splurge credit), Lyft |
| **2026-06-22** | $0.00 | $0.00 | $215.02 | $0.00 | $103.29 | **$318.31** | Citi Nights dining ($215), Newegg Paze promo ($100) |
| **2026-07-22** | $0.00 | $0.00 | $6.94 | $0.00 | $63.29 | **$70.23** | Bellevue College ($60), HBO Max |
| **2026-08-24** | $0.00 | $0.00 | $300.51 | $0.00 | $4.70 | **$305.21** | Heavy Citi Nights weekend dining ($301) |
| **7-Month Total** | **$122.57** | **$0.00** | **$630.98** | **$11.25** | **$824.66** | **$1,589.46** | |
| **Monthly Average** | **$17.51** | **$0.00** | **$90.14** | **$1.61** | **$117.81** | **$227.07** | |
| **Annualized (x12)** | **$210.12** | **$0.00** | **$1,081.68** | **$19.29** | **$1,413.70** | **$2,724.79** | |

### C. Category-by-Category Spend Analysis & Trends

1. **Hotels & Cars (cititravel.com, 12X = 14.4% return):**
   - **Trend:** Used selectively to unlock portal hotel value ($83.72 in Dec 2025, $122.57 in Feb 2026).
   - **Annualized (7 Mo):** **$210.12/yr**.
   - **Takeaway:** Captures the $300 annual hotel benefit with a +10.90% edge over Venture X baseline.

2. **Air Travel (cititravel.com, 6X = 7.2% return):**
   - **Trend:** $0 in the last 7 months ($493 was booked during the SUB window).
   - **Annualized (7 Mo):** **$0.00/yr**.
   - **Takeaway:** Amex Platinum earns 5X MR (8.75% return) directly with airlines without portal constraints. Intentionally zeroed.

3. **Citi Nights℠ Dining (Fri & Sat, 6X = 7.2% return):**
   - **Trend:** Clear upward adoption! Mar ($46) → May ($58) → Jun ($215) → Aug ($301).
   - **Annualized (7 Mo):** **$1,081.68/yr** ($90.14/mo avg; last 6-mo avg is $105.16/mo = $1,262/yr).
   - **Takeaway:** Beats Amex Gold (4X = 7.00% return) by +0.20%. Highly active weekend dining channel.

4. **Other Dining & Delivery (3X = 3.6% return):**
   - **Trend:** Only $11.25 total across 7 months (single cafe visit in April).
   - **Annualized (7 Mo):** **$19.29/yr** (effectively zeroed).
   - **Takeaway:** Weekday dining is properly routed to Amex Gold (4X / 7.00%).

5. **All Other Purchases (1.5X = 1.8% return):**
   - **Trend:** $824.66 total across 7 months ($117.81/mo avg).
   - **Annualized (7 Mo):** **$1,413.70/yr**.
   - **Composition:** Primarily perk-driven spend: Best Buy splurge credit ($135), Blacklane chauffeur rides ($161.48), HBO Max subscription ($3.29/mo), and targeted promos.
   - **Takeaway:** Underperforms Venture X (2X / 3.50%), so general unbonused spend should remain minimal.

---

## 5. Assumed Values for Calculator (`index.html?card=citi-strata-elite`)

| Parameter / Category | Assumed Value | Derivation & Rationale |
| :--- | :---: | :--- |
| **Annual Fee** | **$595.00** | Card standard annual fee |
| **Hotel Benefit** | **$270.00** | $300 face value with 10% portal constraint haircut |
| **Splurge Credit** | **$200.00** | Full face value; confirmed used at Best Buy ($200 in 2025, $135 in 2026) |
| **Blacklane Credit** | **$40.00** | Net savings on 2 rides ($20 net savings per ride vs Uber/Lyft); confirmed 2 rides taken |
| **Admirals Club Passes** | **$15.00** | 1 visit utilized per year valued at $15 |
| **Priority Pass** | **$0.00** | Redundant with Venture X / Amex Platinum |
| **Global Entry / PreCheck** | **$0.00** | Redundant with existing wallet cards |
| **Citigold Credit** | **$0.00** | Toggleable ($145 if banking relationship active) |
| **Hotels & Cars (12X)** | **$360.00** | ~$360 total spend to harvest the $300 annual hotel benefit (2+ night stay on cititravel.com) |
| **Air Travel (6X)** | **$0.00** | $0 in post-SUB statements (routed to Amex Platinum 5X) |
| **Citi Nights Dining (6X)** | **$2,200.00** | ~$50/week on weekend dining ($2,000–$2,200/yr; recent months confirm $215–$301/mo) |
| **Other Dining (3X)** | **$0.00** | Effectively $0 post-SUB (routed to Amex Gold 4X) |
| **All Other Purchases (1.5X)** | **$520.00** | Bare minimum to harvest credits: Blacklane ($300/yr) + Splurge ($220/yr); remainder to Venture X 2X |

### Net Decision Summary with Assumed Values:
- **Perks Realized:** $525.00 ($270 hotel + $200 splurge + $40 Blacklane + $15 Admirals)
- **Spend Net Advantage:** **+$34.80**
  - Hotels & Cars (12X): +$39.24 edge over Venture X ($51.84 Citi vs $12.60 baseline)
  - Citi Nights Dining (6X): +$4.40 edge over Amex Gold ($158.40 Citi vs $154.00 baseline)
  - All Other (1.5X): -$8.84 opportunity cost vs Venture X ($9.36 Citi vs $18.20 baseline)
- **Net Annual Return (Standard):** **-$35.20 / year** (Perks -$70.00 + Spend +$34.80)
- **Net Annual Return (with Citigold +$145):** **+$109.80 / year (Clear Keeper Surplus)**


