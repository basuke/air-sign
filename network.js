import { Server } from "http"
import MDNS from "mdns";
import { File } from "file";

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
        this.contentLength = undefined;
        this.body = undefined;
        this.file = undefined;
    }

    receiveHeader(name, value) {
        switch (name.toLowerCase()) {
            case 'content-type':
                this.contentType = value;
                break;
            
            case 'content-length':
                this.contentLength = value;
                break;
        }
    }

    log() {
        trace(`${this.method} ${this.path}\n`);
        if (this.body) trace(`length: ${this.contentLength}\n${this.body}\n`);
        if (this.file) trace(`length: ${this.contentLength}\n<${this.file}>\n`);
    }
};

const cacheFileName = 'cache';

export class HandyServer extends Server {
    constructor(dictionary) {
        super(dictionary);

        const verbose = dictionary.verbose;
        const root = dictionary.root;

        let request = undefined;
        let file = undefined;

        const server = this;

        this.callback = function(message, arg1, arg2) {
            switch (message) {
                case Server.status:
                    request = new Request(arg2, arg1);
                    break;

                case Server.header:
                    request.receiveHeader(arg1, arg2);
                    break;

                case Server.headersComplete:
                    if (request.contentLength >= 1024) {
                        if (File.exists(root + cacheFileName))
                            File.delete(root + cacheFileName);
                        file = new File(root + cacheFileName, true);
                        return true; // handling by myself
                    } else {
                        const [type, subtype] = request.contentType.split('/');
                        return type === 'text' ? String : ArrayBuffer;
                    }

                case Server.requestFragment:
					const fragment = this.read(ArrayBuffer, arg1);
                    file.write(fragment);
                    break;

                case Server.requestComplete:
                    if (file) {
                        file.close();
                        file = undefined;

                        request.file = root + cacheFileName;
                    } else {
                        request.body = arg1;
                    }
                    break;

                case Server.prepareResponse:
                    if (verbose) request.log();
                    return server.onRequest(request);

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

export function ifTypeIs(expectedType, contentType, prepareIt, doIt, update) {
    if (contentType !== expectedType) return errorResponse("Text only");

    const value = prepareIt();
    if (value === undefined) return errorResponse("Invalid value");

    doIt(value);
    update();
    return okResponse();
}
