import { defineStore } from 'pinia';
import { Aid } from '../../api/utils/aidkit';

const sticker = new Aid({
    state: {
        registered: [],
        stuck: 0,
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
            const { selector, registered } = this;

            const index = registered.findIndex(obj => obj.selector === selector);
            
            if(index < 0) return;

            const { handlers } = registered[index];

            for(let eventName in handlers) {
                window.removeEventListener(eventName, handlers[eventName]);
            }
            
            registered.splice(index, 1);
            --this.stuck;
        },
        findElement() {
            const { selector, learn } = this;

            const el = document.querySelector(selector);

            learn({ el });
        },
        initScrollHandler() {
            const { next, el, registered, stickUnder } = this;

            const box = () => el.getBoundingClientRect();
            const elHeight = box().height;
            const stickUnderIndex = registered.findIndex(item => item.selector === stickUnder);

            const calcPrevRegisteredHeight = (stopAt) => {
                stopAt = stopAt < 0 ? registered.length : stopAt;

                let combinedHeight = 0;

                registered.forEach((reg, index) => {
                    if(index <= stopAt) {
                        combinedHeight += reg.elHeight
                    }
                });

                return combinedHeight;
            }

            const prevRegisteredHeight = calcPrevRegisteredHeight(stickUnderIndex);

            const buildPlaceHolder = () => {
                const elem = document.createElement('div');            
                elem.style.height = `${elHeight}px`;
                elem.style.visibility = 'hidden';
                return elem;
            }

            const calcStickyTopPosition = () => {
                return prevRegisteredHeight;
            }

            const calcStickingPoint = () => {
                return initialTop - prevRegisteredHeight
            }

            const stickyTopPosition = calcStickyTopPosition();
            const initialTop = el.offsetTop;
            const stickingPoint = calcStickingPoint();
            const placeholder = buildPlaceHolder();
            const initialStyle = el.style;
            let isSticky = false;

            const makeSticky = () => {
                if(isSticky) {
                    return;
                }

                isSticky = true;

                const stickyStyle = {
                    position: 'fixed',
                    top: `${stickyTopPosition}px`,
                    left: `${box().left}px`,
                    width: `${box().width}px`,
                    zIndex: 100 + this.stuck
                };                                  

                Object.assign(el.style, stickyStyle);
                el.parentNode.insertBefore(placeholder, el.nextSibling);
                this.stuck++
            };

            const makeUnSticky = () => {
                if(!isSticky) {
                    return;
                }
                
                isSticky = false;
                el.style = initialStyle;
                this.stuck--;
                
                if (el.nextSibling === placeholder) {
                    el.parentNode.removeChild(placeholder);
                }
            };

            const handleScroll = () => {
                window.pageYOffset >= stickingPoint
                        ? makeSticky()
                        : makeUnSticky();
            };

            const handlers = {
                scroll: handleScroll,
                resize: makeUnSticky
            }

            next({ handlers, elHeight, stickyTopPosition });
        },
        isAlreadyRegistered() {
            const { selector, registered, next } = this;
            const item = registered.find(obj => obj.selector === selector);

            next(!!item);
        },
        registerElement({ handlers, elHeight, stickyTopPosition }) {
            const { selector, registered } = this;

            for (let eventName in handlers) {
                window.addEventListener(eventName, handlers[eventName]);
            }

            registered.push({ selector, handlers, elHeight, stickyTopPosition });
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