declare namespace HomePageStore {
  type HomePageKey = 'homepage'

  type AnalyzeOption = AnalyzeVo.AnalyzeOption

  type HomePageState = {
    analyzes: AnalyzeOption[]
  }

  type HomePageGetters = {}
  type HomePageActions = {}
}
