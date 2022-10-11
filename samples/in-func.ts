import { typeOf, ClassType, assertClassType } from 'type-runtime'

// type Ctor<T> = {
//   new (): T
// }

interface Ctor<T> {
  new (): T
}

export function entity<T>(Ctor?: Ctor<T>) {
  const type = typeOf<T>()
  assertClassType(type)
  console.log(type.ref)
}

// export function bounty() {
//   return function entity<T>(Ctor: T, ...args: any[]) {
//     const type = typeOf<T>()
//     console.log(type)
//   }
// }
/*
export function entity(Ctor: T, __types) {
  const type = __types.T
  console.log(type)
}
*/

class Doer {
  do<T>(what: any) {
    const type = typeOf<T>()
    assertClassType(type)
    console.log(type.ref)
  }
}

// @bounty()
// @entity
class What {
  foo = 'string'
}

entity(What)
entity<What>()

const doer = new Doer()

doer.do<What>({})

// entity(What, { T: ClassType, What })
