import { AliasType } from './AliasType'
import { CallSignature } from './CallSignature'
import { AccessModifier, ClassMember } from './ClassMember'
import { Statics, ClassLocation, ClassType } from './ClassType'
import { ConstructSignature } from './ConstructSignature'
import { Decorator } from './Decorator'
import { ESModule } from './ESModule'
import { GenericInstance } from './GenericInstance'
import { InterfaceType } from './InterfaceType'
import { IntersectionType } from './IntersectionType'
import {
  BooleanLiteralType,
  NumberLiteralType,
  StringLiteralType,
} from './literals'
import { Method } from './Method'
import { ObjectType } from './ObjectType'
import { Parameter } from './Parameter'
import { PrimitiveType } from './PrimitiveType'
import { Property } from './Property'
import { TupleType } from './TupleType'
import { Type } from './Type'
import { TypeParameter } from './TypeParameter'
import { UnionType } from './UnionType'
import { UnsupportedType } from './UnsupportedType'
import { FunctionType } from './FunctionType'
import { BuiltInType } from './built-ins/BuiltInType'
import { GenericBuiltIn } from './built-ins/GenericBuiltIn'
import { MapType } from './built-ins/MapType'
import { SetType } from './built-ins/SetType'
import { PromiseType } from './built-ins/PromiseType'
import { ArrayType, Int8ArrayType } from './built-ins/arrays'
import { ExternalType } from './ExternalType'
import { EnumType } from './EnumType'
import { IndexSignature } from './IndexSignature'

export {
  Statics,
  Type,
  AccessModifier,
  AliasType,
  CallSignature,
  ClassMember,
  ClassType,
  ClassLocation,
  ConstructSignature,
  PrimitiveType,
  Parameter,
  Property,
  Decorator,
  ESModule,
  GenericInstance,
  NumberLiteralType,
  StringLiteralType,
  BooleanLiteralType,
  IntersectionType,
  InterfaceType,
  Method,
  ObjectType,
  TupleType,
  TypeParameter,
  UnionType,
  UnsupportedType,
  FunctionType,
  BuiltInType,
  GenericBuiltIn,
  SetType,
  MapType,
  PromiseType,
  ArrayType,
  Int8ArrayType,
  ExternalType,
  EnumType,
  IndexSignature,
}

export type TypeRetriever = () => Type
