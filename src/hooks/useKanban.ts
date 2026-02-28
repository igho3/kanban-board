// src/hooks/useKanban.ts
import { useState, useEffect, useRef } from 'react'
import { BoardData, Column, Task } from '@/types/kanban'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'kanban-board-data'
const MAX_HISTORY = 50

const initialData: BoardData = {
  tasks: {
    'task-1': { id: 'task-1', content: 'Design new layout' },
    'task-2': { id: 'task-2', content: 'Write documentation' },
    'task-3': { id: 'task-3', content: 'Review pull requests' },
  },
  columns: {
    'column-1': {
      id: 'column-1',
      title: 'To Do',
      taskIds: ['task-1', 'task-2'],
    },
    'column-2': {
      id: 'column-2',
      title: 'In Progress',
      taskIds: ['task-3'],
    },
    'column-3': {
      id: 'column-3',
      title: 'Done',
      taskIds: [],
    },
  },
  columnOrder: ['column-1', 'column-2', 'column-3'],
}

export function useKanban() {
  // Load initial state from localStorage or use initialData
  const [data, setData] = useState<BoardData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved data', e)
        }
      }
    }
    return initialData
  })

  // History stack and pointer
  const [history, setHistory] = useState<BoardData[]>([])
  const [future, setFuture] = useState<BoardData[]>([]) // optional redo, but we'll only do undo for now

  // Ref to skip recording when undoing
  const isUndoing = useRef(false)

  // Save to localStorage whenever data changes (but not during undo/redo?)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data])

  // Wrapper around setData that records history
  const setDataWithHistory = (newData: BoardData | ((prev: BoardData) => BoardData)) => {
    setData((prev) => {
      const resolvedNewData = typeof newData === 'function' ? newData(prev) : newData

      // If undoing, skip recording
      if (isUndoing.current) {
        return resolvedNewData
      }

      // If the data actually changed, record previous state in history
      if (JSON.stringify(prev) !== JSON.stringify(resolvedNewData)) {
        setHistory((prevHistory) => {
          const newHistory = [prev, ...prevHistory].slice(0, MAX_HISTORY)
          return newHistory
        })
        // Clear future (if we had redo) – we're not implementing redo now
        setFuture([])
      }

      return resolvedNewData
    })
  }

  // Undo function
  const undo = () => {
    setHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory

      // Get the last state
      const [last, ...rest] = prevHistory

      isUndoing.current = true
      setDataWithHistory(last) // setData will not record again because isUndoing is true
      // But we need to set data directly to avoid recording
      setData(last)
      // After setting, turn off undoing flag
      setTimeout(() => { isUndoing.current = false }, 0)

      return rest
    })
  }

  const canUndo = history.length > 0

  // All the action functions now use setDataWithHistory instead of setData
  const addColumn = (title: string) => {
    const newColumnId = `column-${uuidv4()}`
    const newColumn: Column = {
      id: newColumnId,
      title,
      taskIds: [],
    }
    setDataWithHistory((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [newColumnId]: newColumn,
      },
      columnOrder: [...prev.columnOrder, newColumnId],
    }))
  }

  const addTask = (columnId: string, content: string) => {
    const newTaskId = `task-${uuidv4()}`
    const newTask: Task = { id: newTaskId, content }
    setDataWithHistory((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [newTaskId]: newTask,
      },
      columns: {
        ...prev.columns,
        [columnId]: {
          ...prev.columns[columnId],
          taskIds: [...prev.columns[columnId].taskIds, newTaskId],
        },
      },
    }))
  }

  const deleteTask = (taskId: string) => {
    setDataWithHistory((prev) => {
      const updatedColumns = { ...prev.columns }
      for (const col of Object.values(updatedColumns)) {
        if (col.taskIds.includes(taskId)) {
          col.taskIds = col.taskIds.filter((id) => id !== taskId)
        }
      }
      const { [taskId]: _, ...remainingTasks } = prev.tasks
      return {
        ...prev,
        tasks: remainingTasks,
        columns: updatedColumns,
      }
    })
  }

  const deleteColumn = (columnId: string) => {
    setDataWithHistory((prev) => {
      const taskIdsToDelete = prev.columns[columnId].taskIds
      const remainingTasks = { ...prev.tasks }
      taskIdsToDelete.forEach((taskId) => {
        delete remainingTasks[taskId]
      })
      const { [columnId]: _, ...remainingColumns } = prev.columns
      const newColumnOrder = prev.columnOrder.filter((id) => id !== columnId)
      return {
        tasks: remainingTasks,
        columns: remainingColumns,
        columnOrder: newColumnOrder,
      }
    })
  }

  const moveTask = (
    taskId: string,
    sourceColId: string,
    destColId: string,
    newIndex: number
  ) => {
    setDataWithHistory((prev) => {
      const sourceColumn = prev.columns[sourceColId]
      const destColumn = prev.columns[destColId]
      const sourceTaskIds = [...sourceColumn.taskIds]
      const destTaskIds =
        sourceColId === destColId ? sourceTaskIds : [...destColumn.taskIds]

      const [movedTaskId] = sourceTaskIds.splice(
        sourceTaskIds.indexOf(taskId),
        1
      )
      destTaskIds.splice(newIndex, 0, movedTaskId)

      return {
        ...prev,
        columns: {
          ...prev.columns,
          [sourceColId]: {
            ...sourceColumn,
            taskIds: sourceTaskIds,
          },
          [destColId]: {
            ...destColumn,
            taskIds: destTaskIds,
          },
        },
      }
    })
  }

  return {
    data,
    addColumn,
    addTask,
    deleteTask,
    deleteColumn,
    moveTask,
    undo,
    canUndo,
  }
}