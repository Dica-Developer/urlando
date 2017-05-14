class OSD extends Main {
    constructor(elem) {
        super();

        this.$el = elem;
        this.timeout = null;
        this.timeoutId = null;

        this.on('isActivated', this.bindEvents.bind(this));
    }

    show() {
        this.addCssToElem(this.$el, { top: 0 });

        if (this.timeout) {
            clearTimeout(this.timeoutId);
            setTimeout(this.hide.bind(this), this.timeout);
        }
    }

    hide() {
        this.addCssToElem(this.$el, { top: -50 });
    }

    bindEvents() {
    }
}

class MainOSD extends OSD {
    constructor(elem) {
        super(elem);

        this.timeout = null;
    }

    bindEvents(options) {
        const { osd, osdTimeout } = options;

        if (!osd) {
            return;
        }

        this.timeout = osdTimeout;
        this.on('show', this.throttle(this.show.bind(this), osdTimeout));
    }

    show() {
        super.show();
    }
}

window.MainOSD = MainOSD;
