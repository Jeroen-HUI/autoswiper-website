(function () {
  const cfg = window.AUTOSWIPER_CONFIG;
  if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey) return;

  const forms = document.querySelectorAll('[data-waitlist-form]');
  if (!forms.length) return;

  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = form.querySelector('[name="email"]');
      const platformInput = form.querySelector('[name="platform"]:checked');
      const honeypot = form.querySelector('[name="company"]');
      const submitBtn = form.querySelector('[type="submit"]');
      const statusEl = form.querySelector('[data-waitlist-status]');

      if (!emailInput || honeypot?.value) return;

      const email = emailInput.value.trim().toLowerCase();
      const platform = platformInput?.value || 'both';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus(statusEl, 'Please enter a valid email address.', 'error');
        return;
      }

      submitBtn.disabled = true;
      setStatus(statusEl, 'Joining…', 'loading');

      try {
        const res = await fetch(`${cfg.supabaseUrl}/functions/v1/waitlist-signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, platform, source: 'website' }),
        });

        if (res.ok) {
          form.reset();
          const both = form.querySelector('[name="platform"][value="both"]');
          if (both) both.checked = true;
          setStatus(statusEl, "You're on the list! We'll email you when AutoSwiper launches.", 'success');
          return;
        }

        const body = await res.json().catch(() => ({}));
        if (res.status === 429 || body?.error?.includes('waitlist_rate_limit')) {
          setStatus(statusEl, 'Too many attempts from your network. Please try again later.', 'error');
          return;
        }
        if (body?.error?.includes('waitlist_invalid_email')) {
          setStatus(statusEl, 'Please enter a valid email address.', 'error');
          return;
        }

        throw new Error(body?.error || `Request failed (${res.status})`);
      } catch (err) {
        setStatus(statusEl, 'Something went wrong. Please try again.', 'error');
        console.error('[waitlist]', err);
      } finally {
        submitBtn.disabled = false;
      }
    });
  });

  function setStatus(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = !msg;
    el.className = 'waitlist__status waitlist__status--' + type;
  }
})();
