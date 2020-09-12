/*
 * Copyright (c) 2020 Basuke
*/

import MDNS from "mdns";
import {Server} from "http"
import Net from "net"
import config from "mc/config";
import {} from "piu/MC";
import Timer from "timer";

let hostName = config.hostname ?? "air-sign";
const port = config.port ? parseInt(config.port) : 80;
const verbose = 'verbose' in config ? !!config.verbose : true;

if (!port) {
    trace(`Invalid port number: ${config.port}\n`);
    return;
}

new MDNS({hostName}, (message, value) => {
    if (message === MDNS.hostName)
        hostName = value;
        Timer.set(() => app.first.string = hostName, 100);
});

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

class SignServer extends Server {
    constructor(dictionary) {
        super(dictionary);

        let request = undefined;

        this.callback = (message, arg1, arg2) => {
            switch (message) {
                case Server.status:
                    request = new Request(arg2, arg1);
                    break;

                case Server.header:
                    request.receiveHeader(arg1, arg2);
                    break;

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

    counter = 0;

    onRequest({method, path, contentType, body}) {
        return { headers: ["Content-Type", "text/plain"], body: "OK" };
    }
};

const server = new SignServer({port});

/* UI */

const bgSkin = new Skin({ fill:"black" });
const textStyle = new Style({ font:"OpenSans-Semibold-28", left:10, right:10, top:15, bottom:15, color: "white" });
const centerStyle = new Style({ horizontal:"center" });

const UIApp = Application.template($ => ({
    skin: bgSkin,
    style: textStyle,
	contents: [
		Text($, { 
            anchor: "TEXT",
            left: 0,
            right: 0,
            top: 0,
            style: centerStyle, 
            active:true,
			string: hostName,
		}),
	]
}));

const app = new UIApp(null, { displayListLength:4608 });
const ip = Net.get("IP");
const ssid = Net.get("SSID");

server.onRequest = ({method, path, contentType, body}) => {
    app.first.string = path;
    return {
        headers: ["Content-Type", "text/plain"],
        body: `Client requested path ${path}. Server host name "${hostName}.local" at address ${ip} on network "${ssid}".`,
    };
};

export default app;
