import { typeOf } from 'type-runtime'

export const x = typeOf<string>()

export const y = typeOf<string | number>()

class Foo {}

export const z = typeOf<Foo>()

export const a = typeOf<Array<string>>()

export const zz = typeOf(Foo)

console.log(zz)
