// src/components/kanban/Column.tsx
'use client'

import { Column as ColumnType, Task } from '@/types/kanban'
import TaskCard from './TaskCard'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Trash2 } from 'lucide-react' // <-- import icon

interface ColumnProps {
  column: ColumnType
  tasks: Task[]
  onAddTask: () => void
  onDeleteTask: (taskId: string) => void
  onDeleteColumn: (columnId: string) => void // <-- new prop
}

export default function Column({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  onDeleteColumn,
}: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className="w-80 flex-shrink-0 rounded-lg bg-gray-100 p-4 shadow-md"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-medium text-gray-700">{column.title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{tasks.length}</span>
          <button
            onClick={() => onDeleteColumn(column.id)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            aria-label="Delete column"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={onAddTask}
        className="mt-4 w-full rounded-md border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 focus:outline-none"
      >
        + Add Task
      </button>
    </div>
  )
}