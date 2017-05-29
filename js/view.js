function getMarkup(url) {
    return `
        <div class="view">
           <webview src="${url}" ></webview>
        </div>
    `;
}

class View extends window.Main{
    constructor(options, osd) {
        super();

        this.osd = osd;
        this.options = options;
        this.on('active', this.isActive.bind(this));

        const { url } = this.options;
        const markup = getMarkup(url);

        this.$el = $(markup);
    }

    addTo(elem) {
        elem.append(this.$el);
    }

    addStyles() {
        const { x, y, width, height } = this.options;

        this.addCssToElem(this.$el, { transform: `translate(${x}px, ${y}px)` });
        this.addCssToElem(this.$el.find('webview'), { height , width });
    }

    getPosition() {
        const { x, y } = this.options;

        return { x, y };
    }

    getIdx() {
        const { idx } = this.options;

        return idx;
    }

    isActive() {
        const { showTitle, title, url } = this.options;

        if (!showTitle) {
            this.osd.trigger('clearTitle');
            return;
        }

        this.osd.trigger('setTitle', title !== '' ? title : url);
    }

    reload() {
        const { url } = this.options;

        this.$el.find('webview').attr('src', url);
    }
}

window.View = View;
