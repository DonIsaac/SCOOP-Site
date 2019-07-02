import 'reflect-metadata'

export function Controller(base: string): ClassDecorator {
  return function(target: Function) {
    Reflect.defineMetadata('server:base', base, target)
  }
}

@Controller('/foo')
class Foo {

}


