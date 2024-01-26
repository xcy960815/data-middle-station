

type Theme = 'light' | 'dark' | 'auto';


/**
 * @desc 初始化数据
 * @returns 
 */
export const initData = () => {

    /**
     * @desc 主题选项
     */
    const themeOptions = ['light', 'dark', 'auto'];

    /**
     * @Desc 监听系统主题变化
     */
    const mediaQuery = ref<MediaQueryList | undefined>();

    const userStore = useUserStore();

    const THEME_KEY = '__theme__';

    const theme = ref<Theme>('light');

    /**
     * @desc 用户信息
     */
    const userInfo = computed(() => userStore.userInfo);

    /**
     * @desc 全屏状态
     */
    const fullscreen = ref<boolean>(false);


    onMounted(() => {
        // 在非Mounted 中找不到 localStorage 所以在这里初始化
        theme.value = localStorage.getItem(THEME_KEY) as Theme || 'light';
       
        // 在非Mounted 中找不到 matchMedia 所以在这里初始化
        mediaQuery.value = matchMedia('(prefers-color-scheme: dark)');
        
    })

    return {
        themeOptions,
        mediaQuery,
        THEME_KEY,
        theme,
        userInfo,
        fullscreen
    }
}