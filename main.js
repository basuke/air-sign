/*
 * Copyright (c) 2020 Basuke
*/

import Net from "net"
import config from "mc/config";
import { HandyServer, textResponse, registerHostName } from "network";
import Poco from "commodetto/Poco";
import Resource from "Resource";
import parseBMF from "commodetto/parseBMF";

const port = config.port ? parseInt(config.port) : 80;
if (!port) {
    trace(`Invalid port number: ${config.port}\n`);
    return;
}

let render = new Poco(screen, { displayListLength: 2048 });
let font = parseBMF(new Resource("OpenSans-Semibold-18.bf4"));
let black = render.makeColor(0, 0, 0);
let white = render.makeColor(255, 255, 255);

let hostName = undefined;

registerHostName(config.hostname ?? "air-sign", value => {
    hostName = value;
    showHostName();
});

showHostName();

const server = new HandyServer({
    port,
    verbose: ('verbose' in config ? !!config.verbose : true),
});

server.onRequest = ({method, path, contentType, body}) => {
    const ip = Net.get("IP");
    const ssid = Net.get("SSID");
    return textResponse(`Client requested path ${path}. Server host name "${hostName}.local" at address ${ip} on network "${ssid}".\n`);
};

function showHostName() {
    render.begin();
        render.fillRectangle(black, 0, 0, render.width, render.height);
        const text = 'http://' + (hostName ? hostName + '.local' : Net.get("IP"));
        render.drawText(text, font, white,
            (render.width - render.getTextWidth(text, font)) >> 1,
            (render.height - font.height) >> 1);
    render.end();
}
