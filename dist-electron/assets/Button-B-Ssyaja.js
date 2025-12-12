import { j as jsxDevRuntimeExports } from "./index-B_KZpQPc.js";
function Button({ children, onClick, variant = "primary", className = "", disabled = false }) {
  const base = "inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 focus-visible:ring-offset-0 disabled:opacity-40 disabled:cursor-not-allowed";
  const variantClasses = variant === "primary" ? "bg-gradient-to-r from-primary via-blue-500 to-indigo-600 text-black shadow-lg hover:shadow-blue-500/40 hover:translate-y-0.5" : "bg-gray-800/90 text-gray-100 border border-gray-700 hover:bg-gray-700";
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
    "button",
    {
      onClick: disabled ? void 0 : onClick,
      disabled,
      className: `${base} ${variantClasses} ${className}`,
      style: { fontFamily: "Inter, sans-serif" },
      children
    },
    void 0,
    false,
    {
      fileName: "C:/Users/harol/OneDrive/Documentos/Plan_Nuevo/src/renderer/components/Button.tsx",
      lineNumber: 11,
      columnNumber: 5
    },
    this
  );
}
export {
  Button as B
};
