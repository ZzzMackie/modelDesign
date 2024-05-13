<script setup>
import { useMaterialsSetting } from '@use/materialsSetting.js';
import { defineAsyncComponent, computed } from 'vue';
const FileUpload = defineAsyncComponent(() => import('../FileUpload.vue'));
const fileImage = computed(() => {
  let url = fileImageData.value.value;
  if (url.file && url.file instanceof File) {
    url = fileImageData.value.value.url;
  }
  return url;
});
const {
  file,
  success,
  onError,
  aiSuccess,
  aiError,
  ai,
  MeshMaterial,
  fileImageData,
  openMaterialLibrary,
  materialImageChange,
  currentMaterial,
  showMaterialOptions,
  materialSelectedData,
  materialSelectedChange
} = useMaterialsSetting();
</script>

<template>
  <arco-col class="materialssetting__wrap">
    <arco-row class="materialssetting__uv">
      <arco-col>
        <arco-col class="materialssetting__header">
          <arco-row class="materialssetting__title c__font-black">UV(刀版图)</arco-row>
        </arco-col>
        <arco-col class="materialssetting__uploadcol">
          <file-upload accept=".jpg, .jpeg, .png" draggable :show-file-list="false" @success="success" @error="onError">
            <template #upload-button>
              <div
                :class="`arco-upload-list-item${file && file.status === 'error' ? ' arco-upload-list-item-error' : ''}`"
              >
                <div
                  v-if="file && file.url"
                  class="materialssetting__upload arco-upload-list-picture custom-upload-avatar"
                >
                  <img :src="file.url" />
                  <div class="arco-upload-list-picture-mask materialssetting__mask">
                    <IconEdit class="materialssetting__edit" />
                  </div>
                  <a-progress
                    v-if="file.status === 'uploading' && file.percent < 100"
                    :percent="file.percent"
                    type="circle"
                    size="mini"
                    :style="{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translateX(-50%) translateY(-50%)'
                    }"
                  />
                </div>
                <div v-else class="arco-upload-picture-card materialssetting__upload">
                  <div class="arco-upload-picture-card-text">
                    <svg-icon name="upload" size="50"></svg-icon>
                    <div style="margin-top: 10px; font-weight: 600">
                      <p>将您的图片拖到此处或者点击</p>
                      <p class="materialssetting__des">支持JPG、PNG</p>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </file-upload>
        </arco-col>
        <arco-col class="materialssetting__ai">
          <arco-col class="materialssetting__aitext c__font-black" :span="6">AI源文件：</arco-col>
          <arco-col class="materialssetting__icon" :span="18">
            <file-upload
              accept=".ai"
              :file-list="ai ? [ai] : []"
              :show-file-list="false"
              @error="aiError"
              @success="aiSuccess"
            >
              <template #upload-button>
                <div
                  :class="`arco-upload-list-item${ai && ai.status === 'error' ? ' arco-upload-list-item-error' : ''}`"
                >
                  <div v-if="ai && ai.url" class="materialssetting__aiupload">
                    {{ ai.name }}
                    <div class="arco-upload-list-picture-mask materialssetting__aimask">
                      <IconEdit />
                    </div>
                    <a-progress
                      v-if="ai.status === 'uploading' && ai.percent < 100"
                      :percent="ai.percent"
                      type="circle"
                      size="mini"
                      :style="{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translateX(-50%) translateY(-50%)'
                      }"
                    />
                  </div>
                  <svg-icon v-else name="add" size="30"></svg-icon>
                </div>
              </template>
            </file-upload>
          </arco-col>
        </arco-col>
      </arco-col>
    </arco-row>
    <arco-row class="materialssetting__materials c_scrollbar c_scrollbar__x-none">
      <arco-col>
        <arco-col class="materialssetting__header">
          <arco-row class="materialssetting__title c__font-black">材质设置</arco-row>
        </arco-col>
        <arco-col v-if="showMaterialOptions" class="materialssetting__option">
          <SettingItem :info="materialSelectedData" :label-span="7" @change="materialSelectedChange" />
        </arco-col>
        <arco-col
          v-if="MeshMaterial.length"
          class="materialssetting__uploadavatar materialssetting__uploadfile custom-upload-avatar"
          @click="openMaterialLibrary"
        >
          <arco-col class="materialssetting__file">
            <arco-col class="materialssetting__img" :span="18">
              <arco-col class="materialssetting__imgcol" :span="8">
                <file-upload
                  class="materialssetting__imgupload"
                  accept=".jpg, .jpeg, .png"
                  draggable
                  :show-file-list="false"
                  @change="materialImageChange"
                >
                  <template #upload-button>
                    <arco-avatar class="materialssetting__imgavatar" :size="80" :image-url="fileImage" shape="circle">
                    </arco-avatar>
                  </template>
                </file-upload>
              </arco-col>
              <arco-col class="materialssetting__des" :span="16">
                <arco-row>{{ fileImageData.title }}</arco-row>
                <arco-row>{{ fileImageData.des }}</arco-row>
              </arco-col>
            </arco-col>
            <arco-col class="materialssetting__fileicon" :span="6">
              <icon-right />
            </arco-col>
          </arco-col>
        </arco-col>
        <div
          v-for="item in MeshMaterial"
          :key="`${currentMaterial.uuid}_${item.key}_${['upload', 'fileImage'].includes(item.data.type) ? item.data.value : ''}`"
        >
          <!-- FIXEME -->
          <SettingItem
            v-if="item.data.type == 'upload' || item.data.type == 'fileImage'"
            :tooltip="item.tips"
            :info="item.data"
            :label-span="7"
            :class="`materialssetting__${item.key}`"
            :accept="item.accept || '.jpg, .jpeg, .png'"
            @change="item.change"
            @input-change="item.inputChange"
            @delete="item.delete"
          />
          <SettingItem
            v-else
            :tooltip="item.tips"
            :info="item.data"
            :label-span="8"
            :class="`materialssetting__${item.key}`"
            @change="item.change"
            @input-change="item.inputChange"
            @delete="item.delete"
          />
        </div>
      </arco-col>
    </arco-row>
  </arco-col>
</template>

<style lang="scss" scoped>
@import '@styles/panel/materialsSetting/index.scss';
</style>
