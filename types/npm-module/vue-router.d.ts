import 'vue-router';

declare module 'vue-router' {
  import * as ElementPlusIcons from '@element-plus/icons-vue';
  // 为 `RouteMeta` 添加自定义字段
  export interface RouteMeta {
    menuName: string;
    showInLeftMenu?: boolean;
    highLightActive?: string; // 左侧菜单栏高亮的菜单
    link?: string; // 外部链接
    target?: '_blank' | '_self' | '_parent' | '_top'; // 跳转外部链接的方式
    menuIcon?: keyof typeof ElementPlusIcons;
    permission?: Array<string>;
  }
}
