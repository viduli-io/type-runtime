import { ObjectType } from '../ObjectType'
import { expect } from 'chai'
import { Property } from '../Property'
import { Method, Type } from '../'
import { AccessModifier } from '../ClassMember'

describe('ObjectType', () => {
  describe('is', () => {
    it('considers empty objects as equal', () => {
      const o1 = new ObjectType([], [], undefined, undefined, [], [])
      const o2 = new ObjectType([], [], undefined, undefined, [], [])
      expect(o1.is(o2)).to.be.true
    })

    it('considers objects with identical refs as equal', () => {
      const o1 = new ObjectType(
        [],
        // we add extra method here to make sure value comparison is
        // short-circuited
        [new Method('foo', AccessModifier.Public, [], [])],
        undefined,
        'abcde',
        [],
        [],
      )
      const o2 = new ObjectType([], [], undefined, 'abcde', [], [])
      expect(o1.is(o2)).to.be.true
    })

    it('considers objects with different refs as different', () => {
      const o1 = new ObjectType([], [], undefined, 'abcde', [], [])
      const o2 = new ObjectType([], [], undefined, 'abde', [], [])
      expect(o1.is(o2)).to.be.false
    })

    it('considers objects with similar properties as equal', () => {
      const property = new Property(
        'foo',
        () => Type.String,
        AccessModifier.Public,
        false,
        false,
        false,
      )
      const o1 = new ObjectType(
        [property],
        [],
        undefined,
        undefined,
        [],
        [],
      )
      const o2 = new ObjectType(
        [property],
        [],
        undefined,
        undefined,
        [],
        [],
      )

      expect(o1.is(o2)).to.be.true
    })

    it('considers objects with different properties as not equal', () => {
      const o1 = new ObjectType(
        [
          new Property(
            'foo',
            () => Type.String,
            AccessModifier.Public,
            false,
            false,
            false,
          ),
        ],
        [],
        undefined,
        undefined,
        [],
        [],
      )
      const o2 = new ObjectType(
        [
          new Property(
            'bar',
            () => Type.String,
            AccessModifier.Public,
            false,
            false,
            false,
          ),
        ],
        [],
        undefined,
        undefined,
        [],
        [],
      )

      expect(o1.is(o2)).to.be.false
    })

    it('considers objects with similar methods as equal', () => {
      const method = new Method('foo', AccessModifier.Public, [], [])
      const o1 = new ObjectType([], [method], undefined, undefined, [], [])
      const o2 = new ObjectType([], [method], undefined, undefined, [], [])
      expect(o1.is(o2)).to.be.true
    })
  })
})
