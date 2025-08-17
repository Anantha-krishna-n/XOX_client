
export default function GameBoard({ state, onCellClick, onRestart }: any) {
  const { board, turn, winner } = state ?? { board: Array(9).fill(null), turn: "X", winner: null };
  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="grid grid-cols-3 gap-2 w-64 h-64">
        {board.map((cell: any, i: number) => (
          <button key={i} onClick={() => onCellClick(i)} className="bg-slate-100 rounded text-3xl font-bold flex items-center justify-center">
            {cell ?? ""}
          </button>
        ))}
      </div>
      <div className="text-center mt-4">
        {winner ? (
          <div>
            <div className="text-lg">{winner === "draw" ? "Draw" : `${winner} Wins!`}</div>
            <button onClick={onRestart} className="mt-2 p-2 border rounded">Restart</button>
          </div>
        ) : (
          <div>Turn: {turn}</div>
        )}
      </div>
    </div>
  );
}
