import React, { useState, useEffect, useRef } from 'react';

/* ─── Config ─────────────────────────────────────────────────────────────── */

const API_KEY  = import.meta.env?.VITE_OPENAI_API_KEY ?? '';
const MODEL    = 'gpt-4o-mini';
const REPO_RAW = 'https://raw.githubusercontent.com/richardlee8433/halos-pm-os/master';

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

/* ─── Fallback Data (used if fetch fails) ────────────────────────────────── */

const TABS = ['MARKET INTEL', 'PM WORKFLOW', 'MVP EVIDENCE', 'HARD LINES'];

const FALLBACK_CONFIG = {
  tabs: {
    'MARKET INTEL': [
      { label: 'DEMS Market',          value: '$1.2–1.5B · 15.5% CAGR' },
      { label: 'Axon Revenue',         value: '$2.78B · ARR $1.35B' },
      { label: 'Axon TAM Penetration', value: '< 2% globally' },
      { label: 'HALOS Advantage',      value: 'AI-native · Open ecosystem · EU-native' },
      { label: 'Primary Threat',       value: 'Axon EU expansion + Cellebrite Gen AI (2025 Q1)' },
    ],
    'PM WORKFLOW': [
      { label: 'Stage 0', value: 'Signal Capture · ≤2hr · locate pain in evidence chain' },
      { label: 'Stage 1', value: 'Functional Demo · ≤1 day · prototype over PRD' },
      { label: 'Stage 2', value: 'Decomposition · Context Chain · edge cases · AI thresholds' },
      { label: 'Stage 3', value: 'Dual Spec · Inner Spec ≤40 lines · Compliance Annex' },
      { label: 'Stage 4', value: 'Testing & Gates · pre-launch checklist' },
      { label: 'Stage 5', value: 'Monitor & Iterate · adoption map · priority formula' },
    ],
    'MVP EVIDENCE': [
      { label: 'Built in',     value: '3 hours (v1.0) → 7 days (v8.1)' },
      { label: 'Stack',        value: 'FastAPI · React/Vite · Whisper · GPT-4o · Gemini Flash' },
      { label: 'Key Decision', value: 'Dual model parallelism — let stakeholders compare, not just trust' },
      { label: 'Failure Mode', value: 'AI hallucination on body cam → fixed with Laplacian sharpness filter' },
      { label: 'Scale Model',  value: 'Optical Flow (CPU) → Gemini Flash · $288 → $30 per 1000hr' },
    ],
    'HARD LINES': [
      { label: '01', value: 'Never ship anything that could compromise evidence integrity' },
      { label: '02', value: 'AI confidence always visible — never hidden from user' },
      { label: '03', value: 'Reporting wrong AI result ≤1 user action' },
      { label: '04', value: 'No slide decks. Prototypes talk.' },
      { label: '05', value: 'Buffering = product failure' },
      { label: '06', value: 'Frame rate, latency, snappiness = product decisions' },
    ],
  },
  starters: [
    'How would you prioritise the HALOS roadmap for next quarter?',
    'Walk me through speccing a cross-video facial ID feature.',
    'How do you decide when to use AI vs. a deterministic rule?',
    "What's your approach to working with engineering on tight timelines?",
    'How do you handle AI hallucination risk in law enforcement context?',
    'What would you do in your first 30 days at HALOS?',
  ],
};

const FALLBACK_SYSTEM = `You are Richard Lee's AI PM OS — an interactive representation of how Richard thinks and works as a Product Manager at HALOS, a Video Forensics Platform for law enforcement and security.`;

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

  startersGrid: {
    display:         'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:             8,
    width:           '100%',
    maxWidth:        700,
  },

  starterBtn: {
    padding:         '11px 14px',
    fontSize:        11,
    color:           C.dim,
    background:      C.panel,
    border:          `1px solid ${C.border}`,
    borderRadius:    4,
    textAlign:       'left',
    lineHeight:      1.45,
    transition:      'border-color 0.15s, color 0.15s, background 0.15s',
    letterSpacing:   '0.02em',
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
  const [config, setConfig]         = useState(FALLBACK_CONFIG);
  const [system, setSystem]         = useState(FALLBACK_SYSTEM);
  const messagesEndRef               = useRef(null);
  const textareaRef                  = useRef(null);

  // Inject global CSS once
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Fetch live data from GitHub, fall back silently on error
  useEffect(() => {
    Promise.all([
      fetch(`${REPO_RAW}/data/config.json`).then(r => r.json()),
      fetch(`${REPO_RAW}/data/system-prompt.txt`).then(r => r.text()),
    ]).then(([cfg, sys]) => {
      setConfig(cfg);
      setSystem(sys.trim());
    }).catch(() => { /* keep fallbacks */ });
  }, []);

  // Boot animation trigger
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
          'content-type':  'application/json',
        },
        body: JSON.stringify({
          model:      MODEL,
          max_tokens: 1000,
          messages:   [
            { role: 'system', content: system },
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
        content: `[SYSTEM ERROR] ${err.message}\n\nCheck that VITE_OPENAI_API_KEY is set and valid.`,
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
            {(config.tabs[TABS[activeTab]] ?? []).map((row, i) => (
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
          <div style={S.panelHeader}>
            INTERACTIVE SESSION — Ask anything about product decisions, trade-offs, or working style
          </div>

          {/* Messages / empty state */}
          <div style={S.messages}>
            {messages.length === 0 ? (
              <div style={S.emptyState}>
                <div style={S.emptyTitle}>SYSTEM READY</div>
                <div style={S.emptySubtitle}>Select a question or type your own</div>
                <div style={S.startersGrid}>
                  {(config.starters ?? []).map((q, i) => (
                    <button
                      key={i}
                      className="starter-btn"
                      style={S.starterBtn}
                      onClick={() => sendMessage(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} style={S.message}>
                    <div style={S.msgLabel(msg.role)}>
                      {msg.role === 'user' ? 'NEIL MONTGOMERY' : 'PM OS · RICHARD LEE'}
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
    </div>
  );
}
