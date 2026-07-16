(function () {

  'use strict';



  var cfg = window.AUTOSWIPER_CONFIG || {};

  var scheme = cfg.appScheme || 'autoswipe';



  function normalizeCode(raw) {

    return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  }



  function parseCode() {

    var params = new URLSearchParams(window.location.search);

    return normalizeCode(params.get('ref') || params.get('code'));

  }



  function appCreatorUrl(code) {

    return scheme + '://creator?ref=' + encodeURIComponent(code);

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

    var deepLink = appCreatorUrl(code);

    var iframe = document.createElement('iframe');

    iframe.style.display = 'none';

    iframe.src = deepLink;

    document.body.appendChild(iframe);

    window.setTimeout(function () {

      document.body.removeChild(iframe);

    }, 2000);

    window.location.href = deepLink;

  }



  function recordClick(code) {

    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase?.createClient) return;

    var client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

    client.rpc('record_creator_link_click', {

      p_code: code,

      p_user_agent: navigator.userAgent || null,

      p_referrer: document.referrer || null,

    }).then(function (res) {

      if (res.data && res.data.ok && res.data.display_name) {

        setText('creatorTitle', res.data.display_name);

      }

    }).catch(function () {});

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



    if (!code || code.length < 3) {

      hide('creatorReady');

      show('creatorMissing');

      return;

    }



    setText('creatorCode', code);

    setText('creatorTitle', 'AutoSwiper');

    show('creatorReady');

    hide('creatorMissing');



    recordClick(code);



    if (openBtn) {

      openBtn.addEventListener('click', function () {

        tryOpenApp(code);

      });

    }



    tryOpenApp(code);



    window.setTimeout(function () {

      show('creatorFallback');

    }, 2200);

  }



  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', init);

  } else {

    init();

  }

})();

