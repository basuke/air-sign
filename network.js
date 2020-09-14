import { Server } from "http"
import MDNS from "mdns";

export function registerHostName(hostName, callback) {
    new MDNS({hostName}, (message, value) => {
        if (message === MDNS.hostName && callback)
            callback(value);
    });
}

class Request {
    constructor(method, path) {
        this.method = method;
        this.path = path;
        this.contentType = "application/octed";
        this.body = undefined;
    }

    receiveHeader(name, value) {
        switch (name.toLowerCase()) {
            case 'content-type':
                this.contentType = value;
                break;
        }
    }

    log() {
        trace(`${this.method} ${this.path}\n`);
    }
};

export class HandyServer extends Server {
    constructor(dictionary) {
        super(dictionary);

        const verbose = dictionary.verbose;

        let request = undefined;

        this.callback = (message, arg1, arg2) => {
            switch (message) {
                case Server.status:
                    request = new Request(arg2, arg1);
                    break;

                case Server.header:
                    request.receiveHeader(arg1, arg2);
                    break;

                case Server.headersComplete:
                    return String

                case Server.requestComplete:
                    request.body = arg1;
                    break;

                case Server.prepareResponse:
                    if (verbose) request.log();
                    return this.onRequest(request);

                case Server.responseComplete:
                    request = undefined;
                    break;
            }
        };
    }

    onRequest(request) {
        switch (request.method) {
            case 'GET':
                return this.onGet(request);
            case 'POST':
                return this.onPost(request);
            case 'DELETE':
                return this.onDelete(request);
            default:
                return notFound();
        }
    }

    onGet({path, contentType, body}) {
        return notFound();
    }

    onPost({path, contentType, body}) {
        return notFound();
    }

    onDelete({path, contentType, body}) {
        return notFound();
    }
};

function makeHeaders(headers) {
    const result = [];
    for (const key in headers) {
        result.push(key);
        result.push(headers[key]);
    }
    return result;
}

export function response(body, status, headers = {}) {
    return {body, status, headers: makeHeaders(headers)};
}

export function textResponse(text, status = 200, headers = {}) {
    return response(text, status, { "Content-Type": "text/plain", ...headers });
}

export function jsonResponse(data, status = 200, headers = {}) {
    return response(JSON.stringify(data), status, { "Content-Type": "application/json", ...headers });
}

export function okResponse(status = 200, headers = {}) {
    return textResponse("OK", status, headers);
}

export function errorResponse(message, status = 400, headers = {}) {
    return textResponse(message, status, headers);
}

export function notFound() {
    return errorResponse("Not found", 403);
}
