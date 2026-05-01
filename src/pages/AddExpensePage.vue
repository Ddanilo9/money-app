<template>
  <q-page class="column">

    <!-- LOADER -->
    <div v-if="store.loading" class="loader-container">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-caption q-mt-sm">Caricamento...</div>
    </div>

    <!-- LISTA -->
    <div v-else class="col q-pa-md scroll">

      <template v-for="group in groupedExpenses" :key="group.key">

        <div :class="['month-divider', $q.dark.isActive ? 'text-grey-4' : 'text-grey-6']">
          {{ group.label }}
        </div>

        <q-list>

          <q-slide-item
            v-for="exp in group.expenses"
            :key="exp.id"
            class="slide-item"
            right-color="primary"
            @right="onEdit($event, exp)"
          >
            <q-item :class="['expense-card', 'q-pa-md', $q.dark.isActive ? 'bg-grey-9' : 'bg-white']">

              <q-item-section>
                <q-item-label :class="['text-weight-medium', $q.dark.isActive ? 'text-white' : 'text-dark']">
                  {{ exp.name }}
                </q-item-label>

                <q-item-label caption :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-6'">
                  {{ getCategoryLabel(exp.category) }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div :class="['text-weight-bold text-subtitle1', $q.dark.isActive ? 'text-white' : 'text-dark']">
                  €{{ exp.amount }}
                </div>
              </q-item-section>

              <q-item-section side>
                <q-badge
                  :color="exp.type === 'shared' ? 'primary' : 'blue-grey-4'"
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

      </template>

      <div v-if="myExpenses.length === 0" class="text-grey text-center q-mt-md">
        Nessuna spesa
      </div>

    </div>

    <!-- INPUT / ADD FORM -->
    <template v-if="!store.loading">
      <div
        v-if="showForm"
        :class="['q-pa-sm border-top', $q.dark.isActive ? 'bg-dark' : 'bg-white']"
      >

        <!-- RIGA 1 -->
        <div class="row q-col-gutter-sm q-mb-sm">

          <div class="col">
            <q-input
              filled
              v-model="name"
              placeholder="Spesa..."
              @keyup.enter="addExpense"
              :disable="adding"
            />
          </div>

          <div style="width: 100px">
            <q-input
              filled
              type="number"
              v-model.number="amount"
              placeholder="€"
              @keyup.enter="addExpense"
              :disable="adding"
            />
          </div>

        </div>

        <!-- RIGA 2 -->
        <div class="row items-center q-col-gutter-sm">

          <div class="col">
           <q-select
  filled
  v-model="category"
  :options="categoryOptions"
  option-label="label"
  option-value="value"
  emit-value
  map-options
/>
          </div>

          <div style="width: 130px">
            <q-select
              filled
              v-model="type"
              :options="types"
              dense
              :disable="adding"
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
              :disable="adding || !name || amount === null || !category"
              @click="addExpense"
            />
          </div>

        </div>
      </div>
    </template>

    <!-- EDIT -->
    <q-dialog v-model="editDialog" @hide="pendingReset && pendingReset()">
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
  :options="categoryOptions"
  option-label="label"
  placeholder="Categoria"
  option-value="value"
  emit-value
  map-options
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
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useExpensesStore } from 'src/stores/expenses-store'
import { supabase } from 'src/lib/supabase'
import { useQuasar } from 'quasar'
import type { Expense } from 'src/models/expense'

const store = useExpensesStore()
const $q = useQuasar()

const currentUser = ref('')

const adding = ref(false)
const saving = ref(false)
const showForm = ref(true)

// LOAD
onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  currentUser.value = data.user?.email || ''
  await store.loadExpenses()
})

// FILTRO
const myExpenses = computed(() =>
  store.expenses
    .filter(e => e.paidBy === currentUser.value)
    .slice(0, 50)
)

const MONTHS_IT = [
  'Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'
]

type MonthGroup = { key: string; label: string; expenses: Expense[] }

const groupedExpenses = computed<MonthGroup[]>(() => {
  const groups: MonthGroup[] = []
  const map = new Map<string, MonthGroup>()

  for (const exp of myExpenses.value) {
    const d = exp.created_at ? new Date(exp.created_at) : new Date()
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const label = `${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`

    if (!map.has(key)) {
      const group: MonthGroup = { key, label, expenses: [] }
      map.set(key, group)
      groups.push(group)
    }
    map.get(key)!.expenses.push(exp)
  }

  return groups
})

// FORM STATE
const name = ref('')
const amount = ref<number | null>(null)
const type = ref<'shared' | 'personal'>('shared')
const category = ref<string | null>(null)

const types = ['shared', 'personal']
const categories = [
  'mutuo',
  'affitto',
  'utenza',
  'rate',
  'oggetti casa',
  'assicurazioni',
  'metro/bus',
  'benzina',
  'supermercato',
  'cene/uscite',
  'vario',
  'shopping vestiti',
  'cosmetica',
  'entertainment',
  'palestra',
  'salute',
  'psicologo',
  'roadtrip',
  'vacanze',
  'commercialista',
  'tax autonomo',
  'gastos autonomo',
  'tax varie'
] as const

function getCategoryLabel(cat: unknown) {
  const value = getCategoryValue(cat)
  return categoryLabels[lang.value][value]
}

function getCategoryValue(cat: unknown): Category {
  if (typeof cat === 'object' && cat !== null && 'value' in cat) {
    return (cat as { value: Category }).value
  }

  if (typeof cat === 'string') {
    return cat as Category
  }

  return 'vario' // fallback safe
}

type Category = typeof categories[number]
const categoryOptions = computed(() =>
  categories.map(cat => ({
    label: categoryLabels[lang.value][cat] || cat,
    value: cat
  }))
)

const lang = computed(() =>
  currentUser.value === 'mirandaceb@mail.com' ? 'es' : 'it'
)

const categoryLabels: Record<'it' | 'es', Record<Category, string>> = {
  it: {
    mutuo: 'Mutuo',
    affitto: 'Affitto',
    utenza: 'Utenze',
    rate: 'Rate',
    'oggetti casa': 'Casa & manutenzione',
    assicurazioni: 'Assicurazioni',
    'metro/bus': 'Trasporti pubblici',
    benzina: 'Benzina',
    supermercato: 'Spesa alimentare',
    'cene/uscite': 'Ristoranti & uscite',
    vario: 'Varie',
    'shopping vestiti': 'Shopping',
    cosmetica: 'Cura personale',
    entertainment: 'Entertainment',
    palestra: 'Palestra',
    salute: 'Salute',
    psicologo: 'Psicologo',
    roadtrip: 'Roadtrip',
    vacanze: 'Vacanze',
    commercialista: 'Commercialista',
    'tax autonomo': 'Tasse autonomo',
    'gastos autonomo': 'Spese autonomo',
    'tax varie': 'Altre tasse'
  },
  es: {
    mutuo: 'Hipoteca',
    affitto: 'Alquiler',
    utenza: 'Servicios',
    rate: 'Cuotas',
    'oggetti casa': 'Cosas para la casa',
    assicurazioni: 'Seguros',
    'metro/bus': 'Transporte público',
    benzina: 'Combustible',
    supermercato: 'Supermercado',
    'cene/uscite': 'Salidas a comer',
    vario: 'Varios',
    'shopping vestiti': 'Ropa',
    cosmetica: 'Belleza',
    entertainment: 'Entretenimiento',
    palestra: 'Ejercicio',
    salute: 'Salud',
    psicologo: 'Salud mental',
    roadtrip: 'Roadtrip',
    vacanze: 'Vacaciones',
    commercialista: 'Gestoría',
    'tax autonomo': 'Seguridad social',
    'gastos autonomo': 'Gastos autónomo',
    'tax varie': 'Impuestos varios'
  }
}

// EDIT STATE
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
  console.log('🟡 CLICK ADD')

  if (!name.value?.trim() || amount.value === null || amount.value <= 0 || !category.value) {
    console.log('⛔ VALIDAZIONE FALLITA', {
      name: name.value,
      amount: amount.value,
      category: category.value,
      type: type.value
    })

    $q.notify({
      message: 'Compila tutti i campi correttamente',
      color: 'warning'
    })
    return
  }

  adding.value = true

  console.log('🟢 PRIMA ADD STORE', {
    name: name.value,
    amount: amount.value,
    category: category.value,
    type: type.value
  })

  try {
    const newExpense: Expense = {
      id: Date.now(),
      name: name.value.trim(),
      amount: amount.value,
      category: category.value,
      type: type.value,
      paidBy: currentUser.value
    }

    console.log('📦 OGGETTO CREATO', newExpense)

    await store.addExpense({ ...newExpense }) // 👈 clone per evitare reference strane

    console.log('✅ DOPO STORE ADD', {
      name: name.value,
      amount: amount.value,
      category: category.value,
      type: type.value
    })

    await resetForm()

    console.log('🧹 DOPO RESET FORM', {
      name: name.value,
      amount: amount.value,
      category: category.value,
      type: type.value
    })

    $q.notify({
      message: 'Spesa aggiunta con successo 💸',
      color: 'positive',
      timeout: 1500
    })

  } catch (err) {
    console.error('💥 ERRORE ADD', err)

    $q.notify({
      message: 'Errore durante il salvataggio',
      color: 'negative'
    })
  } finally {
    adding.value = false

    console.log('🔵 FINE ADD (adding=false)', {
      name: name.value,
      amount: amount.value,
      category: category.value,
      type: type.value
    })
  }
}
async function resetForm() {
  console.log('🧹 RESET START')

  name.value = ''
  amount.value = null
  category.value = null
  type.value = 'shared'

  console.log('🧹 DOPO SET', {
    name: name.value,
    amount: amount.value,
    category: category.value,
    type: type.value
  })

  showForm.value = false
  await nextTick()
  showForm.value = true

  console.log('🧹 FORM RICREATO')
}

// =====================
// EDIT
// =====================
const pendingReset = ref<(() => void) | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onEdit({ reset }: any, exp: Expense) {
  pendingReset.value = reset

  selectedExpense.value = exp
  editName.value = exp.name
  editAmount.value = exp.amount
  editType.value = exp.type
  editCategory.value = exp.category

  editDialog.value = true
}

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

    $q.notify({ message: 'Spesa aggiornata ✏️', color: 'info', timeout: 1200 })

  } catch {
    $q.notify({ message: 'Errore aggiornamento', color: 'negative' })
  } finally {
    saving.value = false
  }
}

watch([name, amount, category, type], () => {
  console.log('👀 FORM CAMBIATO', {
    name: name.value,
    amount: amount.value,
    category: category.value,
    type: type.value
  })
})
</script>

<style scoped>
.border-top {
  border-top: 1px solid #eee;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.month-divider {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 16px 4px 6px;
}

:global(body.body--dark) .border-top {
  border-top-color: #444;
}

.loader-container {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.slide-item {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 10px;
}

.expense-card {
  border-radius: 12px;
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
