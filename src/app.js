/* ---------- state ---------- */
function freshState() {
  return {
    persona: 'cfo', view: 'home', sel: null, queueTab: 'needs', navOpen: false, drawer: null, coach: null,
    props: initialProps(), signed: {}, rejected: {}, vendorVerified: false,
    ic: { v: 1, busy: false, expert: null, expertWho: 'rahul', thread: [{ who: 'agent', t: '02:14', text: 'I drafted this at cost plus 8%, from the signed 2023 agreement. Your 2026 policy says 15%, so one of your checks fails. Tell me which markup to use, or ask an expert.' }] },
    acctLine: 2500, promoted: false, promotedAt: null,
    gst: { trial: null, installed: false, done: 0, at: null },
    branch: { status: null, done: 0 },
    xsel: null, xstreamed: {}, locked: false, fresh: null,
    exch: { ctx: false },
    dev: { sig: 'gst', gen: false, genBusy: false, tab: 'yaml', evalRun: 0, evalBusy: false, evSteps: [], evDone: 0, published: false, pubBusy: false, pubDone: 0, price: 'outcome', assured: true },
    guide: {},
    ask: { msgs: [], busy: false }
  };
}
let S = freshState();
let GEN = 0, XTOK = 0, MODAL_LOCK = false, LAST_FOCUS = null;
let SAMPLE = null, SAMPLE_OFF = false;

/* ---------- rendering ---------- */
const VIEWS = { home: vHome, queue: vQueue, proposal: vProposal, close: vClose, authority: vAuthority, explain: vExplain, branches: vBranches, exchange: vExchange, signals: vSignals, build: vBuild, test: vTest, publish: vPublish, earnings: vEarnings };
function renderChrome() {
  const sd = $('#side'), tp = $('#top');
  if (sd) sd.innerHTML = side();
  if (tp) tp.innerHTML = topbar();
}
function renderMain(keepScroll) {
  const m = $('#main'); if (!m) return;
  const y = m.scrollTop;
  m.innerHTML = `<div class="page">${coachBar()}${(VIEWS[S.view] || vHome)()}</div>`;
  if (keepScroll) m.scrollTop = y;
  afterRender();
}
function render() { renderChrome(); renderMain(); renderGuide(); }
function afterRender() {
  const fresh = $('.sig-ink.write');
  if (fresh && fresh.scrollIntoView) setTimeout(() => fresh.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' }), 30);
  Object.values(S.signed).forEach(s => { s.fresh = false; });
  S.fresh = null;
  if (S.view === 'proposal' && S.sel === 'IC-0931') markDone('read');
  if (S.view === 'signals') markDone('signals');
  if (S.view === 'earnings' && S.dev.published) markDone('publish');
  if (S.view === 'explain' && S.xsel) startExplain(S.xsel);
}
const refreshIfOn = (view, sel) => { if (S.view === view && (!sel || S.sel === sel)) renderMain(true); };
function go(v) {
  if (S.view === 'home' && v !== 'home') markDone('brief');
  S.view = v; S.navOpen = false;
  const app = $('#app-root'); if (app) app.classList.remove('nav-open');
  renderChrome(); renderMain();
  const m = $('#main'); if (m) { m.scrollTop = 0; try { m.focus({ preventScroll: true }); } catch (e) { } }
}
function markDone(id) {
  if (S.guide[id]) return;
  S.guide[id] = true;
  if (S.coach === id) {
    const i = GUIDE.findIndex(g => g.id === id);
    const nx = GUIDE.slice(i + 1).find(g => !S.guide[g.id]) || GUIDE.find(g => !S.guide[g.id]);
    S.coach = nx ? nx.id : 'end';
  }
  const tp = $('#top'); if (tp) tp.innerHTML = topbar();
  renderGuide();
  const c = $('.coach');
  if (c) c.outerHTML = coachBar();
}
function toast(msg) {
  const box = $('#toasts'); if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = `${ic('check', 16)}<span>${msg}</span>`;
  box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 4600);
}
function openModal(html, wide, locked) {
  const root = $('#modal'); if (!root) return;
  if (!root.classList.contains('open')) LAST_FOCUS = document.activeElement;
  MODAL_LOCK = !!locked;
  root.innerHTML = `<div class="modal-scrim"${locked ? '' : ' data-act="closeModal"'}></div><div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="mh" tabindex="-1">${html}</div>`;
  root.classList.add('open');
  const d = $('.modal', root); if (d) d.focus();
}
function closeModal() {
  const root = $('#modal'); if (!root) return;
  root.classList.remove('open'); root.innerHTML = ''; MODAL_LOCK = false;
  if (LAST_FOCUS && document.body.contains(LAST_FOCUS)) { try { LAST_FOCUS.focus(); } catch (e) { } }
}
function openDrawer(name) {
  closeDrawers();
  const el = $('#' + name); if (!el) return;
  el.innerHTML = name === 'ask' ? askHTML() : guideHTML();
  el.classList.add('open'); S.drawer = name;
  setTimeout(() => { const f = name === 'ask' ? $('#ask-in') : $('.dr-h .icon-btn', el); if (f) f.focus(); }, 80);
}
function closeDrawers() { $$('.drawer.open').forEach(d => d.classList.remove('open')); S.drawer = null; }
function renderGuide() { const g = $('#guide'); if (g && g.classList.contains('open')) g.innerHTML = guideHTML(); }
function renderAsk() {
  const a = $('#ask'); if (!a || !a.classList.contains('open')) return;
  const inp = $('#ask-in'), val = inp ? inp.value : '', had = document.activeElement === inp;
  a.innerHTML = askHTML();
  const i2 = $('#ask-in'); if (i2) { i2.value = val; if (had) i2.focus(); }
  const log = $('#ask-log'); if (log) log.scrollTop = log.scrollHeight;
}

/* ---------- explain streaming ---------- */
async function startExplain(key) {
  const tok = ++XTOK, text = EXPLAIN[key].a;
  const el = $('#xp-text'); if (!el) return;
  const finish = () => {
    const e = $('#xp-text'); if (e) { e.textContent = text; e.classList.remove('caret'); }
    const more = $('#xp-more'); if (more) more.hidden = false;
    S.xstreamed[key] = true;
    if (key === 'uk') markDone('explain');
  };
  if (S.xstreamed[key] || RM) return finish();
  el.classList.add('caret');
  const words = text.split(' ');
  for (let i = 1; i <= words.length; i++) {
    if (tok !== XTOK) return;
    const e = $('#xp-text'); if (!e) return;
    e.textContent = words.slice(0, i).join(' ');
    await sleep(26);
  }
  if (tok === XTOK) finish();
}

/* ---------- flows ---------- */
async function icRevise(raw) {
  const t = String(raw || '').trim();
  if (!t || S.ic.busy || decided('IC-0931')) return;
  const gen = GEN;
  S.ic.thread.push({ who: 'maya', t: now(), text: t });
  if (S.ic.v === 2) {
    S.ic.thread.push({ who: 'agent', t: now(), text: 'Revision 2 is ready. I can explain any line, or you can sign it when you’re ready.' });
    return refreshIfOn('proposal', 'IC-0931');
  }
  const wants15 = /15|polic/i.test(t) && !/keep/i.test(t);
  if (!wants15) {
    const keep = /keep|8/i.test(t);
    S.ic.thread.push({ who: 'agent', t: now(), text: keep ? 'I can keep 8%, but your policy check will keep failing, so you’d have to sign with a written override. The cleaner fix is to use 15% and amend the contract to match. Want me to do that?' : 'I can change the markup, the period or the exchange rate. For example: “Use the 15% markup from the 2026 policy.”' });
    return refreshIfOn('proposal', 'IC-0931');
  }
  S.ic.busy = true;
  const m = { who: 'agent', t: now(), text: '', steps: ['Reading your 2026 transfer pricing policy, page 3', 'Recomputing the charge at cost plus 15%', 'Regenerating both entities’ entries and the eliminations', 'Drafting Amendment No. 2 to the services agreement', 'Running your checks again'], done: 0, working: true };
  S.ic.thread.push(m);
  refreshIfOn('proposal', 'IC-0931');
  const th = $('#ic-thread'); if (th && th.lastElementChild) th.lastElementChild.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' });
  for (let i = 1; i <= m.steps.length; i++) {
    await sleep(700); if (gen !== GEN) return;
    m.done = i;
    const el = $('#ic-thread'); if (el) el.innerHTML = threadHTML();
  }
  m.working = false;
  m.text = 'Done. The charge is now ₹10,81,00,000 ($1,225,624), up $74,604, and your policy check passes. The signed contract still says 8%, so I drafted Amendment No. 2 for both boards to sign. Indian tax authorities look closely at markups, so an expert opinion is worth a few minutes before you sign.';
  S.ic.v = 2; S.ic.busy = false;
  const p = prop('IC-0931'); p.usd = 1225624; p.amt = '$1,225,624'; p.why = 'Anything over $250,000 needs the CFO';
  S.fresh = 'Markup matches transfer pricing policy';
  markDone('revise');
  renderChrome(); refreshIfOn('proposal', 'IC-0931');
  toast('Revision 2 is ready. The policy check passes.');
}
async function expertSend() {
  if (S.ic.expert) return;
  const who = S.ic.expertWho || 'rahul', x = EXPERTS[who], gen = GEN;
  S.ic.expert = 'waiting'; closeModal();
  S.ic.thread.push({ who: 'maya', t: now(), text: `Sent to ${x.name} for review, with the agent’s brief and ${S.ic.v === 2 ? 5 : 4} documents.` });
  refreshIfOn('proposal', 'IC-0931');
  toast(`Sent to ${x.name}. ${x.sla}.`);
  await sleep(4200); if (gen !== GEN) return;
  S.ic.expert = 'replied';
  S.ic.thread.push({ who, t: now(), text: S.ic.v === 2 ? x.replyV2 : x.replyV1, tag: who === 'rahul' ? 'Intuit Expert' : 'Your CPA firm' });
  S.fresh = 'Compare with India’s safe-harbour option';
  markDone('expert');
  refreshIfOn('proposal', 'IC-0931');
  toast(`${x.name} replied on IC-0931 and added a check.`);
}
const SIGN_TOAST = {
  'IC-0931': 'Signed. Posted to both ledgers, with eliminations queued for consolidation.',
  'AP-5521': 'Signed as first approver. Leo Park must sign too before any money moves.',
  'TAX-044': 'Signed. The registration goes to the Texas Comptroller today.',
  'GST-0131': 'Signed. ₹16.4 lakh of input credit claimed. The 9 supplier reminders are on their way.'
};
function doSign(id) {
  const p = prop(id); if (!p || decided(id)) return;
  if (propChecks(p).some(c => c[0] === 'fail')) return;
  S.signed[id] = { t: now(), fresh: true };
  if (id === 'IC-0931') markDone('sign');
  renderChrome(); renderMain(true);
  toast(SIGN_TOAST[id] || 'Signed and posted. Reversible until September is locked.');
}
async function branchRun() {
  if (S.branch.status) return;
  const inp = $('#br-in'), t = inp ? inp.value : BR_DEFAULT;
  if (!/bengaluru|bangalore|india/i.test(t)) { toast('This demo models one what-if: moving 20 hires to Bengaluru.'); if (inp) inp.value = BR_DEFAULT; return; }
  const gen = GEN;
  S.branch.status = 'running'; S.branch.done = 0; renderMain(true);
  for (let i = 1; i <= BRANCH_STEPS.length; i++) {
    await sleep(650); if (gen !== GEN) return;
    S.branch.done = i;
    const el = $('#br-steps'); if (el) el.innerHTML = stepsHTML(BRANCH_STEPS, i, i < BRANCH_STEPS.length);
  }
  await sleep(300); if (gen !== GEN) return;
  S.branch.status = 'done';
  markDone('branch');
  refreshIfOn('branches');
  toast('Branch plan/fy27-bengaluru is ready. Actuals are untouched.');
}
async function gstTrial() {
  if (S.gst.installed) return;
  if (S.gst.trial === 'done') return openModal(trialModal(), true);
  if (S.gst.trial === 'running') return;
  const gen = GEN;
  S.gst.trial = 'running'; S.gst.done = 0;
  openModal(trialModal(), true, true);
  for (let i = 1; i <= TRIAL_STEPS.length; i++) {
    await sleep(i === 4 ? 1300 : 700); if (gen !== GEN) return;
    S.gst.done = i;
    const el = $('#tr-steps'); if (el) el.innerHTML = stepsHTML(TRIAL_STEPS, i, i < TRIAL_STEPS.length);
  }
  await sleep(350); if (gen !== GEN) return;
  S.gst.trial = 'done';
  openModal(trialModal(), true);
  refreshIfOn('exchange');
}
async function devGen() {
  if (S.dev.gen || S.dev.genBusy) return;
  const gen = GEN;
  S.dev.genBusy = true; S.dev.tab = 'yaml'; renderMain(true);
  const lines = MANIFEST.split('\n');
  for (let i = RM ? lines.length : 1; i <= lines.length; i++) {
    const el = $('#code'); if (el) el.innerHTML = hl(lines.slice(0, i).join('\n'), 'yaml');
    await sleep(45); if (gen !== GEN) return;
  }
  S.dev.genBusy = false; S.dev.gen = true;
  refreshIfOn('build');
  toast('Agent drafted: manifest, code and tools. Review them, then test.');
}
async function runEval(steps, run) {
  const gen = GEN;
  S.dev.evalBusy = true; S.dev.evSteps = steps; S.dev.evDone = 0; renderMain(true);
  for (let i = 1; i <= steps.length; i++) {
    await sleep(700); if (gen !== GEN) return;
    S.dev.evDone = i;
    const el = $('#ev-steps'); if (el) el.innerHTML = stepsHTML(steps, i, i < steps.length);
  }
  await sleep(250); if (gen !== GEN) return;
  S.dev.evalBusy = false; S.dev.evalRun = run;
  if (run === 2) markDone('build');
  refreshIfOn('test');
  toast(run === 1 ? 'Tests finished. One gate failed: correct matches at 94.2%.' : 'Every gate passed. GSTMatch can be listed as Verified.');
}
async function devPublish() {
  if (S.dev.published || S.dev.pubBusy || S.dev.evalRun !== 2) return;
  const gen = GEN;
  S.dev.pubBusy = true; S.dev.pubDone = 0; renderMain(true);
  for (let i = 1; i <= PUB_STEPS.length; i++) {
    await sleep(650); if (gen !== GEN) return;
    S.dev.pubDone = i;
    const el = $('#pub-steps'); if (el) el.innerHTML = stepsHTML(PUB_STEPS, i, i < PUB_STEPS.length);
  }
  S.dev.pubBusy = false; S.dev.published = true;
  refreshIfOn('publish');
  toast('GSTMatch is live as Verified. Customers find it inside their close.');
}

/* ---------- ask ---------- */
function askModeText() {
  return SAMPLE && !SAMPLE_OFF ? 'Answers are written live by Claude from this demo’s data, on your Claude account.' : 'Demo answers. Opened inside Claude, answers are written live.';
}
function aiData() {
  if (S.persona === 'dev') return {
    you: 'Riya Nair, founder of LedgerLoop (6 people, Bengaluru), an Intuit partner building GSTMatch, which matches Indian purchase bills to suppliers’ GSTR-2B filings',
    reads: 'graph.query and graph.subscribe over API and MCP. Reads are never metered',
    writes: 'Agents only submit proposals. The customer’s checks run on each one, and it posts only when a person signs or when it is within the trust line the agent earned at that company',
    tools: TOOLS.map(t => t[0] + ': ' + t[1]),
    testing: 'Three twin companies with known answers. Gates: correct matches at least 97%, wrong claims at most 0.5%, same answer on 8 repeat runs at least 98%, explanation clarity at least 4 of 5. Plus red-team tests',
    pricing: 'Per outcome ($0.12 per matched invoice, $49 monthly minimum) or subscription. The developer keeps 85%; Intuit keeps 15% for billing, tax and distribution',
    assurance: 'Intuit Assurance: customers pay 3% more and Intuit covers wrong-claim penalties up to $250,000 a year. Needs a wrong-claim rate of 0.5% or less',
    authority: 'Every agent starts with drafts only at each new customer. A strong record elsewhere can fast-track it: GSTMatch earns a ₹50,000 line after 30 signed drafts',
    distribution: 'Shown in context when an Intuit agent hands the work back. Free trials on a branch of the customer’s books. 41% of trials become installs',
    status: { testsRun: S.dev.evalRun, published: S.dev.published, companies: 212 + (S.gst.installed ? 1 : 0), thisMonth: '184,300 invoices matched, $22,116 in fees, $18,799 payout' }
  };
  const cs = closeStats();
  return {
    company: 'Ridgeline Outdoor Co. (fictional), Denver, about 480 people. Entities: US (USD), Canada (CAD), UK (GBP), India engineering and shared services (INR)',
    today: 'Friday, October 2. September close, day 2 of 3',
    closeProgress: `${cs.pct}%, ${cs.done} of ${cs.total} tasks`,
    closeByEntity: Object.fromEntries(Object.entries(closeTasks()).map(([k, e]) => [k, e.tasks.map(t => `${t[0]}: ${t[1] === 'done' ? 'done' : t[1] === 'sign' ? 'needs signature on ' + t[2] : 'blocked'}`)])),
    overnight: 'Agents signed 1,595 routine entries within their trust lines: 1,284 bank matches, 309 Shopify payout lines, an FX revaluation of −$22,380 and a $2,120 reclass',
    waitingForSignature: pending().map(p => ({ id: p.id, title: p.title, amount: p.amt, entity: p.ent, proposedBy: AG[p.agent].n, whyItNeedsMaya: p.why, checks: propChecks(p).map(c => `${c[1]}: ${c[0]}`) })),
    signedByMaya: Object.keys(S.signed), rejectedByMaya: Object.keys(S.rejected),
    ic0931: S.ic.v === 2 ? 'Revision 2: cost plus 15% per the 2026 policy, $1,225,624. Amendment No. 2 drafted, not yet signed by the boards' : 'Revision 1: cost plus 8% per the 2023 agreement, $1,151,020. Fails the transfer pricing policy check (the policy says 15%)',
    expertReview: S.ic.expert === 'replied' ? EXPERTS[S.ic.expertWho].name + ' reviewed IC-0931, supports 15%, and suggested comparing with India’s safe-harbour option for 2027' : S.ic.expert === 'waiting' ? 'An expert review of IC-0931 is in progress' : 'None requested',
    trustLines: trustRows().map(r => `${AG[r.ag].n}, ${r.task}: ${r.label}. ${r.rec}`),
    accountingAgentPromotion: S.promoted ? 'Raised from $2,500 to $10,000 by Maya today' : 'Recommended: raise bank matches from $2,500 to $10,000 (99.6% of 1,812 signed without edits; 99.4% at 2,140 similar companies; about 41 hours a month back)',
    alwaysHuman: ALWAYS_HUMAN.map(a => a[0]),
    septemberPnL: 'Revenue $7.84M (+4.2% vs August); gross margin 44.1% (−0.9 pts); opex $2.71M (+1.8%); EBITDA $0.75M (+3.2%). Gross margin by entity: US 45.6% (−0.4), Canada 43.8% (+0.6), UK 38.2% (−3.1)',
    ukMarginDrivers: 'August 41.3% to September 38.2%: Northsea Line freight surcharge −1.9 pts (£18,550 on £976,300 of sales, from accrual ACR-2207), channel mix −0.8 pts (wholesale 46% of UK sales vs 39%), exchange rate −0.4 pts (GBP/USD 1.3600 to 1.3410)',
    cash: '$14.2M across entities. 13-week forecast low of $11.8M in the week of November 16, from the holiday inventory build. Wholesale collection days rose from 38 to 47',
    indiaGST: S.gst.installed ? 'GSTMatch (partner agent from LedgerLoop) installed with drafts only. GST-0131 holds 118 matches worth ₹16.4 lakh of input credit' : '143 purchase bills don’t match suppliers’ GSTR-2B filings; ₹21.6 lakh of input credit at risk; no installed agent can fix it. GSTMatch in the Agent Exchange can, with a free trial on a branch',
    branches: S.branch.status && S.branch.status !== 'running' ? 'plan/fy27-bengaluru: moving 20 planned 2027 hires from Denver to Bengaluru cuts their annual cost from $4.06M to $0.86M; 2027 EBITDA $9.8M to $11.5M; lowest cash $6.1M to $6.9M; effective tax rate 24.1% to 24.6%; one check flagged by Kessler & Co. on how work is directed across borders' + (S.branch.status === 'merged' ? '. Merged into FY27 plan v3' : '') : 'No branches created today',
    people: 'Maya Okafor (CFO), Leo Park (controller), Sarah Kessler CPA (Kessler & Co., the company’s accounting firm), Rahul Iyer CA (Intuit Expert, India transfer pricing)'
  };
}
function buildTurns(q) {
  const who = S.persona === 'cfo' ? 'Maya Okafor, CFO of Ridgeline Outdoor Co.' : 'Riya Nair, a developer building agents for the IES Agent Exchange';
  const rules = `You are Autograph, the AI layer in Intuit Enterprise Suite, inside a clickable product prototype. You are answering ${who}. Everything below is fictional demo data. Answer only from it. If the answer is not in the data, say so in one sentence and point to the screen where she would look. Keep answers under 110 words, in plain sentences, with no markdown formatting. When you mention a change that needs a signature, include its ID.\n\nDATA (JSON):\n${JSON.stringify(aiData())}`;
  const hist = S.ask.msgs.slice(0, -2).filter(m => m.text && (m.who === 'you' || m.done)).slice(-6).map(m => ({ role: m.who === 'you' ? 'user' : 'assistant', content: m.text }));
  return [{ role: 'user', content: rules }, ...hist, { role: 'user', content: q }];
}
function scripted(q) {
  const s = q.toLowerCase();
  if (S.persona === 'dev') {
    if (/pay|price|money|earn|fee|share/.test(s)) return 'You set a price per outcome, such as $0.12 per matched invoice. Customers pay on their Intuit bill and you keep 85%. You’re paid only for outcomes a customer signed, never for reads or API calls. If you opt into Intuit Assurance, customers pay 3% more, which funds the cover.';
    if (/change|write|scope|access|permission|can my/.test(s)) return 'Nothing directly. Your agent reads within the scopes a customer grants at install and submits proposals. The customer’s checks run on each one, and it posts only when a person signs, or when it falls within the trust line your agent earned at that company.';
    if (/authority|trust|line|autonom/.test(s)) return 'Every agent starts with drafts only at each new customer. Your record elsewhere can fast-track it: GSTMatch earns a ₹50,000 line after 30 signed drafts because 98.7% of its work is signed without edits across 212 companies. Lines drop automatically if that rate falls.';
    return 'In this demo I can explain pricing, what your agent can change, how it earns authority, and how testing on twin companies works. Try “How do I get paid?”';
  }
  if (/sign|need|attention|pending|today|queue|waiting/.test(s)) {
    const p = pending().sort((a, b) => RISK[a.risk] - RISK[b.risk]);
    if (!p.length) return 'Nothing needs your signature right now. Agents will bring new changes to Sign-off as they find them.';
    const out = [`${p.length} ${p.length === 1 ? 'change needs' : 'changes need'} your signature. Start with ${p.slice(0, 3).map(x => `${x.id} (${x.amt})`).join(', ')}.`];
    if (!decided('IC-0931')) out.push(S.ic.v === 2 ? 'IC-0931 now passes its policy check after revision 2.' : 'IC-0931 has a failing check: the contract says an 8% markup, your policy says 15%.');
    if (!decided('AP-5521')) out.push('AP-5521 is a bank-change request that looks like fraud, so reject it unless Summit confirms by phone.');
    return out.join(' ');
  }
  if (/margin|uk|gross/.test(s)) return 'UK gross margin fell from 41.3% to 38.2%. Northsea Line’s peak-season freight surcharge explains 1.9 points, more wholesale sales explain 0.8, and a weaker pound on stock bought in dollars explains 0.4. The freight part relies on ACR-2207' + (decided('ACR-2207') ? ', which is now decided.' : ', which isn’t signed yet.');
  if (/close|block|lock/.test(s)) { const cs = closeStats(); return `September’s close is ${cs.pct}% done, ${cs.done} of ${cs.total} tasks. ` + (S.gst.installed ? (decided('GST-0131') ? 'India’s GST blocker is cleared. ' : 'India’s GST blocker needs one signature, on GST-0131. ') : 'India is blocked: 143 purchase bills don’t match suppliers’ GST filings, and none of your agents can fix it. GSTMatch in the Agent Exchange can. ') + (cs.done === cs.total ? 'Everything is signed, so you can lock September.' : 'The rest are signatures waiting in Sign-off.'); }
  if (/cash|runway|liquid/.test(s)) return 'Cash across the four entities is $14.2M. The 13-week forecast bottoms out at $11.8M in the week of November 16, when the holiday inventory build peaks. Wholesale customers are paying slower: collection days rose from 38 to 47.';
  if (/agent|authority|trust|line|autonom/.test(s)) return `Five agents sign on their own within trust lines, from CA$5,000 for PayoutSync to $50,000 for FX revaluation. The Accounting Agent ${S.promoted ? 'now signs bank matches up to $10,000.' : 'is ready to go from $2,500 to $10,000 on bank matches: 99.6% of its last 1,812 were signed without edits.'} The Payroll and Intercompany agents still draft only, and six kinds of change always need a person.`;
  if (/gst|india|credit/.test(s)) return S.gst.installed ? 'GSTMatch is installed with drafts only. Its 118 matches, worth ₹16.4 lakh of input credit, are in GST-0131' + (decided('GST-0131') ? ', which you’ve decided.' : ', waiting for your signature.') : '143 purchase bills in India don’t match what suppliers filed, so ₹21.6 lakh of input credit is at risk and India’s close is blocked. GSTMatch in the Agent Exchange can fix it, and you can try it free on a branch first.';
  if (/intercompany|ic-0931|markup|transfer/.test(s)) return S.signed['IC-0931'] ? 'IC-0931 is signed and posted at cost plus 15%, with Amendment No. 2 drafted for both boards.' : S.ic.v === 2 ? 'IC-0931 now charges cost plus 15% per your 2026 policy: $1,225,624. The policy check passes. Amendment No. 2 still needs both boards to sign.' : 'IC-0931 charges the US for India’s July to September engineering at cost plus 8%, from the 2023 agreement. Your 2026 policy says 15%, so the policy check fails. Ask the agent to use 15%, or get an expert opinion.';
  if (/hire|bengaluru|branch|plan/.test(s)) return S.branch.status === 'done' || S.branch.status === 'merged' ? 'On the branch, moving 20 hires to Bengaluru cuts their annual cost from $4.06M to $0.86M and lifts 2027 EBITDA by $1.7M. One check needs a look: how work is directed across borders.' : 'You haven’t created a branch today. In Branches, try moving 20 of next year’s hires to Bengaluru.';
  return 'In this demo I can answer questions about Ridgeline’s September: what needs your signature, margins, cash, the close, agent authority, intercompany charges or India GST.';
}
async function typeAnswer(m, text, gen) {
  if (RM) { m.text = text; return updateLastAsk(m); }
  const words = text.split(' ');
  for (let i = 1; i <= words.length; i++) {
    if (gen !== GEN) return;
    m.text = words.slice(0, i).join(' '); updateLastAsk(m);
    await sleep(20);
  }
}
function updateLastAsk(m) {
  const els = $$('#ask-log .amsg.ai'); const el = els[els.length - 1]; if (!el) return;
  const t = $('.amsg-t', el); if (t) t.textContent = m.text;
  const log = $('#ask-log'); if (log) log.scrollTop = log.scrollHeight;
}
async function ask(q) {
  q = String(q || '').trim(); if (!q || S.ask.busy) return;
  const gen = GEN;
  S.ask.busy = true;
  S.ask.msgs.push({ who: 'you', text: q });
  const m = { who: 'ai', text: '', pending: true, done: false, live: false };
  S.ask.msgs.push(m);
  const inp = $('#ask-in'); if (inp) inp.value = '';
  renderAsk();
  let ok = false;
  if (SAMPLE && !SAMPLE_OFF) {
    try {
      const res = await SAMPLE(buildTurns(q), { modelTier: 'quick', cache: false, onText: ({ text }) => { if (gen !== GEN) return; m.pending = false; m.text = text; updateLastAsk(m); } });
      if (gen !== GEN) return;
      m.text = res.text; m.live = true; ok = true;
    } catch (e) {
      const code = e && e.code;
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'session_expired'].indexOf(code) >= 0) SAMPLE_OFF = true;
      if (e && e.text && code !== 'refused') { m.text = e.text; m.live = true; ok = true; }
    }
  }
  if (gen !== GEN) return;
  if (!ok) { m.pending = false; m.live = false; await typeAnswer(m, scripted(q), gen); if (gen !== GEN) return; }
  m.pending = false; m.done = true; S.ask.busy = false;
  renderAsk();
}
async function detectSample() {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const s = await window.claude.use('sample');
      if (s) { SAMPLE = s; const el = $('#ask-mode'); if (el) el.textContent = askModeText(); }
    }
  } catch (e) { SAMPLE = null; }
}

/* ---------- theme ---------- */
function applyTheme(t) { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
function currentTheme() { return document.documentElement.getAttribute('data-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }

/* ---------- actions ---------- */
const A = {
  go: v => go(v),
  persona: p => { if (S.persona === p) return; S.persona = p; closeDrawers(); go(p === 'cfo' ? 'home' : 'signals'); },
  goQueueTab: t => { S.queueTab = t; go('queue'); },
  qtab: t => { S.queueTab = t; renderMain(true); },
  open: id => { S.sel = id; go('proposal'); },
  sign: id => doSign(id),
  reject: id => {
    if (!prop(id) || decided(id)) return;
    S.rejected[id] = true; renderChrome(); renderMain(true);
    toast(`${id} rejected. Nothing was posted, and it counts against the agent’s record.`);
  },
  vendorReject: () => {
    if (decided('AP-5521')) return;
    S.rejected['AP-5521'] = true; renderChrome(); renderMain(true);
    toast('Change rejected. Summit Freight’s payments go to the verified account.');
  },
  vendorVerify: () => { S.vendorVerified = true; renderMain(true); toast('Call recorded. Bank changes still need a second person to sign.'); },
  toComposer: () => { const c = $('#ic-composer'); if (c) { c.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' }); const i = $('#ic-in'); if (i) setTimeout(() => i.focus({ preventScroll: true }), 350); } },
  icSend: () => { const i = $('#ic-in'); if (i) { const v = i.value; i.value = ''; icRevise(v); } },
  icChip: t => icRevise(t),
  expertOpen: () => { if (!S.ic.expert) openModal(expertModal()); },
  expertPick: w => { S.ic.expertWho = w; openModal(expertModal()); },
  expertSend: () => expertSend(),
  promote: () => {
    if (S.promoted) return;
    S.promoted = true; S.acctLine = 10000; S.promotedAt = now();
    const row = $('[data-row="acct"]'), pct = tlPct(10000).toFixed(2) + '%';
    if (row) {
      const f = $('.tl-fill', row), nib = $('.tl-nib', row), cap = $('.tl-cap', row), lbl = $('.tl-lbl', row);
      if (f) f.style.width = pct;
      if (nib) nib.style.left = pct;
      if (cap) { cap.style.transition = 'opacity .6s'; cap.style.opacity = '0'; }
      if (lbl) lbl.textContent = 'Signs up to $10,000 per match';
      row.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    }
    markDone('authority'); renderChrome();
    toast('Accounting Agent now signs bank matches up to $10,000. Leo Park reviews a 5% sample each week.');
    const gen = GEN;
    setTimeout(() => { if (gen === GEN) refreshIfOn('authority'); }, 1500);
  },
  notNow: () => toast('The Accounting Agent keeps its $2,500 line. Autograph will ask again next month.'),
  explain: k => { if (!EXPLAIN[k]) return; S.xsel = k; renderMain(true); },
  explainGo: k => { S.xsel = k; go('explain'); },
  branchRun: () => branchRun(),
  branchMerge: () => { S.branch.status = 'merged'; renderMain(true); toast('Merged into the FY27 plan as version 3. Actuals never change from a branch.'); },
  branchAsk: () => toast('Sent to Sarah Kessler at Kessler &amp; Co., with the branch attached.'),
  gstFind: () => { S.exch.ctx = true; go('exchange'); },
  exAll: () => { S.exch.ctx = false; renderMain(true); },
  gstTrial: () => gstTrial(),
  gstResults: () => openModal(trialModal(), true),
  gstInstall: () => openModal(installModal(), true),
  gstConfirm: () => {
    if (S.gst.installed) return closeModal();
    S.gst.installed = true; S.gst.at = now();
    if (!prop('GST-0131')) S.props.push(Object.assign({}, GST_PROP));
    closeModal(); markDone('exchange');
    renderChrome(); renderMain(true);
    toast('GSTMatch installed with drafts only. Its 118 matches are waiting in Sign-off.');
  },
  gstDiscard: () => { closeModal(); S.gst.trial = null; refreshIfOn('exchange'); toast('Branch discarded. Nothing changed in your books.'); },
  soon: () => toast('In this demo, the free branch trial is wired up for GSTMatch.'),
  undo: id => toast(`Reversal of ${id} drafted. It posts when someone signs it.`),
  lock: () => {
    const cs = closeStats(); if (S.locked || cs.done < cs.total) return;
    S.locked = true; renderMain(true);
    toast('September is locked for all 4 entities. Signed by Maya Okafor.');
  },
  ev: n => {
    $$('.ev li.hl').forEach(x => x.classList.remove('hl'));
    const li = $('#ev-' + n);
    if (li) { li.classList.add('hl'); li.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }); }
  },
  sig: id => { S.dev.sig = id; renderMain(true); },
  devGen: () => devGen(),
  devTab: t => { S.dev.tab = t; renderMain(true); },
  devEval: () => { if (!S.dev.evalBusy && S.dev.evalRun === 0 && S.dev.gen) runEval(['Running on Kaveri Components, 3,100 bills', 'Running on Nilgiri Software Services, 1,450 bills', 'Running on Coastal Threads, 2,300 bills', 'Repeating every run 8 times to check consistency', 'Running red-team tests'], 1); },
  devFix: () => { if (!S.dev.evalBusy && S.dev.evalRun === 1) runEval(['Applying the fix: normalizing invoice numbers', 'Running again on all 3 twins', 'Repeating every run 8 times', 'Running red-team tests'], 2); },
  devPublish: () => devPublish(),
  devPrice: k => { S.dev.price = k; renderMain(true); },
  devAssure: () => { S.dev.assured = !S.dev.assured; renderMain(true); },
  askOpen: () => openDrawer('ask'),
  askSend: () => { const i = $('#ask-in'); if (i) ask(i.value); },
  askChip: q => ask(q),
  guideOpen: () => openDrawer('guide'),
  closeDrawer: () => closeDrawers(),
  guideGo: id => {
    const g = GUIDE.find(x => x.id === id); if (!g) return;
    closeDrawers(); closeModal();
    S.coach = id;
    if (S.persona !== g.p) S.persona = g.p;
    const d = DEST[id]; if (d[1]) S.sel = d[1];
    if (id === 'exchange' && !S.gst.installed) S.exch.ctx = true;
    go(d[0]);
  },
  briefDone: () => { markDone('brief'); if (S.coach === 'read') { const c = $('.coach'); if (c) c.outerHTML = coachBar(); } },
  coachOff: () => { S.coach = null; const c = $('.coach'); if (c) c.remove(); },
  welcomeStart: () => { closeModal(); S.coach = 'brief'; renderMain(); },
  how: () => openModal(howModal(), true),
  closeModal: () => { if (!MODAL_LOCK) closeModal(); },
  navOpen: () => { S.navOpen = true; const a = $('#app-root'); if (a) a.classList.add('nav-open'); },
  navClose: () => { S.navOpen = false; const a = $('#app-root'); if (a) a.classList.remove('nav-open'); },
  theme: () => { const nx = currentTheme() === 'dark' ? 'light' : 'dark'; applyTheme(nx); try { localStorage.setItem('autograph-theme', nx); } catch (e) { } },
  reset: () => {
    GEN++; XTOK++;
    S = freshState(); CLOCK = 9 * 60 + 36;
    closeModal(); closeDrawers(); render();
    const m = $('#main'); if (m) m.scrollTop = 0;
    toast('Demo reset.');
  }
};

/* ---------- events and init ---------- */
function onClick(e) {
  const t = e.target.closest('[data-act]');
  if (!t || t.disabled) return;
  const f = A[t.getAttribute('data-act')]; if (!f) return;
  e.preventDefault();
  f(t.getAttribute('data-arg'));
}
function onKey(e) {
  if (e.key === 'Escape') {
    const mr = $('#modal');
    if (mr && mr.classList.contains('open')) { if (!MODAL_LOCK) closeModal(); return; }
    if (S.drawer) { closeDrawers(); return; }
    if (S.navOpen) A.navClose();
    return;
  }
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.target) {
    const id = e.target.id;
    if (id === 'ic-in') { e.preventDefault(); A.icSend(); }
    else if (id === 'ask-in') { e.preventDefault(); A.askSend(); }
    else if (id === 'br-in') { e.preventDefault(); A.branchRun(); }
  }
}
function init() {
  try { const t = localStorage.getItem('autograph-theme'); if (t === 'dark' || t === 'light') applyTheme(t); } catch (e) { }
  const root = $('#root'); if (!root) return;
  root.innerHTML = `<div class="app" id="app-root"><aside class="side" id="side" aria-label="Main navigation"></aside><div class="scrim-nav" data-act="navClose"></div><div class="mainwrap"><header class="top" id="top"></header><main class="main" id="main" tabindex="-1"></main></div></div><aside class="drawer" id="ask" aria-label="Ask Autograph"></aside><aside class="drawer" id="guide" aria-label="Demo guide"></aside><div class="modal-root" id="modal"></div><div class="toasts" id="toasts" aria-live="polite"></div>`;
  render();
  openModal(welcomeModal());
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  detectSample();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
