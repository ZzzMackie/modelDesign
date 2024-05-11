<!-- eslint-disable vue/valid-define-props -->
<script setup>
import { ref, defineEmits, defineProps } from 'vue';
const emit = defineEmits(['handleOk', 'handleCancel']);
const props = defineProps({
  mask: {
    type: Boolean,
    default: true
  },
  drawerVm: {
    type: Object,
    default: () => {}
  },
  defaultVisible: {
    type: Boolean,
    default: false
  },
  placement: {
    type: String,
    default: 'right'
  },
  title: {
    type: [String, Object],
    default: ''
  },
  maskClosable: {
    type: Boolean,
    default: true
  },
  closable: {
    type: Boolean,
    default: true
  },
  okText: {
    type: String,
    default: ''
  },
  cancelText: {
    type: String,
    default: ''
  },
  okLoading: {
    type: Boolean,
    default: false
  },
  okButtonProps: {
    type: Object,
    default: () => {}
  },
  cancelButtonProps: {
    type: Object,
    default: () => {}
  },
  unmountOnClose: Boolean,
  width: {
    type: [Number, String],
    default: 250
  },
  height: {
    type: [Number, String],
    default: 250
  },
  drawerStyle: {
    type: Object,
    default: () => {}
  },
  onBeforeOk: {
    type: Function,
    default: () => {
      return true;
    }
  },
  onBeforeCancel: {
    type: Function,
    default: () => {
      return true;
    }
  },
  escToClose: {
    type: Boolean,
    default: true
  },
  renderToBody: {
    type: Boolean,
    default: true
  },
  header: {
    type: Boolean,
    default: true
  },
  footer: {
    type: Boolean,
    default: true
  },
  hideCancel: {
    type: Boolean,
    default: false
  }
});
const visible = ref(true);
const close = () => {
  setTimeout(() => {
    props.drawerVm.close();
  }, 700);
};
const handleOk = (...args) => {
  visible.value = false;
  emit('handleOk', ...args);
  close();
};
const handleCancel = (...args) => {
  visible.value = false;
  emit('handleCancel', ...args);
  close();
};
</script>

<template>
  <div id="vc_drawer" class="vc_drawer__wrap">
    <arco-drawer
      :width
      :height
      :mask
      :placement
      :closable
      :ok-text
      :cancel-text
      :ok-loading
      :drawer-style
      :cancel-button-props
      :ok-button-props
      :mask-closable
      :visible
      :title
      :footer
      :header
      :hide-cancel
      :esc-to-close
      :on-before-cancel
      :on-before-ok
      unmount-on-close
      popup-container="#vc_drawer"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <template #title> <slot name="title"></slot> </template>
      <slot name="content"></slot>
    </arco-drawer>
  </div>
</template>

<style lang="scss" scoped>
@import '@styles/vcDrawer.scss';
</style>
