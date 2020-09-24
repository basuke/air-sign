import Preference from "preference";

export const domain = 'air-sign';

export const params = {
    version: 2,

    read(key) { return Preference.get(domain, key) },
    write(key, value) {
        if (value === null || value === undefined) {
            Preference.delete(domain, key);
        } else {
            Preference.set(domain, key, value);
        }
    },

    get text() { return this.read('text') },
    get color() { return this.read('color') },
    get background() { return this.read('background') },
    get font() { return this.read('font') },
    get image() { return this.read('image') },

    set text(value) { this.write('text', value) },
    set color(value) { this.write('color', value) },
    set background(value) { this.write('background', value) },
    set font(value) { this.write('font', value) },
    set image(value) { this.write('image', value) },

    reset() {
        this.text = undefined;
        this.color = 'white';
        this.background = 'black';
        this.font = 'L';
        this.image = null;
    },

    init() {
        const savedVersion = this.read('version');
        if (savedVersion != this.version) {
            this.write('version', this.version);
            this.reset();
        }
    },

    status() {
        return {
            text: this.text,
            color: this.color,
            background: this.background,
            font: this.font,
            image: this.image,
        };
    }
};

export default params;
