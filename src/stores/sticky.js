import { defineStore } from 'pinia';
import { Aid, convert } from '../../api/utils/aidkit';
import { ref } from 'vue';
import { def } from '@vue/shared';

const sticker = new Aid({
    state: {
        registered: {},
        stuck: { height: 0 },
        currentScreenSize: () => {
            const matches = (media) => window.matchMedia(media).matches;

            return matches("(max-width: 47.9375em)")
                ? 'small'
                : matches("(min-width: 48em) and (max-width: 63.9375em)")
                ? 'medium'
                : 'large'
        }
    },
    steps: {
        defineSelector() {
            const { item, learn } = this;

            let { selector, stickUnder, unstickWhen, screenSize } = item;

            learn({ 
                selector: selector || item, 
                validScreenSizes: screenSize,
                stickUnder,
                unstickWhen
            });
        },
        deregister() {
            const { selector, registered } = this;

            const item = registered[selector];
            
            if(!item) return;

            const { handlers } = item;

            for(let eventName in handlers) {
                const method = handlers[eventName];
                
                if(eventName === 'resize') method({ deRegistering: true });
                window.removeEventListener(eventName, method);
            }
            
            delete registered[selector];
        },
        findElement() {
            const { selector, learn } = this;

            const el = document.querySelector(selector);

            learn({ el });
        },
        initScrollHandler() {
            const { next, el, stuck, selector, item, stickUnder, validScreenSizes, unstickWhen } = this;

            let box,
                settings,
                initialStyle = el.style,
                isSticky = false;

            const buildBox = (el) => {
                const { height, left, width } = el.getBoundingClientRect();
                const top = el.offsetTop;
                const elem = document.createElement('div');

                elem.style.height = height+'px';
                elem.style.width = width+'px';
                elem.style.visibility = 'hidden';

                return {
                    top, 
                    height,
                    left, 
                    width,
                    placeholder: elem
                }
            };

            const screenIsValid = () => {
                if(!validScreenSizes) {
                    return true;
                }

                let screens = convert.toArray(validScreenSizes),
                    { currentScreenSize: current } = this,
                    negates;

                screens.forEach(size => negates = negates || size.includes('-'));

                if(negates) {
                    const defaults = ['small', 'medium', 'large'];
                    screens = screens.concat(defaults);
                }

                return screens.includes(current)
                    && !screens.includes('-'+current);
            }

            const unstickingPoint = () => {
                const { touching, isSticky, reachesTop } = unstickWhen;

                const selector = touching || isSticky || reachesTop;
                const el = document.querySelector(selector);
                const box = buildBox(el);

                return touching
                    ? box.top+box.height
                    : isSticky
                    ? !!stuck[isSticky]
                    : stuck[selector]
                    ? box.top-stuck[selector].stickingPoint
                    : 1000000000;
            };

            const makeSticky = (stickingPoint, topPosition) => {
                if(isSticky) {
                    return;
                }

                isSticky = true;
                let { top, left, height, width, placeholder } = box;
                top = topPosition || top-stickingPoint;
                const stickyStyle = {
                    top: top+'px',
                    left: left+'px',
                    width: width+'px',
                    zIndex: 100 + stuck.height
                };

                el.classList.add('fixed');
                Object.assign(el.style, stickyStyle);
                el.parentNode.insertBefore(placeholder, el.nextSibling);
                stuck[selector] = { height, stickingPoint, top };
                stuck.height += height;
            };

            const makeUnsticky = () => {
                if(!box) return;

                const { height, placeholder } = box;
                el.style = initialStyle;
                el.classList.remove('fixed');
                box = buildBox(el);

                if(!isSticky) return;

                isSticky = false;
                stuck.height -= height;
                delete stuck[selector];

                if (el.nextSibling === placeholder) {
                    el.parentNode.removeChild(placeholder);
                }
            }

            const currentSettings = () => {
                return item[this.currentScreenSize] 
                    || { stickUnder, unstickWhen };
            }

            const handleScroll = () => {
                if(!screenIsValid()) return;

                settings = currentSettings();
                box = box || buildBox(el);

                const Stuck = stuck[selector];
                const StickUnder = stuck[settings.stickUnder];
                const Top = box.top;
                const scroll = window.pageYOffset;

                const stickingPoint = Stuck
                    ? Stuck.stickingPoint
                    : StickUnder
                    ? Top - StickUnder.height - StickUnder.top
                    : Top - stuck.height;

                if(unstickWhen) {
                    return scroll > stickingPoint 
                        && scroll < unstickingPoint()
                            ? makeSticky(stickingPoint)
                            : makeUnsticky();
                }

                scroll > stickingPoint
                    ? makeSticky(stickingPoint)
                    : makeUnsticky();
            };

            // Fixes resize glitch on mobile
            let prevWindowSize = window.innerWidth;

            const handleResize = ({ deRegistering }) => {
                if(deRegistering) {
                    return makeUnsticky();
                }
                
                const currentWindowSize = window.innerWidth;
                const sizeDifference = Math.abs(prevWindowSize - currentWindowSize);

                prevWindowSize = currentWindowSize;
                if (sizeDifference > 1) makeUnsticky();
            }

            const handlers = {
                resize: handleResize,
                scroll: handleScroll
            }

            next({ handlers });
        },
        isAlreadyRegistered() {
            const { selector, registered, next } = this;

            next(!!registered[selector]);
        },
        registerElement({ handlers }) {
            const { selector, registered } = this;

            const options = { passive: true };

            for (let name in handlers) {
                window.addEventListener(name, handlers[name], options);
            }

            registered[selector] = { handlers };
        }
    },
    instruct: {
        _register: [
            {
                if: "isAlreadyRegistered",
                false: [
                    "findElement",
                    "initScrollHandler",
                    "registerElement"
                ] 
            }
        ],
        stickify: (stickys) => [
            {
                every: stickys,
                async: [
                    "defineSelector",
                    "_register"
                ]
            }
        ],
        unstick: (stickys) => [
            {
                every: stickys,
                run: ["defineSelector", "deregister"]
            }
        ]
    }
});

export const useStickyStore = defineStore('sticker', () => ({ sticker }))