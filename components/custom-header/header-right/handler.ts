type Theme = 'light' | 'dark' | 'auto';

type HandlerParams = {
    fullscreen: Ref<boolean>;
    theme: Ref<Theme>;
    THEME_KEY: string;
    mediaQuery: Ref<MediaQueryList | undefined>
}

/**
 * @desc 操作逻辑
 */
export const handler = ({ fullscreen, theme, THEME_KEY, mediaQuery }: HandlerParams) => {

    /**
     * @desc 展开全屏和关闭全屏
     */
    const handleFullscreen = async function () {
        const element: HTMLElement = document.documentElement;
        if (fullscreen.value) {
            if (document.exitFullscreen) {
                /* 通用方法 */
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                /* IE11 */
                await document.msExitFullscreen();
            }
        } else {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullscreen) {
                element.mozRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                // IE11
                element.msRequestFullscreen();
            }
        }
        fullscreen.value = !fullscreen.value;
    };

    /**
     * @desc 监听全屏状态变化
     * @returns void
     */
    const handleWathFullscreen = function () {
        // 全局（document）上监听全屏状态变化
        document.addEventListener('fullscreenchange', function () {
            if (document.fullscreenElement) {
                fullscreen.value = true;
            } else {
                fullscreen.value = false;
            }
        });
        // 对于一些特定的浏览器你需要添加带有前缀的事件监听器
        //Firefox
        document.addEventListener('mozfullscreenchange', function () {
            if (document.mozFullScreenElement) {
                fullscreen.value = true;
            } else {
                fullscreen.value = false;
            }
        });

        //Chrome, Safari and Opera
        document.addEventListener('webkitfullscreenchange', function () {
            if (document.webkitFullscreenElement) {
                fullscreen.value = true;
            } else {
                fullscreen.value = false;
            }
        });

        //Microsoft Internet Explorer
        document.addEventListener('MSFullscreenChange', function () {
            if (document.webkitFullscreenElement) {
                fullscreen.value = true;
            } else {
                fullscreen.value = false;
            }
        });
    };

    // 登录登出
    const dropDownClick = (cmd: 'logout' | 'login'): void => {
        if (cmd === 'logout') {
            console.log('logout');
        } else if (cmd === 'login') {
            console.log('login');
        }
    };


    /**
     * @desc 根据系统主题切换
     */
    const fllowSystemTheme = () => {
        const theme = mediaQuery.value?.matches ? 'dark' : 'light';
        document.documentElement.className = theme;
    }

    /**
     * @desc 监听主题变化
     */
    watch(() => theme.value, () => {
        if (process.client) {
            localStorage.setItem(THEME_KEY, theme.value);
            if (theme.value === 'auto') {
                fllowSystemTheme();
                // 根据系统主题切换
                mediaQuery.value?.addEventListener('change', fllowSystemTheme);
            } else {
                // 给html标签添加class
                document.documentElement.className = theme.value;
                // 移除监听
                mediaQuery.value?.removeEventListener('change', fllowSystemTheme);
            }
        }
    });

    onMounted(() => {
        handleWathFullscreen();
        fllowSystemTheme();
    });

    return {
        handleFullscreen,
        dropDownClick,

    }
}