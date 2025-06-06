declare namespace HomePageStore {
  type HomePageKey = 'homepage'

  type AnalyseOption = AnalyseVo.AnalyseOption

  type HomePageState = {
    charts: AnalyseOption[]
  }

  type HomePageGetters = {}
  type HomePageActions = {}
}
