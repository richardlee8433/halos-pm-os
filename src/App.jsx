import React, { useState, useEffect, useRef } from 'react';

/* ─── Config ─────────────────────────────────────────────────────────────── */

const API_KEY = import.meta.env?.VITE_OPENAI_API_KEY ?? '';
const MODEL   = 'gpt-4o-mini';

/* ─── Palette ────────────────────────────────────────────────────────────── */

const C = {
  bg:        '#0a0c0f',
  panel:     '#0d1117',
  panelAlt:  '#0f1520',
  accent:    '#FF6B2B',
  accentBg:  'rgba(255,107,43,0.10)',
  accentBdr: 'rgba(255,107,43,0.35)',
  text:      '#c9d1d9',
  dim:       '#4a5568',
  dimMid:    '#6b7280',
  border:    '#1e2530',
  input:     '#111827',
  userLabel: '#60a5fa',
  aiLabel:   '#FF6B2B',
};

/* ─── System Prompt ──────────────────────────────────────────────────────── */

const SYSTEM = `You are Richard Lee's AI PM OS — an interactive representation of how Richard thinks and works as a Product Manager applying for a role at HALOS, a Video Forensics Platform for law enforcement and security.

Richard's background:
- B2B video infrastructure at KKStream (helping media companies build streaming platforms)
- B2C consumer streaming at CATCHPLAY (serving millions of users across Asia)
- Built a working Video Insight Assistant MVP in 3 hours after receiving the HALOS JD
- Iterated to v8.1 in 7 days: dual model (GPT-4o + Gemini Flash), body cam adaptive mode, failure mode detection
- AI-native PM: uses Claude Code and Gemini CLI as daily tools

HALOS context:
- Body cameras + cloud Video Forensics Platform for law enforcement and security
- Competitors: Axon ($2.78B revenue, Evidence.com), Motorola Solutions, Cellebrite
- Market: DEMS $1.2–1.5B growing at 15.5% CAGR, largely unsaturated (Axon <2% global TAM penetration)
- HALOS differentiators: AI-native (not bolted-on), open ecosystem (any body cam brand), EU-native (GDPR advantage)
- Key customers: law enforcement investigators, retail security

PM OS Framework:

Use Case Layer (Pre-Stage 0):
- Every problem is first assigned to a Workflow Cluster: Capture & Upload / Review & Search / Export & Submission
- A Use Case Profile is declared: Cluster + Primary User + Evidence Node + Decision Nature
- Four analysis agents are mandated per cluster (Required or Optional):
  · Trust & Compliance: Will this design hold up in court and pass a compliance audit?
  · Cost Analysis: What is the real compute and operational cost of this decision?
  · Market Analysis: What are competitors doing and where is the user's price ceiling?
  · User Analysis: What would the declared Primary User actually do in the field?
- Profile revisions only permitted at end of Stage 2, with documented rationale

Stage 0 — Signal Capture (≤2hr): Find real recurring pain, locate in evidence chain, document cost ceiling + compliance blockers before any build decision
Stage 1 — Functional Demo (≤1 day): Build prototype, cost estimate attached to every version, show to users, capture reactions verbatim
Stage 2 — Decomposition: Context Chain (all states + failure paths), PM defines routing logic (L1 cheap path vs L2 expensive path), three mandatory AI confidence questions
Stage 3 — Dual Specification: Inner Spec ≤40 lines with mandatory Decision Rationale block + Compliance Annex with Legal/QA sign-off
Stage 4 — Testing & Gates: Technical + UX + Financial (±20% cost tolerance) + Legal acceptance gates all must pass
Stage 5 — Monitoring & Iteration: Adoption stage map, cost model validation, priority = pain × confidence ÷ dev cost

Active Workflow — Workflow A: Video Evidence Investigation:
- Profile: Review & Search · Investigator · Tag→Review · Async Review
- Status: Stage 2 complete → Stage 3 pending · 1 open item
- Stage 0 signal (real field quotes):
  · "A 45-minute DUI video becomes four hours of footage when you include every backup officer and dashcam." — Commander Nick Stasi, Durango PD
  · "It's not a mild inconvenience, it's a delay — sometimes one with very important consequences for everyone involved." — Justin Bogan, Durango Public Defender
  · "Evidence review can take over 200 hours per case." — Digital Evidence Management Research
  · "In 2025, one prosecutor's office handled 67,700 videos totalling 41,000 hours — up from 24,000hrs in 2022." — CPR News, Jan 2026
- Business impact: Investigators spend 8–16 hrs/week manually scrubbing footage, delaying case closure and compressing discovery deadlines
- Stage 2 routing logic: L1 (Laplacian sharpness filter + pixel diff, CPU only, $0 cost) → L2 (Gemini 1.5 Flash native video, preferred path)
- Stage 2 cost model: ~$0.005/video · <$30 per 1,000hr at production scale · 6x headroom vs. cost ceiling
- Stage 2 open item: AI confidence threshold proposed at ≥0.85 — needs PM + Legal sign-off before Stage 3
- Stage 2 compliance gap (Trust & Compliance Agent): Tactical-Link Re-ID (v7.0) uses GPT-4o Vision to describe person characteristics — this constitutes biometric data processing under GDPR Art. 9. No legal basis documented. Feature cannot ship until resolved. Options: (a) Substantial public interest Art.9(2)(g) requires DPA consultation, (b) restrict to post-incident review only
- Stage 2 UX gap (User Analysis Agent): Model comparison toggle adds cognitive load — investigator needs guidance on when to trust which model, not just a switch

Hard principles:
- No slide decks. Prototypes talk.
- No handoffs. Own from discovery to iteration.
- Frame rate, latency, snappiness are product decisions, not engineering details.
- Buffering = product failure.
- AI confidence always visible. Never hidden.
- Reporting wrong AI result requires ≤1 user action — verified in Stage 4 before any release.
- Never compromise evidence integrity.
- Every spec ships with a fully populated Decision Rationale block — no blank fields.

When answering:
- Be concrete and specific. Reference real market data, real user quotes, and real MVP decisions.
- Be direct about trade-offs. Say what NOT to build, not just what to build.
- If asked about working with engineers: emphasise Context Chain, acceptance criteria, and the failure mode → root cause → fix pattern (e.g. body cam hallucination → wrong sampling rate + audio over-reliance → Laplacian filter fix).
- Keep responses under 200 words unless the question genuinely requires depth.
- Speak as the framework itself, in first person. Not "Richard says..." but "The first thing I'd do is..."
- If asked something outside product/PM scope, redirect naturally: "That's outside my decision surface — but on the product side..."`;

/* ─── Static Data ────────────────────────────────────────────────────────── */

const TABS = ['MARKET INTEL', 'PM WORKFLOW', 'WORKFLOW A', 'MVP EVIDENCE', 'HARD LINES'];

const TAB_DATA = {
  'MARKET INTEL': [
    { label: 'DEMS Market',         value: '$1.2–1.5B · 15.5% CAGR' },
    { label: 'Axon Revenue',        value: '$2.78B · ARR $1.35B' },
    { label: 'Axon TAM Penetration',value: '< 2% globally' },
    { label: 'HALOS Advantage',     value: 'AI-native · Open ecosystem · EU-native' },
    { label: 'Primary Threat',      value: 'Axon EU expansion + Cellebrite Gen AI (2025 Q1)' },
  ],
  'PM WORKFLOW': [
    { label: 'USE CASE LAYER', value: 'Declare cluster → Profile → Agent mandate — before Stage 0' },
    { label: 'AGENTS', value: 'Trust & Compliance · Cost Analysis · Market Analysis · User Analysis' },
    { label: 'Stage 0', value: 'Signal Capture · ≤2hr · cost ceiling + compliance blockers' },
    { label: 'Stage 1', value: 'Functional Demo · ≤1 day · cost estimate on every version' },
    { label: 'Stage 2', value: 'Decomposition · Context Chain · L1→L2 routing · AI thresholds' },
    { label: 'Stage 3', value: 'Dual Spec · Inner Spec ≤40 lines · Decision Rationale · Compliance Annex' },
    { label: 'Stage 4', value: 'Gates · Technical + UX + Financial + Legal — all must pass' },
    { label: 'Stage 5', value: 'Monitor · adoption map · cost model validation · priority formula' },
  ],
  'WORKFLOW A': [
    { label: 'PROFILE', value: 'Review & Search · Investigator · Tag→Review · Async Review' },
    { label: 'STATUS', value: 'Stage 2 complete → Stage 3 pending · 1 open item' },
    { label: 'SIGNAL', value: '"A 45-min DUI becomes 4hrs of footage with backups" — Cmdr. Stasi, Durango PD' },
    { label: 'SIGNAL', value: '"41,000hrs of video in 2025, up from 24,000hrs in 2022" — CPR News Jan 2026' },
    { label: 'COST MODEL', value: '~$0.005/video · <$30 per 1,000hr · 6× headroom vs. ceiling' },
    { label: 'ROUTING', value: 'L1: Laplacian filter (CPU, $0) → L2: Gemini Flash (native video)' },
    { label: 'OPEN ITEM', value: 'Confidence threshold 0.85 — needs PM + Legal sign-off' },
    { label: 'COMPLIANCE GAP', value: 'Tactical-Link Re-ID = GDPR Art.9 biometric · no legal basis yet · blocked' },
  ],
  'MVP EVIDENCE': [
    { label: 'Built in',      value: '3 hours (v1.0) → 7 days (v8.1)' },
    { label: 'Stack',         value: 'FastAPI · React/Vite · Whisper · GPT-4o · Gemini Flash' },
    { label: 'Key Decision',  value: 'Dual model parallelism — let stakeholders compare, not just trust' },
    { label: 'Failure Mode',  value: 'AI hallucination on body cam → fixed with Laplacian sharpness filter' },
    { label: 'Scale Model',   value: 'Optical Flow (CPU) → Gemini Flash · $288 → $30 per 1000hr' },
  ],
  'HARD LINES': [
    { label: '01', value: 'Never ship anything that could compromise evidence integrity' },
    { label: '02', value: 'AI confidence always visible — never hidden from user' },
    { label: '03', value: 'Reporting wrong AI result ≤1 user action' },
    { label: '04', value: 'No slide decks. Prototypes talk.' },
    { label: '05', value: 'Buffering = product failure' },
    { label: '06', value: 'Frame rate, latency, snappiness = product decisions' },
  ],
};

const STARTERS = [
  'What GDPR risk did you find in the Tactical-Link feature, and how do you resolve it?',
  'Walk me through the routing logic — when does the system skip the AI entirely?',
  'How do you decide when to use AI vs. a deterministic rule?',
  'How do you handle AI hallucination risk in a law enforcement context?',
  'What is the cost model for running HALOS at 1,000 hours of footage?',
  'What would you do in your first 30 days at HALOS?',
];

/* ─── Global CSS (injected once) ─────────────────────────────────────────── */

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: #0a0c0f; }
  body { font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0a0c0f; }
  ::-webkit-scrollbar-thumb { background: #1e2530; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: #2d3748; }

  textarea { resize: none; outline: none; font-family: inherit; }
  button { cursor: pointer; font-family: inherit; }
  a { color: #FF6B2B; text-decoration: none; }
  a:hover { text-decoration: underline; }

  @keyframes pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px #FF6B2B; }
    50%       { opacity: 0.35; box-shadow: 0 0 2px #FF6B2B; }
  }

  @keyframes blink0 {
    0%, 60%, 100% { opacity: 0.15; transform: scale(0.8); }
    30%           { opacity: 1;    transform: scale(1); }
  }
  @keyframes blink1 {
    0%, 70%, 100% { opacity: 0.15; transform: scale(0.8); }
    40%           { opacity: 1;    transform: scale(1); }
  }
  @keyframes blink2 {
    0%, 80%, 100% { opacity: 0.15; transform: scale(0.8); }
    50%           { opacity: 1;    transform: scale(1); }
  }

  .blink-0 { animation: blink0 1.4s ease-in-out infinite; }
  .blink-1 { animation: blink1 1.4s ease-in-out infinite; }
  .blink-2 { animation: blink2 1.4s ease-in-out infinite; }

  .starter-btn:hover {
    border-color: #FF6B2B !important;
    color: #FF6B2B !important;
    background: rgba(255,107,43,0.07) !important;
  }

  .tab-btn:hover {
    color: #c9d1d9 !important;
  }

  .send-btn:not(:disabled):hover {
    background: #e55a20 !important;
  }
`;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const S = {
  root: {
    display:         'flex',
    flexDirection:   'column',
    height:          '100vh',
    background:      C.bg,
    color:           C.text,
    position:        'relative',
    overflow:        'hidden',
  },

  scanline: {
    position:        'absolute',
    inset:           0,
    background:      'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
    pointerEvents:   'none',
    zIndex:          100,
  },

  header: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         '12px 20px',
    borderBottom:    `1px solid ${C.border}`,
    background:      C.panel,
    flexShrink:      0,
    zIndex:          10,
  },

  headerLeft: {
    display:         'flex',
    alignItems:      'center',
    gap:             '10px',
  },

  statusDot: {
    width:           8,
    height:          8,
    borderRadius:    '50%',
    background:      C.accent,
    animation:       'pulse 2s ease-in-out infinite',
    flexShrink:      0,
  },

  headerTitle: {
    fontSize:        13,
    fontWeight:      700,
    letterSpacing:   '0.12em',
    color:           C.text,
  },

  headerSub: {
    fontSize:        11,
    color:           C.dim,
    letterSpacing:   '0.06em',
    marginLeft:      4,
  },

  headerRight: {
    fontSize:        11,
    color:           C.dim,
    letterSpacing:   '0.08em',
  },

  main: {
    display:         'flex',
    flex:            1,
    overflow:        'hidden',
  },

  /* ── Left Panel ── */

  leftPanel: {
    width:           300,
    flexShrink:      0,
    borderRight:     `1px solid ${C.border}`,
    background:      C.panel,
    display:         'flex',
    flexDirection:   'column',
    overflow:        'hidden',
  },

  tabs: {
    display:         'flex',
    borderBottom:    `1px solid ${C.border}`,
    flexShrink:      0,
  },

  tabBtn: (active) => ({
    flex:            1,
    padding:         '8px 4px',
    fontSize:        9,
    letterSpacing:   '0.08em',
    fontWeight:      600,
    color:           active ? C.accent : C.dim,
    background:      active ? C.accentBg : 'transparent',
    border:          'none',
    borderBottom:    active ? `2px solid ${C.accent}` : '2px solid transparent',
    transition:      'color 0.15s, border-color 0.15s, background 0.15s',
    whiteSpace:      'nowrap',
    overflow:        'hidden',
    textOverflow:    'ellipsis',
  }),

  tabContent: {
    flex:            1,
    overflowY:       'auto',
    padding:         '12px 0',
  },

  row: (booted, i) => ({
    padding:         '9px 16px',
    borderBottom:    `1px solid ${C.border}`,
    opacity:         booted ? 1 : 0,
    transform:       booted ? 'translateX(0)' : 'translateX(-14px)',
    transition:      `opacity 0.35s ease ${i * 65}ms, transform 0.35s ease ${i * 65}ms`,
  }),

  rowLabel: {
    fontSize:        10,
    color:           C.accent,
    letterSpacing:   '0.10em',
    fontWeight:      700,
    display:         'block',
    marginBottom:    3,
  },

  rowValue: {
    fontSize:        11,
    color:           C.dimMid,
    lineHeight:      1.5,
    display:         'block',
  },

  protoSection: {
    flexShrink:      0,
    borderTop:       `1px solid ${C.border}`,
    padding:         '14px 16px',
    background:      C.panelAlt,
  },

  protoTitle: {
    fontSize:        10,
    letterSpacing:   '0.12em',
    color:           C.dim,
    fontWeight:      700,
    marginBottom:    8,
  },

  protoLink: {
    display:         'block',
    fontSize:        11,
    color:           C.accent,
    marginBottom:    5,
    overflow:        'hidden',
    textOverflow:    'ellipsis',
    whiteSpace:      'nowrap',
  },

  /* ── Right Panel ── */

  rightPanel: {
    flex:            1,
    display:         'flex',
    flexDirection:   'column',
    overflow:        'hidden',
    background:      C.bg,
  },

  panelHeader: {
    padding:         '10px 20px',
    fontSize:        10,
    letterSpacing:   '0.08em',
    color:           C.dim,
    borderBottom:    `1px solid ${C.border}`,
    flexShrink:      0,
    background:      C.panel,
  },

  messages: {
    flex:            1,
    overflowY:       'auto',
    padding:         '20px',
    display:         'flex',
    flexDirection:   'column',
    gap:             0,
  },

  /* ── Empty State ── */

  emptyState: {
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    justifyContent:  'center',
    flex:            1,
    gap:             12,
    paddingTop:      20,
  },

  emptyTitle: {
    fontSize:        22,
    fontWeight:      700,
    letterSpacing:   '0.18em',
    color:           C.text,
  },

  emptySubtitle: {
    fontSize:        12,
    color:           C.dim,
    letterSpacing:   '0.06em',
    marginBottom:    8,
  },

  specCard: {
    width:           '100%',
    maxWidth:        640,
    border:          `1px solid ${C.border}`,
    borderRadius:    4,
    overflow:        'hidden',
    background:      C.panel,
    marginBottom:    8,
  },

  specCardHeader: {
    padding:         '8px 14px',
    fontSize:        10,
    fontWeight:      700,
    letterSpacing:   '0.12em',
    color:           C.accent,
    background:      C.panelAlt,
    borderBottom:    `1px solid ${C.border}`,
  },

  specRow: {
    display:         'flex',
    gap:             12,
    padding:         '8px 14px',
    borderBottom:    `1px solid ${C.border}`,
    alignItems:      'flex-start',
  },

  specLabel: {
    fontSize:        9,
    fontWeight:      700,
    letterSpacing:   '0.10em',
    color:           C.accent,
    flexShrink:      0,
    width:           88,
    paddingTop:      2,
  },

  specLabelWarn: {
    fontSize:        9,
    fontWeight:      700,
    letterSpacing:   '0.10em',
    color:           '#f59e0b',
    flexShrink:      0,
    width:           88,
    paddingTop:      2,
  },

  specValue: {
    fontSize:        11,
    color:           C.dimMid,
    lineHeight:      1.55,
  },

  /* ── Messages ── */

  message: {
    padding:         '14px 0',
    borderBottom:    `1px solid ${C.border}`,
  },

  msgLabel: (role) => ({
    fontSize:        9,
    letterSpacing:   '0.14em',
    fontWeight:      700,
    marginBottom:    6,
    color:           role === 'user' ? C.userLabel : C.aiLabel,
  }),

  msgText: {
    fontSize:        13,
    lineHeight:      1.65,
    color:           C.text,
    whiteSpace:      'pre-wrap',
    wordBreak:       'break-word',
  },

  loadingDots: {
    display:         'flex',
    gap:             6,
    paddingTop:      4,
    alignItems:      'center',
  },

  dot: {
    width:           7,
    height:          7,
    borderRadius:    '50%',
    background:      C.accent,
    display:         'inline-block',
  },

  /* ── Input Area ── */

  inputArea: {
    flexShrink:      0,
    borderTop:       `1px solid ${C.border}`,
    background:      C.panel,
    padding:         '12px 20px 10px',
  },

  inputRow: {
    display:         'flex',
    gap:             10,
    alignItems:      'flex-end',
  },

  textarea: {
    flex:            1,
    background:      C.input,
    border:          `1px solid ${C.border}`,
    borderRadius:    4,
    padding:         '10px 12px',
    fontSize:        12,
    color:           C.text,
    lineHeight:      1.55,
    letterSpacing:   '0.02em',
    transition:      'border-color 0.15s',
  },

  sendBtn: (disabled) => ({
    padding:         '10px 18px',
    fontSize:        11,
    fontWeight:      700,
    letterSpacing:   '0.12em',
    color:           '#fff',
    background:      C.accent,
    border:          'none',
    borderRadius:    4,
    opacity:         disabled ? 0.4 : 1,
    cursor:          disabled ? 'not-allowed' : 'pointer',
    transition:      'opacity 0.15s, background 0.15s',
    flexShrink:      0,
    alignSelf:       'flex-end',
    height:          38,
  }),

  hint: {
    fontSize:        10,
    color:           C.dim,
    marginTop:       6,
    letterSpacing:   '0.05em',
  },
};

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function HalosPMOS() {
  const [activeTab, setActiveTab]   = useState(0);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [booted, setBooted]         = useState(false);
  const [ledger, setLedger]         = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    stage:    'Stage 0 — Signal Capture',
    topic:    '',
    feedback: '',
    outcome:  '',
  });
  const messagesEndRef               = useRef(null);
  const textareaRef                  = useRef(null);

  // Inject global CSS once
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Boot animation trigger
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Load decision ledger from public folder
  useEffect(() => {
    fetch('/decision-ledger.json')
      .then(r => r.ok ? r.json() : [])
      .then(data => setLedger(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const buildSystemPrompt = () => {
    if (!ledger.length) return SYSTEM;
    const entries = ledger
      .map(e => `[${e.date}] ${e.stage} | ${e.topic}: ${e.feedback}${e.outcome ? ` → ${e.outcome}` : ''}`)
      .join('\n');
    return SYSTEM + `\n\n---\nDECISION LEDGER (${ledger.length} entries — reference these when relevant):\n${entries}`;
  };

  const downloadEntry = () => {
    if (!feedbackForm.topic.trim() || !feedbackForm.feedback.trim()) return;
    const entry = {
      id:       Date.now().toString(),
      date:     new Date().toISOString().split('T')[0],
      stage:    feedbackForm.stage,
      topic:    feedbackForm.topic.trim(),
      feedback: feedbackForm.feedback.trim(),
      outcome:  feedbackForm.outcome.trim(),
    };
    const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ledger-${entry.date}-${entry.id.slice(-4)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowFeedback(false);
    setFeedbackForm({ stage: 'Stage 0 — Signal Capture', topic: '', feedback: '', outcome: '' });
  };

  const sendMessage = async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput('');
    const history = [...messages, { role: 'user', content: userText }];
    setMessages(history);
    setLoading(true);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          model:      MODEL,
          max_tokens: 1000,
          messages:   [
            { role: 'system', content: buildSystemPrompt() },
            ...history,
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
      }

      const data  = await res.json();
      const reply = data.choices?.[0]?.message?.content ?? '[No response received]';
      setMessages([...history, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages([...history, {
        role:    'assistant',
        content: `[SYSTEM ERROR] ${err.message}\n\nCheck that VITE_ANTHROPIC_API_KEY is set and valid.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isDisabled = !input.trim() || loading;

  return (
    <div style={S.root}>

      {/* Scanline overlay */}
      <div style={S.scanline} />

      {/* ── Header ── */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.statusDot} />
          <span style={S.headerTitle}>HALOS AI PM OS</span>
          <span style={S.headerSub}>v1.0 · RICHARD LEE</span>
        </div>
        <div style={S.headerRight}>
          {new Date().toISOString().split('T')[0]} · SESSION ACTIVE
        </div>
      </header>

      {/* ── Main ── */}
      <div style={S.main}>

        {/* ── Left Panel ── */}
        <aside style={S.leftPanel}>

          {/* Tabs */}
          <div style={S.tabs}>
            {TABS.map((tab, i) => (
              <button
                key={tab}
                className="tab-btn"
                style={S.tabBtn(activeTab === i)}
                onClick={() => setActiveTab(i)}
                title={tab}
              >
                {tab.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Tab label */}
          <div style={{
            padding:       '8px 16px',
            fontSize:      9,
            letterSpacing: '0.14em',
            color:         C.accent,
            fontWeight:    700,
            borderBottom:  `1px solid ${C.border}`,
            background:    C.panelAlt,
            flexShrink:    0,
          }}>
            {TABS[activeTab]}
          </div>

          {/* Tab rows */}
          <div style={S.tabContent}>
            {TAB_DATA[TABS[activeTab]].map((row, i) => (
              <div key={`${activeTab}-${i}`} style={S.row(booted, i)}>
                <span style={S.rowLabel}>{row.label}</span>
                <span style={S.rowValue}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Prototype links */}
          <div style={S.protoSection}>
            <div style={S.protoTitle}>PROTOTYPE</div>
            <a
              href="https://videoinsighter.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              style={S.protoLink}
            >
              → videoinsighter.netlify.app
            </a>
            <a
              href="https://github.com/richardlee8433/video_insigh_MVP"
              target="_blank"
              rel="noopener noreferrer"
              style={S.protoLink}
            >
              → github.com/richardlee8433/video_insigh_MVP
            </a>
          </div>
        </aside>

        {/* ── Right Panel ── */}
        <section style={S.rightPanel}>

          {/* Panel header */}
          <div style={{ ...S.panelHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>INTERACTIVE SESSION — Ask anything about product decisions, trade-offs, or working style</span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
              <button
                onClick={() => setShowFeedback(true)}
                style={{
                  background:    'transparent',
                  border:        `1px solid ${C.accentBdr}`,
                  borderRadius:  3,
                  color:         C.accent,
                  fontSize:      9,
                  letterSpacing: '0.10em',
                  padding:       '3px 8px',
                  cursor:        'pointer',
                  transition:    'background 0.15s',
                }}
                onMouseEnter={e => { e.target.style.background = C.accentBg; }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; }}
              >
                + LOG FEEDBACK
              </button>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  style={{
                    background:    'transparent',
                    border:        `1px solid ${C.border}`,
                    borderRadius:  3,
                    color:         C.dim,
                    fontSize:      9,
                    letterSpacing: '0.10em',
                    padding:       '3px 8px',
                    cursor:        'pointer',
                    transition:    'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.target.style.color = C.accent; e.target.style.borderColor = C.accentBdr; }}
                  onMouseLeave={e => { e.target.style.color = C.dim;    e.target.style.borderColor = C.border; }}
                >
                  ← RESET
                </button>
              )}
            </div>
          </div>

          {/* Messages / empty state */}
          <div style={S.messages}>
            {messages.length === 0 ? (
              <div style={S.emptyState}>
                <div style={S.emptyTitle}>SYSTEM READY</div>
                <div style={S.specCard}>
                  <div style={S.specCardHeader}>ACTIVE SPEC — Video Evidence Investigation · Stage 2 complete → Stage 3 pending</div>
                  <div style={S.specRow}>
                    <span style={S.specLabel}>PROBLEM</span>
                    <span style={S.specValue}>Investigators spend 8–16 hrs/week scrubbing footage.{'\n'}One 45-min incident generates 4+ hrs of video.</span>
                  </div>
                  <div style={S.specRow}>
                    <span style={S.specLabel}>KEY METRIC</span>
                    <span style={S.specValue}>Key moment located in &lt;3 min for a 45-min body cam video</span>
                  </div>
                  <div style={S.specRow}>
                    <span style={S.specLabel}>DECISION</span>
                    <span style={S.specValue}>Gemini Flash (native video) · $0.005/video · &lt;$30/1,000hr · 6× headroom vs. cost ceiling</span>
                  </div>
                  <div style={S.specRow}>
                    <span style={S.specLabelWarn}>OPEN ITEM ⚠</span>
                    <span style={S.specValue}>Confidence threshold 0.85 — PM + Legal sign-off pending</span>
                  </div>
                  <div style={{...S.specRow, borderBottom: 'none'}}>
                    <span style={S.specLabelWarn}>BLOCKED ⚠</span>
                    <span style={S.specValue}>Tactical-Link Re-ID — GDPR Art.9 · no legal basis yet</span>
                  </div>
                </div>
                <div style={S.emptySubtitle}>What would you like to know about the spec?</div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} style={S.message}>
                    <div style={S.msgLabel(msg.role)}>
                      {msg.role === 'user' ? '>' : 'PM OS · RICHARD LEE'}
                    </div>
                    <div style={S.msgText}>{msg.content}</div>
                  </div>
                ))}

                {loading && (
                  <div style={S.message}>
                    <div style={S.msgLabel('assistant')}>PM OS · RICHARD LEE</div>
                    <div style={S.loadingDots}>
                      <span className="blink-0" style={S.dot} />
                      <span className="blink-1" style={S.dot} />
                      <span className="blink-2" style={S.dot} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div style={S.inputArea}>
            <div style={S.inputRow}>
              <textarea
                ref={textareaRef}
                value={input}
                rows={2}
                placeholder="Ask about product decisions, trade-offs, roadmap, engineering collaboration..."
                style={{
                  ...S.textarea,
                  borderColor: input ? C.accentBdr : C.border,
                }}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="send-btn"
                style={S.sendBtn(isDisabled)}
                onClick={() => sendMessage()}
                disabled={isDisabled}
              >
                SEND
              </button>
            </div>
            <div style={S.hint}>↵ Enter to send · Shift+Enter for new line</div>
          </div>

        </section>
      </div>
      {/* ── Feedback Modal ── */}
      {showFeedback && (
        <div
          style={{
            position:       'fixed',
            inset:          0,
            background:     'rgba(0,0,0,0.72)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            zIndex:         200,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowFeedback(false); }}
        >
          <div style={{
            background:   C.panel,
            border:       `1px solid ${C.accentBdr}`,
            borderRadius: 6,
            width:        480,
            maxWidth:     '90vw',
          }}>
            {/* Modal header */}
            <div style={{
              padding:       '12px 16px',
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: '0.12em',
              color:         C.accent,
              borderBottom:  `1px solid ${C.border}`,
              background:    C.panelAlt,
            }}>
              LOG FEEDBACK ENTRY
              {ledger.length > 0 && (
                <span style={{ fontSize: 9, color: C.dim, marginLeft: 12, fontWeight: 400 }}>
                  {ledger.length} entries in ledger
                </span>
              )}
            </div>

            {/* Modal body */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Stage */}
              <div>
                <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.10em', fontWeight: 700, marginBottom: 4 }}>STAGE</div>
                <select
                  value={feedbackForm.stage}
                  onChange={e => setFeedbackForm(f => ({ ...f, stage: e.target.value }))}
                  style={{
                    width: '100%', background: C.input, border: `1px solid ${C.border}`,
                    borderRadius: 4, padding: '8px 10px', fontSize: 12, color: C.text,
                    fontFamily: 'inherit',
                  }}
                >
                  {[
                    'Use Case Layer',
                    'Stage 0 — Signal Capture',
                    'Stage 1 — Functional Demo',
                    'Stage 2 — Decomposition',
                    'Stage 3 — Dual Specification',
                    'Stage 4 — Testing & Gates',
                    'Stage 5 — Monitoring & Iteration',
                  ].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Topic */}
              <div>
                <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.10em', fontWeight: 700, marginBottom: 4 }}>TOPIC / DECISION</div>
                <input
                  type="text"
                  placeholder="e.g. AI confidence threshold, GDPR Art.9 re-ID block"
                  value={feedbackForm.topic}
                  onChange={e => setFeedbackForm(f => ({ ...f, topic: e.target.value }))}
                  style={{
                    width: '100%', background: C.input,
                    border: `1px solid ${feedbackForm.topic ? C.accentBdr : C.border}`,
                    borderRadius: 4, padding: '8px 10px', fontSize: 12, color: C.text,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Feedback */}
              <div>
                <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.10em', fontWeight: 700, marginBottom: 4 }}>FEEDBACK / OBSERVATION</div>
                <textarea
                  rows={3}
                  placeholder="What did you learn, observe, or want the OS to remember?"
                  value={feedbackForm.feedback}
                  onChange={e => setFeedbackForm(f => ({ ...f, feedback: e.target.value }))}
                  style={{
                    width: '100%', background: C.input,
                    border: `1px solid ${feedbackForm.feedback ? C.accentBdr : C.border}`,
                    borderRadius: 4, padding: '8px 10px', fontSize: 12, color: C.text,
                    fontFamily: 'inherit', lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Outcome */}
              <div>
                <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.10em', fontWeight: 700, marginBottom: 4 }}>
                  OUTCOME / NEXT ACTION <span style={{ fontWeight: 400 }}>(optional)</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Raise threshold to 0.92, add human review gate"
                  value={feedbackForm.outcome}
                  onChange={e => setFeedbackForm(f => ({ ...f, outcome: e.target.value }))}
                  style={{
                    width: '100%', background: C.input, border: `1px solid ${C.border}`,
                    borderRadius: 4, padding: '8px 10px', fontSize: 12, color: C.text,
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '12px 16px', borderTop: `1px solid ${C.border}`,
              display: 'flex', gap: 8, justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowFeedback(false)}
                style={{
                  background: 'transparent', border: `1px solid ${C.border}`,
                  borderRadius: 4, color: C.dim, fontSize: 10, letterSpacing: '0.10em',
                  padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={downloadEntry}
                disabled={!feedbackForm.topic.trim() || !feedbackForm.feedback.trim()}
                style={{
                  background:    (!feedbackForm.topic.trim() || !feedbackForm.feedback.trim()) ? C.dim : C.accent,
                  border:        'none',
                  borderRadius:  4,
                  color:         '#fff',
                  fontSize:      10,
                  letterSpacing: '0.10em',
                  fontWeight:    700,
                  padding:       '7px 14px',
                  cursor:        (!feedbackForm.topic.trim() || !feedbackForm.feedback.trim()) ? 'not-allowed' : 'pointer',
                  fontFamily:    'inherit',
                  opacity:       (!feedbackForm.topic.trim() || !feedbackForm.feedback.trim()) ? 0.45 : 1,
                }}
              >
                ↓ DOWNLOAD ENTRY
              </button>
            </div>

            {/* Instructions */}
            <div style={{
              padding:       '8px 16px 12px',
              fontSize:      9,
              color:         C.dim,
              letterSpacing: '0.06em',
              lineHeight:    1.6,
            }}>
              Download the JSON → add it to <code style={{ color: C.dimMid }}>decision-ledger.json</code> in the repo → push to GitHub → Netlify redeploys → OS remembers it permanently.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
