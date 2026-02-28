// src/components/kanban/TaskCard.tsx
'use client'

import { Task } from '@/types/kanban'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2 } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onDelete: (taskId: string) => void
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
  touchAction: 'none',   // 👈 new
}
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative cursor-grab rounded-lg bg-white p-4 shadow-sm hover:shadow-md active:cursor-grabbing"
    >
      <p className="text-sm text-gray-800">{task.content}</p>
      <button
  onClick={(e) => {
    e.stopPropagation()
    onDelete(task.id)
  }}
  className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
  aria-label="Delete task"
>
  <Trash2 size={16} />
</button>
    </div>
  )
}