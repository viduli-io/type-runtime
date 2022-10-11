import { Type } from './types'
import { TypeStore } from './TypeStore'
import { Class } from './types/ClassType'

interface TypeOf {
  /**
   * Obtain type information of the given type `T`
   */
  <T>(): Type
  /**
   * Obtain type information of the given class
   */
  (value: Class): Type
  readonly __isTypeOfCall?: unique symbol
}

export const typeOf: TypeOf = <T>(value?: any): Type => {
  if (typeof value === 'function') {
    if (value.__typeRef) return TypeStore.getOrThrow(value.__typeRef)
    else return Type.Unsupported
  }
  throw new Error('typeOf call not transformed.')
}
