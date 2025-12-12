import{r as b,j as r,c as u,R as f}from"./index-DVpKWacu.js";const h=({title:i,message:l,type:n="info",onConfirm:a,onCancel:e,confirmText:t="Aceptar",cancelText:d="Cancelar"})=>{b.useEffect(()=>(document.body.style.overflow="hidden",()=>{document.body.style.overflow="unset"}),[]);const s=()=>{switch(n){case"success":return{bg:"bg-gradient-to-br from-green-900/90 via-emerald-900/80 to-green-800/90",border:"border-green-500/50",iconBg:"bg-green-500/20",iconColor:"text-green-400"};case"warning":return{bg:"bg-gradient-to-br from-yellow-900/90 via-amber-900/80 to-yellow-800/90",border:"border-yellow-500/50",iconBg:"bg-yellow-500/20",iconColor:"text-yellow-400"};case"error":return{bg:"bg-gradient-to-br from-red-900/90 via-rose-900/80 to-red-800/90",border:"border-red-500/50",iconBg:"bg-red-500/20",iconColor:"text-red-400"};case"info":default:return{bg:"bg-gradient-to-br from-blue-900/90 via-indigo-900/80 to-blue-800/90",border:"border-blue-500/50",iconBg:"bg-blue-500/20",iconColor:"text-blue-400"}}},c=()=>{const o=s();switch(n){case"success":return r.jsx("div",{className:`${o.iconBg} rounded-full p-3`,children:r.jsx("svg",{className:`w-8 h-8 ${o.iconColor}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M5 13l4 4L19 7"})})});case"warning":return r.jsx("div",{className:`${o.iconBg} rounded-full p-3`,children:r.jsx("svg",{className:`w-8 h-8 ${o.iconColor}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M12 9v2m0 4h.01m-6.938 4h13.816c1.546 0 2.078-.669 1.752-1.79L14.397 7.45c-.326-1.121-.858-1.79-1.752-1.79H8.603c-.894 0-1.426.669-1.752 1.79L5.397 15.65c-.326 1.121.206 1.79 1.752 1.79z"})})});case"error":return r.jsx("div",{className:`${o.iconBg} rounded-full p-3`,children:r.jsx("svg",{className:`w-8 h-8 ${o.iconColor}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M6 18L18 6M6 6l12 12"})})});case"info":default:return r.jsx("div",{className:`${o.iconBg} rounded-full p-3`,children:r.jsx("svg",{className:`w-8 h-8 ${o.iconColor}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})})}},g=()=>{switch(n){case"success":return"bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/30";case"warning":return"bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white shadow-lg shadow-yellow-500/30";case"error":return"bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/30";case"info":default:return"bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30"}},m=s();return r.jsxs("div",{className:"fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn",onClick:o=>{o.target===o.currentTarget&&e&&e()},children:[r.jsx("div",{className:`border-2 ${m.border} ${m.bg} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden backdrop-blur-xl animate-scaleIn`,style:{animation:"scaleIn 0.3s ease-out"},children:r.jsxs("div",{className:"p-6",children:[r.jsxs("div",{className:"flex items-start gap-4",children:[r.jsx("div",{className:"flex-shrink-0 animate-bounceIn",children:c()}),r.jsxs("div",{className:"flex-1 min-w-0",children:[r.jsx("h3",{className:"text-xl font-bold text-white mb-2",children:i}),r.jsx("p",{className:"text-gray-200 leading-relaxed whitespace-pre-line",children:l})]})]}),r.jsxs("div",{className:"mt-6 flex justify-end gap-3",children:[e&&r.jsx("button",{onClick:e,className:"px-5 py-2.5 rounded-xl bg-gray-700/80 hover:bg-gray-600/80 text-gray-200 font-medium transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50",children:d}),r.jsx("button",{onClick:a,className:`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${g()}`,children:t})]})]})}),r.jsx("style",{children:`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-bounceIn {
          animation: bounceIn 0.6s ease-out;
        }
      `})]})},w=(i,l,n="info")=>new Promise(a=>{let e=document.getElementById("modern-alert-container");e&&e.remove(),e=document.createElement("div"),e.id="modern-alert-container",document.body.appendChild(e);const t=u.createRoot(e),d=()=>{setTimeout(()=>{t.unmount(),e&&e.parentNode&&e.parentNode.removeChild(e)},100),a(!1)},s=()=>{setTimeout(()=>{t.unmount(),e&&e.parentNode&&e.parentNode.removeChild(e)},100),a(!0)};t.render(f.createElement(h,{title:i,message:l,type:n,onConfirm:s,onCancel:n==="info"||n==="success"?void 0:d,confirmText:"Aceptar"}))}),p=(i,l,n="warning")=>new Promise(a=>{let e=document.getElementById("modern-confirm-container");e&&e.remove(),e=document.createElement("div"),e.id="modern-confirm-container",document.body.appendChild(e);const t=u.createRoot(e),d=()=>{setTimeout(()=>{t.unmount(),e&&e.parentNode&&e.parentNode.removeChild(e)},100),a(!1)},s=()=>{setTimeout(()=>{t.unmount(),e&&e.parentNode&&e.parentNode.removeChild(e)},100),a(!0)},c=n==="danger"?"error":n==="warning"?"warning":"info";t.render(f.createElement(h,{title:i,message:l,type:c,onConfirm:s,onCancel:d,confirmText:"Sí",cancelText:"Cancelar"}))});export{p as a,w as s};
