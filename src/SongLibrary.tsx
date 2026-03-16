import { useState } from 'react'
import { Song, Slide, loadSongs, saveSongs, lyricsToSlides } from './songLibrary'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  onClose: () => void
  onLoadSong: (song: Song) => void
}

type View = 'library' | 'add' | 'edit'

export default function SongLibrary({ onClose, onLoadSong }: Props) {
  const [songs, setSongs] = useState<Song[]>(loadSongs)
  const [view, setView] = useState<View>('library')
  const [search, setSearch] = useState('')
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null)

  // New song form
  const [newTitle, setNewTitle] = useState('')
  const [newArtist, setNewArtist] = useState('')
  const [newLyrics, setNewLyrics] = useState('')

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.artist.toLowerCase().includes(search.toLowerCase())
  )

  function addSong() {
    if (!newTitle.trim()) return
    const slides = newLyrics.trim()
      ? lyricsToSlides(newLyrics)
      : [{ id: uuidv4(), label: 'Verse 1', line1: 'New slide', line2: '', bright: false }]

    const song: Song = {
      id: uuidv4(),
      title: newTitle.trim(),
      artist: newArtist.trim(),
      slides,
    }
    const updated = [...songs, song]
    setSongs(updated)
    saveSongs(updated)
    setNewTitle('')
    setNewArtist('')
    setNewLyrics('')
    setView('library')
  }

  function deleteSong(id: string) {
    const updated = songs.filter(s => s.id !== id)
    setSongs(updated)
    saveSongs(updated)
  }

  function openEdit(song: Song) {
    setEditingSong({ ...song, slides: song.slides.map(s => ({ ...s })) })
    setView('edit')
  }

  function saveEdit() {
    if (!editingSong) return
    const updated = songs.map(s => s.id === editingSong.id ? editingSong : s)
    setSongs(updated)
    saveSongs(updated)
    setView('library')
    setEditingSong(null)
  }

  function updateSlide(slideId: string, field: keyof Slide, value: string | boolean) {
    if (!editingSong) return
    setEditingSong({
      ...editingSong,
      slides: editingSong.slides.map(s =>
        s.id === slideId ? { ...s, [field]: value } : s
      )
    })
  }

  function addSlide() {
    if (!editingSong) return
    const newSlide: Slide = {
      id: uuidv4(),
      label: 'Verse',
      line1: 'New line 1',
      line2: 'New line 2',
      bright: false,
    }
    setEditingSong({
      ...editingSong,
      slides: [...editingSong.slides, newSlide]
    })
  }

  function deleteSlide(slideId: string) {
    if (!editingSong) return
    setEditingSong({
      ...editingSong,
      slides: editingSong.slides.filter(s => s.id !== slideId)
    })
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            {view !== 'library' && (
              <button style={styles.backBtn} onClick={() => { setView('library'); setEditingSong(null) }}>
                ← Back
              </button>
            )}
            <div style={styles.title}>
              {view === 'library' && '🎵 Song Library'}
              {view === 'add' && '➕ Add New Song'}
              {view === 'edit' && `✏️ Edit — ${editingSong?.title}`}
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* ── LIBRARY VIEW ── */}
        {view === 'library' && (
          <div style={styles.body}>
            <div style={styles.searchRow}>
              <input
                style={styles.searchInput}
                placeholder="🔍 Search songs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button style={styles.addBtn} onClick={() => setView('add')}>
                + Add Song
              </button>
            </div>

            <div style={styles.songList}>
              {filtered.length === 0 && (
                <div style={styles.empty}>No songs found. Add your first song!</div>
              )}
              {filtered.map(song => (
                <div key={song.id} style={styles.songRow}>
                  <div style={styles.songIcon}>♪</div>
                  <div style={styles.songInfo}>
                    <div style={styles.songTitle}>{song.title}</div>
                    <div style={styles.songMeta}>{song.artist} · {song.slides.length} slides</div>
                  </div>
                  <div style={styles.songActions}>
                    <button style={styles.actionBtn} onClick={() => openEdit(song)}>
                      ✏️ Edit
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.loadBtn }}
                      onClick={() => { onLoadSong(song); onClose() }}
                    >
                      ▶ Load
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                      onClick={() => deleteSong(song.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADD SONG VIEW ── */}
        {view === 'add' && (
          <div style={styles.body}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Song Title *</label>
              <input
                style={styles.input}
                placeholder="e.g. Amazing Grace"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Artist / Band</label>
              <input
                style={styles.input}
                placeholder="e.g. Chris Tomlin"
                value={newArtist}
                onChange={e => setNewArtist(e.target.value)}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Paste Lyrics{' '}
                <span style={styles.hint}>
                  (use [Verse], [Chorus], [Bridge] to label sections)
                </span>
              </label>
              <textarea
                style={styles.textarea}
                placeholder={`[Verse 1]\nAmazing grace how sweet the sound\nThat saved a wretch like me\n\n[Chorus]\nMy chains are gone I've been set free\nMy God my Savior has ransomed me`}
                value={newLyrics}
                onChange={e => setNewLyrics(e.target.value)}
                rows={12}
              />
            </div>
            <div style={styles.formActions}>
              <button style={styles.cancelBtn} onClick={() => setView('library')}>
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={addSong}>
                ✓ Save Song
              </button>
            </div>
          </div>
        )}

        {/* ── EDIT VIEW ── */}
        {view === 'edit' && editingSong && (
          <div style={styles.body}>
            <div style={styles.editTopRow}>
              <div style={styles.formGroup} >
                <label style={styles.label}>Title</label>
                <input
                  style={styles.input}
                  value={editingSong.title}
                  onChange={e => setEditingSong({ ...editingSong, title: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Artist</label>
                <input
                  style={styles.input}
                  value={editingSong.artist}
                  onChange={e => setEditingSong({ ...editingSong, artist: e.target.value })}
                />
              </div>
            </div>

            <div style={styles.slidesHeader}>
              <div style={styles.label}>Slides ({editingSong.slides.length})</div>
              <button style={styles.addSlideBtn} onClick={addSlide}>+ Add Slide</button>
            </div>

            <div style={styles.slideEditList}>
              {editingSong.slides.map((slide, idx) => (
                <div key={slide.id} style={styles.slideEditRow}>
                  <div style={styles.slideEditNum}>{idx + 1}</div>
                  <div style={styles.slideEditFields}>
                    <input
                      style={styles.slideInput}
                      placeholder="Label (e.g. Chorus)"
                      value={slide.label}
                      onChange={e => updateSlide(slide.id, 'label', e.target.value)}
                    />
                    <input
                      style={styles.slideInput}
                      placeholder="Line 1"
                      value={slide.line1}
                      onChange={e => updateSlide(slide.id, 'line1', e.target.value)}
                    />
                    <input
                      style={styles.slideInput}
                      placeholder="Line 2"
                      value={slide.line2}
                      onChange={e => updateSlide(slide.id, 'line2', e.target.value)}
                    />
                    <label style={styles.brightToggle}>
                      <input
                        type="checkbox"
                        checked={slide.bright}
                        onChange={e => updateSlide(slide.id, 'bright', e.target.checked)}
                      />
                      <span style={{ marginLeft: 6 }}>Gold text (chorus)</span>
                    </label>
                  </div>
                  <button
                    style={styles.deleteSlideBtn}
                    onClick={() => deleteSlide(slide.id)}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.formActions}>
              <button style={styles.cancelBtn} onClick={() => { setView('library'); setEditingSong(null) }}>
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={saveEdit}>
                ✓ Save Changes
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#0d1117',
    border: '1px solid #1e2d42',
    borderRadius: 12,
    width: '860px',
    maxWidth: '95vw',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #1e2d42',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  title: {
    fontSize: 16, fontWeight: 700, color: '#e8f0fe',
  },
  closeBtn: {
    background: 'transparent', border: 'none',
    color: '#6b8299', fontSize: 18, cursor: 'pointer',
  },
  backBtn: {
    background: '#1a2233', border: '1px solid #1e2d42',
    color: '#6b8299', fontSize: 12, padding: '4px 10px',
    borderRadius: 5, cursor: 'pointer',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: 20,
  },
  searchRow: {
    display: 'flex', gap: 10, marginBottom: 16,
  },
  searchInput: {
    flex: 1, height: 36,
    background: '#131820', border: '1px solid #1e2d42',
    borderRadius: 6, color: '#e8f0fe', padding: '0 12px',
    fontSize: 13, outline: 'none',
  },
  addBtn: {
    height: 36, padding: '0 16px',
    background: '#4f9eff', border: 'none',
    borderRadius: 6, color: 'white',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  songList: { display: 'flex', flexDirection: 'column', gap: 6 },
  empty: { color: '#6b8299', textAlign: 'center', padding: 40, fontSize: 14 },
  songRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', borderRadius: 8,
    background: '#131820', border: '1px solid #1e2d42',
  },
  songIcon: {
    width: 36, height: 36, borderRadius: 8,
    background: 'rgba(167,139,250,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, flexShrink: 0,
  },
  songInfo: { flex: 1, minWidth: 0 },
  songTitle: { fontSize: 13, fontWeight: 600, color: '#e8f0fe' },
  songMeta: { fontSize: 11, color: '#6b8299', marginTop: 2 },
  songActions: { display: 'flex', gap: 6 },
  actionBtn: {
    height: 28, padding: '0 10px',
    background: '#1a2233', border: '1px solid #1e2d42',
    borderRadius: 5, color: '#6b8299',
    fontSize: 11, cursor: 'pointer',
  },
  loadBtn: { borderColor: '#4f9eff', color: '#4f9eff' },
  deleteBtn: { borderColor: '#ef4444', color: '#ef4444' },
  formGroup: { marginBottom: 16, flex: 1 },
  label: { fontSize: 11, fontWeight: 600, color: '#6b8299', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 },
  hint: { fontSize: 10, color: '#3d526a', textTransform: 'none', fontWeight: 400 },
  input: {
    width: '100%', height: 36,
    background: '#131820', border: '1px solid #1e2d42',
    borderRadius: 6, color: '#e8f0fe', padding: '0 12px',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', background: '#131820',
    border: '1px solid #1e2d42', borderRadius: 6,
    color: '#e8f0fe', padding: '10px 12px',
    fontSize: 13, outline: 'none', resize: 'vertical',
    fontFamily: 'monospace', lineHeight: 1.6, boxSizing: 'border-box',
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: {
    height: 36, padding: '0 20px',
    background: 'transparent', border: '1px solid #1e2d42',
    borderRadius: 6, color: '#6b8299', fontSize: 13, cursor: 'pointer',
  },
  saveBtn: {
    height: 36, padding: '0 24px',
    background: '#4f9eff', border: 'none',
    borderRadius: 6, color: 'white',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  editTopRow: { display: 'flex', gap: 16, marginBottom: 8 },
  slidesHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  addSlideBtn: {
    height: 28, padding: '0 12px',
    background: '#1a2233', border: '1px solid #4f9eff',
    borderRadius: 5, color: '#4f9eff',
    fontSize: 11, cursor: 'pointer',
  },
  slideEditList: { display: 'flex', flexDirection: 'column', gap: 8 },
  slideEditRow: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 12px', borderRadius: 8,
    background: '#131820', border: '1px solid #1e2d42',
  },
  slideEditNum: {
    width: 24, height: 24, borderRadius: 4,
    background: '#1a2233', color: '#6b8299',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, flexShrink: 0, marginTop: 4,
  },
  slideEditFields: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  slideInput: {
    width: '100%', height: 32,
    background: '#0d1117', border: '1px solid #1e2d42',
    borderRadius: 5, color: '#e8f0fe', padding: '0 10px',
    fontSize: 12, outline: 'none', boxSizing: 'border-box',
  },
  brightToggle: {
    display: 'flex', alignItems: 'center',
    fontSize: 11, color: '#6b8299', cursor: 'pointer',
  },
  deleteSlideBtn: {
    background: 'transparent', border: 'none',
    color: '#ef4444', fontSize: 14, cursor: 'pointer',
    padding: '4px', flexShrink: 0,
  },
}