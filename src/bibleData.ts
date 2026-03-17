export interface Verse {
  book: string
  abbrev: string
  chapter: number
  verse: number
  text: string
  translation?: string
}

// Cache so we only load once
let _verses: Verse[] = []
let _loaded = false

async function loadVerses(): Promise<Verse[]> {
  if (_loaded) return _verses
  try {
    const res = await fetch('/kjvVerses.json')
    if (!res.ok) throw new Error('Failed to fetch Bible data')
    _verses = await res.json()
    _loaded = true
    console.log('✅ Bible loaded:', _verses.length, 'verses')
  } catch(e) {
    console.error('Bible load error:', e)
  }
  return _verses
}

// Sync cache for after first load
function getVerses(): Verse[] {
  return _verses
}

// ── INITIALIZE — call this once at app startup
export async function initBible(): Promise<void> {
  await loadVerses()
  console.log('Bible loaded:', _verses.length, 'verses')
}

// ── MAIN SEARCH FUNCTION
export function searchVerses(query: string): Verse[] {
  const ALL = getVerses()
  if (!query.trim() || ALL.length === 0) return []
  const q = query.toLowerCase().trim()

  // Match "John 3:16" or "John 3 16"
  const refFull = q.match(/^(\d?\s*[a-z]+\.?\s*[a-z]*)\s+(\d+)[:\s](\d+)$/i)
  if (refFull) {
    const bookQ   = refFull[1].trim().toLowerCase()
    const chapter = parseInt(refFull[2])
    const verse   = parseInt(refFull[3])
    return ALL.filter(v =>
      (v.book.toLowerCase().includes(bookQ) ||
       v.abbrev.toLowerCase() === bookQ) &&
      v.chapter === chapter &&
      v.verse === verse
    ).slice(0, 10)
  }

  // Match "John 3:16-21" — verse range
  const refRange = q.match(/^(\d?\s*[a-z]+\.?\s*[a-z]*)\s+(\d+)[:\s](\d+)\s*[-–]\s*(\d+)$/i)
  if (refRange) {
    const bookQ      = refRange[1].trim().toLowerCase()
    const chapter    = parseInt(refRange[2])
    const verseStart = parseInt(refRange[3])
    const verseEnd   = parseInt(refRange[4])
    return ALL.filter(v =>
      (v.book.toLowerCase().includes(bookQ) ||
       v.abbrev.toLowerCase() === bookQ) &&
      v.chapter === chapter &&
      v.verse >= verseStart &&
      v.verse <= verseEnd
    )
  }

  // Match "John 3" — whole chapter
  const refChapter = q.match(/^(\d?\s*[a-z]+\.?\s*[a-z]*)\s+(\d+)$/i)
  if (refChapter) {
    const bookQ   = refChapter[1].trim().toLowerCase()
    const chapter = parseInt(refChapter[2])
    return ALL.filter(v =>
      (v.book.toLowerCase().includes(bookQ) ||
       v.abbrev.toLowerCase() === bookQ) &&
      v.chapter === chapter
    ).slice(0, 40)
  }

  // Book name only — return first chapter
  const bookOnly = ALL.filter(v =>
    v.book.toLowerCase() === q ||
    v.abbrev.toLowerCase() === q
  )
  if (bookOnly.length > 0) {
    return bookOnly.filter(v => v.chapter === 1).slice(0, 30)
  }

  // Keyword search
  return ALL.filter(v =>
    v.text.toLowerCase().includes(q)
  ).slice(0, 25)
}

// ── GET ALL BOOKS
export function getBooks(): string[] {
  return [...new Set(getVerses().map(v => v.book))]
}

// ── GET CHAPTERS FOR A BOOK
export function getChapters(book: string): number[] {
  const chapters = getVerses()
    .filter(v => v.book.toLowerCase() === book.toLowerCase())
    .map(v => v.chapter)
  return [...new Set(chapters)]
}

// ── GET VERSES FOR A CHAPTER
export function getChapterVerses(book: string, chapter: number): Verse[] {
  return getVerses().filter(v =>
    v.book.toLowerCase() === book.toLowerCase() &&
    v.chapter === chapter
  )
}

// ── FORMAT REFERENCE
export function formatRef(v: Verse): string {
  return `${v.book} ${v.chapter}:${v.verse}`
}

// ── SPLIT VERSE INTO TWO DISPLAY LINES
export function splitVerseText(text: string): { line1: string, line2: string } {
  if (text.length <= 55) return { line1: text, line2: '' }
  const mid = Math.floor(text.length / 2)
  let splitAt = text.indexOf(' ', mid)
  if (splitAt === -1) splitAt = mid
  return {
    line1: text.slice(0, splitAt).trim(),
    line2: text.slice(splitAt).trim(),
  }
}

// ── POPULAR QUICK REFERENCES
export const QUICK_REFS = [
  'John 3:16', 'Psalm 23:1', 'Philippians 4:13',
  'Romans 8:28', 'Jeremiah 29:11', 'Isaiah 41:10',
  'Proverbs 3:5', 'Matthew 11:28', 'Hebrews 11:1',
  'Genesis 1:1', 'Romans 10:9', 'Isaiah 53:5',
  '1 Corinthians 13:4', 'Revelation 21:4', 'Acts 1:8',
]