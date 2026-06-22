# Action Plan

1. **Remove Dolly Group Architecture**:
   - As discovered, `OrbitControls` natively calls `camera.lookAt(target)` in WORLD space. By putting the camera in a moving local group, the camera was looking at the world origin (Sun) instead of the local origin. This caused the "pointing at the wrong thing" offset bug.
   - We will revert to the `ContinuousTracker` logic from 03:20 which directly adds the tracked object's delta to BOTH `camera.position` and `controls.target`. This was proven to be perfectly smooth and correctly centered.

2. **Fix Zoom Choppiness**:
   - The zoom was choppy because it used a `useFrame` based `zoomQueue` with an artificial friction multiplier (`*= 0.8`).
   - Mac trackpads already provide perfectly smooth, momentum-based `wheel` events! Adding our own artificial momentum on top of the trackpad's momentum causes severe stuttering and lag.
   - We will move the pointer raycast zoom logic directly into the `onWheel` event handler and apply the offset synchronously. This allows the browser's native trackpad momentum to drive the zoom smoothly.
