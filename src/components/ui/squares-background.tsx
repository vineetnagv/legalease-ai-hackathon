import { useRef, useEffect, useState } from "react"

interface SquaresProps {
  direction?: "right" | "left" | "up" | "down" | "diagonal" | "diagonal-ne" | "diagonal-se" | "diagonal-sw" | "diagonal-nw"
  speed?: number
  borderColor?: string
  squareSize?: number
  hoverFillColor?: string
  className?: string
  dynamicDirection?: boolean
}

export function Squares({
  direction = "right",
  speed = 1,
  borderColor = "#333",
  squareSize = 40,
  hoverFillColor = "#222",
  className,
  dynamicDirection = false,
}: SquaresProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number>()
  const numSquaresX = useRef<number>()
  const numSquaresY = useRef<number>()
  const gridOffset = useRef({ x: 0, y: 0 })
  const globalMousePos = useRef({ x: 0, y: 0 })
  const lastUpdateTime = useRef(0)

  const [hoveredSquare, setHoveredSquare] = useState<{
    x: number
    y: number
  } | null>(null)
  const [currentDirection, setCurrentDirection] = useState(direction)

  // Dynamic direction calculation based on cursor position
  const getDynamicDirection = (mouseX: number, mouseY: number, centerX: number, centerY: number) => {
    const angle = Math.atan2(mouseY - centerY, mouseX - centerX)
    const degrees = (angle * 180 / Math.PI + 360) % 360

    // 8 directional zones (45° each)
    if (degrees >= 337.5 || degrees < 22.5) return "right"
    if (degrees >= 22.5 && degrees < 67.5) return "diagonal-se" // down-right (South-East)
    if (degrees >= 67.5 && degrees < 112.5) return "down"
    if (degrees >= 112.5 && degrees < 157.5) return "diagonal-sw" // down-left (South-West)
    if (degrees >= 157.5 && degrees < 202.5) return "left"
    if (degrees >= 202.5 && degrees < 247.5) return "diagonal-nw" // up-left (North-West)
    if (degrees >= 247.5 && degrees < 292.5) return "up"
    if (degrees >= 292.5 && degrees < 337.5) return "diagonal-ne" // up-right (North-East)

    return "down" // fallback
  }

  // Global mouse tracking for dynamic direction
  useEffect(() => {
    if (!dynamicDirection) return

    const handleGlobalMouseMove = (event: MouseEvent) => {
      const now = Date.now()
      // Throttle updates to every 100ms for performance
      if (now - lastUpdateTime.current < 100) return

      lastUpdateTime.current = now
      globalMousePos.current = { x: event.clientX, y: event.clientY }

      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2

      const newDirection = getDynamicDirection(
        event.clientX,
        event.clientY,
        centerX,
        centerY
      )

      setCurrentDirection(newDirection as typeof direction)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove)
  }, [dynamicDirection])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Make canvas transparent to work with theme
    canvas.style.background = "transparent"

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      numSquaresX.current = Math.ceil(canvas.width / squareSize) + 1
      numSquaresY.current = Math.ceil(canvas.height / squareSize) + 1

      // Debug: Log canvas dimensions (remove in production)
      console.log('Canvas resized:', { width: canvas.width, height: canvas.height })
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize

      ctx.lineWidth = 1  // Make lines more visible

      let squareIndexX = 0
      let squareIndexY = 0

      for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
        squareIndexY = 0
        for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
          const squareX = x - (gridOffset.current.x % squareSize)
          const squareY = y - (gridOffset.current.y % squareSize)

          // Check if this square is hovered
          if (
            hoveredSquare &&
            squareIndexX === hoveredSquare.x &&
            squareIndexY === hoveredSquare.y
          ) {
            ctx.fillStyle = hoverFillColor
            ctx.fillRect(squareX, squareY, squareSize, squareSize)
          }

          ctx.strokeStyle = borderColor
          ctx.strokeRect(squareX, squareY, squareSize, squareSize)

          squareIndexY++
        }
        squareIndexX++
      }

      // Optional: Add subtle radial fade (remove if not needed)
      // const gradient = ctx.createRadialGradient(
      //   canvas.width / 2,
      //   canvas.height / 2,
      //   0,
      //   canvas.width / 2,
      //   canvas.height / 2,
      //   Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2)) / 2,
      // )
      // gradient.addColorStop(0, "rgba(0, 0, 0, 0)")
      // gradient.addColorStop(1, "rgba(0, 0, 0, 0.1)")
      // ctx.fillStyle = gradient
      // ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const updateAnimation = () => {
      const effectiveSpeed = Math.max(speed, 0.1)

      switch (currentDirection) {
        case "right":
          gridOffset.current.x =
            (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize
          break
        case "left":
          gridOffset.current.x =
            (gridOffset.current.x + effectiveSpeed + squareSize) % squareSize
          break
        case "up":
          gridOffset.current.y =
            (gridOffset.current.y + effectiveSpeed + squareSize) % squareSize
          break
        case "down":
          gridOffset.current.y =
            (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize
          break
        case "diagonal":
          gridOffset.current.x =
            (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize
          gridOffset.current.y =
            (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize
          break
        case "diagonal-ne": // North-East: up-right
          gridOffset.current.x =
            (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize
          gridOffset.current.y =
            (gridOffset.current.y + effectiveSpeed + squareSize) % squareSize
          break
        case "diagonal-se": // South-East: down-right
          gridOffset.current.x =
            (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize
          gridOffset.current.y =
            (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize
          break
        case "diagonal-sw": // South-West: down-left
          gridOffset.current.x =
            (gridOffset.current.x + effectiveSpeed + squareSize) % squareSize
          gridOffset.current.y =
            (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize
          break
        case "diagonal-nw": // North-West: up-left
          gridOffset.current.x =
            (gridOffset.current.x + effectiveSpeed + squareSize) % squareSize
          gridOffset.current.y =
            (gridOffset.current.y + effectiveSpeed + squareSize) % squareSize
          break
      }

      drawGrid()
      requestRef.current = requestAnimationFrame(updateAnimation)
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      // Match exact rendering logic for perfect synchronization
      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize

      // Account for grid offset exactly as in rendering
      const gridXOffset = gridOffset.current.x % squareSize
      const gridYOffset = gridOffset.current.y % squareSize

      // Calculate which square the mouse is over
      const relativeX = mouseX + gridXOffset
      const relativeY = mouseY + gridYOffset

      const hoveredSquareX = Math.floor(relativeX / squareSize)
      const hoveredSquareY = Math.floor(relativeY / squareSize)

      setHoveredSquare({ x: hoveredSquareX, y: hoveredSquareY })
    }

    const handleMouseLeave = () => {
      setHoveredSquare(null)
    }

    // Event listeners
    window.addEventListener("resize", resizeCanvas)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    // Initial setup
    resizeCanvas()
    requestRef.current = requestAnimationFrame(updateAnimation)

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [currentDirection, speed, borderColor, hoverFillColor, hoveredSquare, squareSize])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full border-none block ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'auto'
      }}
    />
  )
}