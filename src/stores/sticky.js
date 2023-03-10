import { defineStore } from 'pinia';
import { Aid } from '../../api/utils/aidkit';

const sticker = new Aid({
    state: {
        registered: {},
        stuck: {
            height: 0
        },
        screenSize: {
            small: () => window.matchMedia("(max-width: 639px)").matches,
            medium: () => window.matchMedia("(min-width: 640px) and (max-width: 1023px)").matches,
            large: () => window.matchMedia("(min-width: 1024px)").matches,
        }          
    },
    steps: {
        defineSelector() {
            const { item, learn } = this;

            let { selector, stickUnder } = item;

            learn({ 
                selector: selector || item, 
                stickUnder 
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
            const { next, el, stuck, selector, stickUnder } = this;

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
                const { height, placeholder } = box;
                el.style = initialStyle;
                box = buildBox();

                if(!isSticky) {
                    return
                }

                isSticky = false;
                stuck.height -= height;
                delete stuck[selector];

                if (el.nextSibling === placeholder) {
                    el.parentNode.removeChild(placeholder);
                }
            }

            const handleScroll = () => {
                if(!box) box = buildBox();

                const stickingPoint = isSticky
                    ? stuck[selector].stickingPoint
                    : stuck[stickUnder]
                    ? box.top - stuck[stickUnder].height - stuck[stickUnder].topPosition
                    : box.top - stuck.height;

                window.pageYOffset > stickingPoint
                        ? makeSticky(stickingPoint)
                        : makeUnSticky();
            };

            const handlers = {
                scroll: handleScroll,
                resize: makeUnSticky
            }

            next({ handlers });
        },
        isAlreadyRegistered() {
            const { selector, registered, next } = this;

            next(!!registered[selector]);
        },
        registerElement({ handlers }) {
            const { selector, registered } = this;

            for (let eventName in handlers) {
                window.addEventListener(eventName, handlers[eventName]);
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