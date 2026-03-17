import { useState, useEffect } from 'react'
import { searchVerses, formatRef, splitVerseText, getChapters, getChapterVerses, Verse, QUICK_REFS } from './bibleData.ts'

export type OverlayPosition =
  | 'center'
  | 'bottom-bar'
  | 'top-bar'
  | 'left-panel'
  | 'right-panel'

interface Props {
  onClose: () => void
  onProjectVerse: (verse: Verse, position: OverlayPosition, extra?: Verse[]) => void
  onAddToService: (verse: Verse, extra?: Verse[]) => void
  currentPosition: OverlayPosition
  onPositionChange: (pos: OverlayPosition) => void
}

const POSITIONS: { id: OverlayPosition; label: string; icon: string }[] = [
  { id: 'center',      label: 'Center',     icon: '⊞' },
  { id: 'bottom-bar',  label: 'Bottom Bar', icon: '▬' },
  { id: 'top-bar',     label: 'Top Bar',    icon: '▀' },
  { id: 'left-panel',  label: 'Left Side',  icon: '▐' },
  { id: 'right-panel', label: 'Right Side', icon: '▌' },
]

const OT_BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy',
  'Joshua','Judges','Ruth','1 Samuel','2 Samuel',
  '1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
  'Nehemiah','Esther','Job','Psalms','Proverbs',
  'Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations',
  'Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk',
  'Zephaniah','Haggai','Zechariah','Malachi'
]

const NT_BOOKS = [
  'Matthew','Mark','Luke','John','Acts',
  'Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians',
  'Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy',
  '2 Timothy','Titus','Philemon','Hebrews','James',
  '1 Peter','2 Peter','1 John','2 John','3 John',
  'Jude','Revelation'
]

type BrowseView = 'books' | 'chapters' | 'verses'

export default function BibleEngine({
  onClose, onProjectVerse, onAddToService,
  currentPosition, onPositionChange
}: Props) {
  const [tab, setTab]                       = useState<'browse' | 'search'>('browse')
  const [browseView, setBrowseView]         = useState<BrowseView>('books')
  const [selectedBook, setSelectedBook]     = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<number>(0)
  const [chapters, setChapters]             = useState<number[]>([])
  const [chapterVerses, setChapterVerses]   = useState<Verse[]>([])
  const [query, setQuery]                   = useState('')
  const [results, setResults]               = useState<Verse[]>([])
  const [selected, setSelected]             = useState<Verse | null>(null)
  const [multiSelected, setMultiSelected]   = useState<Verse[]>([])
  const [searched, setSearched]             = useState(false)
  const [bibleReady, setBibleReady]         = useState(false)

  useEffect(() => {
    const check = setInterval(() => {
      const test = searchVerses('John 3:16')
      if (test.length > 0) {
        setBibleReady(true)
        clearInterval(check)
      }
    }, 300)
    return () => clearInterval(check)
  }, [])

  function selectBook(book: string) {
    setSelectedBook(book)
    setChapters(getChapters(book))
    setBrowseView('chapters')
    setSelected(null)
    setMultiSelected([])
  }

  function selectChapter(chapter: number) {
    setSelectedChapter(chapter)
    const verses = getChapterVerses(selectedBook, chapter)
    setChapterVerses(verses)
    setBrowseView('verses')
    setSelected(null)
    setMultiSelected([])
  }

  // Single click — toggle multi-select
  function handleVerseClick(v: Verse) {
    setSelected(v)
    setMultiSelected(prev => {
      const exists = prev.some(p =>
        p.book === v.book && p.chapter === v.chapter && p.verse === v.verse
      )
      if (exists) {
        return prev.filter(p => !(p.book === v.book && p.chapter === v.chapter && p.verse === v.verse))
      }
      return [...prev, v]
    })
  }

  // Double click — instantly project
  function handleVerseDoubleClick(v: Verse) {
    setSelected(v)
    const all = multiSelected.length > 1 ? multiSelected : [v]
    onProjectVerse(all[0], currentPosition, all.slice(1))
  }

  function isVerseSelected(v: Verse) {
    return multiSelected.some(p =>
      p.book === v.book && p.chapter === v.chapter && p.verse === v.verse
    )
  }

  function search(q = query) {
    if (!q.trim()) return
    const found = searchVerses(q)
    setResults(found)
    setSearched(true)
    setMultiSelected([])
    if (found.length > 0) setSelected(found[0])
  }

  function quickSearch(ref: string) {
    setQuery(ref)
    setTab('search')
    const found = searchVerses(ref)
    setResults(found)
    setSearched(true)
    setMultiSelected([])
    if (found.length > 0) setSelected(found[0])
  }

  // Build combined text for multi-select preview
  const displayVerses = multiSelected.length > 0 ? multiSelected : (selected ? [selected] : [])
  const combinedText  = displayVerses.map(v => v.text).join(' ')
  const { line1, line2 } = splitVerseText(combinedText)
  const refLabel = displayVerses.length > 1
    ? `${formatRef(displayVerses[0])}–${displayVerses[displayVerses.length-1].verse}`
    : displayVerses.length === 1 ? formatRef(displayVerses[0]) : ''

  function VerseList({ verses }: { verses: Verse[], showRef?: boolean }) {
    return (
      <>
        {verses.map((v, i) => {
          const sel = isVerseSelected(v)
          return (
            <div
              key={i}
              style={{
                ...s.verseRow,
                ...(sel ? s.verseRowActive : {}),
              }}
              onClick={() => handleVerseClick(v)}
              onDoubleClick={() => handleVerseDoubleClick(v)}
              title="Click to select · Double-click to project instantly"
            >
              <div style={s.verseLeft}>
                <div style={{
                  ...s.verseCheck,
                  background: sel ? '#4f9eff' : 'transparent',
                  borderColor: sel ? '#4f9eff' : '#2a3f5f',
                }}>
                  {sel && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
                </div>
                <span style={s.verseNum}>
                  {tab === 'search' ? formatRef(v) : v.verse}
                </span>
              </div>
              <span style={s.verseText}>{v.text}</span>
            </div>
          )
        })}
      </>
    )
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>

        {/* HEADER */}
        <div style={s.header}>
          <div style={s.headerTitle}>📖 Bible Engine — KJV</div>
          {bibleReady
            ? <div style={s.readyBadge}>✅ 31,100 Verses</div>
            : <div style={s.loadingBadge}>⏳ Loading...</div>
          }
          {multiSelected.length > 1 && (
            <div style={s.selectionBadge}>
              {multiSelected.length} verses selected
            </div>
          )}
          <div style={s.tabs}>
            <button
              style={{ ...s.tab, ...(tab === 'browse' ? s.tabActive : {}) }}
              onClick={() => setTab('browse')}
            >📚 Browse</button>
            <button
              style={{ ...s.tab, ...(tab === 'search' ? s.tabActive : {}) }}
              onClick={() => setTab('search')}
            >🔍 Search</button>
          </div>
          {multiSelected.length > 0 && (
            <button style={s.clearBtn} onClick={() => setMultiSelected([])}>
              Clear Selection
            </button>
          )}
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.body}>

          {/* LEFT */}
          <div style={s.leftCol}>

            {tab === 'browse' && (
              <>
                <div style={s.breadcrumb}>
                  <button style={s.breadcrumbBtn} onClick={() => { setBrowseView('books'); setMultiSelected([]) }}>
                    Books
                  </button>
                  {selectedBook && (
                    <>
                      <span style={s.breadcrumbSep}>›</span>
                      <button style={s.breadcrumbBtn} onClick={() => setBrowseView('chapters')}>
                        {selectedBook}
                      </button>
                    </>
                  )}
                  {selectedChapter > 0 && browseView === 'verses' && (
                    <>
                      <span style={s.breadcrumbSep}>›</span>
                      <span style={s.breadcrumbCurrent}>Chapter {selectedChapter}</span>
                    </>
                  )}
                  {browseView === 'verses' && (
                    <span style={s.hintText}>Click to select · Double-click to project</span>
                  )}
                </div>

                {browseView === 'books' && (
                  <div style={s.scrollArea}>
                    <div style={s.testament}>OLD TESTAMENT</div>
                    <div style={s.bookGrid}>
                      {OT_BOOKS.map(book => (
                        <button key={book} style={s.bookBtn}
                          onClick={() => bibleReady && selectBook(book)}
                        >{book}</button>
                      ))}
                    </div>
                    <div style={s.testament}>NEW TESTAMENT</div>
                    <div style={s.bookGrid}>
                      {NT_BOOKS.map(book => (
                        <button key={book} style={s.bookBtn}
                          onClick={() => bibleReady && selectBook(book)}
                        >{book}</button>
                      ))}
                    </div>
                  </div>
                )}

                {browseView === 'chapters' && (
                  <div style={s.scrollArea}>
                    <div style={s.chapterGrid}>
                      {chapters.map(ch => (
                        <button key={ch} style={s.chapterBtn}
                          onClick={() => selectChapter(ch)}
                        >{ch}</button>
                      ))}
                    </div>
                  </div>
                )}

                {browseView === 'verses' && (
                  <div style={s.scrollArea}>
                    <VerseList verses={chapterVerses} />
                  </div>
                )}
              </>
            )}

            {tab === 'search' && (
              <>
                <div style={s.searchBox}>
                  <input
                    style={s.searchInput}
                    placeholder='Try "John 3:16" or "Psalm 23" or "love"'
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    autoFocus
                  />
                  <button style={s.searchBtn} onClick={() => search()}>Search</button>
                </div>
                <div style={s.quickRefs}>
                  {QUICK_REFS.map(ref => (
                    <button key={ref} style={s.quickRef}
                      onClick={() => quickSearch(ref)}
                    >{ref}</button>
                  ))}
                </div>
                <div style={s.scrollArea}>
                  {!searched && (
                    <div style={s.noResults}>Search above or click a quick reference.</div>
                  )}
                  {searched && results.length === 0 && (
                    <div style={s.noResults}>No verses found.</div>
                  )}
                  {results.length > 0 && (
                    <div style={s.hintBanner}>
                      Click to select · Double-click to project instantly
                    </div>
                  )}
                  <VerseList verses={results} />
                </div>
              </>
            )}
          </div>

          {/* RIGHT */}
          <div style={s.rightCol}>

            <div style={s.section}>
              <div style={s.sectionLabel}>Text Position on Screen</div>
              <div style={s.positionGrid}>
                {POSITIONS.map(p => (
                  <button key={p.id}
                    style={{ ...s.posBtn, ...(currentPosition === p.id ? s.posBtnActive : {}) }}
                    onClick={() => onPositionChange(p.id)}
                  >
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <span style={{ fontSize: 10 }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={s.section}>
              <div style={s.sectionLabel}>Preview</div>
              <div style={s.previewScreen}>
                {displayVerses.length === 0 && (
                  <div style={s.previewEmpty}>Select a verse to preview</div>
                )}
                {displayVerses.length > 0 && currentPosition === 'center' && (
                  <div style={s.previewCenter}>
                    <div style={s.previewLine1}>{line1}</div>
                    {line2 && <div style={s.previewLine2}>{line2}</div>}
                    <div style={s.previewRef}>{refLabel} KJV</div>
                  </div>
                )}
                {displayVerses.length > 0 && currentPosition === 'bottom-bar' && (
                  <div style={s.previewBottomBar}>
                    <div style={s.previewBarText}>{line1}{line2 ? ' '+line2 : ''}</div>
                    <div style={s.previewBarRef}>{refLabel} · KJV</div>
                  </div>
                )}
                {displayVerses.length > 0 && currentPosition === 'top-bar' && (
                  <div style={s.previewTopBar}>
                    <div style={s.previewBarText}>{line1}{line2 ? ' '+line2 : ''}</div>
                    <div style={s.previewBarRef}>{refLabel} · KJV</div>
                  </div>
                )}
                {displayVerses.length > 0 && currentPosition === 'left-panel' && (
                  <div style={s.previewLeftPanel}>
                    <div style={s.previewPanelText}>{line1}</div>
                    {line2 && <div style={s.previewPanelText}>{line2}</div>}
                    <div style={s.previewPanelRef}>{refLabel}</div>
                  </div>
                )}
                {displayVerses.length > 0 && currentPosition === 'right-panel' && (
                  <div style={s.previewRightPanel}>
                    <div style={s.previewPanelText}>{line1}</div>
                    {line2 && <div style={s.previewPanelText}>{line2}</div>}
                    <div style={s.previewPanelRef}>{refLabel}</div>
                  </div>
                )}
              </div>
            </div>

            {displayVerses.length > 0 && (
              <div style={s.section}>
                <div style={s.sectionLabel}>
                  {multiSelected.length > 1
                    ? `${multiSelected.length} Verses Selected — ${refLabel}`
                    : `Selected — ${refLabel} KJV`
                  }
                </div>
                <div style={s.selectedText}>{combinedText}</div>
                <div style={s.actionRow}>
                  <button style={s.addServiceBtn}
                    onClick={() => onAddToService(displayVerses[0], displayVerses.slice(1))}
                  >+ Add to Service</button>
                  <button style={s.projectBtn}
                    onClick={() => onProjectVerse(displayVerses[0], currentPosition, displayVerses.slice(1))}
                  >▶ Project Now</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.88)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#0d1117', border: '1px solid #1e2d42',
    borderRadius: 12, width: '980px', maxWidth: '96vw',
    height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    padding: '12px 20px', borderBottom: '1px solid #1e2d42',
    display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
  },
  headerTitle: { fontSize: 15, fontWeight: 700, color: '#e8f0fe' },
  loadingBadge: {
    fontSize: 11, color: '#f59e0b',
    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: 20, padding: '2px 10px',
  },
  readyBadge: {
    fontSize: 11, color: '#22c55e',
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 20, padding: '2px 10px',
  },
  selectionBadge: {
    fontSize: 11, color: '#4f9eff',
    background: 'rgba(79,158,255,0.12)', border: '1px solid rgba(79,158,255,0.3)',
    borderRadius: 20, padding: '2px 10px', fontWeight: 600,
  },
  tabs: { display: 'flex', gap: 4, marginLeft: 4 },
  tab: {
    height: 28, padding: '0 14px',
    background: '#131820', border: '1px solid #1e2d42',
    borderRadius: 6, color: '#6b8299', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  tabActive: { background: 'rgba(79,158,255,0.12)', borderColor: '#4f9eff', color: '#4f9eff' },
  clearBtn: {
    height: 26, padding: '0 10px',
    background: 'transparent', border: '1px solid #3d526a',
    borderRadius: 5, color: '#6b8299', fontSize: 11, cursor: 'pointer',
  },
  closeBtn: {
    marginLeft: 'auto', background: 'transparent', border: 'none',
    color: '#6b8299', fontSize: 18, cursor: 'pointer',
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  leftCol: {
    width: '55%', display: 'flex', flexDirection: 'column',
    borderRight: '1px solid #1e2d42', overflow: 'hidden',
  },
  rightCol: {
    flex: 1, overflowY: 'auto', padding: 16,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  breadcrumb: {
    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
    padding: '8px 12px', borderBottom: '1px solid #1e2d42',
    flexShrink: 0, background: '#0a0e14',
  },
  breadcrumbBtn: {
    background: 'transparent', border: 'none', color: '#4f9eff',
    fontSize: 12, cursor: 'pointer', padding: '2px 4px', borderRadius: 4,
  },
  breadcrumbSep: { color: '#3d526a', fontSize: 12 },
  breadcrumbCurrent: { color: '#e8f0fe', fontSize: 12, fontWeight: 600 },
  hintText: { color: '#3d526a', fontSize: 10, marginLeft: 'auto' },
  hintBanner: {
    fontSize: 11, color: '#3d526a', textAlign: 'center',
    padding: '6px', marginBottom: 4,
    background: '#0a0e14', borderRadius: 5,
  },
  scrollArea: { flex: 1, overflowY: 'auto', padding: 10 },
  testament: {
    fontSize: 9.5, fontWeight: 700, color: '#3d526a',
    letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 4px 6px',
  },
  bookGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, marginBottom: 8 },
  bookBtn: {
    padding: '7px 6px', background: '#131820', border: '1px solid #1e2d42',
    borderRadius: 6, color: '#c0d0e0', fontSize: 11.5, cursor: 'pointer',
    textAlign: 'left', fontWeight: 500,
  },
  chapterGrid: { display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 6 },
  chapterBtn: {
    height: 36, background: '#131820', border: '1px solid #1e2d42',
    borderRadius: 6, color: '#c0d0e0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  verseRow: {
    display: 'flex', gap: 8, padding: '7px 8px',
    borderRadius: 6, cursor: 'pointer', marginBottom: 2,
    border: '1px solid transparent', alignItems: 'flex-start',
    userSelect: 'none' as const,
  },
  verseRowActive: {
    background: 'rgba(79,158,255,0.08)', borderColor: 'rgba(79,158,255,0.3)',
  },
  verseLeft: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  verseCheck: {
    width: 16, height: 16, borderRadius: 4,
    border: '1px solid #2a3f5f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all .15s',
  },
  verseNum: {
    fontSize: 10, fontWeight: 700, color: '#4f9eff',
    flexShrink: 0, minWidth: 20,
  },
  verseText: { fontSize: 12.5, color: '#c0d0e0', lineHeight: 1.55 },
  searchBox: {
    display: 'flex', gap: 8, padding: 12,
    borderBottom: '1px solid #1e2d42', flexShrink: 0,
  },
  searchInput: {
    flex: 1, height: 36, background: '#131820', border: '1px solid #1e2d42',
    borderRadius: 6, color: '#e8f0fe', padding: '0 12px', fontSize: 13, outline: 'none',
  },
  searchBtn: {
    height: 36, padding: '0 16px', background: '#4f9eff', border: 'none',
    borderRadius: 6, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  quickRefs: {
    display: 'flex', flexWrap: 'wrap', gap: 5,
    padding: '8px 12px', borderBottom: '1px solid #1e2d42', flexShrink: 0,
  },
  quickRef: {
    height: 24, padding: '0 8px', background: '#131820', border: '1px solid #1e2d42',
    borderRadius: 4, color: '#6b8299', fontSize: 10.5, cursor: 'pointer',
  },
  noResults: { color: '#3d526a', textAlign: 'center', padding: 32, fontSize: 13 },
  section: { background: '#131820', border: '1px solid #1e2d42', borderRadius: 8, padding: 12 },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: '#6b8299',
    textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10,
  },
  positionGrid: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 },
  posBtn: {
    height: 52, borderRadius: 7, border: '1px solid #1e2d42',
    background: '#0d1117', color: '#6b8299', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 4,
  },
  posBtnActive: { borderColor: '#4f9eff', color: '#4f9eff', background: 'rgba(79,158,255,0.08)' },
  previewScreen: {
    width: '100%', paddingBottom: '56.25%', position: 'relative',
    borderRadius: 6, overflow: 'hidden',
    background: 'linear-gradient(135deg,#0a1628,#0d1f3c)', border: '1px solid #1e2d42',
  },
  previewEmpty: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#3d526a', fontSize: 12,
  },
  previewCenter: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 16, textAlign: 'center', gap: 4,
  },
  previewLine1: { fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.4 },
  previewLine2: { fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.4 },
  previewRef: { fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  previewBottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'rgba(0,0,0,0.82)', borderTop: '2px solid #4f9eff', padding: '6px 12px',
  },
  previewTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    background: 'rgba(0,0,0,0.82)', borderBottom: '2px solid #4f9eff', padding: '6px 12px',
  },
  previewBarText: { fontSize: 10, fontWeight: 600, color: 'white', lineHeight: 1.4 },
  previewBarRef: { fontSize: 8.5, color: '#4f9eff', marginTop: 2 },
  previewLeftPanel: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: '40%',
    background: 'rgba(0,0,0,0.75)', borderRight: '2px solid #4f9eff',
    padding: '8px 10px', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', gap: 4,
  },
  previewRightPanel: {
    position: 'absolute', top: 0, bottom: 0, right: 0, width: '40%',
    background: 'rgba(0,0,0,0.75)', borderLeft: '2px solid #4f9eff',
    padding: '8px 10px', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', gap: 4,
  },
  previewPanelText: { fontSize: 10, fontWeight: 700, color: 'white', lineHeight: 1.4 },
  previewPanelRef: { fontSize: 8.5, color: '#4f9eff', marginTop: 4 },
  selectedText: { fontSize: 12.5, color: '#c0d0e0', lineHeight: 1.6, marginBottom: 12 },
  actionRow: { display: 'flex', gap: 8 },
  addServiceBtn: {
    flex: 1, height: 36, background: '#131820', border: '1px solid #1e2d42',
    borderRadius: 6, color: '#6b8299', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  projectBtn: {
    flex: 1, height: 36, background: '#4f9eff', border: 'none',
    borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
}