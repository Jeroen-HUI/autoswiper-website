(function () {
  'use strict';

  var cfg = window.AUTOSWIPER_CONFIG || {};
  var scheme = cfg.appScheme || 'autoswipe';

  function normalizeCode(raw) {
    return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function appInviteUrl(code) {
    return scheme + '://invite?code=' + encodeURIComponent(code);
  }

  function parseCode() {
    var params = new URLSearchParams(window.location.search);
    return normalizeCode(params.get('code'));
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function show(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = false;
  }

  function hide(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = true;
  }

  function tryOpenApp(code) {
    var deepLink = appInviteUrl(code);
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);
    window.setTimeout(function () {
      document.body.removeChild(iframe);
    }, 2000);
    window.location.href = deepLink;
  }

  function init() {
    var code = parseCode();
    var openBtn = document.getElementById('openAppBtn');
    var playLink = document.getElementById('playStoreLink');
    var appStoreLink = document.getElementById('appStoreLink');

    if (playLink && cfg.playStoreUrl) {
      playLink.href = cfg.playStoreUrl;
    } else if (playLink) {
      playLink.hidden = true;
    }

    if (appStoreLink && cfg.appStoreUrl) {
      appStoreLink.href = cfg.appStoreUrl;
    } else if (appStoreLink) {
      appStoreLink.hidden = true;
    }

    if (!code) {
      hide('inviteReady');
      show('inviteMissing');
      return;
    }

    setText('inviteCode', code);
    show('inviteReady');
    hide('inviteMissing');

    if (openBtn) {
      openBtn.addEventListener('click', function () {
        tryOpenApp(code);
      });
    }

    // Auto-open the app when the page loads (installed users).
    tryOpenApp(code);

    // If still here after a moment, show download fallback.
    window.setTimeout(function () {
      show('inviteFallback');
    }, 2200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
