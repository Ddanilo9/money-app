import { supabase } from 'src/lib/supabase'

const BASE_URL = 'http://localhost:3000'

// 🔐 helper token
async function getAuthHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  console.log('🔐 TOKEN:', token)

  return {
    Authorization: `Bearer ${token}`
  }
}

// GET
export async function getExpenses() {
  const headers = await getAuthHeader()

  const res = await fetch(`${BASE_URL}/expenses`, {
    headers
  })

  const data = await res.json()

  console.log('📥 GET RESPONSE:', data)

  return data
}

// ADD
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addExpense(expense: any) {
  const headers = await getAuthHeader()

  console.log('📤 ADD PAYLOAD:', expense)

  const res = await fetch(`${BASE_URL}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(expense)
  })

  const data = await res.json()

  console.log('📥 ADD RESPONSE:', data)

  return data
}

// UPDATE
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateExpense(expense: any) {
  const headers = await getAuthHeader()

  console.log('📤 UPDATE PAYLOAD:', expense)

  const res = await fetch(`${BASE_URL}/expenses/${expense.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(expense)
  })

  const data = await res.json()

  console.log('📥 UPDATE RESPONSE:', data)

  return data
}
