import { Type } from '../Type'
import { inspect } from 'node:util'
import { BuiltInType } from './BuiltInType'

export class MapType extends BuiltInType {
  #keyType: () => Type
  private _keyType?: Type

  #valueType: () => Type
  private _valueType?: Type

  get key() {
    return (this._keyType ??= this.#keyType())
  }

  get value() {
    return (this._valueType ??= this.#valueType())
  }

  constructor(keyType: () => Type, valueType: () => Type) {
    super('Map')
    this.#keyType = keyType
    this.#valueType = valueType
  }

  [inspect.custom]() {
    this.key
    this.value
    return this
  }
}
