type Theme = 'light' | 'dark' | 'auto';

type HandlerParams = {
    fullscreen: Ref<boolean>;
    theme: Ref<Theme>;
    THEME_KEY: string;
}

/**
 * @desc 操作逻辑
 */
export const handler = ({ fullscreen, theme, THEME_KEY }: HandlerParams) => {

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


    watchEffect(() => {
        // console.log('fullscreen---fullscreen');
        // document.body.dataset.theme = theme.value;
    });

    onMounted(() => {
        handleWathFullscreen();
    });

    return {
        handleFullscreen,
        dropDownClick
    }
}