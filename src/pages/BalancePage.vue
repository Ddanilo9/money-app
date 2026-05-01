<template>
  <q-page class="q-pa-md">

    <!-- HEADER -->
    <div class="text-h5 text-weight-medium q-mb-md">
      Bilancio
    </div>

    <!-- SELETTORE MESE -->
    <div class="row items-center justify-between q-mb-md">
      <q-btn flat round dense icon="chevron_left" @click="prevMonth" />
      <div class="text-subtitle1 text-weight-medium text-capitalize">
        {{ monthLabel }}
      </div>
      <q-btn flat round dense icon="chevron_right" @click="nextMonth" :disable="isCurrentMonth" />
    </div>

    <!-- CARD BILANCIO -->
    <q-card class="balance-card">

      <!-- MESSAGGIO -->
      <div class="text-subtitle1 text-weight-medium">
        <span v-if="message">
          {{ message }}
        </span>
        <span v-else class="text-grey">
          Nessun debito 👍
        </span>
      </div>

      <q-separator class="q-my-md" />
    </q-card>

    <!-- PDF BUTTON -->
    <q-btn
      label="Genera PDF"
      icon="picture_as_pdf"
      color="teal-7"
      unelevated
      rounded
      class="full-width q-mt-md pdf-btn"
      @click="generatePDF"
    />

    <!-- REPORT -->
    <div class="q-mt-lg">

      <div class="text-subtitle1 text-weight-medium q-mb-sm">
        Le tue spese
      </div>

      <q-card
        v-for="group in report.groups"
        :key="group.category"
        class="group-card"
      >
        <!-- HEADER -->
        <div class="row justify-between items-center q-mb-sm">

          <div class="text-weight-medium">
            {{ group.category.toUpperCase() }}
          </div>

          <div class="text-weight-bold">
            €{{ group.total }}
          </div>

        </div>

        <!-- SPESE -->
        <div
          v-for="e in group.expenses"
          :key="e.id"
          class="expense-row"
        >
          <div class="text-caption">
            {{ e.name }}
          </div>

          <div class="row items-center">

            <div class="text-caption q-mr-sm">
              €{{ e.amount }}
            </div>

            <q-badge
              :color="e.type === 'shared' ? 'primary' : 'blue-grey-4'"
              text-color="white"
              rounded
              class="badge"
            >
              {{ e.type === 'shared' ? 'C' : 'P' }}
            </q-badge>

          </div>
        </div>

      </q-card>

      <!-- TOTALE -->
      <div class="text-right text-weight-medium q-mt-md">
        Totale: €{{ report.total }}
      </div>

    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import jsPDF from 'jspdf'

import { supabase } from 'src/lib/supabase'
import { useExpensesStore } from 'src/stores/expenses-store'
import {
  calculateBalance,
  getBalanceMessage
} from 'src/utils/calculateBalance'
import { buildUserReport } from 'src/utils/pdfHelpers'

const currentUser = ref('')
const store = useExpensesStore()

// Mese selezionato (primo giorno del mese)
const selectedMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

const monthLabel = computed(() =>
  selectedMonth.value.toLocaleString('it-IT', { month: 'long', year: 'numeric' })
)

const isCurrentMonth = computed(() => {
  const now = new Date()
  return (
    selectedMonth.value.getFullYear() === now.getFullYear() &&
    selectedMonth.value.getMonth() === now.getMonth()
  )
})

function prevMonth() {
  const d = new Date(selectedMonth.value)
  d.setMonth(d.getMonth() - 1)
  selectedMonth.value = d
}

function nextMonth() {
  const d = new Date(selectedMonth.value)
  d.setMonth(d.getMonth() + 1)
  selectedMonth.value = d
}

// Filtra spese per mese selezionato
const filteredExpenses = computed(() =>
  store.expenses.filter(e => {
    if (!e.created_at) return false

    const d = new Date(e.created_at)
    const isSameMonth =
      d.getFullYear() === selectedMonth.value.getFullYear() &&
      d.getMonth() === selectedMonth.value.getMonth()

    if (!isSameMonth) return false

    // Mostra tutte le spese condivise (anche di altri utenti del gruppo)
    if (e.type === 'shared') return true

    // Mostra solo le spese personali dell'utente loggato
    return e.type === 'personal' && e.paidBy === currentUser.value
  })
)

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  currentUser.value = data.user?.email || ''
  await store.loadExpenses()
})

const balance = computed(() =>
  calculateBalance(filteredExpenses.value)
)

const message = computed(() =>
  getBalanceMessage(balance.value)
)

const report = computed(() =>
  buildUserReport(filteredExpenses.value, currentUser.value)
)

// PDF
function generatePDF() {
  const doc = new jsPDF()

  let y = 15

  const month = new Date().toLocaleString('it-IT', {
    month: 'long',
    year: 'numeric'
  })

  doc.setFontSize(18)
  doc.text('Report Spese', 105, y, { align: 'center' })

  y += 8

  doc.setFontSize(12)
  doc.text(`${currentUser.value} • ${month}`, 105, y, { align: 'center' })

  y += 10

  doc.setDrawColor(180)
  doc.line(20, y, 190, y)

  y += 10

  report.value.groups.forEach(group => {
    doc.setFontSize(13)
    doc.text(group.category.toUpperCase(), 20, y)

    y += 7

    doc.setFontSize(11)

    group.expenses.forEach(e => {
      const typeLabel = e.type === 'shared' ? '(C)' : '(P)'

      // 🔥 FIX QUI
      const value =
        e.type === 'shared'
          ? e.amount / 2
          : e.amount

      doc.text(`• ${e.name} ${typeLabel}`, 25, y)
      doc.text(`€${value.toFixed(2)}`, 180, y, { align: 'right' })

      y += 6
    })

    y += 2

    doc.setTextColor(100)
    doc.text(`Totale categoria: €${group.total.toFixed(2)}`, 180, y, { align: 'right' })

    y += 10
    doc.setTextColor(0)
  })

  doc.line(20, y, 190, y)

  y += 10

  doc.setFontSize(14)
  doc.text(`Totale generale: €${report.value.total.toFixed(2)}`, 180, y, { align: 'right' })

  doc.save(`report-${currentUser.value}.pdf`)
}
</script>

<style scoped>
.balance-card {
  padding: 16px;
  border-radius: 14px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.group-card {
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.04);
}

.expense-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.badge {
  font-size: 10px;
}

.pdf-btn {
  height: 44px;
}
</style>
