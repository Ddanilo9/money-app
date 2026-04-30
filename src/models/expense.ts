export type ExpenseType = 'shared' | 'personal'

export interface Expense {
  id: number
  name: string
  amount: number
  category: string
  type: ExpenseType
  paidBy: string
}

export interface CategoryGroup {
  category: string
  expenses: Expense[]
  total: number
}

export interface UserReport {
  user: string
  groups: CategoryGroup[]
  total: number
}
