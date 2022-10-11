import { FunctionType } from './FunctionType'
import { ClassType } from './ClassType'
import { InterfaceType } from './InterfaceType'
import { Type } from './Type'
import { AliasType } from './AliasType'
import { inspect } from 'node:util'

export class Declaration {
  #declarationBrand!: symbol // make this uniquely structured type
  readonly kind!: string
}

export class FunctionDeclaration extends Declaration {
  #typer: () => FunctionType
  private _type?: FunctionType

  readonly kind = 'FunctionDeclaration' as const

  get type() {
    return (this._type ??= this.#typer())
  }

  constructor(typer: () => FunctionType) {
    super()
    this.#typer = typer
  }

  [inspect.custom]() {
    this.type
    return this
  }
}

export class ClassDeclaration extends Declaration {
  #typer: () => ClassType
  private _type?: ClassType

  readonly kind = 'ClassDeclaration' as const

  get type() {
    return (this._type ??= this.#typer())
  }

  constructor(typer: () => ClassType) {
    super()
    this.#typer = typer
  }

  [inspect.custom]() {
    this.type
    return this
  }
}

export class InterfaceDeclaration extends Declaration {
  #typer: () => InterfaceType
  private _type?: InterfaceType

  readonly kind = 'InterfaceDeclaration' as const

  get type() {
    return (this._type ??= this.#typer())
  }

  constructor(typer: () => InterfaceType) {
    super()
    this.#typer = typer
  }

  [inspect.custom]() {
    this.type
    return this
  }
}

export class TypeAliasDeclaration extends Declaration {
  #typer: () => AliasType
  private _type?: AliasType

  readonly kind = 'TypeAliasDeclaration' as const

  get type() {
    return (this._type ??= this.#typer())
  }

  constructor(typer: () => AliasType) {
    super()
    this.#typer = typer
  }

  [inspect.custom]() {
    this.type
    return this
  }
}

export class VariableDeclaration extends Declaration {
  #typer: () => Type
  private _type?: Type

  readonly kind = 'VariableDeclaration' as const

  get type() {
    return (this._type ??= this.#typer())
  }

  constructor(
    readonly name: string,
    readonly isConstant: boolean,
    typer: () => Type,
  ) {
    super()
    this.#typer = typer
  }

  [inspect.custom]() {
    this.type
    return this
  }
}
