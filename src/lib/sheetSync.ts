import { categoryRows, monthColumns } from './sheetConfig'

const GROUP_USERS: Record<string, string> = {
  'daniloann@mail.com': 'https://script.google.com/macros/s/AKfycbyBlz1Gz4jxgtLtDdAvgKzMAPW3qi3DPKYi5azmQPleFUTKaCc9xTkbZLHfpQwcdn-ofg/exec',
  'mirandaceb@mail.com': 'https://script.google.com/macros/s/AKfycbzdqRRcpLk2_cIXvASo2b0frAjmvs10yrOor6_0YqhWOxkns2lniPBaGuWOj9TjuDKJ/exec'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateTotals(expenses: any[], userEmail: string): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const e of expenses) {
    const cat = e.category?.toLowerCase().trim()
    if (!cat) continue
    const value =
      e.type === 'personal' && e.paidBy === userEmail ? e.amount :
      e.type === 'shared' ? e.amount / 2 : 0
    totals[cat] = (totals[cat] ?? 0) + value
  }
  return totals
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function syncSheet(expenses: any[], userEmail: string): void {
  const scriptUrl = GROUP_USERS[userEmail]
  if (!scriptUrl) return

  const now = new Date()
  const column = monthColumns[now.getMonth()]

  const monthExpenses = expenses.filter(e => {
    if (!e.created_at) return false
    const d = new Date(e.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })

  const totals = calculateTotals(monthExpenses, userEmail)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = { _year: now.getFullYear() }
  for (const [cat, row] of Object.entries(categoryRows)) {
    payload[`${cat}_${column}`] = { cell: `${column}${row}`, value: totals[cat] ?? 0 }
  }

  // fire and forget
  fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => console.log('✅ Sheet sync:', res.status))
    .catch(err => console.warn('❌ Sheet sync failed:', err))
}
