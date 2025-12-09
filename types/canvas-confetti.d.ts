declare module 'canvas-confetti' {
  type ConfettiOrigin = {
    x?: number
    y?: number
  }

  type ConfettiOptions = {
    particleCount?: number
    spread?: number
    origin?: ConfettiOrigin
    ticks?: number
    scalar?: number
    [key: string]: unknown
  }

  type ConfettiFn = (options?: ConfettiOptions) => void

  const confetti: ConfettiFn & {
    reset?: () => void
  }

  export default confetti
  export { ConfettiFn, ConfettiOptions, ConfettiOrigin }
}
