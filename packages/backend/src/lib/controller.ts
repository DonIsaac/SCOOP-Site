/**
 * Contains all constructs needed for controller functionality, such as
 * endpoint decorators and interfaces.
 *
 * @author Donald Isaac
 */
import 'reflect-metadata';
import { Router, RequestHandler } from 'express';

export type HTTPVerb = 'get' | 'post' | 'delete' | 'put' | 'patch' | 'options'
export interface Endpoint {
  /** Sub-url the endpoint listens on. */
  url: string;

  /** HTTP verb the endpoint listens to. */
  method: HTTPVerb

  /** The name of the method that handles the functionality of the endpoint. */
  callback: string;
}

/**
 * Marks a class as a controller. Controllers define the functionality and
 * endpoints for a resource.
 *
 * @param mountPath The path to mount the controller on.
 *                  All endpoints will start with this path.
 */
export function Controller(mountPath: string): ClassDecorator {
  return function(target: Function) {
    // Store the mount path
    Reflect.defineMetadata('ctl:base', mountPath, target.prototype)

    // Create the controller router. Future endpoints will be mounted here.
    Reflect.defineMetadata('ctl:router', Router(), target.prototype)
  }
}

export const Get    = createEndpointDecorator('get')
export const Post   = createEndpointDecorator('post')
export const Put    = createEndpointDecorator('put')
export const Patch  = createEndpointDecorator('patch')
export const Delete = createEndpointDecorator('delete')
export const Option = createEndpointDecorator('options')

function createEndpointDecorator(method: HTTPVerb) {
  return function(url: string): MethodDecorator {
    return function <RequestParamHandler>(target: Object, name: string | symbol, descriptor: TypedPropertyDescriptor<RequestParamHandler>) {

      let endpoint: Endpoint = { url, method, callback: name as string}
      let router: Router = Reflect.getMetadata('ctl:router', target);
      router[method](url, descriptor.value);
      Reflect.getMetadata('ctl:endpoints', this).push(endpoint)
    }
  }
}
