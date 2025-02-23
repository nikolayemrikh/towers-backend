export interface IAnother {
  id: string
  name: string
}

export const another = (): IAnother => {
  return {
    id: '1',
    name: 'another',
  }
}

export const authenticated = (): IAnother => {
  return {
    id: '1',
    name: 'another',
  }
}
