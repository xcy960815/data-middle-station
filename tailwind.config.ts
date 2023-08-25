/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import colors from 'tailwindcss/colors';
/**
 * @desc TailwindCSS 配置文件
 */
export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      maxWidth: {},
      colors: {
        red: colors.rose,
        pink: colors.fuchsia,
        green: colors.green,
        yellow: colors.amber,
        orange: colors.orange,
        teal: colors.teal,
        cyan: colors.cyan,
        violet: colors.violet,
      },
      padding: {
        '10%': '10%',
      },
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
