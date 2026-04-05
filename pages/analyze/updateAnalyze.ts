import { httpRequest } from '@/composables/useHttpRequest'
import { ElMessage } from 'element-plus'
import { useAnalyzeDraft } from './useAnalyzeDraft'

/**
 * @desc 更新分析 handler
 */
export const updateAnalyzeHandler = () => {
  const analyzeStore = useAnalyzeStore()
  const { buildAnalyzeDraftPayload, serializeAnalyzeDraft } = useAnalyzeDraft()
  /**
   * @desc 点击保存
   */
  const handleUpdateAnalyze = async () => {
    if (!analyzeStore.getAnalyzeId) {
      ElMessage.error('分析ID不存在，无法保存')
      return false
    }
    const payload = buildAnalyzeDraftPayload()
    analyzeStore.setEditorSaving(true)
    const result = await httpRequest<ApiResponseI<AnalyzeVo.UpdateAnalyzeOptions>>('/api/updateAnalyze', {
      method: 'POST',
      body: payload
    }).finally(() => {
      analyzeStore.setEditorSaving(false)
    })
    if (result.code === 200 && result.data) {
      analyzeStore.setChartConfigId(result.data.chartConfigId)
      analyzeStore.setLastSavedSnapshot(serializeAnalyzeDraft())
      analyzeStore.setEditorDirty(false)
      analyzeStore.setLastSavedAt(result.data.updateTime || '')
      ElMessage.success('保存成功')
      return true
    } else {
      ElMessage.error(result.message || '保存失败')
      return false
    }
  }
  return {
    handleUpdateAnalyze,
    serializeAnalyzeDraft
  }
}
