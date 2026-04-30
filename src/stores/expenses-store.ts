import { defineStore } from 'pinia';
import type { Expense } from 'src/models/expense';
import { getExpenses, addExpense as apiAddExpense , updateExpense as apiUpdateExpense} from 'src/services/api';

export const useExpensesStore = defineStore('expenses', {
  state: () => ({
    expenses: [] as Expense[],
    loading: false,
  }),

  actions: {
    // 🔥 LOAD da backend
    async loadExpenses() {
      this.loading = true;

      try {
        const data = await getExpenses();
        this.expenses = data;
      } catch (err) {
        console.error('Errore loadExpenses:', err);
      } finally {
        this.loading = false;
      }
    },

    // 🔥 ADD via backend
    async addExpense(expense: Expense) {
      try {
        await apiAddExpense(expense);

        // ricarico tutto dal server
        await this.loadExpenses();
      } catch (err) {
        console.error('Errore addExpense:', err);
      }
    },

    // 🔥 UPDATE (per ora solo locale → poi backend)
    async updateExpense(updated: Expense) {
      try {
        await apiUpdateExpense(updated);
        await this.loadExpenses();
      } catch (err) {
        console.error('Errore updateExpense:', err);
      }
    },
  },
});
