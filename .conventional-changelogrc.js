module.exports = {
  types: [
    { type: 'feat', section: '✨ Features' },
    { type: 'fix', section: '🐛 Bug Fixes' },
    { type: 'docs', section: '📝 Documentation' },
    { type: 'style', section: '🎨 Styles' },
    { type: 'chore', section: '🔧 Chores' },
    { type: 'refactor', section: '♻️ Refactor' },
    { type: 'test', section: '✅ Tests' },
    { type: 'perf', section: '⚡ Performance' },
    { type: 'build', section: '🏗️ Build' }
  ],
  commitUrlFormat:
    'https://github.com/xcy960815/blog-home-nuxt/commit/{{hash}}',
  issueUrlFormat:
    'https://github.com/xcy960815/blog-home-nuxt/issues/{{id}}',
  template: './changelog.hbs'
}
