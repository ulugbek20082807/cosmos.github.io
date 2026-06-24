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

    let itemType = 'wiki_object'
    const lowerDesc = description.toLowerCase() || ''
    const lowerTitle = page.title.toLowerCase()

    if (lowerTitle.includes('galaxy') || lowerDesc.includes('galaxy')) {
      itemType = 'galaxy'
      if (lowerDesc.includes('spiral') || lowerTitle.includes('spiral')) itemType = 'galaxy_spiral'
      else if (lowerDesc.includes('elliptical') || lowerTitle.includes('elliptical')) itemType = 'galaxy_elliptical'
      else if (lowerDesc.includes('irregular') || lowerTitle.includes('irregular')) itemType = 'galaxy_irregular'
      else if (lowerDesc.includes('lenticular') || lowerTitle.includes('lenticular')) itemType = 'galaxy_lenticular'
    } else if (lowerDesc.includes('nebula') || lowerTitle.includes('nebula')) {
      itemType = 'nebula'
    } else if (lowerDesc.includes('star cluster') || lowerDesc.includes('globular cluster') || lowerTitle.includes('cluster')) {
      itemType = 'cluster'
    } else if (lowerDesc.includes('black hole') || lowerTitle.includes('black hole')) {
      itemType = 'black_hole'
    } else if (lowerDesc.includes('star') || lowerTitle.includes('star')) {
      itemType = 'star'
    } else if (lowerDesc.includes('planet') || lowerTitle.includes('planet') || lowerDesc.includes('exoplanet')) {
      itemType = 'exoplanet'
    }

    // Procedurally generate deep space coordinates
    let itemRa = Math.random() * 24
    let itemDec = (Math.random() * 180) - 90
    let itemDist = Math.floor(Math.random() * 4000) + 100
    
    // Place the Milky Way's core (Sagittarius A*) at its actual relative position to Earth
    if (lowerTitle.includes('milky way')) {
      itemType = 'galaxy_spiral'
      itemRa = 17.76 // RA of Galactic Center
      itemDec = -29.007 // Dec of Galactic Center
      itemDist = 26000 // Distance in Light Years
    }

    const result = {
      id: `wiki_${pageId}`,
      name: page.title,
      description: description,
      textureUrl: page.thumbnail ? page.thumbnail.source : null,
      type: itemType,
      category: 'deep_space',
      
      ra: itemRa,
      dec: itemDec,
      distanceLy: itemDist,
      radiusKm: 6371 * (1 + Math.random() * 100),
      color: '#ffffff',
      hasSmbh: itemType.startsWith('galaxy')
    }

    return result
  } catch (error) {
    console.error("Failed to fetch cosmic telemetry:", error)
    return null
  }
}
