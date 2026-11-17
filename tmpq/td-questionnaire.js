/* ==========================================================================
   The Thrifting Den — pre-booking questionnaire engine + UI
   Vanilla JS, no dependencies. Content lives in td-questionnaire-<key>.js
   ========================================================================== */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ *
   * ENGINE (pure functions — no DOM)
   * ------------------------------------------------------------------ */
  var STORAGE_PREFIX = 'tdq:';
  var HANDOFF_PREFIX = 'tdq:handoff:';
  var MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

  function findQ(cfg, qid) {
    for (var i = 0; i < cfg.questions.length; i++) if (cfg.questions[i].id === qid) return cfg.questions[i];
    return null;
  }
  function findOpt(q, oid) {
    for (var i = 0; i < q.options.length; i++) if (q.options[i].id === oid) return q.options[i];
    return null;
  }

  function shuffle(arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildOrder(cfg, rnd) {
    var order = {};
    cfg.questions.forEach(function (q) {
      var free = q.options.filter(function (o) { return !o.pinLast; });
      var pinned = q.options.filter(function (o) { return o.pinLast; });
      var ids = (cfg.shuffleOptions ? shuffle(free, rnd) : free).concat(pinned).map(function (o) { return o.id; });
      order[q.id] = ids;
    });
    return order;
  }

  function createState(cfg, rnd) {
    return {
      v: cfg.version,
      savedAt: Date.now(),
      view: 'intro',      // intro | timing | returning | skip | question | fyi | reminders | final
      returning: null,    // returning-consignor answer id (A skips the check)
      idx: 0,
      answers: {},        // qid -> optionId (green answers only)
      order: buildOrder(cfg, rnd || Math.random),
      log: [],            // every selection: {q,o,out,t}
      ack: false,
      timingAck: false,   // ticked the optional timing notice (cfg.timing)
      fyiSeen: false,
      remSeen: false
    };
  }

  // Validate a restored state against the current config
  function restoreState(cfg, saved) {
    if (!saved || saved.v !== cfg.version) return null;
    if (!saved.savedAt || Date.now() - saved.savedAt > MAX_AGE_MS) return null;
    var answers = {};
    cfg.questions.forEach(function (q) {
      var o = saved.answers && saved.answers[q.id] ? findOpt(q, saved.answers[q.id]) : null;
      if (o && o.outcome === 'green') answers[q.id] = o.id;
    });
    saved.answers = answers;
    if (!saved.order) saved.order = buildOrder(cfg, Math.random);
    saved.log = saved.log || [];
    return saved;
  }

  // Record a selection. Only green answers are kept as "answers".
  function select(state, cfg, qid, oid, now) {
    var q = findQ(cfg, qid), o = q && findOpt(q, oid);
    if (!o) return null;
    state.log.push({ q: qid, o: oid, out: o.outcome, t: now || Date.now() });
    if (o.outcome === 'green') state.answers[qid] = oid;
    else delete state.answers[qid];
    state.ack = false; // any change invalidates the final acknowledgement
    if (o.outcome !== 'green') state.fyiSeen = false; // a new red/amber means the checklist should be shown again
    state.savedAt = Date.now();
    return o;
  }

  function isComplete(state, cfg) {
    return cfg.questions.every(function (q) {
      var o = state.answers[q.id] ? findOpt(q, state.answers[q.id]) : null;
      return o && o.outcome === 'green';
    });
  }
  function answeredCount(state, cfg) {
    return cfg.questions.filter(function (q) { return !!state.answers[q.id]; }).length;
  }
  function firstIncomplete(state, cfg) {
    for (var i = 0; i < cfg.questions.length; i++) if (!state.answers[cfg.questions[i].id]) return i;
    return -1;
  }

  // Reminders for every red/amber answer the customer tried at any point
  function fyiItems(state, cfg) {
    var out = [];
    if (!cfg.fyi) return out;
    cfg.questions.forEach(function (q, i) {
      var hit = {};
      state.log.forEach(function (e) { if (e.q === q.id && e.out !== 'green') hit[e.o] = true; });
      var replaced = {};
      q.options.forEach(function (o) { if (hit[o.id] && o.fyiReplaces) o.fyiReplaces.forEach(function (id) { replaced[id] = true; }); });
      q.options.forEach(function (o) { if (hit[o.id] && o.fyi && !replaced[o.id]) out.push({ step: i + 1, qid: q.id, oid: o.id, text: o.fyi }); });
    });
    return out;
  }

  // Which page follows the last question: checklist (if needed) -> reminders -> final
  function viewAfterQuestions(state, cfg) {
    if (cfg.fyi && !state.fyiSeen && fyiItems(state, cfg).length) return 'fyi';
    if (cfg.reminders && !state.remSeen) return 'reminders';
    return 'final';
  }

  function nzTime(d) {
    try {
      return d.toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland', dateStyle: 'medium', timeStyle: 'medium' });
    } catch (e) { return ''; }
  }
  function makeRef(cfg, d, rnd) {
    var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', s = '';
    var buf = null;
    try { buf = root.crypto.getRandomValues(new Uint8Array(6)); } catch (e) {}
    for (var i = 0; i < 6; i++) s += chars.charAt(buf ? buf[i] % chars.length : Math.floor((rnd || Math.random)() * chars.length));
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'TD-' + cfg.serviceCode + '-' + d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + '-' + s;
  }

  function stripHtml(s) { return String(s || '').replace(/<[^>]*>/g, ''); }

  // Build the hidden line-item properties saved on the order
  function buildRecord(state, cfg, now, rnd) {
    var d = now || new Date();
    var ref = makeRef(cfg, d, rnd);
    var ro = cfg.returning && state.returning ? findOpt(cfg.returning, state.returning) : null;
    var retText = ro ? ro.id + ': ' + ro.record : 'n/a';
    var timingRec = cfg.timing ? 'Ticked: ' + stripHtml(cfg.timing.ackLabel) : null;
    if (ro && ro.skip) {
      var sp = { ref: ref, properties: {
        '_questionnaire': cfg.serviceName,
        '_q_version': cfg.version,
        '_q_ref': ref,
        '_q_completed_at': d.toISOString() + ' (' + nzTime(d) + ')',
        '_q_returning': retText,
        '_q_ack': (cfg.returning && cfg.returning.skipRecord) || 'Check skipped (returning customer, self-declared)',
        '_q_answers': 'returning=' + ro.id
      } };
      if (timingRec) sp.properties['_q_timing'] = timingRec;
      return sp;
    }
    var codes = [], detail = [], logParts = [];
    cfg.questions.forEach(function (q, i) {
      var o = findOpt(q, state.answers[q.id]);
      codes.push(q.id + '=' + o.id);
      detail.push('Q' + (i + 1) + ' ' + stripHtml(q.prompt) + ' -> ' + o.id + ': ' + stripHtml(o.text));
    });
    var mark = { green: '+', amber: '~', red: '!' };
    // Wrong (amber/red) answers picked along the way, in order, with full wording
    var attempts = [];
    cfg.questions.forEach(function (q, i) {
      var tried = [];
      state.log.forEach(function (e) {
        if (e.q !== q.id || e.out === 'green') return;
        var o = findOpt(q, e.o);
        if (o) tried.push(o.id + ': ' + stripHtml(o.text) + ' [' + e.out + ']');
      });
      if (tried.length) attempts.push('Q' + (i + 1) + ' ' + stripHtml(q.title || q.id) + ' -> first chose ' + tried.join(' | then ') + ' | final answer ' + state.answers[q.id]);
    });
    state.log.forEach(function (e) { logParts.push(e.q + ':' + e.o + (mark[e.out] || '')); });
    var full = {
      ref: ref,
      properties: {
        '_questionnaire': cfg.serviceName,
        '_q_version': cfg.version,
        '_q_ref': ref,
        '_q_completed_at': d.toISOString() + ' (' + nzTime(d) + ')',
        '_q_returning': retText,
        '_q_ack': 'Ticked: ' + stripHtml(cfg.final.ackLabel) + ' ' + stripHtml(cfg.final.ackExtra || ''),
        '_q_reminders': cfg.reminders ? 'Reminders page shown and continued' : 'n/a',
        '_q_fyi': (function () {
          var f = fyiItems(state, cfg);
          return f.length ? f.map(function (x) { return 'Step ' + x.step + ' (' + x.qid + ':' + x.oid + '): ' + stripHtml(x.text); }).join('\n') : 'None (all answers green first time)';
        })(),
        '_q_answers': codes.join(';'),
        '_q_log': logParts.join(','),
        '_q_attempts': attempts.length ? attempts.join('\n') : 'None (all answers green first time)',
        '_q_detail': detail.join('\n')
      }
    };
    if (timingRec) full.properties['_q_timing'] = timingRec;
    return full;
  }

  var Engine = {
    createState: createState, restoreState: restoreState, select: select,
    isComplete: isComplete, answeredCount: answeredCount, firstIncomplete: firstIncomplete,
    buildRecord: buildRecord, fyiItems: fyiItems, viewAfterQuestions: viewAfterQuestions, findQ: findQ, findOpt: findOpt, makeRef: makeRef
  };

  /* ------------------------------------------------------------------ *
   * UI
   * ------------------------------------------------------------------ */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function init(rootEl, options) {
    options = options || {};
    var doc = rootEl.ownerDocument;
    var key = rootEl.getAttribute('data-tdq-key') || 'swu';
    var cfg = (root.TD_QUESTIONNAIRES || {})[key];
    if (!cfg) { rootEl.innerHTML = '<p class="tdq-error">Questionnaire content not found.</p>'; return null; }

    var variantId = rootEl.getAttribute('data-variant-id');
    var available = rootEl.getAttribute('data-available') !== 'false';
    var dryRun = rootEl.getAttribute('data-dry-run') === 'true';
    var productUrl = rootEl.getAttribute('data-product-url') || '';
    var redirectTo = rootEl.getAttribute('data-redirect') || '/cart';
    var cartAddUrl = rootEl.getAttribute('data-cart-add-url') || '/cart/add.js';
    var storageKey = STORAGE_PREFIX + cfg.key;

    var state = null;
    try { state = restoreState(cfg, JSON.parse(root.localStorage.getItem(storageKey))); } catch (e) {}
    if (!state) state = createState(cfg);

    function save() { try { root.localStorage.setItem(storageKey, JSON.stringify(state)); } catch (e) {} }

    var autoTimer = null;
    var lastFocusEl = null;

    rootEl.classList.add('tdq');
    rootEl.innerHTML =
      '<div class="tdq-shell">' +
        '<div class="tdq-top" data-tdq-top hidden></div>' +
        '<div class="tdq-main" data-tdq-main aria-live="polite"></div>' +
        '<div class="tdq-foot" data-tdq-foot hidden><button type="button" class="tdq-link" data-act="restart">Start over</button></div>' +
      '</div>' +
      '<dialog class="tdq-dialog" data-tdq-dialog aria-labelledby="tdq-dlg-title"></dialog>';

    var topEl = rootEl.querySelector('[data-tdq-top]');
    var mainEl = rootEl.querySelector('[data-tdq-main]');
    var footEl = rootEl.querySelector('[data-tdq-foot]');
    var dlg = rootEl.querySelector('[data-tdq-dialog]');

    function sectionOf(q) {
      for (var i = 0; i < cfg.sections.length; i++) if (cfg.sections[i].id === q.section) return cfg.sections[i];
      return { title: '' };
    }

    /* ---------- links ---------- */
    function buttonsHtml(buttons) {
      if (!buttons || !buttons.length) return '';
      return '<div class="tdq-btnrow">' + buttons.map(function (b) {
        if (b.popup) return '<button type="button" class="tdq-btn tdq-btn--ghost" data-act="info" data-info="' + esc(b.popup) + '">' + esc(b.label) + ' <span aria-hidden="true">\u24d8</span></button>';
        var l = cfg.links[b.link];
        if (!l) return '';
        return '<a class="tdq-btn tdq-btn--ghost" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(b.label) + ' <span aria-hidden="true">↗</span><span class="tdq-sr"> (opens in a new tab)</span></a>';
      }).join('') + '</div>';
    }

    function fullDetailsHtml() {
      var f = cfg.intro && cfg.intro.fullDetails, l = f && cfg.links[f.link];
      if (!l) return '';
      return '<p class="tdq-fulldetails">' + esc(f.before) + '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(f.label) + ' ↗<span class="tdq-sr"> (opens in a new tab)</span></a>.</p>';
    }

    /* ---------- dialog ---------- */
    var dlgKinds = {
      green: { cls: 'ok', label: 'All good' },
      amber: { cls: 'info', label: 'Quick note' },
      red: { cls: 'stop', label: 'Not quite yet' },
      help: { cls: 'help', label: 'Helpful info' }
    };
    function openDialog(kind, title, message, buttons, closeLabel) {
      var k = dlgKinds[kind];
      dlg.className = 'tdq-dialog tdq-dialog--' + k.cls;
      dlg.innerHTML =
        '<div class="tdq-dialog__inner">' +
          '<div class="tdq-dialog__head"><span class="tdq-badge tdq-badge--' + k.cls + '"><span class="tdq-badge__icon" aria-hidden="true">' +
            (kind === 'amber' ? 'ℹ' : kind === 'red' ? '✕' : kind === 'help' ? '?' : '✓') +
          '</span>' + k.label + '</span>' +
          '<button type="button" class="tdq-x" data-act="close-dialog" aria-label="Close">×</button></div>' +
          '<h2 id="tdq-dlg-title" class="tdq-dialog__title">' + esc(title) + '</h2>' +
          '<div class="tdq-dialog__msg">' + message + '</div>' +
          buttonsHtml(buttons) +
          '<button type="button" class="tdq-btn tdq-btn--primary" data-act="close-dialog">' + esc(closeLabel) + '</button>' +
        '</div>';
      if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); }
      else dlg.setAttribute('open', '');
      var first = dlg.querySelector('.tdq-btn--primary');
      if (first && first.focus) first.focus();
    }
    function closeDialog() {
      if (typeof dlg.close === 'function' && dlg.open) dlg.close();
      else dlg.removeAttribute('open');
      afterDialogClose();
    }
    function afterDialogClose() {
      // Red/amber answers aren't stored, so clear any visual selection and refocus
      var checked = mainEl.querySelectorAll('input[type=radio]:checked');
      for (var i = 0; i < checked.length; i++) {
        var q = state.view === 'question' ? cfg.questions[state.idx] : null;
        if (!q || !state.answers[q.id]) checked[i].checked = false;
      }
      var q2 = state.view === 'question' ? cfg.questions[state.idx] : null;
      var target = (q2 && mainEl.querySelector('input[type=radio]')) || lastFocusEl;
      if (target && target.focus) target.focus();
    }
    dlg.addEventListener('close', function () { /* native close via Esc */ afterDialogClose(); });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) closeDialog(); // backdrop click — harmless, answer isn't stored
    });

    /* ---------- progress ---------- */
    function renderTop() {
      if (state.view === 'intro') { topEl.hidden = true; footEl.hidden = true; return; }
      topEl.hidden = false; footEl.hidden = false;
      var total = cfg.questions.length;
      var done = answeredCount(state, cfg);
      var pct = Math.round(done / total * 100);
      var label, secTitle = '';
      var word = cfg.progressWord || 'Question';
      if (state.view === 'final') { label = 'All ' + total + ' ' + word.toLowerCase() + 's complete'; secTitle = 'Final step'; }
      else if (state.view === 'timing') { label = 'Before we start'; secTitle = 'Important update'; }
      else if (state.view === 'returning') { label = 'Quick question'; secTitle = 'Before we start'; }
      else if (state.view === 'skip') { label = 'Welcome back'; secTitle = 'Check skipped'; }
      else if (state.view === 'fyi') { label = 'Almost there'; secTitle = 'Your checklist'; }
      else if (state.view === 'reminders') { label = 'Almost there'; secTitle = 'Quick reminders'; }
      else {
        var q = cfg.questions[state.idx];
        label = word + ' ' + (state.idx + 1) + ' of ' + total;
        secTitle = sectionOf(q).title;
      }
      topEl.innerHTML =
        '<div class="tdq-progress__meta"><span class="tdq-progress__q">' + esc(label) + '</span><span class="tdq-progress__sec">' + esc(secTitle) + '</span></div>' +
        '<div class="tdq-progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '" aria-label="Questionnaire progress: ' + done + ' of ' + total + ' answered">' +
        '<div class="tdq-progress__bar" style="width:' + pct + '%"></div></div>';
    }

    /* ---------- views ---------- */
    function renderIntro() {
      var started = answeredCount(state, cfg) > 0 || !!state.returning;
      mainEl.innerHTML =
        '<div class="tdq-card tdq-fade">' +
          '<h1 class="tdq-h1">' + esc(cfg.intro.title) + '</h1>' +
          cfg.intro.paragraphs.map(function (p) { return '<p class="tdq-p">' + p + '</p>'; }).join('') +
          (cfg.intro.buttons ? buttonsHtml(cfg.intro.buttons) : '') +
          (cfg.intro.note ? '<p class="tdq-note">' + cfg.intro.note + '</p>' : '') +
          '<div class="tdq-actions">' +
            '<button type="button" class="tdq-btn tdq-btn--primary" data-act="start">' + (started ? 'Continue where I left off' : esc(cfg.intro.startLabel)) + '</button>' +
          '</div>' +
          '<noscript><p class="tdq-p">Please enable JavaScript to complete this check.</p></noscript>' +
        '</div>';
    }

    function renderTiming() {
      var t = cfg.timing;
      mainEl.innerHTML =
        '<div class="tdq-card tdq-fade">' +
          '<h1 class="tdq-h1">' + esc(t.title) + '</h1>' +
          t.paragraphs.map(function (p) { return '<p class="tdq-p">' + p + '</p>'; }).join('') +
          '<div class="tdq-ack">' +
            '<input type="checkbox" id="tdq-timing-ack" class="tdq-ack__input"' + (state.timingAck ? ' checked' : '') + '>' +
            '<label for="tdq-timing-ack" class="tdq-ack__label"><span class="tdq-ack__box" aria-hidden="true"></span>' +
              '<span><span class="tdq-ack__main">' + esc(t.ackLabel) + '</span></span>' +
            '</label>' +
          '</div>' +
          '<div class="tdq-nav">' +
            '<button type="button" class="tdq-btn tdq-btn--ghost" data-act="back">← Back</button>' +
            '<button type="button" class="tdq-btn tdq-btn--primary" data-act="timing-next"' + (state.timingAck ? '' : ' disabled') + '>' + esc(t.buttonLabel || 'Continue') + '</button>' +
          '</div>' +
        '</div>';
    }

    function renderQuestion() {
      var q = cfg.questions[state.idx];
      var chosen = state.answers[q.id];
      var order = state.order[q.id] || q.options.map(function (o) { return o.id; });
      var optsHtml = order.map(function (oid) {
        var o = findOpt(q, oid);
        if (!o) return '';
        var id = 'tdq-' + q.id + '-' + o.id;
        return '<div class="tdq-opt">' +
          '<input class="tdq-opt__input" type="radio" name="tdq-' + esc(q.id) + '" id="' + id + '" value="' + esc(o.id) + '"' + (chosen === o.id ? ' checked' : '') + '>' +
          '<label class="tdq-opt__label" for="' + id + '">' +
            '<span class="tdq-opt__mark" aria-hidden="true"></span>' +
            '<span class="tdq-opt__text">' + esc(o.text) + '</span>' +
          '</label></div>';
      }).join('');
      var helpBtn = q.help
        ? '<button type="button" class="tdq-info" data-act="help" aria-label="More information about this question"><span aria-hidden="true">i</span></button>' : '';
      var canNext = !!chosen;
      mainEl.innerHTML =
        '<div class="tdq-card tdq-fade" data-qid="' + esc(q.id) + '">' +
          '<fieldset class="tdq-fieldset">' +
            '<legend class="tdq-legend">' +
              '<span class="tdq-kicker">' + esc(q.title) + '</span>' +
              '<span class="tdq-prompt">' + esc(q.prompt) + helpBtn + '</span>' +
            '</legend>' +
            (q.note ? '<p class="tdq-note">' + q.note + '</p>' : '') +
            (q.buttons ? buttonsHtml(q.buttons) : '') +
            fullDetailsHtml() +
            '<div class="tdq-opts">' + optsHtml + '</div>' +
          '</fieldset>' +
          '<div class="tdq-nav">' +
            '<button type="button" class="tdq-btn tdq-btn--ghost" data-act="back">← Back</button>' +
            '<button type="button" class="tdq-btn tdq-btn--primary" data-act="next"' + (canNext ? '' : ' disabled') + '>Next →</button>' +
          '</div>' +
        '</div>';
    }

    function renderReturning() {
      var r = cfg.returning, chosen = state.returning;
      var opts = r.options.map(function (o) {
        var id = 'tdq-returning-' + o.id;
        return '<div class="tdq-opt"><input class="tdq-opt__input" type="radio" name="tdq-returning" id="' + id + '" value="' + esc(o.id) + '"' + (chosen === o.id ? ' checked' : '') + '>' +
          '<label class="tdq-opt__label" for="' + id + '"><span class="tdq-opt__mark" aria-hidden="true"></span><span class="tdq-opt__text">' + esc(o.text) + '</span></label></div>';
      }).join('');
      mainEl.innerHTML =
        '<div class="tdq-card tdq-fade">' +
          '<fieldset class="tdq-fieldset"><legend class="tdq-legend">' +
            '<span class="tdq-kicker">' + esc(r.title) + '</span><span class="tdq-prompt">' + esc(r.prompt) + '</span></legend>' +
            '<div class="tdq-opts">' + opts + '</div></fieldset>' + (r.note ? '<p class="tdq-note">' + r.note + '</p>' : '') +
          '<div class="tdq-nav">' +
            '<button type="button" class="tdq-btn tdq-btn--ghost" data-act="back">← Back</button>' +
            '<button type="button" class="tdq-btn tdq-btn--primary" data-act="returning-next"' + (chosen ? '' : ' disabled') + '>Next →</button>' +
          '</div>' +
        '</div>';
    }

    function soldOutHtml() {
      var so = cfg.soldOut, l = so.button ? cfg.links[so.button.link] : null;
      return '<p class="tdq-note">' + so.message + '</p>' + (l ? buttonsHtml([so.button]) : '');
    }

    function renderSkip() {
      var s = cfg.returning.skip;
      mainEl.innerHTML =
        '<div class="tdq-card tdq-fade">' +
          '<div class="tdq-final__icon" aria-hidden="true">✓</div>' +
          '<h1 class="tdq-h1">' + esc(s.title) + '</h1>' +
          '<p class="tdq-p tdq-p--lead">' + s.message + '</p>' +
          buttonsHtml(s.buttons) +
          (!available && cfg.soldOut ? soldOutHtml() :
            '<div class="tdq-actions"><button type="button" class="tdq-btn tdq-btn--primary tdq-btn--wide" data-act="book-skip"' + (available ? '' : ' disabled') + '>' + esc(s.buttonLabel) + '</button></div>') +
          '<p class="tdq-status" data-tdq-status role="status"></p>' +
          '<div class="tdq-nav tdq-nav--single"><button type="button" class="tdq-btn tdq-btn--ghost" data-act="back">← Back</button></div>' +
        '</div>';
    }

    function renderFyi() {
      var fy = fyiItems(state, cfg), groups = [];
      fy.forEach(function (x) {
        var g = groups[groups.length - 1];
        if (!g || g.step !== x.step) { g = { step: x.step, q: cfg.questions[x.step - 1], lines: [], extra: [] }; groups.push(g); }
        g.lines.push(x.text);
        var o = findOpt(g.q, x.oid);
        (o.fyiButtons || []).forEach(function (b) { g.extra.push(b); });
      });
      var html = groups.map(function (g) {
        var btns = (g.q.fyiButtons || []).concat(g.extra);
        return '<section class="tdq-fyi__group"><h2 class="tdq-fyi__heading">' + esc(g.q.fyiTitle || g.q.title) + '</h2>' +
          '<ul class="tdq-fyi__lines">' + g.lines.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
          (g.q.fyiNote ? '<p class="tdq-fyi__note">' + g.q.fyiNote + '</p>' : '') +
          buttonsHtml(btns) + '</section>';
      }).join('');
      mainEl.innerHTML =
        '<div class="tdq-card tdq-fade" data-tdq-fyi>' +
          '<h1 class="tdq-h1">' + esc(cfg.fyi.title) + '</h1>' +
          '<p class="tdq-p">' + cfg.fyi.intro + '</p>' + html +
          '<div class="tdq-nav">' +
            '<button type="button" class="tdq-btn tdq-btn--ghost" data-act="back">← Back</button>' +
            '<button type="button" class="tdq-btn tdq-btn--primary" data-act="continue-fyi">' + esc(cfg.fyi.buttonLabel) + '</button>' +
          '</div>' +
        '</div>';
    }

    function renderReminders() {
      var r = cfg.reminders;
      var items = r.items.map(function (it) {
        var l = it.link ? cfg.links[it.link.link] : null;
        return '<li class="tdq-rem__item"><span class="tdq-rem__icon" aria-hidden="true">' + esc(it.icon) + '</span>' +
          '<span class="tdq-rem__body"><strong>' + esc(it.title) + '</strong> ' + it.text +
          (l ? ' <a class="tdq-rem__link" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(it.link.label) + ' <span aria-hidden="true">↗</span><span class="tdq-sr"> (opens in a new tab)</span></a>' : '') +
          '</span></li>';
      }).join('');
      mainEl.innerHTML =
        '<div class="tdq-card tdq-fade">' +
          '<h1 class="tdq-h1">' + esc(r.title) + '</h1>' +
          '<p class="tdq-p">' + r.intro + '</p>' +
          '<ul class="tdq-rem">' + items + '</ul>' +
          '<div class="tdq-nav">' +
            '<button type="button" class="tdq-btn tdq-btn--ghost" data-act="back">← Back</button>' +
            '<button type="button" class="tdq-btn tdq-btn--primary" data-act="continue">' + esc(r.buttonLabel) + '</button>' +
          '</div>' +
        '</div>';
    }

    function renderFinal() {
      var f = cfg.final;
      var btnDisabled = !state.ack || !available;
      mainEl.innerHTML =
        '<div class="tdq-card tdq-fade">' +
          '<div class="tdq-final__icon" aria-hidden="true">✓</div>' +
          '<h1 class="tdq-h1">' + esc(f.title) + '</h1>' +
          '<p class="tdq-p tdq-p--lead">' + esc(f.message) + '</p>' +
          '<div class="tdq-ack">' +
            '<input type="checkbox" id="tdq-ack" class="tdq-ack__input"' + (state.ack ? ' checked' : '') + '>' +
            '<label for="tdq-ack" class="tdq-ack__label"><span class="tdq-ack__box" aria-hidden="true"></span>' +
              '<span><span class="tdq-ack__main">' + esc(f.ackLabel) + '</span>' +
              (f.ackExtra ? '<span class="tdq-ack__extra">' + esc(f.ackExtra) + '</span>' : '') + '</span>' +
            '</label>' +
          '</div>' +
          (available ? '' : (cfg.soldOut ? '' : '<p class="tdq-error" role="alert">Bookings are currently unavailable. Please contact us at info@thethriftingden.com.</p>')) +
          (!available && cfg.soldOut ? soldOutHtml() :
          '<div class="tdq-actions">' +
            '<button type="button" class="tdq-btn tdq-btn--primary tdq-btn--wide" data-act="book"' + (btnDisabled ? ' disabled' : '') + '>' + esc(f.buttonLabel) + '</button>' +
          '</div>') +
          '<p class="tdq-status" data-tdq-status role="status"></p>' +
          '<div class="tdq-nav tdq-nav--single"><button type="button" class="tdq-btn tdq-btn--ghost" data-act="back">← Review my answers</button></div>' +
        '</div>';
    }

    function render() {
      renderTop();
      if (state.view === 'intro') renderIntro();
      else if (state.view === 'timing') renderTiming();
      else if (state.view === 'returning') renderReturning();
      else if (state.view === 'skip') renderSkip();
      else if (state.view === 'fyi') renderFyi();
      else if (state.view === 'reminders') renderReminders();
      else if (state.view === 'final') renderFinal();
      else renderQuestion();
    }

    /* ---------- navigation ---------- */
    function goTo(idx) {
      if (idx >= cfg.questions.length) {
        if (isComplete(state, cfg)) state.view = viewAfterQuestions(state, cfg);
        else { state.view = 'question'; state.idx = Math.max(0, firstIncomplete(state, cfg)); }
      } else { state.view = 'question'; state.idx = idx; }
      save(); render(); focusMain();
    }
    function focusMain() {
      var el = mainEl.querySelector('legend, h1');
      if (el) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: false }); }
      if (rootEl.scrollIntoView) try { rootEl.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {}
    }

    function onSelect(oid) {
      var q = cfg.questions[state.idx];
      var o = select(state, cfg, q.id, oid);
      if (!o) return;
      save();
      renderTop();
      var nextBtn = mainEl.querySelector('[data-act=next]');
      if (nextBtn) nextBtn.disabled = o.outcome !== 'green';
      if (o.outcome === 'green') {
        clearTimeout(autoTimer); // no auto-advance: the customer taps Next when they are ready
      } else {
        clearTimeout(autoTimer);
        var title = o.outcome === 'red' ? 'This isn’t quite right for you yet' : 'Just so you know…';
        var closeLabel = o.outcome === 'red' ? 'Change my answer' : 'Got it — back to the question';
        openDialog(o.outcome, title, o.message || '', o.buttons, closeLabel);
      }
    }

    /* ---------- booking ---------- */
    function setStatus(msg, isErr) {
      var s = mainEl.querySelector('[data-tdq-status]');
      if (!s) return;
      s.textContent = msg || '';
      s.className = 'tdq-status' + (isErr ? ' tdq-status--err' : '');
    }
    function submitRecord(rec, btn) {
      state.lastRef = rec.ref; save();
      if (dryRun) {
        var pre = '<div class="tdq-dry"><strong>Test mode — nothing was saved or sent on.</strong><br>' +
          (productUrl ? 'The customer would now be taken to the booking page, and these hidden properties added to the booking line item:' : 'These hidden properties would be saved on the booking line item:') + '<pre>' +
          esc(JSON.stringify(rec.properties, null, 2)) + '</pre></div>';
        var wrap = mainEl.querySelector('.tdq-card');
        var old = wrap.querySelector('.tdq-dry'); if (old) old.remove();
        wrap.insertAdjacentHTML('beforeend', pre);
        setStatus('');
        if (options.onBook) options.onBook(rec);
        return;
      }
      if (productUrl) {
        // Hand the record to the booking product page (it attaches it when they add to cart)
        try {
          root.localStorage.setItem(HANDOFF_PREFIX + cfg.key, JSON.stringify({ savedAt: Date.now(), properties: rec.properties }));
        } catch (e) {
          setStatus('Your browser is blocking something we need. Please try another browser or email info@thethriftingden.com.', true);
          return;
        }
        btn.disabled = true; setStatus('Taking you to the booking page…');
        root.location.href = productUrl;
        return;
      }
      if (!variantId) { setStatus('Booking product is not configured. Please contact us.', true); return; }
      btn.disabled = true; setStatus('Adding your spot to the cart…');
      var xhr = root.fetch(cartAddUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ items: [{ id: Number(variantId), quantity: 1, properties: rec.properties }] })
      });
      xhr.then(function (r) {
        return r.json().then(function (j) { return { ok: r.ok, body: j }; });
      }).then(function (res) {
        if (!res.ok) {
          var m = (res.body && (res.body.description || res.body.message)) || 'Something went wrong.';
          setStatus(m + ' Please try again or email info@thethriftingden.com.', true);
          btn.disabled = false; return;
        }
        setStatus('Added! Taking you to your cart…');
        root.location.href = redirectTo;
      }).catch(function () {
        setStatus('We couldn’t add your spot to the cart. Please try again or email info@thethriftingden.com.', true);
        btn.disabled = false;
      });
    }
    function book() {
      if (!state.ack || !isComplete(state, cfg)) return;
      submitRecord(buildRecord(state, cfg, new Date()), mainEl.querySelector('[data-act=book]'));
    }
    function bookSkip() {
      var ro = cfg.returning && state.returning ? findOpt(cfg.returning, state.returning) : null;
      if (!ro || !ro.skip) return;
      submitRecord(buildRecord(state, cfg, new Date()), mainEl.querySelector('[data-act=book-skip]'));
    }

    /* ---------- events ---------- */
    rootEl.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!t) return;
      var act = t.getAttribute('data-act');
      lastFocusEl = t;
      if (act === 'start') {
        if (cfg.timing && !state.timingAck) { state.view = 'timing'; save(); render(); focusMain(); }
        else proceedFromIntro();
      } else if (act === 'timing-next') {
        if (state.timingAck) proceedFromIntro();
      } else if (act === 'back') {
        clearTimeout(autoTimer);
        if (state.view === 'timing') { state.view = 'intro'; save(); render(); focusMain(); }
        else if (state.view === 'returning') { state.view = cfg.timing ? 'timing' : 'intro'; save(); render(); focusMain(); }
        else if (state.view === 'skip') { state.view = 'returning'; save(); render(); focusMain(); }
        else if (state.view === 'final') { if (cfg.reminders) { state.view = 'reminders'; save(); render(); focusMain(); } else goTo(cfg.questions.length - 1); }
        else if (state.view === 'reminders') { if (cfg.fyi && fyiItems(state, cfg).length) { state.view = 'fyi'; save(); render(); focusMain(); } else goTo(cfg.questions.length - 1); }
        else if (state.view === 'fyi') goTo(cfg.questions.length - 1);
        else if (state.idx === 0) { state.view = cfg.returning ? 'returning' : 'intro'; save(); render(); focusMain(); }
        else goTo(state.idx - 1);
      } else if (act === 'returning-next') {
        if (state.returning) afterReturning();
      } else if (act === 'book-skip') {
        bookSkip();
      } else if (act === 'continue-fyi') {
        state.fyiSeen = true; state.view = (cfg.reminders && !state.remSeen) ? 'reminders' : 'final'; save(); render(); focusMain();
      } else if (act === 'continue') {
        state.remSeen = true; state.view = 'final'; save(); render(); focusMain();
      } else if (act === 'next') {
        clearTimeout(autoTimer);
        var q = cfg.questions[state.idx];
        if (state.answers[q.id]) goTo(state.idx + 1);
      } else if (act === 'help') {
        var hq = cfg.questions[state.idx];
        openDialog('help', hq.help.title || 'More information', hq.help.message, hq.help.buttons, 'Got it');
      } else if (act === 'info') {
        var pop = cfg.popups && cfg.popups[t.getAttribute('data-info')];
        if (pop) openDialog('help', pop.title, pop.message, pop.buttons, pop.closeLabel || 'Got it');
      } else if (act === 'close-dialog') {
        closeDialog();
      } else if (act === 'book') {
        book();
      } else if (act === 'restart') {
        if (root.confirm('Start over? Your answers will be cleared.')) {
          clearTimeout(autoTimer);
          state = createState(cfg); save(); render(); focusMain();
        }
      }
    });
    // After the intro (and the optional timing notice): skip screen, returning question, or the questions
    function proceedFromIntro() {
      if (cfg.returning && state.returning && findOpt(cfg.returning, state.returning).skip) { state.view = 'skip'; save(); render(); focusMain(); }
      else if (cfg.returning && !state.returning && answeredCount(state, cfg) === 0) { state.view = 'returning'; save(); render(); focusMain(); }
      else if (isComplete(state, cfg)) goTo(cfg.questions.length);
      else { var fi = firstIncomplete(state, cfg); goTo(fi < 0 ? 0 : fi); }
    }
    function afterReturning() {
      clearTimeout(autoTimer);
      var ro = findOpt(cfg.returning, state.returning);
      if (ro && ro.skip) { state.view = 'skip'; save(); render(); focusMain(); }
      else { var fi = firstIncomplete(state, cfg); goTo(fi < 0 ? 0 : fi); }
    }
    rootEl.addEventListener('change', function (e) {
      var t = e.target;
      if (t.type === 'radio' && state.view === 'returning') {
        state.returning = t.value; save();
        var nb = mainEl.querySelector('[data-act=returning-next]'); if (nb) nb.disabled = false;
        clearTimeout(autoTimer); // no auto-advance: the customer taps Next when they are ready
      }
      else if (t.type === 'radio' && state.view === 'question') onSelect(t.value);
      else if (t.id === 'tdq-timing-ack') {
        state.timingAck = !!t.checked; save();
        var tb = mainEl.querySelector('[data-act=timing-next]'); if (tb) tb.disabled = !state.timingAck;
      }
      else if (t.id === 'tdq-ack') {
        state.ack = !!t.checked; save();
        var b = mainEl.querySelector('[data-act=book]');
        if (b) b.disabled = !state.ack || !available;
      }
    });

    // Keep the final screen honest if the saved state changed elsewhere (e.g. another tab)
    // Every page load starts on the intro (so the service explainer is always seen);
    // returning customers get a "Continue where I left off" button.
    state.view = 'intro';
    render();

    return {
      state: function () { return state; },
      cfg: cfg, render: render, goTo: goTo, onSelect: onSelect, book: book
    };
  }

  function boot() {
    var roots = document.querySelectorAll('[data-tdq]');
    for (var i = 0; i < roots.length; i++) if (!roots[i].__tdq) roots[i].__tdq = init(roots[i]);
  }

  root.TDQ = { Engine: Engine, init: init, boot: boot };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TDQ;

  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
