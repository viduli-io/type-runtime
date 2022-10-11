import { Type } from './Type'

/**
 * Type stub for types from external packages.
 */
export class ExternalType extends Type {
  /**
   * Structural discriminant
   */
  readonly kind = 'External' as const
  /*
   * Unique identifier for the type
   */
  readonly ref: string

  constructor(name: string, ref: string) {
    super(name)
    this.ref = ref
  }
}
