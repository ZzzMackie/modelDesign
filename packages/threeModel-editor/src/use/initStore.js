// import { geometries, images, materials, modelMesh } from '../examples/scene.json';
import { useProjectStore } from '@stores/project.js';
import { useCameraStore } from '@stores/camera.js';
import { useSceneStore } from '@stores/scene.js';
import { useControlsStore } from '@stores/controls.js';
import { useLightStore } from '@stores/light.js';
import { useEnvironmentStore } from '@stores/environment.js';
import { useEditorStore } from '@stores/editor.js';
import { getScene } from '@request/model.js';
import { getEditorData } from '@request/editor.js';
import { IndexDb } from '@packages/threeModel-core/core/IndexDb.js';
import { PiniaUndo } from '@/piniaPlugins/pinia-undo.js';
import { useHelperStore } from '@stores/helper.js';
const editorMaterialLibraryStore = IndexDb.createStore('editorMaterialLibraryStore');
const initMaterialLibraryStore = async () => {
  const editorStore = useEditorStore();
  const keys = await editorMaterialLibraryStore.keys(() => {});
  for (const libraryStoreUUid of keys) {
    const libraryStoreItem = await editorMaterialLibraryStore.getItem(libraryStoreUUid);
    editorStore.setMaterialLibrary(JSON.parse(libraryStoreItem));
  }
};
export async function getStore(sceneId) {
  try {
    const { scene, project, light, environment, controls, camera } = await getScene({ uuid: sceneId });

    // 向URL对象添加参数
    // if (url.)
    const environmentStore = useEnvironmentStore();
    const projectStore = useProjectStore();
    const cameraStore = useCameraStore();
    const controlsStore = useControlsStore();
    const lightStore = useLightStore();
    const sceneStore = useSceneStore();
    // environmentStore.setValue(environment.data, false);
    environmentStore.setValue('background', environment.data.background);
    environmentStore.setValue('environment', environment.data.environment);
    environmentStore.setValue('uuid', environment.uuid);
    environmentStore.setValue('name', environment.name);
    environmentStore.setValue('category_id', environment.category_id);
    environment.category_name && environmentStore.setValue('category_name', environment.category_name);

    projectStore.setProject(project.data, false);
    projectStore.setValue('uuid', project.uuid);
    projectStore.setValue('name', project.name);
    projectStore.setValue('category_id', project.category_id);
    project.category_name && projectStore.setValue('category_name', project.category_name);

    cameraStore.setCamera(camera.data);
    cameraStore.setValue('uuid', camera.uuid);
    cameraStore.setValue('name', camera.name);
    cameraStore.setValue('category_id', camera.category_id);
    camera.category_name && cameraStore.setValue('category_name', camera.category_name);

    const controlsData = {
      uuid: controls.uuid,
      name: controls.name,
      category_id: controls.category_id
    };
    if (controls.category_name) {
      controlsData['category_name'] = controls.category_name;
    }
    controlsStore.setControls(controls.data);
    controlsStore.setControls(controlsData);

    lightStore.setLight(light.data.lights);
    lightStore.setValue('uuid', light.uuid);
    lightStore.setValue('name', light.name);
    lightStore.setValue('category_id', light.category_id);
    light.category_name && lightStore.setValue('category_name', light.category_name);
    // sceneStore.setScene('geometries', geometries);
    // 场景关联渲染数据
    sceneStore.setScene('images', scene.data.images);
    sceneStore.setScene('materials', scene.data.materials);
    sceneStore.setScene('modelMesh', scene.data.modelMesh);
    sceneStore.setValue('uuid', scene.uuid);
    sceneStore.setValue('name', scene.name);
    sceneStore.setValue('category_id', scene.category_id);
    sceneStore.setValue('camera', scene.data.camera);
    sceneStore.setValue('controls', scene.data.controls);
    sceneStore.setValue('environment', scene.data.environment);
    sceneStore.setValue('light', scene.data.light);
    sceneStore.setValue('project', scene.data.project);
    sceneStore.setValue('UV', scene.data.UV);
    scene.category_name && sceneStore.setValue('category_name', scene.category_name);
    document.title = `模型编辑器-${scene.name}`;
    // sceneStore.setSelected(modelMesh[0]?.children?.[0]?.uuid);
  } catch (error) {
    console.error(error);
  }
}
const installUndoRedo = () => {
  const environmentStore = useEnvironmentStore();
  const projectStore = useProjectStore();
  const cameraStore = useCameraStore();
  const controlsStore = useControlsStore();
  const lightStore = useLightStore();
  const sceneStore = useSceneStore();
  // const editorStore = useEditorStore();
  const helperStore = useHelperStore();
  PiniaUndo({ store: environmentStore });
  PiniaUndo({ store: sceneStore });
  PiniaUndo({ store: helperStore });
  PiniaUndo({
    store: lightStore,
    options: {
      undo: {
        omit: ['lightSelected']
      }
    }
  });
  PiniaUndo({ store: controlsStore });
  PiniaUndo({ store: cameraStore });
  PiniaUndo({ store: projectStore });
  // PiniaUndo({
  //   store: editorStore,
  //   options: {
  //     undo: {
  //       omit: [
  //         'editorLoading',
  //         'renderTriggerId',
  //         'percentage',
  //         'currentScene',
  //         'selectMaterialLoading',
  //         'selectedMesh'
  //       ]
  //     }
  //   }
  // });
};
export async function initStore() {
  try {
    const url = new URL(window.location.href);
    const sceneId = url.searchParams.get('scene');
    const sceneStore = useSceneStore();
    const editorStore = useEditorStore();
    getEditorData().then(({ scene: sceneList }) => {
      editorStore.setSceneList(sceneList);
      if (!editorStore.getCurrentSceneData && sceneId) {
        editorStore.addScene({
          category_id: sceneStore.category_id,
          category_name: sceneStore.category_name,
          name: sceneStore.name,
          uuid: sceneId
        });
      }
    });
    if (sceneId) {
      sceneStore.setValue('uuid', sceneId);
      editorStore.setCurrentScene(sceneId);
    }
    // 本地存储 FIXED ME
    initMaterialLibraryStore();
    await getStore(sceneId);
    installUndoRedo();
    // sceneStore.setSelected(modelMesh[0]?.children?.[0]?.uuid);
  } catch (error) {
    console.error(error);
  }
}
