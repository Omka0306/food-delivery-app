let audioCtx = null

async function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume()
  }
  return audioCtx
}

function tone(ctx, freq, startTime, duration = 0.22, volume = 0.28) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

// Call once on any user interaction to unlock AudioContext early
export function unlockAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
}

// Three ascending beeps — played when restaurant receives a new order
export async function playNewOrderSound() {
  try {
    const ctx = await getCtx()
    const t = ctx.currentTime
    tone(ctx, 880, t, 0.18)
    tone(ctx, 1100, t + 0.2, 0.18)
    tone(ctx, 1320, t + 0.4, 0.3)
  } catch (_) {}
}

// Two-tone chime — played for customer when order goes "Out for Delivery"
export async function playOutForDeliverySound() {
  try {
    const ctx = await getCtx()
    const t = ctx.currentTime
    tone(ctx, 660, t, 0.15)
    tone(ctx, 880, t + 0.18, 0.35)
  } catch (_) {}
}
