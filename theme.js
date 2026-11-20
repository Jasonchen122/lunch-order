// 節慶主題：只改首頁上方（橫幅、TOM 造型、日曆時鐘顏色、飄落動畫），點餐畫面不變
(function () {
  var HAT = '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M14 70 Q40 8 92 14 Q104 30 98 52 Q80 30 60 34 Q44 40 40 70Z" fill="#C8202C"/><path d="M92 14 Q110 28 104 48" stroke="#A3151F" stroke-width="3" fill="none"/><circle cx="104" cy="50" r="10" fill="#fff"/><rect x="6" y="62" width="74" height="18" rx="9" fill="#fff"/></svg>';
  var PIL = '<svg viewBox="0 0 120 70" aria-hidden="true"><ellipse cx="60" cy="60" rx="56" ry="9" fill="#5A3A22"/><path d="M30 60 L36 12 L84 12 L90 60Z" fill="#3E2A1A"/><rect x="33" y="40" width="54" height="9" fill="#2A1C12"/><rect x="52" y="38" width="16" height="13" rx="2" fill="#E3A82B"/><rect x="56" y="41" width="8" height="7" fill="#3E2A1A"/></svg>';
  var RED = '<svg viewBox="0 0 40 52" aria-hidden="true"><rect x="2" y="2" width="36" height="48" rx="5" fill="#C8102E"/><path d="M2 14 Q20 26 38 14" fill="#A50D26"/><circle cx="20" cy="20" r="7" fill="#F2C14E"/><text x="20" y="42" font-size="12" text-anchor="middle" fill="#F2C14E" font-weight="900">福</text></svg>';
  window.LUNCH_THEMES = {
    sunny: { name: '☀️ 暖陽配色', fx: '', plain: true,
      vars: { '--bg': '#FFF7E1', '--bg2': '#FFE9A9', '--line': '#F4D88C', '--b1': '#FFE9A9', '--b2': '#FF933E', '--b3': '#E0741F', '--b4': '#7A3A0C',
        '--d1': '#E4EFF8', '--d2': '#73A5CA', '--d3': '#4F84AD', '--d4': '#2B5878', '--blue': '#73A5CA' },
      cal: '#FF933E', clk: ['#FFE9A9', '#FFCB56', '#E3A62E', '#7A3A0C'],
      css: '.cbr{background:linear-gradient(180deg,#EEF5FB,#B9D5EA);border-color:#73A5CA;color:#2B5878}.cbr .ic{box-shadow:inset 0 0 0 2px #73A5CA}.cal{box-shadow:0 6px 0 #F4D88C,0 10px 16px rgba(120,80,0,.12)}' },
    xmas: { name: '🎄 聖誕節', fx: 'snow', icon: '❄️', target: '12-25', count: '🎁 距離聖誕節還有 {n} 天', today: '🎄 今天是聖誕節！',
      title: '🎄 Merry Christmas！聖誕快樂', sub: '今天點餐，TOM 送你一場雪',
      banner: 'linear-gradient(90deg,#B3202A,#D23A3A)', cal: '#B3202A', clk: ['#2C6B47', '#1F5C3B', '#123D27', '#FFF4D6'],
      hat: HAT, hatPos: 'left:2px;top:-17px;width:62px;transform:rotate(-12deg)', calDeco: '🎀' },
    thanks: { name: '🦃 感恩節', fx: 'leaf', icon: '🍁', target: '11-26', count: '🦃 距離感恩節還有 {n} 天', today: '🦃 今天是感恩節！',
      title: '🍁 Happy Thanksgiving！感恩有你', sub: '謝謝每一位一起揪團的同事',
      banner: 'linear-gradient(90deg,#A0461F,#C9622A)', cal: '#A0461F', clk: ['#F6C66B', '#E08A3C', '#B5622A', '#4A2210'],
      hat: PIL, hatPos: 'left:8px;top:-14px;width:56px;transform:rotate(-8deg)', calDeco: '🍁' },
    cny: { name: '🧧 農曆新年', fx: 'cny', icon: '🧧', target: '', count: '', today: '',
      title: '🧧 新年快樂・恭喜發財', sub: '開工第一餐，TOM 請你拿紅包',
      banner: 'linear-gradient(90deg,#B00D26,#E0283E)', cal: '#C8102E', clk: ['#E0283E', '#B00D26', '#7E0A1C', '#FFE2A0'],
      hat: RED, hatPos: 'left:52px;top:44px;width:26px;transform:rotate(12deg)', calDeco: '🧧' }
  };
})();
