/**
 * Alerta sonora del cronómetro de mesas, generada con Web Audio API para no
 * depender de un archivo de audio embebido. Reutiliza un único AudioContext.
 */
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }
  return sharedAudioContext;
}

export function playTimerAlertSound(): void {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    void context.resume();
  }

  const beepTimes = [0, 0.35, 0.7];
  beepTimes.forEach((offset) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 880;

    const startAt = context.currentTime + offset;
    const stopAt = startAt + 0.22;

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.3, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(stopAt);
  });
}
