<template>
  <div ref="threewrap" class="md_threerender__wrap" draggable="false" style="display: flex; width: 100%; height: 100%">
    <canvas ref="canvasDom" class="md_threerender__canvas"></canvas>
  </div>
</template>

<script>
import { ThreeEngine } from '@packages/threeModel-core/main.js';

const throttle = (func, wait = 50) => {
  // 定义falg，初试为true
  let flag = true;
  // 返回的函数是每次用户实际调用的节流函数
  return (...args) => {
    if (flag) {
      // 如果flag为true，则执行定时器
      setTimeout(() => {
        func.apply(this, args);
        flag = true;
      }, wait);
    }
    flag = false;
  };
};
export default {
  name: 'ThreeRender',
  props: {
    // 该组件的所有数据结构和字段和模型编辑器的一致
    modelList: {
      type: Object, // 数组中存放的是模型编辑器的模型数据对象
      require: true,
      default() {
        return {
          materials: [],
          images: [],
          modelMesh: []
        };
      }
    },
    lightData: {
      type: Array, // 对象是模型编辑器的的灯光数据
      default() {
        return [];
      }
    },
    cameraConfig: {
      type: Object, // 相机数据
      // {
      //     fov: 25,
      //     aspect: 1,
      //     near: 1,
      //     far: 10000,
      //     position: {
      //         x: 0,
      //         y: 0,
      //         z: 45,
      //     }
      // }
      default() {
        return {};
      }
    },
    rendererConfig: {
      type: Object, // 渲染选项参数
      default() {
        return {};
      }
    },
    environment: {
      type: Object, // 环境参数  hdr
      default() {
        return {};
      }
    },
    background: {
      type: Object, // 背景
      default() {
        return {};
      }
    },
    orbitControlsConfig: {
      type: Object, // 对象是模型编辑器的控制器数据
      require: true,
      // {
      //     maxDistance:  100
      //     maxPolarAngle : 3.14
      //     minDistance :  30
      //     minPolarAngle :  0
      // }
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      threeEngineInstance: null,
      percentage: 0
    };
  },
  mounted() {
    this.initRender();
  },
  methods: {
    // 渲染灯光
    renderLight() {
      for (const light of this.lightData) {
        this.threeEngineInstance.addLight({ lightClass: light.type, lightConfig: light });
      }
    },
    // 渲染hdr
    async renderHdr() {
      return await this.threeEngineInstance.initSceneHDR(this.environment);
    },
    // 加载多个模型
    async renderModelList() {
      await this.threeEngineInstance.loadMeshObject(this.modelList);
    },
    async initBackground() {
      return await this.threeEngineInstance.setBackground(this.background);
    },
    // 创建轨道控制器
    async createOrbitControls() {
      await this.threeEngineInstance.initOrbitControls(this.orbitControlsConfig);
    },
    async initRender() {
      this.emitRenderProgressType(10);
      // 创建3d引擎对象
      this.threeEngineInstance = new ThreeEngine({
        renderOptions: { ...this.rendererConfig, canvas: this.$refs.canvasDom },
        cameraConfig: this.cameraConfig
      });
      this.emitRenderProgressType(10);

      // 初始化场景
      this.threeEngineInstance.initApp({});
      this.emitRenderProgressType(10);

      // 创建轨道控制器
      this.createOrbitControls();
      this.emitRenderProgressType(10);

      const promiseList = [
        // 初始化背景色
        this.initBackground()
          .then(() => {
            this.emitRenderProgressType(10);
          })
          .catch(() => {
            this.emitRenderProgressType(10);
          }),
        // 渲染hdr
        this.renderHdr()
          .then(() => {
            this.emitRenderProgressType(10);
          })
          .catch(() => {
            this.emitRenderProgressType(10);
          }),
        // 渲染模型列表
        this.renderModelList()
          .then(() => {
            this.emitRenderProgressType(30);
          })
          .catch(() => {
            this.emitRenderProgressType(30);
          })
      ];
      await Promise.allSettled(promiseList);
      // 渲染灯光
      this.renderLight();
      this.emitRenderProgressType(10);
      // 监听resize，更新three视图
      this.watchWrapperResize();
    },
    // 更新贴图
    setModelMap() {
      console.log(2);
    },
    setMaterialMap() {
      console.log(1);
    },
    // 回到原点
    backToOrigin() {
      this.threeEngineInstance.resetOrbitControls();
    },
    watchWrapperResize() {
      const _this = this;
      const observer = new ResizeObserver(
        throttle(() => {
          // 渲染区域父级节点
          const threeWrap = _this.$refs.threewrap;
          let wrapWidth = threeWrap.clientWidth;
          let wrapHeight = threeWrap.clientHeight;
          // canvas渲染区域
          const canvasDom = _this.$refs.canvasDom;
          let canvasWidth = canvasDom.clientWidth;
          let canvasHeight = canvasDom.clientHeight;
          // 宽高不同，需要更新视图
          if (wrapWidth !== canvasWidth || wrapHeight !== canvasHeight) {
            _this.threeEngineInstance.resizeRendererAndCamera(wrapWidth, wrapHeight);
          }
        }, 100)
      );
      observer.observe(this.$refs.threewrap);
    },
    emitRenderProgressType(percentage) {
      this.percentage += percentage;
      if (this.percentage > 100) {
        this.percentage = 100;
      }
      // eslint-disable-next-line vue/require-explicit-emits
      this.$emit('onRenderProgress', this.percentage);
    },
    cameraThree(w = 600, h = 600) {
      return this.threeEngineInstance?.screenshot?.(w, h);
    }
  }
};
</script>

<style></style>
