import React, { useRef, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

function ContinuousTracker({ trackedTargetRef, trackedObjectId, controlsRef, isFocusAnimating }) {
  const { camera } = useThree()
  const lastTrackedPos = useRef(null)
  const lastTrackedId = useRef(null)

  useFrame(() => {
    // If a focus animation is playing, just update our anchor point but do not shift the camera manually.
    if (isFocusAnimating?.current) {
      if (trackedTargetRef?.current) {
        const nt = trackedTargetRef.current
        lastTrackedPos.current = Array.isArray(nt) ? new THREE.Vector3(nt[0], nt[1], nt[2]) : nt.clone()
        lastTrackedId.current = trackedObjectId
      }
      return
    }

    if (trackedTargetRef?.current && controlsRef?.current) {
      const nt = trackedTargetRef.current
      const currentPos = Array.isArray(nt) ? new THREE.Vector3(nt[0], nt[1], nt[2]) : nt.clone()

      if (!lastTrackedPos.current || lastTrackedId.current !== trackedObjectId) {
        lastTrackedPos.current = currentPos.clone()
        lastTrackedId.current = trackedObjectId
        return
      }

      const delta = currentPos.clone().sub(lastTrackedPos.current)
      if (delta.length() > 0.00000001) {
        controlsRef.current.target.add(delta)
        camera.position.add(delta)
        controlsRef.current.update()
      }
      lastTrackedPos.current.copy(currentPos)
    } else {
      lastTrackedPos.current = null
      lastTrackedId.current = null
    }
  })

  return null
}

function CameraFocus({ controlsRef, focusRequest, trackedTargetRef, isFocusAnimating }) {
  const { camera } = useThree()
  const startPos = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const endPos = useRef(new THREE.Vector3())
  const endTarget = useRef(new THREE.Vector3())
  const progress = useRef(0)

  const currentFocusId = useRef(null)

  useEffect(() => {
    if (focusRequest && controlsRef.current && currentFocusId.current !== focusRequest.id) {
      currentFocusId.current = focusRequest.id
      isFocusAnimating.current = true
      progress.current = 0

      startPos.current.copy(camera.position)
      startTarget.current.copy(controlsRef.current.target)

      // Initial estimate, will be updated dynamically in useFrame
      const trPos = focusRequest.position
      const p = Array.isArray(trPos) ? new THREE.Vector3(trPos[0], trPos[1], trPos[2]) : trPos.clone()
      endTarget.current.copy(p)
      const d = Math.max((focusRequest.visualRadius || 1) * 7.5, 0.05)
      const dir = new THREE.Vector3(1.5, 1, 1.5).normalize().multiplyScalar(d)
      endPos.current.copy(p).add(dir)
      
      controlsRef.current.enabled = false
    }
  }, [focusRequest, camera])

  useFrame((_, delta) => {
    if (isFocusAnimating.current && controlsRef.current) {
      progress.current = Math.min(1, progress.current + delta * 1.5)
      const t = 1 - Math.pow(1 - progress.current, 3)

      // DYNAMICALLY update the destination to intercept the moving planet perfectly
      if (trackedTargetRef?.current) {
        const liveNt = trackedTargetRef.current
        const p = Array.isArray(liveNt) ? new THREE.Vector3(liveNt[0], liveNt[1], liveNt[2]) : liveNt.clone()
        endTarget.current.copy(p)
        const d = Math.max((focusRequest.visualRadius || 1) * 7.5, 0.05)
        const dir = new THREE.Vector3(1.5, 1, 1.5).normalize().multiplyScalar(d)
        endPos.current.copy(p).add(dir)
      }

      camera.position.lerpVectors(startPos.current, endPos.current, t)
      controlsRef.current.target.lerpVectors(startTarget.current, endTarget.current, t)
      controlsRef.current.update()

      if (progress.current >= 1) {
        isFocusAnimating.current = false
        controlsRef.current.enabled = true
      }
    }
  })

  return null
}

function Controls({ controlsRef, viewScale, onViewScaleChange, isFocusAnimating }) {
  const { camera, gl } = useThree()
  const lastSentScale = useRef(-1)
  const baseDistance = useRef(100)
  
  const zoomQueue = useRef(0)
  const mouseNDC = useRef(new THREE.Vector2(0, 0))

  // 1. Sync Base Distance
  useEffect(() => {
    if (controlsRef.current) {
      const dist = camera.position.distanceTo(controlsRef.current.target)
      if (dist > 0.0001) {
        baseDistance.current = dist
      }
    }
  }, [camera])

  // 2. Event listeners for mouse tracking and custom Zoom to Pointer
  const raycaster = useRef(new THREE.Raycaster())
  useEffect(() => {
    const canvas = gl.domElement
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseNDC.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseNDC.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    
    const onWheel = (e) => {
      e.preventDefault()
      if (isFocusAnimating.current || !controlsRef.current) return

      const zoomSpeed = 0.15
      const isZoomingIn = e.deltaY < 0
      const t = isZoomingIn ? zoomSpeed : -zoomSpeed

      raycaster.current.setFromCamera(mouseNDC.current, camera)
      const dist = camera.position.distanceTo(controlsRef.current.target)
      
      const targetPoint = raycaster.current.ray.origin.clone().add(
        raycaster.current.ray.direction.multiplyScalar(dist)
      )

      camera.position.lerp(targetPoint, t)
      controlsRef.current.target.lerp(targetPoint, t)
      controlsRef.current.update()
    }
    
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [gl, camera])

  // 3. UI Scale Update
  useFrame(() => {
    if (!controlsRef.current || isFocusAnimating.current) return

    const dist = camera.position.distanceTo(controlsRef.current.target)
    if (dist > 0.0001) {
      const computedScale = baseDistance.current / Math.max(dist, 0.0001)
      const roundedScale = Number(computedScale.toFixed(4))
      if (Math.abs(roundedScale - lastSentScale.current) > Math.max(0.01, roundedScale * 0.01)) {
        lastSentScale.current = roundedScale
        if (onViewScaleChange) onViewScaleChange(roundedScale)
      }
    }
  })

  // 4. Set Scale from UI Panel
  useEffect(() => {
    if (controlsRef.current && viewScale !== undefined && viewScale !== lastSentScale.current && !isFocusAnimating.current) {
      const target = controlsRef.current.target
      const dir = camera.position.clone().sub(target).normalize()
      if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1)
      const dist = baseDistance.current / Math.max(viewScale, 0.0001)
      camera.position.copy(target).add(dir.multiplyScalar(dist))
      controlsRef.current.update()
      lastSentScale.current = viewScale
    }
  }, [viewScale, camera])

  return null
}

import { EffectComposer, Bloom } from '@react-three/postprocessing'

export function SimulationCanvas({ 
  children, 
  focusRequest, 
  trackedObjectId, 
  trackedTargetRef,
  onViewScaleChange,
  viewScale,
  className = '' 
}) {
  const controlsRef = useRef()
  const isFocusAnimating = useRef(false)

  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, logarithmicDepthBuffer: true }}
        style={{ background: '#030508' }}
        camera={{ position: [0, 50, 100], near: 0.1, far: 1e15, fov: 45 }}
      >
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
        </EffectComposer>
        <OrbitControls 
          ref={controlsRef} 
          makeDefault 
          enableDamping 
          dampingFactor={0.08} 
          enableZoom={false}
          enablePan 
          enableRotate 
          rotateSpeed={0.4}
        />
        <CameraFocus
          controlsRef={controlsRef}
          focusRequest={focusRequest}
          trackedTargetRef={trackedTargetRef}
          isFocusAnimating={isFocusAnimating}
        />
        <ContinuousTracker
          trackedTargetRef={trackedTargetRef}
          trackedObjectId={trackedObjectId}
          controlsRef={controlsRef}
          isFocusAnimating={isFocusAnimating}
        />
        <Controls 
          controlsRef={controlsRef}
          viewScale={viewScale}
          onViewScaleChange={onViewScaleChange}
          isFocusAnimating={isFocusAnimating}
        />
        {children}
      </Canvas>
    </div>
  )
}

export function SimClock({ playing, timeScale, onTimeUpdate, children }) {
  useFrame((_, delta) => {
    if (playing && timeScale > 0) {
      onTimeUpdate(delta * timeScale)
    }
  })
  return children
}
