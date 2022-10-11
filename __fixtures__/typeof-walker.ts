import { typeOf } from 'type-runtime'

const test1 = typeOf<string>()

const test2 = typeOf<string | number>()

const testInt = typeOf<{ a: string } & { b: number }>()

class FooBar {
  soap = 'dishwash'
}

const test3 = typeOf<FooBar>()

let x: any = FooBar

const testReference = typeOf(x)

interface Boohoo {
  hooboo: string
}

const testInterface = typeOf<Boohoo>()

const testArray = typeOf<Array<string>>()

type Broom = { sweep: true }

const testAlias = typeOf<Broom>()
