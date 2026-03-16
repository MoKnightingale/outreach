import { v4 as uuidv4 } from 'uuid'

export interface Slide {
  id: string
  label: string
  line1: string
  line2: string
  bright: boolean
}

export interface Song {
  id: string
  title: string
  artist: string
  slides: Slide[]
}

// Auto-split raw lyrics into slides
export function lyricsToSlides(rawLyrics: string): Slide[] {
  const lines = rawLyrics
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  const slides: Slide[] = []
  let sectionLabel = 'Verse 1'
  let sectionCount: Record<string, number> = {}

  for (let i = 0; i < lines.length; i += 2) {
    const line = lines[i]

    // Detect section headers like [Chorus], [Verse 2], [Bridge]
    if (line.startsWith('[') && line.endsWith(']')) {
      const raw = line.slice(1, -1)
      sectionLabel = raw
      i -= 1 // don't consume next line
      continue
    }

    const line1 = lines[i] || ''
    const line2 = lines[i + 1] || ''

    // Skip if both lines are section headers
    if (
      (line1.startsWith('[') && line1.endsWith(']')) ||
      line1.length === 0
    ) continue

    const sectionKey = sectionLabel.toLowerCase()
    sectionCount[sectionKey] = (sectionCount[sectionKey] || 0) + 1

    const isChorus = sectionKey.includes('chorus') || sectionKey.includes('refrain')

    slides.push({
      id: uuidv4(),
      label: sectionLabel,
      line1: line1,
      line2: line2.startsWith('[') ? '' : line2,
      bright: isChorus,
    })
  }

  // Always add a blank ending slide
  slides.push({
    id: uuidv4(),
    label: 'Blank',
    line1: '',
    line2: '',
    bright: false,
  })

  return slides
}

// Save songs to localStorage
export function saveSongs(songs: Song[]) {
  localStorage.setItem('outreach_songs', JSON.stringify(songs))
}

// Load songs from localStorage
export function loadSongs(): Song[] {
  const raw = localStorage.getItem('outreach_songs')
  if (!raw) return defaultSongs
  try {
    return JSON.parse(raw)
  } catch {
    return defaultSongs
  }
}

// Default songs pre-loaded
export const defaultSongs: Song[] = [
  {
    id: uuidv4(),
    title: 'Way Maker',
    artist: 'Sinach',
    slides: [
      { id: uuidv4(), label: 'Verse 1', line1: 'You are here', line2: 'moving in our midst', bright: false },
      { id: uuidv4(), label: 'Verse 1', line1: 'I worship You', line2: 'I worship You', bright: false },
      { id: uuidv4(), label: 'Verse 2', line1: 'You are here', line2: 'working in this place', bright: false },
      { id: uuidv4(), label: 'Verse 2', line1: 'I worship You', line2: 'I worship You', bright: false },
      { id: uuidv4(), label: 'Chorus', line1: 'Way maker, miracle worker', line2: 'Promise keeper', bright: true },
      { id: uuidv4(), label: 'Chorus', line1: 'Light in the darkness', line2: 'My God, that is who You are', bright: true },
      { id: uuidv4(), label: 'Bridge', line1: "Even when I don't see it", line2: "You're working", bright: false },
      { id: uuidv4(), label: 'Blank', line1: '', line2: '', bright: false },
    ]
  },
  {
    id: uuidv4(),
    title: 'Goodness of God',
    artist: 'Bethel Music',
    slides: [
      { id: uuidv4(), label: 'Verse 1', line1: "I love You Lord", line2: "Oh Your mercy never fails me", bright: false },
      { id: uuidv4(), label: 'Verse 1', line1: "All my days", line2: "I've been held in Your hands", bright: false },
      { id: uuidv4(), label: 'Chorus', line1: "All my life You have been faithful", line2: "All my life You have been so so good", bright: true },
      { id: uuidv4(), label: 'Chorus', line1: "With every breath that I am able", line2: "I will sing of the goodness of God", bright: true },
      { id: uuidv4(), label: 'Bridge', line1: "Your goodness is running after", line2: "It's running after me", bright: false },
      { id: uuidv4(), label: 'Blank', line1: '', line2: '', bright: false },
    ]
  },
  {
    id: uuidv4(),
    title: 'What a Beautiful Name',
    artist: 'Hillsong Worship',
    slides: [
      { id: uuidv4(), label: 'Verse 1', line1: "You were the Word at the beginning", line2: "One with God the Lord Most High", bright: false },
      { id: uuidv4(), label: 'Verse 1', line1: "Your hidden glory in creation", line2: "Now revealed in You our Christ", bright: false },
      { id: uuidv4(), label: 'Chorus', line1: "What a beautiful Name it is", line2: "What a beautiful Name it is", bright: true },
      { id: uuidv4(), label: 'Chorus', line1: "The Name of Jesus Christ my King", line2: "What a beautiful Name it is", bright: true },
      { id: uuidv4(), label: 'Bridge', line1: "Death could not hold You", line2: "The veil tore before You", bright: false },
      { id: uuidv4(), label: 'Blank', line1: '', line2: '', bright: false },
    ]
  }
]