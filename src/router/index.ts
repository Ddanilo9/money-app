import { defineRouter } from '#q-app/wrappers'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'
import routes from './routes'
import { supabase } from 'src/lib/supabase'

export default defineRouter(() => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // 🔐 ROUTE GUARD
  Router.beforeEach(async (to) => {
  const { data } = await supabase.auth.getSession()

  const isLogged = !!data.session

  // ❌ NON loggato → login
  if (!isLogged && to.path !== '/login') {
    return '/login'
  }

  // ✅ loggato → evita login
  if (isLogged && to.path === '/login') {
    return '/'
  }

  // ok continua
  return true
})

  return Router
})
