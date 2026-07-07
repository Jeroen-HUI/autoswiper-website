(function () {
  'use strict';

  const bootError = document.getElementById('bootError');

  function showBootError(message) {
    if (bootError) {
      bootError.textContent = message;
      bootError.hidden = false;
    } else {
      document.body.innerHTML = `<p style="padding:24px;color:#ef4444">${message}</p>`;
    }
  }

  const cfg = window.AUTOSWIPER_CONFIG;
  if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey) {
    showBootError('Missing Supabase config. Check ../assets/config.js');
    return;
  }

  if (!window.supabase?.createClient) {
    showBootError(
      'Could not load Supabase. Open this page via https://www.useautoswiper.com/admin/ (not as a local file).',
    );
    return;
  }

  if (!window.supabase?.createClient) {
    showBootError(
      'Could not load Supabase. Open this page via https://www.useautoswiper.com/admin/ (not as a local file).',
    );
    return;
  }

  const supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });

  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const adminEmail = document.getElementById('adminEmail');
  const kpiRow = document.getElementById('kpiRow');
  const dealerTableBody = document.getElementById('dealerTableBody');
  const dealerSearch = document.getElementById('dealerSearch');
  const loadError = document.getElementById('loadError');
  const detailPanel = document.getElementById('detailPanel');
  const detailTitle = document.getElementById('detailTitle');
  const detailSubtitle = document.getElementById('detailSubtitle');
  const detailTableBody = document.getElementById('detailTableBody');
  const closeDetailBtn = document.getElementById('closeDetailBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const signOutBtn = document.getElementById('signOutBtn');

  if (!loginForm || !loginSubmitBtn) {
    showBootError('Admin page failed to load. Try a hard refresh (Ctrl+F5).');
    return;
  }

  let days = 30;
  let rows = [];
  let sortKey = 'total_swipes';
  let sortDir = -1;
  let selectedDealer = null;

  function fmt(n) {
    return Number(n || 0).toLocaleString();
  }

  function fmtPrice(n) {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
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
    loginError.hidden = true;
    loginScreen.hidden = true;
    dashboard.hidden = false;
    adminEmail.textContent = email || '';
  }

  function sum(field) {
    return rows.reduce((acc, row) => acc + Number(row[field] || 0), 0);
  }

  function renderKpis() {
    kpiRow.innerHTML = [
      { label: 'Dealerships', value: rows.length },
      { label: 'Card views', value: sum('card_views') },
      { label: 'Swipes', value: sum('total_swipes') },
      { label: 'Swipe likes', value: sum('swipe_likes') },
      { label: 'Click-throughs', value: sum('outbound_clicks') },
      { label: 'Garage saves', value: sum('garage_saves') },
    ]
      .map(
        (k) =>
          `<article class="admin-kpi"><div class="admin-kpi-label">${k.label}</div><div class="admin-kpi-value">${fmt(k.value)}</div></article>`,
      )
      .join('');
  }

  function filteredRows() {
    const q = (dealerSearch.value || '').trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter(
        (r) =>
          (r.dealer_name || '').toLowerCase().includes(q) ||
          (r.dealer_key || '').toLowerCase().includes(q) ||
          (r.import_source || '').toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * sortDir;
      }
      return String(av || '').localeCompare(String(bv || '')) * sortDir;
    });
  }

  function renderTable() {
    const list = filteredRows();
    dealerTableBody.innerHTML = list
      .map((row) => {
        const selected = selectedDealer === row.dealer_key ? ' is-selected' : '';
        return `<tr data-key="${escapeAttr(row.dealer_key)}" class="${selected.trim()}">
          <td><span class="admin-dealer-name">${escapeHtml(row.dealer_name || row.dealer_key)}</span><span class="admin-dealer-key">${escapeHtml(row.dealer_key)}</span></td>
          <td>${escapeHtml(row.import_source || '—')}</td>
          <td class="num">${fmt(row.active_listings)}</td>
          <td class="num">${fmt(row.card_views)}</td>
          <td class="num">${fmt(row.total_swipes)}</td>
          <td class="num">${fmt(row.swipe_likes)}</td>
          <td class="num">${fmt(row.outbound_clicks)}</td>
          <td class="num">${fmt(row.garage_saves)}</td>
        </tr>`;
      })
      .join('');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  async function loadSummary() {
    loadError.hidden = true;
    dealerTableBody.innerHTML = '<tr><td colspan="8">Loading dealerships… this can take a few seconds.</td></tr>';

    const { data, error } = await supabase.rpc('get_dealer_analytics_summary', { p_days: days });

    if (error) {
      if (error.message.includes('not authorized')) {
        await supabase.auth.signOut();
        showLogin('Your account is not on the admin allowlist.');
        return;
      }
      loadError.textContent = error.message;
      loadError.hidden = false;
      dealerTableBody.innerHTML = '';
      return;
    }

    rows = data || [];
    renderKpis();
    renderTable();
  }

  async function loadDetail(dealerKey, dealerName) {
    selectedDealer = dealerKey;
    renderTable();
    detailPanel.hidden = false;
    detailTitle.textContent = dealerName || dealerKey;
    detailSubtitle.textContent = `Inventory breakdown · ${days === 0 ? 'all time' : `last ${days} days`}`;
    detailTableBody.innerHTML = '<tr><td colspan="8">Loading…</td></tr>';

    const { data, error } = await supabase.rpc('get_dealer_analytics_detail', {
      p_dealer_key: dealerKey,
      p_days: days,
    });

    if (error) {
      detailTableBody.innerHTML = `<tr><td colspan="8">${escapeHtml(error.message)}</td></tr>`;
      return;
    }

    const items = data || [];
    if (!items.length) {
      detailTableBody.innerHTML = '<tr><td colspan="8">No listings found for this dealer.</td></tr>';
      return;
    }

    detailTableBody.innerHTML = items
      .map((row) => {
        const statusClass =
          row.status === 'active'
            ? 'admin-badge--active'
            : row.status === 'sold'
              ? 'admin-badge--sold'
              : 'admin-badge--delisted';
        return `<tr>
          <td>${escapeHtml(row.title || 'Untitled')}</td>
          <td class="num">${fmtPrice(row.price)}</td>
          <td><span class="admin-badge ${statusClass}">${escapeHtml(row.status || 'unknown')}</span></td>
          <td class="num">${fmt(row.card_views)}</td>
          <td class="num">${fmt(row.total_swipes)}</td>
          <td class="num">${fmt(row.swipe_likes)}</td>
          <td class="num">${fmt(row.outbound_clicks)}</td>
          <td class="num">${fmt(row.garage_saves)}</td>
        </tr>`;
      })
      .join('');

    detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      loginError.textContent = 'Enter your email and password.';
      loginError.hidden = false;
      return;
    }

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = 'Signing in…';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        loginError.textContent = error.message;
        loginError.hidden = false;
        return;
      }

      showDashboard(data.user?.email);
      void loadSummary();
    } catch (err) {
      loginError.textContent = err?.message || 'Sign in failed. Check your connection and try again.';
      loginError.hidden = false;
    } finally {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = 'Sign in';
    }
  });

  signOutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    selectedDealer = null;
    detailPanel.hidden = true;
    showLogin();
  });

  refreshBtn.addEventListener('click', () => {
    void loadSummary();
    if (selectedDealer) {
      const row = rows.find((r) => r.dealer_key === selectedDealer);
      void loadDetail(selectedDealer, row?.dealer_name);
    }
  });

  document.querySelectorAll('.admin-range-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-range-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      days = Number(btn.dataset.days || 30);
      void loadSummary();
      if (selectedDealer) {
        const row = rows.find((r) => r.dealer_key === selectedDealer);
        void loadDetail(selectedDealer, row?.dealer_name);
      }
    });
  });

  dealerSearch.addEventListener('input', renderTable);

  dealerTableBody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-key]');
    if (!tr) return;
    const key = tr.dataset.key;
    const row = rows.find((r) => r.dealer_key === key);
    void loadDetail(key, row?.dealer_name || key);
  });

  document.querySelectorAll('#dealerTable th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir *= -1;
      else {
        sortKey = key;
        sortDir = key === 'dealer_name' || key === 'import_source' ? 1 : -1;
      }
      renderTable();
    });
  });

  closeDetailBtn.addEventListener('click', () => {
    detailPanel.hidden = true;
    selectedDealer = null;
    renderTable();
  });

  if (window.location.protocol === 'file:') {
    showBootError(
      'This admin page must be opened through a web server, not as a local file. Use https://www.useautoswiper.com/admin/ or run: npx serve website',
    );
  }

  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      showDashboard(data.session.user.email);
      void loadSummary();
    }
  });
})();
