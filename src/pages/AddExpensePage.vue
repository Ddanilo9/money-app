<template>
  <q-page class="column">

    <!-- LOADER -->
    <div v-if="store.loading" class="loader-container">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-caption q-mt-sm">Caricamento...</div>
    </div>

    <!-- LISTA -->
    <div v-else class="col q-pa-sm scroll">

      <q-list>

        <q-slide-item
          v-for="exp in myExpenses"
          :key="exp.id"
          @right="onEdit($event, exp)"
        >
          <q-item class="expense-card">

            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ exp.name }}
              </q-item-label>

              <q-item-label caption class="text-grey-6">
                {{ exp.category }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="text-weight-bold text-subtitle1">
                €{{ exp.amount }}
              </div>
            </q-item-section>

            <q-item-section side>
              <q-badge
                :color="exp.type === 'shared' ? 'primary' : 'grey-5'"
                text-color="white"
                rounded
              >
                {{ exp.type === 'shared' ? 'C' : 'P' }}
              </q-badge>
            </q-item-section>

          </q-item>

          <template v-slot:right>
            <div class="row items-center bg-primary text-white q-px-md">
              Modifica
            </div>
          </template>

        </q-slide-item>

      </q-list>

      <div v-if="myExpenses.length === 0" class="text-grey text-center q-mt-md">
        Nessuna spesa
      </div>

    </div>

    <!-- INPUT -->
    <div class="q-pa-sm bg-white border-top">

      <!-- RIGA 1 -->
      <div class="row q-col-gutter-sm q-mb-sm">

        <div class="col">
          <q-input
            filled
            v-model="name"
            placeholder="Pizza, affitto, spesa..."
            @keyup.enter="addExpense"
          />
        </div>

        <div style="width: 100px">
          <q-input
            filled
            type="number"
            v-model.number="amount"
            placeholder="€"
            @keyup.enter="addExpense"
          />
        </div>

      </div>

      <!-- RIGA 2 -->
      <div class="row items-center q-col-gutter-sm">

        <div class="col">
          <q-select
            filled
            v-model="category"
            :options="categories"
            label="Categoria"
            dense
          />
        </div>

        <div style="width: 130px">
          <q-select
            filled
            v-model="type"
            :options="types"
            dense
          />
        </div>

        <!-- ADD BUTTON -->
        <div class="add-btn">
          <q-btn
            icon="add"
            color="primary"
            round
            unelevated
            :loading="adding"
            :disable="adding"
            @click="addExpense"
          />
        </div>

      </div>

    </div>

    <!-- EDIT -->
    <q-dialog v-model="editDialog">
      <q-card class="q-pa-md" style="min-width: 300px">

        <div class="text-h6">Modifica Spesa</div>

        <q-input v-model="editName" label="Nome" class="q-mt-md" />

        <q-input
          v-model.number="editAmount"
          type="number"
          label="Importo"
          class="q-mt-md"
        />

        <q-select
          v-model="editType"
          :options="types"
          label="Tipo"
          class="q-mt-md"
        />

        <q-select
          v-model="editCategory"
          :options="categories"
          label="Categoria"
          class="q-mt-md"
        />

        <div class="row justify-end q-mt-md">
          <q-btn flat label="Annulla" v-close-popup />

          <q-btn
            label="Salva"
            color="primary"
            :loading="saving"
            :disable="saving"
            @click="saveEdit"
          />
        </div>

      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useExpensesStore } from 'src/stores/expenses-store'
import { supabase } from 'src/lib/supabase'
import { useQuasar } from 'quasar'
import type { Expense } from 'src/models/expense'

const store = useExpensesStore()
const $q = useQuasar()

const currentUser = ref('')

// 🔥 UX loading locali
const adding = ref(false)
const saving = ref(false)

// LOAD
onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  currentUser.value = data.user?.email || ''
  await store.loadExpenses()
})

// FILTRO
const myExpenses = computed(() =>
  store.expenses.filter(e => e.paidBy === currentUser.value)
)

// STATE
const name = ref('')
const amount = ref<number | null>(null)
const type = ref<'shared' | 'personal'>('shared')
const category = ref<string | null>(null)

const types = ['shared', 'personal']

const categories = [
  'casa',
  'spesa',
  'trasporti',
  'entertainment',
  'health'
]

// EDIT
const editDialog = ref(false)
const selectedExpense = ref<Expense | null>(null)

const editName = ref('')
const editAmount = ref<number | null>(null)
const editType = ref<'shared' | 'personal'>('shared')
const editCategory = ref<string | null>(null)

// =====================
// ADD
// =====================
async function addExpense() {
  if (!name.value || amount.value === null || !category.value) {
    $q.notify({
      message: 'Compila tutti i campi',
      color: 'warning'
    })
    return
  }

  adding.value = true

  try {
    const newExpense: Expense = {
      id: Date.now(),
      name: name.value,
      amount: amount.value,
      category: category.value,
      type: type.value,
      paidBy: currentUser.value
    }

    await store.addExpense(newExpense)

    $q.notify({
      message: 'Spesa aggiunta 💸',
      color: 'positive',
      timeout: 1200
    })

    name.value = ''
    amount.value = null
    category.value = null
    type.value = 'shared'

  } catch {
    $q.notify({
      message: 'Errore durante il salvataggio',
      color: 'negative'
    })
  } finally {
    adding.value = false
  }
}

// =====================
// EDIT OPEN
// =====================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onEdit({ reset }: any, exp: Expense) {
  reset()

  selectedExpense.value = exp
  editName.value = exp.name
  editAmount.value = exp.amount
  editType.value = exp.type
  editCategory.value = exp.category

  editDialog.value = true
}

// =====================
// SAVE
// =====================
async function saveEdit() {
  if (!selectedExpense.value) return

  saving.value = true

  try {
    const updated: Expense = {
      ...selectedExpense.value,
      name: editName.value,
      amount: editAmount.value || 0,
      type: editType.value,
      category: editCategory.value || 'general'
    }

    await store.updateExpense(updated)

    editDialog.value = false

    $q.notify({
      message: 'Spesa aggiornata ✏️',
      color: 'info',
      timeout: 1200
    })

  } catch {
    $q.notify({
      message: 'Errore aggiornamento',
      color: 'negative'
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.border-top {
  border-top: 1px solid #eee;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.loader-container {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.expense-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 8px;
  padding: 6px 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
}

.add-btn .q-btn {
  width: 42px;
  height: 42px;
}
</style>
