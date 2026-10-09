// Move & Lease Optimum Predictive Revenue & Decision Engine (With Live Calibration Summary)

(function () {
  const state = {
    activeView: 'single', // 'single' or 'comparison'
    selectedAptId: 'wa027-380',
    selectedTerm: 12,
    selectedSignDate: 'all',
    moveInRangeStart: '2026-10-08',
    moveInRangeEnd: '2026-11-30',
    currentLeaseEnd: '2026-11-02', // Current Lease Expiration Date
    currentRent: 4500, // Current rent: $4,500/mo ($150/day)
    m2mRent: 3700,     // Month-to-Month rent penalty: $3,700/mo ($123.33/day)
    moversCost: 2000,  // Packers & Movers: $2,000
    applySpecialOverride: true, // Toggle promo special ON/OFF
    promoWeeks: 8.67,  // Default: 8.67 weeks (~2 months free)
    sortField: 'effectiveMonthlyCost',
    sortAsc: true
  };

  function isWeekend(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    return day === 0 || day === 6; // Sun or Sat
  }

  function calculateTransitionCost(moveInDateStr) {
    const moveIn = new Date(moveInDateStr + 'T00:00:00');
    const leaseEnd = new Date(state.currentLeaseEnd + 'T00:00:00');

    if (moveIn < leaseEnd) {
      const diffTime = Math.abs(leaseEnd - moveIn);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dailyRent = state.currentRent / 30.0;
      return { days, cost: Math.round(days * dailyRent), type: 'overlap' };
    } else if (moveIn.getTime() === leaseEnd.getTime()) {
      return { days: 0, cost: 0, type: 'exact' };
    } else {
      const diffTime = Math.abs(moveIn - leaseEnd);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const m2mDailyRate = state.m2mRent / 30.0;
      return { days, cost: Math.round(days * m2mDailyRate), type: 'm2m_penalty' };
    }
  }

  function evaluateOption(opt) {
    const transition = calculateTransitionCost(opt.moveInDate);
    const weekend = isWeekend(opt.moveInDate);
    const movers = state.moversCost + (weekend ? 150 : 0);

    const calib = window.CALIBRATION_REPORT ? window.CALIBRATION_REPORT[opt.aptId] : null;
    let base = opt.baseRent;

    const overrideFreeze = document.getElementById('override-freeze-days');
    const overrideDrift = document.getElementById('override-drift-rate');

    if (overrideFreeze && overrideDrift && calib) {
      const freezeDays = parseFloat(overrideFreeze.value);
      const driftRate = parseFloat(overrideDrift.value);
      
      if (!isNaN(freezeDays) && !isNaN(driftRate)) {
        const signDt = new Date(opt.signDate + 'T00:00:00');
        const moveInDt = new Date(opt.moveInDate + 'T00:00:00');
        const todayDt = new Date('2026-10-08T00:00:00');
        
        const signOffset = Math.max(0, Math.ceil((signDt - todayDt) / (1000 * 60 * 60 * 24)));
        const anchorDriftPerDay = calib.anchorDelta > 0 ? calib.anchorDelta : 5.0;
        const effectiveAnchor = calib.baseAnchorPrice + (signOffset * anchorDriftPerDay);

        const freezeEndDt = new Date(signDt);
        freezeEndDt.setDate(freezeEndDt.getDate() + freezeDays);

        if (moveInDt <= freezeEndDt) {
          base = effectiveAnchor;
        } else {
          const leadDays = Math.ceil((moveInDt - freezeEndDt) / (1000 * 60 * 60 * 24));
          base = effectiveAnchor + (leadDays * driftRate);
        }
      }
    }

    let netMonthly = base;
    const isPromoActive = opt.specialActive && state.applySpecialOverride;
    
    if (isPromoActive && opt.termMonths >= 12) {
      const totalTermWeeks = (opt.termMonths / 12.0) * 52.0;
      const discountFraction = Math.min(1.0, state.promoWeeks / totalTermWeeks);
      netMonthly = base * (1.0 - discountFraction);
    }

    const totalOutlay = (netMonthly * opt.termMonths) + transition.cost + movers;
    const effectiveMonthly = totalOutlay / opt.termMonths;

    return {
      ...opt,
      baseRent: Math.round(base),
      discountedMonthly: Math.round(netMonthly * 100) / 100,
      isPromoApplied: isPromoActive,
      transitionDays: transition.days,
      transitionCost: transition.cost,
      costType: transition.type,
      isWeekend: weekend,
      moversCost: movers,
      totalOutlay: Math.round(totalOutlay * 100) / 100,
      effectiveMonthlyCost: Math.round(effectiveMonthly * 100) / 100
    };
  }

  function getRawDataset() {
    if (window.PREDICTIVE_DATASET && window.PREDICTIVE_DATASET.length > 0) {
      return window.PREDICTIVE_DATASET;
    }
    return [];
  }

  function populateCalibrationCard() {
    const calib = window.CALIBRATION_REPORT;
    if (!calib) return;

    const el = document.getElementById('calibration-summary-box');
    if (!el) return;

    const currentApt = calib[state.selectedAptId];
    if (currentApt) {
      const overrideFreeze = document.getElementById('override-freeze-days');
      const overrideDrift = document.getElementById('override-drift-rate');
      if (overrideFreeze && (overrideFreeze.value === '' || overrideFreeze.dataset.aptId !== state.selectedAptId)) {
        overrideFreeze.value = currentApt.freezeDays;
        overrideFreeze.dataset.aptId = state.selectedAptId;
      }
      if (overrideDrift && (overrideDrift.value === '' || overrideDrift.dataset.aptId !== state.selectedAptId)) {
        overrideDrift.value = currentApt.driftRate;
        overrideDrift.dataset.aptId = state.selectedAptId;
      }

      const deltaSign = currentApt.anchorDelta >= 0 ? '+' : '';
      let freezeShiftNote = currentApt.freezeDays !== currentApt.yesterdayFreezeDays
        ? `<span style="color:var(--accent-amber); font-weight:600;">(Shifted from ${currentApt.yesterdayFreezeDays}d to ${currentApt.freezeDays}d today!)</span>`
        : `(${currentApt.freezeDays} days stable)`;

      let sampleRowsHTML = '';
      if (currentApt.sampleComparison && currentApt.sampleComparison.length > 0) {
        sampleRowsHTML = currentApt.sampleComparison.slice(0, 5).map(row => {
          const dStr = row.delta !== null ? (row.delta >= 0 ? `+$${row.delta}` : `-$${Math.abs(row.delta)}`) : 'N/A';
          const dColor = row.delta > 0 ? 'var(--accent-rose)' : (row.delta < 0 ? 'var(--accent-emerald)' : 'var(--text-muted)');
          return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05); font-size:11px;">
              <td style="padding:3px 6px; color:var(--accent-cyan);">${row.date.slice(5)}</td>
              <td style="padding:3px 6px; color:#fff; font-weight:600;">$${row.todayPrice}</td>
              <td style="padding:3px 6px; color:var(--text-muted);">$${row.yesterdayPrice || 'N/A'}</td>
              <td style="padding:3px 6px; color:${dColor}; font-weight:600;">${dStr}</td>
            </tr>
          `;
        }).join('');
      }

      el.innerHTML = `
        <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.6;">
          <div style="margin-bottom:4px;">• <strong>Base Anchor Price Today</strong>: <span style="color:#fff; font-weight:600;">$${currentApt.baseAnchorPrice.toLocaleString()}/mo</span> (${deltaSign}$${currentApt.anchorDelta} vs yesterday)</div>
          <div style="margin-bottom:4px;">• <strong>Freeze Window</strong>: <span style="color:var(--accent-cyan); font-weight:600;">${currentApt.freezeDays} Days</span> ${freezeShiftNote}</div>
          <div style="margin-bottom:6px;">• <strong>Lead-Time Drift Rate</strong>: <span style="color:var(--accent-indigo); font-weight:600;">+$${currentApt.driftRate}/day</span></div>
          
          <div style="margin-top:8px; background:rgba(15,23,42,0.6); padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-weight:600; font-size:11px; color:var(--accent-amber); margin-bottom:4px;">📅 Today vs Yesterday Sample Grid (12-Mo):</div>
            <table style="width:100%; border-collapse:collapse; text-align:left;">
              <thead>
                <tr style="font-size:10px; color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.1);">
                  <th style="padding:2px 6px;">Date</th>
                  <th style="padding:2px 6px;">Today</th>
                  <th style="padding:2px 6px;">Yest</th>
                  <th style="padding:2px 6px;">Delta</th>
                </tr>
              </thead>
              <tbody>
                ${sampleRowsHTML}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  function populateAptDropdown() {
    const raw = getRawDataset();
    if (!raw || raw.length === 0) return;

    const aptSelect = document.getElementById('filter-apt-select');
    if (!aptSelect) return;

    const aptMap = new Map();
    raw.forEach(o => {
      if (!aptMap.has(o.aptId)) {
        aptMap.set(o.aptId, { name: o.aptName, details: o.details, hasSpecial: o.hasSpecial });
      }
    });

    const currentVal = aptSelect.value || state.selectedAptId;
    aptSelect.innerHTML = '';

    aptMap.forEach((info, aptId) => {
      const opt = document.createElement('option');
      opt.value = aptId;
      opt.textContent = `${info.name} (${info.details}${info.hasSpecial ? ' - 🎁 Promo' : ''})`;
      if (aptId === currentVal) opt.selected = true;
      aptSelect.appendChild(opt);
    });
  }

  function populateDateFilters() {
    populateAptDropdown();
    const raw = getRawDataset();
    if (!raw || raw.length === 0) return;

    const signSelect = document.getElementById('filter-sign-select');
    const signDatesMap = new Map();
    raw.forEach(o => {
      if (!signDatesMap.has(o.signDate)) {
        signDatesMap.set(o.signDate, o.signDateFormatted);
      }
    });

    if (signSelect && signSelect.options.length <= 1) {
      signSelect.innerHTML = '<option value="all" selected>All Sign Dates (Ranks Global Optimum)</option>';
      signDatesMap.forEach((formatted, isoDate) => {
        const opt = document.createElement('option');
        opt.value = isoDate;
        let note = '';
        if (isoDate === '2026-10-08') note = ' — Today';
        if (isoDate === '2026-10-15') note = ' — ⚠️ Promo Deadline';
        opt.textContent = `${formatted}${note}`;
        signSelect.appendChild(opt);
      });
    }
  }

  function renderKPIs(options) {
    if (!options || options.length === 0) return;

    const evaluated = options.map(evaluateOption);
    evaluated.sort((a, b) => a.effectiveMonthlyCost - b.effectiveMonthlyCost);

    const best = evaluated[0];
    document.getElementById('kpi-best-rent').textContent = `$${Math.round(best.discountedMonthly).toLocaleString()}/mo`;
    document.getElementById('kpi-best-term').textContent = `${best.termMonths} Months`;
    document.getElementById('kpi-best-date').textContent = `${best.moveInFormatted}`;
    document.getElementById('kpi-effective-cost').textContent = `$${Math.round(best.effectiveMonthlyCost).toLocaleString()}/mo`;

    const sub = document.getElementById('kpi-rent-sub');
    if (sub) {
      sub.textContent = best.specialActive 
        ? `Base $${best.baseRent} (Sign by ${best.signDateFormatted})` 
        : `Base $${best.baseRent}/mo (No Special)`;
    }

    const noticeBadge = document.querySelector('.lease-notice-badge');
    if (noticeBadge) {
      const dailyRent = Math.round(state.currentRent / 30);
      const m2mDaily = Math.round(state.m2mRent / 30);
      noticeBadge.innerHTML = `<span>⏰ Current Lease Expiration: <strong>${state.currentLeaseEnd}</strong> ($${state.currentRent.toLocaleString()}/mo = $${dailyRent}/d | M2M $${state.m2mRent.toLocaleString()}/mo = $${m2mDaily}/d)</span>`;
    }
  }

  function sortDataset(dataset) {
    const field = state.sortField;
    const asc = state.sortAsc ? 1 : -1;

    return dataset.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (typeof valA === 'string') {
        return valA.localeCompare(valB) * asc;
      }
      return (valA - valB) * asc;
    });
  }

  function renderTable(options) {
    const tbody = document.getElementById('scenarios-tbody');
    if (!tbody) return;

    let evaluated = options.map(evaluateOption);
    evaluated = sortDataset(evaluated);

    tbody.innerHTML = '';

    if (evaluated.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:24px; color:var(--text-muted);">No matching scenarios found for the selected date range.</td></tr>';
      return;
    }

    const lowestCost = Math.min(...evaluated.map(e => e.effectiveMonthlyCost));

    evaluated.slice(0, 60).forEach((sc, index) => {
      const tr = document.createElement('tr');
      const isBest = Math.abs(sc.effectiveMonthlyCost - lowestCost) < 0.01;

      let transitionHTML = '<span style="color:var(--accent-emerald); font-size:12px; font-weight:600;">Exact Match ($0)</span>';
      if (sc.costType === 'overlap') {
        transitionHTML = `<span class="overlap-cost-tag">${sc.transitionDays} Days Overlap ($${sc.transitionCost.toLocaleString()})</span>`;
      } else if (sc.costType === 'm2m_penalty') {
        transitionHTML = `<span style="color:var(--accent-rose); font-weight:600; font-size:11px;">⚠️ ${sc.transitionDays} Days M2M Pen ($${sc.transitionCost.toLocaleString()})</span>`;
      }

      const wksText = Math.abs(state.promoWeeks - 8.67) < 0.1 ? '2 Mos Free' : `${state.promoWeeks} Wks Free`;

      tr.innerHTML = `
        <td>
          <div style="font-weight:600; color:#fff;">${sc.aptName}</div>
          <div style="font-size:11px; color:var(--accent-indigo);">${sc.details}</div>
          ${sc.isPromoApplied ? `<div style="font-size:10px; color:var(--accent-amber); margin-top:2px;">🎁 ${wksText} Applied</div>` : (sc.special ? `<div style="font-size:10px; color:var(--accent-rose); margin-top:2px;">❌ Promo Toggled Off / Expired</div>` : '')}
        </td>
        <td>
          <div style="font-weight:600; color:var(--accent-amber);">${sc.signDateFormatted}</div>
          <div style="font-size:11px; color:var(--text-muted);">${sc.signDate === '2026-10-08' ? '⭐ Today' : 'Sign Date'}</div>
        </td>
        <td>
          <div style="font-weight:600; color:var(--accent-cyan);">${sc.moveInFormatted}</div>
          <div style="font-size:11px; color:var(--text-muted);">${sc.isWeekend ? '⚠️ Weekend ($' + sc.moversCost + ' movers)' : 'Weekday ($' + sc.moversCost + ' movers)'}</div>
        </td>
        <td><span style="background:rgba(99,102,241,0.15); color:#a5b4fc; padding:2px 8px; border-radius:4px; font-weight:600;">${sc.termMonths} Mos</span></td>
        <td>
          <div style="font-weight:600; color:#fff;">$${sc.baseRent.toLocaleString()}/mo</div>
          ${sc.isPromoApplied && sc.discountedMonthly < sc.baseRent ? `<div style="font-size:11px; color:var(--accent-emerald);">Net Promo: $${Math.round(sc.discountedMonthly).toLocaleString()}/mo</div>` : (sc.specialActive ? `<div style="font-size:10px; color:var(--accent-rose);">Promo Disabled</div>` : '')}
        </td>
        <td>${transitionHTML}</td>
        <td>$${sc.moversCost.toLocaleString()}</td>
        <td>
          <div style="font-size:1.05rem; font-weight:700; color:${isBest ? 'var(--accent-emerald)' : '#f8fafc'};">
            $${Math.round(sc.effectiveMonthlyCost).toLocaleString()}/mo
          </div>
          ${isBest ? '<span class="best-badge">RECOMMENDED OPTIMUM</span>' : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderTermVarianceCard(unfilteredDataset, anchorOption) {
    const cardEl = document.getElementById('term-variance-container');
    if (!cardEl) return;

    if (!unfilteredDataset || unfilteredDataset.length === 0 || !anchorOption) {
      cardEl.style.display = 'none';
      return;
    }
    cardEl.style.display = 'block';

    const evaluated = unfilteredDataset.map(evaluateOption);

    // Group options for the exact same Apt, Sign Date & Move-In Date as anchorOption
    const targetAptId = anchorOption.aptId;
    const targetSignDate = anchorOption.signDate;
    const targetMoveInDate = anchorOption.moveInDate;

    const terms = [12, 13, 14, 15];
    const termBestMap = new Map();

    terms.forEach(t => {
      const match = evaluated.find(e => e.aptId === targetAptId && e.termMonths === t && e.signDate === targetSignDate && e.moveInDate === targetMoveInDate) 
                 || evaluated.find(e => e.aptId === targetAptId && e.termMonths === t && e.signDate === targetSignDate)
                 || evaluated.find(e => e.aptId === targetAptId && e.termMonths === t);
      if (match) {
        termBestMap.set(t, match);
      }
    });

    if (termBestMap.size === 0) {
      cardEl.style.display = 'none';
      return;
    }

    // Find cheapest term as baseline ($0 / +$0)
    const termOptionsList = Array.from(termBestMap.values()).sort((a, b) => a.effectiveMonthlyCost - b.effectiveMonthlyCost);
    const baseline = termOptionsList[0];

    const sortedTermsList = Array.from(termBestMap.values()).sort((a, b) => a.termMonths - b.termMonths);

    let tilesHTML = sortedTermsList.map(opt => {
      const isBaseline = opt.termMonths === baseline.termMonths && Math.abs(opt.effectiveMonthlyCost - baseline.effectiveMonthlyCost) < 0.01;
      const monthlyDelta = Math.round(opt.effectiveMonthlyCost - baseline.effectiveMonthlyCost);
      const netRatePremium = Math.round((opt.effectiveMonthlyCost - baseline.effectiveMonthlyCost) * opt.termMonths);

      const monthlyDeltaStr = monthlyDelta > 0 ? `+$${monthlyDelta.toLocaleString()}/mo` : (monthlyDelta < 0 ? `-$${Math.abs(monthlyDelta).toLocaleString()}/mo` : `$0/mo`);
      const netPremiumStr = netRatePremium > 0 ? `+$${netRatePremium.toLocaleString()} Net Extra` : (netRatePremium < 0 ? `-$${Math.abs(netRatePremium).toLocaleString()} Net Savings` : `+$0 Extra`);

      let badgeHTML = `<span style="background:rgba(52,211,153,0.15); color:var(--accent-emerald); border:1px solid rgba(52,211,153,0.3); padding:4px 10px; border-radius:6px; font-weight:700; font-size:11px;">⭐ CHEAPEST BASELINE ($0 / +$0)</span>`;
      let borderStyle = '1px solid rgba(52, 211, 153, 0.3)';
      let bgStyle = 'rgba(52, 211, 153, 0.04)';

      if (!isBaseline) {
        badgeHTML = `
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:2px;">
            <span style="background:rgba(251,191,36,0.12); color:var(--accent-amber); border:1px solid rgba(251,191,36,0.25); padding:3px 8px; border-radius:4px; font-weight:700; font-size:11px;">${monthlyDeltaStr}</span>
            <span style="background:rgba(99,102,241,0.15); color:#a5b4fc; border:1px solid rgba(99,102,241,0.25); padding:3px 8px; border-radius:4px; font-weight:700; font-size:11px;">${netPremiumStr}</span>
          </div>
        `;
        borderStyle = '1px solid var(--border-color)';
        bgStyle = 'rgba(255,255,255,0.02)';
      }

      return `
        <div style="background:${bgStyle}; border:${borderStyle}; border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:1.05rem; font-weight:700; color:#fff;">${opt.termMonths} Mos Lease</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">${opt.isPromoApplied ? '🎁 Promo Active' : 'Standard Rate'}</span>
          </div>

          <div>
            <div style="font-size:1.3rem; font-weight:800; color:${isBaseline ? 'var(--accent-emerald)' : '#fff'};">$${Math.round(opt.effectiveMonthlyCost).toLocaleString()}<span style="font-size:0.75rem; font-weight:400; color:var(--text-muted);">/mo</span></div>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:3px;">
              ${isBaseline ? 'Baseline Outflow' : `Net Rate Extra: <strong>${netPremiumStr}</strong> <span style="color:var(--text-muted);">($${monthlyDelta}/mo × ${opt.termMonths}m)</span>`}
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Total Cash Outflow: $${Math.round(opt.totalOutlay).toLocaleString()}</div>
          </div>

          <div style="margin-top:2px;">
            ${badgeHTML}
          </div>
        </div>
      `;
    }).join('');

    cardEl.innerHTML = `
      <div style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="font-size:0.95rem; font-weight:700; color:#fff; display:flex; align-items:center; gap:8px;">
          <span>📐 Lease Term Differential & Net Rate Premium (12 vs 13 vs 14 vs 15 Mos)</span>
        </div>
        <span style="font-size:0.75rem; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); color:#a5b4fc; padding:4px 10px; border-radius:20px; font-weight:600;">
          📍 Anchored to Recommended Optimum: ${anchorOption.aptName} (${anchorOption.signDateFormatted} Sign × ${anchorOption.moveInFormatted} Move-In)
        </span>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:12px;">
        ${tilesHTML}
      </div>
    `;
  }

  function renderAll() {
    let fullDataset = getRawDataset();

    if (state.activeView === 'single') {
      fullDataset = fullDataset.filter(o => o.aptId === state.selectedAptId);
    }

    if (state.selectedSignDate !== 'all') {
      fullDataset = fullDataset.filter(o => o.signDate === state.selectedSignDate);
    }

    if (state.moveInRangeStart) {
      fullDataset = fullDataset.filter(o => o.moveInDate >= state.moveInRangeStart);
    }
    if (state.moveInRangeEnd) {
      fullDataset = fullDataset.filter(o => o.moveInDate <= state.moveInRangeEnd);
    }

    let tableDataset = fullDataset;
    if (state.selectedTerm !== 'all') {
      const termVal = parseInt(state.selectedTerm, 10);
      tableDataset = fullDataset.filter(o => o.termMonths === termVal);
    }

    const evaluatedTable = tableDataset.map(evaluateOption);
    evaluatedTable.sort((a, b) => a.effectiveMonthlyCost - b.effectiveMonthlyCost);
    const recommendedOptimum = evaluatedTable[0];

    populateCalibrationCard();
    renderKPIs(tableDataset);
    renderTable(tableDataset);

    renderTermVarianceCard(fullDataset, recommendedOptimum);
  }

  function initListeners() {
    // Current Lease Expiration Date
    const leaseEndInp = document.getElementById('input-lease-end');
    if (leaseEndInp) {
      leaseEndInp.addEventListener('change', e => {
        state.currentLeaseEnd = e.target.value || '2026-11-02';
        renderAll();
      });
    }

    // Current Rent Input
    const currentRentInp = document.getElementById('input-current-rent');
    if (currentRentInp) {
      currentRentInp.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        state.currentRent = isNaN(val) ? 4500 : Math.max(0, val);
        renderAll();
      });
    }

    // Month-to-Month Rent Input
    const m2mRentInp = document.getElementById('input-m2m-rent');
    if (m2mRentInp) {
      m2mRentInp.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        state.m2mRent = isNaN(val) ? 3700 : Math.max(0, val);
        renderAll();
      });
    }

    // Movers Cost Input
    const moversInp = document.getElementById('input-movers-cost');
    if (moversInp) {
      moversInp.addEventListener('input', e => {
        const val = parseInt(e.target.value, 10);
        state.moversCost = isNaN(val) ? 0 : Math.max(0, val);
        renderAll();
      });
    }

    // Special / Promo Toggle Input
    const specialToggle = document.getElementById('toggle-apply-special');
    if (specialToggle) {
      specialToggle.addEventListener('change', e => {
        state.applySpecialOverride = e.target.checked;
        renderAll();
      });
    }

    // Special / Promo Weeks Input
    const promoWeeksInp = document.getElementById('input-promo-weeks');
    if (promoWeeksInp) {
      promoWeeksInp.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        state.promoWeeks = isNaN(val) ? 8.67 : Math.max(0, val);
        renderAll();
      });
    }

    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeView = btn.getAttribute('data-view');
        
        const aptBox = document.getElementById('single-apt-box');
        if (aptBox) {
          aptBox.style.display = state.activeView === 'single' ? 'block' : 'none';
        }
        renderAll();
      });
    });

    // Apartment Select
    const aptSelect = document.getElementById('filter-apt-select');
    if (aptSelect) {
      aptSelect.addEventListener('change', e => {
        state.selectedAptId = e.target.value;
        renderAll();
      });
    }

    // Sign Date Select
    const signSelect = document.getElementById('filter-sign-select');
    if (signSelect) {
      signSelect.addEventListener('change', e => {
        state.selectedSignDate = e.target.value;
        renderAll();
      });
    }

    // Move-In Date Range Inputs
    const moveInStartInp = document.getElementById('filter-movein-start');
    if (moveInStartInp) {
      moveInStartInp.addEventListener('change', e => {
        state.moveInRangeStart = e.target.value;
        renderAll();
      });
    }

    const moveInEndInp = document.getElementById('filter-movein-end');
    if (moveInEndInp) {
      moveInEndInp.addEventListener('change', e => {
        state.moveInRangeEnd = e.target.value;
        renderAll();
      });
    }

    // Term Select
    const termSelect = document.getElementById('filter-term-select');
    if (termSelect) {
      termSelect.addEventListener('change', e => {
        state.selectedTerm = e.target.value;
        renderAll();
      });
    }

    // Override Calibration Inputs
    const overrideFreeze = document.getElementById('override-freeze-days');
    if (overrideFreeze) {
      overrideFreeze.addEventListener('input', () => {
        renderAll();
      });
    }

    const overrideDrift = document.getElementById('override-drift-rate');
    if (overrideDrift) {
      overrideDrift.addEventListener('input', () => {
        renderAll();
      });
    }

    // Column Header Sorting Listeners
    document.querySelectorAll('.scenarios-table th[data-sort]').forEach(th => {
      th.style.cursor = 'pointer';
      th.title = 'Click to sort';
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        if (state.sortField === field) {
          state.sortAsc = !state.sortAsc;
        } else {
          state.sortField = field;
          state.sortAsc = true;
        }
        renderAll();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initListeners();
    populateDateFilters();
    renderAll();
  });
})();
