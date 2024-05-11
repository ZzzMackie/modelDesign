import { useScene } from '@use/sceneStore.js';
import { useSceneStore } from '@stores/scene.js';
import { useEditorStore } from '@stores/editor.js';
export function useSceneModel() {
  const { modelMesh, selected } = useScene();
  const sceneStore = useSceneStore();
  const editorStore = useEditorStore();
  const visible = (idx, index) => {
    sceneStore.setVisible(idx, index);
  };
  const changeSelected = uuid => {
    sceneStore.setSelected(uuid);
  };
  const modelChange = (_, cFile) => {
    switch (cFile.status) {
      case 'init':
        editorStore.setPercentage(0);
        break;
      case 'uploading':
        if (editorStore.percentage < 10) {
          editorStore.setPercentage(10);
        }
        break;
      case 'done':
        editorStore.setPercentage(20);
        sceneStore.addModelMesh(cFile);
        break;
      case 'error':
        editorStore.setPercentage(100);
        sceneStore.addModelMesh(cFile);
        break;
      default:
        break;
    }
  };
  // 上传失败 FIXEME
  const modelError = file => {
    console.log(file);
  };
  const deleteGroup = idx => {
    sceneStore.deleteGroup(idx);
  };
  const deleteMesh = uuid => {
    sceneStore.deleteMesh(uuid);
  };
  const modelMeshChange = (_, cFile) => {
    switch (cFile.status) {
      case 'done':
      case 'error':
        sceneStore.changeMesh(cFile);
        break;
      default:
        break;
    }
  };
  return {
    modelMesh,
    selected,
    visible,
    changeSelected,
    modelChange,
    modelError,
    deleteGroup,
    deleteMesh,
    modelMeshChange
  };
}
