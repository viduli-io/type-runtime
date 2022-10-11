import { typeOf } from 'type-runtime'

// export const kind = Symbol()
//
// export type PropertyAccess<Y> = Y & {
//   [kind]: 'PropertyAccess'
// }

export type PropertyExpressionBuilder<T> = {
  [K in keyof T]: T[K]
}

console.log(typeOf<PropertyExpressionBuilder<any>>())
