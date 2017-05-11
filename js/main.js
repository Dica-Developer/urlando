const bindKey = Mousetrap.bind;

function getIframeMarkup(options) {
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

function addIFrames(urls) {
    $('#iFrames')
        .removeAttr('style')
        .empty();

    urls.forEach((options) => {
        const iFrameMarkup = getIframeMarkup(options);

        $(iFrameMarkup).appendTo('#iFrames');
    });
}

function displayStatus(status) {
    const message = $('#statusMessage');

    message
        .text(status)
        .animate({ opacity: 1 }, 1250, () => {
            message.animate({ opacity: 0 }, 1250);
        });
}

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

function getFramePosition(iframe) {
    const nextiFrame = $('.iFrames').eq(iframe);

    return nextiFrame.data();
}

function openOptions() {
    chrome.app.window.create("../view/options.html", {
      "bounds": {
        "width": 684,
        "height": 550
      }
    });
}

function addCSSStyles() {
    const { innerWidth, innerHeight } = window;

    $('.iFrames').each(function() {
        const elem = $(this);
        const { x, y}  = elem.data();

        elem.css('transform', `translate(${x}px, ${y}px)`);
        elem.find('webview').css({ height: innerHeight, width: innerWidth });
    });
}

function addCSSStylesWithScaleFix() {
    $('.iFrames').each(function () {
        const elem = $(this);
        const { x, y } = elem.data();

        elem.css('transform', `translate(${x + 946}px, ${y + 330}px) scale(1.74, 1.41)`);
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

class Urlando {

    constructor() {
        this.currentFrameNr = 0;
        this.animationIsRunning = false;
        this.isInOverview = false;
        this.bindKeys();
    }

    init(options) {
        this.options = this.prepareOptions(options);
        this.render();
    }

    updateOptions() {
        loadOptions()
            .then(this.init.bind(this))
            .catch(console.error); // eslint-disable-line
    }

    switchToRandomFrame() {
        const { nrOfiFrames } = this.options;

        this.currentFrameNr = Math.floor(Math.random() * nrOfiFrames);
        this.transitionToFrame();
    }

    switchToNextFrame() {
        const { nrOfiFrames } = this.options;
        const nextFramNr = this.currentFrameNr + 1;

        this.currentFrameNr = nextFramNr >= nrOfiFrames ? 0 : nextFramNr;
        this.transitionToFrame();
    }

    switchToPrevFrame() {
        const { nrOfiFrames } = this.options;
        const prevFrameNr = this.currentFrameNr - 1;

        this.currentFrameNr = prevFrameNr < 0 ? nrOfiFrames - 1 : prevFrameNr;
        this.transitionToFrame();
    }

    prepareOptions(options){
        const urls = JSON.parse(options.urls);
        const {
            reload,
            duration,
            resolution,
            ratio,
            random,
            chromeScalingFix
        } = options;

        return Object.assign(
            {},
            this.options,
            {
                reload,
                resolution,
                ratio,
                random,
                chromeScalingFix,
                urls,
                nrOfiFrames: urls.length,
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

        const iFrameOptions = urls.map(({ url }, idx) => {
            const { x, y } = getPosition(idx, width, height);

            return {
                url,
                idx,
                x,
                y
            };
        });

        addIFrames(iFrameOptions);

        // timeout necessary because of the css transition time, otherwise false dimensions
        setTimeout(this.applyStyles.bind(this), 2000);
    }

    reloadFrame() {
        const frame = $(`#iFrame_${this.currentFrameNr}`);
        const { url } = frame.data();

        frame.attr('src', url);
    }

    animate() {
        const { random } = this.options;
        const timeout = this.animationIsRunning ? 5000 : 0;

        if (this.isInOverview) {
            return;
        }

        this.showOverview();
        setTimeout(() => {
            random ? this.switchToRandomFrame() : this.switchToNextFrame();
        }, timeout);
    }

    transitionToFrame() {
        const { reload } = this.options;
        const { x, y } = getFramePosition(this.currentFrameNr);

        if (reload) {
            this.reloadFrame();
        }

        $('#iFrames').css('transform', `translate(${-x}px, ${-y}px) scale(1,1)`);

        this.applyStyles();
    }

    applyStyles() {
        const { chromeScalingFix } = this.options;

        // TODO throw an event here!
        if (!chromeScalingFix) {
            addCSSStyles();
        } else {
            addCSSStylesWithScaleFix();
        }
    }

    startAnimation() {
        const { duration } = this.options;

        if (this.animationIsRunning) {
            return;
        }

        this.animationIsRunning = true;
        displayStatus('animation started');
        this.animationIntervalId = setInterval(this.animate.bind(this), duration);
    }

    stopAnimation() {
        if (!this.animationIsRunning) {
            return;
        }

        this.animationIsRunning = false;
        displayStatus('animation stopped');
        clearInterval(this.animationIntervalId);
    }

    toggleAnimation() {
        this.animationIsRunning ? this.stopAnimation() : this.startAnimation();
    }

    showOverview() {
        const { nrOfiFrames } = this.options;
        const scalingY = 1 / Math.ceil(nrOfiFrames / 3);
        let scalingX;

        switch (nrOfiFrames) {
            case 1:
                scalingX = 1;
                break;
            case 2:
                scalingX = 1 / 2;
                break;
            default:
                scalingX = 1 / 3;
        }

        $('#iFrames').css('transform', `translate(0px,0px) scale(${scalingX}, ${scalingY})`);

        this.applyStyles();
    }

    showFrame(event, keycombo) {
        const { nrOfiFrames } = this.options;
        const frameNr = parseInt(keycombo.replace('mod+', ''), 10) - 1;

        if (frameNr >= nrOfiFrames) {
            return;
        }

        this.currentFrameNr = frameNr;
        this.transitionToFrame();
    }

    nextFrame() {
        this.stopAnimation();
        this.switchToNextFrame();
    }

    previousFrame() {
        this.stopAnimation();
        this.switchToPrevFrame();
    }

    bindKeys() {
        bindKey({
            'mod+s': this.toggleAnimation.bind(this),
            'mod+o': openOptions,
            'mod+0': this.showOverview.bind(this),
            'mod+1': this.showFrame.bind(this),
            'mod+2': this.showFrame.bind(this),
            'mod+3': this.showFrame.bind(this),
            'mod+4': this.showFrame.bind(this),
            'mod+5': this.showFrame.bind(this),
            'mod+6': this.showFrame.bind(this),
            'mod+7': this.showFrame.bind(this),
            'mod+8': this.showFrame.bind(this),
            'mod+9': this.showFrame.bind(this),
            'mod+right': this.nextFrame.bind(this),
            'mod+left': this.previousFrame.bind(this)
        });
    }

}

$(function () {
    const urlando = new Urlando();

    chrome.runtime.onMessage.addListener(urlando.updateOptions.bind(urlando));
    loadOptions()
        .then(urlando.init.bind(urlando))
        .catch(console.error); // eslint-disable-line
});
