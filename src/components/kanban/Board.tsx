// src/components/kanban/Board.tsx
'use client'

import { useKanban } from '@/hooks/useKanban'
import Column from './Column'
import Modals from './Modals'
import ClientOnly from '@/components/ClientOnly'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useState } from 'react'

export default function Board() {
  const { data, addColumn, addTask, deleteTask, deleteColumn, moveTask, undo, canUndo } = useKanban()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'column' | 'task' | null>(null)
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null)

  const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      delay: 250,        // Wait 250ms after touch start
      distance: 5,       // Or move 5px – whichever comes first
      tolerance: 5,      // Allow some movement while waiting
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Find source and destination column ids
    let sourceColId: string | null = null
    let destColId: string | null = null
    let newIndex = 0

    for (const col of Object.values(data.columns)) {
      if (col.taskIds.includes(taskId)) sourceColId = col.id
      if (col.taskIds.includes(overId)) destColId = col.id
    }

    // If dropping on a column directly (not a task), find the column id from over.id
    if (!destColId && data.columns[overId]) {
      destColId = overId
    }

    if (!sourceColId || !destColId) return

    // Reorder within same column
    if (sourceColId === destColId) {
      const column = data.columns[sourceColId]
      const oldIndex = column.taskIds.indexOf(taskId)
      const newIndex = column.taskIds.indexOf(overId)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newTaskIds = arrayMove(column.taskIds, oldIndex, newIndex)
        moveTask(taskId, sourceColId, destColId, newTaskIds.indexOf(taskId))
      }
      return
    }

    // Move to different column
    const destColumn = data.columns[destColId]
    // If overId is a task, insert at that task's position; else append at end
    if (data.tasks[overId]) {
      newIndex = destColumn.taskIds.indexOf(overId)
    } else {
      newIndex = destColumn.taskIds.length
    }
    moveTask(taskId, sourceColId, destColId, newIndex)
  }

  const openAddColumnModal = () => {
    setModalType('column')
    setIsModalOpen(true)
  }

  const openAddTaskModal = (columnId: string) => {
    setSelectedColumnId(columnId)
    setModalType('task')
    setIsModalOpen(true)
  }

  const handleModalSubmit = (titleOrContent: string) => {
    if (modalType === 'column') {
      addColumn(titleOrContent)
    } else if (modalType === 'task' && selectedColumnId) {
      addTask(selectedColumnId, titleOrContent)
    }
    setIsModalOpen(false)
    setModalType(null)
    setSelectedColumnId(null)
  }

  return (
    <>
    
<div className="mb-6 flex items-center justify-between">
  <h1 className="text-2xl font-semibold text-gray-800">Kanban Board</h1>
  <div className="flex gap-2">
    <button
      onClick={undo}
      disabled={!canUndo}
      className={`rounded-lg px-4 py-2 text-sm font-medium shadow focus:outline-none focus:ring-2 ${
        canUndo
          ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
    >
      Undo
    </button>
    <button
      onClick={openAddColumnModal}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      + Add Column
    </button>
  </div>
</div>

      <ClientOnly>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            {data.columnOrder.map((colId) => {
              const column = data.columns[colId]
              const tasks = column.taskIds.map((taskId) => data.tasks[taskId])
              return (
                <Column
                  key={colId}
                  column={column}
                  tasks={tasks}
                  onAddTask={() => openAddTaskModal(colId)}
                  onDeleteTask={deleteTask}
                 onDeleteColumn={deleteColumn} 
                />
              )
            })}
          </div>
        </DndContext>
      </ClientOnly>

      <Modals
        isOpen={isModalOpen}
        type={modalType}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </>
  )
}