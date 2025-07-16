declare namespace LoginDao {
  export type Login = {
    token: string
    user: {
      userId: number
      username: string
    }
  }
}
