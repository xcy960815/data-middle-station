declare namespace HomePageStore {
  type HomePageKey = 'homepage'

  type ChartOption = ChartVo.ChartOption

  type HomePageState = {
    charts: ChartOption[]
  }

  type HomePageGetters = {}
  type HomePageActions = {}
}
