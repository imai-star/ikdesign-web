/* IKDesign コーポレートサイト 共通スクリプト（カラー刷新 2026-07）
   ハンバーガーナビ / FAQアコーディオン / コラムのカテゴリ絞り込み。
   依存なしのバニラJS。data-features 属性で各機能を有効化する。 */
(function () {
  'use strict';

  // ── ハンバーガーナビ ──────────────────────────────────────────
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // ナビ内リンク押下で閉じる
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── FAQ アコーディオン（一度に1件開く） ───────────────────────
  function initAccordion() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.dc-acc-q'));
    if (!buttons.length) return;
    function setMark(btn, open) {
      var spans = btn.querySelectorAll('span');
      var mark = spans[spans.length - 1];
      if (mark) mark.textContent = open ? '−' : '＋';
    }
    buttons.forEach(function (btn) {
      var panel = btn.nextElementSibling;
      while (panel && !panel.classList.contains('dc-acc-a')) panel = panel.nextElementSibling;
      if (!panel) return;
      setMark(btn, panel.getAttribute('data-open') === 'true');
      btn.addEventListener('click', function () {
        var isOpen = panel.getAttribute('data-open') === 'true';
        // 他を閉じる
        buttons.forEach(function (other) {
          if (other === btn) return;
          var op = other.nextElementSibling;
          while (op && !op.classList.contains('dc-acc-a')) op = op.nextElementSibling;
          if (op) { op.setAttribute('data-open', 'false'); setMark(other, false); }
        });
        panel.setAttribute('data-open', isOpen ? 'false' : 'true');
        setMark(btn, !isOpen);
      });
    });
  }

  // ── コラム カテゴリ絞り込み ────────────────────────────────────
  function initFilter() {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.dc-cat'));
    if (!chips.length) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-cat]:not(.dc-cat)'));
    var feature = document.querySelector('.dc-feature');
    var ACTIVE = { bg: '#3a4f5c', fg: '#ffffff', border: '#3a4f5c' };
    var INACTIVE = { bg: '#ffffff', fg: '#3a4f5c', border: '#c3d0d8' };
    function paint(chip, on) {
      var s = on ? ACTIVE : INACTIVE;
      chip.style.background = s.bg;
      chip.style.color = s.fg;
      chip.style.borderColor = s.border;
    }
    function apply(cat) {
      chips.forEach(function (c) { paint(c, c.getAttribute('data-cat') === cat); });
      cards.forEach(function (card) {
        var show = (cat === 'すべて') || (card.getAttribute('data-cat') === cat);
        card.style.display = show ? '' : 'none';
      });
      if (feature) {
        var showF = (cat === 'すべて' || cat === 'コラム');
        feature.setAttribute('data-open', showF ? 'true' : 'false');
      }
    }
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () { apply(chip.getAttribute('data-cat')); });
    });
  }

  // 空き家グラフ: スマホで横スクロールになるときは、予測（右端）が見える位置から表示する
  function initChartScroll() {
    document.querySelectorAll('.akc-scroll').forEach(function (el) {
      if (el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth;
    });
  }

  // GA4 計測: 問い合わせにつながるクリックをイベントとして送る
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  function initTracking() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var where = { link_text: (a.textContent || '').trim().slice(0, 40), page_path: location.pathname };
      if (href.indexOf('tel:') === 0) track('click_tel', where);
      else if (href.indexOf('mailto:') === 0) track('click_email', where);
      else if (href === '/line') track('click_line', where);
      else if (href.indexOf('/contact') === 0) track('click_contact', where);
    });
  }

  // お問い合わせフォーム（/contact）: Google Apps Script のウェブアプリへ送信
  var CATEGORY_BY_TYPE = {
    fudosan: '相続・不動産のご相談', akiya: '空き家のご相談', baikyaku: '売却・活用のご相談',
    keiei: '経営コンサルティング', 'ai-dx': 'AIシステム開発・DX', partner: '士業パートナー・提携'
  };
  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    function el(n) { return form.elements.namedItem(n); }
    var started = Date.now();
    var errBox = form.querySelector('.cf-error');
    var btn = form.querySelector('.cf-submit');
    var done = document.querySelector('.cf-done');

    var type = new URLSearchParams(location.search).get('type');
    if (type && CATEGORY_BY_TYPE[type]) el('category').value = CATEGORY_BY_TYPE[type];

    function showError(msg) {
      errBox.textContent = msg;
      errBox.hidden = false;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errBox.hidden = true;
      var missing = [];
      if (!el('category').value) missing.push('ご相談の種類');
      if (!el('name').value.trim()) missing.push('お名前');
      if (!el('email').value.trim()) missing.push('メールアドレス');
      if (!el('message').value.trim()) missing.push('ご相談内容');
      if (missing.length) return showError('未入力の項目があります：' + missing.join('、'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el('email').value.trim())) return showError('メールアドレスの形式をご確認ください。');
      if (!el('agree').checked) return showError('個人情報の取り扱いへの同意にチェックを入れてください。');

      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) return showError('ただいまフォームを準備中です。お手数ですが info@ikd-kk.com までメールでご連絡ください。');

      var checked = form.querySelector('input[name="contactBy"]:checked');
      var data = {
        category: el('category').value, name: el('name').value, kana: el('kana').value,
        company: el('company').value, email: el('email').value, phone: el('phone').value,
        contactBy: checked ? checked.value : '', message: el('message').value,
        website: el('website').value, elapsed: Date.now() - started,
        page: document.referrer || location.href
      };
      btn.disabled = true;
      btn.textContent = '送信しています…';
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.result !== 'success') throw new Error(res.message || 'error');
          track('generate_lead', { inquiry_type: data.category, contact_by: data.contactBy });
          form.hidden = true;
          done.hidden = false;
          window.scrollTo({ top: done.getBoundingClientRect().top + window.scrollY - 120 });
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.textContent = 'この内容で送信する';
          showError((err && err.message && err.message !== 'error' && err.message.indexOf('Failed') < 0 ? err.message : '送信できませんでした。') +
            ' 時間をおいて再度お試しいただくか、info@ikd-kk.com までメールでご連絡ください。');
        });
    });
  }

  function boot() {
    initNav();
    initChartScroll();
    initTracking();
    initContactForm();
    var f = (document.body.getAttribute('data-features') || '').split(/\s+/);
    if (f.indexOf('accordion') >= 0) initAccordion();
    if (f.indexOf('filter') >= 0) initFilter();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
