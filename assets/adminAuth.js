(function () {
  'use strict';

  function redirectUrl() {
    return window.location.href.split('#')[0].split('?')[0];
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function createClient(cfg) {
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }

  async function initSession(supabase, callbacks) {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
      callbacks.showLogin();
      return null;
    }

    if (data.session?.user) {
      await callbacks.onSignedIn(data.session.user);
      return data.session;
    }

    callbacks.showLogin();
    return null;
  }

  function wireLoginForm(supabase, elements, onSignedIn) {
    const form = elements.form;
    const errorEl = elements.errorEl;
    const successEl = elements.successEl;
    const submitBtn = elements.submitBtn;
    const emailInput = elements.emailInput;
    const passwordInput = elements.passwordInput;
    const googleBtn = elements.googleBtn;
    const magicBtn = elements.magicBtn;

    let busy = false;

    function showError(message) {
      if (successEl) successEl.hidden = true;
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
    }

    function showSuccess(message) {
      if (errorEl) errorEl.hidden = true;
      if (successEl) {
        successEl.textContent = message;
        successEl.hidden = false;
      }
    }

    function clearMessages() {
      if (errorEl) errorEl.hidden = true;
      if (successEl) successEl.hidden = true;
    }

    function setBusy(active, label) {
      busy = active;
      if (submitBtn) {
        submitBtn.disabled = active;
        submitBtn.textContent = active ? label || 'Signing in…' : 'Sign in';
      }
      if (googleBtn) googleBtn.disabled = active;
      if (magicBtn) magicBtn.disabled = active;
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        void onSignedIn(session.user);
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (busy) return;

      clearMessages();
      const email = normalizeEmail(emailInput.value);
      const password = passwordInput.value;

      if (!email || !password) {
        showError('Enter your email and password.');
        return;
      }

      setBusy(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          showError(
            error.message === 'Invalid login credentials'
              ? 'Invalid email or password. Try Continue with Google if you sign in that way in the app.'
              : error.message,
          );
          return;
        }
        await onSignedIn(data.user);
      } catch (err) {
        showError(err?.message || 'Sign in failed. Check your connection and try again.');
      } finally {
        setBusy(false);
      }
    });

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        if (busy) return;
        clearMessages();
        setBusy(true, 'Redirecting…');
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl(),
              queryParams: { prompt: 'select_account' },
            },
          });
          if (error) {
            showError(error.message);
            setBusy(false);
          }
        } catch (err) {
          showError(err?.message || 'Google sign-in failed.');
          setBusy(false);
        }
      });
    }

    if (magicBtn) {
      magicBtn.addEventListener('click', async () => {
        if (busy) return;
        clearMessages();

        const email = normalizeEmail(emailInput.value);
        if (!email) {
          showError('Enter your email first, then request a sign-in link.');
          return;
        }

        setBusy(true, 'Sending link…');
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: redirectUrl() },
          });
          if (error) {
            showError(error.message);
            return;
          }
          showSuccess('Check your email for a sign-in link. Open it on this device to finish logging in.');
        } catch (err) {
          showError(err?.message || 'Could not send sign-in link.');
        } finally {
          setBusy(false);
        }
      });
    }
  }

  window.AdminAuth = {
    redirectUrl,
    normalizeEmail,
    createClient,
    initSession,
    wireLoginForm,
  };
})();
