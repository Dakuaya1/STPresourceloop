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
  // Planning defaults per setup: automation adder (₹ lakh + share of equipment), extra operator ₹/month at up to 1 t/day of organics, maintenance % of equipment cost/year, plant's own electricity use.
  const SETUPS = {
    manual:{name:'Manual', autoFixed:0, autoPct:0, operator:12000, maint:2, parasitic:.10},
    hybrid:{name:'Hybrid', autoFixed:6, autoPct:.08, operator:6000, maint:2.5, parasitic:.12},
    automated:{name:'Automated', autoFixed:15, autoPct:.20, operator:3000, maint:3.5, parasitic:.15}
  };
  // Recommended improvement package: thicker sludge, outside organic waste at 50% of residents' food waste with a ₹2/kg fee, compost sold at ₹2/kg.
  const PACKAGE = {thick:true, outsideShare:.5, fee:2, compostPrice:2};
  const operatorDefault = (setup, organics) => Math.round(SETUPS[setup].operator * Math.pow(Math.max(1, organics / 1000), .8) / 500) * 500;
  // All money in ₹ lakh. Feed: STP sludge + residents' food waste + outside organic waste (digested), green waste (composted).
  function calculate(homes, persons, o) {
    const setup = SETUPS[o.setup];
    const population = homes * persons;
    const mld = population * 100 / 1e6;
    const food = population * .15, green = homes / 100 * 5, outside = o.outside || 0, organics = food + outside;
    const maint = o.maint ?? setup.maint, operator = o.operator ?? operatorDefault(o.setup, organics);
    const gas = population * 9 * .55 / 1000 + organics * .12;
    const kwh = gas * 6 * .32 * (1 - setup.parasitic);
    // Digester sized from retention time: thickened sludge (0.035 kg DS/person/day at 5%, or 8% with better thickening) plus food slurry (~1 L/kg).
    const sludgeDS = population * .035;
    const feedM3 = sludgeDS / (o.thick ? .08 : .05) / 1000 + organics / 1000;
    const digesterM3 = feedM3 * o.hrt * 1.15, postM3 = feedM3 * 10;
    const tanks = Math.max(0, digesterM3 + postM3 * .5 - mld * 50) * o.rate / 100000;
    const scale = Math.max(.55, Math.pow(mld / 1.5, -.25));
    const core = mld * 55 * scale;
    const prepRate = 3000 * Math.pow(Math.max(1, organics / 1000), -.15);
    const addon = (organics * prepRate + green * 2000) / 100000;
    const equipment = core + tanks + addon;
    const automation = setup.autoFixed + setup.autoPct * equipment;
    const commissioning = digesterM3 * .2 * 1000 / 100000 + .03 * (equipment + automation);
    const central = equipment + automation + commissioning;
    const low = mld * 40 * scale + tanks * .6 + addon * .7 + automation * .8 + commissioning;
    const high = mld * 70 * scale + tanks * 1.4 + addon * 1.3 + automation * 1.25 + commissioning;
    // Compost: solids left after digestion (~55%) at 35% moisture, plus green-waste compost at 35% yield.
    const compost = (sludgeDS + organics * .25) * .55 / .65 + green * .35;
    const compostPrice = o.compostPrice || 0, fee = o.fee || 0;
    const power = kwh * 365 * o.tariff / 100000, disposal = o.spend === null ? mld * .67 : o.spend * 12 / 100000;
    const fertilizer = compostPrice > 0 ? 0 : mld * .43, compostSales = compost * compostPrice * 365 / 100000, tipping = outside * fee * 365 / 100000;
    const staff = operator * 12 / 100000, upkeep = maint / 100 * (core + addon + automation) + .005 * tanks, lab = .5 + gas * 365 / 100000;
    const annual = power + disposal + fertilizer + compostSales + tipping, om = staff + upkeep + lab, net = annual - om;
    // Monthly disposal spend at which the project pays back in 10 years.
    const breakeven = Math.max(0, central / 10 + om - (annual - disposal)) * 100000 / 12;
    return {mld, food, green, outside, organics, gas, kwh, feedM3, digesterM3, postM3, compost, core, tanks, addon, automation, commissioning, central, low, high, power, disposal, fertilizer, compostSales, tipping, operator, staff, upkeep, lab, annual, om, net, payback:net > 0 ? central / net : Infinity, breakeven};
  }
  const lakh = value => (value < 0 ? '−' : '') + (Math.abs(value) >= 100 ? '₹'+fmt(Math.abs(value)/100,2)+' crore' : '₹'+fmt(Math.abs(value),2)+' lakh');
  const years = value => !Number.isFinite(value) ? 'No payback' : value > 30 ? 'Over 30 years' : fmt(value,1)+' years';
  const perFamily = (value, homes) => '₹'+fmt(value * 100000 / homes / 12);
  const num = id => { const t = $(id).value.trim(); return t === '' ? NaN : Number(t); };
  const selectedSetup = () => document.querySelector('input[name="setup"]:checked').value;
  let operatorEdited = false;
  function updateEstimate() {
    const homes = Number($('families').value), persons = Number($('people').value), quote = Number($('quote').value), spendText = $('spend').value.trim(), spend = spendText === '' ? null : Number(spendText);
    const setupKey = selectedSetup(), outside = num('outside');
    if (!operatorEdited && homes > 0 && persons > 0 && outside >= 0) $('operator').value = operatorDefault(setupKey, homes * persons * .15 + outside);
    const o = {setup:setupKey, spend, hrt:num('hrt'), rate:num('rate'), operator:num('operator'), maint:num('maint'), tariff:num('tariff'), thick:$('thick').checked, outside, fee:num('fee'), compostPrice:num('compost-price')};
    let error = '';
    if (!Number.isInteger(homes) || homes < 1 || homes > 100000) error = 'Enter a whole number of homes between 1 and 1,00,000.';
    else if (!Number.isFinite(persons) || persons < 1 || persons > 20) error = 'Enter a household size between 1 and 20 people.';
    else if (spend !== null && (!Number.isFinite(spend) || spend < 0)) error = 'Enter a valid non-negative monthly disposal spend in ₹.';
    else if (!Number.isFinite(quote) || quote < 0) error = 'Enter a valid non-negative quote in ₹ lakh.';
    else if (!(o.outside >= 0) || !(o.fee >= 0) || !(o.compostPrice >= 0)) error = 'Check the improvement inputs: values must be zero or more.';
    else if (!(o.hrt >= 10 && o.hrt <= 60)) error = 'Enter a retention time between 10 and 60 days.';
    else if (!(o.rate >= 0) || !(o.operator >= 0) || !(o.maint >= 0 && o.maint <= 20) || !(o.tariff >= 0)) error = 'Check the advanced assumptions: values must be non-negative, and maintenance at most 20%.';
    $('input-error').textContent = error;
    if (error) return;
    const v = calculate(homes, persons, o);
    $('scale-note').hidden = homes >= 1000 && homes <= 10000;
    const extras = [v.tipping > 0 && 'outside-waste fees '+lakh(v.tipping), v.compostSales > 0 ? 'compost sales '+lakh(v.compostSales) : 'fertilizer '+lakh(v.fertilizer)].filter(Boolean).join(' · ');
    const values = {
      'setup-name':SETUPS[setupKey].name.toUpperCase()+' SETUP',
      'feed-basis':'Includes '+fmt(homes)+' families × '+fmt(persons,1)+' people: STP sludge, '+fmt(v.food)+' kg of food waste'+(v.outside > 0 ? ', '+fmt(v.outside)+' kg of outside organic waste' : '')+' and '+fmt(v.green)+' kg of green waste a day.',
      central:'₹'+(v.central >= 100 ? fmt(v.central/100,2) : fmt(v.central,1)), 'central-unit':v.central >= 100 ? 'crore' : 'lakh', low:'₹'+fmt(v.low,1)+' L', high:'₹'+fmt(v.high,1)+' L',
      'core-cost':lakh(v.core), 'tank-cost':lakh(v.tanks), 'addon-cost':lakh(v.addon), 'auto-cost':lakh(v.automation), 'comm-cost':lakh(v.commissioning),
      perhome:'₹'+fmt(v.central*100000/homes), annual:lakh(v.annual), om:lakh(v.om), net:lakh(v.net), payback:years(v.payback), lifetime:lakh(v.net*20),
      'annual-split':'Value per year: electricity '+lakh(v.power)+' · avoided disposal '+lakh(v.disposal)+(spend === null ? ' (workbook estimate)' : '')+' · '+extras,
      'om-split':'Running cost per year: operator '+lakh(v.staff)+' · maintenance & spares '+lakh(v.upkeep)+' · lab tests & consumables '+lakh(v.lab),
      'per-family':'Per family per month: value '+perFamily(v.annual, homes)+' · running cost '+perFamily(v.om, homes)+' · left over '+perFamily(v.net, homes),
      breakeven:v.breakeven > 0 ? 'For a 10-year payback, the society’s current disposal spend would need to be about ₹'+fmt(Math.ceil(v.breakeven/1000)*1000)+' per month.' : 'At this disposal spend, the project pays back within 10 years.',
      cap:fmt(v.mld,3)+' MLD', feed:fmt(v.feedM3,1)+' m³/day', volume:fmt(v.digesterM3)+' m³ + '+fmt(v.postM3)+' m³', gas:fmt(v.gas,1)+' m³/day', power:fmt(v.kwh)+' kWh/day', food:fmt(v.organics)+' kg/day', green:fmt(v.green)+' kg/day', 'compost-out':fmt(v.compost)+' kg/day'
    };
    Object.entries(values).forEach(([id, value]) => $(id).textContent = value);
    $('setup-rows').innerHTML = Object.entries(SETUPS).map(([key, setup]) => {
      const s = calculate(homes, persons, {...o, setup:key, operator:undefined, maint:undefined});
      const figure = $('model-'+key); if (figure) figure.textContent = 'About '+lakh(s.central)+' for '+fmt(homes)+' homes · running cost '+lakh(s.om)+' a year';
      return `<tr${key === setupKey ? ' class="is-current"' : ''}><th scope="row">${setup.name}</th><td>${lakh(s.central)}</td><td>₹${fmt(s.central*100000/homes)}</td><td>${lakh(s.annual)}</td><td>${lakh(s.om)}</td><td>${lakh(s.net)}</td><td>${years(s.payback)}</td></tr>`;
    }).join('');
    // Improvement steps: cumulative, from the plain design to the full recommended package, for the selected setup.
    const base = {...o, operator:undefined, maint:undefined, thick:false, outside:0, fee:0, compostPrice:0};
    const steps = [
      ['Starting design', base],
      ['+ Thicken sludge to 8% solids', {...base, thick:true}],
      ['+ Take in outside organic waste ('+fmt(v.food * PACKAGE.outsideShare)+' kg/day at ₹'+PACKAGE.fee+'/kg)', {...base, thick:true, outside:v.food * PACKAGE.outsideShare, fee:PACKAGE.fee}],
      ['+ Sell compost at ₹'+PACKAGE.compostPrice+'/kg', {...base, thick:true, outside:v.food * PACKAGE.outsideShare, fee:PACKAGE.fee, compostPrice:PACKAGE.compostPrice}]
    ];
    $('improve-rows').innerHTML = steps.map(([label, opts], i) => {
      const s = calculate(homes, persons, opts);
      return `<tr${i === steps.length - 1 ? ' class="is-current"' : ''}><th scope="row">${label}</th><td>${lakh(s.central)}</td><td>${lakh(s.annual)}</td><td>${lakh(s.om)}</td><td>${lakh(s.net)}</td><td>${years(s.payback)}</td></tr>`;
    }).join('');
    [['core-bar','core'],['tank-bar','tanks'],['addon-bar','addon'],['auto-bar','automation'],['comm-bar','commissioning']].forEach(([id, key]) => $(id).style.flex = String(v[key] / v.central));
    $('quoteResult').hidden = !(quote > 0);
    if (quote > 0) $('quotePer').textContent = '₹'+fmt(quote*100000/homes)+' per home · ₹'+fmt(quote,1)+' lakh total';
  }
  document.querySelectorAll('input[name="setup"]').forEach(radio => radio.addEventListener('change', () => {
    operatorEdited = false; $('maint').value = SETUPS[selectedSetup()].maint;
    updateEstimate();
  }));
  $('operator').addEventListener('input', () => { operatorEdited = true; });
  $('apply-package').addEventListener('click', () => {
    $('thick').checked = PACKAGE.thick;
    $('outside').value = Math.round(Number($('families').value) * Number($('people').value) * .15 * PACKAGE.outsideShare);
    $('fee').value = PACKAGE.fee; $('compost-price').value = PACKAGE.compostPrice;
    updateEstimate();
    $('calculator').scrollIntoView({behavior:reduced.matches ? 'auto' : 'smooth'});
  });
  ['families','people','spend','quote','hrt','rate','operator','maint','tariff','outside','fee','compost-price'].forEach(id => $(id).addEventListener('input', updateEstimate));
  $('thick').addEventListener('change', updateEstimate);
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
