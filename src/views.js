/* ---------- lookups ---------- */
const RISK = { high: 0, med: 1, low: 2 };
const DRAFTED = { 'IC-0931': '02:14', 'AP-5521': '01:52', 'FA-0117': '01:40', 'ACR-2207': '01:12', 'TAX-044': '23:58 yesterday', 'PSY-3301': '00:47', 'PAY-0912': '02:02' };
const ENT = { US: 'United States', CA: 'Canada', UK: 'United Kingdom', IN: 'India', 'IN to US': 'India to United States' };
const SIGN_LABEL = { 'TAX-044': 'Sign the registration', 'GST-0131': 'Sign all 118 matches' };
const PUB_STEPS = ['All test gates passed', 'Security review passed', 'Listed as Verified in the Agent Exchange', 'Shown to 1,240 companies with this gap'];
const BR_DEFAULT = 'Move 20 of next year’s engineering hires from Denver to Bengaluru';
const TL_MIN = Math.log10(500), TL_MAX = Math.log10(100000);
const tlPct = v => v <= 0 ? 0 : Math.max(0, Math.min(100, (Math.log10(v) - TL_MIN) / (TL_MAX - TL_MIN) * 100));

/* ---------- derived state ---------- */
const prop = id => S.props.find(p => p.id === id);
const pending = () => S.props.filter(p => !S.signed[p.id] && !S.rejected[p.id]);
const decided = id => !!(S.signed[id] || S.rejected[id]);
const doneCount = () => GUIDE.filter(g => S.guide[g.id]).length;

function icChecks() {
  const v2 = S.ic.v === 2;
  const c = [
    ['pass', 'Debits equal credits in both entities', ''],
    ['pass', 'Both periods are open', ''],
    ['pass', 'Matching elimination entries created', ''],
    ['pass', 'Drafted by an agent, signed by a person', 'Segregation of duties'],
    v2 ? ['pass', 'Markup matches transfer pricing policy', '15%, per your 2026 policy'] : ['fail', 'Markup matches transfer pricing policy', 'Uses 8% from the 2023 agreement. Your policy says 15%'],
    ['pass', 'Over $250,000 goes to the CFO', 'Routed to Maya Okafor']
  ];
  if (v2) c.push(['warn', 'Contract matches the charge', 'Amendment No. 2 is drafted. Both boards must sign it']);
  if (S.ic.expert === 'replied') c.push(['info', 'Compare with India’s safe-harbour option', 'Runs on every future charge', 'Added by ' + EXPERTS[S.ic.expertWho].name]);
  return c;
}
function vendorChecks() {
  const v = S.vendorVerified;
  return [
    v ? ['warn', 'Request came from a known contact', 'New domain, but Summit confirmed the change by phone'] : ['fail', 'Request came from a known contact', 'New domain: summit-freight-billing.com'],
    ['warn', 'Urgent language', 'Asks for the change before Friday’s payment run'],
    v ? ['pass', 'Verified by phone, on the number on file', 'Recorded by Maya Okafor'] : ['fail', 'Verified by phone, on the number on file', 'Not done yet'],
    ['info', 'Always needs two people', 'Changing where money goes']
  ];
}
const propChecks = p => p.kind === 'ic' ? icChecks() : p.kind === 'vendor' ? vendorChecks() : DETAIL[p.id].checks;

function closeTasks() {
  const s = id => decided(id) ? 'done' : 'sign';
  return {
    US: { name: 'United States', tasks: [['Bank reconciliations', 'done', 'Accounting Agent'], ['AP and AR cutoff', 'done', 'Accounting Agent'], ['Payroll', 'done', 'Payroll Agent'], ['Prepaids and amortization', 'done', 'Close Agent'], ['Revenue recognition', 'done', 'Close Agent'], ['FX revaluation', 'done', 'Close Agent'], ['Fixed assets', s('FA-0117'), 'FA-0117'], ['Intercompany', s('IC-0931'), 'IC-0931'], ['Sales tax', s('TAX-044'), 'TAX-044']] },
    CA: { name: 'Canada', tasks: [['Bank reconciliations', 'done', 'Accounting Agent'], ['Payroll', 'done', 'Payroll Agent'], ['GST and HST', 'done', 'Sales Tax Agent'], ['FX revaluation', 'done', 'Close Agent'], ['Shopify payouts', s('PSY-3301'), 'PSY-3301']] },
    UK: { name: 'United Kingdom', tasks: [['Bank reconciliations', 'done', 'Accounting Agent'], ['Payroll', 'done', 'Payroll Agent'], ['VAT', 'done', 'Sales Tax Agent'], ['FX revaluation', 'done', 'Close Agent'], ['Freight accrual', s('ACR-2207'), 'ACR-2207']] },
    IN: { name: 'India', tasks: [['Bank reconciliations', 'done', 'Accounting Agent'], ['Vendor bills and TDS', 'done', 'Accounting Agent'], ['Payroll true-up', s('PAY-0912'), 'PAY-0912'], ['Intercompany', s('IC-0931'), 'IC-0931'], ['GST input credit', S.gst.installed ? s('GST-0131') : 'blocked', S.gst.installed ? 'GST-0131' : null]] }
  };
}
function closeStats() {
  const byEnt = {}; let d = 0, n = 0;
  Object.entries(closeTasks()).forEach(([k, e]) => { const dd = e.tasks.filter(t => t[1] === 'done').length; byEnt[k] = { done: dd, total: e.tasks.length }; d += dd; n += e.tasks.length; });
  return { byEnt, done: d, total: n, pct: Math.round(d / n * 100) };
}
function trustRows() {
  const rows = [
    { key: 'acct', ag: 'acct', task: 'Bank matches', v: S.acctLine, cap: S.promoted ? 0 : 10000, label: `Signs up to ${usd(S.acctLine)} per match`, rec: '99.6% signed without edits', n: '1,812 in the last 60 days' },
    { key: 'cat', ag: 'acct', task: 'Transaction categories', v: 5000, label: 'Signs up to $5,000', rec: '98.9% signed without edits', n: '6,420 in the last 60 days' },
    { key: 'fx', ag: 'close', task: 'FX revaluation', v: 50000, label: 'Signs up to $50,000', rec: '100% signed without edits', n: '36 in the last 12 months' },
    { key: 'acr', ag: 'close', task: 'Accruals and reclasses', v: 25000, label: 'Signs up to $25,000', rec: '97.1% signed without edits', n: '214 in the last 9 months' },
    { key: 'psy', ag: 'payout', task: 'Payout reconciliation', v: 3649, label: 'Signs up to CA$5,000', rec: '99.3% here, 99.1% at 640 companies', n: '4,980 in the last 90 days' },
    { key: 'pay', ag: 'payroll', task: 'Payroll accruals', v: 0, label: 'Drafts only', rec: '98.2% signed without edits', n: '96 of the 120 signed drafts it needs' },
    { key: 'ic', ag: 'ic', task: 'Intercompany charges', v: 0, label: 'Drafts only', rec: '92.4% signed without edits', n: 'New: 34 days of history' }
  ];
  if (S.gst.installed) rows.push({ key: 'gst', ag: 'gst', task: 'GST input credit, India', v: 0, cap: 567, label: 'Drafts only', rec: '98.7% at 212 companies', n: 'Fast-track: can earn a ₹50,000 line after 30 signed drafts' });
  return rows;
}

/* ---------- small renderers ---------- */
function agentChip(id, withPub) {
  const a = AG[id]; if (!a) return '';
  const pub = withPub ? (a.partner ? `<span class="tag partner">Partner: ${a.pub}</span>` : '<span class="tag">Intuit</span>') : '';
  return `<span class="agent"><span class="av${a.partner ? ' p' : ''}" aria-hidden="true">${a.ab}</span><span class="agent-n">${a.n}</span>${pub}</span>`;
}
function ckIcon(k) {
  const m = { pass: 'check', fail: 'x', warn: 'alert', info: 'info', ink: 'pen' };
  return `<span class="ck ${k}" aria-hidden="true">${ic(m[k] || 'info', 12)}</span>`;
}
function checksSummary(checks) {
  const f = checks.filter(c => c[0] === 'fail').length, w = checks.filter(c => c[0] === 'warn').length, p = checks.filter(c => c[0] === 'pass').length;
  if (f) return `<span class="cs bad">${ckIcon('fail')}${f} failing</span>`;
  if (w) return `<span class="cs">${ckIcon('warn')}${p} passed, ${w} to note</span>`;
  return `<span class="cs">${ckIcon('pass')}All ${p} passed</span>`;
}
const emptyState = (t, s) => `<div class="empty"><b>${t}</b><span>${s || ''}</span></div>`;
const refs = t => t.replace(/\[(\d)\]/g, (m, n) => `<button class="ref" data-act="ev" data-arg="${n}" aria-label="See evidence ${n}">${n}</button>`);
function ledgerTable(lines) {
  return `<table class="ledger"><thead><tr><th>Account</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>${lines.map(l => l[0] === 'grp' ? `<tr class="grp"><td colspan="3">${l[1]}</td></tr>` : `<tr class="add"><td>${l[0]}</td><td class="r">${l[1]}</td><td class="r">${l[2]}</td></tr>`).join('')}</tbody></table>`;
}
const evList = (ev, freshIdx) => `<ol class="ev">${ev.map((e, i) => `<li id="ev-${i + 1}"${freshIdx === i ? ' class="fresh"' : ''}><span class="ev-n">${i + 1}</span><div><div class="ev-t">${e[0]}</div><div class="ev-q">${e[1]}</div></div></li>`).join('')}</ol>`;
const backLink = () => `<button class="back" data-act="go" data-arg="queue">${ic('back', 16)}Sign-off</button>`;
function statusTag(p) {
  if (S.signed[p.id]) return '<span class="tag ok">Signed</span>';
  if (S.rejected[p.id]) return '<span class="tag">Rejected</span>';
  return '<span class="tag warn">Needs your signature</span>';
}
function stepsHTML(steps, done, working) {
  return steps.map((s, i) => {
    const st = i < done ? 'done' : (i === done && working) ? 'now' : 'todo';
    const mark = st === 'done' ? ckIcon('pass') : st === 'now' ? '<span class="spin" aria-hidden="true"></span>' : '<span class="ck" style="box-shadow:inset 0 0 0 1.5px var(--rule-2)" aria-hidden="true"></span>';
    return `<li class="${st}">${mark}<span>${s}</span></li>`;
  }).join('');
}
function spark(vals, w, h) {
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const pts = vals.map((v, i) => `${(i / (vals.length - 1) * (w - 2) + 1).toFixed(1)},${(h - 2 - (v - mn) / (mx - mn || 1) * (h - 4)).toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline class="spk" points="${pts}"/></svg>`;
}
function bars(vals, labels, o) {
  o = o || {};
  const W = 520, H = 170, L = 8, R = 8, T = 22, B = 24;
  const mx = Math.max(...vals, o.target || 0) * 1.12;
  const cw = (W - L - R) / vals.length, bw = Math.min(40, cw * 0.58);
  const y = v => T + (1 - v / mx) * (H - T - B);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${o.label || ''}"><line class="grid" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>`;
  vals.forEach((v, i) => {
    const x = L + i * cw + (cw - bw) / 2, yy = y(v);
    s += `<rect class="${i === o.hi ? 'bar-hi' : 'bar'}" x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - B - yy).toFixed(1)}" rx="3"/>`;
    s += `<text class="bv" x="${(x + bw / 2).toFixed(1)}" y="${(yy - 6).toFixed(1)}" text-anchor="middle">${o.fmt ? o.fmt(v) : v}</text>`;
    s += `<text class="ax" x="${(x + bw / 2).toFixed(1)}" y="${H - 7}" text-anchor="middle">${labels[i]}</text>`;
  });
  if (o.target != null) { const ty = y(o.target).toFixed(1); s += `<line class="tgt" x1="${L}" x2="${W - R}" y1="${ty}" y2="${ty}"/>`; }
  return s + '</svg>';
}
function waterfall() {
  const W = 460, H = 200, L = 8, R = 8, T = 20, B = 44, lo = 36, hi = 42;
  const y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const cols = [
    { l: ['August'], a: lo, b: 41.3, cls: 'bar-tot', v: '41.3%' },
    { l: ['Freight', 'surcharge'], a: 39.4, b: 41.3, cls: 'bar-neg', v: '−1.9' },
    { l: ['Channel', 'mix'], a: 38.6, b: 39.4, cls: 'bar-neg', v: '−0.8' },
    { l: ['Exchange', 'rate'], a: 38.2, b: 38.6, cls: 'bar-neg', v: '−0.4' },
    { l: ['September'], a: lo, b: 38.2, cls: 'bar-now', v: '38.2%' }
  ];
  const cw = (W - L - R) / cols.length, bw = cw * 0.56;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="UK gross margin bridge: 41.3% in August, minus 1.9 points for the freight surcharge, minus 0.8 for channel mix, minus 0.4 for the exchange rate, 38.2% in September">`;
  cols.forEach((c, i) => {
    const x = L + i * cw + (cw - bw) / 2, y1 = y(c.b), y2 = y(c.a), cx = (x + bw / 2).toFixed(1);
    s += `<rect class="${c.cls}" x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(2, y2 - y1).toFixed(1)}" rx="3"/>`;
    s += `<text class="bv" x="${cx}" y="${(y1 - 6).toFixed(1)}" text-anchor="middle">${c.v}</text>`;
    c.l.forEach((ln, j) => { s += `<text class="ax" x="${cx}" y="${H - B + 16 + j * 13}" text-anchor="middle">${ln}</text>`; });
    if (i < cols.length - 1) { const yy = y(c.cls === 'bar-tot' ? c.b : c.a).toFixed(1); s += `<line class="conn" x1="${(x + bw).toFixed(1)}" x2="${(x + cw).toFixed(1)}" y1="${yy}" y2="${yy}"/>`; }
  });
  return s + '</svg>';
}
function trustLine(r) {
  const p = tlPct(r.v), c = r.cap ? tlPct(r.cap) : 0;
  return `<div class="tl" role="img" aria-label="${r.label}${r.cap ? ', can grow further' : ''}">
    <div class="tl-track"></div>
    ${c > p ? `<div class="tl-cap" style="left:${p}%;width:${(c - p).toFixed(2)}%"></div>` : ''}
    <div class="tl-fill" style="width:${p.toFixed(2)}%"></div>
    <div class="tl-nib${p > 0 ? '' : ' none'}" style="left:${p.toFixed(2)}%"></div>
    <span class="tl-lab" style="left:${tlPct(1000).toFixed(2)}%">$1K</span><span class="tl-lab" style="left:${tlPct(10000).toFixed(2)}%">$10K</span><span class="tl-lab end" style="left:100%">$100K</span>
  </div>`;
}

/* ---------- shell ---------- */
function side() {
  const cfo = S.persona === 'cfo';
  const n = pending().length;
  const items = cfo
    ? [['home', 'home', 'Today'], ['queue', 'sign', 'Sign-off', n], ['close', 'close', 'Close'], ['authority', 'shield', 'Agent authority'], ['explain', 'explain', 'Explain'], ['branches', 'branch', 'Branches'], ['exchange', 'exchange', 'Agent Exchange']]
    : [['signals', 'signal', 'Demand signals'], ['build', 'code', 'Build'], ['test', 'test', 'Test on twins'], ['publish', 'publish', 'Publish'], ['earnings', 'earn', 'Earnings']];
  const on = v => S.view === v || (v === 'queue' && S.view === 'proposal');
  return `<div class="brand"><div class="brand-suite">Intuit Enterprise Suite</div><div class="brand-mark">Autograph</div></div>
  <div class="org">${cfo ? '<div class="org-name">Ridgeline Outdoor Co.</div><div class="org-sub">4 entities: US, Canada, UK, India</div>' : '<div class="org-name">LedgerLoop</div><div class="org-sub">Intuit partner, Bengaluru</div>'}</div>
  <nav class="nav" aria-label="Sections">${items.map(([v, i, l, b]) => `<button class="nav-i${on(v) ? ' on' : ''}" data-act="go" data-arg="${v}"${on(v) ? ' aria-current="page"' : ''}>${ic(i)}<span class="nav-l">${l}</span>${b ? `<span class="badge"><span class="sr">waiting: </span>${b}</span>` : ''}</button>`).join('')}</nav>
  <div class="side-foot"><button class="side-link" data-act="how">${ic('layers', 16)}<span>How Autograph works</span></button><button class="side-link" data-act="reset">${ic('undo', 16)}<span>Reset the demo</span></button></div>`;
}
function topbar() {
  const cfo = S.persona === 'cfo', d = doneCount();
  return `<button class="icon-btn only-m" data-act="navOpen" aria-label="Open navigation">${ic('menu')}</button>
  <button class="askbar" data-act="askOpen">${ic('spark', 17)}<span>${cfo ? 'Ask about your books' : 'Ask about building on Autograph'}</span></button>
  <div class="grow"></div>
  <div class="seg" role="group" aria-label="Persona"><button class="${cfo ? 'on' : ''}" data-act="persona" data-arg="cfo" aria-pressed="${cfo}">Maya<span class="seg-x">, CFO</span></button><button class="${cfo ? '' : 'on'}" data-act="persona" data-arg="dev" aria-pressed="${!cfo}">Riya<span class="seg-x">, developer</span></button></div>
  <button class="btn btn-ghost guide-btn" data-act="guideOpen" aria-label="Demo guide, ${d} of ${GUIDE.length} steps done">${ic('book', 17)}<span class="gl">Demo guide</span><span class="gcount">${d}/${GUIDE.length}</span></button>
  <button class="icon-btn" data-act="theme" aria-label="Switch between light and dark">${ic('moon')}</button>`;
}

/* ---------- guided demo ---------- */
const HINT = {
  brief: 'Agents worked overnight. Only what’s above their authority reaches Maya. Read the brief, then continue.',
  read: 'Open IC-0931. Note the failing check and the agent’s lower confidence.',
  revise: 'Below the proposal, click “Use the 15% markup from the 2026 policy”, or type your own instruction.',
  expert: 'Click “Get an expert opinion”, pick an expert, and send the brief the agent wrote.',
  sign: 'Every check passes now. Click “Sign and post” and watch the signature.',
  authority: 'Read the evidence and safeguards, then raise the Accounting Agent’s line to $10,000.',
  explain: 'Click UK gross margin, 38.2%, to see why it moved and who touched it.',
  branch: 'Create the branch and compare it with mainline. Actuals never change.',
  exchange: 'India is blocked. Click “Find an agent”, try GSTMatch on a branch, then install it.',
  signals: 'You’re Riya now. This table is demand that Intuit’s agents couldn’t meet.',
  build: 'Generate the agent, run the tests, and apply the suggested fix when a gate fails.',
  publish: 'Publish as Verified, then open Earnings to see Ridgeline’s install arrive.'
};
const DEST = { brief: ['home'], read: ['proposal', 'IC-0931'], revise: ['proposal', 'IC-0931'], expert: ['proposal', 'IC-0931'], sign: ['proposal', 'IC-0931'], authority: ['authority'], explain: ['explain'], branch: ['branches'], exchange: ['close'], signals: ['signals'], build: ['build'], publish: ['publish'] };
function atDest(id) {
  const d = DEST[id]; if (!d) return false;
  if (id === 'exchange' && S.view === 'exchange') return true;
  if (id === 'build' && S.view === 'test') return true;
  if (id === 'publish' && S.view === 'earnings') return true;
  return S.view === d[0] && (!d[1] || S.sel === d[1]);
}
function coachBar() {
  if (!S.coach) return '';
  if (S.coach === 'end') return `<div class="coach" role="status"><span class="coach-n">${ic('check', 14)}</span><div class="coach-b"><b>That’s the whole demo</b><span>Explore anything, or reset it from the sidebar.</span></div><span></span><button class="icon-btn" data-act="coachOff" aria-label="Hide hints">${ic('x', 16)}</button></div>`;
  const i = GUIDE.findIndex(g => g.id === S.coach), g = GUIDE[i]; if (!g) return '';
  const here = atDest(g.id);
  const btn = g.id === 'brief' ? '<button class="btn btn-sm btn-primary" data-act="briefDone">Continue</button>' : here ? '<span></span>' : `<button class="btn btn-sm btn-primary" data-act="guideGo" data-arg="${g.id}">Take me there</button>`;
  return `<div class="coach" role="status"><span class="coach-n">${i + 1}</span><div class="coach-b"><b>${g.t} <span class="coach-of">Step ${i + 1} of ${GUIDE.length}</span></b><span>${HINT[g.id]}</span></div>${btn}<button class="icon-btn" data-act="coachOff" aria-label="Hide hints">${ic('x', 16)}</button></div>`;
}

/* ---------- CFO: today ---------- */
function vHome() {
  const pend = pending(), n = pend.length;
  const total = pend.reduce((a, p) => a + (p.usd || 0), 0);
  const cs = closeStats();
  const signedN = Object.keys(S.signed).length;
  const lede = n
    ? `While you slept, agents signed <b>1,595 routine entries</b> within their trust lines and drafted <b>${n} ${n === 1 ? 'change' : 'changes'}</b> that ${n === 1 ? 'needs' : 'need'} your signature.`
    : 'While you slept, agents signed <b>1,595 routine entries</b> within their trust lines. <b>Everything that needed you is done.</b>';
  const ebars = Object.entries(cs.byEnt).map(([k, e]) => `<span class="ebar"><i><b style="width:${Math.round(e.done / e.total * 100)}%"></b></i>${k}</span>`).join('');
  return `<section class="brief">
    <p class="brief-date">Friday, October 2. September close, day 2 of 3.</p>
    <h1 class="brief-h">Good morning, Maya.</h1>
    <p class="brief-lede">${lede}</p>
    <div class="brief-cta">${n ? `<button class="btn btn-primary btn-lg" data-act="go" data-arg="queue">${ic('sign')}Review ${n} ${n === 1 ? 'change' : 'changes'}</button>` : `<button class="btn btn-primary btn-lg" data-act="go" data-arg="close">${ic('close')}Go to the close</button>`}<button class="btn btn-quiet btn-lg" data-act="goQueueTab" data-arg="agents">See what agents signed</button></div>
  </section>
  <section class="metrics" aria-label="Key numbers">
    <div class="metric"><div class="m-label">September close</div><div class="m-val">${cs.pct}%</div><div class="m-sub"><span class="ebars">${ebars}</span></div></div>
    <div class="metric"><div class="m-label">Cash across entities</div><div class="m-val">$14.2M</div><div class="m-sub">${spark([13.1, 13.4, 13.9, 14.6, 14.2, 13.5, 12.6, 12.1, 11.8, 12.4, 13.2, 13.9, 14.5], 64, 20)}<span>Low of $11.8M in mid-November</span></div></div>
    <div class="metric"><div class="m-label">Waiting for your signature</div><div class="m-val">${n ? moneyShort(total) : '$0'}</div><div class="m-sub">${n} ${n === 1 ? 'change' : 'changes'}${signedN ? `, ${signedN} signed today` : ''}</div></div>
    <div class="metric"><div class="m-label">Hours returned this month</div><div class="m-val">${S.promoted ? 353 : 312}</div><div class="m-sub">Across a finance team of 9</div></div>
  </section>
  <div class="cols">
    <section class="panel"><div class="panel-h"><h2 class="h2">Overnight</h2><span class="small muted">What agents did, and who can undo it</span></div><ol class="feed">${feedItems()}</ol></section>
    <div class="stack">${homeCards()}</div>
  </div>`;
}
function refStatus(ref) {
  if (S.signed[ref]) return '<span class="tag ok">Signed by you</span>';
  if (S.rejected[ref]) return '<span class="tag">Rejected by you</span>';
  return `<button class="linkbtn" data-act="open" data-arg="${ref}">Open ${ref}</button><span>Needs your signature</span>`;
}
function feedItems() {
  const rows = [];
  if (S.gst.installed) rows.push([S.gst.at, 'gst', 'drafted 118 GST input-credit matches, 9 supplier reminders and 4 bills for review.', 'GST-0131', true]);
  OVERNIGHT.forEach(r => rows.push(r));
  return rows.map(([t, ag, text, ref, isNew]) => `<li${isNew ? ' class="new"' : ''}><span class="f-time">${t}</span><div><p class="f-body"><span class="who">${AG[ag].n}</span>${AG[ag].partner ? ' <span class="tag partner">Partner</span>' : ''} ${text}</p><div class="f-meta">${ref ? refStatus(ref) : '<span>Signed by the agent. Reversible until the period is locked.</span>'}</div></div></li>`).join('');
}
function homeCards() {
  let h = '';
  if (!S.gst.installed) h += `<section class="panel"><div class="callout"><span class="ck fail" aria-hidden="true">${ic('x', 12)}</span><div><h2 class="h3">India’s close is blocked</h2><p>143 purchase bills don’t match what suppliers filed for GST. ₹21.6 lakh of input credit is at risk, and none of your agents can fix it.</p><button class="btn btn-secondary btn-sm" data-act="gstFind">Find an agent that can</button></div></div></section>`;
  else if (!decided('GST-0131')) h += `<section class="panel"><div class="callout"><span class="ck ink" aria-hidden="true">${ic('pen', 12)}</span><div><h2 class="h3">GSTMatch’s first proposals are ready</h2><p>118 matches worth ₹16.4 lakh of input credit. Sign them to unblock India’s close.</p><button class="btn btn-secondary btn-sm" data-act="open" data-arg="GST-0131">Open GST-0131</button></div></div></section>`;
  if (!S.promoted) h += `<section class="panel"><div class="callout"><span class="ck ink" aria-hidden="true">${ic('shield', 12)}</span><div><h2 class="h3">Accounting Agent is ready for a bigger trust line</h2><p>Your team signed 99.6% of its last 1,812 bank matches without edits. Raising its line from $2,500 to $10,000 would return about 41 hours a month.</p><button class="btn btn-secondary btn-sm" data-act="go" data-arg="authority">Review the evidence</button></div></div></section>`;
  h += `<section class="panel"><h2 class="h2">Worth a look</h2>
    <div class="insight"><h3 class="h3">UK gross margin fell 3.1 points</h3><p>Mostly a freight surcharge. One change behind it isn’t signed yet.</p><button class="linkbtn small" data-act="explainGo" data-arg="uk">Explain it</button></div>
    <div class="insight"><h3 class="h3">Wholesale customers are paying slower</h3><p>Collection days rose from 38 to 47. Three retailers account for most of it, and the Payments Agent has started reminders.</p></div>
  </section>`;
  return h;
}

/* ---------- CFO: sign-off ---------- */
function qrow(p) {
  return `<button class="qrow r-${p.risk}" data-act="open" data-arg="${p.id}"><span class="q-main"><span class="q-id">${p.id}</span><span class="q-title">${p.title}</span><span class="q-why">${p.why}</span></span><span class="q-ent">${p.ent}</span><span class="q-amt">${p.amt}</span><span class="q-agent">${agentChip(p.agent)}</span><span class="q-checks">${checksSummary(propChecks(p))}</span></button>`;
}
function vQueue() {
  const pend = pending().slice().sort((a, b) => RISK[a.risk] - RISK[b.risk]);
  const done = S.props.filter(p => decided(p.id));
  const tabs = [['needs', 'Needs you', pend.length], ['agents', 'Signed by agents', POSTED.length], ['people', 'Decided by people', done.length]];
  let body;
  if (S.queueTab === 'agents') {
    body = POSTED.map(x => `<div class="prow"><span class="q-main"><span class="q-id">${x.t}</span><span class="q-title">${x.title}</span><span class="q-why">${x.note}</span></span><span class="q-amt">${x.amt}</span><span class="q-agent">${agentChip(x.agent)}</span><span class="r"><button class="btn btn-ghost btn-sm" data-act="undo" data-arg="${x.id}">${ic('undo', 15)}Undo</button></span></div>`).join('');
  } else if (S.queueTab === 'people') {
    body = done.length ? done.map(p => `<button class="qrow" data-act="open" data-arg="${p.id}"><span class="q-main"><span class="q-id">${p.id}</span><span class="q-title">${p.title}</span><span class="q-why">${S.signed[p.id] ? 'Signed by Maya Okafor at ' + S.signed[p.id].t : 'Rejected by Maya Okafor'}</span></span><span class="q-ent">${p.ent}</span><span class="q-amt">${p.amt}</span><span class="q-agent">${agentChip(p.agent)}</span><span class="q-checks">${S.signed[p.id] ? '<span class="tag ok">Signed</span>' : '<span class="tag">Rejected</span>'}</span></button>`).join('') : emptyState('Nothing decided yet today', 'What you sign or reject shows up here, with its lineage.');
  } else {
    body = pend.length ? `<div class="qhead" aria-hidden="true"><span>Change</span><span>Entity</span><span class="r">Amount</span><span>Proposed by</span><span>Checks</span></div>${pend.map(qrow).join('')}` : emptyState('Nothing needs your signature', 'Agents bring new changes here as they find them.');
  }
  return `<div class="phead"><div><h1 class="h1">Sign-off</h1><p class="lede">Changes above an agent’s trust line, or in an always-human area, wait here for a person. Nothing posts until someone signs.</p></div></div>
  <div class="qtabs" role="tablist">${tabs.map(([k, l, c]) => `<button role="tab" aria-selected="${S.queueTab === k}" class="qtab${S.queueTab === k ? ' on' : ''}" data-act="qtab" data-arg="${k}">${l}<span class="qn">${c}</span></button>`).join('')}</div>
  <div class="qlist">${body}</div>`;
}

/* ---------- CFO: proposal ---------- */
function vProposal() {
  const p = prop(S.sel);
  if (!p) return backLink() + emptyState('That change isn’t here anymore', '');
  if (p.kind === 'ic') return vIC(p);
  if (p.kind === 'vendor') return vVendor(p);
  return vGeneric(p);
}
function sheetHead(p, extraTag) {
  return `<div class="sheet-top">${agentChip(p.agent, true)}<span>${p.agent === 'payments' ? 'flagged' : 'drafted'} at ${DRAFTED[p.id] || S.gst.at || '09:40'}</span>${extraTag || ''}<span class="grow"></span>${statusTag(p)}</div><p class="q-id" style="margin-top:16px">${p.id}, ${ENT[p.ent] || p.ent}</p>`;
}
function sigBlock(id) {
  const s = S.signed[id];
  const note = s ? `<div class="sig-note">${ic('check', 16)}<span>Posted. Reversible until September is locked.</span></div>` : S.rejected[id] ? '<div class="sig-note muted">Rejected. Nothing was posted.</div>' : '<div class="sig-note muted">Nothing posts until someone signs.</div>';
  return `<div class="sigblock"><div class="sig"><div class="sig-ink${s && s.fresh ? ' write' : ''}" aria-hidden="${s ? 'false' : 'true'}">${s ? 'Maya Okafor' : ''}</div><div class="sig-line"></div><div class="sig-cap">${s ? `Maya Okafor, Chief Financial Officer. Signed at ${s.t}.` : 'Maya Okafor, Chief Financial Officer'}</div></div>${note}</div>`;
}
function railChecks(checks) {
  const ord = { fail: 0, warn: 1, info: 2, pass: 3 };
  const sorted = checks.slice().sort((a, b) => ord[a[0]] - ord[b[0]]);
  return `<section class="panel"><div class="panel-h" style="margin-bottom:10px"><span class="small muted">Checks on this change</span>${checksSummary(checks)}</div><ul class="checks">${sorted.map(c => `<li${c[1] === S.fresh ? ' class="fresh"' : ''}>${ckIcon(c[0])}<div><div class="ck-t">${c[1]}</div>${c[2] ? `<div class="ck-d">${c[2]}</div>` : ''}${c[3] ? `<div class="ck-by">${c[3]}</div>` : ''}</div></li>`).join('')}</ul></section>`;
}
function railConf(conf, why) {
  if (conf == null) return '';
  return `<section class="panel"><div class="small muted">Agent’s confidence</div><div class="conf"><span class="conf-v">${conf}%</span></div><div class="meter"><i style="width:${conf}%"></i></div><p class="small">${why}</p></section>`;
}
const railWhy = p => `<section class="panel"><div class="small muted">Why this came to you</div><p style="margin-top:4px">${p.why}.</p></section>`;
function nextBtn() {
  const n = pending().sort((a, b) => RISK[a.risk] - RISK[b.risk]);
  return n.length ? `<button class="btn btn-secondary" style="width:100%;margin-top:12px" data-act="open" data-arg="${n[0].id}">Next: ${n[0].id}</button>` : `<button class="btn btn-secondary" style="width:100%;margin-top:12px" data-act="go" data-arg="close">Go to the close</button>`;
}
function decidedPanel(p) {
  if (S.signed[p.id]) return `<section class="panel"><div class="reviewed">${ckIcon('pass')}<div><b>Signed by you at ${S.signed[p.id].t}</b><div class="small muted">${p.id === 'AP-5521' ? 'Waiting for Leo Park’s second signature.' : 'Posted. Reversible until September is locked.'}</div></div></div>${nextBtn()}</section>`;
  return `<section class="panel"><div class="reviewed">${ckIcon('fail')}<div><b>Rejected</b><div class="small muted">${p.id === 'AP-5521' ? 'Payments stay on the verified account.' : 'Nothing posted. It counts against the agent’s record.'}</div></div></div>${nextBtn()}</section>`;
}
function vGeneric(p) {
  const d = DETAIL[p.id], fails = d.checks.some(c => c[0] === 'fail');
  const actions = decided(p.id) ? decidedPanel(p) : `<section class="panel"><div class="actions"><button class="btn btn-ink btn-lg" data-act="sign" data-arg="${p.id}"${fails ? ' disabled' : ''}>${ic('pen')}${SIGN_LABEL[p.id] || 'Sign and post'}</button><button class="btn btn-ghost" data-act="reject" data-arg="${p.id}">Reject</button></div></section>`;
  return `${backLink()}<div class="pgrid"><div>
    <article class="sheet" aria-labelledby="sheet-h">
      ${sheetHead(p)}
      <h1 class="sheet-h" id="sheet-h" style="margin-top:2px">${p.title}</h1>
      <p class="sheet-sum">${d.sum}</p>
      ${d.lines ? `<div class="sec"><h2 class="sec-h">What will change</h2><div class="tbl">${ledgerTable(d.lines)}</div>${d.extra ? `<p class="note">${d.extra}</p>` : ''}</div>` : ''}
      ${d.list ? `<div class="sec"><h2 class="sec-h">What you’re signing</h2><ul class="plain">${d.list.map(x => `<li>${x}</li>`).join('')}</ul></div>` : ''}
      <div class="sec"><h2 class="sec-h">Why the agent proposed this</h2><p class="reason">${refs(d.reason)}</p></div>
      <div class="sec"><h2 class="sec-h">Evidence</h2>${evList(d.ev)}</div>
      ${sigBlock(p.id)}
    </article></div>
    <aside class="rail" aria-label="Review and sign">${actions}${railWhy(p)}${railChecks(d.checks)}${railConf(p.conf, d.confWhy)}</aside></div>`;
}
function vVendor(p) {
  const checks = vendorChecks();
  let actions;
  if (decided(p.id)) actions = decidedPanel(p);
  else actions = `<section class="panel"><div class="actions"><button class="btn btn-primary btn-lg" data-act="vendorReject">Reject the change</button><p class="hint" style="margin:0 0 6px">Recommended. Payments stay on the verified account.</p>${S.vendorVerified ? `<button class="btn btn-ink" data-act="sign" data-arg="AP-5521">${ic('pen')}Sign as first approver</button><p class="hint" style="margin:0">Leo Park must also sign before any money moves.</p>` : '<button class="btn btn-secondary" data-act="vendorVerify">I called Summit on the number on file</button>'}</div></section>`;
  return `${backLink()}<div class="pgrid"><div>
    <article class="sheet" aria-labelledby="sheet-h">
      ${sheetHead(p)}
      <h1 class="sheet-h" id="sheet-h" style="margin-top:2px">${p.title}</h1>
      <p class="sheet-sum">Someone asked to send Summit Freight’s payments to a new bank account. The request doesn’t match how Summit usually contacts you.</p>
      <div class="sec"><h2 class="sec-h">Requested change</h2><div class="tbl"><table class="ledger"><thead><tr><th>Field</th><th>On file</th><th>Requested</th></tr></thead><tbody>
        <tr><td>Bank</td><td>First Western Bank</td><td>Harbor Coast Bank</td></tr>
        <tr><td>Account ending</td><td>4471</td><td>9082</td></tr>
        <tr><td>Contact</td><td>ap@summitfreight.com</td><td>billing@summit-freight-billing.com</td></tr>
      </tbody></table></div><p class="note">Two scheduled payments totaling $38,900 are paused until this is resolved.</p></div>
      <div class="sec"><h2 class="sec-h">Why the agent flagged this</h2><p class="reason">${refs('The request came from a domain registered 9 days ago, not the one in your vendor records [1]. It asks for the change before Friday’s payment run, a common pattern in payment fraud [2]. I paused the two payments due to Summit [3] until someone confirms the change by calling the number already on file.')}</p></div>
      <div class="sec"><h2 class="sec-h">Evidence</h2>${evList([['Email received Oct 1 at 23:47', 'From billing@summit-freight-billing.com, domain registered Sep 22'], ['Vendor record, Summit Freight LLC', 'Contact ap@summitfreight.com since 2021, phone on file'], ['Scheduled payments', 'Invoices SF-2231 and SF-2240, $38,900 in total']])}</div>
      ${sigBlock(p.id)}
    </article></div>
    <aside class="rail" aria-label="Review and decide">${actions}${railWhy(p)}${railChecks(checks)}</aside></div>`;
}

const IC_EV = [
  ['Intercompany services agreement, April 2023', 'Clause 4.2: engineering services billed at cost plus 8%'],
  ['Transfer pricing policy, 2026', 'Page 3: engineering services at cost plus 15% from January 1, 2026'],
  ['India cost centers, July to September', '₹9,40,00,000: payroll ₹7.62 crore, facilities ₹0.91 crore, software ₹0.87 crore'],
  ['Reference rate, September 30', '₹88.20 per US dollar (assumed for this demo)']
];
function threadHTML() {
  return S.ic.thread.map(m => {
    const w = m.who === 'agent' ? { n: 'Intercompany Agent', ab: 'IC', c: '' } : m.who === 'maya' ? { n: 'Maya Okafor', ab: 'MO', c: ' h' } : { n: EXPERTS[m.who].name, ab: EXPERTS[m.who].ab, c: ' h' };
    const tag = m.tag ? ` <span class="tag partner">${m.tag}</span>` : '';
    const steps = m.steps ? `<ul class="steps">${stepsHTML(m.steps, m.done, m.working)}</ul>` : '';
    return `<div class="msg"><span class="av${w.c}" aria-hidden="true">${w.ab}</span><div><div class="msg-who">${w.n}<span>${m.t}</span>${tag}</div>${steps}${m.text ? `<div class="msg-b">${esc(m.text)}</div>` : ''}</div></div>`;
  }).join('');
}
function vIC(p) {
  const v2 = S.ic.v === 2, checks = icChecks(), fails = checks.some(c => c[0] === 'fail');
  const I1 = 101520000, I2 = 108100000, U1 = 1151020, U2 = 1225624;
  const c = (a, b) => v2 ? `<span class="old">${a}</span><span class="new">${b}</span>` : a;
  const conf = v2 ? (S.ic.expert === 'replied' ? 96 : 93) : 81;
  const confWhy = v2 ? (S.ic.expert === 'replied' ? 'The charge follows your policy, and an expert agreed with the markup.' : 'The charge now follows your policy. The contract still needs its amendment signed.') : 'Not higher because the signed contract and your policy disagree on the markup.';
  const ev = v2 ? IC_EV.concat([['Draft: Amendment No. 2 to the services agreement', 'Sets the markup to cost plus 15% from January 1, 2026. Both boards must sign']]) : IC_EV;
  const reason = v2
    ? 'At your request I used cost plus 15% from your 2026 transfer pricing policy [2] instead of the 8% in the 2023 agreement [1]. The cost base is unchanged at ₹9.40 crore [3], converted at ₹88.20 per dollar [4]. The charge rises by ₹65,80,000, or $74,604. Because the signed agreement still says 8%, I drafted Amendment No. 2 for both boards to sign [5].'
    : 'I charged Ridgeline Outdoor Inc. for the India team’s July to September engineering work at cost plus 8%. That markup comes from the signed intercompany services agreement [1]. Your 2026 transfer pricing policy says cost plus 15% [2], but no amended agreement is on file, so the two documents disagree. I followed the signed contract and lowered my confidence. The cost base is ₹9.40 crore from the India cost centers [3], converted at ₹88.20 per dollar [4].';
  const expertCard = S.ic.expert === 'waiting'
    ? `<section class="panel"><div class="reviewed"><span class="spin" aria-hidden="true"></span><div><b>${EXPERTS[S.ic.expertWho].name} is reviewing</b><div class="small muted">${EXPERTS[S.ic.expertWho].sla}</div></div></div></section>`
    : S.ic.expert === 'replied' ? `<section class="panel"><div class="reviewed"><span class="av h lg" aria-hidden="true">${EXPERTS[S.ic.expertWho].ab}</span><div><b>Reviewed by ${EXPERTS[S.ic.expertWho].name}</b><div class="small muted">Read the reply in the conversation below</div></div></div></section>` : '';
  let actions;
  if (decided(p.id)) actions = decidedPanel(p);
  else actions = `<section class="panel"><div class="actions">
      <button class="btn btn-ink btn-lg" data-act="sign" data-arg="IC-0931"${fails ? ' disabled' : ''}>${ic('pen')}Sign and post</button>
      ${fails ? '<p class="hint" style="margin:0 0 4px">One check is failing. Ask the agent to revise it, or get an expert opinion first.</p><button class="btn btn-secondary" data-act="toComposer">' + ic('send', 16) + 'Ask the agent to revise</button>' : ''}
      <button class="btn btn-secondary" data-act="expertOpen"${S.ic.expert ? ' disabled' : ''}>${ic('user', 17)}${S.ic.expert === 'waiting' ? 'Expert is reviewing' : S.ic.expert === 'replied' ? 'Expert has replied' : 'Get an expert opinion'}</button>
      <button class="btn btn-ghost" data-act="reject" data-arg="IC-0931">Reject</button></div></section>`;
  const composer = decided(p.id) ? '' : `<div id="ic-composer"><div class="composer"><input id="ic-in" class="input" placeholder="Tell the agent what to change" aria-label="Tell the agent what to change" autocomplete="off"${S.ic.busy ? ' disabled' : ''}><button class="btn btn-primary" data-act="icSend"${S.ic.busy ? ' disabled' : ''}>${ic('send', 16)}Send</button></div>${v2 ? '' : '<div class="chips"><button class="chip" data-act="icChip" data-arg="Use the 15% markup from the 2026 policy">Use the 15% markup from the 2026 policy</button><button class="chip" data-act="icChip" data-arg="Keep 8% and note why">Keep 8% and note why</button></div>'}</div>`;
  return `${backLink()}<div class="pgrid"><div>
    <article class="sheet" aria-labelledby="sheet-h">
      ${sheetHead(p, v2 ? '<span class="tag ink">Revision 2</span>' : '')}
      <h1 class="sheet-h" id="sheet-h" style="margin-top:2px">${p.title}</h1>
      <p class="sheet-sum">Ridgeline Tech Services in India charges Ridgeline Outdoor Inc. in the US for engineering work at cost plus ${v2 ? '15%, per your 2026 transfer pricing policy' : '8%, per the 2023 agreement'}.</p>
      <div class="sec"><h2 class="sec-h">What will change</h2><div class="tbl"><table class="ledger"><thead><tr><th>Account</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>
        <tr class="grp"><td colspan="3">Ridgeline Tech Services Pvt. Ltd., India (INR)</td></tr>
        <tr class="add"><td>Intercompany receivable from Ridgeline Outdoor Inc.</td><td class="r">${c(inr(I1), inr(I2))}</td><td class="r"></td></tr>
        <tr class="add"><td>Revenue: engineering services, intercompany</td><td class="r"></td><td class="r">${c(inr(I1), inr(I2))}</td></tr>
        <tr class="grp"><td colspan="3">Ridgeline Outdoor Inc., United States (USD)</td></tr>
        <tr class="add"><td>R&amp;D expense: engineering services, intercompany</td><td class="r">${c(usd(U1), usd(U2))}</td><td class="r"></td></tr>
        <tr class="add"><td>Intercompany payable to Ridgeline Tech Services</td><td class="r"></td><td class="r">${c(usd(U1), usd(U2))}</td></tr>
        <tr class="grp"><td colspan="3">Consolidation, queued for the close</td></tr>
        <tr><td>Eliminate intercompany revenue and expense</td><td class="r muted" colspan="2">${c(usd(U1), usd(U2))} each side</td></tr>
        <tr><td>Eliminate intercompany receivable and payable</td><td class="r muted" colspan="2">${c(usd(U1), usd(U2))} each side</td></tr>
      </tbody></table></div></div>
      <div class="sec"><h2 class="sec-h">Why the agent proposed this</h2><p class="reason">${refs(reason)}</p></div>
      <div class="sec"><h2 class="sec-h">Evidence</h2>${evList(ev, v2 && S.fresh === 'Markup matches transfer pricing policy' ? 4 : -1)}</div>
      ${sigBlock(p.id)}
    </article>
    <section class="panel" style="margin-top:18px"><h2 class="h2">Conversation</h2><div class="thread" id="ic-thread">${threadHTML()}</div>${composer}</section>
    </div>
    <aside class="rail" aria-label="Review and sign">${actions}${expertCard}${railWhy(p)}${railChecks(checks)}${railConf(conf, confWhy)}</aside></div>`;
}

/* ---------- CFO: authority ---------- */
function promoCard() {
  return `<section class="promo" aria-labelledby="promo-h">
    <div class="callout"><span class="ck ink" aria-hidden="true">${ic('shield', 12)}</span><div><h2 class="h2" id="promo-h">Accounting Agent has earned a bigger line for bank matches</h2><p>Recommended: raise it from $2,500 to $10,000 per match.</p></div></div>
    <div class="promo-grid">
      <div><h3>The evidence</h3><ul class="ticks">
        <li>${ckIcon('pass')}<span>Your team signed 1,812 of its bank matches in 60 days, 99.6% without edits</span></li>
        <li>${ckIcon('pass')}<span>No reversals. The 7 edits were all FX rounding under $1</span></li>
        <li>${ckIcon('pass')}<span>At 2,140 similar Intuit companies, the same agent signs up to $10,000 with 99.4% left unedited</span></li>
        <li>${ckIcon('pass')}<span>Returns about 41 hours a month to Leo Park’s team</span></li>
      </ul></div>
      <div><h3>The safeguards</h3><ul class="ticks">
        <li>${ckIcon('info')}<span>Leo Park reviews a random 5% sample each week</span></li>
        <li>${ckIcon('info')}<span>Drops back to $2,500 if the no-edit rate falls below 98% for 7 days</span></li>
        <li>${ckIcon('info')}<span>Pauses after any reversal over $1,000</span></li>
      </ul>
      <div class="row-end" style="justify-content:flex-start"><button class="btn btn-ink" data-act="promote">${ic('pen')}Raise to $10,000</button><button class="btn btn-ghost" data-act="notNow">Not now</button></div></div>
    </div></section>`;
}
function vAuthority() {
  const rows = trustRows();
  const done = S.promoted ? `<div class="banner info"><span class="ck ink" aria-hidden="true">${ic('pen', 12)}</span><p><b>You raised the Accounting Agent’s line to $10,000 at ${S.promotedAt}.</b> It drops back on its own if its no-edit rate falls below 98%.</p><span></span></div>` : '';
  return `<div class="phead"><div><h1 class="h1">Agent authority</h1><p class="lede">Each agent signs on its own only up to the line it has earned from your team’s signatures. Above the line, work comes to a person.</p></div></div>
  ${S.promoted ? done : promoCard()}
  <div class="panel-h"><h2 class="h2">Trust lines</h2><span class="small muted">Lines rise only when you approve. They fall on their own.</span></div>
  <div class="tlist">${rows.map(r => `<div class="tlrow" data-row="${r.key}"><div>${agentChip(r.ag, true)}<div class="tl-task">${r.task}</div></div><div><div class="tl-lbl">${r.label}</div>${trustLine(r)}</div><div class="tl-rec">${r.rec}<span>${r.n}</span></div></div>`).join('')}</div>
  <div class="cols" style="margin-top:22px">
    <section class="panel"><h2 class="h2">Always a person</h2><p class="small muted" style="margin:4px 0 8px">No agent can earn authority here, whatever its record.</p><ul class="human">${ALWAYS_HUMAN.map(([t, d]) => `<li>${ic('lock', 16)}<div>${t}<span>${d}</span></div></li>`).join('')}</ul></section>
    <section class="panel"><h2 class="h2">How lines move</h2><ul class="ticks" style="margin-top:8px">
      <li>${ckIcon('pass')}<span>Every signature is evidence. Edits and rejections count against an agent; clean signatures count for it.</span></li>
      <li>${ckIcon('pass')}<span>An agent’s record at similar Intuit companies can fast-track it, but only your approval raises its line here.</span></li>
      <li>${ckIcon('pass')}<span>Lines drop automatically if the no-edit rate falls below 98% for 7 days, or after a reversal over $1,000.</span></li>
      <li>${ckIcon('pass')}<span>A sample of what agents sign alone goes to your controller every week.</span></li>
    </ul></section>
  </div>`;
}

/* ---------- CFO: close ---------- */
function taskItem([name, st, meta]) {
  if (st === 'done') {
    const m = meta && /^[A-Z]+-\d/.test(meta) ? (S.signed[meta] ? `${meta}, signed by you` : `${meta}, rejected by you`) : meta;
    return `<li class="task">${ckIcon('pass')}<div><div class="task-n">${name}</div><div class="task-m">${m}</div></div></li>`;
  }
  if (st === 'sign') return `<li class="task">${ckIcon('ink')}<div><div class="task-n">${name}</div><button class="linkbtn" data-act="open" data-arg="${meta}">${meta} needs your signature</button></div></li>`;
  return `<li class="task">${ckIcon('fail')}<div><div class="task-n">${name}</div><button class="linkbtn bad" data-act="gstFind">Blocked by 143 mismatches</button></div></li>`;
}
function vClose() {
  const T = closeTasks(), cs = closeStats(), all = cs.done === cs.total;
  const lock = S.locked ? `<span class="tag ok">${ic('lock', 13)}Locked by Maya Okafor</span>` : `<button class="btn btn-ink" data-act="lock"${all ? '' : ' disabled'}>${ic('lock', 17)}Lock September</button><p class="hint">${all ? 'Everything is signed. Locking is always done by a person.' : `${cs.total - cs.done} of ${cs.total} tasks still need a signature or a fix.`}</p>`;
  return `<div class="phead"><div><h1 class="h1">September close</h1><p class="lede">Day 2 of 3. Agents reconcile all month, so the close is mostly signatures.</p></div><div class="lockbox">${lock}</div></div>
  <div class="closeprog"><div class="cp-num">${cs.pct}%</div><div class="cp-bar" role="img" aria-label="${cs.done} of ${cs.total} tasks done"><i style="width:${cs.pct}%"></i></div></div>
  ${S.gst.installed ? '' : `<div class="banner warn"><span class="ck fail" aria-hidden="true">${ic('x', 12)}</span><p><b>India is blocked on GST input credit.</b> 143 purchase bills don’t match what suppliers filed, putting ₹21.6 lakh of credit at risk. None of your agents can fix this.</p><button class="btn btn-primary" data-act="gstFind">Find an agent</button></div>`}
  <div class="lanes">${Object.values(T).map(e => { const d = e.tasks.filter(t => t[1] === 'done').length; return `<section class="lane"><div class="lane-h"><h2 class="h3">${e.name}</h2><span class="small muted">${d} of ${e.tasks.length}</span></div><div class="lane-bar"><i style="width:${Math.round(d / e.tasks.length * 100)}%"></i></div><ul>${e.tasks.map(taskItem).join('')}</ul></section>`; }).join('')}</div>
  <section class="panel" style="margin-top:20px"><div class="panel-h"><h2 class="h2">Business days to close</h2><span class="small muted">2026. Dashed line: the 3-day target</span></div>${bars([10.5, 10, 9, 8, 7, 6, 5, 4], ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], { target: 3, hi: 7, label: 'Days to close fell from 10.5 in January to 4 in August' })}<p class="small muted" style="margin-top:6px">Agents began reconciling daily in April. Only 18% of finance teams close in 3 days or less.</p></section>`;
}

/* ---------- CFO: explain ---------- */
function vExplain() {
  const x = S.xsel;
  const cell = (key, val, delta) => `<button class="xnum${x === key ? ' on' : ''}" data-act="explain" data-arg="${key}" aria-pressed="${x === key}"><span class="xv">${val}</span><span class="xd ${delta.charAt(0) === '−' ? 'neg' : 'pos'}">${delta}</span></button>`;
  return `<div class="phead"><div><h1 class="h1">Explain</h1><p class="lede">Every number can say why it moved and who touched it. Click one.</p></div></div>
  <div class="xgrid">
    <div class="stack">
      <section class="panel"><h2 class="h2">September at a glance</h2><table class="ledger glance"><tbody>
        <tr><td>Revenue</td><td class="r">${cell('rev', '$7.84M', '+4.2%')}</td></tr>
        <tr><td>Gross margin</td><td class="r">${cell('cons', '44.1%', '−0.9 pts')}</td></tr>
        <tr><td>Operating expenses</td><td class="r">${cell('opex', '$2.71M', '+1.8%')}</td></tr>
        <tr><td>EBITDA</td><td class="r">${cell('ebitda', '$0.75M', '+3.2%')}</td></tr>
      </tbody></table></section>
      <section class="panel"><h2 class="h2">Gross margin by entity</h2><table class="ledger glance"><tbody>
        <tr><td>United States</td><td class="r">${cell('us', '45.6%', '−0.4 pts')}</td></tr>
        <tr><td>Canada</td><td class="r">${cell('ca', '43.8%', '+0.6 pts')}</td></tr>
        <tr><td>United Kingdom</td><td class="r">${cell('uk', '38.2%', '−3.1 pts')}</td></tr>
      </tbody></table><p class="small muted" style="margin-top:8px">India is a cost center. Its costs are charged to the US at cost plus a markup.</p></section>
    </div>
    <section class="panel xpanel" aria-live="polite">${x ? xPanel(x) : `<div class="empty">${ic('explain', 28)}<b style="margin-top:10px">Pick a number</b><span>Try UK gross margin. It fell the most.</span></div>`}</section>
  </div>`;
}
function xPanel(key) {
  const e = EXPLAIN[key];
  return `<p class="small muted">Why it moved</p><h2 class="xq">${e.q}</h2><p class="xp-text" id="xp-text"></p><div id="xp-more" hidden>${key === 'uk' ? ukMore() : `<div class="dep ok">${ckIcon('pass')}<span>Every entry behind this answer is signed.</span></div>`}</div>`;
}
function ukMore() {
  const s = decided('ACR-2207');
  return `<div style="margin-top:14px">${waterfall()}</div>
  <h3 class="sec-h" style="margin-top:12px">Where each number comes from</h3>
  <ul class="lineage">
    <li><span class="lin-pts">−1.9</span><div>Freight surcharge: £18,550 on £976,300 of UK sales<p>From ACR-2207, drafted by Close Agent at 01:12 from Northsea Line’s notice. ${S.signed['ACR-2207'] ? 'Signed by you.' : S.rejected['ACR-2207'] ? 'Rejected by you.' : 'Not signed yet.'} <button class="linkbtn" data-act="open" data-arg="ACR-2207">Open ACR-2207</button></p></div></li>
    <li><span class="lin-pts">−0.8</span><div>Channel mix: wholesale is 46% of UK sales, up from 39%<p>212 wholesale orders from IES Commerce, matched to invoices by Accounting Agent.</p></div></li>
    <li><span class="lin-pts">−0.4</span><div>Exchange rate: the pound fell from $1.3600 to $1.3410<p>Applied to 18 purchase orders in dollars. Revalued by Close Agent within its $50,000 line.</p></div></li>
  </ul>
  ${s ? `<div class="dep ok">${ckIcon('pass')}<span>Every entry behind this answer has been decided by a person.</span></div>` : `<div class="dep">${ckIcon('warn')}<span>This answer depends on one unsigned change, ACR-2207. If you edit or reject it, the explanation updates.</span></div>`}`;
}

/* ---------- CFO: branches ---------- */
function vBranches() {
  const st = S.branch.status;
  return `<div class="phead"><div><h1 class="h1">Branches</h1><p class="lede">Copy your books, change anything, and compare. Branches never touch actuals: they merge into plans, or become proposals someone signs.</p></div></div>
  <div class="brgrid">
    <section class="panel"><h2 class="h2">Try a what-if</h2>
      <div class="composer"><input class="input" id="br-in" value="${esc(BR_DEFAULT)}" aria-label="Describe a what-if"${st ? ' disabled' : ''}><button class="btn btn-primary" data-act="branchRun"${st ? ' disabled' : ''}>${ic('branch', 17)}${st && st !== 'running' ? 'Branch created' : 'Create branch'}</button></div>
      ${st === 'running' ? `<div class="sec"><h2 class="sec-h">Working on the branch</h2><ul class="steps" id="br-steps">${stepsHTML(BRANCH_STEPS, S.branch.done, true)}</ul></div>` : st ? branchResult(st) : '<p class="small muted" style="margin-top:12px">Describe a change in plain words. Autograph builds the branch, applies your policies, and runs your checks on it.</p>'}
    </section>
    <aside class="panel"><h2 class="h2">Your branches</h2><ul class="brlist" style="margin-top:8px">
      <li><b>mainline</b><span>Actuals through September 30</span></li>
      ${st && st !== 'running' ? `<li class="on"><b>plan/fy27-bengaluru</b><span>${st === 'merged' ? 'Merged into FY27 plan v3' : 'Created by you just now'}</span></li>` : ''}
      ${S.gst.trial === 'done' || S.gst.installed ? `<li><b>trial/gstmatch</b><span>${S.gst.installed ? 'Trial ended: GSTMatch installed' : 'Partner trial, India only'}</span></li>` : ''}
      <li><b>what-if/lose-top-retailer</b><span>Leo Park, 3 days ago</span></li>
    </ul></aside>
  </div>`;
}
function branchResult(st) {
  return `<div class="sec">
    <div class="panel-h"><h2 class="h2">Branch compared with mainline</h2>${st === 'merged' ? '<span class="tag ok">Merged into FY27 plan v3</span>' : ''}</div>
    <div class="tbl"><table class="ledger cmp"><thead><tr><th>2027, consolidated</th><th>Mainline</th><th>Branch</th><th>Difference</th></tr></thead><tbody>
      <tr><td>Annual cost of the 20 roles</td><td>$4.06M</td><td>$0.86M</td><td class="pos">−$3.20M</td></tr>
      <tr><td>EBITDA</td><td>$9.8M</td><td>$11.5M</td><td class="pos">+$1.7M</td></tr>
      <tr><td>Lowest cash, next 24 months</td><td>$6.1M</td><td>$6.9M</td><td class="pos">+$0.8M</td></tr>
      <tr><td>Group effective tax rate</td><td>24.1%</td><td>24.6%</td><td class="neg">+0.5 pts</td></tr>
    </tbody></table></div>
    <p class="note">EBITDA gains less than the full saving because hiring ramps through the year. Intercompany charges of $0.99M a year cancel out in consolidation.</p>
    <h3 class="sec-h" style="margin-top:18px">Checks on the branch</h3>
    <ul class="checks">
      <li>${ckIcon('pass')}<div><div class="ck-t">Intercompany charge at cost plus 15%</div><div class="ck-d">Matches your 2026 transfer pricing policy</div></div></li>
      <li>${ckIcon('pass')}<div><div class="ck-t">Salaries within your India pay bands</div></div></li>
      <li>${ckIcon('warn')}<div><div class="ck-t">Review how work is directed across borders</div><div class="ck-d">Some setups can create a taxable presence for the US company in India.</div><div class="ck-by">Check published by Kessler &amp; Co.</div></div></li>
    </ul>
    <p class="note">Assumptions: US engineers at $165,000 plus 23% for taxes and benefits; Bengaluru at ₹34 lakh plus 12% overhead; ₹88.20 per dollar.</p>
    <div class="row-end" style="justify-content:flex-start">${st === 'merged' ? '' : '<button class="btn btn-primary" data-act="branchMerge">Merge into FY27 plan</button>'}<button class="btn btn-secondary" data-act="branchAsk">Ask Kessler &amp; Co. about the flag</button></div>
  </div>`;
}

/* ---------- CFO: exchange ---------- */
function xcard(a, preview) {
  const ctx = S.exch.ctx && !S.gst.installed;
  const feat = !preview && a.id === 'gst' && ctx;
  const installed = a.installed || (a.id === 'gst' && S.gst.installed && !preview);
  const badges = `${a.verified ? `<span class="tag ok">${ic('check', 12)}Verified</span>` : '<span class="tag">Not verified</span>'}${a.assured ? '<span class="tag ink">Intuit Assurance</span>' : ''}${installed ? '<span class="tag">Installed</span>' : ''}`;
  let acts;
  if (preview) acts = '<span class="btn btn-primary btn-sm" aria-hidden="true">Try on a branch, free</span>';
  else if (a.id === 'gst') acts = S.gst.installed ? (decided('GST-0131') ? '<span class="small muted">Drafting within its granted scope</span>' : '<button class="btn btn-secondary btn-sm" data-act="open" data-arg="GST-0131">See its proposals</button>') : S.gst.trial === 'done' ? '<button class="btn btn-primary btn-sm" data-act="gstInstall">Install</button><button class="btn btn-ghost btn-sm" data-act="gstResults">Trial results</button>' : '<button class="btn btn-primary btn-sm" data-act="gstTrial">Try on a branch, free</button>';
  else if (a.installed) acts = '<span class="small muted">Signing within a CA$5,000 line</span>';
  else acts = '<button class="btn btn-secondary btn-sm" data-act="soon">Try on a branch, free</button>';
  return `<article class="xcard${feat ? ' feat' : ''}">
    <div class="xc-top"><span class="av p lg" aria-hidden="true">${a.ab}</span><div><h2 class="h3">${a.n}</h2><div class="small muted">${a.pub}</div></div></div>
    <div class="xc-badges">${badges}</div>
    <p class="xc-d">${a.d}</p>
    ${feat ? '<p class="small" style="color:var(--act);font-weight:600">Best record for this problem, and backed by Intuit Assurance</p>' : ''}
    <dl class="xc-facts"><div><dt>Track record</dt><dd>${a.rec}${a.cos && a.rec !== 'Read-only' ? `, ${a.cos} companies` : ''}</dd></div><div><dt>Price</dt><dd>${a.price}</dd></div></dl>
    <div class="xc-act">${acts}</div>
  </article>`;
}
function vExchange() {
  const ctx = S.exch.ctx && !S.gst.installed;
  const list = ctx ? EXCHANGE.filter(a => a.cat === 'India tax') : EXCHANGE;
  return `<div class="phead"><div><h1 class="h1">Agent Exchange</h1><p class="lede">Agents from Intuit partners. Every one runs on the same rails: it proposes, your checks run, and it signs only within the line it earns at your company.</p></div></div>
  ${ctx ? `<div class="banner info"><span class="ck info" aria-hidden="true">${ic('info', 12)}</span><p><b>Showing agents that can fix India’s GST mismatches.</b> 143 bills, ₹21.6 lakh of input credit at risk.</p><button class="btn btn-ghost btn-sm" data-act="exAll">Show all agents</button></div>` : ''}
  <div class="xcards">${list.map(a => xcard(a)).join('')}</div>`;
}

/* ---------- developer ---------- */
function devJourney(cur) {
  const idx = DEV_STEPS.findIndex(s => s[0] === cur);
  return `<div class="journey"><p class="small muted">Replay: how LedgerLoop built GSTMatch, from a demand signal to 212 companies</p><ol class="jsteps">${DEV_STEPS.map(([k, l, d], i) => `<li class="${i === idx ? 'on' : i < idx ? 'past' : ''}"><button data-act="go" data-arg="${k}"${i === idx ? ' aria-current="step"' : ''}><span class="jn">${i < idx ? ic('check', 13) : i + 1}</span><span><b>${l}</b><span class="jd">${d}</span></span></button></li>`).join('')}</ol></div>`;
}
function vSignals() {
  const s = SIGNALS.find(x => x.id === S.dev.sig) || SIGNALS[0];
  const detail = s.id !== 'gst'
    ? `<h2 class="h2">${s.need}</h2><p class="small muted" style="margin-top:6px">${s.cos} companies, ${s.hb} handbacks a month. This replay follows the GST signal.</p><button class="btn btn-secondary btn-sm" style="margin-top:12px" data-act="sig" data-arg="gst">Back to the GST signal</button>`
    : `<h2 class="h2">${s.need}</h2><p class="small muted" style="margin-top:4px">1,240 companies, up 18% this quarter</p>
      <h3 class="sec-h" style="margin-top:14px">What their teams do today</h3><ul class="plain small">${SIG_GST.today.map(t => `<li>${t}</li>`).join('')}</ul>
      <h3 class="sec-h" style="margin-top:12px">Why Intuit’s agents hand it back</h3><ul class="plain small">${SIG_GST.why.map(t => `<li>${t}</li>`).join('')}</ul>
      <p class="small" style="margin-top:12px"><b>${SIG_GST.value}</b></p>
      <button class="btn btn-primary" style="width:100%;margin-top:14px" data-act="go" data-arg="build">${ic('code', 17)}Build for this signal</button>
      <p class="hint">One click gives you a sandbox with three twin companies and test keys.</p>`;
  return `${devJourney('signals')}
  <div class="phead"><div><h1 class="h1">Demand signals</h1><p class="lede">When an Intuit agent hands work back to a person, Autograph records why. Grouped and anonymized, those handbacks show partners what to build. Each signal covers at least 50 companies.</p></div></div>
  <div class="sgrid">
    <section class="panel flush"><div class="tbl"><table class="ledger"><thead><tr><th>Unmet need</th><th class="r">Companies</th><th class="r">Handbacks a month</th><th class="r">Fees a month, est.</th><th>Agents today</th></tr></thead><tbody>${SIGNALS.map(x => `<tr${x.id === s.id ? ' class="on"' : ''}><td><button class="linkbtn strong" data-act="sig" data-arg="${x.id}">${x.need}</button></td><td class="r">${x.cos}</td><td class="r">${x.hb}</td><td class="r">${x.pool}</td><td class="muted">${x.agents}</td></tr>`).join('')}</tbody></table></div></section>
    <aside class="panel">${detail}</aside>
  </div>`;
}
function hl(src, lang) {
  const e = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (lang === 'yaml') return e.split('\n').map(line => {
    let code = line, com = '';
    const ci = line.indexOf('#');
    if (ci >= 0) { code = line.slice(0, ci); com = line.slice(ci); }
    code = code.replace(/("[^"]*")/g, '<span class="s">$1</span>').replace(/^(\s*-?\s*)([\w.]+)(:)/, '$1<span class="k">$2</span>$3');
    return code + (com ? `<span class="c">${com}</span>` : '');
  }).join('\n');
  return e.replace(/(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"|`[^`]*`)|\b(import|from|export|default|async|await|const|for|of|if|continue|return)\b/g, (m, c, s, k) => c ? `<span class="c">${c}</span>` : s ? `<span class="s">${s}</span>` : `<span class="k">${k}</span>`);
}
function vBuild() {
  const d = S.dev, tab = d.tab;
  let body;
  if (!d.gen && !d.genBusy) body = '<pre class="code"><span class="c"># Describe your agent above, then choose Generate.</span></pre>';
  else if (tab === 'tools' && d.gen) body = `<ul class="tools">${TOOLS.map(([n, t]) => `<li><code>${n}</code><span>${t}</span></li>`).join('')}</ul>`;
  else body = `<pre class="code" id="code">${d.genBusy ? '' : hl(tab === 'ts' ? CODE : MANIFEST, tab === 'ts' ? 'ts' : 'yaml')}</pre>`;
  return `${devJourney('build')}
  <div class="phead"><div><h1 class="h1">Build GSTMatch</h1><p class="lede">Describe the agent and Autograph drafts the manifest and code. The platform already handles approvals, audit trail, undo, consent and billing, so you write only the matching logic.</p></div></div>
  <div class="bgrid"><div class="stack">
    <section class="panel"><label class="sec-h" for="dev-desc">Describe your agent</label><textarea id="dev-desc" class="input ta" rows="3">Match Indian purchase bills to suppliers’ GSTR-2B filings, propose input-credit adjustments, and draft reminders to suppliers who haven’t filed.</textarea>
      <div class="row-end" style="margin-top:12px"><button class="btn btn-primary" data-act="devGen"${d.gen || d.genBusy ? ' disabled' : ''}>${ic('spark', 17)}${d.gen ? 'Generated' : d.genBusy ? 'Generating' : 'Generate the agent'}</button></div></section>
    <section class="panel flush"><div class="tabs" role="tablist">${[['yaml', 'agent.yaml'], ['ts', 'agent.ts'], ['tools', 'Tools (MCP)']].map(([k, l]) => `<button class="tab${tab === k ? ' on' : ''}" role="tab" aria-selected="${tab === k}" data-act="devTab" data-arg="${k}"${d.gen ? '' : ' disabled'}>${l}</button>`).join('')}</div>${body}</section>
  </div>
  <aside class="stack">
    <section class="panel"><h2 class="h2">Your sandbox</h2><dl class="kv" style="margin-top:10px">
      <div><dt>Twin companies</dt><dd>3 ready</dd></div>
      <div><dt>MCP endpoint</dt><dd>mcp.sandbox.ies.example/v1</dd></div>
      <div><dt>SDKs</dt><dd>TypeScript, Python</dd></div>
      <div><dt>Test key</dt><dd>sk_test_…4f2a</dd></div>
      <div><dt>Cost to build</dt><dd>Free. Reads are never metered</dd></div>
    </dl></section>
    <section class="panel"><h2 class="h2">The platform handles</h2><ul class="ticks" style="margin-top:8px">${['Proposals, signatures and undo', 'Customers’ checks on every change', 'Consent and data scopes', 'Expert escalation', 'Billing, tax and payouts', 'Trust lines at every customer'].map(t => `<li>${ckIcon('pass')}<span>${t}</span></li>`).join('')}</ul></section>
    ${d.gen ? `<button class="btn btn-primary btn-lg" data-act="go" data-arg="test">${ic('test', 17)}Test on twin companies</button>` : ''}
  </aside></div>`;
}
function gatesTable(r) {
  const v = r === 2, allOk = GATES.every(g => v ? g.ok2 : g.ok1);
  return `<div class="panel-h"><h2 class="h2">Results, run ${r}</h2>${allOk ? '<span class="tag ok">Every gate passed</span>' : '<span class="tag bad">1 gate failed</span>'}</div>
  <div class="tbl"><table class="ledger gates"><thead><tr><th>Gate</th><th>Needs</th><th class="r">Result</th><th class="r"><span class="sr">Status</span></th></tr></thead><tbody>${GATES.map(g => { const ok = v ? g.ok2 : g.ok1; return `<tr><td>${g.name}</td><td class="muted">${g.need}</td><td class="r"><b>${v ? g.v2 : g.v1}</b></td><td class="r">${ckIcon(ok ? 'pass' : 'fail')}</td></tr>`; }).join('')}</tbody></table></div>
  <h3 class="sec-h" style="margin-top:16px">Red-team tests</h3>
  <ul class="checks">${REDTEAM.map(([t, d]) => `<li>${ckIcon('pass')}<div><div class="ck-t">${t}</div><div class="ck-d">${d}</div></div></li>`).join('')}</ul>`;
}
function vTest() {
  const r = S.dev.evalRun, busy = S.dev.evalBusy;
  return `${devJourney('test')}
  <div class="phead"><div><h1 class="h1">Test on twin companies</h1><p class="lede">Twins are synthetic companies built from real patterns, with known right answers. An agent must pass every gate, including giving the same answer on repeat runs, before customers can find it.</p></div>
    <button class="btn btn-primary" data-act="devEval"${busy || r > 0 || !S.dev.gen ? ' disabled' : ''}>${ic('play', 16)}${r > 0 ? 'Tests run' : 'Run the tests'}</button></div>
  ${S.dev.gen ? '' : `<div class="banner info"><span class="ck info" aria-hidden="true">${ic('info', 12)}</span><p>Generate the agent first.</p><button class="btn btn-secondary btn-sm" data-act="go" data-arg="build">Go to Build</button></div>`}
  <div class="tgrid">
    <section class="panel"><h2 class="h2">Twin companies</h2><p class="small muted" style="margin:2px 0 10px">6,850 bills with known answers</p><ul class="twins">${TWINS.map(t => `<li>${ckIcon(r > 0 ? 'pass' : 'info')}<div><b>${t.n}</b><div class="small muted">${t.d}</div></div></li>`).join('')}</ul>${busy ? `<ul class="steps" id="ev-steps" style="margin-top:14px">${stepsHTML(S.dev.evSteps, S.dev.evDone, true)}</ul>` : ''}</section>
    <section class="panel">${r === 0 ? emptyState(busy ? 'Running the tests' : 'No results yet', busy ? 'Every twin runs 8 times, to check the agent gives the same answer.' : 'Run the tests to see how GSTMatch does.') : gatesTable(r)}</section>
  </div>
  ${r === 1 ? `<section class="panel" style="margin-top:20px"><div class="callout"><span class="ck info" aria-hidden="true">${ic('spark', 12)}</span><div><h2 class="h3">Why it missed the gate</h2><p>71% of the misses were supplier invoice numbers with financial-year prefixes, like RKT/25-26/0045, which the books store as 45. Normalize prefixes and leading zeros before matching.</p><div class="diffline"><span class="del">- const key = bill.number;</span>
<span class="add">+ const key = normalizeInvoiceNo(bill.number); // drops "25-26/" prefixes and leading zeros</span></div><button class="btn btn-primary" data-act="devFix"${busy ? ' disabled' : ''}>Apply the fix and run again</button></div></div></section>` : ''}
  ${r === 2 ? `<section class="panel" style="margin-top:20px"><div class="callout"><span class="ck pass" aria-hidden="true">${ic('check', 12)}</span><div><h2 class="h3">GSTMatch passed every gate</h2><p>It can be listed as Verified. With a wrong-claim rate of 0.3%, it also qualifies for Intuit Assurance.</p><button class="btn btn-primary" data-act="go" data-arg="publish">${ic('publish', 17)}Continue to publish</button></div></div></section>` : ''}`;
}
function vPublish() {
  const d = S.dev, ready = d.evalRun === 2;
  const prev = { id: 'gst-prev', n: 'GSTMatch', pub: 'LedgerLoop', ab: 'GM', d: EXCHANGE[0].d, rec: 'New. 97.9% on twin companies', cos: 0, price: d.price === 'sub' ? '$180 a month' : '$0.12 per matched invoice', verified: true, assured: d.assured };
  return `${devJourney('publish')}
  <div class="phead"><div><h1 class="h1">Publish</h1><p class="lede">Set a price, decide whether Intuit backs your agent, and go live where customers need it.</p></div></div>
  ${ready ? '' : `<div class="banner info"><span class="ck info" aria-hidden="true">${ic('info', 12)}</span><p>Pass every test gate first.</p><button class="btn btn-secondary btn-sm" data-act="go" data-arg="test">Go to Test</button></div>`}
  <div class="pubgrid">
    <section class="panel">
      <h2 class="h2">How you charge</h2>
      <button class="popt${d.price === 'outcome' ? ' on' : ''}" data-act="devPrice" data-arg="outcome" aria-pressed="${d.price === 'outcome'}"><span class="dotr"></span><span><b>Per outcome</b><span>$0.12 per matched invoice, $49 monthly minimum</span></span></button>
      <button class="popt${d.price === 'sub' ? ' on' : ''}" data-act="devPrice" data-arg="sub" aria-pressed="${d.price === 'sub'}"><span class="dotr"></span><span><b>Subscription</b><span>$180 a month per company</span></span></button>
      <div class="kvs"><div><span>Free trials on a branch</span><b>On</b></div><div><span>You keep</span><b>85% of fees</b></div><div><span>Intuit keeps 15% for</span><b>Billing, tax, distribution</b></div><div><span>Reads and API calls</span><b>Never metered</b></div></div>
      <h2 class="h2" style="margin-top:22px">Intuit Assurance</h2>
      <button class="switch" data-act="devAssure" aria-pressed="${d.assured}"><span class="sw" aria-hidden="true"></span><span>Intuit covers customers’ interest and penalties from wrong credit claims, up to $250,000 a year each. Customers pay 3% more. You qualify because your wrong-claim rate is 0.3%.</span></button>
      <h2 class="h2" style="margin-top:22px">Where customers find it</h2>
      <p class="small" style="margin-top:4px;color:var(--ink-2)">Inside their close, at the moment an Intuit agent hands GST matching back to a person. Today that’s 1,240 companies.</p>
      ${d.pubBusy || d.published ? `<ul class="steps" id="pub-steps" style="margin-top:16px">${stepsHTML(PUB_STEPS, d.published ? PUB_STEPS.length : d.pubDone, !d.published)}</ul>` : ''}
      <div class="row-end">${d.published ? `<button class="btn btn-primary" data-act="go" data-arg="earnings">${ic('earn', 17)}See earnings</button>` : `<button class="btn btn-primary btn-lg" data-act="devPublish"${ready && !d.pubBusy ? '' : ' disabled'}>${ic('publish', 17)}Publish as Verified</button>`}</div>
    </section>
    <aside><p class="small muted" style="margin-bottom:8px">How customers will see it</p>${xcard(prev, true)}</aside>
  </div>`;
}
function vEarnings() {
  const inst = S.gst.installed, cos = 212 + (inst ? 1 : 0);
  const feed = [];
  if (inst) feed.push([S.gst.at, '<b>Ridgeline Outdoor Co.</b> installed GSTMatch after a free branch trial. It starts with drafts only.', true]);
  feed.push(['Yesterday', '<b>Coastal Apparel</b> raised GSTMatch’s line to ₹50,000 after 30 signed drafts.'], ['Tuesday', '<b>Sahyadri Foods</b> installed after a branch trial recovered ₹9.2 lakh.'], ['Monday', 'August payout of $15,210 sent.']);
  return `${devJourney('earnings')}
  <div class="phead"><div><h1 class="h1">Earnings</h1><p class="lede">Month 7. You’re paid for outcomes customers signed, never for API calls.</p></div></div>
  ${d_pubBanner()}
  <section class="metrics" aria-label="GSTMatch this month">
    <div class="metric"><div class="m-label">Companies using GSTMatch</div><div class="m-val">${cos}</div><div class="m-sub">${inst ? 'Including Ridgeline, just now' : '41% of branch trials become installs'}</div></div>
    <div class="metric"><div class="m-label">Invoices matched this month</div><div class="m-val">184,300</div><div class="m-sub">98.7% signed without edits</div></div>
    <div class="metric"><div class="m-label">Fees this month</div><div class="m-val">$22,116</div><div class="m-sub">$0.12 per matched invoice</div></div>
    <div class="metric"><div class="m-label">Your payout</div><div class="m-val">$18,799</div><div class="m-sub">85% of fees, paid monthly</div></div>
  </section>
  <div class="cols">
    <section class="panel"><div class="panel-h"><h2 class="h2">Monthly payout</h2><span class="small muted">Months since launch</span></div>${bars([0.4, 2.1, 4.8, 7.9, 11.6, 15.2, 18.8], ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'], { fmt: v => '$' + v + 'K', hi: 6, label: 'Monthly payout grew from $0.4K in month 1 to $18.8K in month 7' })}</section>
    <section class="panel"><h2 class="h2">Latest</h2><ol class="feed" style="margin-top:8px">${feed.map(([t, h, isNew]) => `<li${isNew ? ' class="new"' : ''}><span class="f-time">${t}</span><div><p class="f-body">${h}</p></div></li>`).join('')}</ol></section>
  </div>
  <section class="panel" style="margin-top:20px"><h2 class="h2">Authority GSTMatch has earned</h2><p class="small muted" style="margin-top:2px">Across its ${cos} companies. More authority means more work it can finish, and more outcomes you’re paid for.</p>
    <div class="mix" role="img" aria-label="Drafts only at 64% of companies, signs within a line at 36%"><i style="width:64%;background:var(--rule-2)"></i><i style="width:36%;background:var(--sign)"></i></div>
    <div class="legend"><span><i style="background:var(--rule-2)"></i>Drafts only, 64%</span><span><i style="background:var(--sign)"></i>Signs within a line, 36%</span></div>
  </section>`;
}
const d_pubBanner = () => S.dev.published ? '' : `<div class="banner info"><span class="ck info" aria-hidden="true">${ic('info', 12)}</span><p>In this replay GSTMatch went live on day 15. Publish it to follow the story, or look ahead here.</p><button class="btn btn-secondary btn-sm" data-act="go" data-arg="publish">Go to Publish</button></div>`;

/* ---------- modals ---------- */
function welcomeModal() {
  return `<div class="welcome">
    <p class="small muted">Intuit Enterprise Suite</p>
    <h1 id="mh" class="wm">Autograph</h1>
    <p class="w-lede">AI agents earn signing authority. People sign what matters.</p>
    <p>In about 12 minutes you’ll be <b>Maya</b>, CFO of Ridgeline Outdoor, a 480-person company with entities in the US, Canada, the UK and India. Then you’ll be <b>Riya</b>, who builds agents for the IES Agent Exchange.</p>
    <p class="small muted">All companies, people and numbers are fictional.</p>
    <div class="row-end"><button class="btn btn-ghost" data-act="how">How it works</button><button class="btn btn-secondary" data-act="closeModal">Explore on my own</button><button class="btn btn-primary" data-act="welcomeStart">Start the guided demo</button></div>
  </div>`;
}
function howModal() {
  return `<div class="m-h"><div><h2 class="h2" id="mh">How Autograph works</h2><p>A layer in Intuit Enterprise Suite that decides who may change the books: which agent, up to what amount, and when a person signs instead.</p></div><button class="icon-btn" data-act="closeModal" aria-label="Close">${ic('x')}</button></div>
  <div class="how">
    <div class="how-box"><b>Agents</b><span>Intuit’s own, ones you build with the Claude Agent SDK, and partners’ from the Agent Exchange</span></div>
    <div class="how-arrow">read</div>
    <div class="how-box"><b>One business graph</b><span>Ledger, payroll, HR and commerce for every entity, as live events and queries over an API and MCP</span></div>
    <div class="how-arrow">propose</div>
    <div class="how-box"><b>A proposal, never a direct edit</b><span>The exact entries, the evidence, the agent’s reasoning and its confidence</span></div>
    <div class="how-arrow">check</div>
    <div class="how-box"><b>Checks as code</b><span>From Intuit, your own policies and your accounting firm, run on every proposal</span></div>
    <div class="how-arrow">sign</div>
    <div class="how-split"><div class="how-box ok"><b>Within the agent’s trust line</b><span>The agent signs. A sample goes to your controller.</span></div><div class="how-box ink"><b>Above the line, or always-human</b><span>A person signs: your team, your CPA firm or an Intuit expert</span></div></div>
    <div class="how-arrow">post</div>
    <div class="how-box"><b>A ledger with lineage</b><span>Every number knows who proposed, checked and signed it, and stays reversible until the period is locked</span></div>
  </div>
  <p class="small" style="margin-top:14px;color:var(--ink-2)">Every signature is evidence: it moves the agent’s trust line here and, anonymized, across Intuit’s network. Every handback becomes a demand signal that shows partners what to build, and partners are paid per signed outcome.</p>
  <h3 class="sec-h" style="margin-top:18px">Why authority, not more intelligence</h3>
  <ul class="facts">
    <li>Only 14% of mid-market CFOs fully trust AI to produce accurate accounting data, and 97% say human oversight is critical.<span>Wakefield Research survey of 100 US CFOs, January 2026</span></li>
    <li>On month-end close tasks, the best frontier model met 56% of grading criteria, and none solved the same task on all 8 attempts more than 2.6% of the time.<span>APEX-Accounting benchmark by Mercor and Ramp, July 2026</span></li>
    <li>Fewer than 1 in 3 CFOs would let AI run close orchestration or intercompany reconciliation on its own, yet they expect agents to matter most for multi-entity work.<span>PYMNTS Intelligence, December 2025</span></li>
  </ul>`;
}
function expertModal() {
  const w = S.ic.expertWho || 'rahul';
  return `<div class="m-h"><div><h2 class="h2" id="mh">Get an expert opinion on IC-0931</h2><p>The agent wrote the brief. Pick who reviews it.</p></div><button class="icon-btn" data-act="closeModal" aria-label="Close">${ic('x')}</button></div>
  <div class="opts">${Object.entries(EXPERTS).map(([k, x]) => `<button class="opt${w === k ? ' on' : ''}" data-act="expertPick" data-arg="${k}" aria-pressed="${w === k}"><span class="av h lg" aria-hidden="true">${x.ab}</span><span class="opt-b"><b>${x.name}</b><span>${x.role}</span><span class="small muted">${x.sla}. ${x.price}.</span></span></button>`).join('')}</div>
  <div class="bbox"><p class="sec-h" style="margin:0">Brief, written by the agent</p>
    <p><b>Question.</b> Can Ridgeline Tech Services charge its US parent cost plus ${S.ic.v === 2 ? '15' : '8'}% for July to September 2026 engineering, when the signed 2023 agreement says 8% and the 2026 policy says 15%?</p>
    <p><b>Context.</b> Cost base ₹9.40 crore. ${S.ic.v === 2 ? 'Amendment No. 2 is drafted but not signed.' : 'The agent flagged the conflict and lowered its confidence to 81%.'}</p>
    <p><b>Attached.</b> The proposed entries, the agent’s reasoning and ${S.ic.v === 2 ? 5 : 4} documents. Nothing else in your books is shared.</p></div>
  <div class="row-end"><button class="btn btn-ghost" data-act="closeModal">Cancel</button><button class="btn btn-primary" data-act="expertSend">${ic('send', 16)}Send for review</button></div>`;
}
function trialModal() {
  if (S.gst.trial === 'running') return `<div class="m-h"><div><h2 class="h2" id="mh">Trying GSTMatch on a branch of your books</h2><p>Free. Nothing in your real books changes.</p></div></div><ul class="steps" id="tr-steps">${stepsHTML(TRIAL_STEPS, S.gst.done, true)}</ul>`;
  return `<div class="m-h"><div><h2 class="h2" id="mh">On the branch, GSTMatch would recover ₹18.9 lakh</h2><p>Of the ₹21.6 lakh at risk this quarter. All 131 of its proposals passed your checks.</p></div><button class="icon-btn" data-act="closeModal" aria-label="Close">${ic('x')}</button></div>
  <div class="sumgrid">
    <div class="sum"><b>118</b><span>matches, ₹16.4 lakh of credit</span></div>
    <div class="sum"><b>9</b><span>supplier reminders, ₹2.1 lakh</span></div>
    <div class="sum"><b>4</b><span>bills for your review, ₹0.4 lakh</span></div>
    <div class="sum"><b>131/131</b><span>passed your checks</span></div>
  </div>
  <div class="tbl"><table class="ledger"><thead><tr><th>Bill</th><th>Supplier</th><th class="r">GST</th><th>Supplier’s filing</th><th>Proposal</th></tr></thead><tbody>${TRIAL_ROWS.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="r">${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div>
  <p class="note">At your volume, about $275 a quarter: $0.12 for each invoice it matches.</p>
  <div class="row-end"><button class="btn btn-ghost" data-act="gstDiscard">Discard the branch</button><button class="btn btn-primary" data-act="gstInstall">Install GSTMatch</button></div>`;
}
function installModal() {
  return `<div class="m-h"><div><h2 class="h2" id="mh">Install GSTMatch from LedgerLoop</h2><p>It starts with drafts only at Ridgeline, whatever its record elsewhere.</p></div><button class="icon-btn" data-act="closeModal" aria-label="Close">${ic('x')}</button></div>
  <div class="perm">
    <div><h3>It can read</h3><ul><li>Purchase bills and vendors, India only</li><li>GSTR-2B filings, with your consent</li></ul></div>
    <div><h3>It can propose</h3><ul><li>GST credit adjustments on bills</li><li>Journal entries in India, up to ₹5 lakh each</li><li>Reminder emails to suppliers</li></ul></div>
    <div><h3>It can never</h3><ul><li>Make payments</li><li>See payroll or HR data</li><li>Touch your other entities</li></ul></div>
  </div>
  <div class="bbox">
    <p><b>Authority.</b> Drafts only to start. Because of its record at 212 companies, it can earn a ₹50,000 line after 30 signed drafts here, if you approve.</p>
    <p><b>Intuit Assurance.</b> If a GSTMatch proposal you signed claims credit wrongly, Intuit covers the interest and penalties, up to $250,000 a year.</p>
    <p><b>Price.</b> $0.12 per matched invoice, on your Intuit bill. LedgerLoop is paid only for matches you sign.</p>
  </div>
  <div class="row-end"><button class="btn btn-ghost" data-act="closeModal">Cancel</button><button class="btn btn-primary" data-act="gstConfirm">Install with drafts only</button></div>`;
}

/* ---------- drawers ---------- */
function guideHTML() {
  const d = doneCount();
  const item = g => `<li class="gi${S.guide[g.id] ? ' done' : ''}"><span class="gi-n" aria-hidden="true">${S.guide[g.id] ? ic('check', 13) : ''}</span><div class="gi-b"><b>${g.t}</b><span>${g.d}</span></div><button class="btn btn-sm ${S.guide[g.id] ? 'btn-ghost' : 'btn-secondary'}" data-act="guideGo" data-arg="${g.id}">${S.guide[g.id] ? 'Again' : 'Go'}</button></li>`;
  return `<div class="dr-h"><div><h2 class="h2">Demo guide</h2><p class="small muted">${d} of ${GUIDE.length} done, about 12 minutes</p></div><button class="icon-btn" data-act="closeDrawer" aria-label="Close the guide">${ic('x')}</button></div>
  <div class="dr-b"><div class="gbar"><i style="width:${Math.round(d / GUIDE.length * 100)}%"></i></div>
    <p class="gsec">Maya, CFO of Ridgeline Outdoor</p><ol class="glist">${GUIDE.filter(g => g.p === 'cfo').map(item).join('')}</ol>
    <p class="gsec">Riya, developer at LedgerLoop</p><ol class="glist" style="counter-reset:g 9">${GUIDE.filter(g => g.p === 'dev').map(item).join('')}</ol>
  </div>
  <div class="dr-f small muted">Prototype by Vaasav Srivastava, XLRI Jamshedpur. All companies, people and numbers are fictional.</div>`;
}
function askHTML() {
  const cfo = S.persona === 'cfo';
  const chips = cfo ? ['What needs my signature today?', 'Why did UK margin drop?', 'What’s blocking the close?', 'How much authority do my agents have?'] : ['How do I get paid?', 'What can my agent change?', 'How does my agent earn authority?'];
  const msgs = S.ask.msgs.map(m => m.who === 'you'
    ? `<div class="amsg you"><div class="amsg-who">You</div><div class="amsg-t">${esc(m.text)}</div></div>`
    : `<div class="amsg ai"><div class="amsg-who">Autograph${m.done ? (m.live ? ' <span class="tag ok">Live answer</span>' : ' <span class="tag">Demo answer</span>') : ''}</div><div class="amsg-t">${m.pending ? '<span class="thinking">Thinking</span>' : esc(m.text)}</div></div>`).join('');
  return `<div class="dr-h"><div><h2 class="h2">Ask Autograph</h2><p class="small muted" id="ask-mode">${askModeText()}</p></div><button class="icon-btn" data-act="closeDrawer" aria-label="Close">${ic('x')}</button></div>
  <div class="dr-b" id="ask-log">${msgs || `<p class="small muted">Ask anything about ${cfo ? 'Ridgeline’s September books' : 'building on Autograph'}. Answers name the changes they rely on.</p>`}<div class="chips">${chips.map(c => `<button class="chip" data-act="askChip" data-arg="${esc(c)}"${S.ask.busy ? ' disabled' : ''}>${c}</button>`).join('')}</div></div>
  <div class="dr-f"><div class="composer" style="margin:0"><input id="ask-in" class="input" placeholder="Ask a question" aria-label="Ask a question" autocomplete="off"><button class="btn btn-primary" data-act="askSend"${S.ask.busy ? ' disabled' : ''}>Ask</button></div></div>`;
}
