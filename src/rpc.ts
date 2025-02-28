import { addUser } from './authenticated/add-user'
import { initializeBoard } from './authenticated/initialize-board'
import { useSelectedCard } from './authenticated/use-selected-card'
import { test } from './test'

type TMethod = (...args: any[]) => Promise<any>

interface IMethods {
  [key: string]: TMethod | IMethods
}

export const rpcMethods = {
  test1: test,
  authenticated: {
    addUser,
    useSelectedCard,
    initializeBoard,
  } satisfies Record<string, TAuthenticatedMethod>,
} satisfies IMethods

type TAuthenticatedMethod = (
  token: string,
  ...args: any[]
) => Promise<any>

export type RpcMethods = typeof rpcMethods
