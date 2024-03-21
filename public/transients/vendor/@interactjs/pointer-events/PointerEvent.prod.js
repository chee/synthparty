/* interact.js 1.10.26 | https://raw.github.com/taye/interact.js/main/LICENSE */

import{BaseEvent}from"../core/BaseEvent.prod.js";import*as pointerUtils from"../utils/pointerUtils.prod.js";class PointerEvent extends BaseEvent{constructor(t,e,i,s,r,n){if(super(r),pointerUtils.pointerExtend(this,i),i!==e&&pointerUtils.pointerExtend(this,e),this.timeStamp=n,this.originalEvent=i,this.type=t,this.pointerId=pointerUtils.getPointerId(e),this.pointerType=pointerUtils.getPointerType(e),this.target=s,this.currentTarget=null,"tap"===t){const t=r.getPointerIndex(e);this.dt=this.timeStamp-r.pointers[t].downTime;const i=this.timeStamp-r.tapTime;this.double=!!r.prevTap&&"doubletap"!==r.prevTap.type&&r.prevTap.target===this.target&&i<500}else"doubletap"===t&&(this.dt=e.timeStamp-r.tapTime,this.double=!0)}_subtractOrigin(t){let{x:e,y:i}=t;return this.pageX-=e,this.pageY-=i,this.clientX-=e,this.clientY-=i,this}_addOrigin(t){let{x:e,y:i}=t;return this.pageX+=e,this.pageY+=i,this.clientX+=e,this.clientY+=i,this}preventDefault(){this.originalEvent.preventDefault()}}export{PointerEvent};
//# sourceMappingURL=PointerEvent.prod.js.map