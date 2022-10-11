import { typeOf } from 'type-runtime'

export class Foo {
  aaa: number | string = 'hahaha-saass- what the fuck'
  bbb: { foo: string } & { boo: string }
}

export class Hoo {
  foo = new Foo()
}

console.log(new Hoo())

console.log(typeOf<Hoo>())
