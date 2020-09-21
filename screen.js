/*
 * Copyright (c) 2020 Basuke
*/

import Poco from "commodetto/Poco";
import JPEG from "commodetto/readJPEG";
import { File } from "file";
import Resource from "Resource";
import parseBMF from "commodetto/parseBMF";

export const fonts = {
    S: parseBMF(new Resource("OpenSans-Semibold-16.bf4")),
    M: parseBMF(new Resource("OpenSans-Semibold-20.bf4")),
    L: parseBMF(new Resource("OpenSans-Semibold-28.bf4")),
};


if (screen.rotation !== undefined) {
    screen.rotation = 270;
}

export const render = new Poco(screen, { displayListLength: 2048 });

export function getDimention() {
    return { width: render.width, height:render.height };
}

export function draw(task) {
    render.begin();
    task(render);
    render.end();
}

function hex(str, offset, count) {
    let result = parseInt(str.substring(offset, offset + count), 16);
    if (count === 1)
        result *= 17;
    return result;
}

function rgba(name) {
    if (!name) return false;

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

            default:
                return false;
        }
    }
    return [red, green, blue, alpha];
}

export function makeColor(name) {
    return render.makeColor(...(rgba(name) ?? [0, 0, 0, 0]));
}

export function checkColor(name) {
    return !!rgba(name);
}

export function drawOntoJpeg(path, task) {
    try {
        const jpeg = new JPEG();
        let file = new File(path);
    
        while (file) {
            while (file) {
                const bytes = file.read(ArrayBuffer, 1024);
                jpeg.push(bytes);
                if (file.position === file.length) {
                    jpeg.push();
                    file.close();
                    file = undefined;
                }
                if (jpeg.ready) break;
            }

            while (jpeg.ready) {
                const block = jpeg.read();
                render.begin(block.x, block.y, block.width, block.height);
                render.drawBitmap(block, block.x, block.y);
                task(render);
                render.end();
            }
        }
    } catch (error) {
        trace(`screen.js: ${error}\n`);
        return false;
    }

    return true;
}
