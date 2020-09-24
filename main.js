/*
 * Copyright (c) 2020 Basuke
*/

import Net from "net"
import config from "mc/config";
import Timer from "timer";
import Resource from "Resource";
import {
    HandyServer,
    ifTypeIs,
    htmlResponse,
    jsonResponse,
    okResponse,
    notFound,
    registerHostName
} from "network";
import {
    getDimention,
    checkColor,
    makeColor,
    draw,
    drawOntoJpeg,
    fonts
} from "screen";
import params from "params";

const port = config.port ? parseInt(config.port) : 80;
if (!port) {
    trace(`Invalid port number: ${config.port}\n`);
    return;
}

let hostName = undefined;

registerHostName(config.hostname ?? "air-sign", value => {
    const isInitialTextDisplayed = params.text == initialText();

    hostName = value;

    if (isInitialTextDisplayed) {
        params.text = initialText();
        update();
    }
});

function initialText() {
    const text = hostName ? `http://${hostName}.local\nor\n` : '';
    return text + `http://${Net.get("IP")}`;
}

function update() {
    const {text, image} = params;

    const color = params.color ? makeColor(params.color) : undefined;
    const background = (!image && params.background) ? makeColor(params.background) : undefined;
    const font = fonts[params.font];

    const task = render => {
        if (!image && background !== undefined) {
            render.fillRectangle(background, 0, 0, render.width, render.height);
        }

        if (text && color !== undefined) {
            const lines = text.split("\n");
            let y = (render.height - font.height * lines.length) >> 1;
    
            for (const line of lines) {
                render.drawText(line, font, color,
                    (render.width - render.getTextWidth(line, font)) >> 1, y);
                y += font.height;
            }
        }
    };

    if (image) {
        if (!drawOntoJpeg(image, task)) {
            trace("Failed to render this JPEG.\n");
            params.image = null;
            Timer.set(update, 0);
        }
    } else {
        draw(task);
    }
}

const server = new HandyServer({
    port,
    verbose: ('verbose' in config ? !!config.verbose : true),
    root: config.file.root,
});

const textType = 'text/plain';
const formType = 'application/x-www-form-urlencoded';
const imageType = 'image/jpeg';

server.onGet = ({path}) => {
    switch (path) {
        case '/':
            return htmlResponse(new Resource('index.html'));

        case '/reset':
            params.reset();
            params.text = initialText();
            update();
            return okResponse();

        case '/info':
            return jsonResponse({
                ip: Net.get("IP"),
                ssid: Net.get("SSID"),
                hostName,
                fonts: Object.keys(fonts),
                ...getDimention(),
            });

        case '/status':
            return jsonResponse(params.status());

        default:
            return notFound();
    }
};

server.onPost = ({path, contentType, body, file}) => {
    const ifText = (prepareIt, doIt) => ifTypeIs([textType, formType], contentType, prepareIt, doIt, update);
    const ifImage = (prepareIt, doIt) => ifTypeIs([imageType], contentType, prepareIt, doIt, update);

    switch (path) {
        case '/busy': {
            const message = body ?? "BUSY!";
            return ifText(() => message, value => {
                params.text = value;
                params.color = 'white';
                params.background = 'maroon';
            });
        }

        case '/open': {
            const message = body ?? "Good to go!";
            return ifText(() => message, value => {
                params.text = value;
                params.color = 'white';
                params.background = 'green';
            });
        }

        case '/text':
            return ifText(() => body, value => params.text = value);

        case '/color':
            return ifText(() => checkColor(body) ? body : undefined, value => params.color = value);

        case '/background':
            return ifText(() => checkColor(body) ? body : undefined, value => params.background = value);
    
        case '/font':
            return ifText(() => body in fonts ? body : undefined, value => params.font = value);

        case '/image':
            return ifImage(() => file ? file : body, value => params.image = value);

        default:
            return notFound();
    }
};

server.onDelete = ({path}) => {
    switch (path) {
        case '/':
            params.text = undefined;
            params.color = undefined;
            params.background = undefined;
            params.font = 'L';
            params.image = undefined;
            break;

        case '/text':
            params.text = undefined;
            break;

        case '/color':
            params.color = undefined;
            break;

        case '/background':
            params.background = undefined;
            break;

        case '/font':
            params.font = 'L';
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

params.init();
if (!params.text) params.text = initialText();
update();
