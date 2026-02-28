// src/types/kanban.ts
export type Task = {
  id: string
  content: string
}

export type Column = {
  id: string
  title: string
  taskIds: string[]
}

export type BoardData = {
  tasks: Record<string, Task>
  columns: Record<string, Column>
  columnOrder: string[]
}