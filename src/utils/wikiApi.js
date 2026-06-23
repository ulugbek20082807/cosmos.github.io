/**
 * wikiApi.js
 * Fetches autonomous deep space telemetry from Wikipedia.
 */

export async function fetchCosmicObjectFromWiki(query) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&titles=${encodeURIComponent(query)}&format=json&exintro=1&pithumbsize=1024&origin=*`
    const response = await fetch(url)
    const data = await response.json()

    if (!data || !data.query || !data.query.pages) return null

    const pages = data.query.pages
    const pageId = Object.keys(pages)[0]

    if (pageId === '-1') return null // Not found

    const page = pages[pageId]
    
    // Strip HTML from the extract
    const rawExtract = page.extract || ''
    const cleanExtract = rawExtract.replace(/<[^>]+>/g, '').trim()
    const description = cleanExtract.split('. ').slice(0, 3).join('. ') + '.'

    const result = {
      id: `wiki_${pageId}`,
      name: page.title,
      description: description,
      textureUrl: page.thumbnail ? page.thumbnail.source : null,
      type: 'wiki_object',
      category: 'deep_space',
      
      // Procedurally generate deep space coordinates so it appears in the sky
      ra: Math.random() * 24, // 0 to 24 hours
      dec: (Math.random() * 180) - 90, // -90 to +90 degrees
      distanceLy: Math.floor(Math.random() * 4000) + 100, // 100 to 4100 Light Years
      radiusKm: 6371 * (1 + Math.random() * 100), // Random massive radius
    }

    return result
  } catch (error) {
    console.error("Failed to fetch cosmic telemetry:", error)
    return null
  }
}
