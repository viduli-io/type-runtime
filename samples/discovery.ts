import {
  AliasType,
  assertAliasType,
  ClassType,
  isAliasType,
  isClassType,
  typeOf,
  TypeStore,
} from 'type-runtime'
import { inspect } from 'node:util'

class Ref<T, U> {}

export class Model {
  baseModel = Symbol()
}

type Double = number & { double?: true }

export type ManagedReference<Other> = (Other & Ref<any, Other>) | null

export class EntityA extends Model {
  intField = 0
  bigIntField = 0n
  textField = ''
  boolField = false
  doubleField: Double = 0
  tripleField?: Double = 0
  quadField: Double | null = 0
  entityB: EntityB
  entityBC?: EntityB
  entityManaged: ManagedReference<EntityB>
}

export class EntityB extends Model {
  boos: string
}

class ManagedCollection<This, Related> {}

export const managedRefType = (() => {
  const type = typeOf<ManagedReference<string>>()
  assertAliasType(type)
  return type.genericAlias! as AliasType
})()

async function run() {
  const entities = TypeStore.filter(
    t => isClassType(t) && t.superType?.is(typeOf<Model>()),
  ) as ClassType[]
  // console.log(entities[1])

  const property = entities[1].getProperty('entityManaged')
  if (isAliasType(property.type)) {
    console.log(
      inspect(property.type.genericAlias?.is(managedRefType), {
        depth: 6,
      }),
    )
  }

  const type = typeOf<ManagedCollection<string, string>>()
  console.log(type)
  // for (let entity of entities) {
  //   console.log(await entity.import())
  // }
}

run()
