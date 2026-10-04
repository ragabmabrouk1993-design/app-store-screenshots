/* Onboarding pages. <div class="app onb" data-onb="signals"></div> expands into one of the four
   pages (signals, telegram, connect, rules). Arabic pages (<html lang="ar">) get the Arabic copy and
   right-to-left layout; trade rows, symbols and channel names stay English, as in the app.
   Load before deco.js and kit.js (they expand the decorations, icons, avatars and pairs). */
(function () {
  const isAr = document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr ? ar : en);
  const ORDER = ['signals', 'telegram', 'connect', 'rules'];

  const pnl = v => `<span class="pnl R12"><i data-ic="trendUp" style="width:17px;height:17px"></i>${v}</span>`;
  const tps = list => `<div class="tps">${list.map(([t, hit]) => `<span class="tp ${hit ? 'hit' : ''}">${t}${hit ? '<i data-ic="checkC"></i>' : ''}</span>`).join('')}</div>`;
  const order = o => `<div class="order">
      <div class="l"><span class="pair" data-k="pair" data-b="${o.b}" data-q="usd" data-size="26"></span>
        <div class="col" style="align-items:flex-start">
          <div class="sym"><span class="TB14 c-white">${o.sym}</span>${o.badge || ''}</div>
          <div class="det R12"><span class="c-primary">${o.side} ${o.lot} lot&nbsp;</span><span class="c-sub">at ${o.at}</span></div>
          ${o.tps ? tps(o.tps) : ''}
        </div></div>
      <div class="r"><span class="R12">${o.px}</span>${pnl(o.pl)}</div></div>`;
  const ch = (kind, name, members, pl, on) => `<div class="ch"><span data-k="av" data-kind="${kind}" data-size="46"></span>
      <div class="tt"><span class="name">${name}</span><div class="meta"><span class="R12 c-sub">• ${members} ${L('members', 'أعضاء')}</span>
      <span class="pill"><i data-ic="trendUp"></i>${pl}</span></div></div>
      <span class="switch ${on ? 'on' : ''}"></span></div>`;
  const rule = (ic, t, end) => `<div class="rule"><span class="ib"><i data-ic="${ic}"></i></span><span class="t">${t}</span>${end}</div>`;

  const P = {
    signals: {
      title: L('Never Miss<br>a <em>Signal</em>', 'لا تفوّت<br>أي <em>إشارة</em>'),
      text: L('Tragram copies Telegram signals to your MT4/MT5 account the moment they’re posted.',
        'ينسخ Tragram إشارات تيليجرام إلى حسابك على MT4/MT5 لحظة نشرها.'),
      stage: () => `<div class="s1">
        <svg class="flow" viewBox="0 0 440 462" fill="none">
          <path d="M220 150V196M220 292V334" stroke="#5B95FF" stroke-opacity=".7" stroke-width="2" stroke-dasharray="4 6" stroke-linecap="round"/>
          <circle cx="220" cy="150" r="4" fill="#CFF3FF"/><circle cx="220" cy="150" r="10" fill="#5CD3FF" opacity=".2"/>
          <circle cx="220" cy="334" r="4" fill="#CFF3FF"/><circle cx="220" cy="334" r="10" fill="#5CD3FF" opacity=".2"/></svg>
        <div class="ob msg">
          <div class="who"><span data-k="av" data-kind="aurum" data-size="32"></span><b>Aurum Gold Signals</b><i data-ic="tg"></i></div>
          <div class="tx"><b>XAUUSD</b> <b class="buy">BUY</b> 4,412.50<br>SL 4,398.00<br>TP1 4,418 · TP2 4,430 · TP3 4,445</div>
          <div class="tm">9:41</div>
        </div>
        <div class="orb mk"><span data-k="mark"></span></div>
        <div class="ob exec">
          <div class="ob-h"><b><i data-ic="checkC"></i>${L('Order executed', 'تم تنفيذ الصفقة')}</b><span>${L('now', 'الآن')}</span></div>
          ${order({ b: 'xau', sym: 'XAUUSD', side: 'Buy', lot: '0.12', at: '4,412.50', px: '$4,427.85', pl: '+$184.20' })}
        </div></div>`,
    },
    telegram: {
      title: L('Link Your<br><em>Telegram</em>', 'اربط حساب<br><em>تيليجرام</em>'),
      text: L('Pick the channels you trust and switch copying on or off anytime.',
        'اختر القنوات التي تثق بها، وفعّل النسخ أو أوقفه في أي وقت.'),
      stage: () => `<div class="s2">
        <div class="orb"><i data-ic="tg"></i></div>
        <div class="ob chs">
          <div class="ob-h"><b>${L('Connected Channels', 'القنوات')}</b><span>${L('2 Active', '2 نشط')}</span></div>
          ${ch('aurum', 'Aurum Gold Signals', '12,480', '+$3,482.60', true)}
          ${ch('northline', 'Northline FX', '8,315', '+$1,912.40', true)}
          ${ch('pipwave', 'Pipwave Trading', '3,902', '+$684.25', false)}
        </div></div>`,
    },
    connect: {
      title: L('Connect<br><em>MT4 &amp; MT5</em>', 'اربط حسابك<br><em>MT4 &amp; MT5</em>'),
      text: L('Link your broker account in seconds. Your login is encrypted on your phone.',
        'اربط حسابك لدى الوسيط في ثوانٍ. بيانات الدخول تُشفَّر على هاتفك.'),
      stage: () => `<div class="s3">
        <div class="orb"><i data-ic="shield"></i></div>
        <div class="pop zin">
          <div class="plat"><span>${L('Platform:', 'المنصة:')}</span><span class="pc">MT4</span><span class="pc on">MT5</span></div>
          <div class="zrow"><div class="zfld"><i data-ic="server"></i><span>YourBroker-Live</span><i class="end" data-ic="checkC"></i></div></div>
          <div class="zrow"><div class="zfld on"><i data-ic="hash"></i><span>51234870</span><span class="zcaret"></span></div></div>
          <div class="zenc"><i data-ic="lock"></i>${L('Encrypted before it leaves your phone', 'مشفّرة قبل أن تغادر هاتفك')}</div>
        </div>
        <div class="conn"><i></i>${L('Connected', 'متصل')} · MT5 · 51234870</div></div>`,
    },
    rules: {
      title: L('Trade by<br><em>Your Rules</em>', 'تداول وفق<br><em>قواعدك</em>'),
      text: L('Set your lot size, break-even and trailing stop. Your profits are protected on autopilot.',
        'حدّد حجم العقد والتعادل ووقف الخسارة المتحرك، وتُحمى أرباحك تلقائيًا.'),
      stage: () => `<div class="s4">
        <div class="ob prot">
          ${order({ b: 'xau', sym: 'XAUUSD', side: 'Buy', lot: '0.12', at: '4,412.50', px: '$4,436.10', pl: '+$283.20',
            badge: '<span class="badge be">BE</span>', tps: [['TP1 4,418', 1], ['TP2 4,430', 1], ['TP3 4,445']] })}
        </div>
        <div class="ob rules">
          ${rule('sliders', L('Fixed lot size', 'حجم عقد ثابت'), '<span class="v">0.12</span>')}
          ${rule('shield', L('Enable break-even', 'تفعيل التعادل'), '<span class="switch on"></span>')}
          ${rule('trendUp', L('Enable trailing stop', 'تفعيل وقف الخسارة المتحرك'), '<span class="switch on"></span>')}
          ${rule('clock', L('Max trades per day', 'الحد الأقصى للصفقات يوميًا'), '<span class="v">5</span>')}
        </div></div>`,
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.app[data-onb]').forEach(app => {
      const k = app.dataset.onb, p = P[k], i = ORDER.indexOf(k), last = i === ORDER.length - 1;
      if (isAr) app.setAttribute('dir', 'rtl');
      app.innerHTML = `<div class="bgdots"></div>
        <div data-deco="rings" data-cx="220" data-cy="${k === 'signals' ? 356 : 170}" data-n="7" data-r0="70" data-step="52"></div>
        <div data-k="sb"></div>
        <div class="topbar"><div class="lockup"><span class="mark" data-k="mark"></span><span class="word"><img src="logo.svg"></span></div>
          ${last ? '' : `<span class="skip">${L('Skip', 'تخطي')}</span>`}</div>
        <div class="stage">${p.stage()}</div>
        <div class="copy2"><h1>${p.title}</h1><p>${p.text}</p></div>
        <div class="dots">${ORDER.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="btn-primary cta">${last ? L('Get Started', 'ابدأ الآن') : L('Next', 'التالي')}<i data-ic="chevRight"></i></div>`;
    });
  });
})();
