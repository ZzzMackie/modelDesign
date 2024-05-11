<script setup>
import { ref } from 'vue';
import { useMessage } from '@use/message.js';
const message = useMessage();
const emit = defineEmits(['change']);
const change = (_, currentFile) => {
  message.clear();
  switch (currentFile.status) {
    case 'init':
      message.info('开始上传文件');
      break;
    case 'uploading':
      message.info('文件上传中...');
      break;
    case 'done':
      message.info('文件上传成功');
      break;
    case 'error':
      message.error('s3文件上传失败, 返回本地资源');
      break;
    default:
      break;
  }
  if (!currentFile.url) {
    currentFile.url = URL.createObjectURL(currentFile.file);
  }
  emit('change', _, currentFile, URL.createObjectURL(currentFile.file));
};
const requestData = ref(null);
const action = ref(`${import.meta.env.VITE_APP_AXIOS_ADMIN_URL}/api/common/upload/upload-file`);
const beforeUpload = file => {
  const fileName = file.name.split('.');
  const fileType = fileName[fileName.length - 1];
  const metadata = {
    fileType
  };
  requestData.value = {
    upload_bucket: 1,
    customer_dir: 'image/modelV2',
    prefix: 'printblock',
    backup_type: 'oss',
    source: '后台上传-新模型编辑器',
    refresh: 1,
    metadata: JSON.stringify(metadata)
  };
  return true;
};
</script>

<template>
  <arco-upload :action="action" :data="requestData" :on-before-upload="beforeUpload" @change="change" v-on="$attrs">
    <template #upload-button>
      <slot name="upload-button"></slot>
    </template>
    <template #upload-item>
      <slot name="upload-item"></slot>
    </template>
    <template #image>
      <slot name="image"></slot>
    </template>
    <template #extra-button>
      <slot name="extra-button"></slot>
    </template>
  </arco-upload>
</template>
