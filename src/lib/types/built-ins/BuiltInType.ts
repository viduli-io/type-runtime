import { inspect } from 'node:util'
import { Type } from '../Type'

export class BuiltInType extends Type {
  kind = 'BuiltIn' as const;

  [inspect.custom](): any {
    return `BuiltIn - ${this.name}`
  }
}

Type.Date = new BuiltInType('Date')
Type.Error = new BuiltInType('Error')
Type.RegExp = new BuiltInType('RegExp')
Type.FunctionObject = new BuiltInType('FunctionObject')
