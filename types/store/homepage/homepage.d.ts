declare namespace HomePageStore {
  type HomePageKey = 'homepage'

  type ChartOption = ChartsVo.ChartsOptionVo

  type HomePageState = {
    charts: ChartOption[]
  }

  type HomePageGetters = {}
  type HomePageActions = {}
}
