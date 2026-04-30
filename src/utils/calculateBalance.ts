import { type Expense } from 'src/models/expense';

export function calculateBalance(expenses: Expense[]) {
  const balances: Record<string, number> = {};

  const sharedExpenses = expenses.filter((e) => e.type === 'shared');

  const users = Array.from(new Set(expenses.map((e) => e.paidBy)));

  if (users.length === 0) return {};

  users.forEach((user) => {
    balances[user] = 0;
  });

  const total = sharedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = total / users.length;

  sharedExpenses.forEach((exp) => {
    balances[exp.paidBy] = (balances[exp.paidBy] ?? 0) + exp.amount;
  });

  const result: Record<string, number> = {};

  users.forEach((user) => {
    result[user] = (balances[user] ?? 0) - perPerson;
  });

  return result;
}

export function getBalanceMessage(balance: Record<string, number>) {
  const users = Object.keys(balance)

  if (users.length < 2) return ''

  const names: Record<string, string> = {
    'daniloann@mail.com': 'Danilo',
    'mirandaceb@mail.com': 'Miranda'
  }

  const creditors = users
    .filter(u => (balance[u] ?? 0) > 0)
    .map(u => ({ user: u, amount: balance[u] ?? 0 }))

  const debtors = users
    .filter(u => (balance[u] ?? 0) < 0)
    .map(u => ({ user: u, amount: Math.abs(balance[u] ?? 0) }))

  const creditor = creditors[0]
  const debtor = debtors[0]

  if (!creditor || !debtor) {
    return 'Siete in pari 👍'
  }

  return `${names[debtor.user] ?? debtor.user} → ${names[creditor.user] ?? creditor.user}: ${debtor.amount.toFixed(2)}€`
}
