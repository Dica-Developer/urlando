const DEFAULT_OPTIONS = {
    chromeScalingFix: false,
    duration: '60',
    osd: false,
    osdTimeout: 5000,
    random: false,
    ratio: '16/9',
    reload: false,
    resolution: 'full'
};

function getUrlMarkup({ url='', showTitle=false, title='' }) {
    return `
        <div class="urlInputDiv" >
            <input type="text" value="${url}" size="65" />
            <button type="button" class="remove">Remove</button>
            <button type="button" class="add">Add</button>
            <input type="checkbox" class="show_title" ${showTitle ? 'checked' : ''} />
            <label>Show Title</label>
            <div>
                <input
                    type="text"
                    size="50"
                    class="url_title"
                    value="${title}"
                    placeholder="Leave blank to show URL"
                    style="display: ${showTitle ? 'block' : 'none'};"/>
            </div>
        </div>
    `;
}

function removeUrl() {
    const removeButton = $(this);
    const urlDiv = removeButton.parent();

    urlDiv.remove();
}

function addUrl() {
    const addButton = $(this);
    const urlDiv = addButton.parent();
    const markup = getUrlMarkup('');

    urlDiv.after(markup);
}

function showTitle() {
    const checkbox = $(this);
    const showTitleInput = checkbox.is(':checked');
    const input = checkbox.parent().find('.url_title');

    input.toggle(showTitleInput);
}

class Options {
    constructor() {
        this.generalForm = $('#general');
        this.urlForm = $('#urls');
        this.$duration = this.generalForm.find('#duration');
        this.$resolution = this.generalForm.find('#resolution');
        this.$ratio = this.generalForm.find('#ratio');
        this.$save = $('#saveOptions');
        this.$update = $('#updateOptions');
        this.$cancel = $('#cancelOptions');
    }

    init(options) {
        const { urls } = options;
        let parsedUrls = null;

        if (typeof urls === 'string') {
            parsedUrls = JSON.parse(urls);
        }
        this.options = Object.assign(
            {},
            options,
            {
                urls: parsedUrls ? parsedUrls : urls
            }
        );
        this.bindEvents();
        this.render();
    }

    render() {
        const {
            chromeScalingFix,
            duration,
            osd,
            random,
            ratio,
            reload,
            resolution,
            urls
        } = this.options;

        this.generalForm.find('#chromeScalingFix').prop('checked', chromeScalingFix);
        this.generalForm.find('#osd').prop('checked', osd);
        this.generalForm.find('#random').prop('checked', random);
        this.generalForm.find('#reload').prop('checked', reload);

        this.$ratio.find(`option[value="${ratio}"]`).prop('selected', true);
        this.$duration.find(`option[value="${duration}"]`).prop('selected', true);
        this.$resolution.find(`option[value="${resolution}"]`).prop('selected', true);

        this.renderUrls(urls);
    }

    bindEvents() {
        Mousetrap.bind('esc', chrome.app.window.current().close);

        this.$resolution.on('change', this.toggleRatio.bind(this));
        this.$save.on('click', this.save.bind(this));
        this.$update.on('click', this.update.bind(this));
        this.$cancel.on('click', this.close.bind(this));
        this.urlForm.on('click', '.remove', removeUrl);
        this.urlForm.on('click', '.add', addUrl);
        this.urlForm.on('click', '.show_title', showTitle);
    }

    toggleRatio() {
        const disableRatio = this.$resolution.val() === 'full';

        this.$ratio.prop('disabled', disableRatio);
    }

    renderUrls(urls) {
        const urlDiv = this.urlForm.find('#urlSetup');

        if (!urls || urls.length === 0) {
            const markup = getUrlMarkup('');

            urlDiv.append(markup);
            return;
        }

        urls.forEach(({ url, showTitle = false, title='' }) => {
            const markup = getUrlMarkup({ url, showTitle, title });

            urlDiv.append(markup);
        });
    }

    serialize() {
        const optionsArray = this.generalForm.serializeArray();
        const urlDivs = this.urlForm.find('.urlInputDiv');
        const options = optionsArray
            .reduce((acc, { name, value}) => {
                return Object.assign(
                    acc,
                    {
                        [name]: value === 'on' ? true : value
                    }
                );
            }, DEFAULT_OPTIONS);
        const urls = urlDivs
            .reduce((acc, elem) => {
                const div = $(elem);
                const url = div.find('input').val().trim();
                const showTitle = div.find('.show_title').is(':checked');
                const title = div.find('.url_title').val();

                if (url === '') {
                    return acc;
                }

                acc.push({ url, showTitle, title });

                return acc;
            }, []);

        return Object.assign(
            {},
            options,
            {
                urls
            }
        );
    }

    update(closeAfterUpdate = false) {
        const options = this.serialize();

        chrome.storage.local.set(options, () => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError); // eslint-disable-line
            } else {
                chrome.runtime.sendMessage('options.updated');
            }

            if (typeof closeAfterUpdate === 'boolean' && closeAfterUpdate) {
                this.close();
            }
        });
    }

    save() {
        this.update(true);
    }

    close() {
        chrome.app.window.current().close();
    }
}

const options = new Options();

chrome.storage.local.get(options.init.bind(options));
