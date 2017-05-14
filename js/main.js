const bindKeys = Mousetrap.bind;
const resetKeys = Mousetrap.reset;

class Main {

    static getFramesTemplate(options) {
        const {
            idx,
            x,
            y,
            url
        } = options;

        return `
            <div id="step_${idx}" class="iFrames" data-x="${x}" data-y="${y}">
                <webview id="iFrame_${idx}" data-url="${url}" src="${url}" ></webview>
            </div>
        `;
    }

    constructor() {
        this.observers = {};
        this.$status = $('#statusMessage');
    }

    on(event, listener) {

        if (!this.observers[event]) {
            this.observers[event] = [];
        }

        this.observers[event].push(listener);
    }

    off(event, listener) {
        const functions = this.observers[event];

        if (!functions) {
            return;
        }

        if (!listener) {
            this.observers[event] = [];
            return;
        }

        this.observers[event] = functions.reduce((acc, fn) => {
            if (fn !== listener) {
                acc.push(fn);
            }

            return acc;
        }, []);
    }

    trigger(event, data) {
        const listener = this.observers[event];

        if (!listener) {
            return;
        }

        listener.forEach((fn) => fn.call(this, data));
    }

    addCssToElem(element, style) {
        element.css(style);
    }

    displayStatus(status) {
        this.$status.text(status);
        this.addCssToElem(this.$status, { opacity: 1 });
        setTimeout(() => {
            this.addCssToElem(this.$status, { opacity: 0 });
        }, 1250);
    }

    bindShortcuts(shortcuts) {
        resetKeys();
        bindKeys(shortcuts);
    }
}

window.Main = Main;
