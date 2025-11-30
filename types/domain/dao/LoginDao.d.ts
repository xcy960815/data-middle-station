declare namespace LoginDao {
  export type LoginOptions = {
    token: string
    user: {
      userId: number
      userName: string
    }
  }
}
