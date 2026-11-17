// 前端呼叫後端；config.js 沒填網址時，自動進入「試玩模式」（資料只存在這台裝置）
(function () {
  var cfg = window.LUNCH_CONFIG || {};
  var demo = !cfg.api;
  var core = null, store = null;

  function demoStore() {
    var KEY = 'lunchDemoV2', db = null;
    try { db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { db = null; }
    var t = LunchCore.tp(), today = t.date;
    if (!db || db.seedDay !== today) db = seed(t);
    function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
    save();
    function S(o) { var c = {}; for (var k in o) c[k] = o[k] === undefined || o[k] === null ? '' : String(o[k]); return c; }
    return {
      all: function (n) { return db[n].slice(); },
      insert: function (n, o) { db[n].push(S(o)); save(); },
      update: function (n, key, val, patch) { db[n].forEach(function (o) { if (String(o[key]) === String(val)) { var p = S(patch); for (var k in p) o[k] = p[k]; } }); save(); },
      remove: function (n, key, val) { db[n] = db[n].filter(function (o) { return String(o[key]) !== String(val); }); save(); },
      removeWhere: function (n, fn) { db[n] = db[n].filter(function (o) { return !fn(o); }); save(); },
      reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
    };
  }
  function seed(t) {
    var A = LunchCore.addDays, db = { seedDay: t.date, shops: [], groups: [], orders: [], marks: [], votes: [] }, n = 0;
    (window.LUNCH_SEED_SHOPS || []).forEach(function (s) {
      db.shops.push({ id: s.id, name: s.name, type: s.type, category: s.category, phone: s.phone, minOrder: s.minOrder, note: s.note, images: JSON.stringify(s.images), active: '1', createdAt: '' });
    });
    db.shops.push({ id: 'd01', name: '清心福全（示範）', type: 'drink', category: '手搖飲', phone: '', minOrder: '500', note: '試玩用的飲料店', images: '[]', active: '1' });
    db.shops.push({ id: 'd02', name: '五十嵐（示範）', type: 'drink', category: '手搖飲', phone: '', minOrder: '400', note: '試玩用的飲料店', images: '[]', active: '1' });
    function g(o) { o.id = o.id || 'g' + (++n); o.createdAt = ''; o.cancelled = ''; db.groups.push(o); return o.id; }
    function o(gid, ext, name, item, qty, price, x) {
      x = x || {}; db.orders.push({ id: 'o' + (++n), groupId: gid, ext: ext, name: name, item: item, qty: String(qty), price: String(price), amount: String(qty * price),
        sugar: x.sugar || '', ice: x.ice || '', note: x.note || '', paid: x.paid ? '1' : '', picked: x.picked ? '1' : '', createdAt: t.iso, updatedAt: '' });
    }
    var dl = A(t.dt, 0).slice(0, 11) + plus(t, 40), dl2 = plus(t, 90);
    var b = g({ kind: 'bento', title: '天菜溫泉雞 江南店', shopId: 's01', mode: 'here', link: '', min: '1200', startAt: t.date + 'T00:00', endAt: dl, closeAt: later(t.date, dl, 180), desc: '', emoji: '', images: '[]', message: '' });
    [['226', 'Ann', [['奶油蒜香雞', 1, 140], ['燙青菜', 1, 45]]], ['236', '筠凌', [['天菜溫泉雞', 1, 130]]], ['225', '小峰', [['川味溫泉口水雞', 1, 135], ['黑豆干', 1, 20]]],
     ['235', '小喵', [['黯然銷魂雞', 1, 115]]], ['108', '慧君', [['天菜溫泉雞', 1, 130], ['水波蛋', 1, 25]]], ['112', '阿德', [['滿漢大餐', 1, 250]]]]
      .forEach(function (p) { p[2].forEach(function (i) { o(b, p[0], p[1], i[0], i[1], i[2], { paid: p[0] === '108' }); }); });
    var d = g({ kind: 'drink', title: '清心福全（示範）', shopId: 'd01', mode: 'link', link: 'https://example.com/', min: '', startAt: t.date + 'T00:00', endAt: t.date + 'T' + dl2, closeAt: later(t.date, t.date + 'T' + dl2, 120), desc: '', emoji: '', images: '[]', message: '' });
    ['226', '236', '108', '301', '112'].forEach(function (e) { db.marks.push({ groupId: d, ext: e, name: '', createdAt: t.iso }); });
    var c = g({ kind: 'other', title: '下午茶雞蛋糕', shopId: '', mode: 'here', link: '', min: '600', startAt: A(t.dt, -1), endAt: A(t.dt, 2), closeAt: A(t.dt, 5), desc: '一份 10 顆，週五下午送到公司', emoji: '🍰', images: '[]', message: '' });
    [['236', '筠凌', '原味雞蛋糕', 2, 60], ['301', '', '巧克力雞蛋糕', 1, 70], ['225', '小峰', '原味雞蛋糕', 1, 60]].forEach(function (p) { o(c, p[0], p[1], p[2], p[3], p[4]); });
    g({ kind: 'other', title: '12 月壽星蛋糕', shopId: '', mode: 'here', link: '', min: '', startAt: A(t.date, 3) + 'T09:00', endAt: A(t.date, 6) + 'T12:00', closeAt: A(t.date, 9) + 'T12:00', desc: '一起幫 12 月壽星慶生', emoji: '🎂', images: '[]', message: '' });
    // 過去的紀錄（統計、回顧用）
    var past = [['s05', 1000, [140, 120, 160, 140, 140, 120, 160, 140]], ['s09', 750, [110, 100, 130, 100, 150, 110, 100]], ['s10', 1000, [120, 130, 140]],
      ['s01', 1200, [130, 135, 140, 150, 130, 140, 135, 145, 130]], ['s14', 500, [130, 80]], ['s12', 1000, [150, 120, 130, 150, 120, 130, 140, 150]]];
    past.forEach(function (p, i) {
      var day = A(t.date, -(i + 1)); var s = db.shops.filter(function (x) { return x.id === p[0]; })[0];
      var id = g({ kind: 'bento', title: s.name, shopId: s.id, mode: 'here', link: '', min: String(p[1]), startAt: day + 'T00:00', endAt: day + 'T09:40', closeAt: day + 'T14:00', desc: '', emoji: '', images: '[]', message: '' });
      p[2].forEach(function (pr, j) { o(id, String(201 + j), '', ['招牌飯', '雞腿飯', '排骨飯'][j % 3], 1, pr, { paid: 1, picked: 1 }); });
    });
    [['便當飯類', 4], ['麵食水餃', 2], ['異國料理', 3], ['小吃', 1]].forEach(function (v) { for (var k = 0; k < v[1]; k++) db.votes.push({ target: '', ext: 'v' + v[0] + k, choice: v[0], createdAt: '' }); });
    return db;
  }
  function plus(t, min) { return new Date(Date.parse(t.dt + ':00Z') + min * 60000).toISOString().slice(11, 16); }
  function later(date, dt, min) { var x = new Date(Date.parse(dt + ':00Z') + min * 60000).toISOString().slice(0, 16); return x.slice(0, 10) > date ? date + 'T23:59' : x; }

  if (demo) {
    store = demoStore();
    // 讓示範投票顯示在「明天」
    var vt = core;
    core = LunchCore.create(store, {
      checkPassword: function (pw) { return pw === '1234'; },
      extraAdmin: { uploadImage: function (p) { return { url: p.data }; } }
    });
    var h0 = core.handle({ action: 'home' });
    if (h0.ok) store.all('votes').forEach(function (v) { if (!v.target) store.update('votes', 'ext', v.ext, { target: h0.data.vote.target }); });
  }

  var GET_ACTIONS = { home: 1, group: 1, shopsPublic: 1 };
  function call(action, params) {
    params = params || {}; params.action = action;
    if (demo) {
      return new Promise(function (res, rej) {
        setTimeout(function () { var r = core.handle(JSON.parse(JSON.stringify(params))); r.ok ? res(r.data) : rej(new Error(r.error)); }, 200);
      });
    }
    var req = GET_ACTIONS[action]
      ? fetch(cfg.api + '?payload=' + encodeURIComponent(JSON.stringify(params)) + '&t=' + Date.now())
      : fetch(cfg.api, { method: 'POST', body: JSON.stringify(params) });
    return req.then(function (r) { return r.json(); }).then(function (r) {
      if (!r.ok) throw new Error(r.error || '發生錯誤');
      return r.data;
    }, function (e) { throw new Error('連線失敗，請檢查網路後再試一次'); });
  }
  window.ask = function (msg, okText) {
    return new Promise(function (res) {
      var d = document.createElement('div');
      d.className = 'askbg';
      d.innerHTML = '<div class="askbox"><img src="img/tom_head.png" alt="" class="askimg"><div class="askmsg"></div><div class="askbtns"><button class="ghostbtn">取消</button><button class="okbtn"></button></div></div>';
      d.querySelector('.askmsg').textContent = msg;
      d.querySelector('.okbtn').textContent = okText || '確定';
      var b = d.querySelectorAll('button');
      b[0].onclick = function () { d.remove(); res(false); };
      b[1].onclick = function () { d.remove(); res(true); };
      document.body.appendChild(d);
    });
  };
  // 重新整理：先把網頁檔案重新抓一次，再重新載入，確保拿到最新版
  var FILES = ['index.html', 'admin.html', 'common.css', 'core.js', 'api.js', 'version.js', 'seed.js', 'config.js'];
  window.hardReload = function () {
    var done = function () { location.reload(); };
    try { Promise.all(FILES.map(function (f) { return fetch(f, { cache: 'reload' }).catch(function () {}); })).then(done, done); setTimeout(done, 4000); } catch (e) { done(); }
  };
  // 每 2 分鐘檢查有沒有新版本
  window.watchVersion = function (onNew) {
    var cur = (window.LUNCH_VERSIONS || [])[0], shown = false;
    if (!cur) return;
    setInterval(function () {
      if (shown || document.hidden) return;
      fetch('version.js?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) {
        var m = t.match(/v:\s*'([^']+)'/); if (m && m[1] !== cur.v) { shown = true; onNew(m[1]); }
      }).catch(function () {});
    }, 120000);
  };
  window.LunchAPI = { demo: demo, call: call, resetDemo: function () { if (store) store.reset(); } };
})();
