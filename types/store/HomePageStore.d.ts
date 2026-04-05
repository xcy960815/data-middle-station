declare namespace HomePageStore {
  type HomePageKey = 'homepage'

  type AnalyzeOption = AnalyzeVo.AnalyzeListItem

  type HomePageState = {
    analyzes: AnalyzeOption[]
    total: number
    loading: boolean
  }

  type HomePageGetters = {}
  type HomePageActions = {}
}
