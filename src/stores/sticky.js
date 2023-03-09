import { defineStore } from 'pinia';
import { Aid } from '../../api/utils/aidkit';
import { ref } from 'vue';

const sticker = new Aid({
    state: {
        registered: [],
        stuck: [],
        stickingPoint: 0
    },
    steps: {
        deregister() {
            const { item: selector, registered, stuck } = this;

            const rIndex = registered.findIndex(obj => obj.selector === selector);
            
            if(rIndex < 0) return;

            const { handleScroll, makeUnSticky, elHeight } = registered[rIndex];

            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', makeUnSticky);
            registered.splice(rIndex, 1);

            // destick if needed
            const sIndex = stuck.findIndex(obj => obj.selector === selector);

            if(sIndex < 0) return;

            this.stickingPoint -= elHeight;
            stuck.splice(sIndex, 1);
        },
        findElement() {
            const { selector, learn } = this;

            const el = document.querySelector(selector);

            learn({ el });
        },
        initScrollHandler() {
            const { next, el, stuck, selector } = this;

            const bounder = () => el.getBoundingClientRect();
            const elHeight = bounder().height;
            
            const buildPlaceHolder = () => {
                const elem = document.createElement('div');            
                elem.style.height = `${elHeight}px`;
                elem.style.visibility = 'hidden';
                return elem;
            }

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
                    top: `${this.stickingPoint}px`,
                    left: `${bounder().left}px`,
                    width: `${bounder().width}px`,
                    zIndex: 100 + stuck.length + 1
                };                                  

                Object.assign(initialStyle, stickyStyle);
                el.parentNode.insertBefore(placeholder, el.nextSibling);
                el.breakingPoint = window.pageYOffset;
                this.stickingPoint += elHeight;
                stuck.push({ el, selector });
            };

            const makeUnSticky = () => {
                if(!isSticky) {
                    return;
                }

                const index = stuck.findIndex(item =>  item.selector === selector);
                if(index < 0) return;
                
                isSticky = false;
                this.stickingPoint -= elHeight;
                el.style = initialStyle;
                delete el.breakingPoint;
                stuck.splice(index, 1);
                
                if (el.nextSibling === placeholder) {
                    el.parentNode.removeChild(placeholder);
                }
            };

            const handleScroll = () => {
                const pageY = window.pageYOffset;

                const isAtStickingPoint = () => isSticky 
                    ? pageY >= el.breakingPoint
                    : pageY+this.stickingPoint >= el.offsetTop

                isAtStickingPoint()
                    ? makeSticky()
                    : makeUnSticky();
            };

            next({ handleScroll, makeUnSticky, elHeight });
        },
        notRegisteredYet() {
            const { selector, registered, next } = this;
            const index = registered.findIndex(obj => obj.selector === selector);

            next(index === -1);
        },
        registerElement({ handleScroll, makeUnSticky, elHeight }) {
            const { selector, el, registered } = this;

            window.addEventListener('scroll', handleScroll);
            window.addEventListener('resize', makeUnSticky);
            registered.push({ selector, handleScroll, makeUnSticky, elHeight });
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