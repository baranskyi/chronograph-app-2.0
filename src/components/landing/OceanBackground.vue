<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Canvas animation
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number | null = null
let cleanupFn: (() => void) | null = null

// Wave animation constants - 30-degree tilt perspective
const WAVE_FREQUENCY = 0.6
const WAVE_AMPLITUDE = 0.4
const DOT_COLOR = { r: 239, g: 68, b: 68 } // Red accent #ef4444
const GRID_COLS = 180
const GRID_ROWS = 120

// Mouse tracking for glow effect
const mouseX = ref(0)
const mouseY = ref(0)
const MOUSE_GLOW_RADIUS = 200 // Radius of mouse glow effect in pixels

interface Distortion {
  x: number
  y: number
  intensity: number
  decay: number
  time: number
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    canvas.style.display = 'none'
    return
  }

  let width = window.innerWidth
  let height = window.innerHeight

  const resizeCanvas = () => {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // Mouse tracking
  const handleMouseMove = (e: MouseEvent) => {
    mouseX.value = e.clientX
    mouseY.value = e.clientY
  }
  window.addEventListener('mousemove', handleMouseMove)

  const distortions: Distortion[] = []
  let lastDistortionTime = 0

  function animate(time: number) {
    ctx!.clearRect(0, 0, width, height)

    // Distortion spawning - random flashes
    if (time - lastDistortionTime > 3333 + Math.random() * 5000) {
      let x, y
      if (Math.random() < 0.66) {
        x = GRID_COLS * 0.25 + Math.random() * GRID_COLS * 0.5
        y = GRID_ROWS * 0.25 + Math.random() * GRID_ROWS * 0.5
      } else {
        x = Math.random() * GRID_COLS
        y = Math.random() * GRID_ROWS
      }
      distortions.push({
        x,
        y,
        intensity: 0.8 + Math.random() * 0.4,
        decay: 0.994,
        time: time
      })
      lastDistortionTime = time
    }

    // Update and filter distortions
    for (let i = distortions.length - 1; i >= 0; i--) {
      const d = distortions[i]
      if (d) {
        d.intensity *= d.decay
        if (d.intensity < 0.01) {
          distortions.splice(i, 1)
        }
      }
    }

    // 30-degree tilt perspective
    const TILT_ANGLE = 30 * Math.PI / 180
    const perspectiveMin = 0.4
    const perspectiveMax = 1.3
    const extendX = 0.5
    const extendYTop = 0.8
    const extendYBottom = 0.3
    const centerX = width / 2
    const centerY = height / 2

    // Draw dots
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const nx = col / (GRID_COLS - 1)
        const ny = row / (GRID_ROWS - 1)

        const perspectiveScale = perspectiveMin + ny * (perspectiveMax - perspectiveMin)

        const baseX = (nx - 0.5) * width * (1 + extendX * 2)
        const baseY = -height * extendYTop + ny * height * (1 + extendYTop + extendYBottom)

        const perspX = centerX + baseX * perspectiveScale
        const perspY = centerY + (baseY - centerY) * perspectiveScale * Math.cos(TILT_ANGLE)

        const wavePhase = (col / GRID_COLS) * Math.PI * 4 + (row / GRID_ROWS) * Math.PI * 2
        let waveOffset = Math.sin(wavePhase + time * 0.001 * WAVE_FREQUENCY) * WAVE_AMPLITUDE

        let distortionOffset = 0
        let distortionGlow = 0
        for (const d of distortions) {
          const dx = col - d.x
          const dy = row - d.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 40
          if (dist < maxDist) {
            const factor = (1 - dist / maxDist) * d.intensity
            distortionOffset += Math.sin(dist * 0.3 - time * 0.002) * factor * 8
            distortionGlow += factor
          }
        }

        const screenX = perspX
        const screenY = perspY + waveOffset * 20 * perspectiveScale + distortionOffset

        if (screenX < -30 || screenX > width + 30 || screenY < -30 || screenY > height + 30) continue

        // Mouse glow effect - calculate distance from cursor to this dot
        const mouseDistX = screenX - mouseX.value
        const mouseDistY = screenY - mouseY.value
        const mouseDist = Math.sqrt(mouseDistX * mouseDistX + mouseDistY * mouseDistY)
        const mouseGlow = mouseDist < MOUSE_GLOW_RADIUS
          ? Math.pow(1 - mouseDist / MOUSE_GLOW_RADIUS, 2)
          : 0

        const depthFade = 0.15 + ny * 0.5
        const waveBonus = (waveOffset + WAVE_AMPLITUDE) / (2 * WAVE_AMPLITUDE) * 0.2
        const finalOpacity = Math.min(0.95, depthFade + waveBonus + distortionGlow * 0.4 + mouseGlow * 0.6)

        const baseSize = (0.6 + ny * 1.4) * perspectiveScale * 0.7
        const waveSize = 1 + (waveOffset + WAVE_AMPLITUDE) / (2 * WAVE_AMPLITUDE) * 0.25
        const distortionSize = 1 + distortionGlow * 1.5
        const mouseSize = 1 + mouseGlow * 1.2
        const dotSize = baseSize * waveSize * distortionSize * mouseSize

        const r = DOT_COLOR.r
        const g = DOT_COLOR.g + distortionGlow * 80 + mouseGlow * 100
        const b = DOT_COLOR.b + distortionGlow * 120 + mouseGlow * 150

        ctx!.beginPath()
        ctx!.arc(screenX, screenY, Math.max(0.4, dotSize), 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`
        ctx!.fill()

        // Distortion glow halo
        if (distortionGlow > 0.1) {
          ctx!.beginPath()
          ctx!.arc(screenX, screenY, dotSize * 2.5, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(${r}, ${g + 40}, ${b + 80}, ${distortionGlow * 0.12})`
          ctx!.fill()
        }

        // Mouse glow halo - soft glow around dots near cursor
        if (mouseGlow > 0.15) {
          ctx!.beginPath()
          ctx!.arc(screenX, screenY, dotSize * 3, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(255, 180, 180, ${mouseGlow * 0.15})`
          ctx!.fill()
        }
      }
    }

    animationId = requestAnimationFrame(animate)
  }

  animationId = requestAnimationFrame(animate)

  // Return cleanup function
  cleanupFn = () => {
    window.removeEventListener('resize', resizeCanvas)
    window.removeEventListener('mousemove', handleMouseMove)
  }
}

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (cleanupFn) {
    cleanupFn()
  }
})
</script>

<template>
  <div class="ocean-background">
    <canvas ref="canvasRef" class="ocean-canvas"></canvas>
    <div class="depth-overlay"></div>
  </div>
</template>

<style scoped>
.ocean-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.ocean-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.depth-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(8, 8, 8, 0.5) 0%,
    rgba(8, 8, 8, 0.2) 30%,
    rgba(8, 8, 8, 0) 50%,
    rgba(8, 8, 8, 0.3) 80%,
    rgba(8, 8, 8, 0.7) 100%
  );
}
</style>
