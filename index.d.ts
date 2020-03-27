// Definitions by: Jannik Keye <https://github.com/jannikkeye>

import { Server, IncomingMessage, ServerResponse } from 'http'
import { Http2SecureServer, Http2Server, Http2ServerRequest, Http2ServerResponse } from 'http2'

import fastify = require('fastify');

type originCallback = (err: Error | null, allow: boolean) => void;

type originFunction = (origin: string, callback: originCallback) => void;

type originType = string | boolean | RegExp;

type ValueOrArray<T> = T | ArrayOfValueOrArray<T>;

interface ArrayOfValueOrArray<T> extends Array<ValueOrArray<T>> {}

declare const fastifyCors: fastify.Plugin<
    Server | Http2Server | Http2SecureServer,
    IncomingMessage | Http2ServerRequest,
    ServerResponse | Http2ServerResponse,
    {
        /**
         * Configures the Access-Control-Allow-Origin CORS header.
         */
        origin?: ValueOrArray<originType> | originFunction;
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
         * Hide options route from the documentation built using fastify-swagger (default: true).
         */
        hideOptionsRoute?: boolean;
    }
>;

export = fastifyCors;
