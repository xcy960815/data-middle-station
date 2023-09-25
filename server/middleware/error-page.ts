// import type { H3Event } from 'h3';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import type { PropType } from "vue"
/**
 * @link https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/core/runtime/nitro/error.ts#L18-L20
 * @desc 错误页面
 */
export default defineEventHandler(async (event) => {
  // console.log('error--page', event.node.res);
  // TODO 捕获 api 接口返回的状态码
  return;
  const errorPageApp = createSSRApp(
    {
      template: `
        <div class="notfind">
        <div class="noise"></div>
        <div class="overlay"></div>
        <div class="terminal">
          <h1>Error Page</h1>
          <h2>{{ error.message }}</h2>
          <ul class="error-list">
            <li class="error-item">您要查找的页面可能已被删除、名称已更改或暂时不可用。</li>
            <li class="error-item">请返回上一页或首页</li>
            <li class="error-item" @click="handleErrorClick">good luck.</li>
          </ul>
        </div>
      </div>`,
      props: {
        error: {
          type: Object as PropType<{
            url: string;
            statusCode: number;
            statusMessage: string;
            message: string;
            stack: string;
          }>,
          default: () => ({
            statusCode: 404,
            statusMessage: 'Page not found',
            message: 'Page not found',
            stack: '',
          }),
        },
      },
      setup(props) {
        const handleErrorClick = () => {
          console.log('error click');
        };
        return {
          handleErrorClick,
          error: props.error,
        };
      },
    },
    {
      error: {
        statusCode: 404,
        statusMessage: 'Page not found',
        message: 'Page not found',
        stack: '',
      },
    },
  );
  const errorPageHtml = await renderToString(errorPageApp);
  event.node.res.statusCode = 200;
  event.node.res.setHeader('Content-Type', 'text/html;charset=UTF-8');
  event.node.res.write(`
      <!DOCTYPE html>
        <html>
          <head>
            <title>Vue SSR Example</title>
            <style>
              html,body {
                padding:0;
                margin:0;
                width: 100%;
                height: 100%;
              }
              .notfind {
                width: 100%;
                height: 100%;
                position: relative;
                overflow: hidden;
              }
              .notfind .noise {
                height: 100%;
                pointer-events: none;
                position: absolute;
                width: 100%;
                background-repeat: no-repeat;
                background-size: cover;
                opacity: 0.02;
                z-index: 1;
              }
              @keyframes scan {
                0% {
                  transform: translateY(-100%);
                }
                100% {
                  transform: translateY(100%);
                }
              }
              .notfind .overlay {
                height: 100%;
                pointer-events: none;
                position: absolute;
                width: 100%;
                background: repeating-linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.3) 50%, transparent);
                background-size: auto;
                background-size: auto 4px;
                z-index: 2;
              }
              .notfind .overlay::before {
                animation: scan 5s linear 0s infinite;
                background-image: linear-gradient(0deg, transparent, rgba(32, 128, 32, 0.2) 2%, rgba(32, 128, 32, 0.8) 3%, rgba(32, 128, 32, 0.2) 0, transparent);
                background-repeat: no-repeat;
                content: '';
                display: block;
                height: 100%;
                inset: 0;
                pointer-events: none;
                position: absolute;
                width: 100%;
              }
              .notfind .terminal {
                background-color: #070709;
                font-size: 1.5rem;
                height: 100%;
                max-width: 100%;
                padding: 4rem;
                position: absolute;
                text-transform: uppercase;
                width: 100%;
              }
              .notfind .terminal > * {
                color: #80ff80cc;
                text-shadow: 0 0 1px rgba(51, 255, 51, 0.4), 0 0 2px rgba(255, 255, 255, 0.8);
              }
              .notfind .error-list {
                margin-top: 2rem;
              }
              .notfind .error-list .error-item {
                margin-bottom: 1rem;
                list-style: none;
              }
              .notfind .error-list .error-item::before {
                content: '>';
                margin-right: 0.5rem;
              }
            </style>
          </head>
          <body>
            ${errorPageHtml}
          </body>
        </html>`);
  event.node.res.end();
});
