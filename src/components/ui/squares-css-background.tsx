interface SquaresCSSProps {
  className?: string
}

export function SquaresCSS({ className }: SquaresCSSProps) {
  return (
    <div
      className={`w-full h-full ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        animation: 'moveGrid 20s linear infinite'
      }}
    >
      <style jsx>{`
        @keyframes moveGrid {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
      `}</style>
    </div>
  )
}