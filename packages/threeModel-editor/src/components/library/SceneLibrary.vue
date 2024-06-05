<script setup>
import { ref, h } from 'vue';
import { useModal } from '@use/useModal.js';
import AddCategory from '../AddCategory.vue';
import { useMessage } from '@use/message.js';
import { useEditor } from '@use/useEditorStore.js';
import { useEditorStore } from '@stores/editor.js';
import { appendQueryParam, openScene } from '@use/utils.js';
import { useSceneStore } from '@stores/scene.js';
const editorStore = useEditorStore();
const { sceneCategoryOptions, sceneLibrary, currentScene, sceneLibraryCategory, searchSceneKeyword } = useEditor();
const sceneStore = useSceneStore();
const searchSceneLibrary = val => {
  editorStore.searchSceneLibrary(val);
};
const sceneLibraryChange = val => {
  if (!val) editorStore.searchSceneLibrary(val);
};
const deleteSceneLibrary = uuid => {
  useModal().open({
    title: '删除模型',
    closable: true,
    okText: '确定',
    content: '确定要删除该模型吗？',
    onOk: () => {
      editorStore.deleteSceneLibrary(uuid);
    }
  });
};
const addSceneCategory = () => {
  const category_name = ref('');
  useModal().open({
    title: '新建模型分类',
    closable: true,
    okText: '保存',
    content: () =>
      h(AddCategory, {
        onChange: val => {
          category_name.value = val;
        }
      }),
    onOk: () => {
      editorStore.addNewSceneCategory(category_name.value);
    },
    onBeforeOk: () => {
      if (!category_name.value) {
        useMessage().info('分类名称不能为空！');
        return false;
      }
      if (editorStore.hasSameSceneCategoryName(category_name.value)) {
        useMessage().info('已有相同分类名称');
        return false;
      }
      return true;
    }
  });
};
const currentSceneLibrary = id => {
  if (id === -1) {
    return searchSceneKeyword.value
      ? sceneLibrary.value.filter(library => library.name.includes(searchSceneKeyword.value))
      : sceneLibrary.value;
  } else {
    return sceneLibrary.value.filter(library => library.category_id === id);
  }
};
const moveSceneCategory = (...args) => {
  editorStore.moveSceneCategory(...args);
};
const selectSceneLibrary = uuid => {
  appendQueryParam('scene', uuid);
  location.reload();
};
// eslint-disable-next-line no-unused-vars
const addLibraryToScene = _uuid => {};
const addNewScene = async () => {
  openScene({ uuid: sceneStore.threeEngine.generateUUID(), target: '_self' });
};
const changeSceneName = uuid => {
  editorStore.changeSceneLibraryName(uuid);
};
// const editSceneCategory = (...args) => {
//   console.log(args);
// };
</script>

<template>
  <arco-col class="scene_library__wrap">
    <arco-row>
      <arco-input-search
        :style="{ height: '50px' }"
        placeholder="Please enter something"
        search-button
        allow-clear
        :loading
        @search="searchSceneLibrary"
        @change="sceneLibraryChange"
      />
    </arco-row>
    <arco-row class="scene_library__tabs">
      <arco-tabs
        v-model="sceneLibraryCategory"
        type="line"
        editable
        auto-switch
        justify
        show-add-button
        animation
        @add="addSceneCategory"
      >
        <arco-tab-pane
          v-for="item of sceneCategoryOptions"
          :key="item.id"
          class="c_scrollbar c_scrollbar__x-none scene_library__tabitem"
          :closable="false"
          :title="item.name"
        >
          <arco-row class="scene_library__card" :class="{ 'scene_library__card-loading': true }">
            <template v-if="sceneLibrary.length">
              <arco-col
                v-for="scene in currentSceneLibrary(item.id)"
                :key="scene.uuid"
                class="scene_library__carditem"
                :span="7"
              >
                <arco-dropdown trigger="contextMenu" align-point :style="{ display: 'block' }">
                  <arco-card
                    :style="{ width: '165px', 'min-height': '200px' }"
                    class="scene_library__cardcontent"
                    :class="{ 'scene_library__card-active': scene.uuid === currentScene }"
                  >
                    <template #cover>
                      <div class="scene_library__cardcover">
                        <arco-spin class="scene_library__spin" :size="32" :loading="false">
                          <arco-image
                            show-loader
                            fit="contain"
                            class="scene_library__img"
                            :style="{ width: '100%', height: '163px' }"
                            :src="scene.camera_data.data.screenshot.url"
                          />
                        </arco-spin>
                      </div>
                    </template>
                    <arco-card-meta>
                      <template #title>
                        <arco-input
                          v-model="scene.name"
                          :style="{ width: '100%', background: 'transparent', padding: 0 }"
                          placeholder="Please enter something"
                          @change="changeSceneName(scene.uuid)"
                        />
                      </template>
                    </arco-card-meta>
                  </arco-card>
                  <template #content>
                    <arco-dsubmenu value="移动至">
                      <template #default>移动至</template>
                      <template #content>
                        <arco-doption
                          v-for="option of sceneCategoryOptions"
                          :key="option.name"
                          :value="option.id"
                          @click="moveSceneCategory(scene.uuid, option.id)"
                          >{{ option.name }}</arco-doption
                        >
                      </template>
                    </arco-dsubmenu>
                    <arco-doption v-if="scene.uuid !== currentScene" @click="addLibraryToScene(scene.uuid)"
                      >新增模型到当前场景</arco-doption
                    >
                    <arco-doption v-if="scene.uuid !== currentScene" @click="selectSceneLibrary(scene.uuid)"
                      >切换场景</arco-doption
                    >
                    <arco-doption v-if="scene.uuid !== currentScene" @click="deleteSceneLibrary(scene.uuid)"
                      >删除</arco-doption
                    >
                  </template>
                </arco-dropdown>
              </arco-col>
            </template>
            <arco-empty v-if="!currentSceneLibrary(item.id).length" />
          </arco-row>
        </arco-tab-pane>
      </arco-tabs>
    </arco-row>

    <arco-row class="scene_library__addscene">
      <arco-button type="primary" shape="round" size="large" @click="addNewScene">新建模型</arco-button>
    </arco-row>
  </arco-col>
</template>

<style lang="scss">
@import '@styles/library/sceneLibrary/index.scss';
</style>
