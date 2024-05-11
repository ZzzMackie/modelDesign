// stores/editor.js
import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import defaultMaterial from '@examples/originMaterial.json';
import { IndexDb } from '@packages/threeModel-core/core/IndexDb.js';
IndexDb.createStore('editorMaterialLibraryStore');
import { useSceneStore } from './scene.js';
import { useCloned } from '@vueuse/core';
import { data } from '@examples/materialCategory.json';

export const useEditorStore = defineStore('editor', {
  state: () => {
    return {
      percentage: 0,
      renderTriggerId: 'RenderSetting',
      sceneList: [],
      currentScene: '',
      selectedMaterial: 0,
      materialLibrary: [defaultMaterial],
      selectedMaterialLibrary: '',
      libraryCategory: -1,
      searchMaterialKeyword: '',
      selectMaterialLoading: false,
      sceneCategoryOptions: [],
      historyStep: 1,
      selectedMesh: '',
      editorLoading: true
    };
  },
  actions: {
    setValue(key, value) {
      this[key] = value;
    },
    setSelectedMaterial(value) {
      this.selectedMaterial = value;
    },
    setSelectedMaterialLibrary(val) {
      this.selectedMaterialLibrary = val;
    },
    setPercentage(value) {
      this.percentage = value;
    },
    setSceneName(name) {
      this.getCurrentSceneData && (this.getCurrentSceneData.name = name);
    },
    setRenderTriggerId(value) {
      this.renderTriggerId = value;
    },
    setSceneList(list) {
      this.sceneList.push(...list);
    },
    setCurrentScene(uuid) {
      this.currentScene = uuid;
    },
    setSelectedMesh(uuid) {
      this.selectedMesh = uuid;
    },
    addScene(data) {
      this.sceneList.push(data);
    },
    async addMaterialLibrary() {
      const sceneStore = useSceneStore();
      let library = {};
      const { cloned } = useCloned(sceneStore.currentMaterial);
      let material = toRaw(cloned.value);
      const libraryUUid = sceneStore.threeEngine.generateUUID();
      library.uuid = libraryUUid;
      material.materialLibraryUUid = libraryUUid;
      library.category_id = this.libraryCategory == -1 ? 0 : this.libraryCategory;
      const mapList = Object.keys(material).filter(key => material[key] && (key.endsWith('Map') || key == 'map'));
      const images = [];
      if (mapList.length) {
        for (const key of mapList) {
          let imageData = sceneStore.images.find(value => value.uuid === material[key]);
          let newImageData = { ...imageData };
          newImageData.uuid = sceneStore.threeEngine.generateUUID();
          material[key] = newImageData.uuid;
          images.push(newImageData);
        }
      }
      library.data = material;
      library.images = images;
      IndexDb['editorMaterialLibraryStore'].setItem(libraryUUid, JSON.stringify(library));
      this.setMaterialLibrary(library);
    },
    // 选择材质球
    async selectMaterialLibrary(uuid) {
      if (this.selectedMaterialLibrary === uuid || this.selectMaterialLoading) return;
      this.selectMaterialLoading = true;
      const sceneStore = useSceneStore();
      this.setSelectedMaterialLibrary(uuid);
      const { cloned } = useCloned(this.selectedMaterialLibraryData);
      const currentMaterial = sceneStore.currentMaterial;
      const materialLibrary = cloned.value;
      const { cloned: newMaterialDataCloned } = useCloned(materialLibrary.data);
      const newMaterialData = newMaterialDataCloned.value;
      const imagePr = [];
      const materialPr = [];
      // 删除旧资源图片
      for (const key of Object.keys(currentMaterial)) {
        if ((key.endsWith('Map') || key == 'map') && currentMaterial[key]) {
          sceneStore.deleteModelMaterialMap({
            [key]: currentMaterial[key]
          });
        }
      }
      if (newMaterialData.type !== currentMaterial.type) {
        await sceneStore.changeMaterialType(newMaterialData.type);
      }
      newMaterialData.uuid = currentMaterial.uuid;
      // 图片资源添加
      for (const image of materialLibrary.images) {
        sceneStore.images.push(image);
        imagePr.push(sceneStore.changeImage(image.uuid, image.url));
      }
      await Promise.allSettled(imagePr);
      for (const key of Object.keys(newMaterialData)) {
        if (key.endsWith('Map') || key == 'map') {
          materialPr.push(sceneStore.changeMaterial(key, newMaterialData[key]));
          currentMaterial[key] = newMaterialData[key];
        } else {
          switch (key) {
            case 'type':
            case 'uuid':
              break;
            case 'image':
            case 'rotation':
            case 'repeat':
              currentMaterial[key] = newMaterialData[key];
              break;

            default:
              sceneStore.changeMaterial(key, newMaterialData[key]);
              currentMaterial[key] = newMaterialData[key];
              break;
          }
        }
      }
      await Promise.allSettled(materialPr);
      // 需要等纹理加载完再设置上
      currentMaterial['rotation'] !== undefined && sceneStore.changeMaterial('rotation', newMaterialData['rotation']);
      currentMaterial['repeat'] !== undefined && sceneStore.changeMaterial('repeat', newMaterialData['repeat']);
      this.selectMaterialLoading = false;
    },
    deleteMaterialLibrary(uuid) {
      if (this.selectedMaterialLibrary === uuid) {
        this.selectedMaterialLibrary = '';
      }
      // 默认材质不给删除
      if (uuid == '01a628c3b5ef4cafbe5b54d363dd81ce') {
        return;
      }
      const index = this.materialLibrary.findIndex(library => library.uuid === uuid);
      index !== -1 && this.materialLibrary.splice(index, 1);
      IndexDb['editorMaterialLibraryStore'].removeItem(uuid);
    },
    searchMaterialLibrary(val) {
      if (val) {
        if (this.libraryCategory !== -1) {
          this.libraryCategory = -1;
        }
        this.searchMaterialKeyword = val;
      } else {
        this.searchMaterialKeyword = val;
      }
    },
    setMaterialLibrary(library) {
      library && this.materialLibrary.push(library);
    },
    addNewCategory(category_id, category_name) {
      const option = {
        category_name: category_name,
        category_id: category_id,
        data: []
      };
      this.sceneCategoryOptions.push(option);
    },
    hasSameCategoryName(category_name) {
      return this.sceneCategory.some(category => category.category_name === category_name);
    },
    hasSameCategoryId(category_id) {
      return this.sceneCategory.some(category => category.category_id === category_id);
    }
  },
  getters: {
    getCurrentSceneData() {
      return this.sceneList.find(scene => this.currentScene === scene.uuid);
    },
    selectedMaterialLibraryData() {
      return this.materialLibrary.find(library => library.uuid === this.selectedMaterialLibrary);
    },
    materialLibraryList() {
      if (this.libraryCategory === -1) {
        return this.searchMaterialKeyword
          ? this.materialLibrary.filter(library => library.data.name.includes(this.searchMaterialKeyword))
          : this.materialLibrary;
      } else {
        return this.materialLibrary.filter(library => library.category_id === this.libraryCategory);
      }
    },
    currentMaterialDes() {
      const sceneStore = useSceneStore();
      const currentMaterial = sceneStore.currentMaterial;
      let des = currentMaterial.type;
      if (currentMaterial.materialLibraryUUid) {
        const currentCategory = data.find(category => category.value === this.selectedMaterialLibraryData.category_id);
        des = currentCategory.label;
      }
      return des;
    },
    sceneCategory() {
      const sceneCategoryOptions = this.sceneCategoryOptions;
      for (const scene of this.sceneList) {
        const index = sceneCategoryOptions.findIndex(category => category?.category_id === scene.category_id);
        if (index !== -1) {
          const sceneIndex = sceneCategoryOptions[index].data.findIndex(sceneOpt => sceneOpt.uuid === scene.uuid);
          if (sceneIndex === -1) {
            sceneCategoryOptions[index].data.push(scene);
          }
        } else {
          const option = {
            category_name: scene.category_name || '默认',
            category_id: scene.category_id,
            data: [scene]
          };
          sceneCategoryOptions.push(option);
        }
      }
      return sceneCategoryOptions;
    }
  }
});
