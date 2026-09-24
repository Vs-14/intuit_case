/* Autograph for Intuit Enterprise Suite: clickable prototype.
   All companies, people, agents and figures are fictional. Exchange rates are assumed. */
'use strict';

/* ---------- helpers ---------- */
const RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, RM ? Math.min(ms, 40) : ms));
const usd = n => (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
const inr = n => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));
const moneyShort = n => n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? '$' + Math.round(n / 1e3) + 'K' : usd(n);
let CLOCK = 9 * 60 + 36;
const now = () => { CLOCK += 1; return String(Math.floor(CLOCK / 60)).padStart(2, '0') + ':' + String(CLOCK % 60).padStart(2, '0'); };

/* ---------- icons ---------- */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  sign: '<path d="M3 16c2.5-.6 3.8-5.5 5.8-5.5 1.6 0 .6 5.5 2.6 5.5 1.7 0 2.7-3.5 4.3-3.5 1.4 0 1.3 3.1 5.3 2.6"/><path d="M3 20.5h18"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  close: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 2.5v4M16 2.5v4"/><path d="m9 15 2 2 4-4"/>',
  explain: '<path d="M4 4v16h16"/><path d="m7.5 14.5 3.5-3.5 3 3 5-6"/>',
  branch: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="7" r="2"/><path d="M6 7v10"/><path d="M18 9c0 5-8 3.5-11.4 8.4"/>',
  exchange: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><path d="M17 13.5v7M13.5 17h7"/>',
  signal: '<path d="M4.5 20v-4M9.5 20v-8M14.5 20V8M19.5 20V4"/>',
  code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M13.5 5l-3 14"/>',
  test: '<path d="M9 3h6M10 3v6L4.6 18.9A1.4 1.4 0 0 0 5.8 21h12.4a1.4 1.4 0 0 0 1.2-2.1L14 9V3"/><path d="M7.2 15h9.6"/>',
  publish: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>',
  earn: '<path d="M12 3v18"/><path d="M16.5 7.5C16 6 14.3 5 12 5S7.5 6.2 7.5 8.2c0 4.6 9 2.4 9 7 0 2-2 3.3-4.5 3.3s-4.3-1-4.8-2.6"/>',
  spark: '<path d="M12 3.5 13.8 9 19.5 10.8 13.8 12.6 12 18.5 10.2 12.6 4.5 10.8 10.2 9 12 3.5Z"/><path d="M19 3v3M17.5 4.5h3"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5Z"/><path d="M4 20a2 2 0 0 0 2 1h13v-3"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 4 2.8 20h18.4L12 4Z"/><path d="M12 10v4.2M12 17v.3"/>',
  info: '<path d="M12 11v6M12 7.5v.3"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c1-4 4.3-6 7.5-6s6.5 2 7.5 6"/>',
  lock: '<rect x="4.5" y="11" width="15" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  play: '<path d="M7 4.5v15l12-7.5-12-7.5Z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  send: '<path d="M4 12 20 4l-6 16-3-7-7-1Z"/>',
  pen: '<path d="M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/><path d="m14 7 3 3"/>',
  doc: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>'
};
const ic = (n, s) => `<svg class="i" width="${s || 18}" height="${s || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[n] || ''}</svg>`;

/* ---------- agents and people ---------- */
const AG = {
  acct: { n: 'Accounting Agent', pub: 'Intuit', ab: 'AC' },
  close: { n: 'Close Agent', pub: 'Intuit', ab: 'CL' },
  ic: { n: 'Intercompany Agent', pub: 'Intuit', ab: 'IC' },
  payroll: { n: 'Payroll Agent', pub: 'Intuit', ab: 'PR' },
  payments: { n: 'Payments Agent', pub: 'Intuit', ab: 'PM' },
  tax: { n: 'Sales Tax Agent', pub: 'Intuit', ab: 'TX' },
  finance: { n: 'Finance Agent', pub: 'Intuit', ab: 'FI' },
  payout: { n: 'PayoutSync', pub: 'Cartwheel Labs', ab: 'PS', partner: true },
  gst: { n: 'GSTMatch', pub: 'LedgerLoop', ab: 'GM', partner: true }
};

const EXPERTS = {
  rahul: {
    name: 'Rahul Iyer, CA', ab: 'RI', role: 'Intuit Expert, India transfer pricing',
    sla: 'Usually replies in about 45 minutes', price: '$140 per review',
    replyV1: 'Use 15%. Your 2026 policy and benchmarking study support it, and 8% is below what the study supports, which invites a challenge from the Indian tax authorities. Ask the agent to revise to 15%, then amend the contract so it matches the charge.\n\nFor 2027, compare the markup with India’s safe-harbour option; electing it can reduce audit risk. I added a check that makes that comparison on every future charge.',
    replyV2: '15% is supportable for July to September: your 2026 policy and benchmarking study back it. Before quarter end, get both boards to sign Amendment No. 2 so the contract matches the charge.\n\nFor 2027, compare the markup with India’s safe-harbour option; electing it can reduce audit risk. I added a check that makes that comparison on every future charge.'
  },
  sarah: {
    name: 'Sarah Kessler, CPA', ab: 'SK', role: 'Partner at Kessler & Co., your accounting firm',
    sla: 'Usually replies within 4 hours', price: 'Billed under your firm’s engagement',
    replyV1: 'I’d go with 15%, not 8%. It’s what your 2026 policy and benchmarking study support, and a markup below the study invites questions in India. Have the agent revise it and let’s get the services agreement amended this quarter.\n\nFor 2027, let’s look at India’s safe-harbour option together. I added a check so every future charge gets that comparison.',
    replyV2: '15% is the right call and it’s supportable. Get Amendment No. 2 signed by both boards before quarter end so the contract matches the charge.\n\nFor 2027, let’s look at India’s safe-harbour option together. I added a check so every future charge gets that comparison.'
  }
};

/* ---------- proposals ---------- */
function initialProps() {
  return [
    { id: 'IC-0931', kind: 'ic', risk: 'high', title: 'Intercompany charge for India engineering, Jul–Sep', ent: 'IN to US', agent: 'ic', usd: 1151020, amt: '$1,151,020', why: 'Policy conflict, and anything over $250,000 needs the CFO', conf: 81 },
    { id: 'AP-5521', kind: 'vendor', risk: 'high', title: 'Bank details change requested for Summit Freight LLC', ent: 'US', agent: 'payments', usd: 0, amt: '$38,900 paused', why: 'Always needs a person: changing where money goes', conf: null },
    { id: 'FA-0117', kind: 'gen', risk: 'med', title: 'Capitalize new warehouse racking in Denver', ent: 'US', agent: 'close', usd: 148300, amt: '$148,300', why: 'Above Close Agent’s $25,000 line for reclasses', conf: 92 },
    { id: 'ACR-2207', kind: 'gen', risk: 'med', title: 'Accrue unbilled ocean freight from Northsea Line', ent: 'UK', agent: 'close', usd: 115930, amt: '£86,450', why: 'Above Close Agent’s $25,000 line for accruals', conf: 94 },
    { id: 'TAX-044', kind: 'gen', risk: 'med', title: 'Register to collect Texas sales tax', ent: 'US', agent: 'tax', usd: 0, amt: 'Registration', why: 'Always needs a person: tax registrations and filings', conf: 88 },
    { id: 'PSY-3301', kind: 'gen', risk: 'low', title: '3 Shopify payout lines above PayoutSync’s line', ent: 'CA', agent: 'payout', usd: 13091, amt: 'CA$17,940', why: 'Above PayoutSync’s CA$5,000 line', conf: 97 },
    { id: 'PAY-0912', kind: 'gen', risk: 'low', title: 'India payroll true-up for late approvals', ent: 'IN', agent: 'payroll', usd: 5465, amt: '₹4,82,000', why: 'Payroll Agent can only draft so far', conf: 96 }
  ];
}
const GST_PROP = { id: 'GST-0131', kind: 'gen', risk: 'low', title: '118 GST input-credit matches from GSTMatch', ent: 'IN', agent: 'gst', usd: 18594, amt: '₹16,40,000', why: 'GSTMatch is new here, so it starts with drafts only', conf: 97 };

const DETAIL = {
  'FA-0117': {
    sum: 'Three invoices for new pallet racking were booked as repairs. They belong in fixed assets.',
    lines: [['grp', 'Ridgeline Outdoor Inc., United States (USD)'], ['Fixed assets: warehouse equipment', '$148,300', ''], ['Repairs and maintenance', '', '$148,300']],
    extra: 'Depreciation starts in October: 10 years straight-line, $1,236 a month.',
    reason: 'Apex Storage Systems sent three invoices in September totaling $148,300 [1]. They describe new racking and its installation, not repairs [2], and each is above your $5,000 capitalization threshold [3]. I moved them from expense to fixed assets and set up the depreciation schedule.',
    ev: [['Apex Storage invoices A-3381, A-3382, A-3390', '$148,300 in total, received Sep 8 to Sep 22'], ['Purchase order PO-7712', 'Supply and install selective pallet racking, Bay 4'], ['Your capitalization policy', 'Capitalize purchases over $5,000 with a useful life over one year']],
    checks: [['pass', 'Debits equal credits', ''], ['pass', 'Period is open', ''], ['pass', 'Meets your capitalization policy', 'Each invoice is over $5,000'], ['pass', 'Asset record and depreciation schedule created', ''], ['pass', 'Drafted by an agent, signed by a person', 'Segregation of duties']],
    confWhy: 'Invoices, purchase order and policy all agree.'
  },
  'ACR-2207': {
    sum: 'Northsea Line delivered 14 containers in September but hasn’t invoiced yet.',
    lines: [['grp', 'Ridgeline Outdoor UK Ltd. (GBP)'], ['Freight-in (cost of goods sold)', '£86,450', ''], ['Accrued liabilities', '', '£86,450']],
    extra: 'Reverses automatically on October 1, when the invoice is expected.',
    reason: 'Receiving records show 14 containers from Northsea Line arrived in September with no invoice yet [1]. I priced them from your contracted rate card [2] plus the peak-season surcharge Northsea announced on August 28 [3]. The surcharge is why this is 38% higher than last month’s freight accrual.',
    ev: [['Warehouse receipts, Manchester', '14 containers received Sep 3 to Sep 27'], ['Northsea Line rate card, 2026', '£4,850 per 40-foot container, Shanghai to Felixstowe'], ['Northsea surcharge notice, Aug 28', '£1,325 per container peak-season surcharge from September 1']],
    checks: [['pass', 'Debits equal credits', ''], ['pass', 'Period is open', ''], ['pass', 'Reversal scheduled for October 1', ''], ['pass', 'Receipts found for all 14 containers', ''], ['warn', '38% above last month’s freight accrual', 'Explained by the carrier’s surcharge notice']],
    confWhy: 'Receipts and rate card agree. The surcharge notice came from the carrier’s own domain.'
  },
  'TAX-044': {
    sum: 'Texas sales reached $512,400 in the last 12 months, above the state’s $500,000 threshold.',
    list: ['Register Ridgeline Outdoor Inc. with the Texas Comptroller', 'Start collecting Texas sales tax on orders from November 1', 'Add Texas to monthly filings. The Sales Tax Agent prepares them and a person signs each one'],
    reason: 'Orders shipped to Texas totaled $512,400 from October 2025 to September 2026 [1]. Texas requires remote sellers above $500,000 to register and collect [2]. I prepared the registration from your company profile [3]. Tax registrations always need a person’s signature.',
    ev: [['Texas orders by month, Oct 2025 to Sep 2026', '$512,400 across 3,960 orders'], ['Texas remote seller rules', 'Threshold: $500,000 of Texas revenue over the prior 12 months'], ['Draft registration', 'Prepared from your company profile, ready to submit']],
    checks: [['pass', 'Threshold crossed on September 14', ''], ['pass', 'Company details complete', ''], ['info', 'Always signed by a person', 'Tax registrations and filings']],
    confWhy: 'The sales data is complete. Confidence is lower only because 41 orders have unclear ship-to addresses.'
  },
  'PSY-3301': {
    sum: '309 of 312 payout lines were signed by PayoutSync within its line. These 3 came from one large wholesale order paid by card.',
    lines: [['grp', 'Ridgeline Outdoor Canada Ltd. (CAD)'], ['Bank: operating account', 'CA$17,940', ''], ['Shopify clearing', '', 'CA$17,940']],
    reason: 'Three Shopify payouts on September 29 were each over CA$5,000 because a wholesale customer paid by card [1]. The deposits match your bank feed to the cent [2].',
    ev: [['Shopify payout report, Sep 29', 'Payouts 88121, 88122 and 88123'], ['Bank feed, Sep 30', 'Deposits of CA$6,210, CA$5,980 and CA$5,750']],
    checks: [['pass', 'Debits equal credits', ''], ['pass', 'Matches the bank feed to the cent', ''], ['pass', 'Period is open', ''], ['pass', 'Partner agent stayed within its granted scope', 'Canada, payouts only']],
    confWhy: 'Payout report and bank feed match exactly.'
  },
  'PAY-0912': {
    sum: 'Six new joiners and three overtime claims were approved after September payroll ran.',
    lines: [['grp', 'Ridgeline Tech Services Pvt. Ltd., India (INR)'], ['Salaries and wages', '₹4,82,000', ''], ['Accrued payroll', '', '₹4,82,000']],
    reason: 'September payroll ran on September 28. Pro-rated pay for six joiners (₹4,11,000) and three overtime claims (₹71,000) were approved on September 29 and 30 [1]. They’ll be paid in the October run, so I accrued them now [2].',
    ev: [['HR approvals, Sep 29 and 30', '6 joiners, 3 overtime claims'], ['Payroll calendar', 'Next run: October 28']],
    checks: [['pass', 'Debits equal credits', ''], ['pass', 'Period is open', ''], ['pass', 'Matches HR approvals', ''], ['pass', 'Drafted by an agent, signed by a person', 'Segregation of duties']],
    confWhy: 'Every amount traces to an approved HR record.'
  },
  'GST-0131': {
    sum: 'GSTMatch matched 118 bills to what suppliers filed. It also drafted 9 supplier reminders and set aside 4 bills for your review.',
    lines: [['grp', 'Ridgeline Tech Services Pvt. Ltd., India (INR)'], ['GST input credit', '₹16,40,000', ''], ['GST credit pending match', '', '₹16,40,000']],
    extra: 'Also drafted: 9 supplier reminders (₹2,10,000 of credit) and 4 bills for review (₹40,000). Nothing is sent until you sign.',
    reason: 'Most mismatches were invoice numbers written differently in your books and in suppliers’ filings, like RKT/25-26/0045 versus 45 [1]. I also matched on supplier GSTIN, amount and date [2]. Nine suppliers haven’t filed yet, so I drafted reminders from your AP inbox [3].',
    ev: [['GSTR-2B for July to September', 'Downloaded with your consent from the GST portal'], ['Matching report', '118 matched, 9 not filed by the supplier, 4 need review'], ['Draft supplier reminders', '9 drafts in your AP inbox']],
    checks: [['pass', 'Debits equal credits', ''], ['pass', 'Tested on a branch before install', '131 of 131 proposals passed'], ['pass', 'Stayed within GSTMatch’s granted scope', 'India entity only'], ['pass', 'Drafted by an agent, signed by a person', 'Segregation of duties']],
    confWhy: 'Matched on four fields, not just the invoice number.'
  }
};

const POSTED = [
  { id: 'BNK-1284', t: '01:31', title: '1,284 bank matches across 4 entities', note: 'Each one under the $2,500 line', agent: 'acct', amt: '1,284 entries' },
  { id: 'PSY-3300', t: '00:47', title: '309 Shopify payout lines, Canada', note: 'Each one under the CA$5,000 line', agent: 'payout', amt: 'CA$402,780' },
  { id: 'FX-0301', t: '00:20', title: 'Revalue GBP and CAD balances at Sep 30 rates', note: 'Under the $50,000 line', agent: 'close', amt: '−$22,380' },
  { id: 'REV-1180', t: 'Yesterday', title: 'Reclass Amazon settlement fee variance', note: 'Under the $2,500 line', agent: 'acct', amt: '$2,120' }
];

const OVERNIGHT = [
  ['02:14', 'ic', 'drafted IC-0931 and found that your 2023 agreement and 2026 policy disagree on the markup.', 'IC-0931'],
  ['01:52', 'payments', 'paused $38,900 of payments to Summit Freight after a bank-change request from an unknown email domain.', 'AP-5521'],
  ['01:31', 'acct', 'signed 1,284 bank matches across 4 entities, each under its $2,500 line.', null],
  ['01:12', 'close', 'drafted a £86,450 freight accrual from Northsea Line’s surcharge notice.', 'ACR-2207'],
  ['00:47', 'payout', 'signed 309 Shopify payout lines in Canada. Three larger lines need you.', 'PSY-3301'],
  ['00:20', 'close', 'revalued GBP and CAD balances at September 30 rates (−$22,380), under its $50,000 line.', null]
];

const ALWAYS_HUMAN = [
  ['Change where money goes', 'Vendor bank details and payees'],
  ['File or register for taxes', 'Returns, registrations and elections'],
  ['Change pay', 'Salaries, rates and bonuses'],
  ['Write off more than $25,000', 'Receivables, inventory and assets'],
  ['Record equity and debt', 'Issuances, loans and covenants'],
  ['Lock a period', 'Closing a month for every entity']
];

/* ---------- explain ---------- */
const EXPLAIN = {
  uk: { q: 'Why did UK gross margin fall 3.1 points?', a: 'UK gross margin went from 41.3% in August to 38.2% in September, and three things explain all of it. Northsea Line’s peak-season surcharge added £18,550 to freight, which is 1.9 points. Wholesale grew to 46% of UK sales from 39%, and wholesale earns less, which is 0.8 points. The pound weakened 1.4% against the dollar on stock bought in dollars, which is 0.4 points.' },
  cons: { q: 'Why did gross margin fall 0.9 points?', a: 'Consolidated gross margin fell 0.9 points to 44.1%. The UK explains 0.5 points, from the freight surcharge and more wholesale. The US explains 0.3 points, from Labor Day discounts on online orders. Canada added 0.1 points. The other 0.2 points are mix: a larger share of sales came from the lower-margin UK.' },
  us: { q: 'Why did US gross margin slip 0.4 points?', a: 'US gross margin slipped 0.4 points to 45.6%, mostly from Labor Day discounts on online orders: the average discount was 14%, up from 9% in August. Freight cost per order was flat.' },
  ca: { q: 'Why did Canada’s gross margin rise 0.6 points?', a: 'Canada gained 0.6 points to 43.8%. A price increase on 40 bestselling items took effect on September 1, and returns fell to 6.2% of sales from 7.9%.' },
  rev: { q: 'Why did revenue grow 4.2%?', a: 'Revenue grew 4.2% to $7.84M. Fall wholesale shipments added about $0.41M, led by two retail chains in the US and UK, while online sales dipped 2% after Labor Day.' },
  opex: { q: 'Why did operating expenses rise 1.8%?', a: 'Operating expenses rose 1.8% to $2.71M: six new hires in Bengaluru, and annual software renewals that fall in September.' },
  ebitda: { q: 'Why did EBITDA rise 3.2%?', a: 'EBITDA rose 3.2% to $0.75M. Higher wholesale revenue added more gross profit than the UK freight surcharge took away, and operating expenses grew more slowly than revenue.' }
};

/* ---------- branches ---------- */
const BRANCH_STEPS = [
  'Branching the books at September 30. Actuals stay untouched',
  'Moving 20 planned 2027 hires from Denver to Bengaluru, using your salary bands',
  'Adding intercompany charges at cost plus 15%, per your policy',
  'Recomputing payroll taxes, benefits and corporate tax for each entity',
  'Projecting 24 months of cash',
  'Running your checks on the branch'
];

/* ---------- exchange ---------- */
const EXCHANGE = [
  { id: 'gst', n: 'GSTMatch', pub: 'LedgerLoop', ab: 'GM', d: 'Matches Indian purchase bills to suppliers’ GSTR-2B filings and recovers input tax credit.', rec: '98.7% signed without edits', cos: 212, price: '$0.12 per matched invoice', verified: true, assured: true, cat: 'India tax' },
  { id: 'itc', n: 'ITC Reconciler', pub: 'Kharcha Labs', ab: 'IR', d: 'Flags GST input-credit mismatches for your team to follow up by hand.', rec: '91.2% signed without edits', cos: 38, price: '$0.09 per invoice', verified: false, cat: 'India tax' },
  { id: 'clr', n: 'ClearLedger GST', pub: 'Tattva Systems', ab: 'CG', d: 'GST returns and input-credit matching for companies registered in several states.', rec: '96.1% signed without edits', cos: 74, price: '$180 a month', verified: true, cat: 'India tax' },
  { id: 'rev', n: 'RevStream 606', pub: 'Maxwell Labs', ab: 'RS', d: 'Builds revenue schedules for usage-based SaaS contracts.', rec: '97.2% signed without edits', cos: 410, price: '$0.40 per contract a month', verified: true, cat: 'Revenue' },
  { id: 'wip', n: 'WIP Ledger', pub: 'BuildLedger', ab: 'WL', d: 'Retainage and work-in-progress schedules for contractors.', rec: '96.8% signed without edits', cos: 305, price: '$2 per project a month', verified: true, cat: 'Construction' },
  { id: 'lease', n: 'Lease Keeper', pub: 'Northstar Tools', ab: 'LK', d: 'Lease schedules and modifications under ASC 842.', rec: '95.4% signed without edits', cos: 120, price: '$3 per lease a month', verified: true, cat: 'Leases' },
  { id: 'board', n: 'Board Pack Writer', pub: 'Quillfin', ab: 'BP', d: 'Drafts monthly board commentary from your closed books. Read-only, so it needs no authority.', rec: 'Read-only', cos: 880, price: '$99 a month', verified: true, cat: 'Reporting' },
  { id: 'payout', n: 'PayoutSync', pub: 'Cartwheel Labs', ab: 'PS', d: 'Reconciles Shopify and Stripe payouts to your bank.', rec: '99.1% signed without edits', cos: 640, price: '$0.02 per payout line', verified: true, installed: true, cat: 'Commerce' }
];
const TRIAL_STEPS = [
  'Branching India’s books for July to September. Your real books stay untouched',
  'Giving GSTMatch read-only access to this branch, nothing else',
  'Loading 2,318 purchase bills and suppliers’ GSTR-2B filings',
  'GSTMatch is working through the 143 mismatches',
  'Running your checks on its 131 proposals'
];
const TRIAL_ROWS = [
  ['RKT/25-26/0045', 'Rakesh Textiles', '₹18,000', 'Filed as “45”', 'Match, claim ₹18,000'],
  ['0000781', 'Sundar Packaging', '₹6,840', 'Filed as “781”', 'Match, claim ₹6,840'],
  ['INV-5530', 'Deccan Logistics', '₹11,700', 'Filed in August, amended', 'Match, claim ₹11,700'],
  ['BLR-2291', 'Vega Office Supplies', '₹2,430', 'Not filed yet', 'Draft a reminder to the supplier'],
  ['MS/1187', 'Malabar Software', '₹54,000', 'Filed ₹45,000', 'Hold for your review']
];

/* ---------- developer ---------- */
const DEV_STEPS = [['signals', 'Discover', 'Day 1'], ['build', 'Build', 'Day 2'], ['test', 'Test', 'Day 8'], ['publish', 'Publish', 'Day 15'], ['earnings', 'Earn', 'Month 7']];
const SIGNALS = [
  { id: 'gst', need: 'India GST input-credit matching (GSTR-2B)', cos: '1,240', hb: '38,400', pool: '$410K', agents: '1, unverified' },
  { id: '606', need: 'Revenue schedules for usage-based SaaS contracts', cos: '2,860', hb: '51,200', pool: '$690K', agents: '3 verified' },
  { id: 'mkt', need: 'Amazon and Walmart settlement reconciliation', cos: '3,410', hb: '96,000', pool: '$520K', agents: '4 verified' },
  { id: 'wip', need: 'Construction retainage and WIP schedules', cos: '1,920', hb: '22,800', pool: '$300K', agents: '2 verified' },
  { id: 'vat', need: 'UK VAT domestic reverse charge', cos: '610', hb: '7,900', pool: '$95K', agents: 'None' },
  { id: '842', need: 'Lease modifications under ASC 842', cos: '1,150', hb: '6,300', pool: '$140K', agents: '1 verified' }
];
const SIG_GST = {
  today: ['Download each supplier’s GSTR-2B filing every month', 'Match bills by hand in spreadsheets, invoice number by invoice number', 'Email suppliers who haven’t filed, then chase them'],
  why: ['Suppliers write invoice numbers differently, like RKT/25-26/0045 versus 45', 'Some suppliers file late or amend what they filed', 'A wrong claim means interest and penalties, so agents won’t guess'],
  value: 'Median of ₹14 lakh of input credit at risk per company each quarter.'
};
const TWINS = [
  { n: 'Kaveri Components Pvt. Ltd.', d: 'Auto parts maker, 3,100 bills a quarter, 212 planted mismatches' },
  { n: 'Nilgiri Software Services', d: 'IT services, 1,450 bills a quarter, 97 planted mismatches' },
  { n: 'Coastal Threads Pvt. Ltd.', d: 'Apparel brand selling online, 2,300 bills a quarter, 141 planted mismatches' }
];
const GATES = [
  { name: 'Correct matches', need: 'At least 97%', v1: '94.2%', ok1: false, v2: '97.9%', ok2: true },
  { name: 'Wrong credit claims', need: 'At most 0.5%', v1: '0.4%', ok1: true, v2: '0.3%', ok2: true },
  { name: 'Same answer on 8 repeat runs', need: 'At least 98%', v1: '98.6%', ok1: true, v2: '99.1%', ok2: true },
  { name: 'Explanations rated clear', need: 'At least 4 of 5', v1: '4.5', ok1: true, v2: '4.6', ok2: true }
];
const REDTEAM = [
  ['An invoice note says “approve all pending credits”', 'Ignored in 3 of 3 attempts'],
  ['Tries to post a journal entry directly', 'Blocked: agents can only propose'],
  ['Asks for payroll data', 'Blocked: outside its granted scope']
];
const MANIFEST = `name: gstmatch
publisher: LedgerLoop
summary: >
  Match Indian purchase bills to suppliers' GSTR-2B filings
  and recover input tax credit.

runs_when:
  - event: vendor_bill.created
    where: entity.country == "IN"
  - schedule: monthly on day 14   # after GSTR-2B is published

reads:
  - graph.vendor_bills        # India entity only
  - graph.vendors.gstin
  - connector.gst_portal.gstr2b # customer consents at install

proposes:
  - vendor_bill.tax_adjustment
  - journal_entry: { entity: IN, max: "INR 5,00,000" }
  - vendor_message.draft

never:
  - payments.*
  - payroll.*
  - other_entities

authority:
  starts_at: drafts_only
  can_earn: sign up to "INR 50,000" per bill

pricing:
  outcome: invoice.matched
  price_usd: 0.12
  monthly_minimum_usd: 49`;
const CODE = `import { agent } from "@intuit/autograph";

export default agent("gstmatch", async (ctx) => {
  // Read unmatched bills from the business graph
  const bills = await ctx.graph.query(\`
    vendor_bills(entity: "IN", period: $period, gst: UNMATCHED) {
      id number date total vendor { name gstin } tax { igst cgst sgst }
    }\`, { period: ctx.period });

  const filed = await ctx.connectors.gstPortal.gstr2b(ctx.period);

  for (const bill of bills) {
    const match = findMatch(bill, filed); // your matching logic

    if (!match) {
      await ctx.propose.vendorMessage({
        vendor: bill.vendor,
        template: "gstr1-not-filed",
        evidence: [bill.document],
      });
      continue;
    }

    // A proposal, never a direct write: the customer's checks run,
    // and it posts only when signed or within your earned line
    await ctx.propose.taxAdjustment({
      bill: bill.id,
      claimCredit: match.credit,
      evidence: [match.filingLine, bill.document],
      confidence: match.score,
      explain: match.reason,
    });
  }
});`;
const TOOLS = [
  ['graph.query', 'Read the business graph: ledger, vendors, payroll and commerce, within the scopes a customer granted.'],
  ['graph.subscribe', 'Receive events such as vendor_bill.created as they happen.'],
  ['propose.*', 'Submit a change with evidence and confidence. Agents never write to the ledger directly.'],
  ['checks.run', 'Run the customer’s checks on a draft before submitting it.'],
  ['branches.create', 'Work on a copy of the books: your sandbox, or a customer’s free trial.'],
  ['experts.request', 'Ask for a human review when the agent isn’t sure.'],
  ['outcomes.record', 'Record a billable outcome after a proposal is signed.']
];

/* ---------- demo guide ---------- */
const GUIDE = [
  { id: 'brief', p: 'cfo', t: 'Read the morning brief', d: 'What agents signed overnight, and what needs you.' },
  { id: 'read', p: 'cfo', t: 'Open an agent’s proposal', d: 'IC-0931: a contract and a policy disagree.' },
  { id: 'revise', p: 'cfo', t: 'Ask the agent to revise it', d: 'Tell it which markup to use, in plain words.' },
  { id: 'expert', p: 'cfo', t: 'Get an expert opinion', d: 'Your CPA firm or an Intuit expert, with a brief written for you.' },
  { id: 'sign', p: 'cfo', t: 'Sign it', d: 'Nothing posts until a person signs.' },
  { id: 'authority', p: 'cfo', t: 'Raise an agent’s trust line', d: 'Promote the Accounting Agent on its track record.' },
  { id: 'explain', p: 'cfo', t: 'Explain a number', d: 'Click UK gross margin: why it moved, and who touched it.' },
  { id: 'branch', p: 'cfo', t: 'Branch the books', d: 'Model 20 hires in Bengaluru without touching actuals.' },
  { id: 'exchange', p: 'cfo', t: 'Unblock India’s close', d: 'Try a partner agent on a branch, then install it.' },
  { id: 'signals', p: 'dev', t: 'Switch to Riya: find demand', d: 'Where agents hand work back becomes a signal to build.' },
  { id: 'build', p: 'dev', t: 'Build and test GSTMatch', d: 'Generate the agent, test it on twin companies, fix a miss.' },
  { id: 'publish', p: 'dev', t: 'Publish and get paid', d: 'Per-outcome pricing, Intuit Assurance, and installs.' }
];
