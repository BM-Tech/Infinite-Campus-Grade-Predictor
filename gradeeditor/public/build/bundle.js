var app=function(){"use strict";function t(){}const e=t=>t;function n(t){return t()}function o(){return Object.create(null)}function r(t){t.forEach(n)}function i(t){return"function"==typeof t}function s(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}const l="undefined"!=typeof window;let a=l?()=>window.performance.now():()=>Date.now(),u=l?t=>requestAnimationFrame(t):t;const c=new Set;function f(t){c.forEach((e=>{e.c(t)||(c.delete(e),e.f())})),0!==c.size&&u(f)}function d(t,e){t.appendChild(e)}function m(t){if(!t)return document;const e=t.getRootNode?t.getRootNode():t.ownerDocument;return e&&e.host?e:t.ownerDocument}function g(t){const e=b("style");return function(t,e){d(t.head||t,e)}(m(t),e),e}function h(t,e,n){t.insertBefore(e,n||null)}function p(t){t.parentNode.removeChild(t)}function $(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function b(t){return document.createElement(t)}function v(t){return document.createTextNode(t)}function w(){return v(" ")}function y(){return v("")}function _(t,e,n,o){return t.addEventListener(e,n,o),()=>t.removeEventListener(e,n,o)}function x(t){return function(e){return e.preventDefault(),t.call(this,e)}}function N(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function k(t){return""===t?null:+t}function C(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}function O(t,e){t.value=null==e?"":e}function S(t,e){for(let n=0;n<t.options.length;n+=1){const o=t.options[n];if(o.__value===e)return void(o.selected=!0)}t.selectedIndex=-1}function E(t,e,n=!1){const o=document.createEvent("CustomEvent");return o.initCustomEvent(t,n,!1,e),o}const A=new Set;let F,G=0;function P(t,e,n,o,r,i,s,l=0){const a=16.666/o;let u="{\n";for(let t=0;t<=1;t+=a){const o=e+(n-e)*i(t);u+=100*t+`%{${s(o,1-o)}}\n`}const c=u+`100% {${s(n,1-n)}}\n}`,f=`__svelte_${function(t){let e=5381,n=t.length;for(;n--;)e=(e<<5)-e^t.charCodeAt(n);return e>>>0}(c)}_${l}`,d=m(t);A.add(d);const h=d.__svelte_stylesheet||(d.__svelte_stylesheet=g(t).sheet),p=d.__svelte_rules||(d.__svelte_rules={});p[f]||(p[f]=!0,h.insertRule(`@keyframes ${f} ${c}`,h.cssRules.length));const $=t.style.animation||"";return t.style.animation=`${$?`${$}, `:""}${f} ${o}ms linear ${r}ms 1 both`,G+=1,f}function W(t,e){const n=(t.style.animation||"").split(", "),o=n.filter(e?t=>t.indexOf(e)<0:t=>-1===t.indexOf("__svelte")),r=n.length-o.length;r&&(t.style.animation=o.join(", "),G-=r,G||u((()=>{G||(A.forEach((t=>{const e=t.__svelte_stylesheet;let n=e.cssRules.length;for(;n--;)e.deleteRule(n);t.__svelte_rules={}})),A.clear())})))}function q(t){F=t}function T(){const t=function(){if(!F)throw new Error("Function called outside component initialization");return F}();return(e,n)=>{const o=t.$$.callbacks[e];if(o){const r=E(e,n);o.slice().forEach((e=>{e.call(t,r)}))}}}const H=[],L=[],M=[],j=[],D=Promise.resolve();let R=!1;function B(t){M.push(t)}let I=!1;const z=new Set;function Y(){if(!I){I=!0;do{for(let t=0;t<H.length;t+=1){const e=H[t];q(e),J(e.$$)}for(q(null),H.length=0;L.length;)L.pop()();for(let t=0;t<M.length;t+=1){const e=M[t];z.has(e)||(z.add(e),e())}M.length=0}while(H.length);for(;j.length;)j.pop()();R=!1,I=!1,z.clear()}}function J(t){if(null!==t.fragment){t.update(),r(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(B)}}let K;function Q(t,e,n){t.dispatchEvent(E(`${e?"intro":"outro"}${n}`))}const U=new Set;let V;function X(){V={r:0,c:[],p:V}}function Z(){V.r||r(V.c),V=V.p}function tt(t,e){t&&t.i&&(U.delete(t),t.i(e))}function et(t,e,n,o){if(t&&t.o){if(U.has(t))return;U.add(t),V.c.push((()=>{U.delete(t),o&&(n&&t.d(1),o())})),t.o(e)}}const nt={duration:0};function ot(n,o,s,l){let d=o(n,s),m=l?0:1,g=null,h=null,p=null;function $(){p&&W(n,p)}function b(t,e){const n=t.b-m;return e*=Math.abs(n),{a:m,b:t.b,d:n,duration:e,start:t.start,end:t.start+e,group:t.group}}function v(o){const{delay:i=0,duration:s=300,easing:l=e,tick:v=t,css:w}=d||nt,y={start:a()+i,b:o};o||(y.group=V,V.r+=1),g||h?h=y:(w&&($(),p=P(n,m,o,s,i,l,w)),o&&v(0,1),g=b(y,s),B((()=>Q(n,o,"start"))),function(t){let e;0===c.size&&u(f),new Promise((n=>{c.add(e={c:t,f:n})}))}((t=>{if(h&&t>h.start&&(g=b(h,s),h=null,Q(n,g.b,"start"),w&&($(),p=P(n,m,g.b,g.duration,0,l,d.css))),g)if(t>=g.end)v(m=g.b,1-m),Q(n,g.b,"end"),h||(g.b?$():--g.group.r||r(g.group.c)),g=null;else if(t>=g.start){const e=t-g.start;m=g.a+g.d*l(e/g.duration),v(m,1-m)}return!(!g&&!h)})))}return{run(t){i(d)?(K||(K=Promise.resolve(),K.then((()=>{K=null}))),K).then((()=>{d=d(),v(t)})):v(t)},end(){$(),g=h=null}}}function rt(t){t&&t.c()}function it(t,e,o,s){const{fragment:l,on_mount:a,on_destroy:u,after_update:c}=t.$$;l&&l.m(e,o),s||B((()=>{const e=a.map(n).filter(i);u?u.push(...e):r(e),t.$$.on_mount=[]})),c.forEach(B)}function st(t,e){const n=t.$$;null!==n.fragment&&(r(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function lt(t,e){-1===t.$$.dirty[0]&&(H.push(t),R||(R=!0,D.then(Y)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function at(e,n,i,s,l,a,u,c=[-1]){const f=F;q(e);const d=e.$$={fragment:null,ctx:null,props:a,update:t,not_equal:l,bound:o(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(n.context||(f?f.$$.context:[])),callbacks:o(),dirty:c,skip_bound:!1,root:n.target||f.$$.root};u&&u(d.root);let m=!1;if(d.ctx=i?i(e,n.props||{},((t,n,...o)=>{const r=o.length?o[0]:n;return d.ctx&&l(d.ctx[t],d.ctx[t]=r)&&(!d.skip_bound&&d.bound[t]&&d.bound[t](r),m&&lt(e,t)),n})):[],d.update(),m=!0,r(d.before_update),d.fragment=!!s&&s(d.ctx),n.target){if(n.hydrate){const t=function(t){return Array.from(t.childNodes)}(n.target);d.fragment&&d.fragment.l(t),t.forEach(p)}else d.fragment&&d.fragment.c();n.intro&&tt(e.$$.fragment),it(e,n.target,n.anchor,n.customElement),Y()}q(f)}class ut{$destroy(){st(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function ct(t,e,n){const o=t.slice();return o[4]=e[n],o[6]=n,o}function ft(t){let e,n,o,r,i,s,l,a=t[4].details[0].task.courseName+"",u=gt(t[4].details)+"";function c(){return t[2](t[6])}return{c(){var t,s,l;e=b("button"),n=b("strong"),o=v(a),r=w(),i=v(u),t="padding",s="5",l=1,e.style.setProperty(t,s,l?"important":"")},m(t,a){h(t,e,a),d(e,n),d(n,o),d(e,r),d(e,i),s||(l=_(e,"click",c),s=!0)},p(e,n){t=e,1&n&&a!==(a=t[4].details[0].task.courseName+"")&&C(o,a),1&n&&u!==(u=gt(t[4].details)+"")&&C(i,u)},d(t){t&&p(e),s=!1,l()}}}function dt(t){let e;return{c(){e=b("p"),e.textContent="Something went wrong. :("},m(t,n){h(t,e,n)},d(t){t&&p(e)}}}function mt(e){let n,o,r=e[0],i=[];for(let t=0;t<r.length;t+=1)i[t]=ft(ct(e,r,t));let s=0==e[0].length&&dt();return{c(){for(let t=0;t<i.length;t+=1)i[t].c();n=w(),s&&s.c(),o=y()},m(t,e){for(let n=0;n<i.length;n+=1)i[n].m(t,e);h(t,n,e),s&&s.m(t,e),h(t,o,e)},p(t,[e]){if(3&e){let o;for(r=t[0],o=0;o<r.length;o+=1){const s=ct(t,r,o);i[o]?i[o].p(s,e):(i[o]=ft(s),i[o].c(),i[o].m(n.parentNode,n))}for(;o<i.length;o+=1)i[o].d(1);i.length=r.length}0==t[0].length?s||(s=dt(),s.c(),s.m(o.parentNode,o)):s&&(s.d(1),s=null)},i:t,o:t,d(t){$(i,t),t&&p(n),s&&s.d(t),t&&p(o)}}}function gt(t){let e="";for(let n of t)null!=n.task.progressScore&&(e=n.task.progressScore+" ("+n.task.progressPercent+"%)");return e}function ht(t,e,n){let{classes:o}=e;const r=T();function i(t){r("message",{m:"openEditor",data:o[t]})}return t.$$set=t=>{"classes"in t&&n(0,o=t.classes)},[o,i,t=>i(t)]}class pt extends ut{constructor(t){super(),at(this,t,ht,mt,s,{classes:0})}}function $t(t){const e=t-1;return e*e*e+1}function bt(t,{delay:e=0,duration:n=400,easing:o=$t}={}){const r=getComputedStyle(t),i=+r.opacity,s=parseFloat(r.height),l=parseFloat(r.paddingTop),a=parseFloat(r.paddingBottom),u=parseFloat(r.marginTop),c=parseFloat(r.marginBottom),f=parseFloat(r.borderTopWidth),d=parseFloat(r.borderBottomWidth);return{delay:e,duration:n,easing:o,css:t=>`overflow: hidden;opacity: ${Math.min(20*t,1)*i};height: ${t*s}px;padding-top: ${t*l}px;padding-bottom: ${t*a}px;margin-top: ${t*u}px;margin-bottom: ${t*c}px;border-top-width: ${t*f}px;border-bottom-width: ${t*d}px;`}}class vt{constructor(t,e){this.weight=t,this.initialWeight=t,this.name=e,this.assignments=[]}addAssignment(t){this.assignments.push(t)}calculateGrade(){let t=new wt(0,0);for(let e of this.assignments)isNaN(e.score)||isNaN(e.outof)||(t.score+=e.score,t.outof+=e.outof);return t}getWeightedGrade(){return this.calculateGrade().getPercent()*this.weight/100}alreadyExists(t){for(let e of t)if(e.name==this.name)return{true:!0,in:t.indexOf(e)};return{true:!1,in:-1}}toString(){let t=this.calculateGrade().toString();return this.name+" (Grade: "+t+"%) (Weight: "+this.weight.toFixed(2)+"%)"}}class wt{constructor(t,e){this.score=t,this.outof=e,this.percent=t/e}getPercent(){return this.percent=this.score/this.outof,this.percent}toString(){return(100*this.getPercent()).toFixed(2)}}class yt extends wt{constructor(t,e,n,o){super(t,e),this.name=n,this.origional=o}getOgGrade(){return null!=this.origional?this.origional==this.toString()?"":"(Origional: "+this.origional+"%)":"(New assignment)"}}function _t(t,e,n){const o=t.slice();return o[27]=e[n],o}function xt(t,e,n){const o=t.slice();return o[30]=e[n],o[31]=e,o[32]=n,o}function Nt(t,e,n){const o=t.slice();return o[27]=e[n],o}function kt(t){let e,n,o,r,i,s,l,a,u,c,f=t[9]()+"",m=(100*t[1]).toFixed(2)+"";return{c(){e=b("div"),n=b("p"),o=b("strong"),o.textContent="Origional:",r=w(),i=v(f),s=v(" | "),l=b("strong"),l.textContent="New:",a=w(),u=v(m),c=v("%"),N(e,"class","sticky")},m(t,f){h(t,e,f),d(e,n),d(n,o),d(n,r),d(n,i),d(n,s),d(n,l),d(n,a),d(n,u),d(n,c)},p(t,e){2&e[0]&&m!==(m=(100*t[1]).toFixed(2)+"")&&C(u,m)},d(t){t&&p(e)}}}function Ct(t){let e,n,o,i,s,l,a,u,c,f,m,g,y,C,E,A,F,G,P,W,q,T,H,L,M,j=t[2],D=[];for(let e=0;e<j.length;e+=1)D[e]=Ot(Nt(t,j,e));return{c(){e=b("article"),n=b("form"),o=b("div"),i=b("label"),s=v("Assignment name\r\n                    "),l=b("input"),a=w(),u=b("label"),c=v("Category\r\n                    "),f=b("select");for(let t=0;t<D.length;t+=1)D[t].c();m=w(),g=b("div"),y=b("label"),C=v("Score\r\n                    "),E=b("input"),A=w(),F=b("label"),G=v("Out of\r\n                    "),P=b("input"),W=w(),q=b("input"),N(l,"type","text"),N(l,"name","aName"),N(i,"for","aName"),N(f,"name","aCat"),f.required=!0,void 0===t[4].catName&&B((()=>t[19].call(f))),N(u,"for","aCat"),N(o,"class","grid"),N(E,"type","number"),N(E,"name","aScore"),E.required=!0,N(y,"for","aScore"),N(P,"type","number"),N(P,"name","aOutOf"),P.required=!0,N(F,"for","aOutOf"),N(g,"class","grid"),N(q,"type","submit"),q.value="Add",N(n,"action","#"),N(e,"class","subcard")},m(r,p){h(r,e,p),d(e,n),d(n,o),d(o,i),d(i,s),d(i,l),O(l,t[4].name),d(o,a),d(o,u),d(u,c),d(u,f);for(let t=0;t<D.length;t+=1)D[t].m(f,null);S(f,t[4].catName),d(n,m),d(n,g),d(g,y),d(y,C),d(y,E),O(E,t[4].score),d(g,A),d(g,F),d(F,G),d(F,P),O(P,t[4].outof),d(n,W),d(n,q),H=!0,L||(M=[_(l,"input",t[18]),_(f,"change",t[19]),_(E,"input",t[20]),_(P,"input",t[21]),_(n,"submit",x(t[12]))],L=!0)},p(t,e){if(20&e[0]&&l.value!==t[4].name&&O(l,t[4].name),4&e[0]){let n;for(j=t[2],n=0;n<j.length;n+=1){const o=Nt(t,j,n);D[n]?D[n].p(o,e):(D[n]=Ot(o),D[n].c(),D[n].m(f,null))}for(;n<D.length;n+=1)D[n].d(1);D.length=j.length}20&e[0]&&S(f,t[4].catName),20&e[0]&&k(E.value)!==t[4].score&&O(E,t[4].score),20&e[0]&&k(P.value)!==t[4].outof&&O(P,t[4].outof)},i(t){H||(B((()=>{T||(T=ot(e,bt,{},!0)),T.run(1)})),H=!0)},o(t){T||(T=ot(e,bt,{},!1)),T.run(0),H=!1},d(t){t&&p(e),$(D,t),t&&T&&T.end(),L=!1,r(M)}}}function Ot(t){let e,n,o,r=t[27].name+"";return{c(){e=b("option"),n=v(r),e.__value=o=t[27].name,e.value=e.__value},m(t,o){h(t,e,o),d(e,n)},p(t,i){4&i[0]&&r!==(r=t[27].name+"")&&C(n,r),4&i[0]&&o!==(o=t[27].name)&&(e.__value=o,e.value=e.__value)},d(t){t&&p(e)}}}function St(t){let e,n,o,i,s,l,a,u,c,f,m,g,$,y,C,S;return{c(){e=b("article"),n=b("form"),o=b("div"),i=b("label"),s=v("Category Name\r\n                    "),l=b("input"),a=w(),u=b("label"),c=v("Weight (%)\r\n                    "),f=b("input"),m=w(),g=b("input"),N(l,"type","text"),N(l,"name","cName"),l.required=!0,N(i,"for","cName"),N(f,"type","number"),N(f,"min","0"),N(f,"max","100"),N(f,"name","cWeight"),f.required=!0,N(u,"for","cWeight"),N(o,"class","grid"),N(g,"type","submit"),g.value="Add",N(n,"action","#"),N(e,"class","subcard")},m(r,p){h(r,e,p),d(e,n),d(n,o),d(o,i),d(i,s),d(i,l),O(l,t[5].name),d(o,a),d(o,u),d(u,c),d(u,f),O(f,t[5].weight),d(n,m),d(n,g),y=!0,C||(S=[_(l,"input",t[22]),_(f,"input",t[23]),_(n,"submit",x(t[13]))],C=!0)},p(t,e){32&e[0]&&l.value!==t[5].name&&O(l,t[5].name),32&e[0]&&k(f.value)!==t[5].weight&&O(f,t[5].weight)},i(t){y||(B((()=>{$||($=ot(e,bt,{},!0)),$.run(1)})),y=!0)},o(t){$||($=ot(e,bt,{},!1)),$.run(0),y=!1},d(t){t&&p(e),t&&$&&$.end(),C=!1,r(S)}}}function Et(t){let e,n,o;return{c(){e=b("article"),e.innerHTML="<p>Show Graph</p>",N(e,"class","subcard")},m(t,n){h(t,e,n),o=!0},i(t){o||(B((()=>{n||(n=ot(e,bt,{},!0)),n.run(1)})),o=!0)},o(t){n||(n=ot(e,bt,{},!1)),n.run(0),o=!1},d(t){t&&p(e),t&&n&&n.end()}}}function At(t){let e,n,o,s,l,a,u,c,f,m,g,$,y,S,E,A,F,G,P,W,q,T=t[30].name+"",H=t[30].toString()+"",L=t[30].getOgGrade()+"";function M(){t[24].call(A,t[31],t[32])}function j(){t[25].call(G,t[31],t[32])}return{c(){e=b("li"),n=b("nav"),o=b("ul"),s=b("li"),l=v(T),a=w(),u=v(H),c=v("% "),f=v(L),m=w(),g=b("a"),g.textContent="delete",$=w(),y=b("ul"),S=b("li"),E=b("div"),A=b("input"),F=w(),G=b("input"),P=w(),N(g,"href","/"),N(A,"type","number"),N(A,"placeholder","Score"),N(G,"type","number"),N(G,"placeholder","Out Of"),N(E,"class","grid")},m(r,p){h(r,e,p),d(e,n),d(n,o),d(o,s),d(s,l),d(s,a),d(s,u),d(s,c),d(s,f),d(s,m),d(s,g),d(n,$),d(n,y),d(y,S),d(S,E),d(E,A),O(A,t[30].score),d(E,F),d(E,G),O(G,t[30].outof),d(n,P),W||(q=[_(g,"click",x((function(){i(t[11](t[27],t[30]))&&t[11](t[27],t[30]).apply(this,arguments)}))),_(A,"input",M),_(G,"input",j)],W=!0)},p(e,n){t=e,4&n[0]&&T!==(T=t[30].name+"")&&C(l,T),4&n[0]&&H!==(H=t[30].toString()+"")&&C(u,H),4&n[0]&&L!==(L=t[30].getOgGrade()+"")&&C(f,L),4&n[0]&&k(A.value)!==t[30].score&&O(A,t[30].score),4&n[0]&&k(G.value)!==t[30].outof&&O(G,t[30].outof)},d(t){t&&p(e),W=!1,r(q)}}}function Ft(t){let e,n,o,r,i,s,l=t[27].toString()+"",a=t[27].assignments,u=[];for(let e=0;e<a.length;e+=1)u[e]=At(xt(t,a,e));return{c(){e=b("details"),n=b("summary"),o=v(l),r=w(),i=b("ul");for(let t=0;t<u.length;t+=1)u[t].c();s=w(),N(i,"class","longlist")},m(t,l){h(t,e,l),d(e,n),d(n,o),d(e,r),d(e,i);for(let t=0;t<u.length;t+=1)u[t].m(i,null);d(e,s)},p(t,e){if(4&e[0]&&l!==(l=t[27].toString()+"")&&C(o,l),2052&e[0]){let n;for(a=t[27].assignments,n=0;n<a.length;n+=1){const o=xt(t,a,n);u[n]?u[n].p(o,e):(u[n]=At(o),u[n].c(),u[n].m(i,null))}for(;n<u.length;n+=1)u[n].d(1);u.length=a.length}},d(t){t&&p(e),$(u,t)}}}function Gt(t){let e,n,o,i,s,l,a,u,c,f,m,g,x,k,O,S,E,A,F,G,P,W,q,T,H,L,M,j,D,R,B,I,z,Y,J,K,Q=t[0].details[0].task.courseName+"",U=t[9]()+"",V=(100*t[1]).toFixed(2)+"",nt=t[6]&&kt(t),ot=t[3].newAssig&&Ct(t),rt=t[3].newCategory&&St(t),it=t[3].showGraph&&Et(),st=t[2],lt=[];for(let e=0;e<st.length;e+=1)lt[e]=Ft(_t(t,st,e));return{c(){e=b("nav"),n=b("ul"),o=b("li"),i=b("h3"),s=v(Q),l=w(),a=b("ul"),u=b("li"),c=b("a"),c.innerHTML="<strong>Back</strong>",f=w(),m=b("div"),g=b("p"),x=b("strong"),x.textContent="Origional:",k=w(),O=v(U),S=v(" | "),E=b("strong"),E.textContent="New:",A=w(),F=v(V),G=v("%"),P=w(),nt&&nt.c(),W=w(),q=b("div"),T=b("button"),T.textContent="New Assignment",H=w(),L=b("button"),L.textContent="New Category",M=w(),ot&&ot.c(),j=w(),rt&&rt.c(),D=w(),it&&it.c(),R=w(),B=b("hr"),I=w();for(let t=0;t<lt.length;t+=1)lt[t].c();z=y(),N(c,"href","#/"),N(q,"class","grid")},m(r,p){h(r,e,p),d(e,n),d(n,o),d(o,i),d(i,s),d(e,l),d(e,a),d(a,u),d(u,c),h(r,f,p),h(r,m,p),d(m,g),d(g,x),d(g,k),d(g,O),d(g,S),d(g,E),d(g,A),d(g,F),d(g,G),t[15](m),h(r,P,p),nt&&nt.m(r,p),h(r,W,p),h(r,q,p),d(q,T),d(q,H),d(q,L),h(r,M,p),ot&&ot.m(r,p),h(r,j,p),rt&&rt.m(r,p),h(r,D,p),it&&it.m(r,p),h(r,R,p),h(r,B,p),h(r,I,p);for(let t=0;t<lt.length;t+=1)lt[t].m(r,p);h(r,z,p),Y=!0,J||(K=[_(c,"click",t[14]),_(T,"click",t[16]),_(L,"click",t[17])],J=!0)},p(t,e){if((!Y||1&e[0])&&Q!==(Q=t[0].details[0].task.courseName+"")&&C(s,Q),(!Y||2&e[0])&&V!==(V=(100*t[1]).toFixed(2)+"")&&C(F,V),t[6]?nt?nt.p(t,e):(nt=kt(t),nt.c(),nt.m(W.parentNode,W)):nt&&(nt.d(1),nt=null),t[3].newAssig?ot?(ot.p(t,e),8&e[0]&&tt(ot,1)):(ot=Ct(t),ot.c(),tt(ot,1),ot.m(j.parentNode,j)):ot&&(X(),et(ot,1,1,(()=>{ot=null})),Z()),t[3].newCategory?rt?(rt.p(t,e),8&e[0]&&tt(rt,1)):(rt=St(t),rt.c(),tt(rt,1),rt.m(D.parentNode,D)):rt&&(X(),et(rt,1,1,(()=>{rt=null})),Z()),t[3].showGraph?it?8&e[0]&&tt(it,1):(it=Et(),it.c(),tt(it,1),it.m(R.parentNode,R)):it&&(X(),et(it,1,1,(()=>{it=null})),Z()),2052&e[0]){let n;for(st=t[2],n=0;n<st.length;n+=1){const o=_t(t,st,n);lt[n]?lt[n].p(o,e):(lt[n]=Ft(o),lt[n].c(),lt[n].m(z.parentNode,z))}for(;n<lt.length;n+=1)lt[n].d(1);lt.length=st.length}},i(t){Y||(tt(ot),tt(rt),tt(it),Y=!0)},o(t){et(ot),et(rt),et(it),Y=!1},d(n){n&&p(e),n&&p(f),n&&p(m),t[15](null),n&&p(P),nt&&nt.d(n),n&&p(W),n&&p(q),n&&p(M),ot&&ot.d(n),n&&p(j),rt&&rt.d(n),n&&p(D),it&&it.d(n),n&&p(R),n&&p(B),n&&p(I),$(lt,n),n&&p(z),J=!1,r(K)}}}function Pt(t){return Object.assign({},t)}function Wt(t,e,n){let{course:o}=e;const r=T();let i=100,s=[];for(let t of o.details)for(let e of t.categories){let t=new vt(e.weight,e.name),n=t.alreadyExists(s);n.true&&(t=s[n.in]);for(let n of e.assignments)t.addAssignment(new yt(parseFloat(n.scorePoints)*n.multiplier,n.totalPoints*n.multiplier,n.assignmentName,(n.scorePoints*n.multiplier/(n.totalPoints*n.multiplier)*100).toFixed(2)));n.true||s.push(t)}function l(){let t=0;for(let e of s)t+=e.initialWeight;for(let e of s)e.weight=e.initialWeight/t*100}l();let a={newAssig:!1,newCategory:!1,showGraph:!1};function u(t){for(let e of Object.keys(a))e!=t||1==a[t]?n(3,a[e]=!1,a):n(3,a[t]=!0,a)}let c=new yt(10,10,"");let f=new vt(0,"");let d,m=!1;document.addEventListener("scroll",(()=>{try{window.pageYOffset>d.offsetTop?n(6,m=!0):n(6,m=!1)}catch(t){}}));return t.$$set=t=>{"course"in t&&n(0,o=t.course)},t.$$.update=()=>{if(6&t.$$.dirty[0]){n(1,i=0);let t=!1,e=0;for(let o of s){let r=o.getWeightedGrade();isNaN(r)?(t=!0,e+=o.weight):n(1,i+=r)}t&&n(1,i/=1-e/100),n(1,i),n(2,s)}},[o,i,s,a,c,f,m,d,r,function(){let t="";for(let e of o.details)null!=e.task.progressScore&&(t=e.task.progressScore+" ("+e.task.progressPercent+"%)");return t},u,function(t,e){let o=s.indexOf(t),r=s[o].assignments.indexOf(e);r>-1&&s[o].assignments.splice(r,1),n(2,s)},function(){for(let t of s)if(t.name==c.catName){let e=Pt(c),o=new yt(e.score,e.outof,e.name);return s[s.indexOf(t)].addAssignment(o),console.log(o.toString()),n(4,c=new yt(10,10,"")),void n(2,s)}},function(){Pt(f);let t=new vt(f.weight,f.name);s.push(t),l(),n(2,s)},()=>{r("message",{m:"goHome"})},function(t){L[t?"unshift":"push"]((()=>{d=t,n(7,d)}))},()=>{u("newAssig")},()=>{u("newCategory")},function(){c.name=this.value,n(4,c),n(2,s)},function(){c.catName=function(t){const e=t.querySelector(":checked")||t.options[0];return e&&e.__value}(this),n(4,c),n(2,s)},function(){c.score=k(this.value),n(4,c),n(2,s)},function(){c.outof=k(this.value),n(4,c),n(2,s)},function(){f.name=this.value,n(5,f)},function(){f.weight=k(this.value),n(5,f)},function(t,e){t[e].score=k(this.value),n(2,s)},function(t,e){t[e].outof=k(this.value),n(2,s)}]}class qt extends ut{constructor(t){super(),at(this,t,Wt,Gt,s,{course:0},null,[-1,-1])}}function Tt(t){let e,n,o,r;return n=new qt({props:{course:t[2]}}),n.$on("message",t[4]),{c(){e=b("div"),rt(n.$$.fragment)},m(t,o){h(t,e,o),it(n,e,null),r=!0},p(t,e){const o={};4&e&&(o.course=t[2]),n.$set(o)},i(t){r||(tt(n.$$.fragment,t),B((()=>{o||(o=ot(e,bt,{},!0)),o.run(1)})),r=!0)},o(t){et(n.$$.fragment,t),o||(o=ot(e,bt,{},!1)),o.run(0),r=!1},d(t){t&&p(e),st(n),t&&o&&o.end()}}}function Ht(t){let e,n,o,r;return n=new pt({props:{classes:t[0]}}),n.$on("message",t[3]),{c(){e=b("div"),rt(n.$$.fragment)},m(t,o){h(t,e,o),it(n,e,null),r=!0},p(t,e){const o={};1&e&&(o.classes=t[0]),n.$set(o)},i(t){r||(tt(n.$$.fragment,t),B((()=>{o||(o=ot(e,bt,{},!0)),o.run(1)})),r=!0)},o(t){et(n.$$.fragment,t),o||(o=ot(e,bt,{},!1)),o.run(0),r=!1},d(t){t&&p(e),st(n),t&&o&&o.end()}}}function Lt(t){let e,n,o,r,i,s,l,a,u;const c=[Ht,Tt],f=[];function m(t,e){return"Home"==t[1]?0:1}return i=m(t),s=f[i]=c[i](t),{c(){e=b("div"),n=b("br"),o=w(),r=b("article"),s.c(),l=w(),a=b("nav"),a.innerHTML='<ul><li><small>Infinite Campus Grade Predictor</small></li></ul> \n\t\t<ul><li><a href="#/"><small>About</small></a></li> \n\t\t\t<li><a href="https://github.com/benman604/Infinite-Campus-Grade-Predictor"><small>Github</small></a></li></ul>',N(e,"class","container")},m(t,s){h(t,e,s),d(e,n),d(e,o),d(e,r),f[i].m(r,null),d(e,l),d(e,a),u=!0},p(t,[e]){let n=i;i=m(t),i===n?f[i].p(t,e):(X(),et(f[n],1,1,(()=>{f[n]=null})),Z(),s=f[i],s?s.p(t,e):(s=f[i]=c[i](t),s.c()),tt(s,1),s.m(r,null))},i(t){u||(tt(s),u=!0)},o(t){et(s),u=!1},d(t){t&&p(e),f[i].d()}}}function Mt(t,e,n){chrome.storage.local.get(["IC_subdomain"],(t=>{chrome.tabs.create({url:`https://${t.IC_subdomain}.infinitecampus.org/campus/resources/portal/grades?q=${Date.now()}`})}));let o=[];chrome.runtime.onMessage.addListener(((t,e,r)=>{"getGradeDetails"==t.m&&(o.push(t.data),n(0,o))}));let r,i="Home";return[o,i,r,function(t){n(2,r=t.detail.data),n(1,i="Editor")},()=>{n(1,i="Home")}]}return new class extends ut{constructor(t){super(),at(this,t,Mt,Lt,s,{})}}({target:document.body})}();
//# sourceMappingURL=bundle.js.map
