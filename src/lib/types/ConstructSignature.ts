import { Type } from './Type'
import { Parameter } from './Parameter'
import { inspect } from 'node:util'
import { TypeRetriever } from './index'

/**
 * Describes construct signatures of a class, interface or object literal.
 */
export class ConstructSignature {
  #retTyper: TypeRetriever
  private _returnType?: Type

  /**
   * Parameters of the constructor
   */
  readonly parameters: readonly Parameter[]

  /**
   * Return type of the constructor.
   */
  get returnType() {
    return (this._returnType ??= this.#retTyper())
  }

  constructor(parameters: readonly Parameter[], retTyper: TypeRetriever) {
    this.#retTyper = retTyper
    this.parameters = parameters
  }

  equals(other: ConstructSignature) {
    if (!this.returnType.is(other.returnType)) return false
    if (this.parameters.length !== other.parameters.length) return false

    for (let i = 0; i < this.parameters.length; i++) {
      const a = this.parameters[i]
      const b = other.parameters[i]
      if (!a.equals(b)) return false
    }
    return true
  }

  [inspect.custom]() {
    this.returnType
    return this
  }
}
