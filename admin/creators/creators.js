(function () {
  'use strict';

  const bootError = document.getElementById('bootError');
  const cfg = window.AUTOSWIPER_CONFIG;

  function showBootError(message) {
    if (bootError) {
      bootError.textContent = message;
      bootError.hidden = false;
    }
  }

  if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey) {
    showBootError('Missing Supabase config.');
    return;
  }

  if (!window.supabase?.createClient) {
    showBootError('Could not load Supabase.');
    return;
  }

  const supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const adminEmail = document.getElementById('adminEmail');
  const kpiRow = document.getElementById('kpiRow');
  const creatorTableBody = document.getElementById('creatorTableBody');
  const creatorSearch = document.getElementById('creatorSearch');
  const loadError = document.getElementById('loadError');
  const detailPanel = document.getElementById('detailPanel');
  const detailTitle = document.getElementById('detailTitle');
  const detailSubtitle = document.getElementById('detailSubtitle');
  const detailLink = document.getElementById('detailLink');
  const attributionTableBody = document.getElementById('attributionTableBody');
  const commissionTableBody = document.getElementById('commissionTableBody');
  const closeDetailBtn = document.getElementById('closeDetailBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const creatorForm = document.getElementById('creatorForm');
  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');
  const markPaidBtn = document.getElementById('markPaidBtn');
  const selectAllCommissions = document.getElementById('selectAllCommissions');

  let rows = [];
  let selectedCreatorId = null;
  let detailData = null;

  function fmt(n) {
    return Number(n || 0).toLocaleString();
  }

  function money(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showLogin(msg) {
    dashboard.hidden = true;
    loginScreen.hidden = false;
    if (msg) {
      loginError.textContent = msg;
      loginError.hidden = false;
    } else {
      loginError.hidden = true;
    }
  }

  function showDashboard(email) {
    loginScreen.hidden = true;
    dashboard.hidden = false;
    adminEmail.textContent = email || '';
  }

  function sum(field) {
    return rows.reduce((acc, row) => acc + Number(row[field] || 0), 0);
  }

  function renderKpis() {
    kpiRow.innerHTML = [
      { label: 'Creators', value: rows.length },
      { label: 'Link clicks', value: sum('link_clicks') },
      { label: 'Signups', value: sum('signups') },
      { label: 'Pro conversions', value: sum('pro_conversions') },
      { label: 'Pending commission', value: money(sum('pending_commission_usd')) },
      { label: 'Total commission', value: money(sum('total_commission_usd')) },
    ]
      .map(
        (k) =>
          `<article class="admin-kpi"><div class="admin-kpi-label">${k.label}</div><div class="admin-kpi-value">${k.value}</div></article>`,
      )
      .join('');
  }

  function filteredRows() {
    const q = (creatorSearch.value || '').trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.code || '').toLowerCase().includes(q) ||
        (r.display_name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q),
    );
  }

  function renderTable() {
    const list = filteredRows();
    creatorTableBody.innerHTML = list
      .map((row) => {
        const selected = selectedCreatorId === row.creator_id ? ' is-selected' : '';
        return `<tr data-id="${row.creator_id}" class="${selected.trim()}">
          <td><span class="admin-dealer-name">${escapeHtml(row.display_name)}</span><span class="admin-dealer-key">${escapeHtml(row.code)} · ${escapeHtml(row.status)}</span></td>
          <td class="num">${fmt(row.link_clicks)}</td>
          <td class="num">${fmt(row.signups)}</td>
          <td class="num">${fmt(row.pro_conversions)}</td>
          <td class="num">${fmt(row.boost_conversions)}</td>
          <td class="num">${money(row.pending_commission_usd)}</td>
          <td class="num">${money(row.total_commission_usd)}</td>
        </tr>`;
      })
      .join('');
  }

  async function loadSummary() {
    loadError.hidden = true;
    creatorTableBody.innerHTML = '<tr><td colspan="7">Loading…</td></tr>';

    const { data, error } = await supabase.rpc('get_creator_program_summary');
    if (error) {
      if (error.message.includes('not authorized')) {
        await supabase.auth.signOut();
        showLogin('Your account is not on the admin allowlist.');
        return;
      }
      loadError.textContent = error.message;
      loadError.hidden = false;
      creatorTableBody.innerHTML = '';
      return;
    }

    rows = data || [];
    renderKpis();
    renderTable();
  }

  function renderDetail() {
    if (!detailData?.ok) return;
    const partner = detailData.partner || {};
    detailTitle.textContent = partner.display_name || partner.code;
    detailSubtitle.textContent = `${partner.code} · ${partner.status} · Pro ${Math.round((partner.pro_initial_pct || 0) * 100)}% · Boost ${Math.round((partner.boost_pct || 0) * 100)}%`;
    detailLink.innerHTML = partner.invite_url
      ? `<a href="${escapeHtml(partner.invite_url)}" target="_blank" rel="noopener">${escapeHtml(partner.invite_url)}</a>`
      : '';

    const attributions = detailData.attributions || [];
    attributionTableBody.innerHTML = attributions.length
      ? attributions.map((a) => `<tr>
          <td><code>${escapeHtml(String(a.user_id).slice(0, 8))}…</code></td>
          <td>${escapeHtml(a.source || '')}</td>
          <td>${escapeHtml(new Date(a.attributed_at).toLocaleString())}</td>
          <td>${a.has_pro ? 'Yes' : 'No'}</td>
          <td class="num">${money(a.commission_total)}</td>
        </tr>`).join('')
      : '<tr><td colspan="5">No signups yet.</td></tr>';

    const commissions = detailData.commissions || [];
    const pending = commissions.filter((c) => c.payout_status === 'pending');
    markPaidBtn.hidden = pending.length === 0;

    commissionTableBody.innerHTML = commissions.length
      ? commissions.map((c) => `<tr>
          <td>${c.payout_status === 'pending' ? `<input type="checkbox" class="commission-check" data-id="${c.id}" />` : ''}</td>
          <td>${escapeHtml(c.event_type)}</td>
          <td class="num">${money(c.gross_usd)}</td>
          <td class="num">${money(c.net_usd)}</td>
          <td class="num">${money(c.commission_usd)}</td>
          <td>${escapeHtml(c.payout_status)}</td>
          <td>${escapeHtml(new Date(c.created_at).toLocaleString())}</td>
        </tr>`).join('')
      : '<tr><td colspan="7">No commission events yet.</td></tr>';
  }

  async function loadDetail(creatorId) {
    selectedCreatorId = creatorId;
    renderTable();
    detailPanel.hidden = false;
    attributionTableBody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
    commissionTableBody.innerHTML = '<tr><td colspan="7">Loading…</td></tr>';

    const { data, error } = await supabase.rpc('get_creator_partner_detail', { p_creator_id: creatorId });
    if (error) {
      attributionTableBody.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    detailData = data;
    renderDetail();
    detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    loginSubmitBtn.disabled = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        loginError.textContent = error.message;
        loginError.hidden = false;
        return;
      }
      showDashboard(data.user?.email);
      await loadSummary();
    } finally {
      loginSubmitBtn.disabled = false;
    }
  });

  creatorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    formSuccess.hidden = true;

    const code = document.getElementById('creatorCode').value.trim();
    const displayName = document.getElementById('creatorName').value.trim();
    const email = document.getElementById('creatorEmail').value.trim();
    const proInitialPct = Number(document.getElementById('proInitialPct').value) / 100;
    const boostPct = Number(document.getElementById('boostPct').value) / 100;
    const notes = document.getElementById('creatorNotes').value.trim();

    const { data, error } = await supabase.rpc('admin_upsert_creator_partner', {
      p_code: code,
      p_display_name: displayName,
      p_email: email || null,
      p_pro_initial_pct: proInitialPct,
      p_boost_pct: boostPct,
      p_notes: notes || null,
    });

    if (error) {
      formError.textContent = error.message;
      formError.hidden = false;
      return;
    }

    const result = data || {};
    if (!result.ok) {
      formError.textContent = result.error || 'Save failed';
      formError.hidden = false;
      return;
    }

    formSuccess.textContent = `Saved ${result.code}. Link: ${result.invite_url}`;
    formSuccess.hidden = false;
    await loadSummary();
    if (result.id) await loadDetail(result.id);
  });

  markPaidBtn.addEventListener('click', async () => {
    const ids = [...document.querySelectorAll('.commission-check:checked')].map((el) => Number(el.dataset.id));
    if (!ids.length) return;
    const { data, error } = await supabase.rpc('admin_mark_commissions_paid', { p_commission_ids: ids });
    if (error) {
      alert(error.message);
      return;
    }
    alert(`Marked ${data} commission(s) as paid.`);
    if (selectedCreatorId) await loadDetail(selectedCreatorId);
    await loadSummary();
  });

  selectAllCommissions?.addEventListener('change', () => {
    document.querySelectorAll('.commission-check').forEach((el) => {
      el.checked = selectAllCommissions.checked;
    });
  });

  signOutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    selectedCreatorId = null;
    detailPanel.hidden = true;
    showLogin();
  });

  refreshBtn.addEventListener('click', () => {
    void loadSummary();
    if (selectedCreatorId) void loadDetail(selectedCreatorId);
  });

  creatorSearch.addEventListener('input', renderTable);

  creatorTableBody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    void loadDetail(tr.dataset.id);
  });

  closeDetailBtn.addEventListener('click', () => {
    detailPanel.hidden = true;
    selectedCreatorId = null;
    renderTable();
  });

  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      showDashboard(data.session.user.email);
      void loadSummary();
    } else {
      showLogin();
    }
  });
})();
