<template>
  <div ref="monacoEditorDom" class="monaco-editor-dom"></div>
</template>
<script lang="ts" setup>
import * as monaco from 'monaco-editor'
import type * as MonacoNS from 'monaco-editor/esm/vs/editor/editor.api'
// 拦截 command + f 快捷键
// import "monaco-editor/esm/vs/editor/contrib/find/findController";
// sql 语法高亮
// import "monaco-editor/esm/vs/editor/contrib/hover/hover";

import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'

/* 语法联想模块 */
import { SqlSnippets } from './snippets'

const props = defineProps({
  modelValue: {
    type: String,
    default: () => ''
  },

  /* 触发字符 */
  triggerCharacters: {
    type: Array as PropType<Array<string>>,
    default: () => []
  },

  /* 自定义关键字 */
  customKeywords: {
    type: Array as PropType<Array<string>>,
    default: () => []
  },

  /* 数据库数据 */
  databaseOptions: {
    type: Array as PropType<Array<MonacoNS.DatabaseOption>>,
    default: () => []
  },

  /* 编译器的width */
  width: {
    type: [Number, String],
    default: () => '100%'
  },

  /* 编译器的高 */
  height: {
    type: [Number, String],
    default: () => '100%'
  },

  /* 编译器配置项 */
  monacoEditorOption: {
    type: Object as PropType<MonacoNS.editor.IStandaloneEditorConstructionOptions>,
    default: {}
  },

  /* 编译器主题 */
  monacoEditorTheme: {
    type: String as PropType<monaco.ThemeType>,
    default: 'vs'
  }
})

const emits = defineEmits(['update:modelValue'])

/**
 * @desc monacoEditorDom
 */
const monacoEditorDom = ref<HTMLDivElement | null>(null)

/**
 * @desc monacoEditor
 */
const monacoEditor = ref<MonacoNS.editor.IStandaloneCodeEditor | null>(null)

/**
 * @desc completionItemProvider
 */
const completionItemProvider = ref<MonacoNS.IDisposable>()

/**
 * @desc resizeObserver for percent-based sizing
 */
const resizeObserver = ref<ResizeObserver | null>(null)

/**
 * @desc 编译器的默认配置
 */
const monacoEditorDefaultOption: MonacoNS.editor.IStandaloneEditorConstructionOptions = {
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
    enabled: false
  }
}

/**
 * @desc 做组件的双向绑定
 */
watch(
  () => props.modelValue,
  (newSql: string) => {
    console.log('newSql', newSql, monacoEditor.value)

    const hasTextFocus = monacoEditor.value?.hasTextFocus()
    if (!hasTextFocus) toRaw(monacoEditor.value)?.setValue(newSql)
  }
)
/**
 * @desc 监听宽度高度
 */
watch(
  () => [props.height, props.width],
  () => {
    setMonacoEditorStyle()
  }
)

/**
 * @desc 监听 monaco-editor 主题
 */
watch(
  () => props.monacoEditorTheme,
  (monacoEditorTheme: monaco.ThemeType) => {
    monaco.editor.setTheme(monacoEditorTheme)
  }
)

/**
 * @desc 设置 编译器宽高
 */
const setMonacoEditorStyle = () => {
  const parentElement = monacoEditorDom.value?.parentElement
  if (!parentElement) return
  const parentElementBoundingClientRect = parentElement.getBoundingClientRect()
  // 获取 monacoEditorDom 节点的父节点
  const parentElementWidth = parentElementBoundingClientRect.width
  const parentElementHeight = parentElementBoundingClientRect.height

  let editorWidth: number = 0
  let editorHeight: number = 0
  // 如果是百分比 就取父节点宽高
  if (typeof props.width === 'string' && props.width.endsWith('%')) {
    editorWidth = (parentElementWidth * Number(props.width.replace('%', ''))) / 100
  } else if (typeof props.width === 'number') {
    editorWidth = props.width
  } else {
    editorWidth = parentElementWidth
  }
  if (typeof props.height === 'string' && props.height.endsWith('%')) {
    editorHeight = (parentElementHeight * Number(props.height.replace('%', ''))) / 100
  } else if (typeof props.height === 'number') {
    editorHeight = props.height
  } else {
    editorHeight = parentElementHeight
  }

  toRaw(monacoEditor.value)?.layout({
    width: editorWidth,
    height: editorHeight
  })
}

/**
 * @desc 初始化 ResizeObserver，当使用百分比宽高时监听父容器变化
 */
const initResizeObserver = () => {
  const usesPercentWidth = typeof props.width === 'string' && props.width.endsWith('%')
  const usesPercentHeight = typeof props.height === 'string' && props.height.endsWith('%')
  if (!usesPercentWidth && !usesPercentHeight) return

  const parentElement = monacoEditorDom.value?.parentElement
  if (!parentElement) return
  if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
    resizeObserver.value = new ResizeObserver(() => {
      setMonacoEditorStyle()
    })
    resizeObserver.value.observe(parentElement)
  }
}

/**
 * @desc 初始化 editor
 */
const initEditor = () => {
  console.log('initEditor')

  const sqlSnippets = new SqlSnippets(props.customKeywords, props.databaseOptions)
  completionItemProvider.value = monaco.languages.registerCompletionItemProvider('sql', {
    // 提示的触发字符
    triggerCharacters: [' ', '.', ...props.triggerCharacters],
    // 因为在js代码中 range 属性不配置也可以正常显示  所以 在这里避免代码抛错  使用了一个 别名
    provideCompletionItems: (model: MonacoNS.editor.ITextModel, position: MonacoNS.Position) =>
      sqlSnippets.provideCompletionItems(
        model,
        position
      ) as monaco.languages.ProviderResult<monaco.languages.CompletionList>
  })

  const monacoEditorOptionIsEmpty =
    Object.keys(props.monacoEditorOption).length === 0 && props.monacoEditorOption.constructor === Object
  const monacoEditorOption = monacoEditorOptionIsEmpty ? monacoEditorDefaultOption : props.monacoEditorOption
  /* 创建editor实例 */
  monacoEditor.value = monaco.editor.create(monacoEditorDom.value!, monacoEditorOption)
  /*  渲染 编译器 宽高 */
  if (props.height) setMonacoEditorStyle()

  /* 监听编译器里面的值的变化 */
  monacoEditor.value.onDidChangeModelContent(() => {
    emits('update:modelValue', toRaw(monacoEditor.value!).getValue())
  })
}

/**
 * 重置 编译器 内容
 */
const resetEditor = () => {
  toRaw(monacoEditor.value)?.setValue('')
}

onMounted(() => {
  // 解决通过dialog 弹出的组件 无法正常渲染的问题
  nextTick(() => {
    initEditor()
    initResizeObserver()
  })
})

// 离开时销毁
onBeforeUnmount(() => {
  completionItemProvider.value?.dispose()
  resizeObserver.value?.disconnect()
})

defineExpose({
  resetEditor
})
</script>
