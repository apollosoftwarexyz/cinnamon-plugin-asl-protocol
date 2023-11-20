import Cinnamon, {
    HttpError,
    CinnamonPlugin,
    CinnamonWebServerModulePlugin,
    WebServer
} from '@apollosoftwarexyz/cinnamon';

export const ASW_PROTOCOL_VERSION = 2;

export class ApolloProtocol extends CinnamonPlugin implements CinnamonWebServerModulePlugin {
    constructor(framework: Cinnamon, options?: {}) {
        super(framework, "xyz.apollosoftware", "cinnamon.protocol");
    }

    async onInitialize() {
        return true;
    }

    async beforeRegisterControllers() {
        this.framework
            .getModule<WebServer>(WebServer.prototype)
            .server.use(async (ctx, next) => {
            ctx.success = function (payload?: any, statusCode: number = 200) {
                (ctx as any).__hasApolloResponse = true;
                ctx.set(
                    "x-apollo-software-protocol",
                    ASW_PROTOCOL_VERSION.toString()
                );

                ctx.response.status = statusCode;
                ctx.response.type = "application/json";
                ctx.response.body = JSON.stringify({
                    success: true,
                    payload,
                });
            };

            ctx.successRaw = function (
                rawPayload: any,
                mimeType: string = "text/plain",
                statusCode: number = 200
            ) {
                (ctx as any).__hasApolloResponse = true;

                ctx.response.status = statusCode;
                ctx.response.type = mimeType;
                ctx.response.body = rawPayload;
            };

            ctx.error = function (
                code: number = 400,
                error: string = "ERR_UNEXPECTED",
                message: string = "An unexpected error occurred."
            ) {
                (ctx as any).__hasApolloResponse = true;
                ctx.set(
                    "x-apollo-software-protocol",
                    ASW_PROTOCOL_VERSION.toString()
                );

                ctx.response.status = code;
                ctx.response.type = "application/json";
                ctx.response.body = JSON.stringify({
                    success: false,
                    error,
                    message,
                });
            };

            // Call the request handlers defined after this one.
            await next();

            // If the request has already been handled by some handler from
            // this plugin, we'll just return here and do nothing.
            if ((ctx as any).__hasApolloResponse) return;

            // Otherwise...

            // Add support for Cinnamon's 'return-response' functionality,
            // by ensuring that if, after the request handlers were called,
            // either an ASL Protocol Response was returned or the response
            // was converted to one that conformed anyway.

            // If the request was a 404, we'll ensure that JSON is returned
            // regardless of whether it was requested (provided, of course,
            // an explicit handler hasn't been provided).
            if (ctx.status === 404) {
                return ctx.error(
                    404,
                    'ERR_NOT_FOUND',
                    "The resource you requested could not be found."
                );
            }

            // If a successful response is set and marked as JSON,
            // simply wrap it (if it needs wrapping).
            if (ctx.status < 400) {

                // If there is a body present, either ensure it is
                // already in a valid form, or attempt to convert it.
                if (ctx.body) {

                    if (ctx.response.is('application/json')) {
                        // If the response object does not have a
                        // success property on it, wrap it with a
                        // success response and return it.
                        if (!Object.hasOwn(ctx.body, "success")) {
                            // If there is a payload object, we'll
                            // return it as though it were a top-level
                            // object.
                            //
                            // (If the developer truly wanted to return
                            // the top level object, it's expected that
                            // they would set success too.)
                            if (Object.hasOwn(ctx.body, "payload")) {
                                return ctx.success(
                                    ctx.body.payload,
                                    ctx.status
                                );
                            }

                            // Otherwise, we'll just assume that the
                            // return value was the payload itself.
                            return ctx.success(ctx.body, ctx.status);
                        }

                        // If the success property is not true, return
                        // an error response.
                        if (!ctx.body.success) {
                            // There's no real way to determine why the
                            // response wasn't successful, or if it
                            // indeed wasn't, so we'll return a vauge
                            // error here for the developer's benefit.
                            return ctx.error(
                                500,
                                'ERR_INVALID_RESPONSE',
                                'The server produced an invalid response.'
                            );
                        }

                        // Otherwise, either wrap the object if has no
                        // payload property, otherwise return as-is.
                        if (!Object.hasOwn(ctx.body, "payload")) {
                            // Remove the success property, it'll get
                            // re-added at the top level.
                            delete ctx.body.success;

                            // Then, return a success response with
                            // the returned object included as the
                            // 'payload' value.
                            return ctx.success(ctx.body, ctx.status);
                        } else return;
                    }

                        // If it's not a JSON body, we can simply return
                    // the body as a successRaw response.
                    else {
                        return ctx.successRaw(
                            ctx.body,
                            ctx.type,
                            ctx.status
                        );
                    }

                }

                // Otherwise, simply return an empty success response.
                return ctx.success(undefined, ctx.status);

            }

            // Otherwise, if there's an error object, or the response
            // has a code above 400 and below 600 AND the framework is
            // in production mode...
            else if (
                (ctx.errorObject || (ctx.status >= 400 && ctx.status < 600)) &&
                !this.framework.inDevMode
            ) {
                // If the response body is JSON, defines an error
                // object and has success set to false, simply do
                // nothing.
                if (ctx.request.is('application/json')) {
                    if (
                        Object.hasOwn(ctx.body, "success") &&
                        Object.hasOwn(ctx.body, "error")
                    ) return;
                }

                // ...if not, show the errorObject if it's present...
                if (
                    ctx.errorObject &&
                    ctx.errorObject instanceof HttpError
                ) {
                    return ctx.error(
                        ctx.errorObject.status,
                        "ERR_UNEXPECTED",
                        ctx.errorObject.message
                    );
                }

                // ...otherwise show a generic error.
                ctx.error(
                    ctx.status,
                    "ERR_UNEXPECTED",
                    "An unexpected error has occurred."
                );
            }
        });
    }
}
