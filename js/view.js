function getMarkup(url) {
    return `
        <div class="view">
           <webview src="${url}" ></webview>
        </div>
    `;
}

class View extends window.Main{
    constructor(options) {
        super();

        this.options = options;

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

    reload() {
        const { url } = this.options;

        this.$el.find('webview').attr('src', url);
    }
}

window.View = View;
