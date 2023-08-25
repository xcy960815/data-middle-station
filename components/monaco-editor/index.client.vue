<template>
  <ClientOnly>
    <div ref="monacoEditorDom" class="monaco-editor-dom"></div>
  </ClientOnly>
</template>
<script lang="ts" setup>
import * as monaco from 'monaco-editor';
// 拦截 command + f 快捷键
// import "monaco-editor/esm/vs/editor/contrib/find/findController";
// sql 语法高亮
// import "monaco-editor/esm/vs/editor/contrib/hover/hover";

import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';

// 语法联想模块
import { SqlSnippets } from './snippets';

const props = defineProps({
  modelValue: {
    type: String,
    default: () => '',
  },

  // 触发字符
  triggerCharacters: {
    type: Array as PropType<Array<string>>,
    default: () => [],
  },

  // 自定义关键字
  customKeywords: {
    type: Array as PropType<Array<string>>,
    default: () => [],
  },

  // 数据库数据
  databaseOptions: {
    type: Array as PropType<Array<monaco.DatabaseOption>>,
    default: () => [],
  },

  // 编译器的width
  width: {
    type: Number,
    default: () => 0,
  },

  // 编译器的高
  height: {
    type: Number,
    default: () => 100,
  },

  // 编译器配置项
  monacoEditorOption: {
    type: Object as PropType<monaco.editor.IStandaloneEditorConstructionOptions>,
    default: {},
  },

  // 编译器主题
  monacoEditorTheme: {
    type: String as PropType<monaco.ThemeType>,
    default: 'vs',
  },
});

const emits = defineEmits(['update:modelValue']);

const monacoEditorDom = ref<HTMLDivElement>();

// monacoEditor 实例
const monacoEditor = ref<monaco.editor.IStandaloneCodeEditor | null>(null);

const completionItemProvider = ref<monaco.IDisposable>();

// 编译器的默认配置
const monacoEditorDefaultOption: monaco.editor.IStandaloneEditorConstructionOptions = {
  acceptSuggestionOnCommitCharacter: false,
  suggestSelection: 'first',
  fontFamily: 'MONACO',
  lineHeight: 30,
  value: props.modelValue,
  language: 'sql',
  theme: 'vs-dark',
  selectOnLineNumbers: true,
  contextmenu: false, //关闭右键
  suggestOnTriggerCharacters: true,
  fontSize: 14,
  folding: false, // 是否折叠
  // 是否启用小地图
  minimap: {
    enabled: false,
  },
};

// 做组件的双向绑定
watch(
  () => props.modelValue,
  (newSql: string) => {
    const hasTextFocus = monacoEditor.value?.hasTextFocus();
    if (!hasTextFocus) toRaw(monacoEditor.value)?.setValue(newSql);
  },
);
// 监听宽度高度
watch(
  () => [props.height, props.width],
  () => {
    setMonacoEditorStyle();
  },
);

// 监听 monaco-editor 主题
watch(
  () => props.monacoEditorTheme,
  (monacoEditorTheme: monaco.ThemeType) => {
    monaco.editor.setTheme(monacoEditorTheme);
  },
);

// 设置 编译器宽高
const setMonacoEditorStyle = () => {
  // 获取 monacoEditorDom 节点的父节点
  const parentElementWidth = window.getComputedStyle(
    (monacoEditorDom.value as HTMLDivElement).parentElement!,
  ).width;
  const parentElementWidthNumber = Number(
    parentElementWidth.substring(0, parentElementWidth.length - 2),
  );
  toRaw(monacoEditor.value)?.layout({
    width: props.width ? props.width : parentElementWidthNumber,
    height: props.height,
  });
};

// 初始化 editor
const initEditor = () => {
  const sqlSnippets = new SqlSnippets(props.customKeywords, props.databaseOptions);

  completionItemProvider.value = monaco.languages.registerCompletionItemProvider('sql', {
    // 提示的触发字符
    triggerCharacters: [' ', '.', ...props.triggerCharacters],
    // 因为在js代码中 range 属性不配置也可以正常显示  所以 在这里避免代码抛错  使用了一个 别名
    provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.Position) =>
      sqlSnippets.provideCompletionItems(
        model,
        position,
      ) as monaco.languages.ProviderResult<monaco.languages.CompletionList>,
  });
  const monacoEditorOption =
    JSON.stringify(props.monacoEditorOption) === '{}'
      ? monacoEditorDefaultOption
      : props.monacoEditorOption;
  // 创建editor实例
  monacoEditor.value = monaco.editor.create(monacoEditorDom.value!, monacoEditorOption);
  // 渲染 编译器 宽高
  if (props.height) setMonacoEditorStyle();

  // 监听编译器里面的值的变化
  monacoEditor.value.onDidChangeModelContent(() => {
    emits('update:modelValue', toRaw(monacoEditor.value!).getValue());
  });
};

// 重置 编译器 内容
const resetEditor = () => {
  toRaw(monacoEditor.value)?.setValue('');
};

onMounted(() => {
  // 解决通过dialog 弹出的组件 无法正常渲染的问题
  nextTick(() => {
    initEditor();
  });
});

// 离开时销毁
onBeforeUnmount(() => {
  completionItemProvider.value?.dispose();
});

defineExpose({
  resetEditor,
});
</script>
