import { useState } from 'react'
import './App.css'

const researchItems = [
  { title: 'AI hiring discrimination', meta: 'Employment law · 8 sources', initials: 'JD', color: 'sage' },
  { title: 'Trade secret misappropriation', meta: 'IP litigation · 12 sources', initials: 'MK', color: 'amber' },
  { title: 'Non-compete enforceability', meta: 'Employment law · 6 sources', initials: 'JD', color: 'blue' },
]

const sources = [
  { number: '01', court: 'United States Code · Title VII', title: 'Disparate impact', citation: '42 U.S.C. § 2000e-2(k)', type: 'Statute', tone: 'statute' },
  { number: '02', court: 'U.S. Supreme Court · 1971', title: 'Griggs v. Duke Power Co.', citation: '401 U.S. 424 (1971)', type: 'Case law', tone: 'case' },
  { number: '03', court: 'U.S. Equal Employment Opportunity Commission · 2023', title: 'Assessing Adverse Impact in Software, Algorithms, and Artificial Intelligence Used in Employment Selection Procedures', citation: 'EEOC Technical Assistance (May 18, 2023)', type: 'Agency guidance', tone: 'guidance' },
]

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    folder: <><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H10l2 2h7.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    down: <path d="m7 10 5 5 5-5" />,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    bookmark: <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4z" />,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11" /><path d="m9 12 2 2 4-4" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1z" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    x: <><path d="m18 6-12 12M6 6l12 12" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function App() {
  const [activeResearch, setActiveResearch] = useState(researchItems[0].title)
  const [query, setQuery] = useState('')
  const [answerQuery, setAnswerQuery] = useState('Can an employer use an AI hiring tool that has a disparate impact on protected groups?')
  const [sourceFilter, setSourceFilter] = useState('All sources')
  const [saved, setSaved] = useState(false)
  const [notice, setNotice] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const submitQuestion = (event) => {
    event.preventDefault()
    if (!query.trim()) return
    setAnswerQuery(query.trim())
    setQuery('')
    setNotice('Question added to this research thread. The displayed answer is sample content.')
    window.setTimeout(() => setNotice(''), 3500)
  }

  const showNotice = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const copyText = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text)
      showNotice(successMessage)
    } catch {
      showNotice('Clipboard access is unavailable in this browser.')
    }
  }

  const visibleSources = sourceFilter === 'All sources' ? sources : sources.filter((source) => source.type === sourceFilter)

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#workspace" aria-label="Briefly home">
          <span className="brand-mark"><Icon name="book" size={19} /></span>
          <span>briefly<span className="brand-period">.</span><small>LEGAL RESEARCH</small></span>
        </a>
        <button className="new-research" onClick={() => { setAnswerQuery(''); setActiveResearch('New research'); setMobileNavOpen(false) }}><Icon name="plus" size={17} /> New research <span>⌘ K</span></button>

        <div className="nav-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Workspace">
          <button className="nav-link selected"><Icon name="grid" size={17} /> Research desk</button>
          <button className="nav-link" onClick={() => showNotice('Your saved research will appear here.')}><Icon name="folder" size={17} /> Saved research <span className="nav-count">4</span></button>
          <button className="nav-link" onClick={() => showNotice('Recent research is shown below.')}><Icon name="clock" size={17} /> Recent activity</button>
        </nav>

        <div className="history-heading"><span className="nav-label">RECENT RESEARCH</span><button aria-label="Search research" onClick={() => document.querySelector('.search-input')?.focus()}><Icon name="search" size={16} /></button></div>
        <div className="research-list">
          {researchItems.map((item) => <button className={`research-item ${activeResearch === item.title ? 'research-active' : ''}`} key={item.title} onClick={() => { setActiveResearch(item.title); setAnswerQuery(item.title === 'AI hiring discrimination' ? 'Can an employer use an AI hiring tool that has a disparate impact on protected groups?' : `What are the key legal considerations for ${item.title.toLowerCase()}?`) }}>
            <span className={`matter-avatar ${item.color}`}>{item.initials}</span><span className="matter-copy"><strong>{item.title}</strong><small>{item.meta}</small></span>
          </button>)}
        </div>

        <div className="sidebar-bottom">
          <div className="plan-callout"><span className="plan-icon"><Icon name="spark" size={16} /></span><div><strong>Research, grounded.</strong><small>Every answer linked to authority.</small></div><Icon name="arrow" size={15} /></div>
          <button className="profile-button" onClick={() => showNotice('Signed in as Jordan Davis · Davis & Cole LLP')}><span className="profile-avatar">JD</span><span><strong>Jordan Davis</strong><small>Davis & Cole LLP</small></span><Icon name="down" size={16} /></button>
        </div>
      </aside>

      <main id="workspace" className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(!mobileNavOpen)}><Icon name={mobileNavOpen ? 'x' : 'menu'} /></button>
          <div className="breadcrumbs"><span>Research desk</span><Icon name="chevron" size={14} /><strong>{activeResearch}</strong></div>
          <div className="topbar-actions"><span className="secure-label"><Icon name="shield" size={15} /> Private workspace</span><button className="help-button" onClick={() => showNotice('Briefly research assistant · Version 1.0')}>Help</button></div>
        </header>

        <div className="content-wrap">
          <div className="matter-header">
            <div><div className="eyebrow"><span className="status-dot" /> RESEARCH MEMO <span className="eyebrow-divider">/</span> UPDATED JUST NOW</div><h1>{answerQuery ? 'AI hiring & disparate impact' : 'Start a new research thread'}</h1><p className="matter-subtitle">Federal employment discrimination <span>·</span> United States</p></div>
            <div className="matter-actions"><button className={`tool-button ${saved ? 'tool-saved' : ''}`} title={saved ? 'Remove bookmark' : 'Save research'} aria-label={saved ? 'Remove bookmark' : 'Save research'} onClick={() => { setSaved(!saved); showNotice(saved ? 'Removed from saved research.' : 'Research saved to your workspace.') }}><Icon name="bookmark" size={17} /></button><button className="share-button" onClick={() => copyText(window.location.href, 'Research link copied to clipboard.')}><Icon name="share" size={16} /> Share</button></div>
          </div>

          <section className="question-strip" aria-label="Research question"><span className="question-mark">Q</span><div><small>YOUR QUESTION</small><p>{answerQuery || 'Ask a question to begin your research.'}</p></div><button title="Edit question" aria-label="Edit question" onClick={() => document.querySelector('.search-input')?.focus()}><Icon name="arrow" size={16} /></button></section>

          <div className="answer-heading"><div><span className="answer-icon"><Icon name="spark" size={16} /></span><h2>Research summary</h2><span className="verified-tag"><Icon name="check" size={13} /> Evidence-backed</span></div><div className="answer-tools"><button title="Copy answer" aria-label="Copy answer" className="tool-button" onClick={() => copyText(document.querySelector('.answer-body')?.innerText ?? '', 'Summary copied to clipboard.')}><Icon name="copy" size={16} /></button><button className="answer-menu" onClick={() => showNotice('Summary options are up to date.')} aria-label="More answer actions">•••</button></div></div>

          <article className="answer-body">
            <p className="answer-lede">Generally, <strong>yes, but an employer may be liable</strong> under Title VII if an AI selection procedure causes a disparate impact on a protected group and cannot be justified as job-related and consistent with business necessity.<sup><a href="#source-1">1</a></sup></p>
            <p>Title VII's disparate-impact framework applies to employment selection procedures. The statute describes the job-relatedness and business-necessity defense, and the EEOC's technical assistance applies these principles to software and algorithmic tools.<sup><a href="#source-1">1</a></sup><sup><a href="#source-3">3</a></sup></p>
            <div className="insight-block"><span className="insight-rule" /><div><strong>Key standard</strong><p>A claimant must identify a specific employment practice that causes a statistical disparity. The employer can defend the practice by demonstrating it is job-related and consistent with business necessity; Title VII also addresses an available alternative employment practice.<sup><a href="#source-1">1</a></sup><sup><a href="#source-2">2</a></sup></p></div></div>
            <p>For AI hiring tools, the EEOC recommends ongoing adverse-impact analysis, validation for the particular job and use case, and accessible accommodation procedures. An employer should not treat a vendor's assurance as a substitute for reviewing the tool's effects.<sup><a href="#source-3">3</a></sup></p>
          </article>

          <section className="sources-section" aria-label="Supporting authorities">
            <div className="sources-header"><div><h2>Supporting authorities</h2><span className="source-count">{visibleSources.length} sources</span></div><label className="filter-select"><span className="sr-only">Filter sources</span><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option>All sources</option><option>Statute</option><option>Case law</option><option>Agency guidance</option></select><Icon name="down" size={14} /></label></div>
            <div className="source-list">{visibleSources.map((source) => <article className="source-row" id={`source-${source.number.replace(/^0/, '')}`} key={source.number}>
              <span className="source-number">{source.number}</span><div className="source-copy"><div className="source-meta"><span className={`source-type ${source.tone}`}>{source.type}</span><span>{source.court}</span></div><a className="source-title" href={`#source-${source.number.replace(/^0/, '')}`} onClick={(event) => { event.preventDefault(); showNotice(`Authority opened: ${source.citation}`) }}>{source.title}</a><div className="source-citation">{source.citation}</div></div><button className="source-open" aria-label={`Open ${source.title}`} onClick={() => showNotice(`Authority opened: ${source.citation}`)}><Icon name="arrow" size={16} /></button>
            </article>)}</div>
            <button className="all-sources" onClick={() => setSourceFilter('All sources')}>View all authorities <Icon name="chevron" size={15} /></button>
          </section>

          <footer className="answer-footer"><span><Icon name="shield" size={14} /> Answers are research assistance, not legal advice.</span><button onClick={() => showNotice('Feedback noted. Thank you.')}>Give feedback <Icon name="arrow" size={13} /></button></footer>
        </div>

        <form className="composer" onSubmit={submitQuestion}><div className="composer-inner"><Icon name="search" size={18} /><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask a follow-up or explore another angle..." aria-label="Ask a legal research question" /><span className="composer-shortcut">↵</span><button className="send-button" type="submit" aria-label="Submit question"><Icon name="send" size={17} /></button></div><div className="composer-meta"><span><Icon name="book" size={13} /> Searching federal case law & agency guidance</span><button type="button" onClick={() => showNotice('Jurisdiction: United States · Federal')}>United States <Icon name="down" size={13} /></button></div></form>
      </main>
      {notice && <div role="status" className="toast"><Icon name="check" size={16} />{notice}</div>}
    </div>
  )
}

export default App
