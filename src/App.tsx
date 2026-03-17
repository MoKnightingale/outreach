import { useState } from 'react'
import './App.css'
import SongLibrary from './SongLibrary.tsx'
import { Song, loadSongs } from './songLibrary.ts'
import BibleEngine, { OverlayPosition } from './BibleEngine.tsx'
import { Verse, splitVerseText, formatRef } from './bibleData.ts'
import CameraManager from './CameraManager.tsx'

interface ServiceItem {
  id: number
  type: string
  icon: string
  name: string
  meta: string
  badge: string
  slides: SlideData[]
}

interface SlideData {
  id: string
  label: string
  line1: string
  line2: string
  bright: boolean
}

const initialItems: ServiceItem[] = [
  { id: 1, type: 'timer',    icon: '⏱', name: 'Welcome Countdown',   meta: '10:00 remaining', badge: '', slides: [] },
  { id: 2, type: 'video',    icon: '▶', name: 'Welcome Loop Video',   meta: 'loop · 2:34',     badge: '', slides: [] },
  { id: 3, type: 'announce', icon: '📢', name: 'Announcements',       meta: '4 slides',        badge: '', slides: [] },
  { id: 4, type: 'bible',    icon: '📖', name: 'John 3:16–21',        meta: 'KJV · 6 verses',  badge: '', slides: [] },
  { id: 5, type: 'sermon',   icon: '🎯', name: 'Sermon: The Kingdom', meta: '22 slides',       badge: '', slides: [] },
]

export default function App() {
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>(() => {
    const songs = loadSongs()
    const songItems: ServiceItem[] = songs.map((song, i) => ({
      id: 100 + i,
      type: 'song',
      icon: '♪',
      name: song.title,
      meta: `${song.artist} · ${song.slides.length} slides`,
      badge: i === 0 ? 'LIVE' : '',
      slides: song.slides,
    }))
    return [...initialItems.slice(0, 2), ...songItems, ...initialItems.slice(2)]
  })

  const [activeItemId, setActiveItemId]       = useState<number>(102)
  const [liveSlideId, setLiveSlideId]         = useState<string>('')
  const [activeSlideId, setActiveSlideId]     = useState<string>('')
  const [seconds, setSeconds]                 = useState(42 * 60 + 17)
  const [showLibrary, setShowLibrary]         = useState(false)
  const [showBible, setShowBible]             = useState(false)
  const [showCamera, setShowCamera]           = useState(false)
  const [activeCamera, setActiveCamera]       = useState<string | null>(null)
  const [overlayPosition, setOverlayPosition] = useState<OverlayPosition>('center')

  useState(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  })

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`

  const activeItem  = serviceItems.find(i => i.id === activeItemId)
  const slides      = activeItem?.slides || []
  const liveSlide   = slides.find(s => s.id === liveSlideId)
  const activeSlide = slides.find(s => s.id === activeSlideId)

  function selectItem(item: ServiceItem) {
    setActiveItemId(item.id)
    if (item.slides.length > 0) setActiveSlideId(item.slides[0].id)
  }

  function send(data: object) {
    if ((window as any).outreach) {
      (window as any).outreach.projectSlide(data)
    }
  }

  function goLive() {
    const slide = slides.find(s => s.id === activeSlideId)
    if (!slide) return
    setLiveSlideId(activeSlideId)
    setServiceItems(items => items.map(i =>
      i.type === 'song' ? { ...i, badge: i.id === activeItemId ? 'LIVE' : '' } : i
    ))
    send({ line1: slide.line1, line2: slide.line2, label: slide.label, bright: slide.bright, blank: false })
  }

  function projectSlide(slide: SlideData) {
    setLiveSlideId(slide.id)
    send({ line1: slide.line1, line2: slide.line2, label: slide.label, bright: slide.bright, blank: false })
  }

  function next() {
    const idx = slides.findIndex(s => s.id === liveSlideId)
    if (idx < slides.length - 1) projectSlide(slides[idx + 1])
  }

  function prev() {
    const idx = slides.findIndex(s => s.id === liveSlideId)
    if (idx > 0) projectSlide(slides[idx - 1])
  }

  function blankScreen() {
    send({ blank: true })
  }

  function loadSongToService(song: Song) {
    const newItem: ServiceItem = {
      id: Date.now(), type: 'song', icon: '♪',
      name: song.title,
      meta: `${song.artist} · ${song.slides.length} slides`,
      badge: '', slides: song.slides,
    }
    setServiceItems(items => {
      const insertAt = items.findIndex(i => i.type === 'sermon')
      const copy = [...items]
      copy.splice(insertAt < 0 ? copy.length : insertAt, 0, newItem)
      return copy
    })
    setActiveItemId(newItem.id)
    setActiveSlideId(song.slides[0]?.id || '')
  }

  function projectVerse(verse: Verse, position: OverlayPosition, extra?: Verse[]) {
    const allVerses = [verse, ...(extra || [])]
    const combinedText = allVerses.map(v => v.text).join(' ')
    const refLabel = allVerses.length > 1
      ? `${formatRef(allVerses[0])}–${allVerses[allVerses.length - 1].verse}`
      : formatRef(allVerses[0])
    const { line1, line2 } = splitVerseText(combinedText)
    send({ line1, line2, ref: refLabel + ' KJV', position, isOverlay: true, blank: false })
  }

  function addVerseToService(verse: Verse, extra?: Verse[]) {
    const allVerses = [verse, ...(extra || [])]
    const combinedText = allVerses.map(v => v.text).join(' ')
    const refLabel = allVerses.length > 1
      ? `${formatRef(allVerses[0])}–${allVerses[allVerses.length - 1].verse}`
      : formatRef(allVerses[0])
    const { line1, line2 } = splitVerseText(combinedText)
    const newItem: ServiceItem = {
      id: Date.now(), type: 'bible', icon: '📖',
      name: refLabel,
      meta: `KJV · ${combinedText.slice(0, 35)}...`,
      badge: '',
      slides: [{ id: String(Date.now()), label: refLabel, line1, line2, bright: false }],
    }
    setServiceItems(items => [...items, newItem])
    setShowBible(false)
  }

  function startCamera(deviceId: string) {
    setActiveCamera(deviceId)
    send({ cameraAction: 'start', deviceId })
  }

  function stopCamera() {
    setActiveCamera(null)
    send({ cameraAction: 'stop' })
  }

  function mixCameras(deviceIds: string[]) {
    setActiveCamera(deviceIds[0])
    send({ cameraAction: 'mix', deviceIds })
  }

  function handleMenuClick(m: string) {
    if (m === 'Library') setShowLibrary(true)
    if (m === 'Service') setShowBible(true)
    if (m === 'Outputs') setShowCamera(true)
  }

  function handleSidebarClick(i: number) {
    if (i === 1) setShowLibrary(true)
    if (i === 2) setShowBible(true)
    if (i === 3) setShowCamera(true)
    if (i === 7) setShowCamera(true)
  }

  return (
    <div className="app">

      {/* ── MODALS ── */}
      {showLibrary && (
        <SongLibrary
          onClose={() => setShowLibrary(false)}
          onLoadSong={loadSongToService}
        />
      )}

      {showBible && (
        <BibleEngine
          onClose={() => setShowBible(false)}
          currentPosition={overlayPosition}
          onPositionChange={(pos) => {
            setOverlayPosition(pos)
            send({ setPosition: pos })
          }}
          onProjectVerse={projectVerse}
          onAddToService={addVerseToService}
        />
      )}

      {showCamera && (
        <CameraManager
          onClose={() => setShowCamera(false)}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          onMixCameras={mixCameras}
          activeCamera={activeCamera}
        />
      )}

      {/* ── TITLE BAR ── */}
      <div className="titlebar">
        <div className="logo"><span className="logo-accent">OUT</span>reach</div>
        <div className="tb-menu">
          {['File','Service','Library','Outputs','AI Tools','Settings'].map(m => (
            <div key={m} className="tb-item"
              onClick={() => handleMenuClick(m)}
              style={['Library','Service','Outputs'].includes(m) ? { color: '#4f9eff' } : {}}
            >{m}</div>
          ))}
        </div>
        <div className="tb-right">
          <div className="ai-pill">✦ AI Ready</div>
          {activeCamera && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 20, padding: '3px 10px',
                fontSize: 10.5, fontWeight: 700, color: '#ef4444', cursor: 'pointer',
              }}
              onClick={() => setShowCamera(true)}
            >
              <span style={{ width: 6, height: 6, background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}/>
              CAMERA LIVE
            </div>
          )}
          <div className="live-badge"><span className="live-dot"/> LIVE</div>
          <div className="service-file">Sunday_Morning_Service.outs</div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="body">

        {/* SIDEBAR */}
        <div className="sidebar">
          {['📋','🎵','📖','🎬','🎨','📡','⚡','🖥','☁'].map((icon, i) => (
            <div key={i}
              className={`sb-icon ${i === 0 ? 'active' : ''}`}
              onClick={() => handleSidebarClick(i)}
              title={['Service','Songs','Bible','Media','Design','Stream','Automation','Outputs','Cloud'][i]}
            >{icon}</div>
          ))}
        </div>

        {/* SERVICE FLOW */}
        <div className="service-panel">
          <div className="panel-header">
            <span className="panel-title">Service Flow</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="mini-btn" onClick={() => setShowLibrary(true)} title="Add Song">♪</button>
              <button className="mini-btn" onClick={() => setShowBible(true)} title="Add Bible">📖</button>
              <button className="mini-btn" onClick={() => setShowCamera(true)} title="Camera">🎥</button>
            </div>
          </div>
          <div className="service-list">
            {serviceItems.map(item => (
              <div
                key={item.id}
                className={`service-item ${activeItemId === item.id ? 'active' : ''} ${item.badge === 'LIVE' ? 'item-live' : ''}`}
                onClick={() => selectItem(item)}
              >
                <div className={`item-badge badge-${item.type}`}>{item.icon}</div>
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-meta">{item.meta}</div>
                </div>
                {item.badge && <div className="live-tag">{item.badge}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* SLIDE GRID */}
        <div className="slide-workspace">
          <div className="slide-toolbar">
            <span className="song-title">{activeItem?.name || 'Select an item'}</span>
            <span className="song-meta">{activeItem?.meta}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="tb-btn" onClick={() => setShowCamera(true)}>
                🎥 {activeCamera ? 'Camera Live' : 'Camera'}
              </button>
              <button className="tb-btn" onClick={() => setShowBible(true)}>📖 Bible</button>
              <button className="tb-btn" onClick={() => setShowLibrary(true)}>🎵 Songs</button>
              <button className="tb-btn primary" onClick={goLive}>▶ Go Live</button>
            </div>
          </div>
          <div className="slide-grid">
            {slides.length === 0 && (
              <div style={{ gridColumn: '1/-1', color: '#3d526a', textAlign: 'center', padding: 40, fontSize: 13 }}>
                Select an item from the service flow to see its slides
              </div>
            )}
            {slides.map(slide => (
              <div
                key={slide.id}
                className={`slide-card ${liveSlideId === slide.id ? 'slide-live' : ''} ${activeSlideId === slide.id ? 'slide-active' : ''}`}
                onClick={() => setActiveSlideId(slide.id)}
                onDoubleClick={() => projectSlide(slide)}
              >
                <div className="slide-preview">
                  <div className={`slide-text ${slide.bright ? 'bright' : ''}`}>
                    {slide.line1}<br/>{slide.line2}
                  </div>
                  {liveSlideId === slide.id && <div className="slide-live-tag">LIVE</div>}
                </div>
                <div className="slide-footer">
                  <span className="slide-label">{slide.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">

          <div className="preview-block">
            <div className="preview-label"><span className="dot dot-live"/>LIVE OUTPUT</div>
            <div className="preview-screen live-screen">
              <div className={`preview-lyric ${liveSlide?.bright ? 'bright' : ''}`}>
                {liveSlide ? <>{liveSlide.line1}<br/>{liveSlide.line2}</> : 'No slide live'}
              </div>
              <div className="corner-tag live-corner">LIVE</div>
            </div>
          </div>

          <div className="preview-block">
            <div className="preview-label"><span className="dot dot-next"/>NEXT SLIDE</div>
            <div className="preview-screen next-screen">
              <div className="preview-lyric dim">
                {activeSlide ? <>{activeSlide.line1}<br/>{activeSlide.line2}</> : 'Select a slide'}
              </div>
              <div className="corner-tag next-corner">NEXT</div>
            </div>
          </div>

          <div className="controls">
            <div className="ctrl-row">
              <button className="ctrl-btn" onClick={prev}>◀◀ Prev</button>
              <button className="ctrl-btn go-live" onClick={goLive}>● GO LIVE</button>
              <button className="ctrl-btn" onClick={next}>Next ▶▶</button>
            </div>
            <div className="ctrl-row">
              <button className="ctrl-btn amber" onClick={blankScreen}>◻ Blank</button>
              <button className="ctrl-btn" onClick={() => send({ blank: true, black: true })}>⬛ Black</button>
              <button className="ctrl-btn green">↻ Loop</button>
            </div>
          </div>

          <div className="output-status">
            <div className="preview-label">Outputs</div>
            {[
              { name: 'Main Screen',   res: '1920×1080', status: 'live'     },
              { name: 'Stage Monitor', res: '1280×720',  status: 'active'   },
              { name: 'Livestream',    res: '1920×1080', status: 'active'   },
              { name: 'LED Wall',      res: 'offline',   status: 'inactive' },
            ].map(o => (
              <div key={o.name} className="output-row">
                <div className="output-name"><span className={`dot dot-${o.status}`}/>{o.name}</div>
                <div className="output-res">{o.res}</div>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <button
                style={{
                  width: '100%', height: 30,
                  background: activeCamera ? 'rgba(239,68,68,0.12)' : '#131820',
                  border: `1px solid ${activeCamera ? '#ef4444' : '#1e2d42'}`,
                  borderRadius: 6, cursor: 'pointer',
                  color: activeCamera ? '#ef4444' : '#6b8299',
                  fontSize: 11, fontWeight: 600,
                }}
                onClick={() => setShowCamera(true)}
              >
                {activeCamera ? '● Camera Live — Manage' : '🎥 Camera Manager'}
              </button>
            </div>
          </div>

          <div className="quick-section">
            <div className="preview-label">Quick Project</div>
            <input className="quick-input" placeholder="Type a verse, lyric, or message..." />
            <div className="quick-grid">
              {[['📖','Bible'],['🎵','Song'],['🎥','Camera'],['✦','AI Gen']].map(([icon, label]) => (
                <button key={label} className="quick-btn"
                  onClick={() => {
                    if (label === 'Song') setShowLibrary(true)
                    if (label === 'Bible') setShowBible(true)
                    if (label === 'Camera') setShowCamera(true)
                  }}
                ><span>{icon}</span>{label}</button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="bottom-bar">
        <div className="status-chip"><span className="dot dot-active"/>Service Running</div>
        <div className="status-chip">🖥 3 Outputs Active</div>
        <div className="status-chip">
          {activeCamera ? '🎥 Camera Active' : activeItem ? `♪ ${activeItem.name} · ${slides.length} slides` : 'No item selected'}
        </div>
        <div className="bb-right">
          <span className="shortcut"><kbd>Space</kbd>Next <kbd>←</kbd>Prev <kbd>B</kbd>Blank</span>
          <div className="timer">{fmt(seconds)}</div>
        </div>
      </div>

    </div>
  )
}