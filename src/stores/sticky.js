import { defineStore } from 'pinia';
import { Aid } from '../../api/utils/aidkit';
import { ref } from 'vue';

const sticker = new Aid({
    state: {
        registered: [],
        stuck: [],
        heightOfElemsStuck: 0
    },
    steps: {
        deregister() {
            const { item: selector, registered } = this;

            const index = registered.findIndex(obj => obj.selector === selector);
            
            if(index < 0) {
                return;
            }

            const { el, handleScroll } = registered[index];

            el.style.position = 'static'
            window.removeEventListener('scroll', handleScroll);
            registered.splice(index, 1);
        },
        findElement() {
            const { selector, learn } = this;

            const el = document.querySelector(selector);

            learn({ el });
        },
        initScrollHandler() {
            const { next, el, stuck, selector } = this;

            const bounder = () => el.getBoundingClientRect();
            
            const buildPlaceHolder = () => {
                const elem = document.createElement('div');            
                elem.style.height = `${bounder().height}px`;
                elem.style.visibility = 'hidden';
                return elem;
            }

            const placeholder = buildPlaceHolder();
            const initialElStyle = el.style;
            let isSticky = false;

            const makeSticky = () => {
                if(isSticky) {
                    return;
                }

                isSticky = true;

                const stickyStyle = {
                    position: 'fixed',
                    top: `${this.heightOfElemsStuck}px`,
                    left: `${bounder().left}px`,
                    width: `${bounder().width}px`,
                    zIndex: 100 + stuck.length + 1
                };                                  

                Object.assign(initialElStyle, stickyStyle);
                el.parentNode.insertBefore(placeholder, el.nextSibling);
                stuck.push({ el, selector });
                this.heightOfElemsStuck += bounder().height;
            };

            const makeUnSticky = () => {
                if(!isSticky) {
                    return;
                }
                
                isSticky = false;
                this.heightOfElemsStuck -= bounder().height;

                const index = stuck.findIndex(item =>  item.selector === selector);

                if(index < 0) return;

                el.style = initialElStyle;
                stuck.splice(index, 1);
                
                if (el.nextSibling === placeholder) {
                    el.parentNode.removeChild(placeholder);
                }
            };

            const handler = () => {
                const pageY = window.pageYOffset;
                const elY = el.offsetTop;

                const atZero = () => isSticky 
                    ? elY <= pageY
                    : elY-this.heightOfElemsStuck <= pageY;          

                atZero() ? makeSticky() : makeUnSticky();
            };

            next(handler);
        },
        notRegisteredYet() {
            const { selector, registered, next } = this;
            const index = registered.findIndex(obj => obj.selector === selector);

            next(index === -1);
        },
        registerElement(handleScroll) {
            const { selector, el, registered } = this;

            window.addEventListener('scroll', handleScroll);
            registered.push({ el, selector, handleScroll });
        }
    },
    instruct: {
        _register: [
            {
                if: "notRegisteredYet",
                true: [
                    "findElement",
                    "initScrollHandler",
                    "registerElement"
                ] 
            }
        ],
        stickify: (sid) => [
            {
                every: sid,
                run: [
                    { selector: "item" },
                    "_register"
                ]
            }
        ],
        unstick: (sid) => [
            {
                every: sid,
                run: "deregister"
            }
        ]
    }
});

export const useStickyStore = defineStore('sticker', () => ({ sticker }))