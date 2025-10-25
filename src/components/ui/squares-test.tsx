import { Squares } from "@/components/ui/squares-background"

export function SquaresTest() {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="relative w-[600px] h-[400px] bg-white rounded-lg overflow-hidden">
        <Squares
          direction="diagonal"
          speed={1}
          squareSize={30}
          borderColor="#333"
          hoverFillColor="#666"
        />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-white/90 p-4 rounded shadow-lg">
            <h2 className="text-lg font-bold text-black">Squares Test</h2>
            <p className="text-sm text-gray-600">You should see animated squares behind this box</p>
            <p className="text-xs text-gray-500 mt-2">Check browser console for debug logs</p>
          </div>
        </div>
      </div>
    </div>
  )
}