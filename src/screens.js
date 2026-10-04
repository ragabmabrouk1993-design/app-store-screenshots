/* In-app screens with demo data. <div class="app" data-screen="home"> expands into the screen.
   Load before kit.js (kit expands icons/avatars/pairs inside the generated markup). */
(function () {
  // Arabic pages (<html lang="ar">) use the app's own strings from src/local/ar.json and mirror the
  // screen like the app does with I18nManager.forceRTL. Text the app shows untranslated (trade rows,
  // account tags, symbols, channel and event names) stays in English.
  const isAr = document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr ? ar : en);
  const pnl = (v, cls = 'R12') => `<span class="pnl ${cls}"><i data-ic="trendUp" style="width:17px;height:17px"></i>${v}</span>`;
  const tps = list => `<div class="tps">${list.map(([t, hit]) => `<span class="tp ${hit ? 'hit' : ''}">${t}${hit ? '<i data-ic="checkC"></i>' : ''}</span>`).join('')}</div>`;
  const order = o => `<div class="order">
      <div class="l"><span class="pair" data-k="pair" data-b="${o.b}" data-q="usd" data-size="26"></span>
        <div class="col" style="align-items:flex-start">
          <div class="sym"><span class="TB14 c-white">${o.sym}</span>${o.badge || ''}</div>
          <div class="det R12"><span class="${o.side === 'Sell' ? 'c-red' : 'c-primary'}">${o.side} ${o.lot} lot&nbsp;</span><span class="c-sub">at ${o.at}</span></div>
          ${o.tps ? tps(o.tps) : ''}
        </div></div>
      <div class="r"><span class="R12">${o.px}</span>${pnl(o.pl)}</div></div>`;
  const ch = (kind, name, members, pl, on, neg) => `<div class="ch"><span data-k="av" data-kind="${kind}" data-size="47"></span>
      <div class="tt"><span class="name">${name}</span><div class="meta"><span class="R12 c-sub">• ${members} ${L('members', 'أعضاء')}</span>
      <span class="pill ${neg ? 'neg' : ''}"><i data-ic="${neg ? 'trendDown' : 'trendUp'}"></i>${pl}</span></div></div>
      <span class="switch ${on ? 'on' : ''}"></span></div>`;
  const ev = (tm, imp, cur, nm, vl, cls = '', next = false) => `<div class="ev"><div class="tm">${tm}${next ? '<span class="nx">' + L('Next Event', 'الحدث القادم') + '</span>' : ''}</div>
      <div class="dt"><span class="imp ${imp}"></span><span class="cur">${cur}</span><span class="nm">${nm}</span><span class="vl ${cls}">${vl}</span></div></div>`;

  // iOS number pad; decimal = Telegram's decimal-pad ('.' key), otherwise the MT number pad
  const keyboard = decimal => {
    const k = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ']]
      .map(([d, l]) => `<span><b>${d}</b>${l ? `<i>${l}</i>` : ''}</span>`).join('');
    const del = '<span class="del"><svg viewBox="0 0 26 21" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M8.2 1.5h14.3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8.2L1.5 10.5z"/><path d="m12 6.5 8 8m0-8-8 8"/></svg></span>';
    const globe = '<svg class="globe" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="13" cy="13" r="11.5"/><ellipse cx="13" cy="13" rx="5.2" ry="11.5"/><path d="M1.5 13h23M3.3 7h19.4M3.3 19h19.4M13 1.5v23"/></svg>';
    return `<div class="kb"><div class="keys">${k}${decimal ? '<span><b>.</b></span>' : '<span class="blank"></span>'}<span><b>0</b></span>${del}</div>${globe}</div>`;
  };

  const T = {
    home: () => `<div data-k="sb"></div>
      <div class="home-hdr">
        <div class="col" style="align-items:flex-start">
          <div class="TB20">${L('Hi, Alex👋', 'مرحبًا، أحمد 👋')}</div>
          <div class="row" style="gap:14px">
            <div class="acct R14 c-sub">#51234870<i data-ic="chevDown"></i></div>
            <div class="row" style="gap:7px"><span class="tag green">Real</span><span class="tag dark">MT5</span><span class="tag dark">USD</span></div>
          </div>
        </div>
        <div class="bell"><i data-ic="bell"></i><i></i></div>
      </div>
      <div class="overview">
        <div class="R14">${L('Balance', 'الرصيد')}</div>
        <div class="TB32">$24,860.42</div>
        <div class="row"><span class="pnl R14"><i data-ic="trendUp" style="width:20px;height:20px"></i>+$1,284.50</span><span class="R14 c-green">&nbsp;(5.45%)</span></div>
        <div class="stats">
          <div class="stat"><div style="flex:1"><div class="ib"><i data-ic="server"></i></div></div><div class="TB14">MT5/MT4</div>
            <div class="st"><span class="dot"></span><span class="R12 c-sub">${L('Connected', 'متصل')}</span></div></div>
          <div class="stat"><div style="flex:1"><div class="ib" style="color:#696F74"><i data-ic="plane"></i></div></div><div class="TB14">${L('Telegram', 'تيليجرام')}</div>
            <div class="st"><span class="dot"></span><span class="R12 c-sub">${L('Connected', 'متصل')}</span></div></div>
        </div>
      </div>
      <div class="plan">
        <div class="row" style="gap:9px;align-items:center">
          <div class="pi"><i data-ic="crown"></i></div>
          <div class="col" style="align-items:flex-start">
            <div class="R12 c-sub" style="line-height:15px">${L('Current Plan', 'الخطة الحالية')}</div>
            <div class="row" style="gap:5px;margin-top:6px"><span style="font:700 19px/normal Aeonik;color:#fff">Pro</span>
              <span class="ptag" style="background:#26292E;color:var(--sub)">${L('Monthly', 'شهري')}</span><span class="ptag" style="background:#153829;color:var(--green)">${L('Active', 'نشط')}</span></div>
            <div class="R12 c-sub" style="margin-top:6px;line-height:15px">${L('Renews on Nov 2, 2026 (30 days left)', 'يتجدد في Nov 2, 2026 (متبقي 30 يوم)')}</div>
          </div>
        </div>
        <i data-ic="chevRight" style="width:26px;height:26px;align-self:center;color:#fff"></i>
      </div>
      <div class="tabs"><div class="rowt">
          <div class="t on">${L('Open', 'مفتوحة')} <span class="cnt">2</span></div><div class="t">${L('Limit', 'معلقة')}</div>
          <div class="t">${L('Closed', 'مغلقة')} <span class="cnt" style="color:var(--sub)">312</span></div></div>
        <div class="ind" style="left:19px;width:96px"></div></div>
      <div class="sec-h"><div class="row" style="gap:9px"><span data-k="av" data-kind="aurum" data-size="24"></span><span class="R14">Aurum Gold Signals</span></div>${pnl('+$184.20')}</div>
      ${order({ b: 'xau', sym: 'XAUUSD', side: 'Buy', lot: '0.12', at: '4,412.50', px: '$4,427.85', pl: '+$184.20', tps: [['TP1 4,418.00', 1], ['TP2 4,430.00'], ['TP3 4,445.00']] })}
      <div class="sec-h" style="margin-top:16px"><div class="row" style="gap:9px"><span data-k="av" data-kind="northline" data-size="24"></span><span class="R14">Northline FX</span></div>${pnl('+$61.20')}</div>
      ${order({ b: 'eur', sym: 'EURUSD', side: 'Sell', lot: '0.40', at: '1.17420', px: '$1.17267', pl: '+$61.20', tps: [['TP1 1.17300', 1], ['TP2 1.17150'], ['TP3 1.17000']] })}
      <div class="tabbar" data-k="tabbar" data-on="home"></div>`,

    channels: () => `<div data-k="sb"></div>
      <div class="hdr"><span class="title" style="font-size:21px">${L('Connected Channels', 'القنوات')}</span><span class="act"><i data-ic="plus" style="width:16px;height:16px"></i></span></div>
      <div class="list">
        ${ch('aurum', 'Aurum Gold Signals', '12,480', '+$3,482.60', true)}
        ${ch('northline', 'Northline FX', '8,315', '+$1,912.40', true)}
        ${ch('pipwave', 'Pipwave Trading', '3,902', '+$684.25', true)}
        ${ch('atlas', 'Atlas Swing Room', '1,276', '+$248.10', false)}
        ${ch('meridian', 'Meridian Forex VIP', '5,640', '-$92.30', false, true)}
      </div>
      <div class="tabbar" data-k="tabbar" data-on="channels"></div>`,

    connectTelegram: () => `<div data-k="sb"></div><div class="parent"></div>
      <div class="sheet"><i class="back" data-ic="back"></i>
        <div class="body">
          <div class="ttl">${L('Connect Telegram', 'ربط تيليجرام')}<i data-ic="tg" style="width:27px;height:27px"></i></div>
          <div class="subt">${L('Enter your Telegram number to link it to the app.', 'أدخل رقم تيليجرام لربطه بالتطبيق.')}</div>
          <div class="phrow">
            <div class="cc"><span class="fl">🇬🇧</span><b>+44</b></div>
            <div class="fld"><i data-ic="phone"></i><span>7700 900123</span><span class="caret"></span></div>
          </div>
        </div>
        <div class="cbtn btn-primary">${L('Connect', 'ربط')}</div>
      </div>`,

    connectMT: () => `<div data-k="sb"></div><div class="parent"></div>
      <div class="sheet"><i class="back" data-ic="back"></i>
        <div class="body">
          <div class="ttl">${L('Connect MT4/MT5', 'ربط MT4/MT5')}<i data-ic="server"></i></div>
          <div class="subt">${L('Connect your MT4 or MT5 account to start automatic trade execution from your selected channels.', 'اربط حساب MT4 أو MT5 لبدء تنفيذ الصفقات تلقائيًا من القنوات المحددة.')}</div>
          <div class="plat"><span class="TB14" style="margin-inline-end:4px">${L('Platform:', 'المنصة:')}</span><span class="pc on">MT5</span><span class="pc">MT4</span></div>
          <div class="fld" style="margin-top:16px"><i data-ic="server"></i><span>YourBroker-Live</span><i class="end" data-ic="chevDown" style="color:var(--sub)"></i></div>
          <div class="fld"><i data-ic="hash"></i><span>51234870</span><span class="caret"></span></div>
          <div class="fld"><i data-ic="lock"></i><span class="dots">••••••••••</span><i class="end" data-ic="eye" style="width:26px;height:26px;color:var(--sub)"></i></div>
        </div>
        <div class="cbtn btn-primary">${L('Connect', 'ربط')}</div>
      </div>`,

    profile: () => `<div data-k="sb"></div>
      <div class="hdr" style="justify-content:space-between"><i class="back" data-ic="back" style="position:static;width:38px;height:38px"></i><span class="act" style="position:static"><i data-ic="gear" style="width:19px;height:19px"></i></span></div>
      <div class="hero"><span data-k="av" data-kind="aurum" data-size="104"></span>
        <div class="TB20" style="margin-top:12px">Aurum Gold Signals</div><div class="R14 c-sub meta"><bdi>@aurumgoldsignals</bdi> • 12,480 ${L('members', 'أعضاء')}</div></div>
      <div class="grid4">
        <div class="sc4"><span class="ib"><i data-ic="server"></i></span><div><div class="v c-success">+$3,482.60</div><div class="l">${L('Total Profit', 'إجمالي الربح')}</div></div></div>
        <div class="sc4"><span class="ib"><i data-ic="server"></i></span><div><div class="v">146</div><div class="l">${L('Executed Trades', 'الصفقات المنفذة')}</div></div></div>
        <div class="sc4"><span class="ib" style="color:#009940"><i data-ic="trendUp"></i></span><div><div class="v">98</div><div class="l">${L('Winning Trades', 'الصفقات الرابحة')}</div></div></div>
        <div class="sc4"><span class="ib" style="color:#D22A00"><i data-ic="trendDown"></i></span><div><div class="v">48</div><div class="l">${L('Losing Trades', 'الصفقات الخاسرة')}</div></div></div>
      </div>
      <div class="chart"><span class="badge2">${L('Total Profit', 'إجمالي الربح')}</span><div class="val">+$2,946.80</div>
        <div class="ranges"><span>${L('Week', 'أسبوع')}</span><span>${L('Month', 'شهر')}</span><span class="on">${L('3 Months', '3 أشهر')}</span><span>${L('Year', 'سنة')}</span><span>${L('All', 'الكل')}</span></div>
        <div class="plot"><svg class="plotsvg" width="402" height="206" style="position:absolute;left:-12px;top:0"></svg></div></div>
      <div class="ptabs tabs"><div class="rowt"><div class="t">${L('Open', 'مفتوح')} <span class="cnt" style="color:var(--sub)">1</span></div><div class="t">${L('Limit', 'معلق')}</div><div class="t on">${L('Closed', 'مغلق')} <span class="cnt">146</span></div></div>
        <div class="ind" style="left:164px;width:116px"></div></div>
      <div class="olist">${order({ b: 'xau', sym: 'XAUUSD', side: 'Buy', lot: '0.12', at: '4,371.20', px: '$4,389.20', pl: '+$216.00', badge: '<span class="badge tp">TP 2</span>' })}</div>`,

    news: () => `<div data-k="sb"></div>
      <div class="hdr"><span class="title" style="font-size:21px">${L('News', 'الأخبار')}</span></div>
      <div class="nlist"><div class="sec">${L('Today:', 'اليوم:')}</div>
        ${ev('2:00AM', 'lo', 'GBP', 'Nationwide HPI m/m', '0.4%', 'c-good')}
        ${ev('4:30AM', 'lo', 'GBP', 'Construction PMI', '46.2', 'c-bad')}
        ${ev('5:00AM', 'md', 'EUR', 'Core CPI Flash Estimate y/y', '2.3%')}
        ${ev('8:30AM', 'hi', 'USD', 'Average Hourly Earnings m/m', '0.4%', 'c-good')}
        ${ev('8:30AM', 'hi', 'USD', 'Non-Farm Employment Change', '142K', 'c-good')}
        ${ev('8:30AM', 'hi', 'USD', 'Unemployment Rate', '4.1%', 'c-good')}
        ${ev('10:00AM', 'hi', 'USD', 'ISM Services PMI', '-', '', true)}
        ${ev('12:00PM', 'md', 'USD', 'FOMC Member Speaks', '-')}
        ${ev('1:00PM', 'lo', 'USD', 'Baker Hughes Rig Count', '-')}
      </div>
      <div class="tabbar" data-k="tabbar" data-on="news"></div>`,
  };

  // Cumulative profit for the profile chart, Jul 2 – Oct 2 (demo data ending at +$2,946.80)
  function drawChart(app) {
    const svg = app.querySelector('.plotsvg');
    const pts = [[0,0],[5,120],[9,60],[14,340],[18,280],[23,610],[27,540],[31,820],[35,760],[40,1100],[44,1020],[48,1380],[52,1290],
      [56,1610],[60,1540],[64,1850],[68,2010],[72,1880],[76,2240],[80,2410],[84,2330],[88,2690],[92,2946.8]];
    const L = 24, R = 330, Tp = 22, B = 166;
    const X = d => L + (d / 92) * (R - L), Y = v => B - (v / 3200) * (B - Tp);
    const P = pts.map(([d, v]) => [X(d), Y(v)]);
    let d = `M${P[0][0]},${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      d += `C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    const grid = [0, 1000, 2000, 3000].map(v => `<line x1="12" x2="${R + 10}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(255,255,255,.09)" stroke-width="1"/>`).join('');
    svg.innerHTML = `<defs><linearGradient id="af" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A69F1" stop-opacity=".38"/><stop offset="1" stop-color="#1A69F1" stop-opacity="0"/></linearGradient></defs>
      ${grid}<path d="${d}L${R},${B + 18}L${L},${B + 18}Z" fill="url(#af)"/><path d="${d}" fill="none" stroke="#1A69F1" stroke-width="2.6" stroke-linejoin="round"/>
      <circle cx="${P[P.length - 1][0]}" cy="${P[P.length - 1][1]}" r="4.5" fill="#1A69F1" stroke="#fff" stroke-width="2"/>`;
    const plot = svg.parentElement;
    [0, 1000, 2000, 3000].forEach(v => plot.insertAdjacentHTML('beforeend', `<span class="ylab" style="top:${Y(v)}px">${v}$</span>`));
    [[13, '15', 0], [30, 'Aug', 1], [44, '15', 0], [61, 'Sep', 1], [75, '15', 0]].forEach(([dd, t, m]) =>
      plot.insertAdjacentHTML('beforeend', `<span class="xlab ${m ? 'm' : ''}" style="left:${X(dd) - 12}px">${t}</span>`));
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.app[data-screen]').forEach(app => {
      const k = app.dataset.screen;
      app.classList.add('scr-' + k);
      if (isAr) app.dir = 'rtl';
      if (k === 'connectTelegram' || k === 'connectMT') app.classList.add('modal');
      app.insertAdjacentHTML('afterbegin', T[k]());
      if (app.dataset.keyboard !== undefined) {
        app.classList.add('kbd');
        app.insertAdjacentHTML('beforeend', keyboard(k === 'connectTelegram'));
      }
      if (k === 'profile') drawChart(app);
    });
    // place Open/Limit/Closed underline under the active tab once fonts are in
    document.fonts.ready.then(() => document.querySelectorAll('.tabs').forEach(t => {
      const on = t.querySelector('.t.on'), ind = t.querySelector('.ind');
      if (on && ind) { ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px'; }
    }));
  });
})();
