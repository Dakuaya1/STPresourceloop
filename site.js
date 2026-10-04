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
  const operatorDefault = (setup, organics) => Math.round(SETUPS[setup].operator * Math.pow(Math.max(1, organics / 1000), .8) / 500) * 500;
  // All money in ₹ lakh. Feed: STP sludge + residents' food waste + outside organic waste (digested), green waste (composted). Returns cost, running cost and daily outputs.
  function calculate(homes, persons, o) {
    const setup = SETUPS[o.setup];
    const population = homes * persons;
    const mld = population * 100 / 1e6;
    const food = population * .15, green = homes / 100 * 5, outside = o.outside || 0, organics = food + outside;
    const maint = o.maint ?? setup.maint, operator = o.operator ?? operatorDefault(o.setup, organics);
    // Field-proven output from Indian plants is ~45% of design yield (≈0.09 kWh net per kg of food waste).
    const gas = (population * 9 * .55 / 1000 + organics * .12) * (o.perf === 'design' ? 1 : .45);
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
    const staff = operator * 12 / 100000, upkeep = maint / 100 * (core + addon + automation) + .005 * tanks, lab = .5 + gas * 365 / 100000;
    const om = staff + upkeep + lab;
    return {mld, food, green, outside, organics, gas, kwh, feedM3, digesterM3, postM3, compost, core, tanks, addon, automation, commissioning, central, low, high, operator, staff, upkeep, lab, om};
  }
  const lakh = value => (value < 0 ? '−' : '') + (Math.abs(value) >= 100 ? '₹'+fmt(Math.abs(value)/100,2)+' crore' : '₹'+fmt(Math.abs(value),2)+' lakh');
  const perFamily = (value, homes) => (value < 0 ? '−' : '')+'₹'+fmt(Math.abs(value) * 100000 / homes / 12);
  const num = id => { const t = $(id).value.trim(); return t === '' ? NaN : Number(t); };
  const selectedSetup = () => document.querySelector('input[name="setup"]:checked').value;
  const selectedPerf = () => document.querySelector('input[name="perf"]:checked').value;
  let operatorEdited = false, shownCentral = null, tweenFrame = 0;
  // Animate the big cost figure between values (in ₹ lakh); falls back to the final text.
  function tweenCentral(target, finalText) {
    const el = $('central');
    cancelAnimationFrame(tweenFrame);
    if (shownCentral === null || reduced.matches) { el.textContent = finalText; shownCentral = target; return; }
    const from = shownCentral, start = performance.now(), crore = target >= 100;
    const step = now => {
      const t = Math.min(1, (now - start) / 450), value = from + (target - from) * (1 - Math.pow(1 - t, 3));
      el.textContent = t < 1 ? '₹'+(crore ? fmt(value/100,2) : fmt(value,1)) : finalText;
      if (t < 1) tweenFrame = requestAnimationFrame(step);
    };
    shownCentral = target;
    tweenFrame = requestAnimationFrame(step);
  }
  function updateEstimate() {
    const homes = Number($('families').value), persons = Number($('people').value), quote = Number($('quote').value);
    const setupKey = selectedSetup(), outside = num('outside');
    if (!operatorEdited && homes > 0 && persons > 0 && outside >= 0) $('operator').value = operatorDefault(setupKey, homes * persons * .15 + outside);
    const o = {setup:setupKey, hrt:num('hrt'), rate:num('rate'), operator:num('operator'), maint:num('maint'), thick:$('thick').checked, outside, perf:selectedPerf()};
    let error = '';
    if (!Number.isInteger(homes) || homes < 1 || homes > 100000) error = 'Enter a whole number of homes between 1 and 1,00,000.';
    else if (!Number.isFinite(persons) || persons < 1 || persons > 20) error = 'Enter a household size between 1 and 20 people.';
    else if (!Number.isFinite(quote) || quote < 0) error = 'Enter a valid non-negative quote in ₹ lakh.';
    else if (!(o.outside >= 0)) error = 'Enter zero or more kg of outside organic waste.';
    else if (!(o.hrt >= 10 && o.hrt <= 60)) error = 'Enter a retention time between 10 and 60 days.';
    else if (!(o.rate >= 0) || !(o.operator >= 0) || !(o.maint >= 0 && o.maint <= 20)) error = 'Check the advanced assumptions: values must be non-negative, and maintenance at most 20%.';
    $('input-error').textContent = error;
    if (error) return;
    const v = calculate(homes, persons, o);
    $('scale-note').hidden = homes >= 1000 && homes <= 10000;
    const values = {
      'setup-name':SETUPS[setupKey].name.toUpperCase()+' SETUP',
      'feed-basis':'Includes '+fmt(homes)+' families × '+fmt(persons,1)+' people: STP sludge, '+fmt(v.food)+' kg of food waste'+(v.outside > 0 ? ', '+fmt(v.outside)+' kg of outside organic waste' : '')+' and '+fmt(v.green)+' kg of green waste a day.',
      'central-unit':v.central >= 100 ? 'crore' : 'lakh', low:lakh(v.low), high:lakh(v.high),
      'core-cost':lakh(v.core), 'tank-cost':lakh(v.tanks), 'addon-cost':lakh(v.addon), 'auto-cost':lakh(v.automation), 'comm-cost':lakh(v.commissioning),
      perhome:'₹'+fmt(v.central*100000/homes), om:lakh(v.om), 'om-family':perFamily(v.om, homes),
      'out-gas':fmt(v.gas)+' m³', 'out-power':fmt(v.kwh)+' kWh', 'out-compost':fmt(v.compost)+' kg',
      'om-split':'Running cost per year: operator '+lakh(v.staff)+' · maintenance & spares '+lakh(v.upkeep)+' · lab tests & consumables '+lakh(v.lab),
      cap:fmt(v.mld,3)+' MLD', feed:fmt(v.feedM3,1)+' m³/day', volume:fmt(v.digesterM3)+' m³ + '+fmt(v.postM3)+' m³', gas:fmt(v.gas,1)+' m³/day', power:fmt(v.kwh)+' kWh/day', food:fmt(v.organics)+' kg/day', green:fmt(v.green)+' kg/day', 'compost-out':fmt(v.compost)+' kg/day'
    };
    Object.entries(values).forEach(([id, value]) => $(id).textContent = value);
    tweenCentral(v.central, '₹'+(v.central >= 100 ? fmt(v.central/100,2) : fmt(v.central,1)));
    $('setup-rows').innerHTML = Object.entries(SETUPS).map(([key, setup]) => {
      const s = calculate(homes, persons, {...o, setup:key, operator:undefined, maint:undefined});
      const figure = $('model-'+key); if (figure) figure.textContent = 'About '+lakh(s.central)+' for '+fmt(homes)+' homes · running cost '+lakh(s.om)+' a year';
      return `<tr${key === setupKey ? ' class="is-current"' : ''}><th scope="row">${setup.name}</th><td>${lakh(s.central)}</td><td>₹${fmt(s.central*100000/homes)}</td><td>${lakh(s.om)}</td><td>${perFamily(s.om, homes)}</td></tr>`;
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
  ['families','people','quote','hrt','rate','operator','maint','outside'].forEach(id => $(id).addEventListener('input', updateEstimate));
  $('thick').addEventListener('change', updateEstimate);
  document.querySelectorAll('input[name="perf"]').forEach(radio => radio.addEventListener('change', updateEstimate));
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
  // Count a number up from zero once it scrolls into view.
  function countUp(el) {
    const target = Number(el.dataset.count);
    if (reduced.matches || !target) { el.textContent = fmt(target); return; }
    const start = performance.now(), duration = 1400;
    const step = now => {
      const t = Math.min(1, (now - start) / duration), eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal.unobserve(entry.target);
      if (reduced.matches || !entry.target.animate) return;
      // Stagger siblings in the same row or grid.
      const index = [...entry.target.parentElement.children].indexOf(entry.target) % 4;
      entry.target.animate([{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,delay:index * 90,easing:ease,fill:'backwards'});
    }),{threshold:.12});
    document.querySelectorAll('.pillar,.proof-card,.detail-tile,.section-head h2,.section-head>div>p,.value-strip article,.technology-list article,.delivery-list li,.operations,.impact-grid article,.mandate,.proof-grid article,.field-lesson,.run-flow li,.models article,.stats>div,.comparison article,.faq-list details,.assessment-list>div,.levers>div').forEach(el => reveal.observe(el));
    const counters = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      counters.unobserve(entry.target);
      countUp(entry.target);
    }),{threshold:.6});
    document.querySelectorAll('[data-count]').forEach(el => counters.observe(el));
    const flowObserver = new IntersectionObserver(entries => { if(entries.some(e => e.isIntersecting)){trace();flowObserver.disconnect();} },{threshold:.35});
    flowObserver.observe(diagram);
  }
  // Reading-progress bar.
  const bar = $('progress-bar');
  let ticking = false;
  const setProgress = () => { const max = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX('+(max > 0 ? scrollY / max : 0)+')'; ticking = false; };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(setProgress); } }, {passive:true});
  setProgress();
  // The hero loop uses SVG animation, which CSS cannot stop; pause it for reduced motion.
  const loop = $('hero-loop');
  const syncLoop = () => { if (!loop?.pauseAnimations) return; reduced.matches ? loop.pauseAnimations() : loop.unpauseAnimations(); };
  syncLoop();
  reduced.addEventListener('change', event => { syncLoop(); if(event.matches) document.getAnimations?.().forEach(animation => animation.cancel()); });

  // "Why" cards expand in place.
  document.querySelectorAll('.pillar-toggle').forEach(button => button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true', body = $(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(open)); body.hidden = !open;
    button.closest('.pillar').classList.toggle('is-open', open);
    if (open && !reduced.matches && body.animate) body.animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'none'}],{duration:350,easing:ease});
  }));
  // Live resource figures for 1,000 families at field-proven output.
  const ref = calculate(1000, 4.5, {setup:'hybrid', hrt:30, rate:15000, thick:false, outside:0, perf:'field'});
  $('res-gas').textContent = fmt(ref.gas)+' m³'; $('res-power').textContent = fmt(ref.kwh)+' kWh'; $('res-compost').textContent = fmt(ref.compost)+' kg';
  // Clickable stages on the hero loop.
  const stages = {
    homes:['Homes','Residents keep food waste separate in their kitchens; housekeeping staff collect it on their daily round.'],
    sort:['Sort and shred','Bins are weighed and checked, then food waste is shredded and mixed with thickened STP sludge.'],
    digester:['Digester','A sealed tank holds the mix for 25–30 days while bacteria turn it into biogas.'],
    energy:['Energy','Cleaned biogas runs a generator for STP pumps, lighting and other common services.'],
    compost:['Compost','What remains is dewatered, composted with garden waste and tested before reuse.']
  };
  const nodes = [...document.querySelectorAll('.loop-node[data-node]')];
  const showStage = node => {
    nodes.forEach(n => n.classList.toggle('is-active', n === node));
    const [title, text] = stages[node.dataset.node];
    $('loop-info').innerHTML = '<strong>'+title+'</strong> '+text;
  };
  nodes.forEach(node => {
    node.addEventListener('click', () => showStage(node));
    node.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showStage(node); } });
  });
  // India / world tabs on the proven section.
  const tabs = [...document.querySelectorAll('[data-region]')];
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    document.querySelectorAll('[data-region-panel]').forEach(panel => { panel.hidden = panel.dataset.regionPanel !== tab.dataset.region; });
  }));
  // Slide-in detail panels.
  const openPanel = dialog => { if (!dialog.open) { dialog.showModal(); dialog.querySelector('.drawer-body').scrollTop = 0; } };
  document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => openPanel($(button.dataset.dialog))));
  document.querySelectorAll('dialog.drawer').forEach(dialog => {
    dialog.querySelector('.drawer-close').addEventListener('click', () => dialog.close());
    // Click on the dimmed backdrop closes the panel.
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    // In-page links inside a panel close it first, so the target is visible.
    dialog.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => dialog.close()));
  });
  // Old links to sections that now live in a panel open that panel.
  const openFromHash = () => {
    let target = null;
    try { target = location.hash.length > 1 ? document.querySelector(location.hash) : null; } catch { return; }
    const dialog = target?.closest('dialog');
    if (dialog) openPanel(dialog);
  };
  addEventListener('hashchange', openFromHash);
  openFromHash();
})();
