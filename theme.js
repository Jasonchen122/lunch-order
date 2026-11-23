// 節慶主題（做法 1：日期寫在這裡，時間到自動出現、過了自動恢復）
// 預覽：網址加 ?theme=xmas（只在這次開啟有效），?theme=off 取消預覽
window.LUNCH_THEME_SCHEDULE = [
  { key: 'xmas', from: '12-01', to: '12-26' }
];
window.LUNCH_THEMES = {
  xmas: {
    name: '🎄 聖誕節', title: 'Merry Christmas', target: '12-25',
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
