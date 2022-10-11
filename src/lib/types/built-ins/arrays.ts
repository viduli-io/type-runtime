import { Type } from '../Type'
import { inspect } from 'node:util'
import { BuiltInType } from './BuiltInType'

abstract class ArrayBaseType extends BuiltInType {
  #elementTyper: () => Type
  private _elementType?: Type

  get elementType() {
    return (this._elementType ??= this.#elementTyper())
  }

  constructor(elementType: () => Type) {
    super('')
    this.#elementTyper = elementType
  }

  [inspect.custom]() {
    this.elementType
    return this
  }

  is(other: Type) {
    return (
      other instanceof ArrayBaseType &&
      this.elementType.is(other.elementType)
    )
  }
}

export class ArrayType extends ArrayBaseType {
  readonly name = 'Array' as const

  static of(elementType: Type) {
    return new ArrayType(() => elementType)
  }
}

export class Int8ArrayType extends ArrayBaseType {
  readonly name = 'Int8Array' as const
}
