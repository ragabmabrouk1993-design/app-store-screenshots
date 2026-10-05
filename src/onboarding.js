/* Onboarding pages, five steps: signals, linkTelegram, channels, connect, rules.
   <div class="mock" data-onb="signals"></div>  the mockup image only (343 x 516 pt)
   <div class="onbs" data-onb="signals"></div>  the full onboarding screen with that mockup in place
   Arabic pages (<html lang="ar">) get the Arabic copy and right-to-left screens; trade rows, symbols and
   channel names stay English, as in the app. Load before screens.js, settings.js, deco.js and kit.js. */
(function () {
  const isAr = document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr ? ar : en);
  const ORDER = ['signals', 'linkTelegram', 'channels', 'connect', 'rules'];

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
  const sparkles = (x, y) => `<div data-deco="sparkle" data-tone="white" class="z-front" style="left:${x}px;top:${y}px;width:22px;height:22px"></div>
      <div data-deco="sparkle" data-tone="white" class="z-front" style="left:${x + 22}px;top:${y + 32}px;width:11px;height:11px"></div>`;
  // the in-app screen inside the phone
  const phone = app => `<div class="phone"><i class="hw l a"></i><i class="hw l v1"></i><i class="hw l v2"></i><i class="hw r p"></i>
      <div class="bz"><div class="scr">${app}</div></div></div>`;

  const P = {
    signals: {
      title: L('Never Miss a <em>Signal</em>', 'لا تفوّت أي <em>إشارة</em>'),
      text: L('Telegram signals copied to your MT4/MT5 account automatically.', 'إشارات تيليجرام تُنسخ إلى حسابك على MT4/MT5 تلقائيًا.'),
      art: () => `${phone('<div class="app" data-screen="home"></div>')}
        <div class="notif" style="left:14px;top:404px;width:412px">
          <div class="ai"></div>
          <div class="nt">
            <div class="h"><b>${L('Order executed', 'تم تنفيذ الأمر')}</b><span>${L('now', 'الآن')}</span></div>
            <div class="bd">${L('XAUUSD · Buy 0.12 lot @ 4,412.50<br>Copied from Aurum Gold Signals', 'XAUUSD · شراء 0.12 لوت عند 4,412.50<br>من قناة Aurum Gold Signals')}</div>
          </div></div>
        ${sparkles(398, 356)}`,
    },
    linkTelegram: {
      title: L('Link Your <em>Telegram</em>', 'اربط حساب <em>تيليجرام</em>'),
      text: L('Sign in with your Telegram number. Your channels show up right away.', 'سجّل الدخول برقم تيليجرام، وستظهر قنواتك فورًا.'),
      art: () => `${phone('<div class="app" data-screen="connectTelegram" data-full data-keyboard></div>')}
        <div class="pop zin" style="left:22px;top:240px;width:396px">
          <div class="zrow"><div class="zcc"><span class="fl">🇬🇧</span><b>+44</b></div><div class="zfld on"><i data-ic="phone"></i><span>7700 900123</span><span class="zcaret"></span></div></div>
          <div class="zenc"><i data-ic="lock"></i>${L('We only use your number to sign in to Telegram', 'نستخدم رقمك لتسجيل الدخول إلى تيليجرام فقط')}</div>
        </div>
        <div data-deco="plane3d" class="z-front" style="left:-6px;top:338px;width:112px;height:82px;transform:rotate(-10deg)"></div>
        ${sparkles(394, 192)}`,
    },
    channels: {
      title: L('Pick Your <em>Channels</em>', 'اختر <em>قنواتك</em>'),
      text: L('Copy only the channels you trust and switch any of them on or off.', 'انسخ فقط من القنوات التي تثق بها، وفعّل أو أوقف أيًّا منها في أي وقت.'),
      art: () => `${phone('<div class="app" data-screen="channels"></div>')}
        <div class="pop zoom" style="left:8px;top:224px;width:424px">
          <div class="ch"><span data-k="av" data-kind="northline" data-size="47"></span>
            <div class="tt"><span class="name">Northline FX</span><div class="meta"><span class="R12 c-sub">• 8,315 ${L('members', 'أعضاء')}</span>
            <span class="pill"><i data-ic="trendUp"></i>+$1,912.40</span></div></div><span class="switch on"></span></div>
        </div>
        ${sparkles(396, 176)}`,
    },
    connect: {
      title: L('Connect <em>MT4 &amp; MT5</em>', 'اربط <em>MT4 &amp; MT5</em>'),
      text: L('Search your broker’s server and link your account securely.', 'ابحث عن سيرفر الوسيط واربط حسابك بأمان.'),
      art: () => `${phone('<div class="app" data-screen="connectMT" data-full></div>')}
        <div class="pop zin" style="left:22px;top:312px;width:396px">
          <div class="zrow"><div class="zfld"><i data-ic="server"></i><span>YourBroker-Live</span><i class="end" data-ic="checkC"></i></div></div>
          <div class="zrow"><div class="zfld on"><i data-ic="hash"></i><span>51234870</span><span class="zcaret"></span></div></div>
          <div class="zenc"><i data-ic="lock"></i>${L('Encrypted before it leaves your phone', 'تُشفَّر بيانات الدخول قبل أن تغادر هاتفك')}</div>
        </div>
        ${sparkles(394, 264)}`,
    },
    rules: {
      title: L('Trade by <em>Your Rules</em>', 'تداول وفق <em>قواعدك</em>'),
      text: L('Lot size, break-even and trailing stop, all on autopilot.', 'حجم العقد والتعادل ووقف الخسارة المتحرك، كلها تلقائيًا.'),
      art: () => `${phone(`<div class="app"${isAr ? ' dir="rtl"' : ''}><div data-k="sb"></div><div data-settings data-scroll-to="breakeven" data-top="134"></div></div>`)}
        <div class="pop zoom" style="left:8px;top:330px;width:424px">
          <div class="zh"><i data-ic="checkC"></i>${L('Break-even', 'التعادل')}<span>${L('now', 'الآن')}</span></div>
          ${order({ b: 'xau', sym: 'XAUUSD', side: 'Buy', lot: '0.12', at: '4,412.50', px: '$4,436.10', pl: '+$283.20',
            badge: '<span class="badge be">Break Even</span>', tps: [['TP1 4,418', 1], ['TP2 4,430', 1], ['TP3 4,445']] })}
        </div>
        ${sparkles(396, 282)}`,
    },
  };

  const mock = k => `<div class="ml canvas light dark alt"${isAr ? ' dir="rtl"' : ''}>${P[k].art()}</div><div class="fade"></div>`;

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.mock[data-onb]').forEach(el => { el.innerHTML = mock(el.dataset.onb); });
    document.querySelectorAll('.onbs[data-onb]').forEach(el => {
      const k = el.dataset.onb, p = P[k], i = ORDER.indexOf(k);
      if (isAr) el.setAttribute('dir', 'rtl');
      el.innerHTML = `<div class="sbw"${isAr ? ' dir="rtl"' : ''}><div data-k="sb"></div></div>
        <div class="hd"><div class="brand"><span class="mark" data-k="mark"></span>Teragram</div>
          <div class="steps">${ORDER.map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</div></div>
        <div class="mockw"><div class="mock">${mock(k)}</div></div>
        <div class="tx"><h1>${p.title}</h1><p>${p.text}</p></div>
        <div class="next">${i === ORDER.length - 1 ? L('Get Started', 'ابدأ الآن') : L('Next', 'التالي')}</div>
        <div class="ind"></div>`;
    });
  });
})();
