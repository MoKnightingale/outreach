import { useState, useEffect, useRef } from 'react'

interface Camera {
  deviceId: string
  label: string
}

interface Props {
  onClose: () => void
  onStartCamera: (deviceId: string) => void
  onStopCamera: () => void
  onMixCameras: (deviceIds: string[]) => void
  activeCamera: string | null
}

export default function CameraManager({
  onClose, onStartCamera, onStopCamera, onMixCameras, activeCamera
}: Props) {
  const [cameras, setCameras]           = useState<Camera[]>([])
  const [previews, setPreviews]         = useState<Record<string, MediaStream>>({})
  const [selected, setSelected]         = useState<string[]>([])
  const [mixMode, setMixMode]           = useState(false)
  const [loading, setLoading]           = useState(true)
  const previewRefs                     = useRef<Record<string, HTMLVideoElement | null>>({})

  useEffect(() => {
    loadCameras()
    return () => {
      // Stop all preview streams on unmount
      Object.values(previews).forEach(s => s.getTracks().forEach(t => t.stop()))
    }
  }, [])

  async function loadCameras() {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ video: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices
        .filter(d => d.kind === 'videoinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`
        }))
      setCameras(videoDevices)
      setLoading(false)

      // Start previews for all cameras
      videoDevices.forEach(cam => startPreview(cam.deviceId))
    } catch(e) {
      console.error('Camera access error:', e)
      setLoading(false)
    }
  }

  async function startPreview(deviceId: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: 320, height: 180 }
      })
      setPreviews(prev => ({ ...prev, [deviceId]: stream }))
      setTimeout(() => {
        const video = previewRefs.current[deviceId]
        if (video) {
          video.srcObject = stream
          video.play()
        }
      }, 100)
    } catch(e) {
      console.error('Preview error for', deviceId, e)
    }
  }

  function toggleSelect(deviceId: string) {
    setSelected(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    )
  }

  function handleProject() {
    if (selected.length === 0) return
    if (selected.length === 1 || !mixMode) {
      onStartCamera(selected[0])
    } else {
      onMixCameras(selected)
    }
    onClose()
  }

  function handleStop() {
    onStopCamera()
    setSelected([])
    onClose()
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>

        <div style={s.header}>
          <div style={s.title}>🎥 Camera Manager</div>
          {activeCamera && (
            <div style={s.liveBadge}>● CAMERA LIVE</div>
          )}
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.body}>

          {loading && (
            <div style={s.loading}>
              <div style={s.loadingText}>⏳ Detecting cameras...</div>
            </div>
          )}

          {!loading && cameras.length === 0 && (
            <div style={s.loading}>
              <div style={s.loadingText}>No cameras detected.</div>
              <div style={s.loadingHint}>Connect a USB camera or webcam and try again.</div>
              <button style={s.retryBtn} onClick={loadCameras}>↻ Retry</button>
            </div>
          )}

          {!loading && cameras.length > 0 && (
            <>
              <div style={s.hint}>
                Click a camera to select it · Double-click to instantly project
                {cameras.length > 1 && ' · Enable Mix Mode to combine cameras'}
              </div>

              {cameras.length > 1 && (
                <div style={s.mixRow}>
                  <label style={s.mixLabel}>
                    <input
                      type="checkbox"
                      checked={mixMode}
                      onChange={e => setMixMode(e.target.checked)}
                      style={{ marginRight: 8 }}
                    />
                    Mix Mode — project multiple cameras simultaneously
                  </label>
                </div>
              )}

              <div style={s.cameraGrid}>
                {cameras.map(cam => {
                  const isSelected = selected.includes(cam.deviceId)
                  const isActive   = activeCamera === cam.deviceId
                  return (
                    <div
                      key={cam.deviceId}
                      style={{
                        ...s.cameraCard,
                        ...(isSelected ? s.cameraCardSelected : {}),
                        ...(isActive ? s.cameraCardActive : {}),
                      }}
                      onClick={() => toggleSelect(cam.deviceId)}
                      onDoubleClick={() => {
                        onStartCamera(cam.deviceId)
                        onClose()
                      }}
                    >
                      <div style={s.videoWrapper}>
                        <video
                          ref={el => { previewRefs.current[cam.deviceId] = el }}
                          style={s.videoPreview}
                          autoPlay
                          muted
                          playsInline
                        />
                        {isActive && (
                          <div style={s.liveOverlay}>● LIVE</div>
                        )}
                        {isSelected && !isActive && (
                          <div style={s.selectedOverlay}>✓ SELECTED</div>
                        )}
                      </div>
                      <div style={s.cameraInfo}>
                        <div style={s.cameraName}>{cam.label}</div>
                        <div style={s.cameraId}>ID: {cam.deviceId.slice(0, 20)}...</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={s.footer}>
                <div style={s.footerLeft}>
                  {selected.length > 0 && (
                    <div style={s.selectionInfo}>
                      {selected.length} camera{selected.length > 1 ? 's' : ''} selected
                      {mixMode && selected.length > 1 && ' (mix mode)'}
                    </div>
                  )}
                </div>
                <div style={s.footerRight}>
                  {activeCamera && (
                    <button style={s.stopBtn} onClick={handleStop}>
                      ⬛ Stop Camera
                    </button>
                  )}
                  <button
                    style={{
                      ...s.projectBtn,
                      opacity: selected.length > 0 ? 1 : 0.4,
                    }}
                    onClick={handleProject}
                    disabled={selected.length === 0}
                  >
                    ▶ Project Camera
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#0d1117', border: '1px solid #1e2d42',
    borderRadius: 12, width: '900px', maxWidth: '96vw',
    maxHeight: '85vh', display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '14px 20px', borderBottom: '1px solid #1e2d42',
    display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
  },
  title: { fontSize: 15, fontWeight: 700, color: '#e8f0fe' },
  liveBadge: {
    fontSize: 11, fontWeight: 700, color: '#ef4444',
    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 20, padding: '2px 10px',
    animation: 'pulse 1.5s infinite',
  },
  closeBtn: {
    marginLeft: 'auto', background: 'transparent', border: 'none',
    color: '#6b8299', fontSize: 18, cursor: 'pointer',
  },
  body: { flex: 1, overflowY: 'auto', padding: 20 },
  loading: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: 60, gap: 12,
  },
  loadingText: { fontSize: 15, color: '#6b8299' },
  loadingHint: { fontSize: 12, color: '#3d526a' },
  retryBtn: {
    height: 34, padding: '0 20px',
    background: '#1a2233', border: '1px solid #1e2d42',
    borderRadius: 6, color: '#6b8299', fontSize: 12, cursor: 'pointer',
  },
  hint: {
    fontSize: 11, color: '#3d526a', textAlign: 'center',
    marginBottom: 14, padding: '6px 12px',
    background: '#0a0e14', borderRadius: 6,
  },
  mixRow: {
    padding: '8px 12px', marginBottom: 14,
    background: '#131820', border: '1px solid #1e2d42',
    borderRadius: 7,
  },
  mixLabel: {
    fontSize: 12, color: '#6b8299', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
  },
  cameraGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 14,
  },
  cameraCard: {
    background: '#131820', border: '2px solid #1e2d42',
    borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
    transition: 'all .15s',
  },
  cameraCardSelected: {
    borderColor: '#4f9eff',
    boxShadow: '0 0 0 3px rgba(79,158,255,0.15)',
  },
  cameraCardActive: {
    borderColor: '#ef4444',
    boxShadow: '0 0 0 3px rgba(239,68,68,0.15)',
  },
  videoWrapper: {
    position: 'relative', paddingBottom: '56.25%',
    background: '#000',
  },
  videoPreview: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
  },
  liveOverlay: {
    position: 'absolute', top: 8, left: 8,
    background: 'rgba(239,68,68,0.9)',
    color: 'white', fontSize: 10, fontWeight: 700,
    padding: '2px 7px', borderRadius: 4,
    letterSpacing: '0.06em',
  },
  selectedOverlay: {
    position: 'absolute', top: 8, left: 8,
    background: 'rgba(79,158,255,0.9)',
    color: 'white', fontSize: 10, fontWeight: 700,
    padding: '2px 7px', borderRadius: 4,
  },
  cameraInfo: { padding: '10px 12px' },
  cameraName: { fontSize: 12.5, fontWeight: 600, color: '#e8f0fe', marginBottom: 3 },
  cameraId: { fontSize: 10, color: '#3d526a', fontFamily: 'monospace' },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e2d42',
  },
  footerLeft: {},
  footerRight: { display: 'flex', gap: 10 },
  selectionInfo: { fontSize: 12, color: '#6b8299' },
  stopBtn: {
    height: 38, padding: '0 20px',
    background: 'transparent', border: '1px solid #ef4444',
    borderRadius: 7, color: '#ef4444',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  projectBtn: {
    height: 38, padding: '0 24px',
    background: '#4f9eff', border: 'none',
    borderRadius: 7, color: 'white',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
}