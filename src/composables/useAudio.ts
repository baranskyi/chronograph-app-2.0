import { ref } from 'vue'

export function useAudio() {
  const audioContext = ref<AudioContext | null>(null)
  const isSupported = ref(typeof AudioContext !== 'undefined')

  function getContext(): AudioContext {
    if (!audioContext.value) {
      audioContext.value = new AudioContext()
    }
    return audioContext.value
  }

  /**
   * Play a beep sound
   * @param frequency - Frequency in Hz (default 880 for A5)
   * @param duration - Duration in seconds
   * @param volume - Volume 0-1
   */
  function playBeep(frequency = 880, duration = 0.15, volume = 0.5) {
    if (!isSupported.value) return

    const ctx = getContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }

  /**
   * Play double beep (UN-style alert)
   */
  function playDoubleBeep() {
    playBeep(880, 0.15, 0.5)
    setTimeout(() => {
      playBeep(880, 0.15, 0.5)
    }, 200)
  }

  /**
   * Play warning sound (lower pitch)
   */
  function playWarning() {
    playBeep(440, 0.3, 0.4)
  }

  /**
   * Play end sound (descending tone)
   */
  function playEnd() {
    playBeep(880, 0.2, 0.5)
    setTimeout(() => playBeep(660, 0.2, 0.5), 250)
    setTimeout(() => playBeep(440, 0.4, 0.5), 500)
  }

  /**
   * Resume audio context (needed after user interaction)
   */
  async function resumeContext() {
    if (audioContext.value?.state === 'suspended') {
      await audioContext.value.resume()
    }
  }

  return {
    isSupported,
    playBeep,
    playDoubleBeep,
    playWarning,
    playEnd,
    resumeContext,
  }
}
