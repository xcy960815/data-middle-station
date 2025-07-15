/**
 * @desc Monaco Editor SQL Language Definition
 */
declare module 'monaco-editor/esm/vs/basic-languages/sql/sql.js' {
  import * as monaco from 'monaco-editor'
  import { language } from 'monaco-editor/esm/vs/basic-languages/sql/sql.js'
  const language: monaco.languages.IMonarchLanguage =
    language
  export { language }
}
