"use client"

import { useState } from "react"

export default function Landing({ onJoin }: { onJoin: (code: string) => void }) {
  const [code, setCode] = useState("")

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-card rounded-2xl p-8 shadow-xl border border-border backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            XOX Game
          </h1>
          <p className="text-muted-foreground text-lg">Join or create a room to start playing</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter room code"
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
            />
          </div>

          <button
            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => {
              if (!code) {
                const gen = Math.random().toString(36).slice(2, 8).toUpperCase()
                setCode(gen)
                onJoin(gen)
              } else {
                onJoin(code)
              }
            }}
          >
            {code ? "Join Room" : "Generate & Join"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">Share the room code with your friend to play together</p>
        </div>
      </div>
    </div>
  )
}
