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
  function calculate(homes, persons) {
    const population = homes * persons;
    const mld = population * 100 / 1e6;
    const food = population * .15;
    const gas = population * 9 * .55 / 1000 + food * .12;
    const kwh = gas * 6 * .32;
    const scale = Math.max(.55, Math.pow(mld / 1.5, -.25));
    const core = mld * 55 * scale;
    const addon = (food * 3000 + homes / 100 * 5 * 2000) / 100000;
    return {mld, food, gas, kwh, core, addon, central:core + addon, low:mld * 40 * scale + addon * .7, high:mld * 70 * scale + addon * 1.3, annual:kwh * 365 * 8 / 100000 + mld * (.67 + .43)};
  }
  function updateEstimate() {
    const homes = Number($('families').value), persons = Number($('people').value), quote = Number($('quote').value);
    let error = '';
    if (!Number.isInteger(homes) || homes < 1 || homes > 100000) error = 'Enter a whole number of homes between 1 and 1,00,000.';
    else if (!Number.isFinite(persons) || persons < 1 || persons > 20) error = 'Enter a household size between 1 and 20 people.';
    else if (!Number.isFinite(quote) || quote < 0) error = 'Enter a valid non-negative quote in ₹ lakh.';
    $('input-error').textContent = error;
    if (error) return;
    const v = calculate(homes, persons);
    $('scale-note').hidden = homes >= 1000 && homes <= 10000;
    const values = {central:'₹'+fmt(v.central,1), low:'₹'+fmt(v.low,1)+' L', high:'₹'+fmt(v.high,1)+' L', 'core-cost':'₹'+fmt(v.core,1)+' lakh', 'addon-cost':'₹'+fmt(v.addon,1)+' lakh', perhome:'₹'+fmt(v.central*100000/homes), annual:'₹'+fmt(v.annual,2)+' L/year', cap:fmt(v.mld,3)+' MLD', gas:fmt(v.gas,1)+' m³/day', power:fmt(v.kwh)+' kWh/day', food:fmt(v.food)+' kg/day'};
    Object.entries(values).forEach(([id, value]) => $(id).textContent = value);
    $('core-bar').style.flex = String(v.core / v.central);
    $('addon-bar').style.flex = String(v.addon / v.central);
    $('quoteResult').hidden = !(quote > 0);
    if (quote > 0) $('quotePer').textContent = '₹'+fmt(quote*100000/homes)+' per home · ₹'+fmt(quote,1)+' lakh total';
  }
  ['families','people','quote'].forEach(id => $(id).addEventListener('input', updateEstimate));
  updateEstimate();
  const diagram = $('loop-diagram');
  const paths = [...diagram.querySelectorAll('.flow-paths path')];
  const buttons = [...document.querySelectorAll('[data-flow]')];
  const descriptions = {
    collect:'Characterise the STP sludge and establish a dependable stream of segregated food waste. Remove contaminants and prepare a consistent feed before digestion.',
    digest:'Microorganisms break down suitable organic feed without oxygen. The reactor design must maintain the loading, mixing and temperature conditions needed for dependable operation.',
    recover:'Clean captured biogas for generator use. Separate and treat digestate for a suitable outlet, and include the liquid return load in the STP design. Measure usable outputs and operating costs.'
  };
  let pathAnimations = [];
  function trace(stage) {
    pathAnimations.forEach(a => a.cancel()); pathAnimations = [];
    if (reduced.matches || !Element.prototype.animate) return;
    paths.filter(p => !stage || p.dataset.route === stage).forEach((p, index) => {
      pathAnimations.push(p.animate([{strokeDashoffset:1,opacity:.2},{strokeDashoffset:0,opacity:1}],{duration:1100,delay:index*150,easing:ease}));
    });
  }
  buttons.forEach(button => button.addEventListener('click', event => {
    const stage = button.dataset.flow;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    diagram.classList.add('has-focus');
    if (diagram.scrollWidth > diagram.clientWidth) diagram.scrollTo({left:({collect:0,digest:.5,recover:1}[stage])*(diagram.scrollWidth-diagram.clientWidth),behavior:reduced.matches?'auto':'smooth'});
    diagram.querySelectorAll('[data-scene]').forEach(g => g.classList.toggle('is-active',g.dataset.scene === stage));
    $('flow-copy').textContent = descriptions[stage];
    if (event.detail > 0) trace(stage);
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
