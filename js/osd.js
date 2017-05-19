class OSD extends Main {
    constructor() {
        super();

        this.$el = $('.osd');
        this.timeout = null;
        this.timeoutId = null;

        this.on('isActivated', this.bindEvents.bind(this));
    }

    show() {
        this.setTime();

        this.addCssToElem(this.$el, { top: 0 });

        if (this.timeout) {
            clearTimeout(this.timeoutId);
            setTimeout(this.hide.bind(this), this.timeout);
        }
    }

    hide() {
        this.addCssToElem(this.$el, { top: -30 });
    }

    bindEvents(options) {
        const { osd, osdTimeout } = options;

        if (!osd) {
            return;
        }

        this.timeout = osdTimeout;
        this.on('show', this.throttle(this.show.bind(this), osdTimeout));
        this.on('setTitle', this.setTitle.bind(this));
        this.on('clearTitle', this.clearTitle.bind(this));
        this.on('toggleAnimation', this.toggleAnimationStatus.bind(this));
    }

    clearTitle() {
        this.setTitle('');
    }

    setTitle(title) {
        this.$el.find('.title').text(title);
    }

    setTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('us', { // todo make locale customizable
            hour: '2-digit',
            minute: '2-digit'
        });

        this.$el.find('.time').text(timeString);
    }

    toggleAnimationStatus(animationRunning) {
        this.$el.find('.animation')
            .toggleClass('play', animationRunning)
            .toggleClass('pause', !animationRunning);
    }
}

window.OSD = OSD;
