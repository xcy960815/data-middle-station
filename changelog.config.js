const compareFunc = require('compare-func')

// 提交类型映射表
const TYPE_MAP = {
  feat: '✨ Features',
  fix: '🐛 Bug Fixes',
  perf: '⚡ Performance Improvements',
  revert: '⏪ Reverts',
  docs: '📝 Documentation',
  style: '💄 Styles',
  refactor: '♻ Code Refactoring',
  test: '✅ Tests',
  build: '👷 Build System',
  ci: '🔧 Continuous Integration',
  chore: '🔧 Chores'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toISOString().split('T')[0]
}

// 格式化提交信息
const formatCommit = (commit) => {
  const newCommit = { ...commit }
  let discard = true

  // 处理 breaking changes
  if (newCommit.notes?.length) {
    newCommit.notes.forEach((note) => {
      note.title = '⚠ BREAKING CHANGES'
      discard = false
    })
  }

  // 转换提交类型
  if (TYPE_MAP[newCommit.type]) {
    newCommit.type = TYPE_MAP[newCommit.type]
  }

  // 处理 scope
  if (newCommit.scope === '*') {
    newCommit.scope = ''
  }

  // 处理 hash
  if (typeof newCommit.hash === 'string') {
    newCommit.shortHash = newCommit.hash.substring(0, 7)
  }

  // 添加作者、日期和类型信息
  const author = newCommit.authorName ? ` - by ${newCommit.authorName}` : ''
  const date = newCommit.committerDate ? ` (${formatDate(newCommit.committerDate)})` : ''
  const type = newCommit.type ? ` [${newCommit.type}]` : ''

  if (typeof newCommit.subject === 'string') {
    newCommit.subject = `${newCommit.subject}${type}${author}${date}`
  }

  // 处理引用
  if (newCommit.references?.length) {
    const issues = new Set()
    newCommit.references = newCommit.references.filter((reference) => {
      if (issues.has(reference.issue)) {
        return false
      }
      issues.add(reference.issue)
      return true
    })
  }

  return newCommit
}

module.exports = {
  writerOpts: {
    transform: formatCommit,
    groupBy: 'type',
    commitGroupsSort: 'title',
    commitsSort: ['scope', 'subject'],
    noteGroupsSort: 'title',
    headerPartial: '## {{version}} ({{date}})\n\n',
    mainTemplate:
      '{{> header}}\n\n{{#each commitGroups}}\n\n### {{title}}\n\n{{#each commits}}\n* {{subject}} ([{{shortHash}}]({{../host}}/{{../owner}}/{{../repository}}/commit/{{hash}}))\n{{/each}}\n{{/each}}\n\n{{#if noteGroups}}\n{{#each noteGroups}}\n\n### {{title}}\n\n{{#each notes}}\n* {{text}}\n{{/each}}\n{{/each}}\n{{/if}}'
  }
}
