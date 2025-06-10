declare namespace HomePageStore {
  type HomePageKey = 'homepage'

  type AnalyseOption = AnalyseVo.AnalyseOption

  type HomePageState = {
    analyses: AnalyseOption[]
  }

  type HomePageGetters = {}
  type HomePageActions = {}
}
