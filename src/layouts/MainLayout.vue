<template>
  <q-layout view="lHh Lpr lFf">

    <!-- HEADER -->
    <q-header elevated>
      <q-toolbar>

        <q-btn
          flat
          dense
          round
          icon="menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Spese
        </q-toolbar-title>

        <q-avatar
          size="34px"
          :style="{ background: avatarColor, cursor: 'default' }"
          class="text-white text-weight-bold avatar-header"
        >
          {{ userInitial }}
        </q-avatar>

      </q-toolbar>
    </q-header>

    <!-- DRAWER -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>

      <q-list>

        <q-item-label header>
          Menu
        </q-item-label>

        <q-item clickable to="/" :active-class="activeClass">
          <q-item-section avatar>
            <q-icon name="add" />
          </q-item-section>

          <q-item-section>
            Aggiungi Spesa
          </q-item-section>
        </q-item>

        <q-item clickable to="/balance" :active-class="activeClass">
          <q-item-section avatar>
            <q-icon name="account_balance" />
          </q-item-section>

          <q-item-section>
            Bilancio
          </q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item-label header>
          Impostazioni
        </q-item-label>

        <q-item tag="label" clickable>
          <q-item-section avatar>
            <q-icon name="dark_mode" />
          </q-item-section>

          <q-item-section>
            Dark Mode
          </q-item-section>

          <q-item-section side>
            <q-toggle v-model="darkMode" @update:model-value="applyDarkMode" />
          </q-item-section>
        </q-item>

        <q-item clickable @click="themeDialog = true">
          <q-item-section avatar>
            <q-icon name="palette" />
          </q-item-section>

          <q-item-section>
            Colore tema
          </q-item-section>

          <q-item-section side>
            <div class="color-dot" :style="{ background: currentColor }" />
          </q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item clickable @click="logout">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>

          <q-item-section>
            Logout
          </q-item-section>
        </q-item>

      </q-list>

    </q-drawer>

    <!-- DIALOG TEMA -->
    <q-dialog v-model="themeDialog">
      <q-card class="q-pa-md theme-card">

        <div class="text-subtitle1 text-weight-medium q-mb-md">Scegli colore tema</div>

        <div class="row q-gutter-sm justify-center">
          <div
            v-for="color in palette"
            :key="color.value"
            class="palette-dot"
            :style="{ background: color.value }"
            :title="color.label"
            @click="selectColor(color.value)"
          >
            <q-icon
              v-if="currentColor === color.value"
              name="check"
              color="white"
              size="16px"
            />
          </div>
        </div>

        <div class="row justify-end q-mt-md">
          <q-btn flat label="Chiudi" v-close-popup />
        </div>

      </q-card>
    </q-dialog>

    <!-- CONTENUTO -->
    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar, setCssVar } from 'quasar'
import { supabase } from 'src/lib/supabase'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const leftDrawerOpen = ref(false)
const router = useRouter()
const darkMode = ref(false)
const themeDialog = ref(false)
const currentUserEmail = ref('')

const userInitial = computed(() => {
  const email = currentUserEmail.value
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
})

// Genera un colore stabile dall'email
const avatarColor = computed(() => {
  const colors = ['#1976D2','#7B1FA2','#C2185B','#388E3C','#00796B','#E64A19','#0097A7','#3F51B5']
  const email = currentUserEmail.value
  if (!email) return colors[0]
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
})

const palette = [
  { label: 'Blu',       value: '#1976D2' },
  { label: 'Indaco',    value: '#3F51B5' },
  { label: 'Viola',     value: '#7B1FA2' },
  { label: 'Rosa',      value: '#C2185B' },
  { label: 'Rosso',     value: '#D32F2F' },
  { label: 'Arancione', value: '#E64A19' },
  { label: 'Verde',     value: '#388E3C' },
  { label: 'Teal',      value: '#00796B' },
  { label: 'Ciano',     value: '#0097A7' },
  { label: 'Grigio',    value: '#546E7A' },
]

const DEFAULT_COLOR = '#1976D2'
const currentColor = ref(DEFAULT_COLOR)

const activeClass = computed(() => $q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3')

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function applyDarkMode(value: boolean) {
  $q.dark.set(value)
  localStorage.setItem('darkMode', String(value))
}

function selectColor(color: string) {
  currentColor.value = color
  setCssVar('primary', color)
  localStorage.setItem('themeColor', color)
  themeDialog.value = false
}

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  currentUserEmail.value = data.user?.email ?? ''

  // 🔥 LISTENER REATTIVO
  supabase.auth.onAuthStateChange((event, session) => {
    currentUserEmail.value = session?.user?.email ?? ''
  })
})

async function logout() {
  await supabase.auth.signOut()
  currentUserEmail.value = '' 
  await router.push('/login')
}
</script>

<style scoped>
.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.15);
}

.avatar-header {
  font-size: 15px;
  letter-spacing: 0.03em;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  flex-shrink: 0;
}

.palette-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0,0,0,0.1);
  transition: transform 0.15s;
}

.palette-dot:hover {
  transform: scale(1.15);
}

.theme-card {
  min-width: 300px;
  max-width: 340px;
}
</style>
