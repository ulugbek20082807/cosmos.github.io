# Cosmic Simulator Deep Rewrite Plan

## 1. The Core Issue
The conflicts between manual tracking updates, pointer zoom raycasting, and `OrbitControls` damping caused all the trembling and jumping. Mixing world-space camera coordinates with moving targets is fundamentally unstable.

## 2. The Universal "Dolly Rig" Solution
We will implement a permanent, robust `CameraRig` group that encapsulates the camera.
- The `CameraRig` is instantly teleported to the exact world coordinates of whatever object is being tracked (Earth, a custom asteroid, or a static star).
- The `Camera` and `OrbitControls` live *inside* this rig, operating entirely in local space (where the planet is always precisely at `[0,0,0]`).
- Because the camera is physically moving with the planet, `OrbitControls` doesn't even know the planet is moving. Trembling is mathematically impossible.

## 3. Seamless Planet-to-Planet Flight
When switching targets (e.g. from Earth to Jupiter):
1. The `CameraRig` instantly jumps from Earth to Jupiter.
2. At the exact same microsecond, the `Camera`'s local coordinates are shifted backwards by the exact distance between Earth and Jupiter.
3. This cancels out the jump, leaving the camera visually exactly where it was.
4. An animation then smoothly lerps the camera from this shifted position down to `[0,0,0]` (Jupiter's surface).

## 4. Pointer-Based Zoom
The trackpad zoom will be completely rebuilt to raycast from the mouse pointer in local space, panning the `controls.target` and `camera.position` along the ray. Because this happens in local space, it fully supports zooming into a specific crater on the moon while the moon is orbiting!
