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

  function boot() {
    initNav();
    var f = (document.body.getAttribute('data-features') || '').split(/\s+/);
    if (f.indexOf('accordion') >= 0) initAccordion();
    if (f.indexOf('filter') >= 0) initFilter();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
