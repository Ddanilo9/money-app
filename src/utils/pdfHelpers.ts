import { type CategoryGroup, type UserReport, type Expense } from 'src/models/expense';

export function buildUserReport(expenses: Expense[], currentUser: string): UserReport {

  const myExpenses = expenses.filter(
    (e) => e.paidBy === currentUser || e.type === 'shared'
  );

  const map: Record<string, Expense[]> = {};

  myExpenses.forEach((e) => {
    (map[e.category] ??= []).push(e);
  });

  const groups: CategoryGroup[] = Object.keys(map).map((cat) => {
    const list = map[cat] ?? [];

    const total = list.reduce((sum, e) => {
      if (e.type === 'shared') return sum + e.amount / 2
      if (e.paidBy === currentUser) return sum + e.amount
      return sum
    }, 0);

    return {
      category: cat,
      expenses: list,
      total
    };
  });

  const total = groups.reduce((sum, g) => sum + g.total, 0);

  return { user: currentUser, groups, total };
}
