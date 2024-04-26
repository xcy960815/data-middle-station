
const COMMONFETCHURL = "commonfetch"

/**
 * @desc 权限校验中间件
 * @parameter {RouteLocationNormalized} to
 * @parameter {RouteLocationNormalized} from
 * 
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
    if(to.fullPath.includes(COMMONFETCHURL)){
        // const router = useRouter()
        // router.push("/homepage")
    }

})