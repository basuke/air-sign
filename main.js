/*
 * Copyright (c) 2020 Basuke
*/

import Net from "net"
import config from "mc/config";
import {
    HandyServer,
    jsonResponse,
    okResponse,
    errorResponse,
    notFound,
    registerHostName
} from "network";
import Poco from "commodetto/Poco";
import Resource from "Resource";
import parseBMF from "commodetto/parseBMF";

const port = config.port ? parseInt(config.port) : 80;
if (!port) {
    trace(`Invalid port number: ${config.port}\n`);
    return;
}

let render = new Poco(screen, { displayListLength: 2048, rotation: config.rotation });
let fonts = {
    S: parseBMF(new Resource("OpenSans-Semibold-16.bf4")),
    M: parseBMF(new Resource("OpenSans-Semibold-20.bf4")),
    L: parseBMF(new Resource("OpenSans-Semibold-28.bf4")),
};

let hostName = undefined;

registerHostName(config.hostname ?? "air-sign", value => {
    hostName = value;
    params.text = url();
    update();
});

function url() {
    return 'http://' + (hostName ? hostName + '.local' : Net.get("IP"));
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

const params = {
    text: url(),
    color: makeColor('white'),
    background: makeColor('#ccc'),
    font: fonts.L,
    image: null,
};

function update() {
    const {text, color, background, font} = params;

    trace(`${text}\n`);
    render.begin();
        render.fillRectangle(background, 0, 0, render.width, render.height);
        render.drawText(text, font, color,
            (render.width - render.getTextWidth(text, font)) >> 1,
            (render.height - font.height) >> 1);
    render.end();
}

const server = new HandyServer({
    port,
    verbose: ('verbose' in config ? !!config.verbose : true),
});

const textType = 'text/plain';
const imageType = 'image/bmp';

function ifText(contentType, prepareIt, doIt) {
    if (contentType !== textType) return errorResponse("Text only");
    const value = prepareIt();
    if (value === undefined) return errorResponse("Invalid value");
    doIt(value);
    update();
    return okResponse();
}

server.onGet = ({path}) => {
    switch (path) {
        case '/info':
            return jsonResponse({
                'ip': Net.get("IP"),
                'ssid': Net.get("SSID"),
                hostName,
            });

        default:
            return notFound();
    }
};

server.onPost = ({path, contentType, body}) => {
    switch (path) {
        case '/text':
            return ifText(contentType, () => body, value => params.text = value);

        case '/color':
            return ifText(contentType, () => makeColor(body), value => params.color = value);

        case '/background':
            return ifText(contentType, () => makeColor(body), value => params.background = value);
    
        case '/font':
            return ifText(contentType, () => fonts[body], value => params.font = value);

        default:
            return notFound();
    }
};

server.onDelete = ({path}) => {
    switch (path) {
        case '/':
            params.text = url();
            params.color = makeColor('white');
            params.background = makeColor('#ccc');
            params.font = fonts.L;
            break;

        case '/text':
            params.text = url();
            break;

        case '/color':
            params.color = makeColor('white');
            break;

        case '/background':
            params.background = makeColor('black');
            break;

        case '/font':
            params.font = fonts.L;
            break;

        default:
            return notFound();
    }

    update();
    return okResponse();
};

update();
