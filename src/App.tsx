import { useState } from 'react'
import './App.css'

const serviceItems = [
  { id: 1, type: 'timer',    icon: '⏱', name: 'Welcome Countdown',     meta: '10:00 remaining',     badge: '' },
  { id: 2, type: 'video',    icon: '▶', name: 'Welcome Loop Video',     meta: 'loop · 2:34',         badge: '' },
  { id: 3, type: 'song',     icon: '♪', name: 'Goodness of God',        meta: 'Bethel Music · 6 slides', badge: 'LIVE' },
  { id: 4, type: 'song',     icon: '♪', name: 'Way Maker',              meta: 'Sinach · 8 slides',   badge: '' },
  { id: 5, type: 'song',     icon: '♪', name: 'What a Beautiful Name',  meta: 'Hillsong · 7 slides', badge: '' },
  { id: 6, type: 'announce', icon: '📢', name: 'Announcements',         meta: '4 slides',            badge: '' },
  { id: 7, type: 'bible',    icon: '📖', name: 'John 3:16–21',          meta: 'NIV · 6 verses',      badge: '' },
  { id: 8, type: 'sermon',   icon: '🎯', name: 'Sermon: The Kingdom',   meta: '22 slides',           badge: '' },
]

const slides = [
  { id: 1, label: 'Verse 1', number: 1, line1: 'You are here',           line2: 'moving in our midst',          bright: true  },
  { id: 2, label: 'Verse 1', number: 2, line1: 'I worship You',          line2: 'I worship You',                bright: false },
  { id: 3, label: 'Verse 2', number: 3, line1: 'You are here',           line2: 'working in this place',        bright: false },
  { id: 4, label: 'Verse 2', number: 4, line1: 'I worship You',          line2: 'I worship You',                bright: false },
  { id: 5, label: 'Chorus',  number: 5, line1: 'Way maker, miracle worker', line2: 'Promise keeper',            bright: true  },
  { id: 6, label: 'Chorus',  number: 6, line1: 'Light in the darkness', line2: 'My God, that is who You are',  bright: true  },
  { id: 7, label: 'Bridge',  number: 7, line1: "Even when I don't see it", line2: "You're working",            bright: false },
  { id: 8, label: 'Blank',   number: 8, line1: '',                       line2: '',                             bright: false },
]

export default function App() {
  const [activeItem, setActiveItem]   = useState(4)
  const [liveSlide,  setLiveSlide]    = useState(1)
  const [activeSlide, setActiveSlide] = useState(2)
  const [seconds, setSeconds]         = useState(42 * 60 + 17)

  // tick the service timer
  useState(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  })

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`

  const liveData   = slides.find(s => s.id === liveSlide)!
  const activeData = slides.find(s => s.id === activeSlide)!

  const goLive = () => {
  const slide = slides.find(s => s.id === activeSlide)
  if (!slide) return
  setLiveSlide(activeSlide)
  const payload = {
    line1: slide.line1,
    line2: slide.line2,
    label: slide.label,
    bright: slide.bright,
    blank: false,
  }
  // Small delay ensures IPC fires cleanly after state update
  setTimeout(() => {
    if ((window as any).outreach) {
      (window as any).outreach.projectSlide(payload)
    }
  }, 50)
}

  const next = () => {
  const idx = slides.findIndex(s => s.id === liveSlide)
  if (idx < slides.length - 1) {
    const nextSlide = slides[idx + 1]
    setLiveSlide(nextSlide.id)
    if ((window as any).outreach) {
      (window as any).outreach.projectSlide({
        line1: nextSlide.line1,
        line2: nextSlide.line2,
        label: nextSlide.label,
        bright: nextSlide.bright,
        blank: false,
      })
    }
  }
}
  const prev = () => {
  const idx = slides.findIndex(s => s.id === liveSlide)
  if (idx > 0) {
    const prevSlide = slides[idx - 1]
    setLiveSlide(prevSlide.id)
    if ((window as any).outreach) {
      (window as any).outreach.projectSlide({
        line1: prevSlide.line1,
        line2: prevSlide.line2,
        label: prevSlide.label,
        bright: prevSlide.bright,
        blank: false,
      })
    }
  }
}

  return (
    <div className="app">

      {/* ── TITLE BAR ── */}
      <div className="titlebar">
        <div className="logo"><span className="logo-accent">OUT</span>reach</div>
        <div className="tb-menu">
          {['File','Service','Library','Outputs','AI Tools','Settings'].map(m =>
            <div key={m} className="tb-item">{m}</div>
          )}
        </div>
        <div className="tb-right">
          <div className="ai-pill">✦ AI Ready</div>
          <div className="live-badge"><span className="live-dot"/> LIVE</div>
          <div className="service-file">Sunday_Morning_Service.outs</div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="body">

        {/* LEFT ICON SIDEBAR */}
        <div className="sidebar">
          {['📋','🎵','📖','🎬','🎨','📡','⚡','🖥','☁'].map((icon, i) => (
            <div key={i} className={`sb-icon ${i === 0 ? 'active' : ''}`}>{icon}</div>
          ))}
        </div>

        {/* SERVICE FLOW */}
        <div className="service-panel">
          <div className="panel-header">
            <span className="panel-title">Service Flow</span>
            <div style={{display:'flex',gap:4}}>
              <button className="mini-btn">+</button>
              <button className="mini-btn">⊞</button>
            </div>
          </div>
          <div className="service-list">
            {serviceItems.map(item => (
              <div
                key={item.id}
                className={`service-item ${activeItem === item.id ? 'active' : ''} ${item.badge === 'LIVE' ? 'item-live' : ''}`}
                onClick={() => setActiveItem(item.id)}
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
            <span className="song-title">Way Maker</span>
            <span className="song-meta">Sinach · 8 slides</span>
            <div style={{marginLeft:'auto', display:'flex', gap:8}}>
              <button className="tb-btn">✦ Edit Lyrics</button>
              <button className="tb-btn">🎨 Theme</button>
              <button className="tb-btn primary" onClick={goLive}>▶ Go Live</button>
            </div>
          </div>
          <div className="slide-grid">
            {slides.map(slide => (
              <div
                key={slide.id}
                className={`slide-card ${liveSlide === slide.id ? 'slide-live' : ''} ${activeSlide === slide.id ? 'slide-active' : ''}`}
                onClick={() => setActiveSlide(slide.id)}
                onDoubleClick={() => setLiveSlide(slide.id)}
              >
                <div className="slide-preview">
                  <div className={`slide-text ${slide.bright ? 'bright' : ''}`}>
                    {slide.line1}<br/>{slide.line2}
                  </div>
                  {liveSlide === slide.id && <div className="slide-live-tag">LIVE</div>}
                </div>
                <div className="slide-footer">
                  <span className="slide-label">{slide.label}</span>
                  <span className="slide-num">{slide.number}</span>
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
              <div className={`preview-lyric ${liveData.bright ? 'bright' : ''}`}>
                {liveData.line1}<br/>{liveData.line2}
              </div>
              <div className="corner-tag live-corner">LIVE</div>
            </div>
          </div>

          <div className="preview-block">
            <div className="preview-label"><span className="dot dot-next"/>NEXT SLIDE</div>
            <div className="preview-screen next-screen">
              <div className="preview-lyric dim">
                {activeData.line1}<br/>{activeData.line2}
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
              <button className="ctrl-btn amber">◻ Blank</button>
              <button className="ctrl-btn">⬛ Black</button>
              <button className="ctrl-btn green">↻ Loop</button>
            </div>
          </div>

          <div className="output-status">
            <div className="preview-label">Outputs</div>
            {[
              { name: 'Main Screen',    res: '1920×1080', status: 'live'     },
              { name: 'Stage Monitor',  res: '1280×720',  status: 'active'   },
              { name: 'Livestream',     res: '1920×1080', status: 'active'   },
              { name: 'LED Wall',       res: 'offline',   status: 'inactive' },
            ].map(o => (
              <div key={o.name} className="output-row">
                <div className="output-name"><span className={`dot dot-${o.status}`}/>{o.name}</div>
                <div className="output-res">{o.res}</div>
              </div>
            ))}
          </div>

          <div className="quick-section">
            <div className="preview-label">Quick Project</div>
            <input className="quick-input" placeholder="Type a verse, lyric, or message..." />
            <div className="quick-grid">
              {[['📖','Bible'],['🎵','Song'],['📢','Announce'],['✦','AI Gen']].map(([icon, label]) => (
                <button key={label} className="quick-btn"><span>{icon}</span>{label}</button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="bottom-bar">
        <div className="status-chip"><span className="dot dot-active"/>Service Running</div>
        <div className="status-chip">🖥 3 Outputs Active</div>
        <div className="status-chip">♪ Way Maker · Slide {liveSlide}/8</div>
        <div className="bb-right">
          <span className="shortcut"><kbd>Space</kbd>Next <kbd>←</kbd>Prev <kbd>B</kbd>Blank</span>
          <div className="timer">{fmt(seconds)}</div>
        </div>
      </div>

    </div>
  )
}