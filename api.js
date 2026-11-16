// 前端呼叫後端；config.js 沒填網址時，自動進入「試玩模式」（資料只存在這台裝置）
(function () {
  var cfg = window.LUNCH_CONFIG || {};
  var demo = !cfg.api;
  var core = null;

  function hmPlus(min) {
    var t = new Date(Date.now() + 8 * 3600000 + min * 60000).toISOString();
    return t.slice(11, 16);
  }
  function demoStore() {
    var KEY = 'lunchDemoV1', db;
    try { db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { db = null; }
    var today = LunchCore.tp().date;
    if (!db) {
      db = { shops: [], days: [], orders: [] };
      (window.LUNCH_SEED_SHOPS || []).forEach(function (s) {
        db.shops.push({ id: s.id, name: s.name, type: s.type, category: s.category, phone: s.phone, minOrder: s.minOrder, note: s.note,
          images: JSON.stringify(s.images), active: '1', createdAt: '' });
      });
      db.shops.push({ id: 'd01', name: '清心福全（示範）', type: 'drink', category: '手搖飲', phone: '', minOrder: '500', note: '試玩用的飲料店', images: '[]', active: '1' });
      // 示範用的過去紀錄，讓統計頁有資料
      var past = [['s01', 1200, [140, 130, 135, 130, 145, 150, 130, 140, 135]], ['s05', 1000, [140, 120, 160, 140]], ['s09', 750, [110, 100, 130, 100, 150, 110, 100]],
        ['s10', 1000, [120, 130, 140, 150, 110, 130, 120, 140]], ['s14', 500, [130, 80]], ['s01', 1200, [130, 135, 140, 150, 130, 140, 135, 145, 130]], ['s12', 1000, [150, 120, 130]]];
      past.forEach(function (p, i) {
        var d = new Date(Date.now() + 8 * 3600000 - (i + 1) * 86400000 * 1.4).toISOString().slice(0, 10);
        var s = db.shops.filter(function (x) { return x.id === p[0]; })[0];
        db.days.push({ date: d, bentoShopId: s.id, bentoShopName: s.name, bentoMin: String(p[1]), bentoDeadline: '09:40', hasDrink: '', message: '' });
        p[2].forEach(function (pr, j) {
          db.orders.push({ id: 'h' + i + '_' + j, date: d, ext: String(201 + j), name: '', kind: 'bento', item: s.name.slice(0, 2) + (j % 3 === 0 ? '招牌飯' : j % 3 === 1 ? '雞腿飯' : '排骨飯'),
            qty: '1', price: String(pr), amount: String(pr), sugar: '', ice: '', note: '', paid: '1', picked: '1' });
        });
      });
    }
    if (!db.days.some(function (d) { return d.date === today; })) {
      db.days.push({ date: today, bentoShopId: 's01', bentoShopName: '天菜溫泉雞 江南店', bentoMin: '1200', bentoDeadline: hmPlus(40),
        hasDrink: '1', drinkShopId: 'd01', drinkShopName: '清心福全（示範）', drinkMin: '500', drinkDeadline: hmPlus(90), message: '' });
      [['226', 'Ann', '奶油蒜香雞', 140], ['236', '筠凌', '天菜溫泉雞', 130], ['225', '小峰', '川味溫泉口水雞', 135], ['235', '小喵', '黯然銷魂雞', 115], ['108', '慧君', '天菜溫泉雞', 130]]
        .forEach(function (r, i) {
          db.orders.push({ id: 'demo' + i + today, date: today, ext: r[0], name: r[1], kind: 'bento', item: r[2], qty: '1', price: String(r[3]), amount: String(r[3]),
            sugar: '', ice: '', note: '', paid: '', picked: '', createdAt: '', updatedAt: '' });
        });
      db.orders.push({ id: 'demod' + today, date: today, ext: '226', name: 'Ann', kind: 'drink', item: '四季春青茶', qty: '2', price: '45', amount: '90', sugar: '微糖', ice: '少冰', note: '', paid: '', picked: '' });
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
    save();
    return {
      all: function (t) { return db[t].slice(); },
      insert: function (t, o) { var c = {}; for (var k in o) c[k] = String(o[k]); db[t].push(c); save(); },
      update: function (t, key, val, patch) {
        db[t].forEach(function (o) { if (String(o[key]) === String(val)) for (var k in patch) o[k] = String(patch[k]); }); save();
      },
      remove: function (t, key, val) { db[t] = db[t].filter(function (o) { return String(o[key]) !== String(val); }); save(); },
      reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
    };
  }

  var store = null;
  if (demo) {
    store = demoStore();
    core = LunchCore.create(store, {
      checkPassword: function (pw) { return pw === '1234'; },
      extraAdmin: {
        uploadImage: function (p) { return { url: p.data }; } // 試玩：直接用圖片資料
      }
    });
  }

  var GET_ACTIONS = { summary: 1, myOrders: 1, shopsPublic: 1 };
  function call(action, params) {
    params = params || {}; params.action = action;
    if (demo) {
      return new Promise(function (res, rej) {
        setTimeout(function () { var r = core.handle(JSON.parse(JSON.stringify(params))); r.ok ? res(r.data) : rej(new Error(r.error)); }, 250);
      });
    }
    var req = GET_ACTIONS[action]
      ? fetch(cfg.api + '?payload=' + encodeURIComponent(JSON.stringify(params)) + '&t=' + Date.now())
      : fetch(cfg.api, { method: 'POST', body: JSON.stringify(params) });
    return req.then(function (r) { return r.json(); }).then(function (r) {
      if (!r.ok) throw new Error(r.error || '發生錯誤');
      return r.data;
    }, function (e) { if (e && e.message && /[一-鿿]/.test(e.message)) throw e; throw new Error('連線失敗，請檢查網路後再試一次'); });
  }
  window.ask = function (msg) {
    return new Promise(function (res) {
      var d = document.createElement('div');
      d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px';
      d.innerHTML = '<div style="background:#fff;border-radius:16px;padding:20px;max-width:340px;width:100%;text-align:center"><div style="font-size:17px;font-weight:700;margin-bottom:16px;color:#2C2C2A"></div><div style="display:flex;gap:10px"><button style="flex:1">取消</button><button style="flex:1;background:#E24B4A;color:#fff;border-color:#E24B4A">確定</button></div></div>';
      d.querySelector('div div').textContent = msg;
      var b = d.querySelectorAll('button');
      b[0].onclick = function () { d.remove(); res(false); };
      b[1].onclick = function () { d.remove(); res(true); };
      document.body.appendChild(d);
    });
  };
  window.LunchAPI = { demo: demo, call: call, resetDemo: function () { if (store) store.reset(); } };
})();
