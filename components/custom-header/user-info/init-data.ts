

type Theme = 'light' | 'dark' | 'auto';


/**
 * @desc 初始化数据
 * @returns 
 */
export const initData = () => {

    /**
     * @Desc 监听系统主题变化
     */
    // const mediaQuery = matchMedia('(prefers-color-scheme: dark)');

    const userStore = useUserStore();

    const THEME_KEY = '__theme__';

    // localStorage.getItem(THEME_KEY) as Theme ||
    const theme = ref<Theme>( 'light');

    /**
     * @desc 用户信息
     */
    const userInfo = computed(() => userStore.userInfo);

    /**
     * @desc 全屏状态
     */
    const fullscreen = ref<boolean>(false);

    // console.log('mediaQuery', mediaQuery);
    
    return {
        // mediaQuery,
        THEME_KEY,
        theme,
        userInfo,
        fullscreen
    }
}