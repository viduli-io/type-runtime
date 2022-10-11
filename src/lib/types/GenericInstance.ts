import { Type } from './Type'
import { Property } from './Property'
import { Method } from './Method'
import { inspect } from 'node:util'
import { ConstructSignature, IndexSignature, TypeRetriever } from './index'

/**
 * Represents an "instance" of a generic type.
 *
 * Generic types are instantiated when a generic argument is passed to them.
 *
 * @example
 * class Foo<T> { bar: T }
 * typeOf<Foo<string>>() // Generic Instance
 */
export class GenericInstance extends Type {
  #genericTyper: TypeRetriever
  #typeArgs: TypeRetriever[]
  private _genericType?: Type
  private _typeArguments?: Type[]

  /**
   * Structural discriminant
   */
  readonly kind = 'GenericInstance' as const
  /**
   * Unique identifier of the instance
   */
  readonly ref: string
  /**
   * Properties of the instance
   *
   * These are instantiated by applying the type parameter to the type
   * arguments of the properties.
   *
   * @example
   * class Foo<T> { bar: T }
   *
   * const type = typeOf<Foo<string>>()
   * type.getProperty('bar').type === Type.String // true
   */
  readonly properties: readonly Property[]
  /**
   * Methods of the instance
   *
   * @example
   * class Foo<T> { bar(): T {} }
   *
   * const type = typeOf<Foo<string>>()
   * type.getProperty('bar').returnType === Type.String // true
   */
  readonly methods: readonly Method[]
  /**
   * Constructor signatures of the class
   *
   * @example
   * class Foo<T> { constructor(a: T) {} }
   *
   * const type = typeOf<Foo<string>>()
   * type.constructors[0]
   */
  readonly constructors: readonly ConstructSignature[]
  /**
   * Index signatures of the class
   *
   * @example
   * class Foo<T> { [x: string]: number }
   *
   * const type = typeOf<Foo<string>>()
   * type.constructors[0]
   */
  readonly indexes: readonly IndexSignature[]
  /**
   * The underlying generic type that was instantiated
   *
   * @example
   * class Foo<T> { bar(): T {} }
   *
   * const type = typeOf<Foo<string>>()
   * isClassType(type.genericType) // true
   */
  get genericType() {
    return (this._genericType ??= this.#genericTyper())
  }

  /**
   * The type arguments that were passed to the generic type.
   *
   * @example
   * class Foo<T> { bar(): T {} }
   *
   * const type = typeOf<Foo<string>>()
   * type.typeArguments.length === 1 // true
   * type.typeArguments[0] === Type.String // true
   */
  get typeArguments() {
    return (this._typeArguments ??= this.#typeArgs.map(t => t()))
  }

  constructor(
    properties: Property[],
    methods: Method[],
    genericType: TypeRetriever,
    typeArgs: TypeRetriever[],
    name = 'Object',
    ref = '',
    constructors: readonly ConstructSignature[],
    indexes: readonly IndexSignature[],
  ) {
    super(name)
    this.indexes = indexes
    this.#genericTyper = genericType
    this.#typeArgs = typeArgs
    this.ref = ref
    this.properties = properties
    this.methods = methods
    this.constructors = constructors
  }

  [inspect.custom]() {
    this.genericType
    this.typeArguments
    return this
  }
}
