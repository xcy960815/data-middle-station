declare namespace LoginDao {
  export type Login = {
    token: string
    user: {
      role: string
      userId: number
      username: string
    }
  }
}
