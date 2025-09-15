// Listen for button clicks
window.addEventListener('click', event => {
    let element = event.target;

    if (element instanceof Element) {
        while (!element.classList.contains('component')) {
            element = element.parentElement;

            if (element == null) {
                return;
            }
        }

        const ds = element.dataset;
        const dsListen = ds.listen;

        // data-listen="click"
        if (dsListen == 'click') {
            const dsButtonType = ds.buttonType;

            if (dsButtonType != null) {
                // This should only ever be used in a popup.
                if (dsButtonType == 'close') {
                    // Go to parents until we reach class="popup"
                    let lastParent = element.parentElement;

                    while (lastParent != null) {
                        if (lastParent.classList.contains('popup')) {
                            lastParent.style.display = 'none';
                            return;
                        }

                        lastParent = lastParent.parentElement;
                    }
                } else if (dsButtonType == 'popup') {
                    const dsPopupId = ds.buttonData;
                    const popup = document.querySelector(`[data-guid="${dsPopupId}"]`);

                    if (popup != null) {
                        // TODO: Need to be able to do animations
                        popup.parentElement.style.display = '';
                    }
                } else if (dsButtonType == 'page-location-top') {
                    window.scrollTo(0, 0);
                } else if (dsButtonType == 'page-location-bottom') {
                    window.scrollTo(0, document.body.scrollHeight);
                }
            }
        } else if (element.parentElement != null && element.parentElement.classList.contains('popup')) {
            // TODO: Need to be able to do animations
            element.parentElement.style.display = 'none';
        }
    }
});

// Menu: Register Current Page
// Determine which we're currently viewing. Add class "selected" to it.
document.querySelectorAll('[data-type="menu"]').forEach(element => {
    let currentUrl = window.location.href;

    if (!currentUrl.endsWith('/')) {
        currentUrl += '/';
    }

    const aElement = element.querySelector(`[href="${currentUrl}"]`);

    if (aElement != null) {
        aElement.classList.add('selected');
    }
});