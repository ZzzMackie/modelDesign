import { computed, defineAsyncComponent } from 'vue';
import { useMaterialsSettingItem } from './materialsSettingItem.js';
import { useScene } from '@use/sceneStore.js';
import { useSceneStore } from '@stores/scene.js';
import { createDrawer } from '@feature/drawer/index.js';
const MaterialLibrary = defineAsyncComponent(() => import('@components/library/MaterialLibrary.vue'));
export function useMaterialsSetting() {
  const { MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial, fileImageData, modelMaterialChange } =
    useMaterialsSettingItem();
  const { UV, currentMaterial } = useScene();
  const sceneStore = useSceneStore();
  const file = computed(() => UV.value.file);
  const ai = computed(() => UV.value.ai);
  const success = ({ response, name }) => {
    // file.value = currentFile;
    if (response.data) {
      file.value.url = response.data.resource_url;
      sceneStore.setUV({
        file: {
          url: response.data.resource_url,
          name
        }
      });
    }
  };
  const aiSuccess = ({ response, name }) => {
    if (response.data) {
      ai.value.url = response.data.resource_url;
      sceneStore.setUV({
        ai: {
          url: response.data.resource_url,
          name
        }
      });
    }
  };
  // 上传失败  FIXEME
  const onError = currentFile => {
    console.log(currentFile);
  };
  const aiError = currentFile => {
    console.log(currentFile);
  };
  const MeshMaterial = computed(() => {
    let material = {};
    switch (currentMaterial.value.type) {
      case 'MeshPhysicalMaterial':
        material = MeshPhysicalMaterial.value;
        break;
      case 'MeshStandardMaterial':
        material = MeshStandardMaterial.value;
        break;
      case 'MeshBasicMaterial':
        material = MeshBasicMaterial.value;
        break;
      default:
        break;
    }
    return material;
  });
  const openMaterialLibrary = e => {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'INPUT') return;
    createDrawer({
      key: 'MaterialLibrary',
      popupContainer: '#sceneWrap',
      drawerOptions: {
        props: {
          title: '材质库',
          width: 400,
          footer: false
        }
      },
      slotVnodeFn: h => {
        return {
          content: () => h(MaterialLibrary)
        };
      }
    });
  };
  const materialImageChange = (_, currentFile) => {
    switch (currentFile.status) {
      case 'done':
        modelMaterialChange('image', currentFile.response.data.resource_url);
        break;

      default:
        break;
    }
  };
  return {
    file,
    ai,
    success,
    onError,
    aiSuccess,
    aiError,
    MeshMaterial,
    fileImageData,
    openMaterialLibrary,
    materialImageChange,
    currentMaterial
  };
}
