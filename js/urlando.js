function getHeight(resolution, ratio) {
    const ratioSplit = ratio.split('/');

    return (resolution / ratioSplit[0]) * ratioSplit[1];
}

function getPosition(idx, width, height) {
    return {
        x: (idx % 3) * width,
        y: Math.floor(idx / 3) * height
    };
}

function openOptions() {
    chrome.app.window.create('../view/options.html', {
      'bounds': { 'width': 1024, 'height': 768 }
    });
}

function loadOptions() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get((options) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }

            if (options.hasOwnProperty('urls')) {
                resolve(options);
                return;
            }

            openOptions();
        });
    });
}

class Urlando extends Main {

    constructor() {
        super();

        this.currentView = null;
        this.views = null;
        this.animationIsRunning = false;
        this.$el = $('#iFrames');
        this.osd = new OSD();
        this.viewMatrix = [];
    }

    init(options) {
        const { osd, osdTimeout } = options;

        this.options = this.prepareOptions(options);
        this.osd.trigger('isActivated', { osd, osdTimeout });
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        const { osd } = this.options;

        this.bindShortcuts({
            'mod+s': this.toggleAnimation.bind(this),
            'mod+o': openOptions,
            'mod+0': this.showOverview.bind(this),
            'mod+1': this.showView.bind(this),
            'mod+2': this.showView.bind(this),
            'mod+3': this.showView.bind(this),
            'mod+4': this.showView.bind(this),
            'mod+5': this.showView.bind(this),
            'mod+6': this.showView.bind(this),
            'mod+7': this.showView.bind(this),
            'mod+8': this.showView.bind(this),
            'mod+9': this.showView.bind(this),
            'mod+right': this.nextView.bind(this),
            'mod+left': this.previousView.bind(this),
            'mod+down': this.switchToViewBelow.bind(this),
            'mod+up': this.switchToViewAbove.bind(this)
        });

        $(window)
            .off('resize')
            .on('resize', this.debounce(this.render.bind(this), 500));

        if (osd) {
            this.$el
                .off()
                .on('mousemove', () => this.osd.trigger('show'));
        }
    }

    updateOptions() {
        loadOptions()
            .then(this.init.bind(this))
            .catch(console.error); // eslint-disable-line
    }

    switchToRandomFrame() {
        const nrOfViews = this.views.length;
        const nextViewNr = Math.floor(Math.random() * nrOfViews);

        this.currentView.trigger('inactive');
        this.currentView = this.views[nextViewNr];
        this.transitionToView();
    }

    switchToNextFrame() {
        const nrOfViews = this.views.length;
        const currentViewNr = this.currentView.getIdx();
        const nextViewNr = currentViewNr + 1;

        this.currentView.trigger('inactive');
        this.currentView = this.views[nextViewNr >= nrOfViews ? 0 : nextViewNr];
        this.transitionToView();
    }

    switchToPrevFrame() {
        const nrOfViews = this.views.length;
        const currentViewNr = this.currentView.getIdx();
        const prevViewNr = currentViewNr - 1;

        this.currentView.trigger('inactive');
        this.currentView = this.views[prevViewNr < 0 ? nrOfViews -1 : prevViewNr];
        this.transitionToView();
    }

    switchToViewAbove() {
        const length = this.views.length;
        const currentViewNr = this.currentView.getIdx();
        const possibleNext = currentViewNr - 3;

        this.currentView.trigger('inactive');

        if (length < 4) {
            return;
        }

        if (possibleNext > 0) {
            this.currentView = this.views[possibleNext];
            this.transitionToView();
            return;
        }

        const nextViewNr = this.getNextViewNrFomMatrix(currentViewNr, false);

        this.currentView = this.views[nextViewNr];
        this.transitionToView();
    }

    switchToViewBelow() {
        const length = this.views.length;
        const currentViewNr = this.currentView.getIdx();
        const possibleNext = currentViewNr + 3;

        this.currentView.trigger('inactive');

        if (length < 4) {
            return;
        }

        if (possibleNext < length) {
            this.currentView = this.views[possibleNext];
            this.transitionToView();
            return;
        }

        const nextViewNr = this.getNextViewNrFomMatrix(currentViewNr, true);

        this.currentView = this.views[nextViewNr];
        this.transitionToView();
    }

    getNextViewNrFomMatrix(idx, down) {
        const x = Math.floor(idx / 3);
        const y = idx % 3;
        const matrix = this.viewMatrix;
        const length = matrix.length;

        if (down) {
            const possibleNext = matrix[x + 1] && matrix[x + 1][y];

            return typeof possibleNext === 'undefined' ? matrix[0][y] : possibleNext;
        }

        const possibleNext = matrix[length - 1] && matrix[length - 1][y];

        return typeof possibleNext === 'undefined' ? matrix[length - 2][y] : possibleNext;
    }

    prepareOptions(options) {
        const { duration } = options;
        let urls;

        if (typeof options.urls === 'string') {
            urls = JSON.parse(options.urls);
        } else {
            urls = options.urls;
        }


        return Object.assign(
            {},
            this.options,
            options,
            {
                urls,
                duration: parseInt(duration, 10) * 1000
            }
        );
    }

    render() {
        const {
            resolution,
            ratio,
            urls
        } = this.options;
        let width = resolution;
        let height = 0;

        if (resolution !== 'full') {
            height = getHeight(resolution, ratio);
        } else {
            height = window.innerHeight;
            width = window.innerWidth;
        }

        this.$el.empty();

        this.views = urls.map(({ url, showTitle, title }, idx) => {
            const { x, y } = getPosition(idx, width, height);
            const view = new View({
                url,
                showTitle,
                title,
                width,
                height,
                idx,
                x,
                y
            }, this.osd);

            this.addIndexToMatrix(idx);
            view.addTo(this.$el);

            return view;
        });

        this.currentView = this.views[0];

        // timeout necessary because of the css transition time, otherwise false dimensions
        setTimeout(() => {
            this.views.forEach((view) => view.addStyles());
        }, 2000);
    }

    addIndexToMatrix(idx) {
        const matrix = this.viewMatrix;
        const x = Math.floor(idx / 3);
        const y = idx % 3;

        if (typeof matrix[x] === 'undefined') {
            matrix[x] = [];
        }

        matrix[x][y] = idx;

        this.viewMatrix = [].concat(matrix);
    }

    animate() {
        const { random } = this.options;
        const timeout = this.animationIsRunning ? 5000 : 0;

        if (this.isOverview) {
            return;
        }

        this.showOverview();
        setTimeout(() => {
            random ? this.switchToRandomFrame() : this.switchToNextFrame();
        }, timeout);
    }

    transitionToView() {
        const { reload } = this.options;
        const { x, y } = this.currentView.getPosition();

        if (reload) {
            this.currentView.reload();
        }

        this.currentView.trigger('active');
        this.isOverview = false;
        this.addCssToElem(this.$el, { transform: `translate(${-x}px, ${-y}px)` });
    }

    startAnimation() {
        const { duration } = this.options;

        if (this.animationIsRunning) {
            return;
        }

        this.animationIsRunning = true;
        this.displayStatus('animation started');
        this.osd.trigger('toggleAnimation', this.animationIsRunning);
        this.animationIntervalId = setInterval(this.animate.bind(this), duration);
    }

    stopAnimation() {
        if (!this.animationIsRunning) {
            return;
        }

        this.animationIsRunning = false;
        this.displayStatus('animation stopped');
        this.osd.trigger('toggleAnimation', this.animationIsRunning);
        clearInterval(this.animationIntervalId);
    }

    toggleAnimation() {
        this.animationIsRunning ? this.stopAnimation() : this.startAnimation();
    }

    showOverview() {
        const nrOfViews = this.views.length;
        const scalingY = 1 / Math.ceil(nrOfViews / 3);
        let scalingX;

        switch (nrOfViews) {
            case 1:
                scalingX = 1;
                break;
            case 2:
                scalingX = 1 / 2;
                break;
            default:
                scalingX = 1 / 3;
        }

        this.isOverview = true;
        this.addCssToElem(this.$el, { transform: `scale(${scalingX}, ${scalingY})` });
    }

    showView(event, keycombo) {
        const nrOfViews = this.views.length;
        const viewNr = parseInt(keycombo.replace('mod+', ''), 10) - 1;

        if (viewNr >= nrOfViews) {
            return;
        }

        this.currentView = this.views[viewNr];
        this.stopAnimation();
        this.transitionToView();
    }

    nextView() {
        this.stopAnimation();
        this.switchToNextFrame();
    }

    previousView() {
        this.stopAnimation();
        this.switchToPrevFrame();
    }
}

$(() => {
    const urlando = new Urlando();

    chrome.runtime.onMessage.addListener(urlando.updateOptions.bind(urlando));
    loadOptions()
        .then(urlando.init.bind(urlando))
        .catch(console.error); // eslint-disable-line
});
