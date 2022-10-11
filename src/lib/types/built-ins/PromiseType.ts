import { Type } from '../Type'
import { inspect } from 'node:util'
import { BuiltInType } from './BuiltInType'

export class PromiseType extends BuiltInType {
  #resolvesTyper: () => Type
  private _resolvesType?: Type

  get resolvesType() {
    return (this._resolvesType ??= this.#resolvesTyper())
  }

  constructor(resolvesType: () => Type) {
    super('Promise')
    this.#resolvesTyper = resolvesType
  }

  [inspect.custom]() {
    this.resolvesType
    return this
  }
}
