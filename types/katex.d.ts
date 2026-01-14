declare module 'katex/contrib/auto-render/splitAtDelimiters' {
  interface Delimiter {
    left: string
    right: string
    display: boolean
  }

  interface DelimitersOption {
    type: 'text' | 'math'
    data: string
    rawData?: string
    display?: boolean
  }

  const splitAtDelimiters: (content: string, delimiters: Delimiter[]) => DelimitersOption[]

  export default splitAtDelimiters
}
