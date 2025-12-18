declare namespace HomePageStore {
  type HomePageKey = 'homepage'

  type AnalyzeOption = AnalyzeVo.GetAnalyzeOptions

  type HomePageState = {
    analyzes: AnalyzeOption[]
  }

  type HomePageGetters = {}
  type HomePageActions = {}
}
