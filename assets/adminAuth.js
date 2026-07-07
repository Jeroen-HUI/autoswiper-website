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
    let signedIn = false;

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

    function resetBusyState() {
      setBusy(false);
    }

    resetBusyState();

    async function handlePasswordSignIn() {
      if (busy) {
        showError('Still working on the last sign-in attempt. Wait a moment, or refresh the page.');
        return;
      }

      clearMessages();
      const email = normalizeEmail(emailInput?.value);
      const password = passwordInput?.value || '';

      if (!email || !password) {
        showError('Enter your email and password.');
        return;
      }

      setBusy(true, 'Signing in…');
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
        if (!data.user) {
          showError('Sign in did not return a user. Try again.');
          return;
        }
        signedIn = true;
        await onSignedIn(data.user);
      } catch (err) {
        showError(err?.message || 'Sign in failed. Check your connection and try again.');
      } finally {
        resetBusyState();
      }
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user || signedIn) return;
      if (event === 'SIGNED_IN') {
        signedIn = true;
        resetBusyState();
        void onSignedIn(session.user);
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void handlePasswordSignIn();
    });

    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        if (form && typeof form.requestSubmit === 'function') {
          e.preventDefault();
          form.requestSubmit();
        }
      });
    }

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        if (busy) {
          showError('Still working on the last sign-in attempt. Wait a moment, or refresh the page.');
          return;
        }

        clearMessages();
        setBusy(true, 'Redirecting…');

        let redirected = false;
        const resetTimer = window.setTimeout(() => {
          if (!redirected) {
            resetBusyState();
            showError(
              'Google sign-in did not start. In Supabase → Authentication → URL Configuration, add https://www.useautoswiper.com/admin/ as a redirect URL.',
            );
          }
        }, 4000);

        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl(),
              queryParams: { prompt: 'select_account' },
            },
          });

          if (error) {
            window.clearTimeout(resetTimer);
            showError(error.message);
            resetBusyState();
            return;
          }

          if (data?.url) {
            redirected = true;
            window.location.assign(data.url);
            return;
          }

          window.clearTimeout(resetTimer);
          showError('Google sign-in did not return a redirect URL.');
          resetBusyState();
        } catch (err) {
          window.clearTimeout(resetTimer);
          showError(err?.message || 'Google sign-in failed.');
          resetBusyState();
        }
      });
    }

    if (magicBtn) {
      magicBtn.addEventListener('click', async () => {
        if (busy) {
          showError('Still working on the last sign-in attempt. Wait a moment, or refresh the page.');
          return;
        }

        clearMessages();
        const email = normalizeEmail(emailInput?.value);
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
          resetBusyState();
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
