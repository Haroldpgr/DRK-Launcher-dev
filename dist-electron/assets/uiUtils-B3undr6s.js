import{r as f,j as r,c as h,R as u}from"./index-BUGoiAxp.js";const g=({title:i,message:l,type:n="info",onConfirm:a,onCancel:e,confirmText:t="Aceptar",cancelText:d="Cancelar"})=>{f.useEffect(()=>(document.body.style.overflow="hidden",()=>{document.body.style.overflow="unset"}),[]);const s=()=>{switch(n){case"success":return{bg:"bg-gradient-to-br from-green-900/90 via-emerald-900/80 to-green-800/90",border:"border-green-500/50",iconBg:"bg-green-500/20",iconColor:"text-green-400"};case"warning":return{bg:"bg-gradient-to-br from-yellow-900/90 via-amber-900/80 to-yellow-800/90",border:"border-yellow-500/50",iconBg:"bg-yellow-500/20",iconColor:"text-yellow-400"};case"error":return{bg:"bg-gradient-to-br from-red-900/90 via-rose-900/80 to-red-800/90",border:"border-red-500/50",iconBg:"bg-red-500/20",iconColor:"text-red-400"};case"info":default:return{bg:"bg-gradient-to-br from-blue-900/90 via-indigo-900/80 to-blue-800/90",border:"border-blue-500/50",iconBg:"bg-blue-500/20",iconColor:"text-blue-400"}}},c=()=>{const o=s();switch(n){case"success":return r.jsx("div",{className:`${o.iconBg} rounded-2xl p-4 shadow-lg ${o.iconColor}/20`,children:r.jsx("svg",{className:`w-10 h-10 ${o.iconColor}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"3",d:"M5 13l4 4L19 7"})})});case"warning":return r.jsx("div",{className:`${o.iconBg} rounded-2xl p-4 shadow-lg ${o.iconColor}/20`,children:r.jsx("svg",{className:`w-10 h-10 ${o.iconColor}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M12 9v2m0 4h.01m-6.938 4h13.816c1.546 0 2.078-.669 1.752-1.79L14.397 7.45c-.326-1.121-.858-1.79-1.752-1.79H8.603c-.894 0-1.426.669-1.752 1.79L5.397 15.65c-.326 1.121.206 1.79 1.752 1.79z"})})});case"error":return r.jsx("div",{className:`${o.iconBg} rounded-2xl p-4 shadow-lg ${o.iconColor}/20`,children:r.jsx("svg",{className:`w-10 h-10 ${o.iconColor}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M6 18L18 6M6 6l12 12"})})});case"info":default:return r.jsx("div",{className:`${o.iconBg} rounded-2xl p-4 shadow-lg ${o.iconColor}/20`,children:r.jsx("svg",{className:`w-10 h-10 ${o.iconColor}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})})}},b=()=>{switch(n){case"success":return"bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-400 hover:via-emerald-400 hover:to-green-500 text-white shadow-xl shadow-green-500/40 hover:shadow-green-500/50";case"warning":return"bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-500 text-white shadow-xl shadow-yellow-500/40 hover:shadow-yellow-500/50";case"error":return"bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-400 hover:via-rose-400 hover:to-red-500 text-white shadow-xl shadow-red-500/40 hover:shadow-red-500/50";case"info":default:return"bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-400 hover:via-indigo-400 hover:to-blue-500 text-white shadow-xl shadow-blue-500/40 hover:shadow-blue-500/50"}},m=s();return r.jsxs("div",{className:"fixed inset-0 bg-black/70 backdrop-blur-lg z-[9999] flex items-center justify-center p-4 animate-fadeIn",onClick:o=>{o.target===o.currentTarget&&e&&e()},children:[r.jsxs("div",{className:`relative border ${m.border} ${m.bg} rounded-3xl shadow-2xl w-full max-w-md overflow-hidden backdrop-blur-2xl animate-scaleIn`,style:{boxShadow:"0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)"},children:[r.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"}),r.jsxs("div",{className:"relative p-8",children:[r.jsxs("div",{className:"flex items-start gap-5",children:[r.jsx("div",{className:"flex-shrink-0 animate-bounceIn",children:c()}),r.jsxs("div",{className:"flex-1 min-w-0 pt-1",children:[r.jsx("h3",{className:"text-2xl font-bold text-white mb-3 tracking-tight",children:i}),r.jsx("p",{className:"text-gray-300 leading-relaxed whitespace-pre-line text-base",children:l})]})]}),r.jsxs("div",{className:"mt-8 flex justify-end gap-3",children:[e&&r.jsx("button",{onClick:e,className:"px-6 py-3 rounded-xl bg-gray-800/60 hover:bg-gray-700/80 text-gray-200 font-semibold transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50 hover:scale-105 active:scale-95",children:d}),r.jsx("button",{onClick:a,className:`px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 ${b()}`,children:t})]})]})]}),r.jsx("style",{children:`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.85) translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) rotate(10deg);
          }
          70% {
            transform: scale(0.95) rotate(-5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
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
      `})]})},v=(i,l,n="info")=>new Promise(a=>{let e=document.getElementById("modern-alert-container");e&&e.remove(),e=document.createElement("div"),e.id="modern-alert-container",document.body.appendChild(e);const t=h.createRoot(e),d=()=>{setTimeout(()=>{t.unmount(),e&&e.parentNode&&e.parentNode.removeChild(e)},100),a(!1)},s=()=>{setTimeout(()=>{t.unmount(),e&&e.parentNode&&e.parentNode.removeChild(e)},100),a(!0)};t.render(u.createElement(g,{title:i,message:l,type:n,onConfirm:s,onCancel:n==="info"||n==="success"?void 0:d,confirmText:"Aceptar"}))}),w=(i,l,n="warning")=>new Promise(a=>{let e=document.getElementById("modern-confirm-container");e&&e.remove(),e=document.createElement("div"),e.id="modern-confirm-container",document.body.appendChild(e);const t=h.createRoot(e),d=()=>{setTimeout(()=>{t.unmount(),e&&e.parentNode&&e.parentNode.removeChild(e)},100),a(!1)},s=()=>{setTimeout(()=>{t.unmount(),e&&e.parentNode&&e.parentNode.removeChild(e)},100),a(!0)},c=n==="danger"?"error":n==="warning"?"warning":"info";t.render(u.createElement(g,{title:i,message:l,type:c,onConfirm:s,onCancel:d,confirmText:"Sí",cancelText:"Cancelar"}))});export{w as a,v as s};
