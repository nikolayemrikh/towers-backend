import { IAnother, another } from './another'

export interface IUser {
  id: string
  another: IAnother
}

export const test = async (): Promise<IUser> => {
  return {
    id: '1',
    another: another(),
  }
}
