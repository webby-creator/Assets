define("fetch/index", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
    exports.fetchJson = fetchJson;
    // TODO: At some point this'll have to work through a webworker.
    function default_1(input, init) {
        return fetch(input, init);
    }
    async function fetchJson(input, init) {
        const resp = await fetch(input, init);
        const json = await resp.json();
        if (json.type == 'Resp') {
            return json.value;
        }
        else {
            throw new Error(json.value.description);
        }
    }
});
define("window/index", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_2;
    console.log('FETCH');
    function default_2() {
        console.log('FUNCTION');
    }
});
define("data/dataBuilder", ["require", "exports", "webby-fetch"], function (require, exports, webby_fetch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataBuilder = void 0;
    class DataBuilder {
        collectionId;
        offset = 0;
        limit = 50;
        descending = '_createdAt';
        // include: null = null;
        filters = [];
        constructor(collectionId) {
            this.collectionId = collectionId;
            //
        }
        filter(name, cond, value) {
            this.filters.push({
                name,
                cond,
                value
            });
            return this;
        }
        // ascending
        // count
        // descending
        // distinct
        // fields
        // find
        // include
        // limit
        // skip
        // and
        // between
        // contains
        // endsWith
        // hasAll
        // hasSome
        // isEmpty
        // isNotEmpty
        // not, or
        // startsWith
        async find() {
            const query = [
                `limit=${this.limit}`,
                `offset=${this.offset}`,
            ];
            // filters[0][name]=test&filters[0][check]=eq&filters[0][value]=best
            for (let index = 0; index < this.filters.length; index++) {
                const filter = this.filters[index];
                query.push(`filters[${index}][name]=${filter.name}`);
                query.push(`filters[${index}][cond]=${filter.cond}`);
                query.push(`filters[${index}][value]=${filter.value}`);
            }
            // if (sort != null && sort.length != 0) {
            //     query.push(sort.map(s => `sort[${s.field}]=${s.order}`).join('&'));
            // }
            let resp = await (0, webby_fetch_1.fetchJson)(`https://api.wibbly.one/cms/${$t.storeId}/data/${this.collectionId}/query?${query.join('&')}`);
            return resp;
        }
    }
    exports.DataBuilder = DataBuilder;
});
define("data/index", ["require", "exports", "webby-fetch", "data/dataBuilder"], function (require, exports, webby_fetch_2, dataBuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.get = get;
    exports.query = query;
    // aggregate()
    // bulkInsert()
    // bulkRemove()
    // bulkSave()
    // bulkUpdate()
    // filter()
    // { files: [], fields {} }
    async function get(collId, itemId) {
        let resp = await (0, webby_fetch_2.fetchJson)(`https://api.wibbly.one/cms/${$t.storeId}/data/${collId}/row/${itemId}`);
        return resp;
    }
    // insert()
    // insertReference()
    // isReferenced()
    function query(collId) {
        return new dataBuilder_1.DataBuilder(collId);
    }
});
// queryReferenced()
// remove()
// removeReference()
// replaceReferences()
// save()
// sort()
// truncate()
// update()
// NOTE: Should only be used inside of a Widget Panel for now. Actual widgets utilize `$widget`
define("widget/index", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getProps = getProps;
    exports.setProps = setProps;
    exports.getDesignPreset = getDesignPreset;
    exports.setDesignPreset = setDesignPreset;
    exports.getNestedWidget = getNestedWidget;
    // The reason for Promises
    // Widgets will be inside their own iframes - we'll be sending messages out of it and waiting for a reply.
    async function getProps() {
        window.parent.postMessage({
            type: 'panelEvent',
            event: 'getProps',
        });
        return new Promise((resolve) => {
            function listener(event) {
                if (event.data.type == 'panelEvent' && event.data.event == 'getProps') {
                    window.removeEventListener('message', listener);
                    resolve(event.data.data);
                }
            }
            window.addEventListener('message', listener);
        });
    }
    async function setProps(value) {
        if (typeof value != 'object') {
            throw new Error('Value must be an object');
        }
        window.parent.postMessage({
            type: 'panelEvent',
            event: 'setProps',
            data: value,
        });
        return new Promise((resolve) => {
            function listener(event) {
                if (event.data.type == 'panelEvent' && event.data.event == 'setProps') {
                    window.removeEventListener('message', listener);
                    resolve(event.data.data);
                }
            }
            window.addEventListener('message', listener);
        });
    }
    async function getDesignPreset() {
        return '';
    }
    async function setDesignPreset(preset) {
        //
    }
    async function getNestedWidget(selector) {
        return {};
    }
    exports.default = {
        getProps,
        setProps,
        getDesignPreset,
        getNestedWidget,
        setDesignPreset,
    };
});
