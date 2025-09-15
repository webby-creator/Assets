nunjucks.configure({ autoescape: false });

const scriptElement = document.getElementById('cmsData');

if (scriptElement == null) {
    throw new Error("Missing CMS Data Script");
}

const script = JSON.parse(scriptElement.text);

const cachedCms = {};

// Select all items in body
const nodeList = document.querySelectorAll('body [data-guid]');

// TODO: Only load dataset when needed.
for (const data of script.datasets) {
    const url = `/.tst/data/${document.body.dataset.websiteId}/${data.id}?limit=${data.limit}`;

    fetch(url)
        .then(resp => resp.json())
        .then(json => new Promise((res, rej) => {
            if (json.type == 'Resp') {
                return res(json.value);
            } else {
                return rej(json.value.description);
            }
        }))
        .then(list => {
            cachedCms[data.id] = list;
            updateDom(nodeList, data.id);
        })
        .catch(console.error);
}

function updateDom(nodeList, cmsId) {
    // items, offset, limit, total
    const cache = cachedCms[cmsId];

    // guid, id, references, store{cms_id,column_name}, type, className
    for (const element of nodeList) {
        const object = script.objects.find(o => o.id == element.dataset.id);

        if (object == null) {
            throw new Error("Unable to find Object " + element.dataset.id, element);
        }

        // If the object is not apart of the current CMS ID we loaded. Continue.
        if (object.store.cms_id != cmsId) {
            continue;
        }

        if (element == null) {
            throw new Error("Unable to find Element " + object.id);
        }

        if (object.type == "repeater") {
            // references should exist

            // 1. Remove all repeaters
            while (element.children.length != 0) {
                element.firstChild.remove();
            }

            const children = [];

            for (let index = 0; index < cache.items.length; index++) {
                children.push(compileChild(object.children[0], cache.items[index]));
            }

            element.innerHTML = children.join('');
        } else if (object.store.column_name != null) {
            // TODO: Ensure this is how I want to do it.
            element.outerHTML = compileChild(object, cache.items[0]);
        }
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll('&', '&amp;')
        .replaceAll('`', '&#x60;')
        .replaceAll('=', '&#x3D;')
        .replaceAll('{', '&#123;')
        .replaceAll('}', '&#125;');
}

/**
 * @param {string} value
 */
function splitTextWithLineBreaks(value) {
    const lines = value.split('\n');
    if (lines.length == 1) return value;

    return lines.map((v, i) => {
        const trimmed = v.trimStart();
        const startingSpacesCount = v.length - trimmed.length;

        if (startingSpacesCount != 0) {
            return ' '.repeat(startingSpacesCount) + trimmed + (lines.length != i + 1 ? '<br/>' : '');
        } else {
            return v;
        }
    });
}

function compileChild(child, cacheItem) {
    const children = child.children != null ? child.children.map(c => compileChild(c, cacheItem)) : [];
    // TODO: RepeaterItem's will have the same ID. Should it?
    const attrs = {
        "data-id": child.id,
        "data-type": child.type,
        "data-guid": child.guid
    };

    switch (child.type) {
        case 'text':
            return compileTemplate(child.type, {
                attrs: Object.entries(attrs).map(value => `${value[0]}="${value[1]}"`).join(' '),
                class_name: child.className,
                tag: child.data.type_of == 'heading' ? `h${child.data.size + 1}` : 'p',
                tag_class_name: `${child.data.type_of == 'heading' ? 'h' : 'p'}${child.data.size + 1}`,
                value: splitTextWithLineBreaks(escapeHtml(cacheItem.fields[child.store.column_name] ?? '[Doesn\'t Exist]')),
            });

        default:
            console.log('Unhandled Type ' + child.type);
            break;
    }

    return compileTemplate(child.type, {
        class_name: child.className,
        attrs: Object.entries(attrs).map(value => `${value[0]}="${value[1]}"`).join(' '),
        children
    });
}

/**
 * @param {string} name
 * @param {object} args
 */
function compileTemplate(name, args) {
    const template = script.templates[name];

    if (template == null) {
        throw new Error("Unable to find Template " + name);
    }

    return nunjucks.renderString(template, args);
}