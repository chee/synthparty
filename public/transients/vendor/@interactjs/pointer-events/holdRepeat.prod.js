/* interact.js 1.10.26 | https://raw.github.com/taye/interact.js/main/LICENSE */

import{a as pointerEvents}from"./base-a44b3cf9.js";import"../utils/domUtils.prod.js";import"../utils/extend.prod.js";import"../utils/getOriginXY.prod.js";import"./PointerEvent.prod.js";import"../core/BaseEvent.prod.js";import"../utils/pointerUtils.prod.js";function install(e){e.usePlugin(pointerEvents);const{pointerEvents:t}=e;t.defaults.holdRepeatInterval=0,t.types.holdrepeat=e.actions.phaselessTypes.holdrepeat=!0}function onNew(e){let{pointerEvent:t}=e;"hold"===t.type&&(t.count=(t.count||0)+1)}function onFired(e,t){let{interaction:n,pointerEvent:o,eventTarget:l,targets:r}=e;if("hold"!==o.type||!r.length)return;const i=r[0].eventable.options.holdRepeatInterval;i<=0||(n.holdIntervalHandle=setTimeout((()=>{t.pointerEvents.fire({interaction:n,eventTarget:l,type:"hold",pointer:o,event:o},t)}),i))}function endHoldRepeat(e){let{interaction:t}=e;t.holdIntervalHandle&&(clearInterval(t.holdIntervalHandle),t.holdIntervalHandle=null)}const holdRepeat={id:"pointer-events/holdRepeat",install:install,listeners:["move","up","cancel","endall"].reduce(((e,t)=>(e["pointerEvents:"+t]=endHoldRepeat,e)),{"pointerEvents:new":onNew,"pointerEvents:fired":onFired})};export{holdRepeat as default};
//# sourceMappingURL=holdRepeat.prod.js.map