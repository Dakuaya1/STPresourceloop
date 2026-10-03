(() => {
  const $ = id => document.getElementById(id);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(.23,1,.32,1)';
  const menu = document.querySelector('.menu-toggle');
  const nav = $('navlinks');
  function closeMenu() { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
  // Project workbook model. Currency values in lakh unless explicitly converted.
  const fmt = (value, decimals = 0) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  // Planning defaults per setup: automation adder (₹ lakh + share of equipment), extra operator ₹/month, maintenance % of capex/year, plant's own electricity use.
  const SETUPS = {
    manual:{name:'Manual', autoFixed:0, autoPct:0, operator:12000, maint:2, parasitic:.10},
    hybrid:{name:'Hybrid', autoFixed:6, autoPct:.08, operator:6000, maint:2.5, parasitic:.12},
    automated:{name:'Automated', autoFixed:15, autoPct:.20, operator:3000, maint:3.5, parasitic:.15}
  };
  // All money in ₹ lakh. feed: 'sludge' | 'food' | 'all' (food + garden/leaf composting). spend: ₹/month avoided, or null for the workbook default.
  function calculate(homes, persons, o) {
    const setup = SETUPS[o.setup], feed = o.feed || 'all';
    const operator = o.operator ?? setup.operator, maint = o.maint ?? setup.maint;
    const population = homes * persons;
    const mld = population * 100 / 1e6;
    const food = feed === 'sludge' ? 0 : population * .15;
    const gas = population * 9 * .55 / 1000 + food * .12;
    const kwh = gas * 6 * .32 * (1 - setup.parasitic);
    // Digester sized from retention time: thickened sludge (0.035 kg DS/person/day at 5% solids) plus food slurry (~1 L/kg).
    const feedM3 = population * .035 / .05 / 1000 + food / 1000;
    const digesterM3 = feedM3 * o.hrt * 1.15, postM3 = feedM3 * 10;
    const tanks = Math.max(0, digesterM3 + postM3 * .5 - mld * 50) * o.rate / 100000;
    const scale = Math.max(.55, Math.pow(mld / 1.5, -.25));
    const core = mld * 55 * scale;
    const addon = (food * 3000 + (feed === 'all' ? homes / 100 * 5 * 2000 : 0)) / 100000;
    const equipment = core + tanks + addon;
    const automation = setup.autoFixed + setup.autoPct * equipment;
    const commissioning = digesterM3 * .2 * 1000 / 100000 + .03 * (equipment + automation);
    const central = equipment + automation + commissioning;
    const low = mld * 40 * scale + tanks * .6 + addon * .7 + automation * .8 + commissioning;
    const high = mld * 70 * scale + tanks * 1.4 + addon * 1.3 + automation * 1.25 + commissioning;
    const power = kwh * 365 * o.tariff / 100000, disposal = o.spend === null ? mld * .67 : o.spend * 12 / 100000, fertilizer = mld * .43;
    const staff = operator * 12 / 100000, upkeep = maint / 100 * central, lab = .5 + gas * 365 / 100000;
    const annual = power + disposal + fertilizer, om = staff + upkeep + lab, net = annual - om;
    // Monthly disposal spend at which the project pays back in 10 years.
    const breakeven = Math.max(0, central / 10 + om - power - fertilizer) * 100000 / 12;
    return {mld, food, gas, kwh, feedM3, digesterM3, postM3, core, tanks, addon, automation, commissioning, central, low, high, power, disposal, fertilizer, staff, upkeep, lab, annual, om, net, payback:net > 0 ? central / net : Infinity, breakeven};
  }
  const lakh = value => (value < 0 ? '−' : '') + (Math.abs(value) >= 100 ? '₹'+fmt(Math.abs(value)/100,2)+' crore' : '₹'+fmt(Math.abs(value),2)+' lakh');
  const years = value => Number.isFinite(value) ? fmt(value,1)+' years' : 'No payback';
  const num = id => { const t = $(id).value.trim(); return t === '' ? NaN : Number(t); };
  const selectedSetup = () => document.querySelector('input[name="setup"]:checked').value;
  function updateEstimate() {
    const homes = Number($('families').value), persons = Number($('people').value), quote = Number($('quote').value), spendText = $('spend').value.trim(), spend = spendText === '' ? null : Number(spendText);
    const o = {setup:selectedSetup(), spend, hrt:num('hrt'), rate:num('rate'), operator:num('operator'), maint:num('maint'), tariff:num('tariff')};
    let error = '';
    if (!Number.isInteger(homes) || homes < 1 || homes > 100000) error = 'Enter a whole number of homes between 1 and 1,00,000.';
    else if (!Number.isFinite(persons) || persons < 1 || persons > 20) error = 'Enter a household size between 1 and 20 people.';
    else if (spend !== null && (!Number.isFinite(spend) || spend < 0)) error = 'Enter a valid non-negative monthly disposal spend in ₹.';
    else if (!Number.isFinite(quote) || quote < 0) error = 'Enter a valid non-negative quote in ₹ lakh.';
    else if (!(o.hrt >= 10 && o.hrt <= 60)) error = 'Enter a retention time between 10 and 60 days.';
    else if (!(o.rate >= 0) || !(o.operator >= 0) || !(o.maint >= 0 && o.maint <= 20) || !(o.tariff >= 0)) error = 'Check the advanced assumptions: values must be non-negative, and maintenance at most 20%.';
    $('input-error').textContent = error;
    if (error) return;
    const v = calculate(homes, persons, o);
    const setupLabel = SETUPS[o.setup].name.toUpperCase()+' SETUP';
    $('scale-note').hidden = homes >= 1000 && homes <= 10000;
    const values = {
      'setup-name':setupLabel, 'feed-setup':setupLabel,
      central:'₹'+(v.central >= 100 ? fmt(v.central/100,2) : fmt(v.central,1)), 'central-unit':v.central >= 100 ? 'crore' : 'lakh', low:'₹'+fmt(v.low,1)+' L', high:'₹'+fmt(v.high,1)+' L',
      'core-cost':lakh(v.core), 'tank-cost':lakh(v.tanks), 'addon-cost':lakh(v.addon), 'auto-cost':lakh(v.automation), 'comm-cost':lakh(v.commissioning),
      perhome:'₹'+fmt(v.central*100000/homes), annual:lakh(v.annual), om:lakh(v.om), net:lakh(v.net), payback:years(v.payback), lifetime:lakh(v.net*20),
      'annual-split':'Value per year: electricity '+lakh(v.power)+' · avoided disposal '+lakh(v.disposal)+(spend === null ? ' (workbook estimate)' : '')+' · fertilizer '+lakh(v.fertilizer),
      'om-split':'Running cost per year: operator '+lakh(v.staff)+' · maintenance & spares '+lakh(v.upkeep)+' · lab tests & consumables '+lakh(v.lab),
      breakeven:v.breakeven > 0 ? 'For a 10-year payback, the society’s current disposal spend would need to be about ₹'+fmt(Math.ceil(v.breakeven/1000)*1000)+' per month.' : 'At this disposal spend, the project pays back within 10 years.',
      cap:fmt(v.mld,3)+' MLD', feed:fmt(v.feedM3,1)+' m³/day', volume:fmt(v.digesterM3)+' m³ + '+fmt(v.postM3)+' m³', gas:fmt(v.gas,1)+' m³/day', power:fmt(v.kwh)+' kWh/day', food:fmt(v.food)+' kg/day'
    };
    Object.entries(values).forEach(([id, value]) => $(id).textContent = value);
    $('setup-rows').innerHTML = Object.entries(SETUPS).map(([key, setup]) => {
      const s = calculate(homes, persons, {...o, setup:key, operator:undefined, maint:undefined});
      const figure = $('model-'+key); if (figure) figure.textContent = 'About '+lakh(s.central)+' for '+fmt(homes)+' homes · running cost '+lakh(s.om)+' a year';
      return `<tr${key === o.setup ? ' class="is-current"' : ''}><th scope="row">${setup.name}</th><td>${lakh(s.central)}</td><td>₹${fmt(s.central*100000/homes)}</td><td>${lakh(s.om)}</td><td>${lakh(s.net)}</td><td>${years(s.payback)}</td></tr>`;
    }).join('');
    $('scenario-rows').innerHTML = [['sludge','STP sludge only'],['food','+ Food waste'],['all','+ Garden waste &amp; leaves (composted)']].map(([feed, label]) => {
      const s = calculate(homes, persons, {...o, feed});
      return `<tr${feed === 'all' ? ' class="is-current"' : ''}><th scope="row">${label}</th><td>${fmt(s.gas,1)} m³/day</td><td>${fmt(s.kwh)} kWh/day</td><td>${lakh(s.central)}</td><td>${lakh(s.net)}</td><td>${years(s.payback)}</td></tr>`;
    }).join('');
    [['core-bar','core'],['tank-bar','tanks'],['addon-bar','addon'],['auto-bar','automation'],['comm-bar','commissioning']].forEach(([id, key]) => $(id).style.flex = String(v[key] / v.central));
    $('quoteResult').hidden = !(quote > 0);
    if (quote > 0) $('quotePer').textContent = '₹'+fmt(quote*100000/homes)+' per home · ₹'+fmt(quote,1)+' lakh total';
  }
  document.querySelectorAll('input[name="setup"]').forEach(radio => radio.addEventListener('change', () => {
    const setup = SETUPS[selectedSetup()];
    $('operator').value = setup.operator; $('maint').value = setup.maint;
    updateEstimate();
  }));
  ['families','people','spend','quote','hrt','rate','operator','maint','tariff'].forEach(id => $(id).addEventListener('input', updateEstimate));
  updateEstimate();
  const diagram = $('loop-diagram');
  const paths = [...diagram.querySelectorAll('.flow-paths path')];
  const buttons = [...document.querySelectorAll('[data-flow]')];
  const descriptions = {
    collect:'Residents segregate food waste at home and housekeeping staff collect it daily. At the plant it is weighed, checked and shredded, then mixed with thickened STP sludge into a consistent feed.',
    digest:'Microorganisms break down suitable organic feed without oxygen. The reactor design must maintain the loading, mixing and temperature conditions needed for dependable operation.',
    recover:'Clean captured biogas for generator use. Separate and treat digestate for a suitable outlet, and include the liquid return load in the STP design. Measure usable outputs and operating costs.'
  };
  let pathAnimations = [];
  function trace(stage) {
    pathAnimations.forEach(a => a.cancel()); pathAnimations = [];
    if (reduced.matches || !Element.prototype.animate) return;
    paths.filter(p => !stage || p.dataset.route.split(' ').includes(stage)).forEach((p, index) => {
      pathAnimations.push(p.animate([{strokeDashoffset:1,opacity:.2},{strokeDashoffset:0,opacity:1}],{duration:1100,delay:index*150,easing:ease}));
    });
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    const stage = button.dataset.flow;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    diagram.classList.add('has-focus');
    if (diagram.scrollWidth > diagram.clientWidth) diagram.scrollTo({left:({collect:0,digest:.5,recover:1}[stage])*(diagram.scrollWidth-diagram.clientWidth),behavior:reduced.matches?'auto':'smooth'});
    diagram.querySelectorAll('[data-scene]').forEach(g => g.classList.toggle('is-active',g.dataset.scene === stage));
    $('flow-copy').textContent = descriptions[stage];
    trace(stage);
  }));
  $('replay').addEventListener('click', () => {
    diagram.classList.remove('has-focus'); buttons.forEach(b => b.setAttribute('aria-pressed','false'));
    $('flow-copy').textContent = 'Follow the complete loop: collect suitable sludge and food waste, digest the prepared feed, and recover energy and treated material. Sewage treatment continues throughout.';
    trace();
  });
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal.unobserve(entry.target);
      if (!reduced.matches && entry.target.animate) entry.target.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:ease});
    }),{threshold:.15});
    document.querySelectorAll('.section-head h2,.value-strip article,.technology-list article,.delivery-list li,.operations,.impact-grid article,.film-section>div:first-child').forEach(el => reveal.observe(el));
    const flowObserver = new IntersectionObserver(entries => { if(entries.some(e => e.isIntersecting)){trace();flowObserver.disconnect();} },{threshold:.35});
    flowObserver.observe(diagram);
  }
  reduced.addEventListener('change', event => { if(event.matches) document.getAnimations?.().forEach(animation => animation.cancel()); });
})();
