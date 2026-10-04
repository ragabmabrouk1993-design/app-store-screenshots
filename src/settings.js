/* Channel Settings screen (src/screens/ChannelSettings) rebuilt with demo values.
   <div data-settings data-scroll-to="risk"></div> renders the screen scrolled so
   that section's top sits just below the header. Load before kit.js. */
(function () {
  // Arabic pages (<html lang="ar">): the app's strings from src/local/ar.json (screens.ChannelSettings)
  const AR = {
    'Settings': 'الإعدادات', 'Save': 'حفظ', 'Allowed Symbols': 'الرموز المسموحة', 'Trade limits': 'حدود التداول',
    'Max active trades': 'الحد الأقصى للصفقات النشطة', 'Max trades per day': 'الحد الأقصى للصفقات يوميًا',
    'Duplicate signal timeout': 'مهلة الإشارة المكررة', 'Risk &amp; Position sizing': 'المخاطر وحجم المركز',
    'Fixed lot size': 'حجم عقد ثابت', 'Fixed Price': 'سعر ثابت', 'Equity percentage': 'نسبة من رأس المال',
    'Max lot size': 'الحد الأقصى لحجم العقد', 'Max SL distance': 'الحد الأقصى لمسافة وقف الخسارة',
    'Use broker minimum lot': 'استخدام الحد الأدنى لحجم العقد لدى الوسيط',
    'Reject when SL is greater than TP1': 'رفض عندما يكون وقف الخسارة أكبر من الهدف الأول',
    'Lot rounding': 'تقريب حجم العقد', 'Round down (safer)': 'تقريب لأسفل (أكثر أمانًا)',
    'Round to nearest': 'تقريب لأقرب قيمة', 'Round up (higher risk)': 'تقريب لأعلى (مخاطرة أعلى)',
    'Incomplete Signals': 'الإشارات غير المكتملة', 'Allow forwarded signals': 'السماح بالإشارات المعاد توجيهها',
    'Allow provider SL widening': 'السماح بتوسيع وقف الخسارة من المزود',
    'Allow trades without SL/TP': 'السماح بالصفقات بدون وقف خسارة/جني أرباح', 'SL distance (pips)': 'مسافة وقف الخسارة (نقاط)',
    'If price moves away': 'عند ابتعاد السعر', 'Place limit order at original entry': 'وضع أمر معلق عند سعر الدخول الأصلي',
    'Entry tolerance': 'هامش تحمل الدخول', 'Tolerance mode': 'نمط هامش التحمل',
    'One broker tick': 'نقطة سعر واحدة من الوسيط', 'Within trader pips': 'ضمن نقاط المتداول',
    'Break Even': 'التعادل', 'Enable break-even': 'تفعيل التعادل', 'Based On TP Hit': 'بناءً على تحقيق هدف الربح',
    'Fixed Pips': 'نقاط ثابتة', 'Trailing stop': 'وقف الخسارة المتحرك', 'Enable trailing stop': 'تفعيل وقف الخسارة المتحرك',
    'Follow TP levels': 'اتباع مستويات هدف الربح', 'Step by pips': 'التدرج بالنقاط',
    'Price move trigger (pips)': 'محفز تحرك السعر (نقاط)', 'SL move amount (pips)': 'مقدار نقل وقف الخسارة (نقاط)',
    'Take-profit levels': 'مستويات هدف الربح', 'Use all TP levels': 'استخدام جميع مستويات هدف الربح',
    'Use selected TP levels': 'استخدام مستويات هدف ربح محددة',
  };
  const tr = s => (document.documentElement.lang === 'ar' && AR[s]) || s;
  const info = '<i class="info" data-ic="info"></i>';
  const sh = (t, cls = 'TB16') => `<div class="sh"><span class="${cls}">${tr(t)}</span>${info}</div>`;
  const lbl = t => `<div class="sh"><span class="SB12 c-sub">${tr(t)}</span>${info}</div>`;
  const stepper = (t, v, opts = {}) => `<div class="nstep" ${opts.first ? 'style="margin-top:0"' : ''}>${lbl(t)}
      <div class="stepper"><span class="btn ${opts.atMin ? 'dis' : ''}"><i data-ic="minus"></i></span><span class="val">${v}</span><span class="btn ${opts.maxed ? 'dis' : ''}"><i data-ic="plus"></i></span></div></div>`;
  const radio = (t, on, kids = '') => `<div class="ropt"><i class="ctl" data-ic="${on ? 'radioOn' : 'radioOff'}"></i>${lbl(t)}</div>${on && kids ? `<div class="kids">${kids}</div>` : ''}`;
  const check = (t, on, kids = '') => `<div class="ropt cb"><i class="ctl" data-ic="${on ? 'checkbox' : 'uncheckbox'}"></i>${lbl(t)}</div>${on && kids ? `<div class="kids">${kids}</div>` : ''}`;
  const chips = (items, sel) => `<div class="chips">${items.map(i => `<span class="chip ${i === sel ? 'on' : ''}">${tr(i)}</span>`).join('')}</div>`;
  const options = (t, items, sel) => `<div class="opts">${lbl(t)}${chips(items, sel)}</div>`;
  const input = v => `<div class="input sin"><i data-ic="server"></i><span>${v}</span></div>`;
  const sym = (b, q, label) => `<span class="schip"><span class="pair" data-k="pair" data-b="${b}" data-q="${q}" data-size="19"></span><span class="slbl">${label}</span><span class="rm"><i data-ic="x"></i></span></span>`;

  const body = `
    <div class="section" data-sec="symbols">
      ${sh('Allowed Symbols')}
      <div class="symbols">${sym('xau', 'usd', 'XAU / USD')}${sym('xag', 'usd', 'XAG / USD')}${sym('eur', 'usd', 'EUR / USD')}${sym('gbp', 'usd', 'GBP / USD')}<span class="addsym"><i data-ic="plus"></i></span></div>
    </div>
    <div class="section" data-sec="limits">
      ${sh('Trade limits')}
      ${stepper('Max active trades', 4)}
      ${stepper('Max trades per day', 9)}
      ${stepper('Duplicate signal timeout', 5)}
    </div>
    <div class="section" data-sec="risk">
      ${sh('Risk &amp; Position sizing')}
      ${radio('Fixed lot size', false)}
      ${radio('Fixed Price', true, input('12'))}
      ${radio('Equity percentage', false)}
      ${stepper('Max lot size', '0.01', { atMin: true })}
      ${stepper('Max SL distance', 100)}
      ${check('Use broker minimum lot', true)}
      ${check('Reject when SL is greater than TP1', false)}
      ${options('Lot rounding', ['Round down (safer)', 'Round to nearest', 'Round up (higher risk)'], 'Round down (safer)')}
    </div>
    <div class="section" data-sec="incomplete">
      ${sh('Incomplete Signals')}
      ${check('Allow forwarded signals', true)}
      ${check('Allow provider SL widening', false)}
      ${check('Allow trades without SL/TP', true, stepper('SL distance (pips)', 200, { first: true }))}
    </div>
    <div class="section" data-sec="away">
      ${sh('If price moves away')}
      ${check('Place limit order at original entry', false)}
      <div class="subsec">${sh('Entry tolerance')}
        ${options('Tolerance mode', ['One broker tick', 'Within trader pips'], 'One broker tick')}</div>
    </div>
    <div class="section" data-sec="breakeven">
      ${sh('Break Even')}
      ${check('Enable break-even', true,
        radio('Based On TP Hit', true, chips(['TP1', 'TP2', 'TP3'], 'TP1')) +
        radio('Fixed Pips', false))}
    </div>
    <div class="section" data-sec="trailing">
      ${sh('Trailing stop')}
      ${check('Enable trailing stop', true,
        radio('Follow TP levels', false) +
        radio('Step by pips', true, stepper('Price move trigger (pips)', 20, { first: true }) + stepper('SL move amount (pips)', 11)))}
    </div>
    <div class="section" data-sec="tp">
      ${sh('Take-profit levels')}
      ${radio('Use all TP levels', true)}
      ${radio('Use selected TP levels', false)}
    </div>`;

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.querySelector('[data-settings]');
    if (!el) return;
    el.innerHTML = `
      <div class="hdr" style="top:38px"><i class="back" data-ic="back" style="width:38px;height:38px"></i><span class="title" style="font-size:21px">${tr('Settings')}</span></div>
      <div class="sv"><div class="sc">${body}</div></div>
      <div class="actions"><div class="btn-primary">${tr('Save')}</div></div>`;
    const to = el.dataset.scrollTo;
    if (!to) return;
    const place = () => {
      const sc = el.querySelector('.sc'), sec = el.querySelector(`[data-sec="${to}"]`);
      const top = +(el.dataset.top || 112);
      sc.style.transform = `translateY(${-(24 + sec.offsetTop - top)}px)`;
    };
    place();
    document.fonts.ready.then(place);
  });
})();
