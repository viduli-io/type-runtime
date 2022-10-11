import { Type } from './Type'
import { Property } from './Property'
import { Method } from './Method'
import { ConstructSignature } from './ConstructSignature'
import { CallSignature } from './CallSignature'
import { inspect } from 'node:util'
import { TypeParameter } from './TypeParameter'
import { TypeRetriever } from './index'
import { IndexSignature } from './IndexSignature'
import { ObjectLike } from './ObjectLike'

/**
 * Type information of an interface
 */
export class InterfaceType extends Type implements ObjectLike {
  /* @internal */ #extendedTypes: TypeRetriever[]
  // /* @internal */ #typeParameters: (() => TypeParameter)[]
  /* @internal */ private _extendsTypes?: Type[]
  /* @internal */ private _typeParameters?: TypeParameter[]

  /**
   * Structural discriminant
   */
  readonly kind = 'Interface' as const
  /**
   * Unique identifier for the type
   */
  readonly ref: string
  /**
   * Properties of the interface
   */
  readonly properties: readonly Property[]
  /**
   * Methods of the interface
   */
  readonly methods: readonly Method[]
  /**
   * Constructors of the interface
   */
  readonly constructors: readonly ConstructSignature[]
  /**
   * Index signatures of the interface
   */
  readonly indexes: readonly IndexSignature[]
  /**
   * Call signatures of the interface
   */
  readonly callSignatures: readonly CallSignature[]
  /**
   * Type parameters of the interface
   */
  readonly typeParameters: readonly TypeParameter[]

  /**
   * Types that this interface extends
   */
  get extendsTypes(): readonly Type[] {
    return (this._extendsTypes ??= this.#extendedTypes.map(t => t()) ?? [])
  }

  // get typeParameters(): readonly TypeParameter[] {
  //   return (this._typeParameters ??= this.#typeParameters.map(t => t()))
  // }

  constructor(
    ref: string,
    name: string,
    properties: Property[],
    methods: Method[],
    extendedTypes: TypeRetriever[],
    constructSignatures: ConstructSignature[],
    callSignatures: CallSignature[],
    typeParameters: TypeParameter[],
    indexSigs: IndexSignature[],
  ) {
    super(name)
    this.#extendedTypes = extendedTypes
    // this.#typeParameters = typeParameters
    this.ref = ref
    this.properties = properties
    this.methods = methods
    this.constructors = constructSignatures
    this.callSignatures = callSignatures
    this.indexes = indexSigs
    this.typeParameters = typeParameters
  }

  [inspect.custom]() {
    this.extendsTypes
    return this
  }
}
