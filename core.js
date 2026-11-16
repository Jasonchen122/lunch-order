// 共用邏輯：Google Apps Script 後端與網頁「試玩模式」都用同一份
var LunchCore = (function () {
  var HEAD = {
    shops: ['id', 'name', 'type', 'category', 'phone', 'minOrder', 'note', 'images', 'active', 'createdAt'],
    days: ['date', 'bentoShopId', 'bentoShopName', 'bentoMin', 'bentoDeadline', 'hasDrink', 'drinkShopId', 'drinkShopName', 'drinkMin', 'drinkDeadline', 'message', 'updatedAt'],
    orders: ['id', 'date', 'ext', 'name', 'kind', 'item', 'qty', 'price', 'amount', 'sugar', 'ice', 'note', 'paid', 'picked', 'createdAt', 'updatedAt']
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tp(d) { // 台北時間
    var t = new Date((d || new Date()).getTime() + 8 * 3600000).toISOString();
    return { date: t.slice(0, 10), hm: t.slice(11, 16), iso: t.slice(0, 19) };
  }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function str(v) { return v === null || v === undefined ? '' : String(v).trim(); }
  function bool(v) { return v === true || v === '1' || v === 1 || v === 'TRUE' || v === 'true'; }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function err(m) { throw new Error(m); }

  function create(store, opt) {
    opt = opt || {};
    var now = opt.now || function () { return new Date(); };

    function shopOut(s) {
      var imgs = [];
      try { imgs = typeof s.images === 'string' ? JSON.parse(s.images || '[]') : (s.images || []); } catch (e) { imgs = []; }
      return { id: str(s.id), name: str(s.name), type: str(s.type) || 'bento', category: str(s.category), phone: str(s.phone),
        minOrder: str(s.minOrder), note: str(s.note), images: imgs, active: s.active === undefined || s.active === '' ? true : bool(s.active) };
    }
    function shops() { return store.all('shops').map(shopOut); }
    function shopById(id) { return shops().filter(function (s) { return s.id === id; })[0] || null; }
    function dayOut(d) {
      if (!d) return null;
      return { date: str(d.date), bentoShopId: str(d.bentoShopId), bentoShopName: str(d.bentoShopName), bentoMin: num(d.bentoMin),
        bentoDeadline: str(d.bentoDeadline), hasDrink: bool(d.hasDrink), drinkShopId: str(d.drinkShopId), drinkShopName: str(d.drinkShopName),
        drinkMin: num(d.drinkMin), drinkDeadline: str(d.drinkDeadline), message: str(d.message) };
    }
    function getDay(date) { return dayOut(store.all('days').filter(function (d) { return str(d.date) === date; })[0]); }
    function orderOut(o) {
      return { id: str(o.id), date: str(o.date), ext: str(o.ext), name: str(o.name), kind: str(o.kind), item: str(o.item), qty: num(o.qty),
        price: num(o.price), amount: num(o.amount), sugar: str(o.sugar), ice: str(o.ice), note: str(o.note), paid: bool(o.paid),
        picked: bool(o.picked), createdAt: str(o.createdAt), updatedAt: str(o.updatedAt) };
    }
    function ordersOf(date) { return store.all('orders').map(orderOut).filter(function (o) { return o.date === date; }); }
    function closed(day, kind) {
      var t = tp(now()), dl = kind === 'drink' ? day.drinkDeadline : day.bentoDeadline;
      if (day.date < t.date) return true;
      if (day.date > t.date) return false;
      return !!dl && t.hm >= dl;
    }
    function totals(list, kind) {
      var a = 0, people = {}, n = 0;
      list.forEach(function (o) { if (o.kind === kind) { a += o.amount; n += o.qty; people[o.ext] = 1; } });
      return { amount: a, people: Object.keys(people).length, qty: n };
    }
    function side(day, kind, list) {
      var id = kind === 'drink' ? day.drinkShopId : day.bentoShopId, s = id ? shopById(id) : null;
      return { kind: kind, shopId: id, shopName: kind === 'drink' ? day.drinkShopName : day.bentoShopName,
        category: s ? s.category : '', phone: s ? s.phone : '', note: s ? s.note : '', images: s ? s.images : [],
        min: kind === 'drink' ? day.drinkMin : day.bentoMin, deadline: kind === 'drink' ? day.drinkDeadline : day.bentoDeadline,
        closed: closed(day, kind), total: totals(list, kind) };
    }
    function summary(date) {
      var t = tp(now()); date = date || t.date;
      var day = getDay(date);
      if (!day) return { now: t, date: date, day: null };
      var list = ordersOf(date), r = { now: t, date: date, day: day, bento: side(day, 'bento', list), drink: null };
      if (day.hasDrink) r.drink = side(day, 'drink', list);
      return r;
    }
    function myOrders(date, ext) {
      ext = str(ext); if (!ext) return [];
      return ordersOf(date || tp(now()).date).filter(function (o) { return o.ext === ext; });
    }
    function saveOrder(o) {
      var date = str(o.date) || tp(now()).date, day = getDay(date);
      if (!day) err('今天還沒開團喔');
      var kind = o.kind === 'drink' ? 'drink' : 'bento';
      if (kind === 'drink' && !day.hasDrink) err('今天沒有開飲料團');
      if (closed(day, kind)) err('已經結單，無法再送出或修改');
      var ext = str(o.ext), item = str(o.item), qty = Math.round(num(o.qty)), price = Math.round(num(o.price));
      if (!ext) err('請輸入分機號碼');
      if (!item) err('請輸入品項');
      if (qty < 1) err('數量至少 1');
      if (price < 0) err('金額不能是負數');
      var t = tp(now()).iso, rec = { date: date, ext: ext, name: str(o.name), kind: kind, item: item, qty: qty, price: price,
        amount: qty * price, sugar: kind === 'drink' ? str(o.sugar) : '', ice: kind === 'drink' ? str(o.ice) : '', note: str(o.note), updatedAt: t };
      if (o.id) {
        var old = store.all('orders').map(orderOut).filter(function (x) { return x.id === o.id; })[0];
        if (!old) err('找不到這筆點餐');
        if (old.ext !== ext) err('分機不符，無法修改別人的點餐');
        if (old.paid) err('這筆已付款，請找櫃檯修改');
        store.update('orders', 'id', o.id, rec);
        rec.id = o.id;
      } else {
        rec.id = uid('o'); rec.paid = ''; rec.picked = ''; rec.createdAt = t;
        store.insert('orders', rec);
      }
      return { order: orderOut(rec), mine: myOrders(date, ext), summary: summary(date) };
    }
    function deleteOrder(id, ext) {
      var old = store.all('orders').map(orderOut).filter(function (x) { return x.id === id; })[0];
      if (!old) err('找不到這筆點餐');
      if (old.ext !== str(ext)) err('分機不符');
      if (old.paid) err('這筆已付款，請找櫃檯處理');
      var day = getDay(old.date);
      if (day && closed(day, old.kind)) err('已經結單，無法刪除');
      store.remove('orders', 'id', id);
      return { mine: myOrders(old.date, ext), summary: summary(old.date) };
    }

    // ---------- 後台 ----------
    function adminDay(date) {
      date = date || tp(now()).date;
      return { summary: summary(date), orders: ordersOf(date) };
    }
    function saveDay(d) {
      var date = str(d.date); if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) err('日期格式錯誤');
      if (!str(d.bentoShopName)) err('請選擇或輸入便當店');
      if (!/^\d{2}:\d{2}$/.test(str(d.bentoDeadline))) err('請設定便當結單時間');
      var has = bool(d.hasDrink);
      if (has && !str(d.drinkShopName)) err('請選擇或輸入飲料店');
      if (has && !/^\d{2}:\d{2}$/.test(str(d.drinkDeadline))) err('請設定飲料結單時間');
      var rec = { date: date, bentoShopId: str(d.bentoShopId), bentoShopName: str(d.bentoShopName), bentoMin: Math.round(num(d.bentoMin)),
        bentoDeadline: str(d.bentoDeadline), hasDrink: has ? '1' : '', drinkShopId: has ? str(d.drinkShopId) : '',
        drinkShopName: has ? str(d.drinkShopName) : '', drinkMin: has ? Math.round(num(d.drinkMin)) : '', drinkDeadline: has ? str(d.drinkDeadline) : '',
        message: str(d.message), updatedAt: tp(now()).iso };
      if (getDay(date)) store.update('days', 'date', date, rec); else store.insert('days', rec);
      return summary(date);
    }
    function deleteDay(date) { store.remove('days', 'date', date); return { ok: true }; }
    function saveShop(s) {
      if (!str(s.name)) err('請輸入店名');
      var rec = { name: str(s.name), type: s.type === 'drink' ? 'drink' : 'bento', category: str(s.category), phone: str(s.phone),
        minOrder: str(s.minOrder), note: str(s.note), images: JSON.stringify(s.images || []), active: s.active === false ? '0' : '1' };
      if (s.id && shopById(s.id)) { store.update('shops', 'id', s.id, rec); rec.id = s.id; }
      else { rec.id = uid('s'); rec.createdAt = tp(now()).iso; store.insert('shops', rec); }
      return shopOut(rec);
    }
    function setFlag(id, field, val) {
      if (field !== 'paid' && field !== 'picked') err('欄位錯誤');
      var p = {}; p[field] = val ? '1' : ''; p.updatedAt = tp(now()).iso;
      store.update('orders', 'id', id, p);
      return { ok: true };
    }
    function adminSaveOrder(o) { // 櫃檯代為修改，不受結單限制
      var old = o.id ? store.all('orders').map(orderOut).filter(function (x) { return x.id === o.id; })[0] : null;
      var qty = Math.round(num(o.qty)), price = Math.round(num(o.price));
      var rec = { date: str(o.date) || (old && old.date) || tp(now()).date, ext: str(o.ext), name: str(o.name), kind: o.kind === 'drink' ? 'drink' : 'bento',
        item: str(o.item), qty: qty, price: price, amount: qty * price, sugar: str(o.sugar), ice: str(o.ice), note: str(o.note), updatedAt: tp(now()).iso };
      if (!rec.ext || !rec.item || qty < 1) err('分機、品項、數量都要填');
      if (old) store.update('orders', 'id', o.id, rec);
      else { rec.id = uid('o'); rec.paid = ''; rec.picked = ''; rec.createdAt = rec.updatedAt; store.insert('orders', rec); }
      return { ok: true };
    }
    function adminDeleteOrder(id) { store.remove('orders', 'id', id); return { ok: true }; }
    function stats(from, to) {
      var t = tp(now()), all = store.all('orders').map(orderOut), agg = { bento: {}, drink: {} }, items = {}, dayCount = 0;
      store.all('days').map(dayOut).forEach(function (d) {
        if ((from && d.date < from) || (to && d.date > to)) return;
        dayCount++;
        var list = all.filter(function (o) { return o.date === d.date; });
        ['bento', 'drink'].forEach(function (k) {
          if (k === 'drink' && !d.hasDrink) return;
          if (!closed(d, k)) return;
          var name = k === 'drink' ? d.drinkShopName : d.bentoShopName, min = k === 'drink' ? d.drinkMin : d.bentoMin, tt = totals(list, k);
          var a = agg[k][name] || (agg[k][name] = { shop: name, times: 0, success: 0, fail: 0, sum: 0, people: 0 });
          a.times++; a.sum += tt.amount; a.people += tt.people;
          if (tt.amount >= (min || 0) && tt.amount > 0) a.success++; else a.fail++;
          list.forEach(function (o) {
            if (o.kind !== k) return;
            var key = k + '|' + name + '|' + o.item, it = items[key] || (items[key] = { kind: k, shop: name, item: o.item, qty: 0 });
            it.qty += o.qty;
          });
        });
      });
      function fin(m) {
        return Object.keys(m).map(function (k) {
          var a = m[k];
          return { shop: a.shop, times: a.times, success: a.success, fail: a.fail, failRate: a.times ? Math.round(a.fail / a.times * 100) : 0,
            avgTotal: a.times ? Math.round(a.sum / a.times) : 0, avgPeople: a.times ? Math.round(a.people / a.times * 10) / 10 : 0, total: a.sum };
        }).sort(function (x, y) { return y.times - x.times; });
      }
      var top = Object.keys(items).map(function (k) { return items[k]; }).sort(function (a, b) { return b.qty - a.qty; });
      return { today: t.date, days: dayCount, bento: fin(agg.bento), drink: fin(agg.drink), topItems: top.slice(0, 30) };
    }

    var publicApi = {
      summary: function (p) { return summary(p.date); },
      myOrders: function (p) { return myOrders(p.date, p.ext); },
      saveOrder: function (p) { return saveOrder(p.order || {}); },
      deleteOrder: function (p) { return deleteOrder(p.id, p.ext); }
    };
    var adminApi = {
      login: function () { return { ok: true }; },
      adminDay: function (p) { return adminDay(p.date); },
      saveDay: function (p) { return saveDay(p.day || {}); },
      deleteDay: function (p) { return deleteDay(p.date); },
      shops: function () { return shops(); },
      saveShop: function (p) { return saveShop(p.shop || {}); },
      setFlag: function (p) { return setFlag(p.id, p.field, p.value); },
      adminSaveOrder: function (p) { return adminSaveOrder(p.order || {}); },
      adminDeleteOrder: function (p) { return adminDeleteOrder(p.id); },
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
        if (a === 'shopsPublic') return { ok: true, data: shops().filter(function (s) { return s.active; }) };
        err('未知的動作');
      } catch (e) { return { ok: false, error: e.message || String(e) }; }
    }
    return { handle: handle, tp: function () { return tp(now()); } };
  }
  return { create: create, HEAD: HEAD, tp: tp };
})();
if (typeof module !== 'undefined') module.exports = LunchCore;
