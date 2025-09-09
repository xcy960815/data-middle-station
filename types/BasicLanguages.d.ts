/**
 * Monaco SQL language declaration to give types for keywords/operators/builtinFunctions
 */
declare module 'monaco-editor/esm/vs/basic-languages/sql/sql.js' {
  // Minimal Monarch tokenizer typings to strongly type tokenizer/stateNames
  export type MonarchPattern = RegExp | string | Record<string, never>
  export type MonarchAction =
    | string
    | {
        token?: string
        next?: string
        nextEmbedded?: string
        switchTo?: string
        goBack?: number
        bracket?: string
        cases?: Record<string, string | MonarchAction>
      }
  export type MonarchIncludeRule = { include: string }
  export type MonarchRegexRule = [MonarchPattern, MonarchAction]
  export type MonarchRule = MonarchIncludeRule | MonarchRegexRule
  export type MonarchState = MonarchRule[]

  export interface MonarchTokenizer {
    readonly root: MonarchState
    readonly whitespace: MonarchState
    readonly comments: MonarchState
    readonly comment: MonarchState
    readonly pseudoColumns: MonarchState
    readonly numbers: MonarchState
    readonly strings: MonarchState
    readonly string: MonarchState
    readonly complexIdentifiers: MonarchState
    readonly bracketedIdentifier: MonarchState
    readonly quotedIdentifier: MonarchState
    readonly scopes: MonarchState
  }

  export interface MonarchStateNames {
    readonly root?: MonarchState
    readonly whitespace?: MonarchState
    readonly comments?: MonarchState
    readonly comment?: MonarchState
    readonly pseudoColumns?: MonarchState
    readonly numbers?: MonarchState
    readonly strings?: MonarchState
    readonly string?: MonarchState
    readonly complexIdentifiers?: MonarchState
    readonly bracketedIdentifier?: MonarchState
    readonly quotedIdentifier?: MonarchState
    readonly scopes?: MonarchState
  }

  // Bracket pair definitions used by Monaco basic-languages
  export type MonarchBracketToken =
    | 'delimiter.parenthesis'
    | 'delimiter.square'
    | 'delimiter.curly'
    | 'delimiter.angle'
    | 'delimiter.bracket'
    | 'delimiter'
    | `delimiter.${string}`
    | string
  export interface MonarchBracket {
    open: string
    close: string
    token: MonarchBracketToken
  }

  export interface SqlLanguageDefinition {
    readonly usesEmbedded: boolean
    readonly unicode: boolean
    readonly tokenPostfix: string
    readonly noThrow: boolean
    readonly languageId: string
    readonly includeLF: boolean
    readonly ignoreCase: boolean
    readonly defaultToken: string
    readonly builtinFunctions: readonly string[]
    readonly builtinVariables: readonly string[]
    readonly keywords: readonly string[]
    readonly operators: readonly string[]
    readonly pseudoColumns: readonly string[]
    readonly brackets: readonly MonarchBracket[]
    readonly tokenizer: MonarchTokenizer
    readonly stateNames: MonarchStateNames
  }

  export const language: SqlLanguageDefinition
}
