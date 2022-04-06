export * from './main';
import { _Context } from '@apollosoftwarexyz/cinnamon';

declare module "@apollosoftwarexyz/cinnamon" {
    interface Context {
        /**
         * You should not set the response body directly with
         * cinnamon-plugin-asl-protocol.
         *
         * You should instead use ctx.successRaw, or access the response stream
         * directly with ctx.res.
         */
        body: never;

        /**
         * You should not set the response body directly with
         * cinnamon-plugin-asl-protocol.
         *
         * You should instead use ctx.successRaw, or access the response stream
         * directly with ctx.res.
         */
        response: Omit<_Context["response"], "body">;

        /**
         * Indicates the response was successful by JSON-encoding and wrapping
         * the specified payload with an ASL Protocol Success response before
         * returning it to the client.
         *
         * @param payload Optionally, the response payload to include.
         * @param statusCode Optionally, the status code to set. (Default: 200)
         */
        success: (payload?: any, statusCode?: number) => void;

        /**
         * Indicates that the request was successful by returning the raw
         * payload to the client by inserting `raw=true` into your payload if
         * its an object or directly returning the payload to the client if it
         * isn't.
         *
         * @param rawPayload Optionally, the raw payload to respond. (`raw=true`
         *                   will be injected if it is an object.)
         * @param mimeType The MIME type to set in the response header. Defaults
         *                 to `text/plain`.
         * @param statsuCode Optionally, the status code to set. (Default: 200)
         */
        successRaw: (rawPayload?: any, mimeType?: string, statusCode?: number) => void;

        /**
         * Indicates that the request failed by returning an ASL Protocol Error
         * response payload with the specified parameters to the client.
         *
         * @param number The HTTP status code most relevant to the error.
         *               Defaults to `400`.
         * @param error The name of the error that occurred. Defaults to
         *              `ERR_UNEXPECTED`.
         * @param message A human-readable message explaining why
         *                the error occurred. Defaults to 'An unexpected error
         *                occurred.'
         */
        error: (code?: number, error?: string, message?: string) => void;
    }
}

