let searchParams = new URLSearchParams(window.location.search.slice(1));
let debugParam = searchParams.get('debug')?.trim();

class ScrollTrack {
    constructor(componentAnime) {
        this.componentAnime = new Map(componentAnime
            .filter(v => v[1].length != 0)
            .map((a) => {
                return [a[0], a[1].map(v => {
                    return {
                        referenceContainer: v.referenceContainer ?? 'viewport',
                        inst: anime(v.params)
                    };
                })];
            }));

        if (debugParam != null) {
            console.debug(this.componentAnime);

            if (debugParam.length != 0) {
                console.debug('Specifically:', this.componentAnime.get(debugParam));
            }
        }

        this.observer = new IntersectionObserver(function (items, self) {
            items.forEach(obs => {
                if (obs.isIntersecting) {
                    obs.target.setAttribute('data-scroll-to-view', 'done');
                    self.unobserve(obs.target);
                }
            });
        });

        document.querySelectorAll('.component:is([data-scroll-to-view="done"])')
            .forEach(v => this.observer.observe(v));

        const data_scroll_query = document.querySelectorAll('.component[data-scroll=""]');

        const comp = this.componentAnime;
        this.scrollListener = function () {
            data_scroll_query.forEach(c => {
                const guid = c.getAttribute('data-guid');

                const animoo = comp.get(guid);
                if (animoo == null) return;

                animoo.forEach(anime => {
                    const REF_HEIGHT = getScrollHeight(anime.referenceContainer, c);
                    const SCROLL_POS = window.scrollY + window.innerHeight;

                    // We use Math.max w/ innerHeight so scrollables which are at the start of the page don't start w/ a value past 0
                    // This does mean though that the effects will happen quicker for these
                    const node_pos = Math.max(window.innerHeight, getTopOffsetFix(c));

                    const loc = Math.max(0, SCROLL_POS - node_pos);

                    const visible_percentage = Math.min(100, loc * 100.0 / REF_HEIGHT) / 100.0;

                    if (debugParam != null && debugParam == guid) {
                        // TODO: Remove Scroll Pos and add absolute text for it instead
                        console.debug(`[${guid}]: Ref Height: ${REF_HEIGHT}, Ref Visible: ${visible_percentage}%, Node Pos: ${node_pos}, Scroll Pos: ${SCROLL_POS}`);
                    }

                    anime.inst.seek(visible_percentage * anime.inst.duration);
                });
            });
        };

        this.scrollListener();

        window.addEventListener('scroll', this.scrollListener);
    }
}

function getScrollHeight(ref, element) {
    if (ref == 'viewport') {
        return window.innerHeight;
    } else if (ref == 'webpage') {
        return document.body.scrollHeight;
    } else if (ref == 'container') {
        return element.parentElement.scrollHeight;
    } else {
        throw new Error("Unexpected Reference Type Found '" + ref + "'");
    }
}

function getTopOffsetFix(element) {
    return element.offsetTop + (element.offsetParent != null ? getTopOffsetFix(element.offsetParent) : 0);
}

window.addEventListener('load', () => {
    const script = document.getElementById('anime');

    if (script == null) throw new Error('Unable to find Anime Script');

    const data = JSON.parse(script.textContent);

    new ScrollTrack(data);
});