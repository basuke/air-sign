/*
 * Copyright (c) 2020 Basuke
*/

import Net from "net"
import config from "mc/config";
import { HandyServer, textResponse, registerHostName } from "network";

const port = config.port ? parseInt(config.port) : 80;
if (!port) {
    trace(`Invalid port number: ${config.port}\n`);
    return;
}

let hostName = undefined;

registerHostName(config.hostname ?? "air-sign", value => {
    hostName = value;
});

const server = new HandyServer({
    port,
    verbose: ('verbose' in config ? !!config.verbose : true),
});

server.onRequest = ({method, path, contentType, body}) => {
    const ip = Net.get("IP");
    const ssid = Net.get("SSID");
    return textResponse(`Client requested path ${path}. Server host name "${hostName}.local" at address ${ip} on network "${ssid}".\n`);
};
