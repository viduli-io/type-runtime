interface When {
  bar: number
  foo(): void
  foo3: (a: number, b?: string) => {}
}

export class Why {
  inherited = ''
}

export class What extends Why implements When {
  bar: number = 0

  foo() {}

  foo3 = (a: number, b?: string) => {
    return { a: 'c', b() {} }
  }
}

type Haha<T> = 'what'
