<template>
  <q-page class="flex flex-center column q-pa-md">

    <q-input v-model="email" label="Email" class="q-mb-md" />
    <q-input v-model="password" label="Password" type="password" class="q-mb-md" />

    <q-btn label="Login" color="primary" @click="login" />

    <div v-if="error" class="text-negative q-mt-md">
      {{ error }}
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

async function login() {
  const { error: err } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  if (err) {
    error.value = err.message
    return
  }

  await router.push('/')
}
</script>
