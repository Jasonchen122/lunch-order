// 共用邏輯 v2：Google Apps Script 後端與網頁「試玩模式」都用同一份
var LunchCore = (function () {
  var HEAD = {
    shops: ['id', 'name', 'type', 'category', 'phone', 'minOrder', 'note', 'images', 'active', 'createdAt'],
    groups: ['id', 'kind', 'title', 'shopId', 'mode', 'link', 'min', 'startAt', 'endAt', 'closeAt', 'desc', 'emoji', 'images', 'message', 'cancelled', 'createdAt', 'updatedAt'],
    orders: ['id', 'groupId', 'ext', 'name', 'item', 'qty', 'price', 'amount', 'sugar', 'ice', 'note', 'paid', 'picked', 'createdAt', 'updatedAt'],
    marks: ['groupId', 'ext', 'name', 'createdAt'],
    votes: ['target', 'ext', 'choice', 'createdAt'],
    coins: ['ext', 'game', 'cost', 'note', 'createdAt']
  };
  var LEVELS = [[0, 'Lv1 新手熊'], [1, 'Lv2 便當見習熊'], [15, 'Lv3 午餐達人熊'], [30, 'Lv4 揪團高手熊'], [60, 'Lv5 湯姆熊傳說']];
  var GAMES = { gacha: '午餐扭蛋', whack: '打 TOM' };
  var KIND_ORDER = { bento: 0, drink: 1, other: 2 };
  var VOTE_CHOICES = ['便當飯類', '麵食水餃', '異國料理', '小吃', '熱炒', '都可以'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tp(d) { // 台北時間
    var t = new Date((d || new Date()).getTime() + 8 * 3600000).toISOString();
    return { date: t.slice(0, 10), hm: t.slice(11, 16), dt: t.slice(0, 16), iso: t.slice(0, 19), dow: new Date(t.slice(0, 10) + 'T00:00:00Z').getUTCDay() };
  }
  function addDays(dt, n) { // dt = 'YYYY-MM-DD' 或 'YYYY-MM-DDTHH:mm'
    var hasT = dt.length > 10, ms = Date.parse((hasT ? dt : dt + 'T00:00') + ':00Z') + n * 86400000;
    var s = new Date(ms).toISOString();
    return hasT ? s.slice(0, 16) : s.slice(0, 10);
  }
  function nextWorkday(date) { var d = addDays(date, 1); while ([0, 6].indexOf(new Date(d + 'T00:00:00Z').getUTCDay()) >= 0) d = addDays(d, 1); return d; }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function str(v) { return v === null || v === undefined ? '' : String(v).trim(); }
  function bool(v) { return v === true || v === '1' || v === 1 || v === 'TRUE' || v === 'true'; }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function err(m) { throw new Error(m); }
  function okDT(s) { return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s); }
  function arr(v) { try { return typeof v === 'string' ? JSON.parse(v || '[]') : (v || []); } catch (e) { return []; } }

  function create(store, opt) {
    opt = opt || {};
    var now = opt.now || function () { return new Date(); };

    // ---------- 讀取 ----------
    function shopOut(s) {
      return { id: str(s.id), name: str(s.name), type: str(s.type) || 'bento', category: str(s.category), phone: str(s.phone),
        minOrder: str(s.minOrder), note: str(s.note), images: arr(s.images), active: s.active === undefined || s.active === '' ? true : bool(s.active) };
    }
    function shops() { return store.all('shops').map(shopOut); }
    function orderOut(o) {
      return { id: str(o.id), groupId: str(o.groupId), ext: str(o.ext), name: str(o.name), item: str(o.item), qty: num(o.qty), price: num(o.price),
        amount: num(o.amount), sugar: str(o.sugar), ice: str(o.ice), note: str(o.note), paid: bool(o.paid), picked: bool(o.picked),
        createdAt: str(o.createdAt), updatedAt: str(o.updatedAt) };
    }
    function stateOf(g, t) {
      if (g.cancelled) return 'cancelled';
      if (t.dt < g.startAt) return 'upcoming';
      if (t.dt < g.endAt) return 'open';
      if (t.dt < g.closeAt) return 'closed';
      return 'ended';
    }
    function groupBase(g, shopMap) {
      var s = shopMap[str(g.shopId)] || null, imgs = arr(g.images);
      return { id: str(g.id), kind: str(g.kind) || 'bento', title: str(g.title), shopId: str(g.shopId), mode: str(g.mode) || 'here', link: str(g.link),
        min: num(g.min), startAt: str(g.startAt), endAt: str(g.endAt), closeAt: str(g.closeAt), desc: str(g.desc), emoji: str(g.emoji),
        images: imgs.length ? imgs : (s ? s.images : []), ownImages: imgs, message: str(g.message), cancelled: bool(g.cancelled),
        category: s ? s.category : '', phone: s ? s.phone : '', shopNote: s ? s.note : '', createdAt: str(g.createdAt) };
    }
    function peopleOf(rows) {
      var m = {}, list = [];
      rows.slice().sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; }).forEach(function (o) {
        var p = m[o.ext];
        if (!p) { p = m[o.ext] = { ext: o.ext, name: '', items: [], total: 0, unpaid: 0, paid: true, picked: true }; list.push(p); }
        if (o.name) p.name = o.name;
        p.items.push({ id: o.id, item: o.item, qty: o.qty, price: o.price, amount: o.amount, sugar: o.sugar, ice: o.ice, note: o.note, paid: o.paid });
        p.total += o.amount; if (!o.paid) { p.unpaid += o.amount; p.paid = false; } if (!o.picked) p.picked = false;
      });
      return list;
    }
    function totals(rows) {
      var a = 0, q = 0, pe = {}, paid = 0;
      rows.forEach(function (o) { a += o.amount; q += o.qty; pe[o.ext] = 1; if (o.paid) paid += o.amount; });
      return { amount: a, qty: q, people: Object.keys(pe).length, paidAmount: paid };
    }
    function loadAll() {
      var shopMap = {}; shops().forEach(function (s) { shopMap[s.id] = s; });
      var groups = store.all('groups').map(function (g) { return groupBase(g, shopMap); });
      var orders = store.all('orders').map(orderOut), byG = {};
      orders.forEach(function (o) { (byG[o.groupId] = byG[o.groupId] || []).push(o); });
      var marks = {}; store.all('marks').forEach(function (k) { (marks[str(k.groupId)] = marks[str(k.groupId)] || []).push({ ext: str(k.ext), name: str(k.name) }); });
      return { groups: groups, byG: byG, marks: marks, shopMap: shopMap };
    }
    function full(g, D, t, withRows) {
      var rows = D.byG[g.id] || [];
      var r = JSON.parse(JSON.stringify(g));
      r.state = stateOf(g, t); r.total = totals(rows); r.people = peopleOf(rows); r.marks = D.marks[g.id] || [];
      r.success = g.mode === 'link' ? null : (r.total.amount > 0 && r.total.amount >= g.min);
      if (withRows) r.rows = rows;
      return r;
    }
    function getGroup(id) { var D = loadAll(); var g = D.groups.filter(function (x) { return x.id === id; })[0]; if (!g) err('找不到這個揪團'); return { g: g, D: D }; }
    function voteTarget(t, D) {
      var todayBento = D.groups.some(function (g) { return g.kind === 'bento' && !g.cancelled && g.endAt.slice(0, 10) === t.date; });
      var weekend = t.dow === 0 || t.dow === 6;
      return (!todayBento && !weekend && t.hm < '11:00') ? t.date : nextWorkday(t.date);
    }
    function voteTally(target, ext) {
      var tally = {}, mine = '';
      VOTE_CHOICES.forEach(function (c) { tally[c] = 0; });
      store.all('votes').forEach(function (v) { if (str(v.target) === target) { tally[str(v.choice)] = (tally[str(v.choice)] || 0) + 1; if (ext && str(v.ext) === str(ext)) mine = str(v.choice); } });
      return { target: target, choices: VOTE_CHOICES, tally: tally, mine: mine };
    }
    function recap(D, t) {
      var ended = D.groups.filter(function (g) { return g.kind === 'bento' && !g.cancelled && g.mode !== 'link' && stateOf(g, t) === 'ended' && g.endAt >= addDays(t.date, -7); })
        .sort(function (a, b) { return a.endAt < b.endAt ? 1 : -1; });
      var month = 0;
      D.groups.forEach(function (g) {
        if (g.kind !== 'bento' || g.cancelled || g.mode === 'link' || g.endAt.slice(0, 7) !== t.date.slice(0, 7) || t.dt < g.endAt) return;
        var tt = totals(D.byG[g.id] || []); if (tt.amount > 0 && tt.amount >= g.min) month++;
      });
      if (!ended.length) return { last: null, monthSuccess: month };
      var g = ended[0], rows = D.byG[g.id] || [], tt = totals(rows), cnt = {};
      rows.forEach(function (o) { cnt[o.item] = (cnt[o.item] || 0) + o.qty; });
      var top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0] || '';
      return { last: { title: g.title, date: g.endAt.slice(0, 10), amount: tt.amount, people: tt.people, qty: tt.qty, top: top, topQty: top ? cnt[top] : 0,
        success: tt.amount > 0 && tt.amount >= g.min }, monthSuccess: month };
    }
    function home(p) {
      var t = tp(now()), D = loadAll(), soon = addDays(t.dt, 7);
      var list = D.groups.filter(function (g) {
        var s = stateOf(g, t);
        return s === 'open' || s === 'closed' || (s === 'upcoming' && g.startAt <= soon);
      }).sort(function (a, b) { return (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || (a.endAt < b.endAt ? -1 : 1); })
        .map(function (g) { return full(g, D, t); });
      var P = pointsAll(D), lv = {};
      list.forEach(function (g) { g.people.forEach(function (x) { lv[x.ext] = lvOf((P[x.ext] || {}).earned || 0); }); g.marks.forEach(function (m) { lv[m.ext] = lvOf((P[m.ext] || {}).earned || 0); }); });
      var res = { now: t, groups: list, recap: recap(D, t), vote: voteTally(voteTarget(t, D), p && p.ext), levels: lv };
      if (p && p.ext) res.me = pointsOf(p.ext, D, P);
      return res;
    }
    function groupDetail(id) { var x = getGroup(id); return full(x.g, x.D, tp(now())); }

    // ---------- 熊幣 ----------
    function lvOf(n) { var i = 0; LEVELS.forEach(function (l, k) { if (n >= l[0]) i = k; }); return i; }
    function pointsAll(D) {
      var t = tp(now()), P = {}, names = {};
      function rec(e) { return P[e] || (P[e] = { bento: {}, drink: {}, other: {}, hero: 0 }); }
      D.groups.forEach(function (g) {
        if (g.cancelled || stateOf(g, t) === 'upcoming') return;
        var day = g.endAt.slice(0, 10), rows = (D.byG[g.id] || []).slice();
        rows.forEach(function (o) { if (o.name) names[o.ext] = o.name; var r = rec(o.ext); if (g.kind === 'other') r.other[g.id] = 1; else r[g.kind][day] = 1; });
        if (g.kind === 'drink') (D.marks[g.id] || []).forEach(function (m) { rec(m.ext).drink[day] = 1; if (m.name && !names[m.ext]) names[m.ext] = m.name; });
        if (g.mode !== 'link' && g.min > 0) {
          rows.sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : (a.id < b.id ? -1 : 1); });
          var sum = 0, hero = '';
          for (var i = 0; i < rows.length; i++) { sum += rows[i].amount; if (sum >= g.min) { hero = rows[i].ext; break; } }
          if (hero) rec(hero).hero++;
        }
      });
      var out = {};
      Object.keys(P).forEach(function (e) {
        var r = P[e], bd = Object.keys(r.bento).sort(), streak = 0, run = 0, prev = '';
        bd.forEach(function (d) { run = (prev && nextWorkday(prev) === d) ? run + 1 : 1; if (run % 5 === 0) streak += 2; prev = d; });
        var b = { bento: bd.length, drink: Object.keys(r.drink).length, other: Object.keys(r.other).length, hero: r.hero, streak: streak };
        out[e] = { earned: b.bento + b.drink + b.other + b.hero + b.streak, breakdown: b, days: r, name: names[e] || '' };
      });
      return out;
    }
    function spentAll() { var s = {}; store.all('coins').forEach(function (c) { var e = str(c.ext); s[e] = (s[e] || 0) + num(c.cost); }); return s; }
    function pointsOf(ext, D, P, S) {
      ext = str(ext); D = D || loadAll(); P = P || pointsAll(D); S = S || spentAll();
      var p = P[ext] || { earned: 0, breakdown: { bento: 0, drink: 0, other: 0, hero: 0, streak: 0 }, days: { bento: {}, drink: {} }, name: '' };
      var t = tp(now()), li = lvOf(p.earned), nx = LEVELS[li + 1], spent = S[ext] || 0;
      var mon = addDays(t.date, -((t.dow + 6) % 7)), week = [];
      for (var i = 0; i < 5; i++) { var d = addDays(mon, i); week.push(!!(p.days.bento && p.days.bento[d]) || !!(p.days.drink && p.days.drink[d])); }
      return { ext: ext, name: p.name, earned: p.earned, spent: spent, balance: Math.max(0, p.earned - spent), level: li, levelName: LEVELS[li][1],
        levelAt: LEVELS[li][0], nextAt: nx ? nx[0] : null, nextName: nx ? nx[1] : '', breakdown: p.breakdown, week: week, today: t.date };
    }
    function play(p) {
      var ext = str(p.ext), game = str(p.game);
      if (!ext) err('請先輸入分機');
      if (!GAMES[game]) err('沒有這個遊戲');
      var me = pointsOf(ext);
      if (me.balance < 1) err('熊幣不夠了，明天一起點餐就有囉！');
      store.insert('coins', { ext: ext, game: game, cost: 1, note: str(p.note).slice(0, 60), createdAt: tp(now()).iso });
      return pointsOf(ext);
    }

    // ---------- 同事操作 ----------
    function saveCart(p) {
      var x = getGroup(str(p.groupId)), g = x.g, t = tp(now()), st = stateOf(g, t);
      if (g.mode === 'link') err('這個揪團請用線上點餐連結');
      if (st === 'upcoming') err('還沒開始，' + g.startAt.replace('T', ' ') + ' 開放點餐');
      if (st !== 'open') err('已經結單，無法再送出或修改');
      var ext = str(p.ext); if (!ext) err('請輸入分機號碼');
      var items = (p.items || []).map(function (i) {
        return { item: str(i.item), qty: Math.round(num(i.qty)), price: Math.round(num(i.price)), sugar: str(i.sugar), ice: str(i.ice), note: str(i.note) };
      }).filter(function (i) { return i.item; });
      if (!items.length && !p.replace) err('請至少點一樣');
      items.forEach(function (i) { if (i.qty < 1) err(i.item + ' 的數量至少 1'); if (i.price < 0) err(i.item + ' 的金額不能是負數'); });
      var mine = (x.D.byG[g.id] || []).filter(function (o) { return o.ext === ext; });
      if (p.replace) mine.forEach(function (o) { if (!o.paid) store.remove('orders', 'id', o.id); });
      var ts = t.iso;
      items.forEach(function (i, n) {
        store.insert('orders', { id: uid('o') + n, groupId: g.id, ext: ext, name: str(p.name), item: i.item, qty: i.qty, price: i.price, amount: i.qty * i.price,
          sugar: i.sugar, ice: i.ice, note: i.note, paid: '', picked: '', createdAt: ts, updatedAt: ts });
      });
      return groupDetail(g.id);
    }
    function deleteMine(p) {
      var x = getGroup(str(p.groupId)), g = x.g, ext = str(p.ext);
      if (stateOf(g, tp(now())) !== 'open') err('已經結單，無法刪除');
      var mine = (x.D.byG[g.id] || []).filter(function (o) { return o.ext === ext; });
      if (!mine.length) err('分機 ' + ext + ' 沒有點餐');
      if (mine.every(function (o) { return o.paid; })) err('已付款，請找管理員處理');
      mine.forEach(function (o) { if (!o.paid) store.remove('orders', 'id', o.id); });
      return groupDetail(g.id);
    }
    function mark(p) {
      var x = getGroup(str(p.groupId)), g = x.g, ext = str(p.ext);
      if (!ext) err('請輸入分機號碼');
      var st = stateOf(g, tp(now())); if (st === 'upcoming' || st === 'ended') err('現在不能標記');
      var had = (x.D.marks[g.id] || []).some(function (m) { return m.ext === ext; });
      if (had && !p.on) {
        store.removeWhere('marks', function (r) { return str(r.groupId) === g.id && str(r.ext) === ext; });
      } else if (!had && p.on !== false) store.insert('marks', { groupId: g.id, ext: ext, name: str(p.name), createdAt: tp(now()).iso });
      return groupDetail(g.id);
    }
    function vote(p) {
      var ext = str(p.ext), c = str(p.choice), target = str(p.target);
      if (!ext) err('請先輸入分機'); if (VOTE_CHOICES.indexOf(c) < 0) err('選項錯誤');
      store.removeWhere('votes', function (r) { return str(r.target) === target && str(r.ext) === ext; });
      store.insert('votes', { target: target, ext: ext, choice: c, createdAt: tp(now()).iso });
      return voteTally(target, ext);
    }

    // ---------- 管理員 ----------
    function adminGroups() {
      var t = tp(now()), D = loadAll(), from = addDays(t.date, -45);
      var list = D.groups.filter(function (g) { return !g.cancelled && g.endAt >= from; })
        .sort(function (a, b) { return a.endAt < b.endAt ? 1 : -1; }).map(function (g) { return full(g, D, t); });
      return { now: t, groups: list, vote: voteTally(voteTarget(t, D)), voteToday: voteTally(t.date) };
    }
    function saveGroup(d) {
      var t = tp(now()), kind = ['bento', 'drink', 'other'].indexOf(d.kind) >= 0 ? d.kind : 'bento', mode = d.mode === 'link' ? 'link' : 'here';
      var title = str(d.title); if (!title) err(kind === 'other' ? '請輸入揪團名稱' : '請選擇或輸入店名');
      if (mode === 'link' && !/^https?:\/\//.test(str(d.link))) err('請貼上完整的線上點餐網址（https:// 開頭）');
      var startAt, endAt, closeAt;
      if (kind === 'other') {
        startAt = str(d.startAt); endAt = str(d.endAt);
        if (!okDT(startAt) || !okDT(endAt)) err('請設定開始和結束時間');
        if (endAt <= startAt) err('結束時間要晚於開始時間');
        closeAt = addDays(endAt, 3);
      } else {
        var date = str(d.date), dl = str(d.deadline), ct = str(d.closeTime) || '14:00';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) err('日期格式錯誤');
        if (!/^\d{2}:\d{2}$/.test(dl)) err('請設定結單時間');
        startAt = date + 'T00:00'; endAt = date + 'T' + dl; closeAt = date + 'T' + (ct > dl ? ct : dl);
        if (closeAt === endAt) closeAt = addDays(endAt, 0).slice(0, 11) + '23:59';
      }
      var rec = { kind: kind, title: title, shopId: str(d.shopId), mode: mode, link: mode === 'link' ? str(d.link) : '', min: mode === 'link' ? '' : Math.round(num(d.min)),
        startAt: startAt, endAt: endAt, closeAt: closeAt, desc: str(d.desc), emoji: str(d.emoji), images: JSON.stringify(d.images || []), message: str(d.message),
        cancelled: '', updatedAt: t.iso };
      var exists = d.id && store.all('groups').some(function (g) { return str(g.id) === d.id; });
      if (exists) { store.update('groups', 'id', d.id, rec); rec.id = d.id; }
      else { rec.id = uid('g'); rec.createdAt = t.iso; store.insert('groups', rec); }
      return groupDetail(rec.id);
    }
    function cancelGroup(id) { store.update('groups', 'id', id, { cancelled: '1', updatedAt: tp(now()).iso }); return { ok: true }; }
    function adminGroup(id) { var x = getGroup(id); return full(x.g, x.D, tp(now()), true); }
    function setExt(p, field) {
      var x = getGroup(str(p.groupId)), ext = str(p.ext), ts = tp(now()).iso, patch = {};
      patch[field] = p.value ? '1' : ''; patch.updatedAt = ts;
      (x.D.byG[x.g.id] || []).forEach(function (o) { if (o.ext === ext) store.update('orders', 'id', o.id, patch); });
      return adminGroup(x.g.id);
    }
    function adminSaveOrder(o) {
      var gid = str(o.groupId); getGroup(gid);
      var qty = Math.round(num(o.qty)), price = Math.round(num(o.price)), ts = tp(now()).iso;
      var rec = { groupId: gid, ext: str(o.ext), name: str(o.name), item: str(o.item), qty: qty, price: price, amount: qty * price,
        sugar: str(o.sugar), ice: str(o.ice), note: str(o.note), updatedAt: ts };
      if (!rec.ext || !rec.item || qty < 1) err('分機、品項、數量都要填');
      if (o.id) store.update('orders', 'id', o.id, rec);
      else { rec.id = uid('o'); rec.paid = ''; rec.picked = ''; rec.createdAt = ts; store.insert('orders', rec); }
      return adminGroup(gid);
    }
    function adminDeleteOrder(p) { store.remove('orders', 'id', str(p.id)); return adminGroup(str(p.groupId)); }
    function saveShop(s) {
      if (!str(s.name)) err('請輸入店名');
      var rec = { name: str(s.name), type: s.type === 'drink' ? 'drink' : 'bento', category: str(s.category), phone: str(s.phone),
        minOrder: str(s.minOrder), note: str(s.note), images: JSON.stringify(s.images || []), active: s.active === false ? '0' : '1' };
      if (s.id && store.all('shops').some(function (x) { return str(x.id) === s.id; })) { store.update('shops', 'id', s.id, rec); rec.id = s.id; }
      else { rec.id = uid('s'); rec.createdAt = tp(now()).iso; store.insert('shops', rec); }
      return shopOut(rec);
    }
    function stats(from, to) {
      var t = tp(now()), D = loadAll(), agg = { bento: {}, drink: {}, other: {} }, items = {}, n = 0;
      D.groups.forEach(function (g) {
        if (g.cancelled) return;
        var d = g.endAt.slice(0, 10); if ((from && d < from) || (to && d > to)) return;
        var st = stateOf(g, t); if (st !== 'closed' && st !== 'ended') return;
        n++;
        var rows = D.byG[g.id] || [], tt = totals(rows), k = g.kind;
        var a = agg[k][g.title] || (agg[k][g.title] = { shop: g.title, times: 0, success: 0, fail: 0, link: 0, sum: 0, people: 0 });
        a.times++;
        if (g.mode === 'link') { a.link++; a.people += (D.marks[g.id] || []).length; }
        else { a.sum += tt.amount; a.people += tt.people; if (tt.amount > 0 && tt.amount >= g.min) a.success++; else a.fail++; }
        rows.forEach(function (o) { var key = k + '|' + g.title + '|' + o.item, it = items[key] || (items[key] = { kind: k, shop: g.title, item: o.item, qty: 0 }); it.qty += o.qty; });
      });
      function fin(m) {
        return Object.keys(m).map(function (k) {
          var a = m[k], h = a.times - a.link;
          return { shop: a.shop, times: a.times, success: a.success, fail: a.fail, link: a.link, failRate: h ? Math.round(a.fail / h * 100) : 0,
            avgTotal: h ? Math.round(a.sum / h) : 0, avgPeople: a.times ? Math.round(a.people / a.times * 10) / 10 : 0, total: a.sum };
        }).sort(function (x, y) { return y.times - x.times; });
      }
      return { today: t.date, groups: n, bento: fin(agg.bento), drink: fin(agg.drink), other: fin(agg.other),
        topItems: Object.keys(items).map(function (k) { return items[k]; }).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 20) };
    }

    var publicApi = {
      home: home,
      group: function (p) { return groupDetail(str(p.id)); },
      saveCart: saveCart, deleteMine: deleteMine, mark: mark, vote: vote,
      points: function (p) { return pointsOf(p.ext); }, play: play,
      shopsPublic: function () { return shops().filter(function (s) { return s.active; }); }
    };
    var adminApi = {
      login: function () { return { ok: true }; },
      adminGroups: adminGroups,
      adminGroup: function (p) { return adminGroup(str(p.id)); },
      saveGroup: function (p) { return saveGroup(p.group || {}); },
      cancelGroup: function (p) { return cancelGroup(str(p.id)); },
      setPaid: function (p) { return setExt(p, 'paid'); },
      setPicked: function (p) { return setExt(p, 'picked'); },
      adminSaveOrder: function (p) { return adminSaveOrder(p.order || {}); },
      adminDeleteOrder: adminDeleteOrder,
      shops: function () { return shops(); },
      saveShop: function (p) { return saveShop(p.shop || {}); },
      stats: function (p) { return stats(p.from, p.to); }
    };
    function handle(p) {
      try {
        var a = p.action;
        if (publicApi[a]) return { ok: true, data: publicApi[a](p) };
        if (adminApi[a] || (opt.extraAdmin && opt.extraAdmin[a])) {
          if (!opt.checkPassword || !opt.checkPassword(p.pw)) err('密碼錯誤');
          return { ok: true, data: adminApi[a] ? adminApi[a](p) : opt.extraAdmin[a](p) };
        }
        err('未知的動作');
      } catch (e) { return { ok: false, error: e.message || String(e) }; }
    }
    return { handle: handle, tp: function () { return tp(now()); } };
  }
  return { create: create, HEAD: HEAD, tp: tp, addDays: addDays, nextWorkday: nextWorkday, VOTE_CHOICES: VOTE_CHOICES, LEVELS: LEVELS };
})();
if (typeof module !== 'undefined') module.exports = LunchCore;
