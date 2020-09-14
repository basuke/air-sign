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
let font = parseBMF(new Resource("OpenSans-Semibold-20.bf4"));

let hostName = undefined;

registerHostName(config.hostname ?? "air-sign", value => {
    hostName = value;
    update();
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

const INFO = 0;
const COLOR = 1;
const IMAGE = 2;

let current = { mode: INFO };

function update() {
    switch (current.mode) {
        case INFO:
            showHostName();
            break;

        case COLOR:
            paint(current);
    }
}

function showHostName() {
    const orange = makeColor("orange");
    const white = makeColor("white");

    render.begin();
        render.fillRectangle(orange, 0, 0, render.width, render.height);
        const text = 'http://' + (hostName ? hostName + '.local' : Net.get("IP"));
        render.drawText(text, font, white,
            (render.width - render.getTextWidth(text, font)) >> 1,
            (render.height - font.height) >> 1);
    render.end();
}

function paint({color}) {
    render.begin();
        render.fillRectangle(color, 0, 0, render.width, render.height);
    render.end();
}

function hex(str, offset, count) {
    let result = parseInt(str.substring(offset, offset + count), 16);
    if (count === 1)
        result *= 17;
    return result;
}

function rgba(name) {
    if (!name) return [0, 0, 0, 0];

    const cssColors = {
        black: [0x00, 0x00, 0x00, 0xff],
        silver: [0xc0, 0xc0, 0xc0, 0xff],
        gray: [0x80, 0x80, 0x80, 0xff],
        white: [0xff, 0xff, 0xff, 0xff],
        maroon: [0x80, 0x00, 0x00, 0xff],
        red: [0xff, 0x00, 0x00, 0xff],
        purple: [0x80, 0x00, 0x80, 0xff],
        fuchsia: [0xff, 0x00, 0xff, 0xff],
        green: [0x00, 0x80, 0x00, 0xff],
        lime: [0x00, 0xff, 0x00, 0xff],
        olive: [0x80, 0x80, 0x00, 0xff],
        yellow: [0xff, 0xff, 0x00, 0xff],
        navy: [0x00, 0x00, 0x80, 0xff],
        blue: [0x00, 0x00, 0xff, 0xff],
        teal: [0x00, 0x80, 0x80, 0xff],
        aqua: [0x00, 0xff, 0xff, 0xff],
        orange: [0xff, 0xa5, 0x00, 0xff],
        transparent: [0x00, 0x00, 0x00, 0x0],
    };

    if (cssColors[name]) {
        return cssColors[name];
    }

    let red = 0, green = 0, blue = 0, alpha = 255;
    if (name[0] === '#') {
        switch (name.length) {
            case 5:
                alpha = hex(name, 4, 1);
            case 4:
                red = hex(name, 1, 1);
                green = hex(name, 2, 1);
                blue = hex(name, 3, 1);
                break;

            case 9:
                alpha = hex(name, 7, 2);
            case 7:
                red = hex(name, 1, 2);
                green = hex(name, 3, 2);
                blue = hex(name, 5, 2);
                break;
        }
    }
    return [red, green, blue, alpha];
}

function makeColor(name) {
    const [red, green, blue, alpha] = rgba(name);
    return render.makeColor(red, green, blue);
}

update();
