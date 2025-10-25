import { Squares } from "@/components/ui/squares-background"

export function SquaresDemo() {
  return (
    <div className="space-y-8">
      <div className="relative h-[400px] rounded-lg overflow-hidden bg-[#060606]">
        <Squares
          direction="diagonal"
          speed={0.5}
          squareSize={40}
          borderColor="#333"
          hoverFillColor="#222"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 text-white p-4 rounded-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold">Demo: Moving Squares Background</h3>
            <p className="text-sm text-gray-300 mt-2">
              Interactive canvas animation with hover effects
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}