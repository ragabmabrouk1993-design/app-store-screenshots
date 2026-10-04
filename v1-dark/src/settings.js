/* Channel Settings screen (src/screens/ChannelSettings) rebuilt with demo values.
   <div data-settings data-scroll-to="risk"></div> renders the screen scrolled so
   that section's top sits just below the header. Load before kit.js. */
(function () {
  const info = '<i class="info" data-ic="info"></i>';
  const sh = (t, cls = 'TB16') => `<div class="sh"><span class="${cls}">${t}</span>${info}</div>`;
  const lbl = t => `<div class="sh"><span class="SB12 c-sub">${t}</span>${info}</div>`;
  const stepper = (t, v, opts = {}) => `<div class="nstep" ${opts.first ? 'style="margin-top:0"' : ''}>${lbl(t)}
      <div class="stepper"><span class="btn"><i data-ic="minus"></i></span><span class="val">${v}</span><span class="btn ${opts.maxed ? 'dis' : ''}"><i data-ic="plus"></i></span></div></div>`;
  const radio = (t, on, kids = '') => `<div class="ropt"><i class="ctl" data-ic="${on ? 'radioOn' : 'radioOff'}"></i>${lbl(t)}</div>${on && kids ? `<div class="kids">${kids}</div>` : ''}`;
  const check = (t, on, kids = '') => `<div class="ropt cb"><i class="ctl" data-ic="${on ? 'checkbox' : 'uncheckbox'}"></i>${lbl(t)}</div>${on && kids ? `<div class="kids">${kids}</div>` : ''}`;
  const chips = (items, sel) => `<div class="chips">${items.map(i => `<span class="chip ${i === sel ? 'on' : ''}">${i}</span>`).join('')}</div>`;
  const options = (t, items, sel) => `<div class="opts">${lbl(t)}${chips(items, sel)}</div>`;
  const input = v => `<div class="input sin"><i data-ic="server"></i><span>${v}</span></div>`;
  const sym = (b, q, label) => `<span class="schip"><span class="pair" data-k="pair" data-b="${b}" data-q="${q}" data-size="24"></span><span class="sl">${label}</span><span class="rm"><i data-ic="x"></i></span></span>`;

  const body = `
    <div class="section" data-sec="symbols">
      ${sh('Allowed Symbols')}
      <div class="symbols">${sym('xau', 'usd', 'XAU / USD')}${sym('xag', 'usd', 'XAG / USD')}<span class="addsym"><i data-ic="plus"></i></span></div>
    </div>
    <div class="section" data-sec="limits">
      ${sh('Trade limits')}
      ${stepper('Max active trades', 5)}
      ${stepper('Max trades per day', 10)}
      ${stepper('Duplicate signal timeout', 5)}
    </div>
    <div class="section" data-sec="risk">
      ${sh('Risk &amp; Position sizing')}
      ${radio('Fixed lot size', false)}
      ${radio('Fixed Price', false)}
      ${radio('Equity percentage', true, input('1'))}
      ${stepper('Max lot size', 0.5)}
      ${stepper('Max SL distance', 300)}
      ${check('Use broker minimum lot', true)}
      ${check('Reject when SL is greater than TP1', false)}
      ${options('Lot rounding', ['Round down (safer)', 'Round to nearest', 'Round up (higher risk)'], 'Round down (safer)')}
    </div>
    <div class="section" data-sec="incomplete">
      ${sh('Incomplete Signals')}
      ${check('Allow forwarded signals', true)}
      ${check('Allow trades without SL/TP', false)}
      ${stepper('SL distance (pips)', 200)}
    </div>
    <div class="section" data-sec="away">
      ${sh('If price moves away')}
      ${check('Place limit order at original entry', true, stepper('Limit order expiry (minutes)', 30, { first: true }))}
      ${options('Tolerance mode', ['One broker tick', 'Within trader pips'], 'Within trader pips')}
      ${stepper('Allowed range (pips)', 15)}
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
        radio('Step by pips', true, stepper('Price move trigger (pips)', 50, { first: true }) + stepper('SL move amount (pips)', 25)))}
    </div>
    <div class="section" data-sec="tp" style="border-bottom:0">
      ${sh('Take-profit levels')}
      ${radio('Use all TP levels', false)}
      ${radio('Use selected TP levels', true, chips(['TP1', 'TP2', 'TP3'], 'TP2'))}
    </div>`;

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.querySelector('[data-settings]');
    if (!el) return;
    el.innerHTML = `
      <div class="hdr"><i class="back" data-ic="back" style="width:38px;height:38px"></i><span class="title" style="font-size:21px">Settings</span></div>
      <div class="sv"><div class="sc">${body}</div></div>
      <div class="actions"><div class="btn-primary">Save</div></div>`;
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
