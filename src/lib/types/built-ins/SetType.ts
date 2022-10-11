import { Type } from '../Type'
import { inspect } from 'node:util'
import { BuiltInType } from './BuiltInType'

export class SetType extends BuiltInType {
  #valueType: () => Type
  private _valueType?: Type

  get value() {
    return (this._valueType ??= this.#valueType())
  }

  constructor(valueType: () => Type) {
    super('Set')
    this.#valueType = valueType
  }

  [inspect.custom]() {
    this.value
    return this
  }
}
