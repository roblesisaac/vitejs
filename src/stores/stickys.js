// import { defineStore } from 'pinia';
// import { convert } from '../../api/utils/aidkit';

// export const useStickyStore = defineStore('sticker', () => {
//     let breakingPoint = 0;
//     let isSticky = false;
    
//     function addFixedClass(element, breakingPoint, isSticky) {
//         const bounder = () => element.getBoundingClientRect();
//         const elementHeight = bounder().height;
//         const elementTop = bounder().top;
//         const currentPosition = elementTop - breakingPoint;
//         const initialStyle = element.style;
    
//         console.log({ elementTop, elementHeight, currentPosition, breakingPoint })
    
//         if (currentPosition <= 0) {
//             // Element is above or at the breaking point, fix it
//             if (isSticky) {
//                 return [breakingPoint, isSticky];
//             }
//             const stickyStyle = {
//                 position: 'fixed',
//                 top: `${breakingPoint}px`,
//                 left: `${bounder().left}px`,
//                 width: `${bounder().width}px`,
//                 // zIndex: 100 + stuck.length + 1
//             };
    
//             Object.assign(initialStyle, stickyStyle);
//             breakingPoint += elementHeight;
//             isSticky = true;
//         } else {
//             // Element is below the breaking point, unfix it
//             if (!isSticky) {
//                 return [breakingPoint, isSticky];
//             }
//             element.style.position = initialStyle.position;
//             element.style.top = initialStyle.top;
//             element.style.left = initialStyle.left;
//             element.style.width = initialStyle.width;
//             breakingPoint -= elementHeight;
//             isSticky = false;
//         }
    
//         return [breakingPoint, isSticky];
//     }
    
    
//     const build = function() {
//         const handlers = new Map();
    
//         const registerHandler = function(selector) {
//             const element = document.querySelector(selector);
//             const handler = function() {
//                 const [newBreakingPoint, newIsSticky] = addFixedClass(
//                     element,
//                     breakingPoint,
//                     isSticky
//                 );
//                 breakingPoint = newBreakingPoint;
//                 isSticky = newIsSticky;
//             };
//             handlers.set(selector, handler);
//             window.addEventListener('scroll', handler);
//         };
    
//         const deregisterHandler = function(selector) {
//             const handler = handlers.get(selector);
//             if (handler) {
//                 window.removeEventListener('scroll', handler);
//                 handlers.delete(selector);
//             }
//         };
    
//         const stickify = function(selectors) {
//             convert.toArray(selectors).forEach(registerHandler);
//         };
    
//         const unstick = function(selectors) {
//             convert.toArray(selectors).forEach(deregisterHandler);
//         };
    
//         return {
//             stickify,
//             unstick,
//         };
//     };
    
    
//     const sticker = build()
    
//     return { sticker };
    
// });