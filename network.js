import { Server } from "http"
import MDNS from "mdns";
import { File } from "file";

export function registerHostName(hostName, callback) {
    new MDNS({hostName}, (message, value) => {
        if (message === MDNS.hostName && callback)
            callback(value);
    });
}

const cacheFileName = 'cache';

export class HandyServer extends Server {
    constructor(dictionary) {
        super(dictionary);

        const verbose = dictionary.verbose;
        const root = dictionary.root;

        let file = undefined;

        const server = this;

        this.callback = function(message, arg1, arg2) {
            switch (message) {
                case Server.status:
                    this.method = arg2;
                    this.path = arg1;
                    this.contentType = "application/octed";
                    this.body = undefined;
                    this.file = undefined;
                    break;

                case Server.header:
                    switch (arg1) {
                        case 'content-type':
                            this.contentType = arg2;
                            break;
                    }
                    break;

                case Server.headersComplete:
                    if (this.total >= 1024) {
                        if (File.exists(root + cacheFileName))
                            File.delete(root + cacheFileName);
                        file = new File(root + cacheFileName, true);
                        return true; // handling by myself
                    } else {
                        const [type, subtype] = this.contentType.split('/');
                        return type === 'text' || subtype === 'x-www-form-urlencoded' ? String : ArrayBuffer;
                    }

                case Server.requestFragment:
                    const fragment = this.socket.read(ArrayBuffer, arg1);
                    file.write(fragment);
                    break;

                case Server.requestComplete:
                    if (file) {
                        file.close();
                        file = undefined;

                        this.file = root + cacheFileName;
                    } else {
                        this.body = arg1;
                    }
                    break;

                case Server.prepareResponse:
                    const response = server.onRequest(this);
                    if (response.data)  {
                        this.data = response.data;
                        this.position = 0;
                    }
                    return response;

                case Server.responseFragment:
                    if (this.position >= this.data.byteLength)
                        return;
        
                    const chunk = this.data.slice(this.position, this.position + arg1);
                    this.position += chunk.byteLength;
                    return chunk;
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

export function response(body, status, type = undefined, headers = {}) {
    if (type !== undefined) headers["Content-Type"] = type;

    let data = null;

    if (body && body.byteLength) {
        data = body;
        body = true;

        headers["Content-Length"] = data.byteLength;
    }

    return {body, data, status, headers: makeHeaders(headers)};
}

export function textResponse(text, status = 200, headers = {}) {
    return response(text, status, "text/plain", headers);
}

export function htmlResponse(text, status = 200, headers = {}) {
    return response(text, status, "text/html; charset=utf-8", headers);
}

export function jsonResponse(data, status = 200, headers = {}) {
    return response(JSON.stringify(data) + "\n", status, "application/json", headers);
}

export function fileResponse(path, status, type, filename) {
    return response(fileObject, status, type, headers);
}

export function okResponse(status = 200, headers = {}) {
    return jsonResponse({success:true}, status, headers);
}

export function errorResponse(message, status = 400, headers = {}) {
    return jsonResponse({success: false, error: message}, status, headers);
}

export function notFound() {
    return errorResponse("Not found", 403);
}

export function ifTypeIs(expectedTypes, contentType, prepareIt, doIt, update) {
    if (!expectedTypes.includes(contentType)) {
        return errorResponse(`Content-type must be one of ${expectedTypes.join(', ')}\n`);
    }

    const value = prepareIt();
    if (value === undefined) return errorResponse("Invalid value");

    doIt(value);
    update();
    return okResponse();
}
