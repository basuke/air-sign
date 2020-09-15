/*
 * Copyright (c) 2020 Basuke
*/

import Net from "net"
import config from "mc/config";
import {
    HandyServer,
    ifTypeIs,
    jsonResponse,
    okResponse,
    notFound,
    registerHostName
} from "network";
import {
    getDimention,
    makeColor,
    draw,
    fonts
} from "screen";

const port = config.port ? parseInt(config.port) : 80;
if (!port) {
    trace(`Invalid port number: ${config.port}\n`);
    return;
}

let hostName = undefined;

registerHostName(config.hostname ?? "air-sign", value => {
    hostName = value;
    params.text = url();
    update();
});

function url() {
    return 'http://' + (hostName ? hostName + '.local' : Net.get("IP"));
}

const params = {
    text: url(),
    color: makeColor('white'),
    background: makeColor('black'),
    font: fonts.L,
    image: null,
};

function update() {
    const {text, color, background, font, image} = params;

    trace(`${text}\n`);
    draw(render => {
        render.fillRectangle(background, 0, 0, render.width, render.height);

        if (image) {
            render.drawJpeg(image);
        }

        const lines = text.split("\n");
        let y = (render.height - font.height * lines.length) >> 1;

        for (const line of lines) {
            render.drawText(line, font, color,
                (render.width - render.getTextWidth(line, font)) >> 1, y);
            y += font.height;
        }
    });
}

const server = new HandyServer({
    port,
    verbose: ('verbose' in config ? !!config.verbose : true),
    root: config.file.root,
});

const textType = 'text/plain';
const imageType = 'image/jpeg';

server.onGet = ({path}) => {
    switch (path) {
        case '/info':
            return jsonResponse({
                ip: Net.get("IP"),
                ssid: Net.get("SSID"),
                hostName,
                fonts: Object.keys(fonts),
                ...getDimention(),
            });

        default:
            return notFound();
    }
};

server.onPost = ({path, contentType, body, file}) => {
    const ifText = (prepareIt, doIt) => ifTypeIs(textType, contentType, prepareIt, doIt, update);
    const ifImage = (prepareIt, doIt) => ifTypeIs(imageType, contentType, prepareIt, doIt, update);

    switch (path) {
        case '/busy': {
            const message = body ?? "BUSY!";
            return ifText(() => message, value => {
                params.text = value;
                params.color = makeColor('white');
                params.background = makeColor('maroon');
            });
        }

        case '/open': {
            const message = body ?? "Good to go!";
            return ifText(() => message, value => {
                params.text = value;
                params.color = makeColor('white');
                params.background = makeColor('green');
            });
        }

        case '/text':
            return ifText(() => body, value => params.text = value);

        case '/color':
            return ifText(() => makeColor(body), value => params.color = value);

        case '/background':
            return ifText(() => makeColor(body), value => params.background = value);
    
        case '/font':
            return ifText(() => fonts[body], value => params.font = value);

        case '/image':
            return ifImage(() => file ? file : body, value => params.image = value);

        default:
            return notFound();
    }
};

server.onDelete = ({path}) => {
    switch (path) {
        case '/':
            params.text = url();
            params.color = makeColor('white');
            params.background = makeColor('black');
            params.font = fonts.L;
            params.image = undefined;
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

        case '/image':
            params.image = undefined;
            break;

        default:
            return notFound();
    }

    update();
    return okResponse();
};

update();
