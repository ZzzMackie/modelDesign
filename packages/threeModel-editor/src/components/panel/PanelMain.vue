<script setup>
import { computed, defineAsyncComponent } from 'vue';
import { usePanelStore } from '@stores/panel.js';
import MaterialsSetting from './MaterialsSetting.vue';
const BackgroundSetting = defineAsyncComponent(() => import('./BackgroundSetting.vue'));
const CameraSetting = defineAsyncComponent(() => import('./CameraSetting.vue'));
const LightSetting = defineAsyncComponent(() => import('./LightSetting.vue'));
const tabs = {
  MaterialsSetting,
  LightSetting,
  CameraSetting,
  BackgroundSetting
};
const panel = usePanelStore();
const componentId = computed(() => {
  return `${panel.activeId}Setting`;
});
</script>

<template>
  <div class="panelmain__wrap">
    <keep-alive>
      <component :is="tabs[componentId]"></component>
    </keep-alive>
  </div>
</template>

<style lang="scss">
@import '@styles/panel/index.scss';
</style>
