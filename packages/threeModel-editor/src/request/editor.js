import request from '@axios/index.js';
import { EDITOR } from '@api/editor.js';

export const getEditorData = async (param, hideLoad = false, type = 1) =>
  await request.get(EDITOR['/api/model3d/get_model3d_options_list'], param, hideLoad, type);
