// stores/panel.js
import { defineStore } from 'pinia';
export const usePanelStore = defineStore('panel', {
  state: () => {
    return {
      activeId: 'Materials'
    };
  },
  actions: {
    changePanel(activeId) {
      this.activeId = activeId;
    }
  }
});
