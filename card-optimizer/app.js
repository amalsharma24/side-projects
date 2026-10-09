// Credit Card Renewal ROI Engine & Reactive UI Controller (Card-Agnostic)

(function () {
  // Baseline Valuation Sensitivity Tiers
  const BASELINE_TIERS = {
    conservative: { name: 'Conservative', cpp: 1.5, label: 'Conservative (1.5 cpp)' },
    realistic: { name: 'Realistic', cpp: 1.75, label: 'Realistic (1.75 cpp)' },
    optimistic: { name: 'Optimistic', cpp: 2.0, label: 'Optimistic (2.0 cpp)' }
  };

  // Application State
  const state = {
    activeCardId: 'bofa-atmos-summit',
    config: null,
    mode: 'renewal', // 'renewal' or 'year_one'
    annualFee: 0,
    pointValuationCents: 1.4,
    baselineTier: 'realistic', // 'conservative', 'realistic', 'optimistic', or custom
    baselineCpp: 1.75, // Default to 1.75 cpp realistic
    bofaBonusActive: false,
    activePreset: 'personalized_default',
    
    // Benefit values & toggles
    benefits: {},
    
    // Spend values (Annual)
    annualSpend: {}
  };

  // Get active card ID from URL (query param ?card=... or hash #...)
  function getInitialCardId() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const cardParam = urlParams.get('card');
      if (cardParam && window.CARDS_DATA && window.CARDS_DATA[cardParam]) {
        return cardParam;
      }
      const hash = window.location.hash.replace('#', '');
      if (hash && window.CARDS_DATA && window.CARDS_DATA[hash]) {
        return hash;
      }
    } catch (e) {
      // Fallback
    }

    // Default to first card in CARDS_REGISTRY or fallback to summit
    if (window.CARDS_REGISTRY && window.CARDS_REGISTRY.length > 0) {
      return window.CARDS_REGISTRY[0].id;
    }
    return 'bofa-atmos-summit';
  }

  // Populate card dropdown selector
  function initCardSelector() {
    const selector = document.getElementById('card-selector');
    if (!selector) return;

    selector.innerHTML = '';
    const registry = window.CARDS_REGISTRY || [
      { id: 'bofa-atmos-summit', name: 'Bank of America Atmos™ Summit Card ($395)' },
      { id: 'bofa-atmos-ascent', name: 'Bank of America Atmos™ Ascent Card ($95)' }
    ];

    registry.forEach(card => {
      const opt = document.createElement('option');
      opt.value = card.id;
      opt.textContent = card.name;
      if (card.id === state.activeCardId) {
        opt.selected = true;
      }
      selector.appendChild(opt);
    });

    selector.addEventListener('change', (e) => {
      const newCardId = e.target.value;
      switchCard(newCardId);
    });
  }

  // Switch Active Card
  function switchCard(cardId) {
    if (!window.CARDS_DATA || !window.CARDS_DATA[cardId]) {
      const reg = (window.CARDS_REGISTRY || []).find(c => c.id === cardId);
      if (reg && reg.dataFile) {
        const script = document.createElement('script');
        script.src = reg.dataFile;
        script.onload = function() {
          switchCard(cardId);
        };
        document.body.appendChild(script);
        return;
      }
      console.error(`Card data for ${cardId} not loaded.`);
      return;
    }

    state.activeCardId = cardId;
    state.config = window.CARDS_DATA[cardId];
    window.CARD_CONFIG = state.config;

    // Update URL without page reload
    try {
      const url = new URL(window.location);
      url.searchParams.set('card', cardId);
      window.history.replaceState({}, '', url);
    } catch (e) {
      window.location.hash = cardId;
    }

    // Update Card Dropdown value if needed
    const selector = document.getElementById('card-selector');
    if (selector && selector.value !== cardId) {
      selector.value = cardId;
    }

    // Initialize state with first available preset
    const presetKeys = Object.keys(state.config.presets || {});
    const defaultPresetKey = presetKeys.includes('personalized_default') 
      ? 'personalized_default' 
      : (presetKeys.includes('my_actual') ? 'my_actual' : presetKeys[0]);
    initStateFromPreset(defaultPresetKey);

    renderCardMetadata();
    renderAll();
  }

  // Initialize state from a preset
  function initStateFromPreset(presetKey) {
    const config = state.config;
    const preset = config.presets[presetKey] || Object.values(config.presets)[0];
    state.activePreset = presetKey;
    state.annualFee = preset.annualFee !== undefined ? preset.annualFee : config.defaultAnnualFee;
    state.pointValuationCents = config.pointValuationCents || 1.4;
    state.bofaBonusActive = !!preset.bofaBonus;
    
    // Sync UI inputs
    const feeInput = document.getElementById('input-annual-fee');
    if (feeInput) feeInput.value = state.annualFee;

    const ptInput = document.getElementById('input-point-val');
    if (ptInput) ptInput.value = state.pointValuationCents;

    const baselineInput = document.getElementById('input-baseline-cpp');
    if (baselineInput) baselineInput.value = state.baselineCpp;

    const bofaToggle = document.getElementById('toggle-bofa-bonus');
    if (bofaToggle) bofaToggle.checked = state.bofaBonusActive;
    
    // Init benefits
    state.benefits = {};
    config.benefits.forEach(b => {
      const isConfigured = preset.benefits && preset.benefits.hasOwnProperty(b.id);
      const val = isConfigured ? preset.benefits[b.id] : b.defaultValue;
      
      state.benefits[b.id] = {
        enabled: val > 0 || (b.details && b.details.enabledByDefault),
        userValue: val,
        customized: false
      };
    });

    // Init annual spend
    state.annualSpend = {};
    config.spendCategories.forEach(cat => {
      state.annualSpend[cat.id] = (preset.annualSpend && preset.annualSpend[cat.id] !== undefined) 
        ? preset.annualSpend[cat.id] 
        : (cat.defaultAnnualSpend || 0);
    });
  }

  // Render Card-Level Metadata (Header, Badges, Notes)
  function renderCardMetadata() {
    const config = state.config;
    document.title = `Credit Card Renewal ROI Analyzer | ${config.cardName}`;

    const headerName = document.getElementById('header-card-name');
    if (headerName) {
      headerName.innerHTML = `
        ${config.cardName}
        <span class="badge-card" id="header-card-issuer">${config.issuer || 'Credit Card'}</span>
      `;
    }

    const headerSubtitle = document.getElementById('header-card-subtitle');
    if (headerSubtitle) {
      headerSubtitle.textContent = `${config.cardName} • $${state.annualFee} Annual Fee vs. Recurring Perks & Spend Valuation`;
    }

    const thCardReturn = document.getElementById('th-card-return');
    if (thCardReturn) {
      thCardReturn.textContent = `${config.cardName.replace(' Card', '')} Return`;
    }

    const spendRewardsLabel = document.getElementById('spend-rewards-label');
    if (spendRewardsLabel) {
      spendRewardsLabel.textContent = `${config.cardName.replace(' Card', '')} Rewards Earned:`;
    }

    const feeSubtext = document.getElementById('setting-fee-subtext');
    if (feeSubtext) {
      feeSubtext.textContent = `Card annual fee: $${state.annualFee}.00 billed annually`;
    }

    const relBox = document.getElementById('relationship-bonus-box');
    if (relBox) {
      relBox.style.display = state.config.hasBofaBonus ? 'flex' : 'none';
    }
  }

  // Core ROI Calculation Engine
  function calculateMetrics() {
    const config = state.config;

    // 1. Calculate Perks & Credits
    let totalPerksValue = 0;
    config.benefits.forEach(b => {
      const item = state.benefits[b.id];
      if (item && item.enabled) {
        totalPerksValue += Number(item.userValue) || 0;
      }
    });

    // 2. Year 1 welcome bonus if active
    let welcomeBonusValue = 0;
    if (state.mode === 'year_one' && config.yearOneWelcomeOffer) {
      const wb = config.yearOneWelcomeOffer;
      const totalPoints = (wb.bonusPoints || 0) + (wb.companionAwardPoints || 0);
      welcomeBonusValue = totalPoints > 0 
        ? (totalPoints * (state.pointValuationCents / 100))
        : (wb.estimatedValue || 0);
      totalPerksValue += welcomeBonusValue;
    }

    // 3. Calculate Spend Points & Incremental Return vs Baseline Cards
    let totalAnnualSpend = 0;
    let totalPointsEarned = 0;
    let totalCardSpendValue = 0;
    let totalBaselineWalletValue = 0;
    const bonusMultiplier = (state.config.hasBofaBonus && state.bofaBonusActive) ? 1.10 : 1.0;

    const categoryBreakdowns = config.spendCategories.map(cat => {
      const annualCatSpend = Number(state.annualSpend[cat.id]) || 0;
      totalAnnualSpend += annualCatSpend;

      const effectiveMultiplier = cat.multiplier * bonusMultiplier;
      const pts = annualCatSpend * effectiveMultiplier;
      totalPointsEarned += pts;

      const cardReturnPct = effectiveMultiplier * state.pointValuationCents;
      const cardVal = pts * (state.pointValuationCents / 100);
      totalCardSpendValue += cardVal;

      // Dynamic baseline calculation based on category baselineMultiplier and state.baselineCpp
      const baselineMultiplier = cat.baselineMultiplier !== undefined
        ? cat.baselineMultiplier
        : (cat.baselineRatePct ? Math.round(cat.baselineRatePct / 2) : 2);
      const baselineRatePct = baselineMultiplier * state.baselineCpp;
      const baselineVal = annualCatSpend * (baselineRatePct / 100);
      totalBaselineWalletValue += baselineVal;

      const diffVsBaseline = cardVal - baselineVal;
      const formattedRate = Number.isInteger(baselineRatePct)
        ? baselineRatePct.toString()
        : baselineRatePct.toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
      const baselineMultiplierText = `${baselineMultiplier}X (${formattedRate}%)`;

      return {
        ...cat,
        annualSpend: annualCatSpend,
        effectiveMultiplier,
        pts: Math.round(pts),
        cardReturnPct,
        cardVal,
        baselineMultiplier,
        baselineRatePct,
        baselineMultiplierText,
        baselineVal,
        diffVsBaseline
      };
    });

    const spendRewardsDollarVal = totalCardSpendValue;
    const incrementalSpendAdvantage = totalCardSpendValue - totalBaselineWalletValue;

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

  // Master Render Function
  function renderAll() {
    const metrics = calculateMetrics();
    renderVerdict(metrics);
    renderKPICards(metrics);
    renderProgressBar(metrics);
    renderBenefitsList();
    renderSpendSimulator(metrics);
    updateBaselineSensitivityUI();
  }

  function updateBaselineSensitivityUI() {
    document.querySelectorAll('.baseline-btn').forEach(btn => {
      const tier = btn.getAttribute('data-baseline-tier');
      if (tier === state.baselineTier) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const baselineInput = document.getElementById('input-baseline-cpp');
    if (baselineInput && document.activeElement !== baselineInput) {
      baselineInput.value = state.baselineCpp;
    }

    const baselineSubtext = document.getElementById('setting-baseline-subtext');
    if (baselineSubtext) {
      baselineSubtext.textContent = `Benchmark cents per point for baseline cards (e.g. 2X card = ${(2 * state.baselineCpp).toFixed(1)}%)`;
    }
  }

  function renderVerdict(metrics) {
    const verdictPill = document.getElementById('verdict-pill');
    const verdictAmount = document.getElementById('verdict-amount');
    const verdictText = document.getElementById('verdict-explanation');

    const netBaseline = Math.round(metrics.netValueOverBaseline);
    const formattedBaseline = (netBaseline >= 0 ? '+$' : '-$') + Math.abs(netBaseline).toLocaleString();

    verdictAmount.textContent = formattedBaseline;
    verdictAmount.className = 'verdict-amount ' + (netBaseline >= 50 ? 'positive' : netBaseline >= 0 ? 'neutral' : 'negative');

    const spendAdv = Math.round(metrics.incrementalSpendAdvantage);
    const spendAdvText = (spendAdv >= 0 ? '+$' + spendAdv : '-$' + Math.abs(spendAdv));
    const perksVal = Math.round(metrics.totalPerksValue);

    if (netBaseline >= 0) {
      verdictPill.className = 'verdict-pill renew';
      verdictPill.textContent = 'RENEW (NET POSITIVE)';
      verdictText.textContent = `Your utilized perks ($${perksVal}) and spend edge (${spendAdvText}) exceed the $${metrics.annualFee} fee by ${formattedBaseline}/year vs. alternative cards. Solid keeper card for your travel profile.`;
    } else {
      verdictPill.className = 'verdict-pill cancel';
      if (state.activeCardId === 'bofa-atmos-summit') {
        verdictPill.textContent = 'CANCEL OR DOWNGRADE TO ASCENT';
        verdictText.textContent = `You are running a net deficit of ${formattedBaseline}/year vs. your benchmark cards. You pay the high $${metrics.annualFee} fee primarily for checked bags, while companion and lounge benefits are largely uncaptured. Downgrading to the $95 Atmos Ascent card preserves free bags while saving +$300/yr in fees!`;
      } else if (state.activeCardId === 'bofa-atmos-ascent') {
        verdictPill.textContent = 'CANCEL / TRIM';
        verdictText.textContent = `You are running a net deficit of ${formattedBaseline}/year vs. your benchmark cards. The $${metrics.annualFee} annual fee exceeds the realized perk value. If you don't fly Alaska enough to check bags, consider closing this account.`;
      } else {
        verdictPill.textContent = 'CANCEL / RECONSIDER';
        verdictText.textContent = `You are running a net deficit of ${formattedBaseline}/year vs. your benchmark cards. The $${metrics.annualFee} annual fee exceeds your realized perks ($${perksVal}) and spend edge (${spendAdvText}). Unless you can capture more value from hotel/travel credits, this card may not justify its fee.`;
      }
    }
  }

  function renderKPICards(metrics) {
    document.getElementById('kpi-annual-fee').textContent = `$${metrics.annualFee}`;
    document.getElementById('kpi-total-benefits').textContent = `$${Math.round(metrics.totalPerksValue).toLocaleString()}`;
    
    const spendAdv = Math.round(metrics.incrementalSpendAdvantage);
    document.getElementById('kpi-spend-rewards').textContent = `${spendAdv >= 0 ? '+$' + spendAdv : '-$' + Math.abs(spendAdv)}`;
    
    const incBadge = document.getElementById('kpi-spend-inc');
    incBadge.textContent = `Net vs Benchmark Cards`;
    incBadge.style.color = spendAdv >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
  }

  function renderProgressBar(metrics) {
    const netEffectiveVal = Math.max(0, metrics.totalPerksValue + metrics.incrementalSpendAdvantage);
    const maxScale = Math.max(netEffectiveVal, metrics.annualFee) * 1.25 || 500;

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

    state.config.benefits.forEach(b => {
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
      } else if (b.id === 'admirals_club_passes') {
        const passes = Math.round(itemState.userValue / 15);
        controlsHtml = `
          <div class="slider-wrapper">
            <span style="font-size:12px; color:var(--text-muted);">Passes Used:</span>
            <input type="range" min="0" max="4" step="1" value="${passes}" data-benefit="${b.id}" class="admirals-slider">
            <span class="slider-readout">${passes} of 4 (${passes > 0 ? '$' + (passes * 15) : '$0'})</span>
          </div>
        `;
      } else if (b.id === 'checked_bags') {
        const costPerBag = (b.usageConfig && b.usageConfig.costPerBag) || 45;
        const flights = Math.round(itemState.userValue / costPerBag);
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
        const maxRange = Math.max(b.faceValue * 1.2, 350);
        controlsHtml = `
          <div class="slider-wrapper">
            <span style="font-size:12px; color:var(--text-muted);">Your Valuation:</span>
            <input type="range" min="0" max="${maxRange}" step="5" value="${itemState.userValue}" data-benefit="${b.id}" class="generic-slider">
            <span class="slider-readout">$${Number(itemState.userValue).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}</span>
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
            <div class="benefit-user-val">$${itemState.enabled ? Number(itemState.userValue).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) : 0}</div>
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

    // Lounge slider
    document.querySelectorAll('.lounge-slider').forEach(sl => {
      sl.addEventListener('input', e => {
        const id = e.target.getAttribute('data-benefit');
        const count = parseInt(e.target.value, 10);
        state.benefits[id].userValue = count * 15;
        renderAll();
      });
    });

    // Admirals Club slider
    document.querySelectorAll('.admirals-slider').forEach(sl => {
      sl.addEventListener('input', e => {
        const id = e.target.getAttribute('data-benefit');
        const count = parseInt(e.target.value, 10);
        state.benefits[id].userValue = count * 15;
        renderAll();
      });
    });

    // Bags slider
    document.querySelectorAll('.bags-slider').forEach(sl => {
      sl.addEventListener('input', e => {
        const id = e.target.getAttribute('data-benefit');
        const count = parseInt(e.target.value, 10);
        const bObj = state.config.benefits.find(b => b.id === id);
        const costPerBag = (bObj && bObj.usageConfig && bObj.usageConfig.costPerBag) || 45;
        state.benefits[id].userValue = count * costPerBag;
        renderAll();
      });
    });

    // Same-day change slider
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
        state.benefits[id].userValue = parseFloat(e.target.value);
        renderAll();
      });
    });
  }

  function renderSpendSimulator(metrics) {
    const tbody = document.getElementById('spend-tbody');
    tbody.innerHTML = '';

    const cardShortName = state.config.cardName.replace(' Card', '');

    const spendDesc = document.getElementById('spend-comparison-desc');
    if (spendDesc) {
      spendDesc.textContent = `Comparing rewards earned on this card vs. swiping your baseline cards (Amex Gold 4X, Amex Plat 5X, Venture X 2X) valued at ${state.baselineCpp}¢/pt:`;
    }

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
          <span class="rate-badge">${Number.isInteger(cat.effectiveMultiplier) ? cat.effectiveMultiplier : cat.effectiveMultiplier.toFixed(1)}x pts (${cat.cardReturnPct.toFixed(1)}%)</span>
          <div style="font-weight:600; color:#fff; margin-top:3px;">${cat.pts.toLocaleString()} pts</div>
          <div style="font-size:11px; color:var(--accent-green);">$${Math.round(cat.cardVal).toLocaleString()} val</div>
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
            ${isPositive ? `${cardShortName} wins` : 'Lost vs ' + cat.baselineCard}
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

    // Summary texts
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

  // Setup Global Listeners
  function initGlobalListeners() {
    // Annual Fee Input
    const feeInput = document.getElementById('input-annual-fee');
    if (feeInput) {
      feeInput.addEventListener('input', e => {
        state.annualFee = Math.max(0, parseInt(e.target.value, 10) || 0);
        renderAll();
      });
    }

    // Point Valuation Cents
    const ptInput = document.getElementById('input-point-val');
    if (ptInput) {
      ptInput.addEventListener('input', e => {
        state.pointValuationCents = Math.max(0.1, parseFloat(e.target.value) || 1.4);
        renderAll();
      });
    }

    // Relationship bonus toggle
    const bofaToggle = document.getElementById('toggle-bofa-bonus');
    if (bofaToggle) {
      bofaToggle.addEventListener('change', e => {
        state.bofaBonusActive = e.target.checked;
        renderAll();
      });
    }

    // Baseline sensitivity buttons
    document.querySelectorAll('.baseline-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = btn.getAttribute('data-baseline-tier');
        if (BASELINE_TIERS[tier]) {
          state.baselineTier = tier;
          state.baselineCpp = BASELINE_TIERS[tier].cpp;
          renderAll();
        }
      });
    });

    // Baseline Points Valuation input
    const baselineInput = document.getElementById('input-baseline-cpp');
    if (baselineInput) {
      baselineInput.addEventListener('input', e => {
        const val = Math.max(0.1, parseFloat(e.target.value) || 1.75);
        state.baselineCpp = val;
        let matchedTier = null;
        Object.keys(BASELINE_TIERS).forEach(k => {
          if (Math.abs(BASELINE_TIERS[k].cpp - val) < 0.001) {
            matchedTier = k;
          }
        });
        state.baselineTier = matchedTier;
        renderAll();
      });
    }
  }

  // Initial Boot
  function boot() {
    const initialCardId = getInitialCardId();
    initCardSelector();
    switchCard(initialCardId);
    initGlobalListeners();
  }

  // Ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
