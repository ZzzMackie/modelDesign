// stores/editor.js
import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import defaultMaterial from '@examples/originMaterial.json';
import { IndexDb } from '@packages/threeModel-core/core/IndexDb.js';
IndexDb.createStore('editorMaterialLibraryStore');
IndexDb.createStore('editorHDRLibraryStore');
import { useSceneStore } from './scene.js';
import { useEnvironmentStore } from './environment.js';
import { useCloned } from '@vueuse/core';
import { useMessage } from '@use/message.js';
import { upload } from '@use/upload.js';
import { data } from '@examples/materialCategory.json';
import { scene } from '@examples/sceneCategory.json';
import { hdr } from '@examples/HdrCategory.json';
const message = (str, type = 'info') => {
  const message = useMessage();
  message[type]({
    id: 'addMaterialLibrary',
    content: str,
    duration: 3000
  });
};
export const useEditorStore = defineStore('editor', {
  state: () => {
    return {
      percentage: 0,
      renderTriggerId: 'RenderSetting',
      historyStep: 1,
      selectedMesh: '',
      editorLoading: true,
      currentScene: '',

      selectedMaterial: 0,
      materialLibrary: [defaultMaterial],
      selectedMaterialLibrary: '',
      materialLibraryCategory: -1,
      searchMaterialKeyword: '',
      selectMaterialLoading: false,
      materialCategory: [...data],

      hdrCategory: [...hdr],
      hdrLibrary: [],
      selectedHdrLibrary: '',
      hdrLibraryCategory: -1,
      searchHdrKeyword: '',
      selectHdrLoading: false,

      sceneList: [],
      sceneLibrary: [],
      sceneCategoryOptions: [...scene],
      searchSceneKeyword: '',
      sceneLibraryCategory: -1
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
      if (this.getCurrentSceneData) {
        const sceneLibrary = this.sceneLibrary.find(library => library.uuid === this.getCurrentSceneData.uuid);
        this.getCurrentSceneData.name = name;
        sceneLibrary && (sceneLibrary.name = name);
      }
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
      library.category_id = this.materialLibraryCategory == -1 ? 0 : this.materialLibraryCategory;
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
      for (const image of images) {
        if (image.url.file && image.url.file instanceof File) {
          message(`有本地资源未上传, 开始上传资源`);
          const { resource_url } = await upload(image.url.file);
          if (resource_url) {
            image.url = resource_url;
            message(`上传文件成功; ${resource_url}`, 'success');
          } else {
            message(`上传文件失败，保存模型失败;`, 'error');
          }
        }
      }
      library.data = material;
      library.images = images;
      library.name = material.name;
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
            case 'mapRotation':
            case 'mapRepeat':
            case 'aoMapRotation':
            case 'aoMapRepeat':
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
      for (const key of sceneStore.threeEngine.material__three.rotationRepeatKey) {
        currentMaterial[key] !== undefined && sceneStore.changeMaterial(key, newMaterialData[key]);
      }
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
    moveMaterialLibrary(uuid, id) {
      const library = this.materialLibrary.find(library => library.uuid === uuid);
      library.category_id = id;
      IndexDb['editorMaterialLibraryStore'].setItem(uuid, JSON.stringify(library));
    },
    changeMaterialLibrary(uuid) {
      const library = this.materialLibrary.find(library => library.uuid === uuid);
      IndexDb['editorMaterialLibraryStore'].setItem(uuid, JSON.stringify(library));
    },
    searchMaterialLibrary(val) {
      if (val) {
        if (this.materialLibraryCategory !== -1) {
          this.materialLibraryCategory = -1;
        }
        this.searchMaterialKeyword = val;
      } else {
        this.searchMaterialKeyword = val;
      }
    },
    setMaterialLibrary(library) {
      library && this.materialLibrary.push(library);
    },
    async addNewMaterialCategory(name) {
      console.log(name);
      // const result = await setMaterialCategory({ name });
      // if (result) {
      //   this.materialCategory.push({
      //     id: result.id,
      //     name
      //   });
      // }
    },
    hasSameMaterialCategoryName(category_name) {
      return this.materialCategory.some(category => category.name === category_name);
    },
    async changeMaterialLibraryTexture({ uuid, url }) {
      this.selectMaterialLoading = true;
      const library = this.materialLibrary.find(library => library.uuid === uuid);
      if (library) {
        library.data.image = url;
        let material = toRaw(library);
        IndexDb['editorMaterialLibraryStore'].setItem(uuid, JSON.stringify(material));
      }
      this.selectMaterialLoading = false;
    },
    async addHdrLibrary() {
      const environmentStore = useEnvironmentStore();
      const sceneStore = useSceneStore();
      const { cloned } = useCloned(environmentStore.environment);
      let hdr = toRaw(cloned.value);
      let library = {};
      const libraryUUid = sceneStore.threeEngine.generateUUID();
      library.uuid = libraryUUid;
      library.category_id = this.hdrLibraryCategory == -1 ? 0 : this.hdrLibraryCategory;
      library.name = environmentStore.name;
      library.images = [];
      if (environmentStore.environment?.path?.file) {
        message(`有本地hdr资源未上传, 开始上传资源`);
        const { resource_url } = await upload(environmentStore.environment?.path?.file);
        if (resource_url) {
          message(`上传hdr文件成功; ${resource_url}`, 'success');
          hdr.path = resource_url;
        } else {
          message(`上传hdr文件失败，保存失败`, 'error');
        }
      }
      library.data = hdr;
      library.data.texture = sceneStore.threeEngine.generateUUID();
      this.hdrLibrary.push(library);
      IndexDb['editorHDRLibraryStore'].setItem(libraryUUid, JSON.stringify(library));
      console.log(library);
      console.log('addHdrLibrary');
    },
    async selectHdrLibrary(uuid) {
      if (this.selectedHdrLibrary === uuid || this.selectHdrLoading) return;
      this.selectHdrLoading = true;
      this.selectedHdrLibrary = uuid;
      const { cloned } = useCloned(this.selectedHdrLibraryData);
      const hdrLibrary = cloned.value;
      const environmentStore = useEnvironmentStore();

      environmentStore.setValue('name', hdrLibrary.name);
      environmentStore.setValue('category_id', hdrLibrary.category_id);
      const sceneStore = useSceneStore();
      await sceneStore.threeEngine.addImageData(hdrLibrary.data.texture, hdrLibrary.data.path);
      await environmentStore.setEnvironment(hdrLibrary.data, true);
      this.selectHdrLoading = false;
    },
    deleteHdrLibrary(uuid) {
      if (this.selectedHdrLibrary === uuid) {
        this.selectedHdrLibrary = '';
      }
      const index = this.hdrLibrary.findIndex(library => library.uuid === uuid);
      index !== -1 && this.hdrLibrary.splice(index, 1);
      IndexDb['editorHDRLibraryStore'].removeItem(uuid);
    },
    searchHdrLibrary(val) {
      if (val) {
        if (this.hdrLibraryCategory !== -1) {
          this.hdrLibraryCategory = -1;
        }
        this.searchHdrKeyword = val;
      } else {
        this.searchHdrKeyword = val;
      }
    },
    changeHdrLibrary(uuid) {
      const library = this.hdrLibrary.find(library => library.uuid === uuid);
      IndexDb['editorHDRLibraryStore'].setItem(uuid, JSON.stringify(library));
    },
    moveHdrLibrary(uuid, id) {
      const library = this.hdrLibrary.find(library => library.uuid === uuid);
      library.category_id = id;
      IndexDb['editorHDRLibraryStore'].setItem(uuid, JSON.stringify(library));
    },
    async addNewHdrCategory(name) {
      console.log(name);
      // const result = await setHdrCategory({ name });
      // if (result) {
      //   this.hdrCategory.push({
      //     id: result.id,
      //     name,
      //     data: []
      //   });
      // }
    },
    hasSameHdrCategoryName(category_name) {
      return this.hdrCategory.some(category => category.name === category_name);
    },
    async changeHdrLibraryTexture({ uuid, url }) {
      this.selectHdrLoading = true;
      const library = this.hdrLibrary.find(library => library.uuid === uuid);
      if (library) {
        library.data.path = url;
        let material = toRaw(library);
        IndexDb['editorHDRLibraryStore'].setItem(uuid, JSON.stringify(material));
      }
      this.selectHdrLoading = false;
    },
    async addNewSceneCategory(name) {
      console.log(name);
      // const result = await setSceneCategory({ name });
      // if (result) {
      //   this.sceneCategoryOptions.push({
      //     id: result.id,
      //     name,
      //     data: []
      //   });
      // }
    },
    hasSameSceneCategoryName(category_name) {
      return this.sceneCategoryOptions.some(category => category.name === category_name);
    },
    async moveSceneCategory(uuid, id) {
      const library = this.sceneList.find(library => library.uuid === uuid);
      const sceneLibrary = this.sceneLibrary.find(library => library.uuid === uuid);

      if (library) {
        for (const category of this.sceneCategoryOptions) {
          const index = category.data.findIndex(scene => scene?.uuid === uuid);
          if (index !== -1) {
            category.data.splice(index, 1);
          }
        }
        sceneLibrary.category_id = id;
        library.category_id = id;
        // IndexDb['editorHDRLibraryStore'].setItem(uuid, JSON.stringify(library));
        // await setScene({
        //   uuid: uuid,
        //   category_id: id
        // });
      }
    },
    deleteSceneLibrary(uuid) {
      const index = this.sceneLibrary.findIndex(scene => scene?.uuid === uuid);
      const idx = this.sceneList.findIndex(scene => scene?.uuid === uuid);
      if (index !== -1) {
        this.sceneLibrary.splice(index, 1);
      }
      if (idx !== -1) {
        this.sceneList.splice(index, 1);
      }
      // deleteScene({
      //   uuid
      // });
    },
    changeSceneLibraryName(uuid) {
      const library = this.sceneLibrary.find(library => library.uuid === uuid);
      if (uuid === this.currentScene) {
        this.getCurrentSceneData.name = library.name;
        useSceneStore().setValue('name', library.name);
      }
      // setScene({
      //   name: library.name,
      //   uuid
      // });
    },
    searchSceneLibrary(val) {
      if (val) {
        if (this.sceneLibraryCategory !== -1) {
          this.sceneLibraryCategory = -1;
        }
        this.searchSceneKeyword = val;
      } else {
        this.searchSceneKeyword = val;
      }
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
      if (this.materialLibraryCategory === -1) {
        return this.searchMaterialKeyword
          ? this.materialLibrary.filter(library => library.data.name.includes(this.searchMaterialKeyword))
          : this.materialLibrary;
      } else {
        return this.materialLibrary.filter(library => library.category_id === this.materialLibraryCategory);
      }
    },
    hdrLibraryList() {
      if (this.hdrLibraryCategory === -1) {
        return this.searchHdrKeyword
          ? this.hdrLibrary.filter(library => library.name.includes(this.searchHdrKeyword))
          : this.hdrLibrary;
      } else {
        return this.hdrLibrary.filter(library => library.category_id === this.hdrLibraryCategory);
      }
    },
    selectedHdrLibraryData() {
      return this.hdrLibrary.find(library => library.uuid === this.selectedHdrLibrary);
    },
    currentMaterialDes() {
      const sceneStore = useSceneStore();
      const currentMaterial = sceneStore.currentMaterial;
      let des = currentMaterial.type;
      if (currentMaterial.materialLibraryUUid) {
        const currentCategory = this.materialCategory.find(
          category => category.id === this.selectedMaterialLibraryData?.category_id
        );
        currentCategory && (des = currentCategory.name);
      }
      return des;
    },
    sceneCategory() {
      const sceneCategoryOptions = this.sceneCategoryOptions;
      for (const scene of this.sceneList) {
        const allIdx = sceneCategoryOptions.findIndex(category => category?.id === -1);
        if (allIdx != -1) {
          const hasSame = sceneCategoryOptions?.[allIdx]?.data.some(sceneCategory => sceneCategory.uuid === scene.uuid);
          !hasSame && sceneCategoryOptions?.[allIdx]?.data?.push?.(scene);
        }
        const index = sceneCategoryOptions.findIndex(category => category?.id === scene.category_id);
        if (index !== -1) {
          const sceneIndex = sceneCategoryOptions[index].data.findIndex(sceneOpt => sceneOpt.uuid === scene.uuid);
          if (sceneIndex === -1) {
            sceneCategoryOptions[index].data.push(scene);
          }
        } else {
          const option = {
            name: scene.category_name || '默认',
            id: scene.category_id,
            data: [scene]
          };
          sceneCategoryOptions.push(option);
        }
      }
      return sceneCategoryOptions;
    }
  }
});
