declare namespace LoginVo {
  export type Login = {
    token: string
    user: {
      role: string
      userId: number
      username: string
    }
  }
}
