import { Type, TypeRetriever } from './index'
import { inspect } from 'node:util'

/**
 * Represents index signatures of object-like types.
 *
 * @example
 * class Foo { [x: string]: number }
 * const type = typeOf<Foo>()
 * assertClassType(type)
 * type.indexes[0].key.is(Type.String) // true
 */
export class IndexSignature {
  #key: TypeRetriever
  #value: TypeRetriever
  private _key?: Type
  private _value?: Type

  /**
   * Type of the key of the index signature
   */
  get key() {
    return (this._key ??= this.#key())
  }

  /**
   * Type of the value of the index signature
   */
  get value() {
    return (this._value ??= this.#value())
  }

  constructor(key: TypeRetriever, value: TypeRetriever) {
    this.#key = key
    this.#value = value
  }

  [inspect.custom]() {
    this.key
    this.value
    return this
  }
}
