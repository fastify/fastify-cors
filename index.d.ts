/// <reference types="node" />

import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from 'fastify';

type OriginCallback = (err: Error | null, allow: boolean) => void;
type OriginType = string | boolean | RegExp;
type ValueOrArray<T> = T | ArrayOfValueOrArray<T>;

interface ArrayOfValueOrArray<T> extends Array<ValueOrArray<T>> {
}

type FastifyCorsPlugin = FastifyPluginCallback<
  NonNullable<fastifyCors.FastifyCorsOptions> | fastifyCors.FastifyCorsOptionsDelegate
>;

type FastifyCorsHook =
  | 'onRequest'
  | 'preParsing'
  | 'preValidation'
  | 'preHandler'
  | 'preSerialization'
  | 'onSend'

declare namespace fastifyCors {
  export type OriginFunction = (origin: string, callback: OriginCallback) => void;

  export interface FastifyCorsOptions {
    /**
     * Configures the Lifecycle Hook.
     */
    hook?: FastifyCorsHook;

    /**
     * Configures the delegate function.
     */
    delegator?: FastifyCorsOptionsDelegate;

    /**
     * Configures the Access-Control-Allow-Origin CORS header.
     */
    origin?: ValueOrArray<OriginType> | fastifyCors.OriginFunction;
    /**
     * Configures the Access-Control-Allow-Credentials CORS header.
     * Set to true to pass the header, otherwise it is omitted.
     */
    credentials?: boolean;
    /**
     * Configures the Access-Control-Expose-Headers CORS header.
     * Expects a comma-delimited string (ex: 'Content-Range,X-Content-Range')
     * or an array (ex: ['Content-Range', 'X-Content-Range']).
     * If not specified, no custom headers are exposed.
     */
    exposedHeaders?: string | string[];
    /**
     * Configures the Access-Control-Allow-Headers CORS header.
     * Expects a comma-delimited string (ex: 'Content-Type,Authorization')
     * or an array (ex: ['Content-Type', 'Authorization']). If not
     * specified, defaults to reflecting the headers specified in the
     * request's Access-Control-Request-Headers header.
     */
    allowedHeaders?: string | string[];
    /**
     * Configures the Access-Control-Allow-Methods CORS header.
     * Expects a comma-delimited string (ex: 'GET,PUT,POST') or an array (ex: ['GET', 'PUT', 'POST']).
     */
    methods?: string | string[];
    /**
     * Configures the Access-Control-Max-Age CORS header.
     * Set to an integer to pass the header, otherwise it is omitted.
     */
    maxAge?: number;
    /**
     * Pass the CORS preflight response to the route handler (default: false).
     */
    preflightContinue?: boolean;
    /**
     * Provides a status code to use for successful OPTIONS requests,
     * since some legacy browsers (IE11, various SmartTVs) choke on 204.
     */
    optionsSuccessStatus?: number;
    /**
     * Pass the CORS preflight response to the route handler (default: false).
     */
    preflight?: boolean;
    /**
     * Enforces strict requirement of the CORS preflight request headers (Access-Control-Request-Method and Origin).
     * Preflight requests without the required headers will result in 400 errors when set to `true` (default: `true`).
     */
    strictPreflight?: boolean;
    /**
     * Hide options route from the documentation built using fastify-swagger (default: true).
     */
    hideOptionsRoute?: boolean;
  }

  export interface FastifyCorsOptionsDelegateCallback { (req: FastifyRequest, cb: (error: Error | null, corsOptions?: FastifyCorsOptions) => void): void }
  export interface FastifyCorsOptionsDelegatePromise { (req: FastifyRequest):  Promise<FastifyCorsOptions> }
  export type FastifyCorsOptionsDelegate = FastifyCorsOptionsDelegateCallback | FastifyCorsOptionsDelegatePromise
  export type FastifyPluginOptionsDelegate<T = FastifyCorsOptionsDelegate> = (instance: FastifyInstance) => T;

  export const fastifyCors: FastifyCorsPlugin
  export { fastifyCors as default };
}

declare function fastifyCors(
  ...params: Parameters<FastifyCorsPlugin>
): ReturnType<FastifyCorsPlugin>;

export = fastifyCors;
