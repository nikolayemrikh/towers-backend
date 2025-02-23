export interface IAddUser {
  name: string
  email: string
  password: string
}

export const addUser = async (
  token: string,
  user: IAddUser,
): Promise<IAddUser> => {
  console.log(token)
  return user
}
