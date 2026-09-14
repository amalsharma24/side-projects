// Credit Card Renewal ROI Engine & Reactive UI Controller

(function () {
  // Application State
  const state = {
    mode: 'renewal', // 'renewal' or 'year_one'
    annualFee: CARD_CONFIG.defaultAnnualFee,
    pointValuationCents: CARD_CONFIG.pointValuationCents,
    bofaBonusActive: false, // Disabled by default per user request
    activePreset: 'my_actual',
    
    // Benefit values & toggles
    benefits: {},
    
    // Spend values (Annual)
    annualSpend: {}
  };

  // Initialize state with default preset
  function initStateFromPreset(presetKey) {
    const preset = CARD_CONFIG.presets[presetKey] || CARD_CONFIG.presets.my_actual;
    state.activePreset = presetKey;
    state.annualFee = preset.annualFee;
    state.bofaBonusActive = preset.bofaBonus;
    
    // Sync BofA bonus checkbox in UI
    const bofaToggle = document.getElementById('toggle-bofa-bonus');
    if (bofaToggle) {
      bofaToggle.checked = state.bofaBonusActive;
    }
    
    // Init benefits
    CARD_CONFIG.benefits.forEach(b => {
      const isConfigured = preset.benefits.hasOwnProperty(b.id);
      const val = isConfigured ? preset.benefits[b.id] : b.defaultValue;
      
      state.benefits[b.id] = {
        enabled: val > 0 || (b.id === 'spend_tier_60k_companion' && preset.hit60kSpend),
        userValue: val,
        customized: false
      };
    });

    // Init annual spend
    CARD_CONFIG.spendCategories.forEach(cat => {
      state.annualSpend[cat.id] = (preset.annualSpend && preset.annualSpend[cat.id] !== undefined) 
        ? preset.annualSpend[cat.id] 
        : cat.defaultAnnualSpend;
    });
  }

  // Core ROI Calculation
  function calculateMetrics() {
    // 1. Calculate Perks & Credits
    let totalPerksValue = 0;
    CARD_CONFIG.benefits.forEach(b => {
      const item = state.benefits[b.id];
      if (item && item.enabled) {
        totalPerksValue += Number(item.userValue) || 0;
      }
    });

    // 2. If in Year 1 mode, add welcome bonus
    let welcomeBonusValue = 0;
    if (state.mode === 'year_one') {
      const wb = CARD_CONFIG.yearOneWelcomeOffer;
      // 80,000 points + 25,000 point companion award
      const totalWelcomePoints = wb.bonusPoints + wb.companionAwardPoints;
      welcomeBonusValue = (totalWelcomePoints * (state.pointValuationCents / 100));
      totalPerksValue += welcomeBonusValue;
    }

    // 3. Calculate Spend Points & Incremental Return vs Baseline Wallet Cards
    let totalAnnualSpend = 0;
    let totalPointsEarned = 0;
    let totalAtmosSpendValue = 0;
    let totalBaselineWalletValue = 0;
    const bonusMultiplier = state.bofaBonusActive ? 1.10 : 1.0;

    const categoryBreakdowns = CARD_CONFIG.spendCategories.map(cat => {
      const annualCatSpend = Number(state.annualSpend[cat.id]) || 0;
      totalAnnualSpend += annualCatSpend;

      const effectiveMultiplier = cat.multiplier * bonusMultiplier;
      const pts = annualCatSpend * effectiveMultiplier;
      totalPointsEarned += pts;

      const atmosReturnPct = effectiveMultiplier * state.pointValuationCents;
      const atmosVal = pts * (state.pointValuationCents / 100);
      totalAtmosSpendValue += atmosVal;

      const baselineRatePct = cat.baselineRatePct || 4.0;
      const baselineVal = annualCatSpend * (baselineRatePct / 100);
      totalBaselineWalletValue += baselineVal;

      const diffVsBaseline = atmosVal - baselineVal;

      return {
        ...cat,
        annualSpend: annualCatSpend,
        effectiveMultiplier,
        pts: Math.round(pts),
        atmosReturnPct,
        atmosVal,
        baselineRatePct,
        baselineVal,
        diffVsBaseline
      };
    });

    const spendRewardsDollarVal = totalAtmosSpendValue;
    const incrementalSpendAdvantage = totalAtmosSpendValue - totalBaselineWalletValue;

    // 4. Net ROI
    const netAnnualValue = (totalPerksValue + spendRewardsDollarVal) - state.annualFee;
    const netValueOverBaseline = (totalPerksValue + incrementalSpendAdvantage) - state.annualFee;

    return {
      annualFee: state.annualFee,
      totalPerksValue,
      welcomeBonusValue,
      totalAnnualSpend,
      totalPointsEarned: Math.round(totalPointsEarned),
      spendRewardsDollarVal,
      totalBaselineWalletValue,
      incrementalSpendAdvantage,
      netAnnualValue,
      netValueOverBaseline,
      categoryBreakdowns
    };
  }

  // Render Functions
  function renderAll() {
    const metrics = calculateMetrics();
    renderVerdict(metrics);
    renderKPICards(metrics);
    renderProgressBar(metrics);
    renderBenefitsList();
    renderSpendSimulator(metrics);
    renderComparisonTable(metrics);
  }

  function renderVerdict(metrics) {
    const verdictPill = document.getElementById('verdict-pill');
    const verdictAmount = document.getElementById('verdict-amount');
    const verdictText = document.getElementById('verdict-explanation');

    const netBaseline = Math.round(metrics.netValueOverBaseline);
    const nominalNet = Math.round(metrics.netAnnualValue);
    const formattedBaseline = (netBaseline >= 0 ? '+$' : '-$') + Math.abs(netBaseline).toLocaleString();
    const formattedNominal = (nominalNet >= 0 ? '+$' : '-$') + Math.abs(nominalNet).toLocaleString();

    // Primary verdict displays true opportunity-adjusted net position
    verdictAmount.textContent = formattedBaseline;
    verdictAmount.className = 'verdict-amount ' + (netBaseline >= 100 ? 'positive' : netBaseline >= 0 ? 'neutral' : 'negative');

    if (state.mode === 'year_one') {
      verdictPill.className = 'verdict-pill renew';
      verdictPill.textContent = 'STRONG KEEP / APPLY';
      verdictText.textContent = `Year 1 includes the 80,000 point bonus + 25,000 companion award ($${Math.round(metrics.welcomeBonusValue)} value), delivering a +$${nominalNet.toLocaleString()} return.`;
    } else {
      const flightLoss = Math.round(metrics.categoryBreakdowns.find(c => c.id === 'alaska_hawaiian')?.diffVsBaseline || 0);
      const foreignGain = Math.round(metrics.categoryBreakdowns.find(c => c.id === 'foreign_tx')?.diffVsBaseline || 0);
      const spendAdv = Math.round(metrics.incrementalSpendAdvantage);

      if (netBaseline >= 0) {
        verdictPill.className = 'verdict-pill renew';
        verdictPill.textContent = 'RENEW (NET POSITIVE)';
        verdictText.textContent = `Your guaranteed perks ($${Math.round(metrics.totalPerksValue)}) and net spend edge (${spendAdv >= 0 ? '+$' + spendAdv : '-$' + Math.abs(spendAdv)}) exceed the $${metrics.annualFee} fee by ${formattedBaseline}/year vs. using your existing cards.`;
      } else {
        verdictPill.className = 'verdict-pill cancel';
        verdictPill.textContent = 'CANCEL OR DOWNGRADE';
        verdictText.textContent = `You are running a net deficit of ${formattedBaseline}/year vs. your benchmark wallet. You pay an unavoidable -$${Math.abs(flightLoss)} penalty on Alaska flights to unlock the $270 bag perk, partially offset by +$${foreignGain} on foreign spend. With a $0 companion award, this card loses money. Downgrading to the $95 card is recommended.`;
      }
    }
  }

  function renderKPICards(metrics) {
    document.getElementById('kpi-annual-fee').textContent = `$${metrics.annualFee}`;
    document.getElementById('kpi-total-benefits').textContent = `$${Math.round(metrics.totalPerksValue).toLocaleString()}`;
    
    const spendAdv = Math.round(metrics.incrementalSpendAdvantage);
    document.getElementById('kpi-spend-rewards').textContent = `${spendAdv >= 0 ? '+$' + spendAdv : '-$' + Math.abs(spendAdv)}`;
    
    const incBadge = document.getElementById('kpi-spend-inc');
    incBadge.textContent = `Net vs Amex Plat & Venture X`;
    incBadge.style.color = spendAdv >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
  }

  function renderProgressBar(metrics) {
    const netEffectiveVal = Math.max(0, metrics.totalPerksValue + metrics.incrementalSpendAdvantage);
    const maxScale = Math.max(netEffectiveVal, metrics.annualFee) * 1.25 || 500;

    const perksPct = Math.min(100, (metrics.totalPerksValue / maxScale) * 100);
    const feeMarkerPct = Math.min(99, (metrics.annualFee / maxScale) * 100);

    const barPerks = document.getElementById('bar-perks');
    const barSpend = document.getElementById('bar-spend');
    const marker = document.getElementById('bar-fee-marker');

    barPerks.style.width = `${Math.min(100, (netEffectiveVal / maxScale) * 100)}%`;
    barSpend.style.width = `0%`;
    marker.style.left = `${feeMarkerPct}%`;

    document.getElementById('bar-label-total').textContent = `Net Realized Return: $${Math.round(netEffectiveVal).toLocaleString()}`;
    document.getElementById('bar-label-fee').textContent = `Annual Fee: $${metrics.annualFee}`;
  }

  function renderBenefitsList() {
    const container = document.getElementById('benefits-list-container');
    container.innerHTML = '';

    CARD_CONFIG.benefits.forEach(b => {
      const itemState = state.benefits[b.id] || { enabled: true, userValue: b.defaultValue };
      const row = document.createElement('div');
      row.className = `benefit-item ${itemState.enabled ? '' : 'disabled'}`;
      row.id = `benefit-row-${b.id}`;

      let controlsHtml = '';
      if (b.id === 'lounge_passes') {
        const passes = Math.round(itemState.userValue / 15);
        controlsHtml = `
          <div class="slider-wrapper">
            <span style="font-size:12px; color:var(--text-muted);">Passes Used:</span>
            <input type="range" min="0" max="8" step="1" value="${passes}" data-benefit="${b.id}" class="lounge-slider">
            <span class="slider-readout">${passes} of 8 (${passes > 0 ? '$' + (passes * 15) : '$0'})</span>
          </div>
        `;
      } else if (b.id === 'checked_bags') {
        const flights = Math.round(itemState.userValue / 45);
        controlsHtml = `
          <div class="slider-wrapper">
            <span style="font-size:12px; color:var(--text-muted);">Flights with Checked Bag:</span>
            <input type="range" min="0" max="12" step="1" value="${flights}" data-benefit="${b.id}" class="bags-slider">
            <span class="slider-readout">${flights} flights ($${itemState.userValue})</span>
          </div>
        `;
      } else if (b.id === 'same_day_change') {
        const changes = Math.round(itemState.userValue / 75);
        controlsHtml = `
          <div class="slider-wrapper">
            <span style="font-size:12px; color:var(--text-muted);">Flight Changes/yr:</span>
            <input type="range" min="0" max="4" step="1" value="${changes}" data-benefit="${b.id}" class="sameday-slider">
            <span class="slider-readout">${changes} change(s)</span>
          </div>
        `;
      } else {
        // Direct value input slider / toggle
        const maxRange = Math.max(b.faceValue * 1.2, 500);
        controlsHtml = `
          <div class="slider-wrapper">
            <span style="font-size:12px; color:var(--text-muted);">Your Valuation:</span>
            <input type="range" min="0" max="${maxRange}" step="10" value="${itemState.userValue}" data-benefit="${b.id}" class="generic-slider">
            <span class="slider-readout">$${itemState.userValue}</span>
          </div>
        `;
      }

      row.innerHTML = `
        <div class="benefit-top">
          <div class="benefit-info">
            <div class="benefit-title">
              ${b.title}
              <span class="benefit-category-tag">${b.category}</span>
            </div>
            <div class="benefit-desc">${b.description}</div>
            <div style="font-size:11.5px; color:var(--text-subtle); margin-top:2px;"><em>💡 ${b.helpText}</em></div>
          </div>
          <div class="benefit-val-group">
            <div class="benefit-user-val">$${itemState.enabled ? itemState.userValue : 0}</div>
            <div class="benefit-face-val">Face: $${b.faceValue}</div>
          </div>
        </div>
        <div class="benefit-controls">
          <label class="toggle-switch">
            <input type="checkbox" ${itemState.enabled ? 'checked' : ''} data-toggle-benefit="${b.id}">
            <span>${itemState.enabled ? 'Enabled in calculation' : 'Ignored / Inactive'}</span>
          </label>
          ${controlsHtml}
        </div>
      `;

      container.appendChild(row);
    });

    attachBenefitEvents();
  }

  function attachBenefitEvents() {
    // Checkbox toggles
    document.querySelectorAll('[data-toggle-benefit]').forEach(chk => {
      chk.addEventListener('change', e => {
        const id = e.target.getAttribute('data-toggle-benefit');
        if (state.benefits[id]) {
          state.benefits[id].enabled = e.target.checked;
          renderAll();
        }
      });
    });

    // Lounge pass slider
    document.querySelectorAll('.lounge-slider').forEach(sl => {
      sl.addEventListener('input', e => {
        const id = e.target.getAttribute('data-benefit');
        const count = parseInt(e.target.value, 10);
        state.benefits[id].userValue = count * 15; // $15 per realistic lounge pass
        renderAll();
      });
    });

    // Bags slider
    document.querySelectorAll('.bags-slider').forEach(sl => {
      sl.addEventListener('input', e => {
        const id = e.target.getAttribute('data-benefit');
        const count = parseInt(e.target.value, 10);
        state.benefits[id].userValue = count * 45; // $45 per flight checked bag
        renderAll();
      });
    });

    // Same day change slider
    document.querySelectorAll('.sameday-slider').forEach(sl => {
      sl.addEventListener('input', e => {
        const id = e.target.getAttribute('data-benefit');
        const count = parseInt(e.target.value, 10);
        state.benefits[id].userValue = count * 75;
        renderAll();
      });
    });

    // Generic slider
    document.querySelectorAll('.generic-slider').forEach(sl => {
      sl.addEventListener('input', e => {
        const id = e.target.getAttribute('data-benefit');
        state.benefits[id].userValue = parseInt(e.target.value, 10);
        renderAll();
      });
    });
  }

  function renderSpendSimulator(metrics) {
    const tbody = document.getElementById('spend-tbody');
    tbody.innerHTML = '';

    metrics.categoryBreakdowns.forEach(cat => {
      const tr = document.createElement('tr');
      const diffVal = Math.round(cat.diffVsBaseline);
      const isPositive = diffVal >= 0;

      tr.innerHTML = `
        <td>
          <div style="font-weight:600; color:#fff;">${cat.name}</div>
          <div style="font-size:11px; color:var(--text-subtle);">${cat.helpText}</div>
        </td>
        <td>
          <div class="spend-input-wrapper">
            <span class="currency-prefix">$</span>
            <input type="number" step="500" min="0" value="${cat.annualSpend}" data-spend-cat="${cat.id}" class="spend-input" style="width:115px;">
          </div>
        </td>
        <td>
          <span class="rate-badge">${cat.effectiveMultiplier.toFixed(1)}x pts (${cat.atmosReturnPct.toFixed(1)}%)</span>
          <div style="font-weight:600; color:#fff; margin-top:3px;">${cat.pts.toLocaleString()} pts</div>
          <div style="font-size:11px; color:var(--accent-green);">$${Math.round(cat.atmosVal).toLocaleString()} val</div>
        </td>
        <td>
          <span class="badge-baseline">${cat.baselineCard}</span>
          <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">${cat.baselineMultiplierText}</div>
          <div style="font-weight:600; color:#c084fc; margin-top:1px;">$${Math.round(cat.baselineVal).toLocaleString()} val</div>
        </td>
        <td>
          <span class="diff-pill ${isPositive ? 'gain' : 'loss'}">
            ${isPositive ? '+$' + diffVal : '-$' + Math.abs(diffVal)}
          </span>
          <div style="font-size:10px; color:var(--text-subtle); margin-top:2px;">
            ${isPositive ? 'Atmos wins' : 'Lost vs ' + cat.baselineCard}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach spend listeners
    document.querySelectorAll('[data-spend-cat]').forEach(inp => {
      inp.addEventListener('input', e => {
        const catId = e.target.getAttribute('data-spend-cat');
        state.annualSpend[catId] = Math.max(0, parseInt(e.target.value, 10) || 0);
        renderAll();
      });
    });

    // Update Spend summary text
    document.getElementById('spend-total-annual').textContent = `$${metrics.totalAnnualSpend.toLocaleString()}/yr`;
    document.getElementById('spend-points-total').textContent = `${metrics.totalPointsEarned.toLocaleString()} pts ($${Math.round(metrics.spendRewardsDollarVal).toLocaleString()})`;

    const baselineSumElem = document.getElementById('spend-baseline-total');
    if (baselineSumElem) {
      baselineSumElem.textContent = `$${Math.round(metrics.totalBaselineWalletValue).toLocaleString()}`;
    }

    const netAdvElem = document.getElementById('spend-net-advantage');
    if (netAdvElem) {
      const adv = Math.round(metrics.incrementalSpendAdvantage);
      netAdvElem.textContent = `${adv >= 0 ? '+$' + adv + ' (Gain)' : '-$' + Math.abs(adv) + ' (Opportunity Loss vs Benchmark Cards)'}`;
      netAdvElem.style.color = adv >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }
  }

  function renderComparisonTable(metrics) {
    const tbody = document.getElementById('comp-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = `
      <tr>
        <td><strong>Annual Fee</strong></td>
        <td style="color:var(--accent-red);">$${metrics.annualFee}</td>
        <td style="color:var(--accent-red);">$${metrics.annualFee}</td>
        <td>Ongoing recurring fee</td>
      </tr>
      <tr>
        <td><strong>Sign-up / Welcome Bonus</strong></td>
        <td style="color:var(--accent-green); font-weight:700;">+$1,470 (80k pts + 25k companion)</td>
        <td style="color:var(--text-subtle);">$0 (Expired after Yr 1)</td>
        <td>Requires $4k spend in 90 days</td>
      </tr>
      <tr>
        <td><strong>Anniversary Companion Award (25k pts)</strong></td>
        <td>$350</td>
        <td>$${state.benefits.companion_award_anniversary?.enabled ? state.benefits.companion_award_anniversary.userValue : 0}</td>
        <td>Renews every anniversary</td>
      </tr>
      <tr>
        <td><strong>8 Lounge Passes (2/qtr)</strong></td>
        <td>$180</td>
        <td>$${state.benefits.lounge_passes?.enabled ? state.benefits.lounge_passes.userValue : 0}</td>
        <td>Quarterly use-it-or-lose-it rule</td>
      </tr>
      <tr>
        <td><strong>Checked Bags + Same-day Changes</strong></td>
        <td>$215</td>
        <td>$${(state.benefits.checked_bags?.enabled ? state.benefits.checked_bags.userValue : 0) + (state.benefits.same_day_change?.enabled ? state.benefits.same_day_change.userValue : 0)}</td>
        <td>Based on your flight frequency</td>
      </tr>
      <tr>
        <td><strong>Annual Spend Rewards (at current spend)</strong></td>
        <td>$${Math.round(metrics.spendRewardsDollarVal)}</td>
        <td>$${Math.round(metrics.spendRewardsDollarVal)}</td>
        <td>3x multipliers + 10% BofA bonus</td>
      </tr>
      <tr style="background:#172236; font-weight:700;">
        <td><strong>Net Value (Total Value - Fee)</strong></td>
        <td style="color:var(--accent-green);">+$${Math.round((metrics.totalPerksValue + CARD_CONFIG.yearOneWelcomeOffer.estimatedValue + metrics.spendRewardsDollarVal) - metrics.annualFee).toLocaleString()}</td>
        <td style="color:${metrics.netAnnualValue >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">$${Math.round(metrics.netAnnualValue).toLocaleString()}</td>
        <td>Year 1 is high ROI; Renewal depends on flight perks</td>
      </tr>
    `;
  }

  // Setup Global Listeners
  function initGlobalListeners() {
    // Mode toggles (Renewal vs Year 1)
    const btnRenewal = document.getElementById('btn-mode-renewal');
    const btnYearOne = document.getElementById('btn-mode-yearone');

    if (btnRenewal && btnYearOne) {
      btnRenewal.addEventListener('click', () => {
        state.mode = 'renewal';
        btnRenewal.classList.add('active');
        btnYearOne.classList.remove('active');
        renderAll();
      });

      btnYearOne.addEventListener('click', () => {
        state.mode = 'year_one';
        btnYearOne.classList.add('active');
        btnRenewal.classList.remove('active');
        renderAll();
      });
    }

    // Presets
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', e => {
        const key = e.target.getAttribute('data-preset');
        document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        initStateFromPreset(key);
        renderAll();
      });
    });

    // Annual Fee Input
    const feeInput = document.getElementById('input-annual-fee');
    feeInput.value = state.annualFee;
    feeInput.addEventListener('input', e => {
      state.annualFee = Math.max(0, parseInt(e.target.value, 10) || 0);
      renderAll();
    });

    // Point Valuation Cents
    const ptInput = document.getElementById('input-point-val');
    ptInput.value = state.pointValuationCents;
    ptInput.addEventListener('input', e => {
      state.pointValuationCents = Math.max(0.1, parseFloat(e.target.value) || 1.4);
      renderAll();
    });

    // BofA 10% bonus toggle
    const bofaToggle = document.getElementById('toggle-bofa-bonus');
    bofaToggle.checked = state.bofaBonusActive;
    bofaToggle.addEventListener('change', e => {
      state.bofaBonusActive = e.target.checked;
      renderAll();
    });
  }

  // Initial Boot
  initStateFromPreset('my_actual');
  initGlobalListeners();
  renderAll();
})();
