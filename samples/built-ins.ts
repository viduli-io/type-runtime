export class Foo {
  ha: Promise<string>
  boohoo: number[]
  hooboo: ReadonlyArray<string>
  woo = /sss/
  date = new Date()
  foo: Error
  // iterable = [].values()
  hicky = new Map<string, undefined>()
  hooky = new Set<string>()
  fuky = Symbol()
  private *soo() {
    return 0
  }
  what: AsyncIterator<string>
  private async *see() {
    return 0
  }
  coa: Function
}
