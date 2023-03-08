// import { defineStore } from 'pinia';
// import { convert } from '../../api/utils/aidkit';

// export const useStickyStore = defineStore('sticker', () => {
//     const registered = [];
//     const stuck = [];
//     let heightOfElemsStuck = 0;

//     function initScrollHandler(selector) {
//         const index = registered.findIndex(obj => obj.selector === selector);

//         if(index > -1) {
//             return;
//         }

//         const el = document.querySelector(selector);
//         const bounder = () => el.getBoundingClientRect();
            
//         const buildPlaceHolder = () => {
//             const elem = document.createElement('div');            
//             elem.style.height = `${bounder().height}px`;
//             elem.style.visibility = 'hidden';
//             return elem;
//         }

//         const placeholder = buildPlaceHolder();
//         const initialElStyle = el.style;
//         let isSticky = false;

//         const makeSticky = () => {
//             if(isSticky) {
//                 return;
//             }

//             isSticky = true;

//             const stickyStyle = {
//                 position: 'fixed',
//                 top: `${heightOfElemsStuck}px`,
//                 left: `${bounder().left}px`,
//                 width: `${bounder().width}px`,
//                 zIndex: 100 + stuck.length + 1,
//             };                                

//             Object.assign(initialElStyle, stickyStyle);
//             el.parentNode.insertBefore(placeholder, el.nextSibling);
//             stuck.push({ el, selector });
//             heightOfElemsStuck += bounder().height;
//         };

//         const makeUnSticky = () => {
//             if(!isSticky) {
//                 return;
//             }
            
//             isSticky = false;
//             heightOfElemsStuck -= bounder().height;

//             const index = stuck.findIndex(item =>  item.selector === selector);

//             if(index < 0) {
//                 return;
//             }

//             el.style = initialElStyle;
//             stuck.splice(index, 1);
            
//             if (el.nextSibling === placeholder) {
//                 el.parentNode.removeChild(placeholder);
//             }
//         };

//         const handleScroll = () => {
//             const pageY = window.pageYOffset;
//             const elY = el.offsetTop;

//             const atZero = () => isSticky 
//                 ? elY <= pageY 
//                 : elY - heightOfElemsStuck <= pageY;          

//             atZero() ? makeSticky() : makeUnSticky();
//         };

//         window.addEventListener('scroll', handleScroll);
//         registered.push({ el, selector, handleScroll });
//     }

//     function unstickify(selector) {
//         const index = registered.findIndex(obj => obj.selector === selector);

//         if(index < 0) {
//             return;
//         }

//         const { el, handleScroll } = registered[index];

//         el.style.position = 'static';
//         window.removeEventListener('scroll', handleScroll);
//         registered.splice(index, 1);
//     }

//     function stickify(selectors) {
//         if(!selectors) {
//             return;
//         }

//         convert.toArray(selectors).forEach(initScrollHandler);
//     }

//     function unstick(selectors) {
//         if(!selectors) {
//             return;
//         }

//         convert.toArray(selectors).forEach(unstickify);
//     }
   
//     const sticker = {
//         stickify,
//         unstick
//     };

//     return  { sticker };
// });