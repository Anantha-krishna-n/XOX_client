export default function GameBoard({ state, onCellClick, onRestart }: any) {
  const { board, turn, winner } = state ?? { board: Array(9).fill(null), turn: "X", winner: null }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-xl border border-border backdrop-blur-sm">
      <div className="grid grid-cols-3 gap-3 w-80 h-80 mb-6">
        {board.map((cell: any, i: number) => (
          <button
            key={i}
            onClick={() => onCellClick(i)}
            disabled={cell || winner}
            className={`
              game-cell bg-muted hover:bg-muted/80 rounded-xl text-4xl font-bold 
              flex items-center justify-center transition-all duration-200 
              border-2 border-border hover:border-accent hover:shadow-lg
              disabled:cursor-not-allowed
              ${cell ? "filled" : "hover:scale-105"}
              ${cell === "X" ? "text-primary" : cell === "O" ? "text-secondary" : "text-muted-foreground"}
            `}
          >
            {cell ?? ""}
          </button>
        ))}
      </div>

      <div className="text-center space-y-4">
        {winner ? (
          <div className="space-y-4">
            <div
              className={`text-2xl font-bold ${winner === "draw" ? "text-muted-foreground" : "text-accent winner-glow"}`}
            >
              {winner === "draw" ? "It's a Draw!" : `🎉 ${winner} Wins!`}
            </div>
            <button
              onClick={onRestart}
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Play Again
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <div className="text-lg text-muted-foreground">Current Turn:</div>
            <div
              className={`text-2xl font-bold px-4 py-2 rounded-lg ${turn === "X" ? "text-primary bg-primary/10" : "text-secondary bg-secondary/10"}`}
            >
              {turn}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}