// 節慶主題（做法 1：日期寫在這裡，時間到自動出現、過了自動恢復）
// 預覽：網址加 ?theme=xmas（只在這次開啟有效），?theme=off 取消預覽
window.LUNCH_THEME_SCHEDULE = [
  { key: 'thanksday', from: '11-26', to: '11-26' },
  { key: 'thanks', from: '11-24', to: '11-25' },
  { key: 'xmas', from: '12-01', to: '12-26' }
];
window.LUNCH_THEMES = {
  // 11/26 感恩節當天：整個首頁換成秋天的感覺，用 TOM & JOY 感恩節動畫當門面
  thanksday: {
    name: '🦃 感恩節', cls: 'td', noBanner: true, fall: 'leaf', intro: true,
    hero: { src: 'img/fest/thanks-sq.mp4', poster: 'img/fest/thanks-sq.jpg' },
    thanks: '🧡 謝謝你！感恩節快樂', big: '🎉 你讓大家成團了！感恩有你',
    css: 'html.th-thanksday body{background:linear-gradient(180deg,#FCEBD3 0,#FBF3E6 420px,#FBF6EE 900px)}' +
      'html.th-thanksday .hello .mw{display:none}' +
      'html.th-thanksday .hello{align-items:center;gap:10px}' +
      '.thero{position:relative;flex:none;width:min(42%,210px);aspect-ratio:1/1;border-radius:18px;overflow:hidden;background:#F6E2C6;border:2px solid #fff;box-shadow:0 5px 0 #E2B98E,0 10px 18px rgba(120,60,10,.16)}' +
      '.thero img,.thero video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}' +
      'html.th-thanksday .hello .bub{margin-bottom:0;border-color:#EBC49A}' +
      'html.th-thanksday .cal .hd{background:#C9622A;box-shadow:inset 0 -3px 0 #E8A64A}' +
      'html.th-thanksday .clk{background:linear-gradient(180deg,#FFE9C9,#F6BE78);box-shadow:0 6px 0 #D98F3E,0 10px 16px rgba(120,60,10,.18)}' +
      'html.th-thanksday .clk .lb{color:#8A3A12}html.th-thanksday .clk .t{color:#6B2E0E}html.th-thanksday .clk .t .c{color:#C9622A}' +
      'html.th-thanksday .cal{position:relative;overflow:visible}html.th-thanksday .cal:after{content:"🍁";position:absolute;right:-8px;top:-12px;font-size:22px;transform:rotate(18deg)}' +
      'html.th-thanksday .gcard{position:relative}html.th-thanksday .gcard:after{content:"🍂";position:absolute;right:10px;top:6px;font-size:16px;opacity:.55;transform:rotate(-12deg);pointer-events:none}' +
      'html.th-thanksday .gcard .mini i{background:linear-gradient(90deg,#E8A64A,#C9622A)!important}'
  },
  thanks: {
    name: '🦃 感恩週', cls: 'tg', title: '🦃 感恩週・謝謝你一起揪團', target: '11-26',
    count: '感恩節還有 {n} 天，謝謝每一位一起點餐的同事 🧡', today: '今天是感恩節，謝謝你讓午餐更熱鬧 🧡', after: '謝謝你讓午餐更熱鬧 🧡',
    teaser: '🎄 12/1 TOM 準備了一個聖誕驚喜，敬請期待',
    css: '.fest.tg{background:linear-gradient(120deg,#FFF1DE,#FBDDBA);color:#6B3412;border:1.5px solid #EBC49A;box-shadow:0 4px 0 #E7C9A5;padding:10px 12px}' +
      '.fest.tg .tx b{display:block;font-size:15px;color:#7A3A12}.fest.tg small{color:#8A5A32;opacity:1}' +
      '.fest.tg .tz{display:block;margin-top:6px;padding-top:6px;border-top:1px dashed #E2B98E;font-size:12px;font-weight:800;color:#7A1F2B}' +
      '.fest.tg .fvid{flex:none;width:92px;height:92px;border-radius:14px;overflow:hidden;padding:0;border:2px solid #fff;box-shadow:0 3px 0 #E2B98E;position:relative;background:#F6E2C6 center/cover;order:-1;cursor:pointer}' +
      '.fest.tg .fvid video{width:100%;height:100%;object-fit:cover;display:block}.fest.tg .fvid .fp{position:absolute;right:4px;bottom:4px;background:rgba(0,0,0,.55);color:#fff;border-radius:999px;font-size:11px;font-weight:900;padding:1px 6px}' +
      '.fvbig{width:100%;border-radius:18px;display:block;background:#F6E2C6;aspect-ratio:1/1}' +
      '.fest.tg .lf{font-size:30px;flex:none;animation:lfsway 3s ease-in-out infinite;transform-origin:50% 0}@keyframes lfsway{50%{transform:rotate(-10deg)}}'
  },
  xmas: {
    name: '🎄 聖誕節', cls: 'xm', snow: true, title: 'Merry Christmas', target: '12-25',
    count: '距離聖誕節還有 {n} 天・點小樹會發亮', today: '今天是聖誕節！TOM 祝你聖誕快樂', after: '聖誕快樂，新的一年也一起吃飯吧',
    tree: { balls: 70, lights: 50, camY: 2.6, camZ: 14, lookY: 2.55, fov: 28,
      pal: { pine: 0x173A2C, mint: 0xD9B26A, ringGlow: 0x6A4A10, lav: 0x7A1F2B, silver: 0xE2B85C, ball2: 0x9E2A3A, warm: 0xFFE3A0 } },
    bulbs: ['#F2C14E', '#C23B4A', '#FFF1C9', '#E89A3C', '#FFFFFF'],
    css: 'html.th-xmas .cal .hd{background:#7A1F2B;box-shadow:inset 0 -3px 0 #D9B26A}' +
      'html.th-xmas .clk{background:linear-gradient(180deg,#FFF6E6,#F3D9A8);box-shadow:0 6px 0 #D9B26A,0 10px 16px rgba(90,21,32,.16)}' +
      'html.th-xmas .clk .lb{color:#7A1F2B}html.th-xmas .clk .t{color:#5A1520}html.th-xmas .clk .t .c{color:#B0303F}' +
      '.fest.xm{background:linear-gradient(120deg,#5A1520,#8A2433);box-shadow:inset 0 0 0 2px rgba(217,178,106,.65),0 6px 0 #3E0E16;padding:6px 4px 6px 14px}' +
      '.fest.xm .tx b{display:block;color:#F6DFA6;font-size:17px;letter-spacing:.5px}.fest.xm small{color:#F2E3C2}' +
      '.fest.xm canvas{width:84px;height:98px;flex:none;cursor:pointer;display:block}' +
      '.fest.xm:after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:16px;background:radial-gradient(circle at 10% 22%,rgba(246,223,166,.7) 0 1.4px,transparent 2px),radial-gradient(circle at 38% 82%,rgba(246,223,166,.55) 0 1px,transparent 1.5px),radial-gradient(circle at 62% 16%,rgba(255,255,255,.5) 0 1.2px,transparent 1.8px)}'
  }
};
