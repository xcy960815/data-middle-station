declare namespace LoginDao {
  export type LoginRecord = {
    token: string
    user: {
      userId: number
      userName: string
    }
  }
}
