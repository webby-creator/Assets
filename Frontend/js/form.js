async function fetchString(input, init = {}) {
    init.mode = 'cors';
    init.credentials = 'include';

    if (init.body != null && init.headers == null) {
        init.headers = {
            // "Referrer-Policy": "no-referrer-when-downgrade",
            "Content-Type": "application/json",
        };
    }

    const resp = await fetch(input, init);

    // {"type":"Resp","value":"ok"}

    return await resp.text();
}

async function fetchJson(input, init = {}) {
    init.mode = 'cors';
    init.credentials = 'include';

    const resp = await fetch(input, init);
    const json = await resp.json();

    if (json.type == 'Resp') {
        return json.value;
    } else {
        throw new Error(json.value.description);
    }
}


const websiteId = document.body.dataset['websiteId'];

let apiUrlSplit = window.location.host.split('.');
if (apiUrlSplit.length == 3) apiUrlSplit.splice(0, 1);
let apiUrl = `https://api.${apiUrlSplit.join('.')}`;

const foundForms = [...document.querySelectorAll('[data-type="contact_form"]'), ...document.querySelectorAll('[data-type="form"]')];

for (const element of foundForms) {
    const formId = element.dataset['key'];

    // Form ID can be empty if Form ID was not set
    if (formId.length != 0) {
        const url = `${apiUrl}/form/${websiteId}/${formId}/render`;

        fetchString(url, { method: 'GET' })
            .then(resp => {
                element.innerHTML = resp;
            }).catch(console.error);
    }
}

// TODO: Should be a submit function inside scripting library $t('#form1').submit();
document.addEventListener('submit', e => {
    e.stopImmediatePropagation();
    e.preventDefault();

    // We highjack submit for duplication button
    if (e.submitter.parentElement.dataset['itemType'] == 'duplication') {
        const parent = e.submitter.parentElement;

        const text = parent.firstElementChild.outerHTML;

        parent.lastElementChild.insertAdjacentHTML('beforebegin', text);
    } else if (e.submitter.type == 'submit') {
        const currentLayer = e.submitter.closest('.formi-layer');

        if (e.submitter.dataset.action == 'submit') {
            e.submitter.disabled = true;

            // Disable all buttons if we're not an embedded form
            if (viewingEmbeddedFormInfo == null) {
                for (const button of currentLayer.querySelectorAll('button')) {
                    button.disabled = true;
                }
            }

            fetchJson(
                e.target.action,
                {
                    method: 'POST',
                    body: new FormData(e.target),
                }
            )
                .then((e) => {
                    currentLayer.insertAdjacentHTML('beforeend', `<div><p>Success</p></div>`);

                    if (viewingEmbeddedFormInfo != null) {
                        viewingEmbeddedFormInfo.input.value = e.id;
                        viewingEmbeddedFormInfo.form.remove();
                        viewingEmbeddedFormInfo = null;
                    }
                })
                .catch(e => {
                    console.error(e);

                    currentLayer.insertAdjacentHTML('beforeend', `<div><p>Error: ${e}</p></div>`);
                });
        }
    }
});

// Form Button Previous/Next Click
document.addEventListener('click', e => {
    const target = e.target;
    const formElement = target.closest('form');

    if (target instanceof HTMLButtonElement && formElement != null) {
        const currentLayer = target.closest('.formi-layer');

        if (target.dataset.action == 'embed-form') {
            e.preventDefault();

            const formId = target.dataset.formId;
            const websiteId = target.dataset.websiteId;

            showEmbeddedForm(formElement, currentLayer, target, websiteId, formId);
        } else if (target.dataset.action == 'next') {
            e.preventDefault();

            if (currentLayer.nextElementSibling != null) {
                if (isLayerValid(formElement, currentLayer)) {
                    currentLayer.hidden = true;
                    currentLayer.nextElementSibling.hidden = false;

                    // TODO: Disable next layers' next button if there are invalid inputs.
                }
            }
        } else if (target.dataset.action == 'previous') {
            e.preventDefault();

            if (currentLayer.previousElementSibling != null) {
                currentLayer.hidden = true;
                currentLayer.previousElementSibling.hidden = false;
            }
        } else if (target.dataset.action == 'remove-duplication') {
            target.parentElement.remove();
        } else {
            console.warn('Unknown Action Clicked ' + target.dataset.action);
        }
    }
});

/**
 * @param {HTMLFormElement} formElement
 * @param {HTMLElement} layer
 */
function isLayerValid(formElement, layer) {
    for (const element of layer.querySelectorAll('input')) {
        if (!element.reportValidity()) {
            return false;
        }
    }

    return true;
}

let viewingEmbeddedFormInfo = null;

/**
 *
 * @param {HTMLFormElement} mainForm
 * @param {HTMLElement} mainFormLayer
 * @param {HTMLButtonElement} mainButton
 * @param {string} embeddedWebsiteId
 * @param {string} embeddedFormId
 */
function showEmbeddedForm(mainForm, mainFormLayer, mainButton, embeddedWebsiteId, embeddedFormId) {
    mainButton.disabled = true;

    const url = `${apiUrl}/form/${embeddedWebsiteId}/${embeddedFormId}/render?embedded`;

    const embeddedFormElement = document.createElement('div');
    embeddedFormElement.dataset['websiteId'] = embeddedWebsiteId;
    embeddedFormElement.dataset['formId'] = embeddedFormId;
    embeddedFormElement.dataset['formType'] = 'embedded';

    embeddedFormElement.style.width = '100%';
    embeddedFormElement.style.position = 'absolute';
    embeddedFormElement.style.top = '0';

    // TODO: Preview submitted instead if its' not a new one
    viewingEmbeddedFormInfo = {
        input: mainButton.firstElementChild,
        form: embeddedFormElement,
    };

    // const textElement = document.createElement('h2');
    // textElement.innerText = 'Updating [NAME] Form';
    // textElement.style.padding = '10px';
    // embeddedFormElement.appendChild(textElement);

    fetchString(url, { method: 'GET' })
        .then(html => {
            embeddedFormElement.innerHTML = html;
            mainForm.parentElement.appendChild(embeddedFormElement);
            mainButton.disabled = false;
        }).catch(console.error);
}