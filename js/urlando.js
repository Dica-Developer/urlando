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
      'bounds': { 'width': 684, 'height': 550 }
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
    }

    init(options) {
        this.options = this.prepareOptions(options);
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        $(window).on('resize', this.render.bind(this));
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
            'mod+left': this.previousView.bind(this)
        });
    }

    updateOptions() {
        loadOptions()
            .then(this.init.bind(this))
            .catch(console.error); // eslint-disable-line
    }

    switchToRandomFrame() {
        const nrOfViews = this.views.length;
        const nextViewNr = Math.floor(Math.random() * nrOfViews);

        this.currentView = this.views[nextViewNr];
        this.transitionToView();
    }

    switchToNextFrame() {
        const nrOfViews = this.views.length;
        const currentViewNr = this.currentView.getIdx();
        const nextViewNr = currentViewNr + 1;

        this.currentView = this.views[nextViewNr >= nrOfViews ? 0 : nextViewNr];
        this.transitionToView();
    }

    switchToPrevFrame() {
        const nrOfViews = this.views.length;
        const currentViewNr = this.currentView.getIdx();
        const prevViewNr = currentViewNr - 1;

        this.currentView = this.views[prevViewNr < 0 ? nrOfViews -1 : prevViewNr];
        this.transitionToView();
    }

    prepareOptions(options){
        const urls = JSON.parse(options.urls);
        const { duration } = options;

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
            urls,
            osd
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

        this.views = urls.map(({ url }, idx) => {
            const { x, y } = getPosition(idx, width, height);
            const view = new View({
                url,
                width,
                height,
                idx,
                x,
                y
            });

            view.addTo(this.$el);

            return view;
        });


        if (osd) {
            this.addOSD();
        }

        this.currentView = this.views[0];

        // timeout necessary because of the css transition time, otherwise false dimensions
        setTimeout(() => {
            this.views.forEach((view) => view.addStyles());
        }, 2000);
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
        this.animationIntervalId = setInterval(this.animate.bind(this), duration);
    }

    stopAnimation() {
        if (!this.animationIsRunning) {
            return;
        }

        this.animationIsRunning = false;
        this.displayStatus('animation stopped');
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

    addOSD() {
        this.bindOSDEvent();
    }

    showOSD() {
        const { osdTimeout } = this.options;

        $('#osd').show();

        clearTimeout(this.osdTimeoutId);
        this.osdTimeoutId = setTimeout(() => {
            $('#osd').hide();
        }, osdTimeout);
    }

    bindOSDEvent() {
        const { osdTimeout } = this.options;

        $('#iFrames').on('mousemove', throttle(this.showOSD.bind(this), osdTimeout));
    }

}

$(() => {
    const urlando = new Urlando();

    chrome.runtime.onMessage.addListener(urlando.updateOptions.bind(urlando));
    loadOptions()
        .then(urlando.init.bind(urlando))
        .catch(console.error); // eslint-disable-line
});
