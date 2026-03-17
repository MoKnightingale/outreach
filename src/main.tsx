import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initBible } from './bibleData.ts'

function LoadingScreen({ progress, status }: { progress: number, status: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#080a0f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 24, fontFamily: 'Segoe UI, sans-serif',
    }}>
      <div style={{ fontSize: 48, fontWeight: 800, color: '#4f9eff', letterSpacing: '0.1em' }}>
        <span style={{ color: '#e8f0fe' }}>OUT</span>reach
      </div>
      <div style={{ fontSize: 13, color: '#6b8299' }}>{status}</div>
      <div style={{
        width: 320, height: 4,
        background: '#1e2d42', borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: '#4f9eff', borderRadius: 2,
          transition: 'width 0.3s ease',
        }}/>
      </div>
      <div style={{ fontSize: 11, color: '#3d526a' }}>{progress}%</div>
    </div>
  )
}

function Root() {
  const [ready, setReady] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [status, setStatus] = React.useState('Starting up...')

  React.useEffect(() => {
    async function load() {
      setProgress(10)
      setStatus('Loading OUTreach...')
      await new Promise(r => setTimeout(r, 200))

      setProgress(30)
      setStatus('Loading Bible database (31,100 verses)...')
      await new Promise(r => setTimeout(r, 100))

      try {
        await initBible((p: number) => {
          setProgress(30 + Math.round(p * 60))
          setStatus(`Loading Bible... ${Math.round(p * 100)}%`)
        })
      } catch(e) {
        console.error('Bible load error:', e)
        setStatus('Bible load failed — continuing without Bible')
      }

      setProgress(95)
      setStatus('Almost ready...')
      await new Promise(r => setTimeout(r, 300))

      setProgress(100)
      setStatus('Ready!')
      await new Promise(r => setTimeout(r, 200))
      setReady(true)
    }
    load()
  }, [])

  if (!ready) return <LoadingScreen progress={progress} status={status} />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)