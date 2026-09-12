/* @ds-bundle: {"format":4,"namespace":"OSRSDesignSystem_585e7e","components":[{"name":"ButtonTemplate","sourcePath":"components/actions/ButtonTemplate.jsx"},{"name":"ButtonWithIcon","sourcePath":"components/actions/ButtonWithIcon.jsx"},{"name":"SignInButton","sourcePath":"components/actions/SignInButton.jsx"},{"name":"CoDevRedMasterLogo","sourcePath":"components/brand/CoDevRedMasterLogo.jsx"},{"name":"CoDevSupplyRequestsLogo","sourcePath":"components/brand/CoDevSupplyRequestsLogo.jsx"},{"name":"CoDevWhiteMasterLogo","sourcePath":"components/brand/CoDevWhiteMasterLogo.jsx"},{"name":"StatusPills","sourcePath":"components/data-display/StatusPills.jsx"},{"name":"SupplyCard","sourcePath":"components/data-display/SupplyCard.jsx"},{"name":"Search","sourcePath":"components/forms/Search.jsx"},{"name":"ArrowCircleDownFill","sourcePath":"components/icons/ArrowCircleDownFill.jsx"},{"name":"ArrowCounterClockwise","sourcePath":"components/icons/ArrowCounterClockwise.jsx"},{"name":"CaretRight","sourcePath":"components/icons/CaretRight.jsx"},{"name":"CheckCircleFill","sourcePath":"components/icons/CheckCircleFill.jsx"},{"name":"GoogleIcon","sourcePath":"components/icons/GoogleIcon.jsx"},{"name":"MdiClipboardTextOutline","sourcePath":"components/icons/MdiClipboardTextOutline.jsx"},{"name":"MdiLightClipboardText","sourcePath":"components/icons/MdiLightClipboardText.jsx"},{"name":"Backdrop","sourcePath":"components/overlay/Backdrop.jsx"}],"sourceHashes":{"components/actions/ButtonTemplate.jsx":"3a266b25ddb2","components/actions/ButtonWithIcon.jsx":"db6cf60a9ac5","components/actions/SignInButton.jsx":"4c777e5a31e2","components/brand/CoDevRedMasterLogo.jsx":"eae5317f37fb","components/brand/CoDevSupplyRequestsLogo.jsx":"40cf2291d50e","components/brand/CoDevWhiteMasterLogo.jsx":"53f63f9c93c4","components/data-display/StatusPills.jsx":"96127492ad6c","components/data-display/SupplyCard.jsx":"85a95cde99fa","components/forms/Search.jsx":"14e8cce89a3d","components/icons/ArrowCircleDownFill.jsx":"38a4673d53ea","components/icons/ArrowCounterClockwise.jsx":"f763e5a0a33a","components/icons/CaretRight.jsx":"c550e3fc4077","components/icons/CheckCircleFill.jsx":"8972bec8455f","components/icons/GoogleIcon.jsx":"2d6c92d2e99a","components/icons/MdiClipboardTextOutline.jsx":"df91fab41257","components/icons/MdiLightClipboardText.jsx":"cfc4336fb6c8","components/overlay/Backdrop.jsx":"fc817aeb62a5","ui_kits/osrs-web/App.jsx":"e94f7e02d69f","ui_kits/osrs-web/CatalogScreen.jsx":"15b49aaa49e2","ui_kits/osrs-web/Chrome.jsx":"89cb757d0f1b","ui_kits/osrs-web/InventoryScreen.jsx":"91420347c27f","ui_kits/osrs-web/LoginScreen.jsx":"1c7d6f6014b7","ui_kits/osrs-web/ProfileScreen.jsx":"562c26c9027e","ui_kits/osrs-web/RequestScreens.jsx":"3c8c33483539"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.OSRSDesignSystem_585e7e = window.OSRSDesignSystem_585e7e || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/CoDevRedMasterLogo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 14:306 CoDev - red - master logo
const dsAssetBase = (() => {
  if (typeof document === 'undefined') return '';
  const s = document.querySelector('script[src$="_ds_bundle.js"]');
  return s ? s.getAttribute('src').replace(/_ds_bundle\.js$/, '') : '';
})();
function CoDevRedMasterLogo({
  height = 39,
  src,
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("img", _extends({
    className: className,
    src: src ?? dsAssetBase + 'assets/logo-codev-red.png',
    alt: "codev",
    style: {
      height,
      width: 'auto',
      display: 'block',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { CoDevRedMasterLogo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/CoDevRedMasterLogo.jsx", error: String((e && e.message) || e) }); }

// components/brand/CoDevSupplyRequestsLogo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 14:311 CoDev - Supply Requests - Logo
function CoDevSupplyRequestsLogo({
  productName = 'SUPPLY REQUESTS',
  markHeight = 36,
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      width: 'fit-content',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      alignItems: 'flex-start',
      position: 'relative',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.CoDevRedMasterLogo, {
    height: markHeight
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: 14,
      lineHeight: 1.5,
      whiteSpace: 'nowrap',
      color: 'var(--text-primary)'
    }
  }, productName));
}
Object.assign(__ds_scope, { CoDevSupplyRequestsLogo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/CoDevSupplyRequestsLogo.jsx", error: String((e && e.message) || e) }); }

// components/brand/CoDevWhiteMasterLogo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 14:307 CoDev - white - master logo
const dsAssetBase = (() => {
  if (typeof document === 'undefined') return '';
  const s = document.querySelector('script[src$="_ds_bundle.js"]');
  return s ? s.getAttribute('src').replace(/_ds_bundle\.js$/, '') : '';
})();
function CoDevWhiteMasterLogo({
  height = 39,
  src,
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("img", _extends({
    className: className,
    src: src ?? dsAssetBase + 'assets/logo-codev-white.png',
    alt: "codev",
    style: {
      height,
      width: 'auto',
      display: 'block',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { CoDevWhiteMasterLogo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/CoDevWhiteMasterLogo.jsx", error: String((e && e.message) || e) }); }

// components/data-display/StatusPills.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 21:147 Status Pills
const AVAILABILITY = {
  available: {
    bg: 'var(--status-available-bg)',
    fg: 'var(--status-available-fg)',
    label: 'Available '
  },
  unavailable: {
    bg: 'var(--status-unavailable-bg)',
    fg: 'var(--status-unavailable-fg)',
    label: 'Unavailable'
  }
};
const REQUEST = {
  'Pending Approval': {
    bg: 'var(--status-pending-bg)',
    fg: 'var(--status-pending-fg)'
  },
  Approved: {
    bg: 'var(--status-ready-bg)',
    fg: 'var(--status-ready-fg)'
  },
  'Ready for Pickup': {
    bg: 'var(--status-ready-bg)',
    fg: 'var(--status-ready-fg)'
  },
  'For Delivery': {
    bg: 'var(--status-ready-bg)',
    fg: 'var(--status-ready-fg)'
  },
  'For Release': {
    bg: 'var(--status-ready-bg)',
    fg: 'var(--status-ready-fg)'
  },
  Released: {
    bg: 'var(--status-ready-bg)',
    fg: 'var(--status-ready-fg)'
  },
  Completed: {
    bg: 'var(--status-ready-bg)',
    fg: 'var(--status-ready-fg)'
  },
  Rejected: {
    bg: 'var(--status-rejected-bg)',
    fg: 'var(--status-rejected-fg)'
  },
  'In Stock': {
    bg: 'var(--status-ready-bg)',
    fg: 'var(--status-ready-fg)'
  },
  'Low Stock': {
    bg: 'var(--status-pending-bg)',
    fg: 'var(--status-pending-fg)'
  },
  'Out of Stock': {
    bg: 'var(--status-rejected-bg)',
    fg: 'var(--status-rejected-fg)'
  }
};
function StatusPills({
  shape = 'pill',
  status = 'Pending Approval',
  availability,
  label,
  className,
  style,
  ...rest
}) {
  const box = availability ? AVAILABILITY[availability] ?? AVAILABILITY.available : REQUEST[status] ?? REQUEST['Pending Approval'];
  const rounded = shape === 'rounded' || !!availability;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: rounded ? 'center' : 'flex-start',
      borderRadius: rounded ? 8 : 999,
      padding: rounded ? '10px' : '6px 10px',
      backgroundColor: box.bg,
      color: box.fg,
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: rounded ? 11.5 : 12,
      lineHeight: rounded ? 1.3 : '100%',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      ...style
    }
  }, rest), label ?? (availability ? box.label : status));
}
Object.assign(__ds_scope, { StatusPills });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/StatusPills.jsx", error: String((e && e.message) || e) }); }

// components/data-display/SupplyCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 18:68 Supply card
const dsAssetBase = (() => {
  if (typeof document === 'undefined') return '';
  const s = document.querySelector('script[src$="_ds_bundle.js"]');
  return s ? s.getAttribute('src').replace(/_ds_bundle\.js$/, '') : '';
})();
function SupplyCard({
  category = 'Devices',
  name = 'Business Laptop',
  availability = 'available',
  availabilityLabel,
  modelLabel = 'Model',
  model = 'Dell Latitude',
  quantity = 1,
  onQuantityChange,
  actionLabel = 'Add to Request List',
  onAction,
  image,
  className,
  style,
  ...rest
}) {
  const step = d => onQuantityChange && onQuantityChange(Math.max(1, quantity + d));
  const stepBtn = {
    borderRadius: 4,
    border: 'none',
    background: 'transparent',
    padding: '4px 8px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: 14,
    lineHeight: '100%',
    color: 'var(--osrs-stone-600)',
    cursor: 'pointer'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      width: 436,
      overflow: 'hidden',
      borderRadius: 10,
      backgroundColor: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      position: 'relative',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 180,
      alignSelf: 'stretch',
      flexShrink: 0,
      background: `url(${image ?? dsAssetBase + 'assets/item-laptop.jpg'}) center / cover no-repeat`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 18,
      alignItems: 'flex-start',
      boxSizing: 'border-box',
      alignSelf: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 11,
      lineHeight: '100%',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, category), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 17,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, name), /*#__PURE__*/React.createElement(__ds_scope.StatusPills, {
    availability: availability,
    label: availabilityLabel
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 11.5,
      lineHeight: 1.3,
      color: 'var(--text-primary)'
    }
  }, modelLabel), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 46,
      overflow: 'hidden',
      borderRadius: 10,
      backgroundColor: 'var(--surface-card)',
      boxShadow: 'var(--ring-default)',
      display: 'flex',
      flexDirection: 'row',
      padding: '0 16px',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxSizing: 'border-box',
      alignSelf: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, model), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 12,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, "\u2304")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 4,
      backgroundColor: 'var(--surface-stepper)',
      display: 'flex',
      flexDirection: 'row',
      gap: 8,
      padding: 2,
      alignItems: 'center',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: stepBtn,
    onClick: () => step(-1)
  }, "-"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--osrs-stone-900)'
    }
  }, quantity), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: stepBtn,
    onClick: () => step(1)
  }, "+")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      width: 304,
      height: 42,
      overflow: 'hidden',
      borderRadius: 10,
      border: 'none',
      backgroundColor: 'var(--brand-primary)',
      boxShadow: 'var(--ring-brand)',
      display: 'flex',
      flexDirection: 'row',
      padding: '0 18px',
      justifyContent: 'center',
      alignItems: 'center',
      boxSizing: 'border-box',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 13,
      lineHeight: '100%',
      whiteSpace: 'nowrap',
      color: 'var(--brand-on-primary)'
    }
  }, actionLabel)))));
}
Object.assign(__ds_scope, { SupplyCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/SupplyCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Search.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 17:38 Search
function Search({
  placeholder = 'Search supplies by name or category',
  value,
  onChange,
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      height: 46,
      overflow: 'hidden',
      borderRadius: 10,
      backgroundColor: 'var(--surface-card)',
      boxShadow: 'var(--ring-default)',
      display: 'flex',
      flexDirection: 'row',
      gap: 10,
      padding: '0 16px',
      alignItems: 'center',
      boxSizing: 'border-box',
      position: 'relative',
      color: 'var(--text-secondary)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 13.5 13.5",
    fill: "none",
    style: {
      position: 'absolute',
      left: 2.25,
      top: 2.25,
      width: 13.5,
      height: 13.5
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 13.147 13.854 C 13.342 14.049 13.658 14.049 13.854 13.854 C 14.049 13.658 14.049 13.342 13.854 13.147 L 13.5 13.5 L 13.147 13.854 Z M 10.599 9.892 C 10.403 9.696 10.087 9.696 9.892 9.892 C 9.696 10.087 9.696 10.403 9.892 10.599 L 10.245 10.245 L 10.599 9.892 Z M 13.5 13.5 L 13.854 13.147 L 10.599 9.892 L 10.245 10.245 L 9.892 10.599 L 13.147 13.854 L 13.5 13.5 Z M 12 6 L 11.5 6 C 11.5 9.038 9.038 11.5 6 11.5 L 6 12 L 6 12.5 C 9.59 12.5 12.5 9.59 12.5 6 L 12 6 Z M 6 12 L 6 11.5 C 2.962 11.5 0.5 9.038 0.5 6 L 0 6 L -0.5 6 C -0.5 9.59 2.41 12.5 6 12.5 L 6 12 Z M 0 6 L 0.5 6 C 0.5 2.962 2.962 0.5 6 0.5 L 6 0 L 6 -0.5 C 2.41 -0.5 -0.5 2.41 -0.5 6 L 0 6 Z M 6 0 L 6 0.5 C 9.038 0.5 11.5 2.962 11.5 6 L 12 6 L 12.5 6 C 12.5 2.41 9.59 -0.5 6 -0.5 L 6 0 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  }))), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }));
}
Object.assign(__ds_scope, { Search });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Search.jsx", error: String((e && e.message) || e) }); }

// components/icons/ArrowCircleDownFill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 30:3080 arrow-circle-down-fill
function ArrowCircleDownFill({
  size = 30,
  color = 'rgb(73,76,80)',
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      width: size,
      height: size,
      overflow: 'hidden',
      position: 'relative',
      color,
      display: 'inline-block',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24.375 24.375",
    fill: "none",
    style: {
      position: 'absolute',
      left: `${2.812 / 30 * 100}%`,
      top: `${2.813 / 30 * 100}%`,
      width: `${24.375 / 30 * 100}%`,
      height: `${24.375 / 30 * 100}%`
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 12.188 0 C 9.777 0 7.421 0.715 5.416 2.054 C 3.412 3.393 1.85 5.297 0.928 7.524 C 0.005 9.751 -0.236 12.201 0.234 14.565 C 0.704 16.929 1.865 19.101 3.57 20.805 C 5.274 22.51 7.446 23.671 9.81 24.141 C 12.174 24.611 14.624 24.37 16.851 23.447 C 19.078 22.525 20.982 20.963 22.321 18.959 C 23.66 16.954 24.375 14.598 24.375 12.188 C 24.372 8.956 23.086 5.858 20.802 3.573 C 18.517 1.289 15.419 0.003 12.188 0 Z M 16.601 13.788 L 12.851 17.538 C 12.764 17.625 12.66 17.695 12.547 17.742 C 12.433 17.789 12.311 17.813 12.188 17.813 C 12.064 17.813 11.942 17.789 11.828 17.742 C 11.715 17.695 11.611 17.625 11.524 17.538 L 7.774 13.788 C 7.598 13.612 7.499 13.374 7.499 13.125 C 7.499 12.876 7.598 12.638 7.774 12.462 C 7.95 12.286 8.189 12.187 8.438 12.187 C 8.686 12.187 8.925 12.286 9.101 12.462 L 11.25 14.612 L 11.25 7.5 C 11.25 7.251 11.349 7.013 11.525 6.837 C 11.7 6.661 11.939 6.563 12.188 6.563 C 12.436 6.563 12.675 6.661 12.85 6.837 C 13.026 7.013 13.125 7.251 13.125 7.5 L 13.125 14.612 L 15.274 12.462 C 15.45 12.286 15.689 12.187 15.938 12.187 C 16.186 12.187 16.425 12.286 16.601 12.462 C 16.777 12.638 16.876 12.876 16.876 13.125 C 16.876 13.374 16.777 13.612 16.601 13.788 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })));
}
Object.assign(__ds_scope, { ArrowCircleDownFill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/ArrowCircleDownFill.jsx", error: String((e && e.message) || e) }); }

// components/icons/ArrowCounterClockwise.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 30:3067 arrow-counter-clockwise
function ArrowCounterClockwise({
  size = 30,
  color = 'rgb(73,76,80)',
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      width: size,
      height: size,
      overflow: 'hidden',
      position: 'relative',
      color,
      display: 'inline-block',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24.375 22.498",
    fill: "none",
    style: {
      position: 'absolute',
      left: `${1.875 / 30 * 100}%`,
      top: `${3.752 / 30 * 100}%`,
      width: `${24.375 / 30 * 100}%`,
      height: `${22.498 / 30 * 100}%`
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 24.375 11.248 C 24.375 14.206 23.211 17.045 21.134 19.15 C 19.056 21.256 16.234 22.459 13.276 22.498 L 13.125 22.498 C 10.252 22.506 7.486 21.406 5.402 19.428 C 5.313 19.343 5.241 19.242 5.191 19.129 C 5.14 19.017 5.113 18.896 5.109 18.773 C 5.106 18.65 5.127 18.527 5.171 18.412 C 5.215 18.297 5.281 18.192 5.365 18.102 C 5.45 18.013 5.552 17.941 5.664 17.89 C 5.776 17.84 5.898 17.812 6.021 17.809 C 6.144 17.806 6.266 17.826 6.382 17.87 C 6.497 17.914 6.602 17.98 6.691 18.065 C 8.032 19.329 9.715 20.17 11.531 20.483 C 13.346 20.796 15.214 20.568 16.9 19.825 C 18.587 19.083 20.017 17.861 21.012 16.31 C 22.008 14.76 22.524 12.951 22.498 11.108 C 22.471 9.266 21.902 7.473 20.862 5.952 C 19.821 4.431 18.356 3.251 16.649 2.558 C 14.942 1.865 13.068 1.691 11.262 2.056 C 9.457 2.422 7.799 3.312 6.496 4.614 C 6.486 4.625 6.476 4.634 6.465 4.644 L 3.35 7.498 L 6.563 7.498 C 6.811 7.498 7.05 7.597 7.225 7.773 C 7.401 7.949 7.5 8.187 7.5 8.436 C 7.5 8.684 7.401 8.923 7.225 9.099 C 7.05 9.275 6.811 9.373 6.563 9.373 L 0.938 9.373 C 0.689 9.373 0.45 9.275 0.275 9.099 C 0.099 8.923 0 8.684 0 8.436 L 0 2.811 C 0 2.562 0.099 2.324 0.275 2.148 C 0.45 1.972 0.689 1.873 0.938 1.873 C 1.186 1.873 1.425 1.972 1.6 2.148 C 1.776 2.324 1.875 2.562 1.875 2.811 L 1.875 6.303 L 5.186 3.28 C 6.761 1.711 8.765 0.644 10.946 0.213 C 13.127 -0.218 15.386 0.008 17.44 0.86 C 19.493 1.713 21.247 3.155 22.481 5.003 C 23.716 6.852 24.375 9.025 24.375 11.248 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })));
}
Object.assign(__ds_scope, { ArrowCounterClockwise });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/ArrowCounterClockwise.jsx", error: String((e && e.message) || e) }); }

// components/actions/ButtonWithIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 30:3071 button with icon (2 variants: Property 1 default | hover)
function ButtonWithIcon({
  property1 = 'default',
  label = 'Regenerate List of jobs',
  icon,
  className,
  style,
  ...rest
}) {
  const hover = property1 === 'hover';
  const color = hover ? 'var(--osrs-template-muted)' : 'var(--osrs-template-ink)';
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: className,
    style: {
      width: 'fit-content',
      background: 'none',
      border: 'none',
      padding: 0,
      borderRadius: hover ? 10 : undefined,
      display: 'flex',
      flexDirection: 'row',
      gap: 4,
      alignItems: 'center',
      position: 'relative',
      cursor: 'pointer',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0
    }
  }, icon ?? /*#__PURE__*/React.createElement(__ds_scope.ArrowCounterClockwise, {
    size: 22,
    color: color
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-noto)',
      fontWeight: 500,
      fontSize: 16,
      lineHeight: '100%',
      whiteSpace: 'nowrap',
      color
    }
  }, label));
}
Object.assign(__ds_scope, { ButtonWithIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/ButtonWithIcon.jsx", error: String((e && e.message) || e) }); }

// components/icons/CaretRight.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 30:3083 caret-right
function CaretRight({
  size = 30,
  color = 'rgb(73,76,80)',
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      width: size,
      height: size,
      overflow: 'hidden',
      position: 'relative',
      color,
      display: 'inline-block',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 11.251 20.626",
    fill: "none",
    style: {
      position: 'absolute',
      left: `${10.312 / 30 * 100}%`,
      top: `${4.687 / 30 * 100}%`,
      width: `${11.251 / 30 * 100}%`,
      height: `${20.626 / 30 * 100}%`
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 10.976 10.976 L 1.601 20.351 C 1.514 20.438 1.411 20.508 1.297 20.555 C 1.183 20.602 1.061 20.626 0.938 20.626 C 0.815 20.626 0.693 20.602 0.579 20.555 C 0.465 20.508 0.362 20.438 0.275 20.351 C 0.188 20.264 0.119 20.161 0.071 20.047 C 0.024 19.933 0 19.811 0 19.688 C 0 19.565 0.024 19.443 0.071 19.329 C 0.119 19.215 0.188 19.112 0.275 19.025 L 8.988 10.313 L 0.275 1.601 C 0.099 1.425 0 1.187 0 0.938 C 0 0.689 0.099 0.451 0.275 0.275 C 0.451 0.099 0.689 0 0.938 0 C 1.187 0 1.425 0.099 1.601 0.275 L 10.976 9.65 C 11.063 9.737 11.133 9.84 11.18 9.954 C 11.227 10.068 11.251 10.19 11.251 10.313 C 11.251 10.436 11.227 10.558 11.18 10.672 C 11.133 10.786 11.063 10.889 10.976 10.976 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })));
}
Object.assign(__ds_scope, { CaretRight });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/CaretRight.jsx", error: String((e && e.message) || e) }); }

// components/icons/CheckCircleFill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 30:3086 check-circle-fill
function CheckCircleFill({
  size = 30,
  color = 'rgb(73,76,80)',
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      width: size,
      height: size,
      overflow: 'hidden',
      position: 'relative',
      color,
      display: 'inline-block',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24.375 24.375",
    fill: "none",
    style: {
      position: 'absolute',
      left: `${2.812 / 30 * 100}%`,
      top: `${2.813 / 30 * 100}%`,
      width: `${24.375 / 30 * 100}%`,
      height: `${24.375 / 30 * 100}%`
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 12.188 0 C 9.777 0 7.421 0.715 5.416 2.054 C 3.412 3.393 1.85 5.297 0.928 7.524 C 0.005 9.751 -0.236 12.201 0.234 14.565 C 0.704 16.929 1.865 19.101 3.57 20.805 C 5.274 22.51 7.446 23.671 9.81 24.141 C 12.174 24.611 14.624 24.37 16.851 23.447 C 19.078 22.525 20.982 20.963 22.321 18.959 C 23.66 16.954 24.375 14.598 24.375 12.188 C 24.372 8.956 23.086 5.858 20.802 3.573 C 18.517 1.289 15.419 0.003 12.188 0 Z M 17.538 10.038 L 10.976 16.601 C 10.889 16.688 10.785 16.757 10.672 16.804 C 10.558 16.851 10.436 16.876 10.313 16.876 C 10.189 16.876 10.067 16.851 9.953 16.804 C 9.84 16.757 9.736 16.688 9.649 16.601 L 6.837 13.788 C 6.661 13.612 6.562 13.374 6.562 13.125 C 6.562 12.876 6.661 12.638 6.837 12.462 C 7.013 12.286 7.251 12.187 7.5 12.187 C 7.749 12.187 7.987 12.286 8.163 12.462 L 10.313 14.612 L 16.212 8.712 C 16.299 8.625 16.402 8.556 16.516 8.508 C 16.63 8.461 16.752 8.437 16.875 8.437 C 16.998 8.437 17.12 8.461 17.234 8.508 C 17.348 8.556 17.451 8.625 17.538 8.712 C 17.625 8.799 17.694 8.902 17.742 9.016 C 17.789 9.13 17.813 9.252 17.813 9.375 C 17.813 9.498 17.789 9.62 17.742 9.734 C 17.694 9.848 17.625 9.951 17.538 10.038 Z",
    fill: "currentColor",
    fillRule: "evenodd"
  })));
}
Object.assign(__ds_scope, { CheckCircleFill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/CheckCircleFill.jsx", error: String((e && e.message) || e) }); }

// components/actions/ButtonTemplate.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 30:3088 button template (2 variants: state default | saved)
function ButtonTemplate({
  state = 'default',
  label,
  icon,
  className,
  style,
  ...rest
}) {
  const saved = state === 'saved';
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: className,
    style: {
      width: 'fit-content',
      height: saved ? undefined : 46,
      overflow: 'hidden',
      borderRadius: 8,
      border: 'none',
      opacity: saved ? 0.4 : 1,
      backgroundColor: saved ? 'var(--osrs-template-surface)' : 'var(--osrs-white)',
      boxShadow: 'inset 0 0 0 1px var(--osrs-template-purple)',
      display: 'flex',
      flexDirection: 'row',
      gap: 8,
      padding: '12px 24px',
      justifyContent: 'center',
      alignItems: 'center',
      boxSizing: 'border-box',
      position: 'relative',
      cursor: saved ? 'default' : 'pointer',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0
    }
  }, icon ?? (saved ? /*#__PURE__*/React.createElement(__ds_scope.CheckCircleFill, {
    size: 22,
    color: "var(--osrs-template-purple)"
  }) : /*#__PURE__*/React.createElement(__ds_scope.ArrowCircleDownFill, {
    size: 22,
    color: "var(--osrs-template-purple)"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-noto)',
      fontWeight: 700,
      fontSize: 16,
      lineHeight: '100%',
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      color: 'var(--osrs-template-purple)'
    }
  }, label ?? (saved ? 'Template saved' : 'Save as template')));
}
Object.assign(__ds_scope, { ButtonTemplate });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/ButtonTemplate.jsx", error: String((e && e.message) || e) }); }

// components/icons/GoogleIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 14:329 Google Icon (3 variants: Size 32x32 | 40x40 | 48x48)
const GOOGLE_PATHS = {
  "32x32": [32, ["M 32 16.364 C 32 15.229 31.896 14.138 31.703 13.091 L 16.327 13.091 L 16.327 19.28 L 25.113 19.28 C 24.735 21.28 23.584 22.975 21.855 24.109 L 21.855 28.124 L 27.132 28.124 C 30.219 25.338 32 21.236 32 16.364 Z", "M 16.327 32 C 20.735 32 24.43 30.567 27.132 28.124 L 21.855 24.109 C 20.393 25.069 18.523 25.636 16.327 25.636 C 12.074 25.636 8.475 22.822 7.191 19.04 L 1.737 19.04 L 1.737 23.185 C 4.423 28.414 9.944 32 16.327 32 Z", "M 7.191 19.04 C 6.865 18.08 6.679 17.055 6.679 16 C 6.679 14.946 6.865 13.92 7.191 12.96 L 7.191 8.815 L 1.737 8.815 C 0.631 10.975 0 13.418 0 16 C 0 18.582 0.631 21.025 1.737 23.185 L 7.191 19.04 Z", "M 16.327 6.364 C 18.724 6.364 20.876 7.171 22.568 8.756 L 27.25 4.167 C 24.423 1.585 20.727 0 16.327 0 C 9.944 0 4.423 3.586 1.737 8.815 L 7.191 12.96 C 8.475 9.178 12.074 6.364 16.327 6.364 Z"]],
  "40x40": [40, ["M 40 20.455 C 40 19.036 39.87 17.673 39.629 16.364 L 20.408 16.364 L 20.408 24.1 L 31.392 24.1 C 30.918 26.6 29.481 28.718 27.319 30.136 L 27.319 35.155 L 33.915 35.155 C 37.774 31.673 40 26.546 40 20.455 Z", "M 20.408 40 C 25.918 40 30.538 38.209 33.915 35.155 L 27.319 30.136 C 25.492 31.336 23.154 32.045 20.408 32.045 C 15.093 32.045 10.594 28.527 8.989 23.8 L 2.171 23.8 L 2.171 28.982 C 5.529 35.518 12.43 40 20.408 40 Z", "M 8.989 23.8 C 8.581 22.6 8.349 21.318 8.349 20 C 8.349 18.682 8.581 17.4 8.989 16.2 L 8.989 11.018 L 2.171 11.018 C 0.788 13.718 0 16.773 0 20 C 0 23.227 0.789 26.282 2.171 28.982 L 8.989 23.8 Z", "M 20.408 7.955 C 23.405 7.955 26.095 8.964 28.21 10.945 L 34.063 5.209 C 30.529 1.982 25.909 0 20.408 0 C 12.43 0 5.529 4.482 2.171 11.018 L 8.989 16.2 C 10.594 11.473 15.093 7.955 20.408 7.955 Z"]],
  "48x48": [48, ["M 48 24.546 C 48 22.844 47.844 21.207 47.555 19.637 L 24.49 19.637 L 24.49 28.92 L 37.67 28.92 C 37.102 31.92 35.377 34.462 32.783 36.164 L 32.783 42.186 L 40.698 42.186 C 45.328 38.007 48 31.855 48 24.546 Z", "M 24.49 48 C 31.102 48 36.646 45.851 40.698 42.186 L 32.783 36.164 C 30.59 37.604 27.785 38.455 24.49 38.455 C 18.111 38.455 12.712 34.233 10.787 28.56 L 2.605 28.56 L 2.605 34.778 C 6.635 42.622 14.917 48 24.49 48 Z", "M 10.787 28.56 C 10.297 27.12 10.019 25.582 10.019 24 C 10.019 22.418 10.297 20.88 10.787 19.44 L 10.787 13.222 L 2.605 13.222 C 0.946 16.462 0 20.127 0 24 C 0 27.873 0.946 31.538 2.605 34.778 L 10.787 28.56 Z", "M 24.49 9.545 C 28.085 9.545 31.314 10.756 33.852 13.135 L 40.876 6.251 C 36.635 2.378 31.091 0 24.49 0 C 14.917 0 6.635 5.378 2.605 13.222 L 10.787 19.44 C 12.712 13.767 18.111 9.545 24.49 9.545 Z"]]
};
function GoogleIcon({
  size = '32x32',
  className,
  style,
  ...rest
}) {
  const [box, paths] = GOOGLE_PATHS[size] ?? GOOGLE_PATHS['32x32'];
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      width: box,
      height: box,
      position: 'relative',
      color: 'var(--osrs-google-red)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    width: box,
    height: box,
    viewBox: '0 0 ' + box + ' ' + box,
    fill: "none",
    style: {
      position: 'absolute',
      left: 0,
      top: 0
    }
  }, paths.map((d, i) => /*#__PURE__*/React.createElement("path", {
    key: i,
    d: d,
    fill: "currentColor",
    fillRule: "evenodd"
  }))));
}
Object.assign(__ds_scope, { GoogleIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/GoogleIcon.jsx", error: String((e && e.message) || e) }); }

// components/actions/SignInButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 14:339 Sign in Button (4 variants: Darkmode × Mobile)
function SignInButton({
  darkmode = true,
  mobile = false,
  cta = 'Sign in with Google',
  iconPadding = 16,
  labelPadding = '18px 16px',
  className,
  style,
  ...rest
}) {
  const shellBg = darkmode ? 'var(--osrs-google-blue)' : 'var(--osrs-white)';
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: className,
    style: {
      width: 'fit-content',
      border: 'none',
      backgroundColor: shellBg,
      display: 'flex',
      flexDirection: 'row',
      padding: mobile ? 0 : '0 32px 0 0',
      alignItems: 'center',
      boxSizing: 'border-box',
      position: 'relative',
      cursor: 'pointer',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      backgroundColor: 'var(--osrs-white)',
      boxShadow: darkmode ? 'inset 0 0 0 2px var(--osrs-google-blue)' : undefined,
      display: 'flex',
      gap: 8,
      padding: iconPadding,
      justifyContent: 'center',
      alignItems: 'center',
      boxSizing: 'border-box',
      alignSelf: 'stretch'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.GoogleIcon, {
    size: "32x32"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      backgroundColor: shellBg,
      display: 'flex',
      gap: 8,
      padding: labelPadding,
      alignItems: 'center',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-google)',
      fontWeight: 500,
      fontSize: 18,
      lineHeight: '100%',
      letterSpacing: '0.005em',
      whiteSpace: 'nowrap',
      color: darkmode ? 'var(--osrs-white)' : 'var(--osrs-google-gray)'
    }
  }, cta)));
}
Object.assign(__ds_scope, { SignInButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/SignInButton.jsx", error: String((e && e.message) || e) }); }

// components/icons/MdiClipboardTextOutline.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 15:539 mdi:clipboard-text-outline
function MdiClipboardTextOutline({
  size = 24,
  color = 'rgb(0,0,0)',
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      width: size,
      height: size,
      overflow: 'hidden',
      position: 'relative',
      color,
      display: 'inline-block',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 18 19.979",
    fill: "none",
    style: {
      position: 'absolute',
      left: `${3 / 24 * 100}%`,
      top: `${1.021 / 24 * 100}%`,
      width: `${18 / 24 * 100}%`,
      height: `${19.979 / 24 * 100}%`
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 16 1.979 L 11.82 1.979 C 11.25 0.419 9.53 -0.381 8 0.179 C 7.14 0.479 6.5 1.139 6.18 1.979 L 2 1.979 C 1.47 1.979 0.961 2.189 0.586 2.564 C 0.211 2.939 0 3.448 0 3.979 L 0 17.979 C 0 18.509 0.211 19.018 0.586 19.393 C 0.961 19.768 1.47 19.979 2 19.979 L 16 19.979 C 16.53 19.979 17.039 19.768 17.414 19.393 C 17.789 19.018 18 18.509 18 17.979 L 18 3.979 C 18 3.448 17.789 2.939 17.414 2.564 C 17.039 2.189 16.53 1.979 16 1.979 Z M 9 1.979 C 9.265 1.979 9.52 2.084 9.707 2.271 C 9.895 2.459 10 2.713 10 2.979 C 10 3.244 9.895 3.498 9.707 3.686 C 9.52 3.873 9.265 3.979 9 3.979 C 8.735 3.979 8.48 3.873 8.293 3.686 C 8.105 3.498 8 3.244 8 2.979 C 8 2.713 8.105 2.459 8.293 2.271 C 8.48 2.084 8.735 1.979 9 1.979 Z M 4 5.979 L 14 5.979 L 14 3.979 L 16 3.979 L 16 17.979 L 2 17.979 L 2 3.979 L 4 3.979 L 4 5.979 Z M 14 9.979 L 4 9.979 L 4 7.979 L 14 7.979 L 14 9.979 Z M 12 13.979 L 4 13.979 L 4 11.979 L 12 11.979 L 12 13.979 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { MdiClipboardTextOutline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/MdiClipboardTextOutline.jsx", error: String((e && e.message) || e) }); }

// components/icons/MdiLightClipboardText.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 17:23 mdi-light:clipboard-text
function MdiLightClipboardText({
  size = 24,
  color = 'rgb(0,0,0)',
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      width: size,
      height: size,
      overflow: 'hidden',
      position: 'relative',
      color,
      display: 'inline-block',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 17 20",
    fill: "none",
    style: {
      position: 'absolute',
      left: `${3 / 24 * 100}%`,
      top: `${2 / 24 * 100}%`,
      width: `${17 / 24 * 100}%`,
      height: `${20 / 24 * 100}%`
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 3 3 L 5.5 3 C 5.5 2.204 5.816 1.441 6.379 0.879 C 6.941 0.316 7.704 0 8.5 0 C 9.296 0 10.059 0.316 10.621 0.879 C 11.184 1.441 11.5 2.204 11.5 3 L 14 3 C 14.796 3 15.559 3.316 16.121 3.879 C 16.684 4.441 17 5.204 17 6 L 17 17 C 17 17.796 16.684 18.559 16.121 19.121 C 15.559 19.684 14.796 20 14 20 L 3 20 C 2.204 20 1.441 19.684 0.879 19.121 C 0.316 18.559 0 17.796 0 17 L 0 6 C 0 5.204 0.316 4.441 0.879 3.879 C 1.441 3.316 2.204 3 3 3 Z M 3 4 C 2.47 4 1.961 4.211 1.586 4.586 C 1.211 4.961 1 5.47 1 6 L 1 17 C 1 17.53 1.211 18.039 1.586 18.414 C 1.961 18.789 2.47 19 3 19 L 14 19 C 14.53 19 15.039 18.789 15.414 18.414 C 15.789 18.039 16 17.53 16 17 L 16 6 C 16 5.47 15.789 4.961 15.414 4.586 C 15.039 4.211 14.53 4 14 4 L 13 4 L 13 7 L 4 7 L 4 4 L 3 4 Z M 5 6 L 12 6 L 12 4 L 5 4 L 5 6 Z M 8.5 1 C 7.97 1 7.461 1.211 7.086 1.586 C 6.711 1.961 6.5 2.47 6.5 3 L 10.5 3 C 10.5 2.47 10.289 1.961 9.914 1.586 C 9.539 1.211 9.03 1 8.5 1 Z M 3 9 L 14 9 L 14 10 L 3 10 L 3 9 Z M 3 12 L 14 12 L 14 13 L 3 13 L 3 12 Z M 3 15 L 12 15 L 12 16 L 3 16 L 3 15 Z",
    fill: "currentColor",
    fillRule: "nonzero"
  })));
}
Object.assign(__ds_scope, { MdiLightClipboardText });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/MdiLightClipboardText.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Backdrop.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// figma node: 22:856 Backdrop
function Backdrop({
  children,
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      backgroundColor: 'var(--backdrop-fill)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Backdrop });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Backdrop.jsx", error: String((e && e.message) || e) }); }

// ui_kits/osrs-web/App.jsx
try { (() => {
const EMPLOYEE = {
  name: 'Maya Santos',
  role: 'Employee',
  initials: 'MS',
  color: 'var(--osrs-avatar-orange)',
  email: 'mayas@codev.com • Davao Office'
};
const ADMIN = {
  name: 'Ethan Cruz',
  role: 'Admin',
  initials: 'EC',
  color: 'var(--osrs-avatar-green)',
  email: 'ethanc@codev.com • Davao Office'
};
const SEED_QUEUE = [{
  id: 'REQ-2026-1847',
  name: 'Maya Santos',
  role: 'Product Design',
  items: 'Laptop, Keyboard, USB-C Headset',
  date: 'Sep 11, 2026',
  status: 'Pending Approval',
  lines: [{
    name: 'Laptop - Dell Latitude 5440',
    qty: 'Qty 1',
    stock: 18
  }, {
    name: 'Wireless Keyboard - Logitech M185',
    qty: 'Qty 1',
    stock: 24
  }, {
    name: 'USB-C Headset - A4Tech Hu-10',
    qty: 'Qty 2',
    stock: 5
  }]
}, {
  id: 'REQ-2026-1842',
  name: 'Samantha Reyes',
  role: 'Finance',
  items: 'Monitor, Dock',
  date: 'Sep 8, 2026',
  status: 'Pending Approval',
  lines: [{
    name: 'Monitor - LG UltraFine 27"',
    qty: 'Qty 1',
    stock: 8
  }, {
    name: 'USB-C Dock',
    qty: 'Qty 1',
    stock: 11
  }]
}, {
  id: 'REQ-2026-1805',
  name: 'Daniel Santos',
  role: 'Customer Success',
  items: 'Ergonomic Mouse',
  date: 'Aug 29, 2026',
  status: 'Pending Approval',
  lines: [{
    name: 'Logitech MX Master 3S',
    qty: 'Qty 1',
    stock: 4
  }]
}, {
  id: 'REQ-2026-1760',
  name: 'Isabella Mendoza',
  role: 'Engineering',
  items: 'Laptop Stand',
  date: 'Sep 8, 2026',
  status: 'Pending Approval',
  lines: [{
    name: 'Laptop Stand - Rain mStand',
    qty: 'Qty 1',
    stock: 12
  }]
}];
const SEED_MINE = [{
  id: 'REQ-2026-1847',
  date: 'Sep 11, 2026',
  items: 'Laptop, Keyboard + 1 more',
  status: 'Pending Approval'
}, {
  id: 'REQ-2026-1842',
  date: 'Sep 8, 2026',
  items: 'Monitor, Dock',
  status: 'Ready for Pickup'
}, {
  id: 'REQ-2026-1805',
  date: 'Aug 29, 2026',
  items: 'Ergonomic Mouse',
  status: 'Approved'
}, {
  id: 'REQ-2026-1760',
  date: 'Aug 14, 2026',
  items: 'Laptop Stand',
  status: 'Rejected'
}, {
  id: 'REQ-2026-1733',
  date: 'Jul 28, 2026',
  items: 'Headset, Keyboard + 1 more',
  status: 'Completed'
}];
function App() {
  const [signedIn, setSignedIn] = React.useState(false);
  const [role, setRole] = React.useState('employee');
  const [page, setPage] = React.useState('Catalog');
  const [list, setList] = React.useState([]);
  const [quantities, setQuantities] = React.useState({});
  const [purpose, setPurpose] = React.useState('');
  const [drawer, setDrawer] = React.useState(false);
  const [queue, setQueue] = React.useState(SEED_QUEUE);
  const [mine, setMine] = React.useState(SEED_MINE);
  const [review, setReview] = React.useState(null);
  const [rejecting, setRejecting] = React.useState(null);
  const [reason, setReason] = React.useState('');
  const [toast, setToast] = React.useState(null);
  const user = role === 'employee' ? EMPLOYEE : ADMIN;
  const nav = role === 'employee' ? ['Catalog', 'My Requests', 'Profile'] : ['Requests Queue', 'Inventory'];
  const flash = m => {
    setToast(m);
    setTimeout(() => setToast(null), 2600);
  };
  const switchRole = r => {
    setRole(r);
    setPage(r === 'employee' ? 'Catalog' : 'Requests Queue');
    setReview(null);
  };
  const addToList = item => {
    if (item.availability === 'unavailable') return flash('That item is out of stock.');
    setList(l => [...l, {
      name: item.name,
      model: item.model,
      qty: quantities[item.id] ?? 1
    }]);
    setDrawer(true);
  };
  const submitRequest = () => {
    if (list.length === 0) return flash('Add at least one item first.');
    const id = 'REQ-2026-' + (1900 + Math.floor(Math.random() * 90));
    setMine(m => [{
      id,
      date: 'Sep 12, 2026',
      items: list.map(i => i.name).join(', '),
      status: 'Pending Approval'
    }, ...m]);
    setQueue(q => [{
      id,
      name: EMPLOYEE.name,
      role: 'Product Design',
      items: list.map(i => i.name).join(', '),
      date: 'Sep 12, 2026',
      status: 'Pending Approval',
      lines: list.map(i => ({
        name: i.name + ' - ' + i.model,
        qty: 'Qty ' + i.qty,
        stock: 12
      }))
    }, ...q]);
    setList([]);
    setPurpose('');
    setDrawer(false);
    setPage('My Requests');
    flash(id + ' submitted — inventory deducted, approver notified.');
  };
  const approve = () => {
    setQueue(q => q.filter(r => r.id !== review.id));
    setMine(m => m.map(r => r.id === review.id ? {
      ...r,
      status: 'For Release'
    } : r));
    flash(review.id + ' approved — supply admin notified.');
    setReview(null);
  };
  const confirmReject = () => {
    if (!reason.trim()) return flash('A rejection reason is required.');
    setQueue(q => q.filter(r => r.id !== rejecting.id));
    setMine(m => m.map(r => r.id === rejecting.id ? {
      ...r,
      status: 'Rejected'
    } : r));
    flash(rejecting.id + ' rejected — inventory restored, requester notified.');
    setRejecting(null);
    setReason('');
    setReview(null);
  };
  if (!signedIn) return /*#__PURE__*/React.createElement(LoginScreen, {
    onSignIn: () => setSignedIn(true)
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 1440,
      height: 1024,
      overflow: 'hidden',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    nav: nav,
    active: page,
    onNav: setPage,
    user: user,
    listCount: list.length,
    onOpenList: () => setDrawer(true)
  }), role === 'employee' && page === 'Catalog' && /*#__PURE__*/React.createElement(CatalogScreen, {
    onAdd: addToList,
    quantities: quantities,
    setQuantity: (id, n) => setQuantities(q => ({
      ...q,
      [id]: n
    }))
  }), role === 'employee' && page === 'My Requests' && /*#__PURE__*/React.createElement(MyRequestsScreen, {
    requests: mine
  }), role === 'employee' && page === 'Profile' && /*#__PURE__*/React.createElement(ProfileScreen, {
    user: user
  }), role === 'admin' && page === 'Requests Queue' && !review && /*#__PURE__*/React.createElement(RequestsQueueScreen, {
    requests: queue,
    onReview: setReview
  }), role === 'admin' && page === 'Requests Queue' && review && /*#__PURE__*/React.createElement(ReviewRequestScreen, {
    request: review,
    onBack: () => setReview(null),
    onApprove: approve,
    onReject: () => setRejecting(review)
  }), role === 'admin' && page === 'Inventory' && /*#__PURE__*/React.createElement(InventoryScreen, null), drawer && role === 'employee' && /*#__PURE__*/React.createElement(RequestListDrawer, {
    items: list,
    purpose: purpose,
    setPurpose: setPurpose,
    onClose: () => setDrawer(false),
    onSubmit: submitRequest,
    onRemove: i => setList(l => l.filter((_, x) => x !== i))
  }), rejecting && /*#__PURE__*/React.createElement(RejectDialog, {
    request: rejecting,
    reason: reason,
    setReason: setReason,
    onCancel: () => {
      setRejecting(null);
      setReason('');
    },
    onConfirm: confirmReject
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      bottom: 24,
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)',
      borderRadius: 999,
      padding: '8px 14px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 11,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, "Viewing as"), [['employee', 'Employee'], ['admin', 'Approver / Supply Admin']].map(([k, l]) => /*#__PURE__*/React.createElement("span", {
    key: k,
    onClick: () => switchRole(k),
    style: {
      cursor: 'pointer',
      borderRadius: 999,
      padding: '6px 10px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: '100%',
      background: role === k ? 'var(--brand-primary)' : 'transparent',
      color: role === k ? '#fff' : 'var(--text-secondary)'
    }
  }, l))), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 32,
      bottom: 24,
      maxWidth: 420,
      borderRadius: 10,
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '14px 18px',
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: 'var(--brand-primary)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: 1.5,
      color: 'var(--text-primary)'
    }
  }, toast)));
}
window.__osrsRoot = window.__osrsRoot || ReactDOM.createRoot(document.getElementById('root'));
window.__osrsRoot.render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/osrs-web/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/osrs-web/CatalogScreen.jsx
try { (() => {
const DS_CAT = window.OSRSDesignSystem_585e7e;
const CATEGORIES = ['All supplies', 'Office Supplies', 'Devices', 'Accessories', 'Audio'];
const CATALOG = [{
  id: 'laptop',
  category: 'Devices',
  name: 'Business Laptop',
  model: 'Dell Latitude',
  image: 'item-laptop.jpg',
  availability: 'available'
}, {
  id: 'monitor',
  category: 'Devices',
  name: 'Monitor',
  model: 'LG UltraFine 27"',
  image: 'item-monitor.jpg',
  availability: 'available'
}, {
  id: 'keyboard',
  category: 'Accessories',
  name: 'Wireless Keyboard',
  model: 'Logitech MX Keys',
  image: 'item-laptop.jpg',
  availability: 'unavailable'
}];
function CategoryChip({
  label,
  active,
  onClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      cursor: 'pointer',
      height: 31,
      borderRadius: 999,
      padding: '8px 14px',
      boxSizing: 'border-box',
      background: active ? 'var(--brand-primary)' : 'var(--surface-card)',
      boxShadow: active ? 'var(--ring-brand)' : 'var(--ring-default)',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 12,
      lineHeight: '100%',
      whiteSpace: 'nowrap',
      color: active ? '#fff' : 'var(--text-secondary)'
    }
  }, label));
}
function CatalogScreen({
  onAdd,
  quantities,
  setQuantity
}) {
  const [cat, setCat] = React.useState('All supplies');
  const items = cat === 'All supplies' ? CATALOG : CATALOG.filter(i => i.category === cat);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      top: 121,
      width: 1145,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: 11.5,
      lineHeight: 1.3,
      color: 'var(--text-primary)'
    }
  }, "Supply Catalog"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 32,
      lineHeight: 1.3,
      color: 'var(--text-heading)'
    }
  }, "Browse available equipment and office essentials. Inventory updates in real time.")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      top: 246,
      width: 1145
    }
  }, /*#__PURE__*/React.createElement(DS_CAT.Search, {
    style: {
      width: '100%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 35,
      top: 306,
      display: 'flex',
      gap: 10
    }
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement(CategoryChip, {
    key: c,
    label: c,
    active: c === cat,
    onClick: () => setCat(c)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      top: 371,
      width: 1376,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 18
    }
  }, items.map(i => /*#__PURE__*/React.createElement(DS_CAT.SupplyCard, {
    key: i.id,
    category: i.category,
    name: i.name,
    model: i.model,
    availability: i.availability,
    image: OSRS_ASSETS + i.image,
    quantity: quantities[i.id] ?? 1,
    onQuantityChange: n => setQuantity(i.id, n),
    onAction: () => onAdd(i),
    actionLabel: i.availability === 'unavailable' ? 'Out of stock' : 'Add to Request List'
  }))));
}
function RequestListDrawer({
  items,
  onClose,
  onSubmit,
  onRemove,
  purpose,
  setPurpose
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 0,
      top: 0,
      width: 480,
      height: 1024,
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 24px',
      boxSizing: 'border-box',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(DS_CAT.MdiLightClipboardText, {
    size: 24
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 15,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, "Request List")), /*#__PURE__*/React.createElement("span", {
    onClick: onClose,
    style: {
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 18,
      color: 'var(--text-secondary)'
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      flex: 1,
      overflow: 'auto'
    }
  }, items.length === 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: 1.5,
      color: 'var(--text-secondary)'
    }
  }, "No items yet. Add supplies from the catalog."), items.map((i, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx,
    style: {
      borderRadius: 10,
      boxShadow: 'var(--ring-default)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, i.name), /*#__PURE__*/React.createElement("span", {
    onClick: () => onRemove(idx),
    style: {
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: '100%',
      color: 'var(--brand-primary)'
    }
  }, "Remove")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 11,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, i.model, " \xB7 Qty ", i.qty)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, "Purpose (optional)"), /*#__PURE__*/React.createElement("input", {
    value: purpose,
    onChange: e => setPurpose(e.target.value),
    placeholder: "e.g. replacement for damaged unit",
    style: {
      height: 56,
      borderRadius: 6,
      border: 'none',
      boxShadow: 'var(--ring-default)',
      padding: 14,
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      color: 'var(--text-primary)',
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement(Button, {
    onClick: onSubmit,
    style: {
      width: '100%'
    }
  }, "Submit Request"));
}
Object.assign(window, {
  CatalogScreen,
  RequestListDrawer,
  CategoryChip,
  CATALOG
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/osrs-web/CatalogScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/osrs-web/Chrome.jsx
try { (() => {
const DS_CHROME = window.OSRSDesignSystem_585e7e;
const A = '../../assets/';
function TopBar({
  nav,
  active,
  onNav,
  user,
  listCount,
  onOpenList
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1440,
      height: 87,
      overflow: 'hidden',
      background: 'var(--surface-bar)',
      boxShadow: 'var(--ring-default)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + 'logo-supply-requests.png',
    alt: "codev Supply Requests",
    style: {
      position: 'absolute',
      left: 32,
      top: 22,
      width: 93,
      height: 43
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 618,
      top: 29.5,
      display: 'flex',
      flexDirection: 'row',
      gap: 28,
      alignItems: 'center'
    }
  }, nav.map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    onClick: () => onNav(n),
    style: {
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      lineHeight: '100%',
      whiteSpace: 'nowrap',
      fontWeight: n === active ? 700 : 500,
      color: n === active ? 'var(--brand-primary)' : 'var(--text-secondary)'
    }
  }, n))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 64,
      top: 27,
      height: 34,
      display: 'flex',
      flexDirection: 'row',
      gap: 18,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onOpenList,
    style: {
      cursor: 'pointer',
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(DS_CHROME.MdiLightClipboardText, {
    size: 24
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 11,
      lineHeight: '100%',
      whiteSpace: 'nowrap',
      color: 'var(--text-primary)'
    }
  }, "Request List")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: 999,
      background: 'var(--brand-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 11,
      lineHeight: '100%',
      color: '#fff'
    }
  }, listCount))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 31,
      background: 'var(--osrs-gray-400)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    initials: user.initials,
    color: user.color,
    size: 34
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: '100%',
      whiteSpace: 'nowrap',
      color: 'var(--text-primary)'
    }
  }, user.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 11,
      lineHeight: '100%',
      whiteSpace: 'nowrap',
      color: 'var(--text-secondary)'
    }
  }, user.role)))));
}
function Avatar({
  initials,
  color,
  size = 34
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: 200,
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: size > 40 ? 700 : 400,
      fontSize: size > 40 ? 20 : 14,
      lineHeight: 1.5,
      color: '#fff'
    }
  }, initials));
}
function PageHeader({
  title,
  subtitle,
  width = 629
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      top: 121,
      width,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: 32,
      lineHeight: 1.3,
      color: 'var(--text-heading)'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--text-body)'
    }
  }, subtitle));
}
function SummaryCard({
  value,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 103,
      borderRadius: 10,
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      padding: 22,
      alignItems: 'flex-start',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: 28,
      lineHeight: 1.3,
      color: 'var(--brand-primary)'
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, label));
}
function Button({
  children,
  variant = 'primary',
  onClick,
  style
}) {
  const v = {
    primary: {
      background: 'var(--brand-primary)',
      boxShadow: 'var(--ring-brand)',
      color: '#fff'
    },
    accent: {
      background: 'var(--brand-primary-alt)',
      boxShadow: 'inset 0 0 0 1px var(--brand-primary-alt)',
      color: '#fff'
    },
    ghost: {
      background: 'var(--surface-card)',
      boxShadow: 'var(--ring-default)',
      color: 'var(--text-strong)'
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      height: 42,
      borderRadius: 10,
      border: 'none',
      padding: '0 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 13,
      lineHeight: '100%',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      ...v,
      ...style
    }
  }, children);
}
function TableCard({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 10,
      overflow: 'hidden',
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, children);
}
function TableHead({
  cols
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 41,
      background: 'var(--surface-table-header)',
      display: 'flex',
      padding: '14px 20px',
      boxSizing: 'border-box',
      alignSelf: 'stretch'
    }
  }, cols.map(([label, w]) => /*#__PURE__*/React.createElement("span", {
    key: label,
    style: {
      width: w,
      flex: w ? undefined : 1,
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 11,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, label)));
}
function SectionTitle({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: 19,
      lineHeight: 1.3,
      color: 'var(--text-heading)',
      ...style
    }
  }, children);
}
Object.assign(window, {
  TopBar,
  Avatar,
  PageHeader,
  SummaryCard,
  Button,
  TableCard,
  TableHead,
  SectionTitle,
  OSRS_ASSETS: A
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/osrs-web/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/osrs-web/InventoryScreen.jsx
try { (() => {
const DS_INV = window.OSRSDesignSystem_585e7e;
const INVENTORY = [{
  name: 'Dell Latitude 7440',
  code: 'IT-DEV-1042',
  category: 'Laptops',
  total: '32',
  available: '18',
  reserved: '14',
  status: 'In Stock'
}, {
  name: 'LG UltraFine 27-inch',
  code: 'MON-2238',
  category: 'Monitors',
  total: '24',
  available: '8',
  reserved: '16',
  status: 'In Stock'
}, {
  name: 'Logitech MX Keys',
  code: 'ACC-0814',
  category: 'Keyboards',
  total: '40',
  available: '24',
  reserved: '16',
  status: 'In Stock'
}, {
  name: 'Logitech MX Master 3S',
  code: 'ACC-0921',
  category: 'Mice',
  total: '28',
  available: '4',
  reserved: '24',
  status: 'Low Stock'
}, {
  name: 'Jabra Evolve2 40',
  code: 'AUD-0318',
  category: 'Headsets',
  total: '20',
  available: '5',
  reserved: '15',
  status: 'Low Stock'
}, {
  name: 'USB-C Cable 2m',
  code: 'CBL-1106',
  category: 'Cables',
  total: '60',
  available: '0',
  reserved: '60',
  status: 'Out of Stock'
}];
function InventoryScreen() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHeader, {
    title: "Inventory management",
    subtitle: "Monitor stock levels, manage reservations, and keep office essentials ready for every team"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    style: {
      position: 'absolute',
      left: 1218,
      top: 120,
      width: 158
    }
  }, "+ Add Catalog Item"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      top: 225,
      width: 1344,
      display: 'flex',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(SummaryCard, {
    value: "108",
    label: "Catalog items"
  }), /*#__PURE__*/React.createElement(SummaryCard, {
    value: "59",
    label: "Available units"
  }), /*#__PURE__*/React.createElement(SummaryCard, {
    value: "2",
    label: "Low stock alerts"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      top: 344,
      width: 1344
    }
  }, /*#__PURE__*/React.createElement(DS_INV.Search, {
    placeholder: "Search inventory by item name or code",
    style: {
      width: '100%'
    }
  })), /*#__PURE__*/React.createElement(TableCard, {
    style: {
      position: 'absolute',
      left: 32,
      top: 429,
      width: 1344
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 48,
      background: 'var(--surface-table-header)',
      display: 'flex',
      padding: '0 20px',
      alignItems: 'center',
      boxSizing: 'border-box'
    }
  }, [['ITEM', 300], ['CATEGORY', 180], ['TOTAL STOCK', 180], ['AVAILABLE QUANTITY', 180], ['RESERVED / PENDING', 180], ['STATUS', null], ['ACTION', 92]].map(([l, w]) => /*#__PURE__*/React.createElement("span", {
    key: l,
    style: {
      width: w,
      flex: w ? undefined : 1,
      textAlign: l === 'ACTION' ? 'right' : 'left',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 11,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, l))), INVENTORY.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.code,
    style: {
      height: 68,
      border: '1px solid var(--border-default)',
      display: 'flex',
      padding: '0 20px',
      alignItems: 'center',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 300,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-strong)'
    }
  }, r.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 11,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, r.code)), [r.category, r.total, r.available, r.reserved].map((v, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 180,
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, v)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(DS_INV.StatusPills, {
    status: r.status
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 92,
      textAlign: 'right',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: '100%',
      color: 'var(--brand-primary)',
      cursor: 'pointer'
    }
  }, "Update stock"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 54,
      display: 'flex',
      padding: '0 20px',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 12,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, "Showing 6 of 108 inventory items"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 12,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, "Previous"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 6,
      background: 'var(--brand-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 12,
      color: '#fff'
    }
  }, "1")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: '100%',
      color: 'var(--brand-primary)'
    }
  }, "Next")))));
}
Object.assign(window, {
  InventoryScreen,
  INVENTORY
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/osrs-web/InventoryScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/osrs-web/LoginScreen.jsx
try { (() => {
const DS_LOGIN = window.OSRSDesignSystem_585e7e;
function LoginScreen({
  onSignIn
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 1440,
      height: 1024,
      overflow: 'hidden',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: -93,
      top: -629,
      width: 1533,
      height: 2724,
      background: `url(${OSRS_ASSETS}login-background.png) center / cover no-repeat`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 510,
      top: 262,
      width: 421,
      height: 500,
      overflow: 'hidden',
      borderRadius: 24,
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 144,
      top: 59
    }
  }, /*#__PURE__*/React.createElement(DS_LOGIN.CoDevSupplyRequestsLogo, {
    markHeight: 36
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 121,
      top: 214,
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: 1.5,
      whiteSpace: 'nowrap',
      color: 'var(--text-primary)'
    }
  }, "Great to have you with us!"), /*#__PURE__*/React.createElement(DS_LOGIN.SignInButton, {
    darkmode: false,
    iconPadding: "0 6px",
    labelPadding: "0 6px",
    onClick: onSignIn,
    style: {
      position: 'absolute',
      left: 90,
      top: 248,
      width: 242,
      height: 64,
      borderRadius: 32,
      boxShadow: 'inset 0 0 0 1px var(--border-strong)',
      overflow: 'hidden',
      padding: 0,
      justifyContent: 'center',
      gap: 2
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 95,
      top: 424,
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: 1.5,
      whiteSpace: 'nowrap',
      color: 'var(--text-primary)'
    }
  }, "\xA9 2026 CoDev. All rights reserved.")));
}
Object.assign(window, {
  LoginScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/osrs-web/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/osrs-web/ProfileScreen.jsx
try { (() => {
function ProfileScreen({
  user
}) {
  const assigned = [{
    name: 'Laptop - Dell Latitude 5440',
    code: 'CDV-MS-00087',
    date: 'Assigned Jan 14, 2026'
  }, {
    name: 'Monitor - LG UltraFine 27"',
    code: 'CDV-MS-00114',
    date: 'Assigned Mar 2, 2026'
  }, {
    name: 'Headset - Jabra Evolve2 40',
    code: 'CDV-MS-00203',
    date: 'Assigned Jun 9, 2026'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      top: 121,
      width: 1222,
      display: 'flex',
      flexDirection: 'column',
      gap: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: 32,
      lineHeight: 1.3,
      color: 'var(--text-heading)'
    }
  }, "Profile"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--text-body)'
    }
  }, "Your details and currently assigned supplies")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    initials: user.initials,
    color: user.color,
    size: 56
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, user.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 11,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, user.email)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: 14,
      lineHeight: 1.35,
      color: 'var(--text-heading)'
    }
  }, "Currently Assigned"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, assigned.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.code,
    style: {
      borderRadius: 10,
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: 700,
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 15,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, a.name), /*#__PURE__*/React.createElement("span", {
    style: {
      borderRadius: 4,
      background: 'var(--status-info-bg)',
      color: 'var(--status-info-fg)',
      padding: '2px 6px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 13,
      lineHeight: '100%'
    }
  }, a.code)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, a.date))))));
}
Object.assign(window, {
  ProfileScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/osrs-web/ProfileScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/osrs-web/RequestScreens.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DS_REQ = window.OSRSDesignSystem_585e7e;
function RequestRow({
  id,
  name,
  role,
  items,
  date,
  status,
  actionLabel,
  onAction
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 78,
      border: '1px solid var(--border-default)',
      display: 'flex',
      padding: '18px 20px',
      alignItems: 'center',
      boxSizing: 'border-box',
      alignSelf: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 200,
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, id), name ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: 180,
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 11,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, role)) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, items), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 180,
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, date), status ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: 190
    }
  }, /*#__PURE__*/React.createElement(DS_REQ.StatusPills, {
    status: status
  })) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 180,
      display: 'flex',
      alignItems: 'center'
    }
  }, actionLabel === 'View details' ? /*#__PURE__*/React.createElement("span", {
    onClick: onAction,
    style: {
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: '100%',
      color: 'var(--brand-primary)'
    }
  }, "View details \u2192") : /*#__PURE__*/React.createElement(Button, {
    onClick: onAction,
    style: {
      height: 42,
      width: 82,
      padding: 0
    }
  }, actionLabel)));
}
function RequestsQueueScreen({
  requests,
  onReview
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHeader, {
    title: "Requests Queue",
    subtitle: "Review, approve, and fulfill supply requests",
    width: 286
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      top: 232,
      width: 1344,
      display: 'flex',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(SummaryCard, {
    value: String(requests.filter(r => r.status === 'Pending Approval').length),
    label: "Pending approval"
  }), /*#__PURE__*/React.createElement(SummaryCard, {
    value: "6",
    label: "In Processing"
  }), /*#__PURE__*/React.createElement(SummaryCard, {
    value: "2",
    label: "Low stock alerts"
  })), /*#__PURE__*/React.createElement(SectionTitle, {
    style: {
      position: 'absolute',
      left: 32,
      top: 379
    }
  }, "Pending Approval"), /*#__PURE__*/React.createElement(TableCard, {
    style: {
      position: 'absolute',
      left: 32,
      top: 429,
      width: 1344
    }
  }, /*#__PURE__*/React.createElement(TableHead, {
    cols: [['REQUEST ID', 200], ['REQUESTER', 180], ['ITEMS', null], ['SUBMITTED', 180], ['ACTION', 180]]
  }), requests.map(r => /*#__PURE__*/React.createElement(RequestRow, _extends({
    key: r.id
  }, r, {
    actionLabel: "Review",
    onAction: () => onReview(r)
  })))));
}
function ReviewRequestScreen({
  request,
  onBack,
  onApprove,
  onReject
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: onBack,
    style: {
      position: 'absolute',
      left: 32,
      top: 110,
      cursor: 'pointer',
      display: 'flex',
      gap: 7,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: '100%',
      color: 'var(--brand-primary)'
    }
  }, "\u2190 Back to Request Queue")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      top: 142,
      width: 800,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: 32,
      lineHeight: 1.3,
      color: 'var(--text-heading)'
    }
  }, "Review Request ", request.id), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--text-body)'
    }
  }, request.name, " \u2022 Submitted ", request.date, " at 9:42 AM"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(DS_REQ.StatusPills, {
    status: request.status
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      top: 300,
      width: 820,
      borderRadius: 10,
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 15,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, "Items requested"), request.lines.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, l.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-secondary)'
    }
  }, l.qty, " \xB7 ", l.stock, " in stock"))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 12,
      lineHeight: 1.5,
      color: 'var(--text-secondary)'
    }
  }, "The requester is notified by email on every status change."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onReject
  }, "Reject"), /*#__PURE__*/React.createElement(Button, {
    onClick: onApprove
  }, "Approve Request"))));
}
function RejectDialog({
  request,
  onCancel,
  onConfirm,
  reason,
  setReason
}) {
  return /*#__PURE__*/React.createElement(DS_REQ.Backdrop, null, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 620,
      borderRadius: 10,
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 28,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 500,
      fontSize: 19,
      lineHeight: 1.3,
      color: 'var(--text-heading)'
    }
  }, request.id), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--text-body)'
    }
  }, request.name, " \u2022 Submitted ", request.date, " at 9:42 AM"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(DS_REQ.StatusPills, {
    status: "Pending Approval"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 15,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, "Items requested"), request.lines.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, l.name, l.qty !== 'Qty 1' ? ' · ' + l.qty : ''))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 10,
      background: 'var(--osrs-red-50)',
      boxShadow: 'var(--ring-brand)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--brand-primary)'
    }
  }, "Reason for rejection *"), /*#__PURE__*/React.createElement("input", {
    value: reason,
    onChange: e => setReason(e.target.value),
    placeholder: "e.g item on hold, insufficient justification...",
    style: {
      height: 56,
      borderRadius: 6,
      border: 'none',
      background: 'var(--surface-card)',
      boxShadow: 'var(--ring-default)',
      padding: 14,
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      color: 'var(--text-primary)',
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onCancel
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    onClick: onConfirm
  }, "Confirm Rejection"))));
}
function MyRequestsScreen({
  requests
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PageHeader, {
    title: "My Requests",
    subtitle: "Track every request you have submitted and its current status",
    width: 629
  }), /*#__PURE__*/React.createElement(TableCard, {
    style: {
      position: 'absolute',
      left: 32,
      top: 240,
      width: 1344
    }
  }, /*#__PURE__*/React.createElement(TableHead, {
    cols: [['REQUEST ID', 200], ['SUBMITTED', null], ['ITEMS', null], ['STATUS', 190], ['', 90]]
  }), requests.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id + r.status,
    style: {
      height: 78,
      border: '1px solid var(--border-default)',
      display: 'flex',
      padding: '18px 20px',
      alignItems: 'center',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 200,
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, r.id), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, r.date), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: 13,
      lineHeight: '100%',
      color: 'var(--text-primary)'
    }
  }, r.items), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 190
    }
  }, /*#__PURE__*/React.createElement(DS_REQ.StatusPills, {
    status: r.status
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90,
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: '100%',
      color: 'var(--brand-primary)',
      cursor: 'pointer'
    }
  }, "View details \u2192")))));
}
Object.assign(window, {
  RequestsQueueScreen,
  ReviewRequestScreen,
  RejectDialog,
  MyRequestsScreen,
  RequestRow
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/osrs-web/RequestScreens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.ButtonTemplate = __ds_scope.ButtonTemplate;

__ds_ns.ButtonWithIcon = __ds_scope.ButtonWithIcon;

__ds_ns.SignInButton = __ds_scope.SignInButton;

__ds_ns.CoDevRedMasterLogo = __ds_scope.CoDevRedMasterLogo;

__ds_ns.CoDevSupplyRequestsLogo = __ds_scope.CoDevSupplyRequestsLogo;

__ds_ns.CoDevWhiteMasterLogo = __ds_scope.CoDevWhiteMasterLogo;

__ds_ns.StatusPills = __ds_scope.StatusPills;

__ds_ns.SupplyCard = __ds_scope.SupplyCard;

__ds_ns.Search = __ds_scope.Search;

__ds_ns.ArrowCircleDownFill = __ds_scope.ArrowCircleDownFill;

__ds_ns.ArrowCounterClockwise = __ds_scope.ArrowCounterClockwise;

__ds_ns.CaretRight = __ds_scope.CaretRight;

__ds_ns.CheckCircleFill = __ds_scope.CheckCircleFill;

__ds_ns.GoogleIcon = __ds_scope.GoogleIcon;

__ds_ns.MdiClipboardTextOutline = __ds_scope.MdiClipboardTextOutline;

__ds_ns.MdiLightClipboardText = __ds_scope.MdiLightClipboardText;

__ds_ns.Backdrop = __ds_scope.Backdrop;

})();
