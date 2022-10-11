import { Type } from '../Type'
import { TypeRetriever } from '../index'
import { inspect } from 'node:util'

export class GenericBuiltIn extends Type {
  kind = 'GenericBuiltIn' as const
  #typeArgs: TypeRetriever[]
  private _typeArguments?: Type[]

  get typeArguments() {
    return (this._typeArguments ??= this.#typeArgs.map(t => t()))
  }

  constructor(name: string, typeArgs: TypeRetriever[]) {
    super(name)
    this.#typeArgs = typeArgs
  }

  [inspect.custom]() {
    this.typeArguments
    return this
  }
}
