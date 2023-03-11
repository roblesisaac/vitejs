import { defineStore } from 'pinia';
import { Aid, convert } from '../../api/utils/aidkit';

const sticker = new Aid({
    state: {
        registered: {},
        stuck: {
            height: 0
        },
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

            let { selector, stickUnder, screenSize } = item;

            learn({ 
                selector: selector || item, 
                stickUnder,
                screenSize 
            });
        },
        deregister() {
            const { selector, registered, stuck } = this;

            const item = registered[selector]
            
            if(!item) return;

            const { handlers } = item;

            for(let eventName in handlers) {
                const method = handlers[eventName];

                if(method.name === 'makeUnSticky') method();
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
            const { next, el, stuck, selector, stickUnder, screenSize } = this;

            let box,
                initialStyle = el.style,
                isSticky = false;

            const buildBox = () => {
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

            const screenSizeIsValid = currentScreenSize => {
                if(!screenSize) {
                    return true;
                }

                const defaultSizes = ['small', 'medium', 'large'];

                let validSizes = convert.toArray(screenSize),
                    hasNegatives;

                validSizes.forEach(size => {
                    hasNegatives = hasNegatives || size.includes('-')
                });

                if(hasNegatives) {
                    validSizes = validSizes.concat(defaultSizes);
                }

                return validSizes.includes(currentScreenSize)
                    && !validSizes.includes('-'+currentScreenSize);
            }

            const makeSticky = (stickingPoint) => {
                if(isSticky) {
                    return;
                }

                isSticky = true;
                const { top, left, height, width, placeholder } = box;
                const topPosition = top-stickingPoint;

                const stickyStyle = {
                    position: 'fixed',
                    top: topPosition+'px',
                    left: left+'px',
                    width: width+'px',
                    zIndex: 100 + stuck.height
                };

                Object.assign(el.style, stickyStyle);
                el.parentNode.insertBefore(placeholder, el.nextSibling);
                stuck[selector] = { height, stickingPoint, topPosition };
                stuck.height += height;
            };

            const makeUnSticky = () => {
                if(!box) return;

                const { height, placeholder } = box;
                el.style = initialStyle;
                box = buildBox();

                if(!isSticky) return;

                isSticky = false;
                stuck.height -= height;
                delete stuck[selector];

                if (el.nextSibling === placeholder) {
                    el.parentNode.removeChild(placeholder);
                }
            }

            const handleScroll = () => {
                if(!screenSizeIsValid(this.currentScreenSize)) return;

                box = box || buildBox();

                const Stuck = stuck[selector];
                const StickUnder = stuck[stickUnder];
                const Top = box.top;

                const stickingPoint = Stuck
                    ? Stuck.stickingPoint
                    : StickUnder
                    ? Top - StickUnder.height - StickUnder.topPosition
                    : Top - stuck.height;

                window.pageYOffset > stickingPoint
                        ? makeSticky(stickingPoint)
                        : makeUnSticky();
            };

            const handlers = {
                resize: makeUnSticky,
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