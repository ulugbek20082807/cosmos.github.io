import { useState, useEffect, useCallback } from 'react'

let globalHoveredSetters = new Map()
let currentHoveredId = null

export function setGlobalHover(id) {
  if (currentHoveredId === id) return
  
  // Unhover the previous one
  if (currentHoveredId && globalHoveredSetters.has(currentHoveredId)) {
    globalHoveredSetters.get(currentHoveredId)(false)
  }
  
  currentHoveredId = id
  
  // Hover the new one
  if (currentHoveredId && globalHoveredSetters.has(currentHoveredId)) {
    globalHoveredSetters.get(currentHoveredId)(true)
  }
}

export function useGlobalHover(id) {
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    globalHoveredSetters.set(id, setHovered)
    if (currentHoveredId === id) setHovered(true)
    return () => {
      globalHoveredSetters.delete(id)
      if (currentHoveredId === id) currentHoveredId = null
    }
  }, [id])

  const onPointerOver = useCallback((e) => {
    e.stopPropagation()
    setGlobalHover(id)
  }, [id])

  const onPointerOut = useCallback(() => {
    if (currentHoveredId === id) {
      setGlobalHover(null)
    }
  }, [id])

  return { hovered, onPointerOver, onPointerOut }
}
