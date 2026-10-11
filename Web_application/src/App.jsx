import { useEffect, useState } from 'react'
import { Scale, Upload, FileText, ShieldCheck, Clock3, Search, LoaderCircle, AlertTriangle, ExternalLink, CheckCircle2, Sparkles } from 'lucide-react'
const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const nf = 'Not found in the document'
function Field({ label, value }) {
  const items = Array.isArray(value) ? value : [value]
  return <section className="field"><div className="field-label">{label}</div>{items.some(Boolean) ? items.map((x, i) => <div className="field-value" key={i}>{typeof x === 'object' ? JSON.stringify(x) : x}</div>) : <div className="muted">{nf}</div>}</section>
}
export default function App() {
  const [file, setFile] = useState(null), [result, setResult] = useState(null), [error, setError] = useState('')
  const [loading, setLoading] = useState(false), [activeTab, setActiveTab] = useState('overview'), [health, setHealth] = useState('checking')
  useEffect(() => { fetch(`${API}/api/health`).then(r => r.ok ? r.json() : Promise.reject()).then(() => setHealth('connected')).catch(() => setHealth('offline')) }, [])
  async function analyze(e) {
    e.preventDefault()
    if (!file) { setError('Choose a PDF judgment first.'); return }
    setLoading(true); setError(''); setResult(null)
    const form = new FormData(); form.append('file', file)
    try {
      const response = await fetch(`${API}/api/analyze`, { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Analysis failed.')
      setResult(data); setActiveTab('overview')
    } catch (err) { setError(`${err.message}. Confirm the Python backend is running at ${API}.`) }
    finally { setLoading(false) }
  }
  const evidence = result?.evidence || []
  const tabs = [['overview', 'Case DNA'], ['evidence', 'Evidence'], ['timeline', 'Timeline'], ['document', 'Document']]
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Scale size={23} /></div><div><strong>NyayaLens</strong><span>LEGAL INTELLIGENCE</span></div></div>
      <div className="nav-label">WORKSPACE</div><div className="nav-item active"><FileText size={17} /> Document Analyzer</div><div className="nav-item disabled"><Search size={17} /> Similar judgments <span className="soon">LATER</span></div>
      <div className="sidebar-bottom"><div className="secure-icon"><ShieldCheck size={18} /></div><strong>Evidence-first AI</strong><p>Important facts should be traceable to the source document.</p><div className={`connection ${health}`}><span /> API {health}</div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="eyebrow">LEGAL DOCUMENT WORKSPACE</span><h1>Court Document Analyzer</h1></div><div className="prototype-pill"><span /> HACKATHON MVP</div></header>
      <div className="intro"><div><h2>Turn lengthy judgments into structured insights.</h2><p>Upload an Indian court judgment to extract case details, outcome, timeline and source evidence.</p></div><div className="intro-icon"><Sparkles size={27} /></div></div>
      <form className="upload-card" onSubmit={analyze}>
        <div className="upload-heading"><div className="upload-icon"><Upload size={20} /></div><div><h3>Upload a judgment</h3><p>PDF files only · Maximum 20 MB</p></div></div>
        <label className="dropzone"><input type="file" accept="application/pdf,.pdf" onChange={e => { setFile(e.target.files?.[0] || null); setError('') }} /><div className="pdf-icon"><FileText size={25} /></div><strong>{file ? file.name : 'Choose a PDF or drop it here'}</strong><span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze` : 'Use a text-based court judgment for best results'}</span><em>Browse files</em></label>
        {error && <div className="error"><AlertTriangle size={17} />{error}</div>}
        <button className="primary-button" disabled={loading || !file}>{loading ? <><LoaderCircle className="spin" size={18} /> Analyzing document...</> : <><Sparkles size={17} /> Analyze judgment</>}</button>
        <p className="privacy-note"><ShieldCheck size={14} /> Prototype: files are processed by the local backend and are not saved to MongoDB.</p>
      </form>
      {!result && <div className="feature-grid">
        <div className="feature"><div className="feature-icon blue"><FileText size={19} /></div><strong>Case DNA</strong><p>Parties, court, legal provisions and outcome.</p></div>
        <div className="feature"><div className="feature-icon green"><ShieldCheck size={19} /></div><strong>Source evidence</strong><p>Review extracted facts alongside page-level excerpts.</p></div>
        <div className="feature"><div className="feature-icon purple"><Clock3 size={19} /></div><strong>Case timeline</strong><p>Find dates and procedural events in the document.</p></div>
      </div>}
      {result && <div className="results">
        <div className="results-title"><div><span className="eyebrow">ANALYSIS RESULTS</span><h2>{result.document?.filename || 'Uploaded judgment'}</h2><p>{result.document?.page_count} pages · {result.document?.analysis_mode === 'huggingface' ? 'Hugging Face AI' : 'Heuristic fallback mode'}</p></div><div className="status-pill"><CheckCircle2 size={15} /> Processed</div></div>
        {result.warnings?.length > 0 && <div className="warning"><AlertTriangle size={17} /><div><strong>Review before relying on results</strong>{result.warnings.map((w, i) => <p key={i}>{w}</p>)}</div></div>}
        <div className="tabs">{tabs.map(([key, label]) => <button type="button" key={key} className={activeTab === key ? 'tab active-tab' : 'tab'} onClick={() => setActiveTab(key)}>{label}</button>)}</div>
        {activeTab === 'overview' && <div className="result-grid">
          <Field label="Case type" value={result.case_type} /><Field label="Court" value={result.court} /><Field label="Petitioner" value={result.petitioner} /><Field label="Respondent" value={result.respondent} />
          <div className="wide"><Field label="Laws and sections cited" value={result.laws_and_sections} /></div><div className="wide"><Field label="Main legal issues" value={result.main_issues} /></div>
          <div className="wide outcome"><Field label="Final outcome" value={result.final_outcome} /></div><div className="wide"><Field label="Court reasoning" value={result.court_reasoning} /></div>
        </div>}
        {activeTab === 'evidence' && <div className="evidence-list">{!evidence.length && <p className="muted">No supporting excerpts were detected. Treat extracted fields as unverified.</p>}
          {evidence.map((item, i) => <article className="evidence-card" key={i}><div className="evidence-meta"><span>{item.field.replaceAll('_', ' ')}</span><b>PDF page {item.page}</b></div><blockquote>{item.quote}</blockquote><button type="button" className="text-button" onClick={() => setActiveTab('document')}>View page details <ExternalLink size={14} /></button></article>)}
        </div>}
        {activeTab === 'timeline' && <div className="timeline">{(result.timeline || []).length ? result.timeline.map((item, i) => <div className="timeline-item" key={i}><div className="timeline-dot" /><div><strong>{item.date || 'Date not specified'}</strong><p>{item.event || item.description || JSON.stringify(item)}</p><span>PDF page {item.page || 'not supplied'}</span></div></div>) : <p className="muted">No timeline events were extracted.</p>}</div>}
        {activeTab === 'document' && <div className="page-list">{(result.document?.pages || []).map(p => <details key={p.page}><summary>PDF page {p.page}<span>{p.character_count} characters</span></summary><p>{p.text_preview || 'No text extracted from this page.'}</p></details>)}</div>}
        <div className="result-footer"><ShieldCheck size={16} /><span>{result.verification?.note || 'Always verify extracted facts against the original judgment.'}</span></div>
      </div>}
      <footer>NyayaLens AI <span>·</span> Legal document organization prototype <span>·</span> Not legal advice</footer>
    </main>
  </div>
}
