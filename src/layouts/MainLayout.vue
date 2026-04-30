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
          Money App
        </q-toolbar-title>

      </q-toolbar>
    </q-header>

    <!-- DRAWER -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>

      <q-list>

        <q-item-label header>
          Menu
        </q-item-label>

        <q-item clickable to="/" active-class="bg-grey-3">
          <q-item-section avatar>
            <q-icon name="add" />
          </q-item-section>

          <q-item-section>
            Aggiungi Spesa
          </q-item-section>
        </q-item>

        <q-item clickable to="/balance" active-class="bg-grey-3">
          <q-item-section avatar>
            <q-icon name="account_balance" />
          </q-item-section>

          <q-item-section>
            Bilancio
          </q-item-section>
        </q-item>

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

    <!-- CONTENUTO -->
    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useRouter } from 'vue-router'

const leftDrawerOpen = ref(false)
const router = useRouter()

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

async function logout() {
  await supabase.auth.signOut()
  await router.push('/login')
}
</script>
