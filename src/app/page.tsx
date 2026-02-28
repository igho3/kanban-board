// src/app/page.tsx
import Board from '@/components/kanban/Board'

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <Board />
    </main>
  )
}