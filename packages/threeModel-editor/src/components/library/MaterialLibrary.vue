<script setup>
import { ref, computed } from 'vue';
import { data } from '@examples/materialCategory.json';
import { useEditor } from '@use/useEditorStore.js';
import { useEditorStore } from '@stores/editor.js';
const { materialLibraryList, libraryCategory, selectedMaterialLibrary, selectMaterialLoading } = useEditor();
const editorStore = useEditorStore();
const addMaterial = () => {
  editorStore.addMaterialLibrary();
};
const selectMaterialLibrary = uuid => {
  editorStore.selectMaterialLibrary(uuid);
};
const deleteMaterialLibrary = uuid => {
  editorStore.deleteMaterialLibrary(uuid);
};
const searchMaterialLibrary = val => {
  editorStore.searchMaterialLibrary(val);
};
const materialLibraryChange = val => {
  if (!val) editorStore.searchMaterialLibrary(val);
};
const options = computed(() => data);
const loading = ref(false);
</script>

<template>
  <arco-col class="material_library__wrap">
    <arco-row>
      <arco-input-search
        :style="{ height: '50px' }"
        placeholder="Please enter something"
        search-button
        :loading
        @search="searchMaterialLibrary"
        @change="materialLibraryChange"
      />
    </arco-row>
    <arco-row class="material_library__category">
      <arco-select v-model="libraryCategory" :style="{ height: '50px' }" placeholder="Please select ..." allow-search>
        <a-option v-for="option of options" :key="option.label" :value="option.value">{{ option.label }}</a-option>
      </arco-select>
    </arco-row>
    <arco-row class="material_library__card" :class="{ 'material_library__card-loading': selectMaterialLoading }">
      <template v-if="materialLibraryList.length">
        <arco-col
          v-for="material in materialLibraryList"
          :key="material.uuid"
          class="material_library__carditem"
          span="5"
          @click="selectMaterialLibrary(material.uuid)"
        >
          <arco-dropdown trigger="contextMenu" align-point :style="{ display: 'block' }">
            <arco-card
              :style="{ width: '80px' }"
              class="material_library__cardcontent"
              :class="{ 'material_library__card-active': selectedMaterialLibrary === material.uuid }"
            >
              <template #cover>
                <div class="material_library__cardcover">
                  <arco-spin
                    class="material_library__spin"
                    :size="32"
                    :loading="selectedMaterialLibrary === material.uuid && selectMaterialLoading"
                  >
                    <img :style="{ width: '100%' }" :src="material.data.image" />
                  </arco-spin>
                </div>
              </template>
              <arco-card-meta>
                <template #title>
                  <arco-input
                    v-model="material.data.name"
                    :disabled="material.uuid === '01a628c3b5ef4cafbe5b54d363dd81ce'"
                    :style="{ width: '100%', background: 'transparent', padding: 0 }"
                    placeholder="Please enter something"
                  />
                </template>
              </arco-card-meta>
            </arco-card>
            <template #content>
              <arco-doption @click="selectMaterialLibrary(material.uuid)">应用</arco-doption>
              <arco-doption @click="deleteMaterialLibrary(material.uuid)">删除</arco-doption>
            </template>
          </arco-dropdown>
        </arco-col>
      </template>
      <arco-col class="material_library__carditem">
        <div class="material_library__addmaterial" @click="addMaterial">
          <svg-icon name="addMaterial" size="40"></svg-icon>
        </div>
      </arco-col>
      <arco-empty v-if="!materialLibraryList.length" />
    </arco-row>
  </arco-col>
</template>
<style lang="scss">
@import '@styles/library/materialLibrary/index.scss';
</style>
