function noop() {}

function assign(tar, src) {
  for (var k in src) tar[k] = src[k];
  return tar;
}

function assignTrue(tar, src) {
  for (var k in src) tar[k] = 1;
  return tar;
}

function addLoc(element, file, line, column, char) {
  element.__svelte_meta = {
    loc: { file, line, column, char }
  };
}

function append(target, node) {
  target.appendChild(node);
}

function insert(target, node, anchor) {
  target.insertBefore(node, anchor);
}

function detachNode(node) {
  node.parentNode.removeChild(node);
}

function destroyEach(iterations, detach) {
  for (var i = 0; i < iterations.length; i += 1) {
    if (iterations[i]) iterations[i].d(detach);
  }
}

function createElement(name) {
  return document.createElement(name);
}

function createText(data) {
  return document.createTextNode(data);
}

function addListener(node, event, handler, options) {
  node.addEventListener(event, handler, options);
}

function removeListener(node, event, handler, options) {
  node.removeEventListener(event, handler, options);
}

function setAttribute(node, attribute, value) {
  if (value == null) node.removeAttribute(attribute);
  else node.setAttribute(attribute, value);
}

function setData(text, data) {
  text.data = "" + data;
}

function toggleClass(element, name, toggle) {
  element.classList[toggle ? "add" : "remove"](name);
}

function blankObject() {
  return Object.create(null);
}

function destroy(detach) {
  this.destroy = noop;
  this.fire("destroy");
  this.set = noop;

  this._fragment.d(detach !== false);
  this._fragment = null;
  this._state = {};
}

function destroyDev(detach) {
  destroy.call(this, detach);
  this.destroy = function() {
    console.warn("Component was already destroyed");
  };
}

function _differs(a, b) {
  return a != a
    ? b == b
    : a !== b || ((a && typeof a === "object") || typeof a === "function");
}

function _differsImmutable(a, b) {
  return a != a ? b == b : a !== b;
}

function fire(eventName, data) {
  var handlers =
    eventName in this._handlers && this._handlers[eventName].slice();
  if (!handlers) return;

  for (var i = 0; i < handlers.length; i += 1) {
    var handler = handlers[i];

    if (!handler.__calling) {
      try {
        handler.__calling = true;
        handler.call(this, data);
      } finally {
        handler.__calling = false;
      }
    }
  }
}

function flush(component) {
  component._lock = true;
  callAll(component._beforecreate);
  callAll(component._oncreate);
  callAll(component._aftercreate);
  component._lock = false;
}

function get() {
  return this._state;
}

function init(component, options) {
  component._handlers = blankObject();
  component._slots = blankObject();
  component._bind = options._bind;
  component._staged = {};

  component.options = options;
  component.root = options.root || component;
  component.store = options.store || component.root.store;

  if (!options.root) {
    component._beforecreate = [];
    component._oncreate = [];
    component._aftercreate = [];
  }
}

function on(eventName, handler) {
  var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  handlers.push(handler);

  return {
    cancel: function() {
      var index = handlers.indexOf(handler);
      if (~index) handlers.splice(index, 1);
    }
  };
}

function set(newState) {
  this._set(assign({}, newState));
  if (this.root._lock) return;
  flush(this.root);
}

function _set(newState) {
  var oldState = this._state,
    changed = {},
    dirty = false;

  newState = assign(this._staged, newState);
  this._staged = {};

  for (var key in newState) {
    if (this._differs(newState[key], oldState[key]))
      changed[key] = dirty = true;
  }
  if (!dirty) return;

  this._state = assign(assign({}, oldState), newState);
  this._recompute(changed, this._state);
  if (this._bind) this._bind(changed, this._state);

  if (this._fragment) {
    this.fire("state", {
      changed: changed,
      current: this._state,
      previous: oldState
    });
    this._fragment.p(changed, this._state);
    this.fire("update", {
      changed: changed,
      current: this._state,
      previous: oldState
    });
  }
}

function _stage(newState) {
  assign(this._staged, newState);
}

function setDev(newState) {
  if (typeof newState !== "object") {
    throw new Error(
      this._debugName +
        ".set was called without an object of data key-values to update."
    );
  }

  this._checkReadOnly(newState);
  set.call(this, newState);
}

function callAll(fns) {
  while (fns && fns.length) fns.shift()();
}

function _mount(target, anchor) {
  this._fragment[this._fragment.i ? "i" : "m"](target, anchor || null);
}

var protoDev = {
  destroy: destroyDev,
  get,
  fire,
  on,
  set: setDev,
  _recompute: noop,
  _set,
  _stage,
  _mount,
  _differs
};

/*!
 * Font Awesome Free 5.0.13 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 */
var noop$1 = function noop() {};

var _WINDOW = {};
var _DOCUMENT = {};
var _MUTATION_OBSERVER$1 = null;
var _PERFORMANCE = { mark: noop$1, measure: noop$1 };

try {
  if (typeof window !== "undefined") _WINDOW = window;
  if (typeof document !== "undefined") _DOCUMENT = document;
  if (typeof MutationObserver !== "undefined")
    _MUTATION_OBSERVER$1 = MutationObserver;
  if (typeof performance !== "undefined") _PERFORMANCE = performance;
} catch (e) {}

var _ref = _WINDOW.navigator || {};
var _ref$userAgent = _ref.userAgent;
var userAgent = _ref$userAgent === undefined ? "" : _ref$userAgent;

var WINDOW = _WINDOW;
var DOCUMENT = _DOCUMENT;
var MUTATION_OBSERVER = _MUTATION_OBSERVER$1;
var PERFORMANCE = _PERFORMANCE;
var IS_BROWSER = !!WINDOW.document;
var IS_DOM =
  !!DOCUMENT.documentElement &&
  !!DOCUMENT.head &&
  typeof DOCUMENT.addEventListener === "function" &&
  typeof DOCUMENT.createElement === "function";
var IS_IE = ~userAgent.indexOf("MSIE") || ~userAgent.indexOf("Trident/");

var NAMESPACE_IDENTIFIER = "___FONT_AWESOME___";
var UNITS_IN_GRID = 16;
var DEFAULT_FAMILY_PREFIX = "fa";
var DEFAULT_REPLACEMENT_CLASS = "svg-inline--fa";
var DATA_FA_I2SVG = "data-fa-i2svg";
var DATA_FA_PSEUDO_ELEMENT = "data-fa-pseudo-element";
var HTML_CLASS_I2SVG_BASE_CLASS = "fontawesome-i2svg";

var PRODUCTION = (function() {
  try {
    return process.env.NODE_ENV === "production";
  } catch (e) {
    return false;
  }
})();

var oneToTen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var oneToTwenty = oneToTen.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);

var ATTRIBUTES_WATCHED_FOR_MUTATION = [
  "class",
  "data-prefix",
  "data-icon",
  "data-fa-transform",
  "data-fa-mask"
];

var RESERVED_CLASSES = [
  "xs",
  "sm",
  "lg",
  "fw",
  "ul",
  "li",
  "border",
  "pull-left",
  "pull-right",
  "spin",
  "pulse",
  "rotate-90",
  "rotate-180",
  "rotate-270",
  "flip-horizontal",
  "flip-vertical",
  "stack",
  "stack-1x",
  "stack-2x",
  "inverse",
  "layers",
  "layers-text",
  "layers-counter"
]
  .concat(
    oneToTen.map(function(n) {
      return n + "x";
    })
  )
  .concat(
    oneToTwenty.map(function(n) {
      return "w-" + n;
    })
  );

var classCallCheck = function(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

var _extends =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

var toConsumableArray = function(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++)
      arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var initial = WINDOW.FontAwesomeConfig || {};
var initialKeys = Object.keys(initial);

var _default = _extends(
  {
    familyPrefix: DEFAULT_FAMILY_PREFIX,
    replacementClass: DEFAULT_REPLACEMENT_CLASS,
    autoReplaceSvg: true,
    autoAddCss: true,
    autoA11y: true,
    searchPseudoElements: false,
    observeMutations: true,
    keepOriginalSource: true,
    measurePerformance: false,
    showMissingIcons: true
  },
  initial
);

if (!_default.autoReplaceSvg) _default.observeMutations = false;

var config$1 = _extends({}, _default);

WINDOW.FontAwesomeConfig = config$1;

function update(newConfig) {
  var params =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _params$asNewDefault = params.asNewDefault,
    asNewDefault =
      _params$asNewDefault === undefined ? false : _params$asNewDefault;

  var validKeys = Object.keys(config$1);
  var ok = asNewDefault
    ? function(k) {
        return ~validKeys.indexOf(k) && !~initialKeys.indexOf(k);
      }
    : function(k) {
        return ~validKeys.indexOf(k);
      };

  Object.keys(newConfig).forEach(function(configKey) {
    if (ok(configKey)) config$1[configKey] = newConfig[configKey];
  });
}

function auto(value) {
  update({
    autoReplaceSvg: value,
    observeMutations: value
  });
}

var w = WINDOW || {};

if (!w[NAMESPACE_IDENTIFIER]) w[NAMESPACE_IDENTIFIER] = {};
if (!w[NAMESPACE_IDENTIFIER].styles) w[NAMESPACE_IDENTIFIER].styles = {};
if (!w[NAMESPACE_IDENTIFIER].hooks) w[NAMESPACE_IDENTIFIER].hooks = {};
if (!w[NAMESPACE_IDENTIFIER].shims) w[NAMESPACE_IDENTIFIER].shims = [];

var namespace = w[NAMESPACE_IDENTIFIER];

var functions = [];
var listener = function listener() {
  DOCUMENT.removeEventListener("DOMContentLoaded", listener);
  loaded = 1;
  functions.map(function(fn) {
    return fn();
  });
};

var loaded = false;

if (IS_DOM) {
  loaded = (DOCUMENT.documentElement.doScroll
    ? /^loaded|^c/
    : /^loaded|^i|^c/
  ).test(DOCUMENT.readyState);

  if (!loaded) DOCUMENT.addEventListener("DOMContentLoaded", listener);
}

var domready = function(fn) {
  if (!IS_DOM) return;
  loaded ? setTimeout(fn, 0) : functions.push(fn);
};

var d = UNITS_IN_GRID;

var meaninglessTransform = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: false,
  flipY: false
};

function isReserved(name) {
  return ~RESERVED_CLASSES.indexOf(name);
}

function bunker(fn) {
  try {
    fn();
  } catch (e) {
    if (!PRODUCTION) {
      throw e;
    }
  }
}

function insertCss(css) {
  if (!css || !IS_DOM) {
    return;
  }

  var style = DOCUMENT.createElement("style");
  style.setAttribute("type", "text/css");
  style.innerHTML = css;

  var headChildren = DOCUMENT.head.childNodes;
  var beforeChild = null;

  for (var i = headChildren.length - 1; i > -1; i--) {
    var child = headChildren[i];
    var tagName = (child.tagName || "").toUpperCase();
    if (["STYLE", "LINK"].indexOf(tagName) > -1) {
      beforeChild = child;
    }
  }

  DOCUMENT.head.insertBefore(style, beforeChild);

  return css;
}

var _uniqueId = 0;

function nextUniqueId() {
  _uniqueId++;

  return _uniqueId;
}

function toArray(obj) {
  var array = [];

  for (var i = (obj || []).length >>> 0; i--; ) {
    array[i] = obj[i];
  }

  return array;
}

function classArray(node) {
  if (node.classList) {
    return toArray(node.classList);
  } else {
    return (node.getAttribute("class") || "").split(" ").filter(function(i) {
      return i;
    });
  }
}

function getIconName(familyPrefix, cls) {
  var parts = cls.split("-");
  var prefix = parts[0];
  var iconName = parts.slice(1).join("-");

  if (prefix === familyPrefix && iconName !== "" && !isReserved(iconName)) {
    return iconName;
  } else {
    return null;
  }
}

function htmlEscape(str) {
  return ("" + str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function joinAttributes(attributes) {
  return Object.keys(attributes || {})
    .reduce(function(acc, attributeName) {
      return (
        acc +
        (attributeName + '="' + htmlEscape(attributes[attributeName]) + '" ')
      );
    }, "")
    .trim();
}

function joinStyles(styles) {
  return Object.keys(styles || {}).reduce(function(acc, styleName) {
    return acc + (styleName + ": " + styles[styleName] + ";");
  }, "");
}

function transformIsMeaningful(transform) {
  return (
    transform.size !== meaninglessTransform.size ||
    transform.x !== meaninglessTransform.x ||
    transform.y !== meaninglessTransform.y ||
    transform.rotate !== meaninglessTransform.rotate ||
    transform.flipX ||
    transform.flipY
  );
}

function transformForSvg(_ref) {
  var transform = _ref.transform,
    containerWidth = _ref.containerWidth,
    iconWidth = _ref.iconWidth;

  var outer = {
    transform: "translate(" + containerWidth / 2 + " 256)"
  };
  var innerTranslate =
    "translate(" + transform.x * 32 + ", " + transform.y * 32 + ") ";
  var innerScale =
    "scale(" +
    (transform.size / 16) * (transform.flipX ? -1 : 1) +
    ", " +
    (transform.size / 16) * (transform.flipY ? -1 : 1) +
    ") ";
  var innerRotate = "rotate(" + transform.rotate + " 0 0)";
  var inner = {
    transform: innerTranslate + " " + innerScale + " " + innerRotate
  };
  var path = {
    transform: "translate(" + (iconWidth / 2) * -1 + " -256)"
  };
  return {
    outer: outer,
    inner: inner,
    path: path
  };
}

function transformForCss(_ref2) {
  var transform = _ref2.transform,
    _ref2$width = _ref2.width,
    width = _ref2$width === undefined ? UNITS_IN_GRID : _ref2$width,
    _ref2$height = _ref2.height,
    height = _ref2$height === undefined ? UNITS_IN_GRID : _ref2$height,
    _ref2$startCentered = _ref2.startCentered,
    startCentered =
      _ref2$startCentered === undefined ? false : _ref2$startCentered;

  var val = "";

  if (startCentered && IS_IE) {
    val +=
      "translate(" +
      (transform.x / d - width / 2) +
      "em, " +
      (transform.y / d - height / 2) +
      "em) ";
  } else if (startCentered) {
    val +=
      "translate(calc(-50% + " +
      transform.x / d +
      "em), calc(-50% + " +
      transform.y / d +
      "em)) ";
  } else {
    val += "translate(" + transform.x / d + "em, " + transform.y / d + "em) ";
  }

  val +=
    "scale(" +
    (transform.size / d) * (transform.flipX ? -1 : 1) +
    ", " +
    (transform.size / d) * (transform.flipY ? -1 : 1) +
    ") ";
  val += "rotate(" + transform.rotate + "deg) ";

  return val;
}

var ALL_SPACE = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};

var makeIconMasking = function(_ref) {
  var children = _ref.children,
    attributes = _ref.attributes,
    main = _ref.main,
    mask = _ref.mask,
    transform = _ref.transform;
  var mainWidth = main.width,
    mainPath = main.icon;
  var maskWidth = mask.width,
    maskPath = mask.icon;

  var trans = transformForSvg({
    transform: transform,
    containerWidth: maskWidth,
    iconWidth: mainWidth
  });

  var maskRect = {
    tag: "rect",
    attributes: _extends({}, ALL_SPACE, {
      fill: "white"
    })
  };
  var maskInnerGroup = {
    tag: "g",
    attributes: _extends({}, trans.inner),
    children: [
      {
        tag: "path",
        attributes: _extends({}, mainPath.attributes, trans.path, {
          fill: "black"
        })
      }
    ]
  };
  var maskOuterGroup = {
    tag: "g",
    attributes: _extends({}, trans.outer),
    children: [maskInnerGroup]
  };
  var maskId = "mask-" + nextUniqueId();
  var clipId = "clip-" + nextUniqueId();
  var maskTag = {
    tag: "mask",
    attributes: _extends({}, ALL_SPACE, {
      id: maskId,
      maskUnits: "userSpaceOnUse",
      maskContentUnits: "userSpaceOnUse"
    }),
    children: [maskRect, maskOuterGroup]
  };
  var defs = {
    tag: "defs",
    children: [
      { tag: "clipPath", attributes: { id: clipId }, children: [maskPath] },
      maskTag
    ]
  };

  children.push(defs, {
    tag: "rect",
    attributes: _extends(
      {
        fill: "currentColor",
        "clip-path": "url(#" + clipId + ")",
        mask: "url(#" + maskId + ")"
      },
      ALL_SPACE
    )
  });

  return {
    children: children,
    attributes: attributes
  };
};

var makeIconStandard = function(_ref) {
  var children = _ref.children,
    attributes = _ref.attributes,
    main = _ref.main,
    transform = _ref.transform,
    styles = _ref.styles;

  var styleString = joinStyles(styles);

  if (styleString.length > 0) {
    attributes["style"] = styleString;
  }

  if (transformIsMeaningful(transform)) {
    var trans = transformForSvg({
      transform: transform,
      containerWidth: main.width,
      iconWidth: main.width
    });
    children.push({
      tag: "g",
      attributes: _extends({}, trans.outer),
      children: [
        {
          tag: "g",
          attributes: _extends({}, trans.inner),
          children: [
            {
              tag: main.icon.tag,
              children: main.icon.children,
              attributes: _extends({}, main.icon.attributes, trans.path)
            }
          ]
        }
      ]
    });
  } else {
    children.push(main.icon);
  }

  return {
    children: children,
    attributes: attributes
  };
};

var asIcon = function(_ref) {
  var children = _ref.children,
    main = _ref.main,
    mask = _ref.mask,
    attributes = _ref.attributes,
    styles = _ref.styles,
    transform = _ref.transform;

  if (transformIsMeaningful(transform) && main.found && !mask.found) {
    var width = main.width,
      height = main.height;

    var offset = {
      x: width / height / 2,
      y: 0.5
    };
    attributes["style"] = joinStyles(
      _extends({}, styles, {
        "transform-origin":
          offset.x +
          transform.x / 16 +
          "em " +
          (offset.y + transform.y / 16) +
          "em"
      })
    );
  }

  return [
    {
      tag: "svg",
      attributes: attributes,
      children: children
    }
  ];
};

var asSymbol = function(_ref) {
  var prefix = _ref.prefix,
    iconName = _ref.iconName,
    children = _ref.children,
    attributes = _ref.attributes,
    symbol = _ref.symbol;

  var id =
    symbol === true
      ? prefix + "-" + config$1.familyPrefix + "-" + iconName
      : symbol;

  return [
    {
      tag: "svg",
      attributes: {
        style: "display: none;"
      },
      children: [
        {
          tag: "symbol",
          attributes: _extends({}, attributes, { id: id }),
          children: children
        }
      ]
    }
  ];
};

function makeInlineSvgAbstract(params) {
  var _params$icons = params.icons,
    main = _params$icons.main,
    mask = _params$icons.mask,
    prefix = params.prefix,
    iconName = params.iconName,
    transform = params.transform,
    symbol = params.symbol,
    title = params.title,
    extra = params.extra,
    _params$watchable = params.watchable,
    watchable = _params$watchable === undefined ? false : _params$watchable;

  var _ref = mask.found ? mask : main,
    width = _ref.width,
    height = _ref.height;

  var widthClass = "fa-w-" + Math.ceil((width / height) * 16);
  var attrClass = [
    config$1.replacementClass,
    iconName ? config$1.familyPrefix + "-" + iconName : "",
    widthClass
  ]
    .concat(extra.classes)
    .join(" ");

  var content = {
    children: [],
    attributes: _extends({}, extra.attributes, {
      "data-prefix": prefix,
      "data-icon": iconName,
      class: attrClass,
      role: "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 " + width + " " + height
    })
  };

  if (watchable) {
    content.attributes[DATA_FA_I2SVG] = "";
  }

  if (title)
    content.children.push({
      tag: "title",
      attributes: {
        id: content.attributes["aria-labelledby"] || "title-" + nextUniqueId()
      },
      children: [title]
    });

  var args = _extends({}, content, {
    prefix: prefix,
    iconName: iconName,
    main: main,
    mask: mask,
    transform: transform,
    symbol: symbol,
    styles: extra.styles
  });

  var _ref2 =
      mask.found && main.found ? makeIconMasking(args) : makeIconStandard(args),
    children = _ref2.children,
    attributes = _ref2.attributes;

  args.children = children;
  args.attributes = attributes;

  if (symbol) {
    return asSymbol(args);
  } else {
    return asIcon(args);
  }
}

function makeLayersTextAbstract(params) {
  var content = params.content,
    width = params.width,
    height = params.height,
    transform = params.transform,
    title = params.title,
    extra = params.extra,
    _params$watchable2 = params.watchable,
    watchable = _params$watchable2 === undefined ? false : _params$watchable2;

  var attributes = _extends(
    {},
    extra.attributes,
    title ? { title: title } : {},
    {
      class: extra.classes.join(" ")
    }
  );

  if (watchable) {
    attributes[DATA_FA_I2SVG] = "";
  }

  var styles = _extends({}, extra.styles);

  if (transformIsMeaningful(transform)) {
    styles["transform"] = transformForCss({
      transform: transform,
      startCentered: true,
      width: width,
      height: height
    });
    styles["-webkit-transform"] = styles["transform"];
  }

  var styleString = joinStyles(styles);

  if (styleString.length > 0) {
    attributes["style"] = styleString;
  }

  var val = [];

  val.push({
    tag: "span",
    attributes: attributes,
    children: [content]
  });

  if (title) {
    val.push({
      tag: "span",
      attributes: { class: "sr-only" },
      children: [title]
    });
  }

  return val;
}

var noop$2 = function noop() {};
var p =
  config$1.measurePerformance &&
  PERFORMANCE &&
  PERFORMANCE.mark &&
  PERFORMANCE.measure
    ? PERFORMANCE
    : { mark: noop$2, measure: noop$2 };
var preamble = 'FA "5.0.13"';

var begin = function begin(name) {
  p.mark(preamble + " " + name + " begins");
  return function() {
    return end(name);
  };
};

var end = function end(name) {
  p.mark(preamble + " " + name + " ends");
  p.measure(
    preamble + " " + name,
    preamble + " " + name + " begins",
    preamble + " " + name + " ends"
  );
};

var perf = { begin: begin, end: end };

/**
 * Internal helper to bind a function known to have 4 arguments
 * to a given context.
 */
var bindInternal4 = function bindInternal4(func, thisContext) {
  return function(a, b, c, d) {
    return func.call(thisContext, a, b, c, d);
  };
};

/**
 * # Reduce
 *
 * A fast object `.reduce()` implementation.
 *
 * @param  {Object}   subject      The object to reduce over.
 * @param  {Function} fn           The reducer function.
 * @param  {mixed}    initialValue The initial value for the reducer, defaults to subject[0].
 * @param  {Object}   thisContext  The context for the reducer.
 * @return {mixed}                 The final result.
 */
var reduce = function fastReduceObject(subject, fn, initialValue, thisContext) {
  var keys = Object.keys(subject),
    length = keys.length,
    iterator = thisContext !== undefined ? bindInternal4(fn, thisContext) : fn,
    i,
    key,
    result;

  if (initialValue === undefined) {
    i = 1;
    result = subject[keys[0]];
  } else {
    i = 0;
    result = initialValue;
  }

  for (; i < length; i++) {
    key = keys[i];
    result = iterator(result, subject[key], key, subject);
  }

  return result;
};

var styles$2 = namespace.styles;
var shims = namespace.shims;

var _byUnicode = {};
var _byLigature = {};
var _byOldName = {};

var build = function build() {
  var lookup = function lookup(reducer) {
    return reduce(
      styles$2,
      function(o, style, prefix) {
        o[prefix] = reduce(style, reducer, {});
        return o;
      },
      {}
    );
  };

  _byUnicode = lookup(function(acc, icon, iconName) {
    acc[icon[3]] = iconName;

    return acc;
  });

  _byLigature = lookup(function(acc, icon, iconName) {
    var ligatures = icon[2];

    acc[iconName] = iconName;

    ligatures.forEach(function(ligature) {
      acc[ligature] = iconName;
    });

    return acc;
  });

  var hasRegular = "far" in styles$2;

  _byOldName = reduce(
    shims,
    function(acc, shim) {
      var oldName = shim[0];
      var prefix = shim[1];
      var iconName = shim[2];

      if (prefix === "far" && !hasRegular) {
        prefix = "fas";
      }

      acc[oldName] = { prefix: prefix, iconName: iconName };

      return acc;
    },
    {}
  );
};

build();

function byUnicode(prefix, unicode) {
  return _byUnicode[prefix][unicode];
}

function byLigature(prefix, ligature) {
  return _byLigature[prefix][ligature];
}

function byOldName(name) {
  return _byOldName[name] || { prefix: null, iconName: null };
}

var styles$1 = namespace.styles;

var emptyCanonicalIcon = function emptyCanonicalIcon() {
  return { prefix: null, iconName: null, rest: [] };
};

function getCanonicalIcon(values) {
  return values.reduce(function(acc, cls) {
    var iconName = getIconName(config$1.familyPrefix, cls);

    if (styles$1[cls]) {
      acc.prefix = cls;
    } else if (iconName) {
      var shim = acc.prefix === "fa" ? byOldName(iconName) : {};

      acc.iconName = shim.iconName || iconName;
      acc.prefix = shim.prefix || acc.prefix;
    } else if (
      cls !== config$1.replacementClass &&
      cls.indexOf("fa-w-") !== 0
    ) {
      acc.rest.push(cls);
    }

    return acc;
  }, emptyCanonicalIcon());
}

function iconFromMapping(mapping, prefix, iconName) {
  if (mapping && mapping[prefix] && mapping[prefix][iconName]) {
    return {
      prefix: prefix,
      iconName: iconName,
      icon: mapping[prefix][iconName]
    };
  }
}

function toHtml(abstractNodes) {
  var tag = abstractNodes.tag,
    _abstractNodes$attrib = abstractNodes.attributes,
    attributes =
      _abstractNodes$attrib === undefined ? {} : _abstractNodes$attrib,
    _abstractNodes$childr = abstractNodes.children,
    children = _abstractNodes$childr === undefined ? [] : _abstractNodes$childr;

  if (typeof abstractNodes === "string") {
    return htmlEscape(abstractNodes);
  } else {
    return (
      "<" +
      tag +
      " " +
      joinAttributes(attributes) +
      ">" +
      children.map(toHtml).join("") +
      "</" +
      tag +
      ">"
    );
  }
}

var noop$1$1 = function noop() {};

function isWatched(node) {
  var i2svg = node.getAttribute ? node.getAttribute(DATA_FA_I2SVG) : null;

  return typeof i2svg === "string";
}

function getMutator() {
  if (config$1.autoReplaceSvg === true) {
    return mutators.replace;
  }

  var mutator = mutators[config$1.autoReplaceSvg];

  return mutator || mutators.replace;
}

var mutators = {
  replace: function replace(mutation) {
    var node = mutation[0];
    var abstract = mutation[1];
    var newOuterHTML = abstract
      .map(function(a) {
        return toHtml(a);
      })
      .join("\n");

    if (node.parentNode && node.outerHTML) {
      node.outerHTML =
        newOuterHTML +
        (config$1.keepOriginalSource && node.tagName.toLowerCase() !== "svg"
          ? "<!-- " + node.outerHTML + " -->"
          : "");
    } else if (node.parentNode) {
      var newNode = document.createElement("span");
      node.parentNode.replaceChild(newNode, node);
      newNode.outerHTML = newOuterHTML;
    }
  },
  nest: function nest(mutation) {
    var node = mutation[0];
    var abstract = mutation[1];

    // If we already have a replaced node we do not want to continue nesting within it.
    // Short-circuit to the standard replacement
    if (~classArray(node).indexOf(config$1.replacementClass)) {
      return mutators.replace(mutation);
    }

    var forSvg = new RegExp(config$1.familyPrefix + "-.*");

    delete abstract[0].attributes.style;

    var splitClasses = abstract[0].attributes.class.split(" ").reduce(
      function(acc, cls) {
        if (cls === config$1.replacementClass || cls.match(forSvg)) {
          acc.toSvg.push(cls);
        } else {
          acc.toNode.push(cls);
        }

        return acc;
      },
      { toNode: [], toSvg: [] }
    );

    abstract[0].attributes.class = splitClasses.toSvg.join(" ");

    var newInnerHTML = abstract
      .map(function(a) {
        return toHtml(a);
      })
      .join("\n");
    node.setAttribute("class", splitClasses.toNode.join(" "));
    node.setAttribute(DATA_FA_I2SVG, "");
    node.innerHTML = newInnerHTML;
  }
};

function perform(mutations, callback) {
  var callbackFunction = typeof callback === "function" ? callback : noop$1$1;

  if (mutations.length === 0) {
    callbackFunction();
  } else {
    var frame =
      WINDOW.requestAnimationFrame ||
      function(op) {
        return op();
      };

    frame(function() {
      var mutator = getMutator();
      var mark = perf.begin("mutate");

      mutations.map(mutator);

      mark();

      callbackFunction();
    });
  }
}

var disabled = false;

function disableObservation(operation) {
  disabled = true;
  operation();
  disabled = false;
}

var mo = null;

function observe(options) {
  if (!MUTATION_OBSERVER) return;

  var treeCallback = options.treeCallback,
    nodeCallback = options.nodeCallback,
    pseudoElementsCallback = options.pseudoElementsCallback;

  mo = new MUTATION_OBSERVER(function(objects) {
    if (disabled) return;

    toArray(objects).forEach(function(mutationRecord) {
      if (
        mutationRecord.type === "childList" &&
        mutationRecord.addedNodes.length > 0 &&
        !isWatched(mutationRecord.addedNodes[0])
      ) {
        if (config$1.searchPseudoElements) {
          pseudoElementsCallback(mutationRecord.target);
        }

        treeCallback(mutationRecord.target);
      }

      if (
        mutationRecord.type === "attributes" &&
        mutationRecord.target.parentNode &&
        config$1.searchPseudoElements
      ) {
        pseudoElementsCallback(mutationRecord.target.parentNode);
      }

      if (
        mutationRecord.type === "attributes" &&
        isWatched(mutationRecord.target) &&
        ~ATTRIBUTES_WATCHED_FOR_MUTATION.indexOf(mutationRecord.attributeName)
      ) {
        if (mutationRecord.attributeName === "class") {
          var _getCanonicalIcon = getCanonicalIcon(
              classArray(mutationRecord.target)
            ),
            prefix = _getCanonicalIcon.prefix,
            iconName = _getCanonicalIcon.iconName;

          if (prefix) mutationRecord.target.setAttribute("data-prefix", prefix);
          if (iconName)
            mutationRecord.target.setAttribute("data-icon", iconName);
        } else {
          nodeCallback(mutationRecord.target);
        }
      }
    });
  });

  if (!IS_DOM) return;

  mo.observe(DOCUMENT.getElementsByTagName("body")[0], {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true
  });
}

function disconnect() {
  if (!mo) return;

  mo.disconnect();
}

var styleParser = function(node) {
  var style = node.getAttribute("style");

  var val = [];

  if (style) {
    val = style.split(";").reduce(function(acc, style) {
      var styles = style.split(":");
      var prop = styles[0];
      var value = styles.slice(1);

      if (prop && value.length > 0) {
        acc[prop] = value.join(":").trim();
      }

      return acc;
    }, {});
  }

  return val;
};

function toHex(unicode) {
  var result = "";

  for (var i = 0; i < unicode.length; i++) {
    var hex = unicode.charCodeAt(i).toString(16);
    result += ("000" + hex).slice(-4);
  }

  return result;
}

var classParser = function(node) {
  var existingPrefix = node.getAttribute("data-prefix");
  var existingIconName = node.getAttribute("data-icon");
  var innerText = node.innerText !== undefined ? node.innerText.trim() : "";

  var val = getCanonicalIcon(classArray(node));

  if (existingPrefix && existingIconName) {
    val.prefix = existingPrefix;
    val.iconName = existingIconName;
  }

  if (val.prefix && innerText.length > 1) {
    val.iconName = byLigature(val.prefix, node.innerText);
  } else if (val.prefix && innerText.length === 1) {
    val.iconName = byUnicode(val.prefix, toHex(node.innerText));
  }

  return val;
};

var parseTransformString = function parseTransformString(transformString) {
  var transform = {
    size: 16,
    x: 0,
    y: 0,
    flipX: false,
    flipY: false,
    rotate: 0
  };

  if (!transformString) {
    return transform;
  } else {
    return transformString
      .toLowerCase()
      .split(" ")
      .reduce(function(acc, n) {
        var parts = n.toLowerCase().split("-");
        var first = parts[0];
        var rest = parts.slice(1).join("-");

        if (first && rest === "h") {
          acc.flipX = true;
          return acc;
        }

        if (first && rest === "v") {
          acc.flipY = true;
          return acc;
        }

        rest = parseFloat(rest);

        if (isNaN(rest)) {
          return acc;
        }

        switch (first) {
          case "grow":
            acc.size = acc.size + rest;
            break;
          case "shrink":
            acc.size = acc.size - rest;
            break;
          case "left":
            acc.x = acc.x - rest;
            break;
          case "right":
            acc.x = acc.x + rest;
            break;
          case "up":
            acc.y = acc.y - rest;
            break;
          case "down":
            acc.y = acc.y + rest;
            break;
          case "rotate":
            acc.rotate = acc.rotate + rest;
            break;
        }

        return acc;
      }, transform);
  }
};

var transformParser = function(node) {
  return parseTransformString(node.getAttribute("data-fa-transform"));
};

var symbolParser = function(node) {
  var symbol = node.getAttribute("data-fa-symbol");

  return symbol === null ? false : symbol === "" ? true : symbol;
};

var attributesParser = function(node) {
  var extraAttributes = toArray(node.attributes).reduce(function(acc, attr) {
    if (acc.name !== "class" && acc.name !== "style") {
      acc[attr.name] = attr.value;
    }
    return acc;
  }, {});

  var title = node.getAttribute("title");

  if (config$1.autoA11y) {
    if (title) {
      extraAttributes["aria-labelledby"] =
        config$1.replacementClass + "-title-" + nextUniqueId();
    } else {
      extraAttributes["aria-hidden"] = "true";
    }
  }

  return extraAttributes;
};

var maskParser = function(node) {
  var mask = node.getAttribute("data-fa-mask");

  if (!mask) {
    return emptyCanonicalIcon();
  } else {
    return getCanonicalIcon(
      mask.split(" ").map(function(i) {
        return i.trim();
      })
    );
  }
};

function parseMeta(node) {
  var _classParser = classParser(node),
    iconName = _classParser.iconName,
    prefix = _classParser.prefix,
    extraClasses = _classParser.rest;

  var extraStyles = styleParser(node);
  var transform = transformParser(node);
  var symbol = symbolParser(node);
  var extraAttributes = attributesParser(node);
  var mask = maskParser(node);

  return {
    iconName: iconName,
    title: node.getAttribute("title"),
    prefix: prefix,
    transform: transform,
    symbol: symbol,
    mask: mask,
    extra: {
      classes: extraClasses,
      styles: extraStyles,
      attributes: extraAttributes
    }
  };
}

function MissingIcon(error) {
  this.name = "MissingIcon";
  this.message = error || "Icon unavailable";
  this.stack = new Error().stack;
}

MissingIcon.prototype = Object.create(Error.prototype);
MissingIcon.prototype.constructor = MissingIcon;

var FILL = { fill: "currentColor" };
var ANIMATION_BASE = {
  attributeType: "XML",
  repeatCount: "indefinite",
  dur: "2s"
};
var RING = {
  tag: "path",
  attributes: _extends({}, FILL, {
    d:
      "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
  })
};
var OPACITY_ANIMATE = _extends({}, ANIMATION_BASE, {
  attributeName: "opacity"
});
var DOT = {
  tag: "circle",
  attributes: _extends({}, FILL, {
    cx: "256",
    cy: "364",
    r: "28"
  }),
  children: [
    {
      tag: "animate",
      attributes: _extends({}, ANIMATION_BASE, {
        attributeName: "r",
        values: "28;14;28;28;14;28;"
      })
    },
    {
      tag: "animate",
      attributes: _extends({}, OPACITY_ANIMATE, { values: "1;0;1;1;0;1;" })
    }
  ]
};
var QUESTION = {
  tag: "path",
  attributes: _extends({}, FILL, {
    opacity: "1",
    d:
      "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
  }),
  children: [
    {
      tag: "animate",
      attributes: _extends({}, OPACITY_ANIMATE, { values: "1;0;0;0;0;1;" })
    }
  ]
};
var EXCLAMATION = {
  tag: "path",
  attributes: _extends({}, FILL, {
    opacity: "0",
    d:
      "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
  }),
  children: [
    {
      tag: "animate",
      attributes: _extends({}, OPACITY_ANIMATE, { values: "0;0;1;1;0;0;" })
    }
  ]
};

var missing = { tag: "g", children: [RING, DOT, QUESTION, EXCLAMATION] };

var styles = namespace.styles;

var LAYERS_TEXT_CLASSNAME = "fa-layers-text";
var FONT_FAMILY_PATTERN = /Font Awesome 5 (Solid|Regular|Light|Brands)/;
var STYLE_TO_PREFIX = {
  Solid: "fas",
  Regular: "far",
  Light: "fal",
  Brands: "fab"
};

function findIcon(iconName, prefix) {
  var val = {
    found: false,
    width: 512,
    height: 512,
    icon: missing
  };

  if (iconName && prefix && styles[prefix] && styles[prefix][iconName]) {
    var icon = styles[prefix][iconName];
    var width = icon[0];
    var height = icon[1];
    var vectorData = icon.slice(4);

    val = {
      found: true,
      width: width,
      height: height,
      icon: {
        tag: "path",
        attributes: { fill: "currentColor", d: vectorData[0] }
      }
    };
  } else if (iconName && prefix && !config$1.showMissingIcons) {
    throw new MissingIcon(
      "Icon is missing for prefix " + prefix + " with icon name " + iconName
    );
  }

  return val;
}

function generateSvgReplacementMutation(node, nodeMeta) {
  var iconName = nodeMeta.iconName,
    title = nodeMeta.title,
    prefix = nodeMeta.prefix,
    transform = nodeMeta.transform,
    symbol = nodeMeta.symbol,
    mask = nodeMeta.mask,
    extra = nodeMeta.extra;

  return [
    node,
    makeInlineSvgAbstract({
      icons: {
        main: findIcon(iconName, prefix),
        mask: findIcon(mask.iconName, mask.prefix)
      },
      prefix: prefix,
      iconName: iconName,
      transform: transform,
      symbol: symbol,
      mask: mask,
      title: title,
      extra: extra,
      watchable: true
    })
  ];
}

function generateLayersText(node, nodeMeta) {
  var title = nodeMeta.title,
    transform = nodeMeta.transform,
    extra = nodeMeta.extra;

  var width = null;
  var height = null;

  if (IS_IE) {
    var computedFontSize = parseInt(getComputedStyle(node).fontSize, 10);
    var boundingClientRect = node.getBoundingClientRect();
    width = boundingClientRect.width / computedFontSize;
    height = boundingClientRect.height / computedFontSize;
  }

  if (config$1.autoA11y && !title) {
    extra.attributes["aria-hidden"] = "true";
  }

  return [
    node,
    makeLayersTextAbstract({
      content: node.innerHTML,
      width: width,
      height: height,
      transform: transform,
      title: title,
      extra: extra,
      watchable: true
    })
  ];
}

function generateMutation(node) {
  var nodeMeta = parseMeta(node);

  if (~nodeMeta.extra.classes.indexOf(LAYERS_TEXT_CLASSNAME)) {
    return generateLayersText(node, nodeMeta);
  } else {
    return generateSvgReplacementMutation(node, nodeMeta);
  }
}

function remove(node) {
  if (typeof node.remove === "function") {
    node.remove();
  } else if (node && node.parentNode) {
    node.parentNode.removeChild(node);
  }
}

function searchPseudoElements(root) {
  if (!IS_DOM) return;

  var end = perf.begin("searchPseudoElements");

  disableObservation(function() {
    toArray(root.querySelectorAll("*")).forEach(function(node) {
      [":before", ":after"].forEach(function(pos) {
        var styles = WINDOW.getComputedStyle(node, pos);
        var fontFamily = styles
          .getPropertyValue("font-family")
          .match(FONT_FAMILY_PATTERN);
        var children = toArray(node.children);
        var pseudoElement = children.filter(function(c) {
          return c.getAttribute(DATA_FA_PSEUDO_ELEMENT) === pos;
        })[0];

        if (pseudoElement) {
          if (
            pseudoElement.nextSibling &&
            pseudoElement.nextSibling.textContent.indexOf(
              DATA_FA_PSEUDO_ELEMENT
            ) > -1
          ) {
            remove(pseudoElement.nextSibling);
          }
          remove(pseudoElement);
          pseudoElement = null;
        }

        if (fontFamily && !pseudoElement) {
          var content = styles.getPropertyValue("content");
          var i = DOCUMENT.createElement("i");
          i.setAttribute("class", "" + STYLE_TO_PREFIX[fontFamily[1]]);
          i.setAttribute(DATA_FA_PSEUDO_ELEMENT, pos);
          i.innerText = content.length === 3 ? content.substr(1, 1) : content;
          if (pos === ":before") {
            node.insertBefore(i, node.firstChild);
          } else {
            node.appendChild(i);
          }
        }
      });
    });
  });

  end();
}

function onTree(root) {
  var callback =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  if (!IS_DOM) return;

  var htmlClassList = DOCUMENT.documentElement.classList;
  var hclAdd = function hclAdd(suffix) {
    return htmlClassList.add(HTML_CLASS_I2SVG_BASE_CLASS + "-" + suffix);
  };
  var hclRemove = function hclRemove(suffix) {
    return htmlClassList.remove(HTML_CLASS_I2SVG_BASE_CLASS + "-" + suffix);
  };
  var prefixes = Object.keys(styles);
  var prefixesDomQuery = [
    "." + LAYERS_TEXT_CLASSNAME + ":not([" + DATA_FA_I2SVG + "])"
  ]
    .concat(
      prefixes.map(function(p) {
        return "." + p + ":not([" + DATA_FA_I2SVG + "])";
      })
    )
    .join(", ");

  if (prefixesDomQuery.length === 0) {
    return;
  }

  var candidates = toArray(root.querySelectorAll(prefixesDomQuery));

  if (candidates.length > 0) {
    hclAdd("pending");
    hclRemove("complete");
  } else {
    return;
  }

  var mark = perf.begin("onTree");

  var mutations = candidates.reduce(function(acc, node) {
    try {
      var mutation = generateMutation(node);

      if (mutation) {
        acc.push(mutation);
      }
    } catch (e) {
      if (!PRODUCTION) {
        if (e instanceof MissingIcon) {
          console.error(e);
        }
      }
    }

    return acc;
  }, []);

  mark();

  perform(mutations, function() {
    hclAdd("active");
    hclAdd("complete");
    hclRemove("pending");

    if (typeof callback === "function") callback();
  });
}

function onNode(node) {
  var callback =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  var mutation = generateMutation(node);

  if (mutation) {
    perform([mutation], callback);
  }
}

var baseStyles =
  'svg:not(:root).svg-inline--fa {\n  overflow: visible; }\n\n.svg-inline--fa {\n  display: inline-block;\n  font-size: inherit;\n  height: 1em;\n  overflow: visible;\n  vertical-align: -.125em; }\n  .svg-inline--fa.fa-lg {\n    vertical-align: -.225em; }\n  .svg-inline--fa.fa-w-1 {\n    width: 0.0625em; }\n  .svg-inline--fa.fa-w-2 {\n    width: 0.125em; }\n  .svg-inline--fa.fa-w-3 {\n    width: 0.1875em; }\n  .svg-inline--fa.fa-w-4 {\n    width: 0.25em; }\n  .svg-inline--fa.fa-w-5 {\n    width: 0.3125em; }\n  .svg-inline--fa.fa-w-6 {\n    width: 0.375em; }\n  .svg-inline--fa.fa-w-7 {\n    width: 0.4375em; }\n  .svg-inline--fa.fa-w-8 {\n    width: 0.5em; }\n  .svg-inline--fa.fa-w-9 {\n    width: 0.5625em; }\n  .svg-inline--fa.fa-w-10 {\n    width: 0.625em; }\n  .svg-inline--fa.fa-w-11 {\n    width: 0.6875em; }\n  .svg-inline--fa.fa-w-12 {\n    width: 0.75em; }\n  .svg-inline--fa.fa-w-13 {\n    width: 0.8125em; }\n  .svg-inline--fa.fa-w-14 {\n    width: 0.875em; }\n  .svg-inline--fa.fa-w-15 {\n    width: 0.9375em; }\n  .svg-inline--fa.fa-w-16 {\n    width: 1em; }\n  .svg-inline--fa.fa-w-17 {\n    width: 1.0625em; }\n  .svg-inline--fa.fa-w-18 {\n    width: 1.125em; }\n  .svg-inline--fa.fa-w-19 {\n    width: 1.1875em; }\n  .svg-inline--fa.fa-w-20 {\n    width: 1.25em; }\n  .svg-inline--fa.fa-pull-left {\n    margin-right: .3em;\n    width: auto; }\n  .svg-inline--fa.fa-pull-right {\n    margin-left: .3em;\n    width: auto; }\n  .svg-inline--fa.fa-border {\n    height: 1.5em; }\n  .svg-inline--fa.fa-li {\n    width: 2em; }\n  .svg-inline--fa.fa-fw {\n    width: 1.25em; }\n\n.fa-layers svg.svg-inline--fa {\n  bottom: 0;\n  left: 0;\n  margin: auto;\n  position: absolute;\n  right: 0;\n  top: 0; }\n\n.fa-layers {\n  display: inline-block;\n  height: 1em;\n  position: relative;\n  text-align: center;\n  vertical-align: -.125em;\n  width: 1em; }\n  .fa-layers svg.svg-inline--fa {\n    -webkit-transform-origin: center center;\n            transform-origin: center center; }\n\n.fa-layers-text, .fa-layers-counter {\n  display: inline-block;\n  position: absolute;\n  text-align: center; }\n\n.fa-layers-text {\n  left: 50%;\n  top: 50%;\n  -webkit-transform: translate(-50%, -50%);\n          transform: translate(-50%, -50%);\n  -webkit-transform-origin: center center;\n          transform-origin: center center; }\n\n.fa-layers-counter {\n  background-color: #ff253a;\n  border-radius: 1em;\n  -webkit-box-sizing: border-box;\n          box-sizing: border-box;\n  color: #fff;\n  height: 1.5em;\n  line-height: 1;\n  max-width: 5em;\n  min-width: 1.5em;\n  overflow: hidden;\n  padding: .25em;\n  right: 0;\n  text-overflow: ellipsis;\n  top: 0;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: top right;\n          transform-origin: top right; }\n\n.fa-layers-bottom-right {\n  bottom: 0;\n  right: 0;\n  top: auto;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: bottom right;\n          transform-origin: bottom right; }\n\n.fa-layers-bottom-left {\n  bottom: 0;\n  left: 0;\n  right: auto;\n  top: auto;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: bottom left;\n          transform-origin: bottom left; }\n\n.fa-layers-top-right {\n  right: 0;\n  top: 0;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: top right;\n          transform-origin: top right; }\n\n.fa-layers-top-left {\n  left: 0;\n  right: auto;\n  top: 0;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: top left;\n          transform-origin: top left; }\n\n.fa-lg {\n  font-size: 1.33333em;\n  line-height: 0.75em;\n  vertical-align: -.0667em; }\n\n.fa-xs {\n  font-size: .75em; }\n\n.fa-sm {\n  font-size: .875em; }\n\n.fa-1x {\n  font-size: 1em; }\n\n.fa-2x {\n  font-size: 2em; }\n\n.fa-3x {\n  font-size: 3em; }\n\n.fa-4x {\n  font-size: 4em; }\n\n.fa-5x {\n  font-size: 5em; }\n\n.fa-6x {\n  font-size: 6em; }\n\n.fa-7x {\n  font-size: 7em; }\n\n.fa-8x {\n  font-size: 8em; }\n\n.fa-9x {\n  font-size: 9em; }\n\n.fa-10x {\n  font-size: 10em; }\n\n.fa-fw {\n  text-align: center;\n  width: 1.25em; }\n\n.fa-ul {\n  list-style-type: none;\n  margin-left: 2.5em;\n  padding-left: 0; }\n  .fa-ul > li {\n    position: relative; }\n\n.fa-li {\n  left: -2em;\n  position: absolute;\n  text-align: center;\n  width: 2em;\n  line-height: inherit; }\n\n.fa-border {\n  border: solid 0.08em #eee;\n  border-radius: .1em;\n  padding: .2em .25em .15em; }\n\n.fa-pull-left {\n  float: left; }\n\n.fa-pull-right {\n  float: right; }\n\n.fa.fa-pull-left,\n.fas.fa-pull-left,\n.far.fa-pull-left,\n.fal.fa-pull-left,\n.fab.fa-pull-left {\n  margin-right: .3em; }\n\n.fa.fa-pull-right,\n.fas.fa-pull-right,\n.far.fa-pull-right,\n.fal.fa-pull-right,\n.fab.fa-pull-right {\n  margin-left: .3em; }\n\n.fa-spin {\n  -webkit-animation: fa-spin 2s infinite linear;\n          animation: fa-spin 2s infinite linear; }\n\n.fa-pulse {\n  -webkit-animation: fa-spin 1s infinite steps(8);\n          animation: fa-spin 1s infinite steps(8); }\n\n@-webkit-keyframes fa-spin {\n  0% {\n    -webkit-transform: rotate(0deg);\n            transform: rotate(0deg); }\n  100% {\n    -webkit-transform: rotate(360deg);\n            transform: rotate(360deg); } }\n\n@keyframes fa-spin {\n  0% {\n    -webkit-transform: rotate(0deg);\n            transform: rotate(0deg); }\n  100% {\n    -webkit-transform: rotate(360deg);\n            transform: rotate(360deg); } }\n\n.fa-rotate-90 {\n  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=1)";\n  -webkit-transform: rotate(90deg);\n          transform: rotate(90deg); }\n\n.fa-rotate-180 {\n  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=2)";\n  -webkit-transform: rotate(180deg);\n          transform: rotate(180deg); }\n\n.fa-rotate-270 {\n  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=3)";\n  -webkit-transform: rotate(270deg);\n          transform: rotate(270deg); }\n\n.fa-flip-horizontal {\n  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=0, mirror=1)";\n  -webkit-transform: scale(-1, 1);\n          transform: scale(-1, 1); }\n\n.fa-flip-vertical {\n  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)";\n  -webkit-transform: scale(1, -1);\n          transform: scale(1, -1); }\n\n.fa-flip-horizontal.fa-flip-vertical {\n  -ms-filter: "progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)";\n  -webkit-transform: scale(-1, -1);\n          transform: scale(-1, -1); }\n\n:root .fa-rotate-90,\n:root .fa-rotate-180,\n:root .fa-rotate-270,\n:root .fa-flip-horizontal,\n:root .fa-flip-vertical {\n  -webkit-filter: none;\n          filter: none; }\n\n.fa-stack {\n  display: inline-block;\n  height: 2em;\n  position: relative;\n  width: 2em; }\n\n.fa-stack-1x,\n.fa-stack-2x {\n  bottom: 0;\n  left: 0;\n  margin: auto;\n  position: absolute;\n  right: 0;\n  top: 0; }\n\n.svg-inline--fa.fa-stack-1x {\n  height: 1em;\n  width: 1em; }\n\n.svg-inline--fa.fa-stack-2x {\n  height: 2em;\n  width: 2em; }\n\n.fa-inverse {\n  color: #fff; }\n\n.sr-only {\n  border: 0;\n  clip: rect(0, 0, 0, 0);\n  height: 1px;\n  margin: -1px;\n  overflow: hidden;\n  padding: 0;\n  position: absolute;\n  width: 1px; }\n\n.sr-only-focusable:active, .sr-only-focusable:focus {\n  clip: auto;\n  height: auto;\n  margin: 0;\n  overflow: visible;\n  position: static;\n  width: auto; }\n';

var css = function() {
  var dfp = DEFAULT_FAMILY_PREFIX;
  var drc = DEFAULT_REPLACEMENT_CLASS;
  var fp = config$1.familyPrefix;
  var rc = config$1.replacementClass;
  var s = baseStyles;

  if (fp !== dfp || rc !== drc) {
    var dPatt = new RegExp("\\." + dfp + "\\-", "g");
    var rPatt = new RegExp("\\." + drc, "g");

    s = s.replace(dPatt, "." + fp + "-").replace(rPatt, "." + rc);
  }

  return s;
};

function define(prefix, icons) {
  var normalized = Object.keys(icons).reduce(function(acc, iconName) {
    var icon = icons[iconName];
    var expanded = !!icon.icon;

    if (expanded) {
      acc[icon.iconName] = icon.icon;
    } else {
      acc[iconName] = icon;
    }
    return acc;
  }, {});

  if (typeof namespace.hooks.addPack === "function") {
    namespace.hooks.addPack(prefix, normalized);
  } else {
    namespace.styles[prefix] = _extends(
      {},
      namespace.styles[prefix] || {},
      normalized
    );
  }

  /**
   * Font Awesome 4 used the prefix of `fa` for all icons. With the introduction
   * of new styles we needed to differentiate between them. Prefix `fa` is now an alias
   * for `fas` so we'll easy the upgrade process for our users by automatically defining
   * this as well.
   */
  if (prefix === "fas") {
    define("fa", icons);
  }
}

var Library = (function() {
  function Library() {
    classCallCheck(this, Library);

    this.definitions = {};
  }

  createClass(Library, [
    {
      key: "add",
      value: function add() {
        var _this = this;

        for (
          var _len = arguments.length, definitions = Array(_len), _key = 0;
          _key < _len;
          _key++
        ) {
          definitions[_key] = arguments[_key];
        }

        var additions = definitions.reduce(this._pullDefinitions, {});

        Object.keys(additions).forEach(function(key) {
          _this.definitions[key] = _extends(
            {},
            _this.definitions[key] || {},
            additions[key]
          );
          define(key, additions[key]);
        });
      }
    },
    {
      key: "reset",
      value: function reset() {
        this.definitions = {};
      }
    },
    {
      key: "_pullDefinitions",
      value: function _pullDefinitions(additions, definition) {
        var normalized =
          definition.prefix && definition.iconName && definition.icon
            ? { 0: definition }
            : definition;

        Object.keys(normalized).map(function(key) {
          var _normalized$key = normalized[key],
            prefix = _normalized$key.prefix,
            iconName = _normalized$key.iconName,
            icon = _normalized$key.icon;

          if (!additions[prefix]) additions[prefix] = {};

          additions[prefix][iconName] = icon;
        });

        return additions;
      }
    }
  ]);
  return Library;
})();

function prepIcon(icon) {
  var width = icon[0];
  var height = icon[1];
  var vectorData = icon.slice(4);

  return {
    found: true,
    width: width,
    height: height,
    icon: {
      tag: "path",
      attributes: { fill: "currentColor", d: vectorData[0] }
    }
  };
}

var _cssInserted = false;

function ensureCss() {
  if (!config$1.autoAddCss) {
    return;
  }

  if (!_cssInserted) {
    insertCss(css());
  }

  _cssInserted = true;
}

function apiObject(val, abstractCreator) {
  Object.defineProperty(val, "abstract", {
    get: abstractCreator
  });

  Object.defineProperty(val, "html", {
    get: function get() {
      return val.abstract.map(function(a) {
        return toHtml(a);
      });
    }
  });

  Object.defineProperty(val, "node", {
    get: function get() {
      if (!IS_DOM) return;

      var container = DOCUMENT.createElement("div");
      container.innerHTML = val.html;
      return container.children;
    }
  });

  return val;
}

function findIconDefinition(params) {
  var _params$prefix = params.prefix,
    prefix = _params$prefix === undefined ? "fa" : _params$prefix,
    iconName = params.iconName;

  if (!iconName) return;

  return (
    iconFromMapping(library.definitions, prefix, iconName) ||
    iconFromMapping(namespace.styles, prefix, iconName)
  );
}

function resolveIcons(next) {
  return function(maybeIconDefinition) {
    var params =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var iconDefinition = (maybeIconDefinition || {}).icon
      ? maybeIconDefinition
      : findIconDefinition(maybeIconDefinition || {});

    var mask = params.mask;

    if (mask) {
      mask = (mask || {}).icon ? mask : findIconDefinition(mask || {});
    }

    return next(iconDefinition, _extends({}, params, { mask: mask }));
  };
}

var library = new Library();

var noAuto = function noAuto() {
  auto(false);
  disconnect();
};

var dom = {
  i2svg: function i2svg() {
    var params =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (IS_DOM) {
      ensureCss();

      var _params$node = params.node,
        node = _params$node === undefined ? DOCUMENT : _params$node,
        _params$callback = params.callback,
        callback =
          _params$callback === undefined ? function() {} : _params$callback;

      if (config$1.searchPseudoElements) {
        searchPseudoElements(node);
      }

      onTree(node, callback);
    }
  },

  css: css,

  insertCss: function insertCss$$1() {
    insertCss(css());
  }
};

var parse = {
  transform: function transform(transformString) {
    return parseTransformString(transformString);
  }
};

var icon = resolveIcons(function(iconDefinition) {
  var params =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _params$transform = params.transform,
    transform =
      _params$transform === undefined
        ? meaninglessTransform
        : _params$transform,
    _params$symbol = params.symbol,
    symbol = _params$symbol === undefined ? false : _params$symbol,
    _params$mask = params.mask,
    mask = _params$mask === undefined ? null : _params$mask,
    _params$title = params.title,
    title = _params$title === undefined ? null : _params$title,
    _params$classes = params.classes,
    classes = _params$classes === undefined ? [] : _params$classes,
    _params$attributes = params.attributes,
    attributes = _params$attributes === undefined ? {} : _params$attributes,
    _params$styles = params.styles,
    styles = _params$styles === undefined ? {} : _params$styles;

  if (!iconDefinition) return;

  var prefix = iconDefinition.prefix,
    iconName = iconDefinition.iconName,
    icon = iconDefinition.icon;

  return apiObject(_extends({ type: "icon" }, iconDefinition), function() {
    ensureCss();

    if (config$1.autoA11y) {
      if (title) {
        attributes["aria-labelledby"] =
          config$1.replacementClass + "-title-" + nextUniqueId();
      } else {
        attributes["aria-hidden"] = "true";
      }
    }

    return makeInlineSvgAbstract({
      icons: {
        main: prepIcon(icon),
        mask: mask
          ? prepIcon(mask.icon)
          : { found: false, width: null, height: null, icon: {} }
      },
      prefix: prefix,
      iconName: iconName,
      transform: _extends({}, meaninglessTransform, transform),
      symbol: symbol,
      title: title,
      extra: {
        attributes: attributes,
        styles: styles,
        classes: classes
      }
    });
  });
});

var text = function text(content) {
  var params =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _params$transform2 = params.transform,
    transform =
      _params$transform2 === undefined
        ? meaninglessTransform
        : _params$transform2,
    _params$title2 = params.title,
    title = _params$title2 === undefined ? null : _params$title2,
    _params$classes2 = params.classes,
    classes = _params$classes2 === undefined ? [] : _params$classes2,
    _params$attributes2 = params.attributes,
    attributes = _params$attributes2 === undefined ? {} : _params$attributes2,
    _params$styles2 = params.styles,
    styles = _params$styles2 === undefined ? {} : _params$styles2;

  return apiObject({ type: "text", content: content }, function() {
    ensureCss();

    return makeLayersTextAbstract({
      content: content,
      transform: _extends({}, meaninglessTransform, transform),
      title: title,
      extra: {
        attributes: attributes,
        styles: styles,
        classes: [config$1.familyPrefix + "-layers-text"].concat(
          toConsumableArray(classes)
        )
      }
    });
  });
};

var layer = function layer(assembler) {
  return apiObject({ type: "layer" }, function() {
    ensureCss();

    var children = [];

    assembler(function(args) {
      Array.isArray(args)
        ? args.map(function(a) {
            children = children.concat(a.abstract);
          })
        : (children = children.concat(args.abstract));
    });

    return [
      {
        tag: "span",
        attributes: { class: config$1.familyPrefix + "-layers" },
        children: children
      }
    ];
  });
};

var api$1 = {
  noAuto: noAuto,
  dom: dom,
  library: library,
  parse: parse,
  findIconDefinition: findIconDefinition,
  icon: icon,
  text: text,
  layer: layer
};

var autoReplace = function autoReplace() {
  if (IS_DOM && config$1.autoReplaceSvg) api$1.dom.i2svg({ node: DOCUMENT });
};

function bootstrap() {
  if (IS_BROWSER) {
    if (!WINDOW.FontAwesome) {
      WINDOW.FontAwesome = api$1;
    }

    domready(function() {
      if (Object.keys(namespace.styles).length > 0) {
        autoReplace();
      }

      if (config$1.observeMutations && typeof MutationObserver === "function") {
        observe({
          treeCallback: onTree,
          nodeCallback: onNode,
          pseudoElementsCallback: searchPseudoElements
        });
      }
    });
  }

  namespace.hooks = _extends({}, namespace.hooks, {
    addPack: function addPack(prefix, icons) {
      namespace.styles[prefix] = _extends(
        {},
        namespace.styles[prefix] || {},
        icons
      );

      build();
      autoReplace();
    },

    addShims: function addShims(shims) {
      var _namespace$shims;

      (_namespace$shims = namespace.shims).push.apply(
        _namespace$shims,
        toConsumableArray(shims)
      );

      build();
      autoReplace();
    }
  });
}

Object.defineProperty(api$1, "config", {
  get: function get() {
    return config$1;
  },

  set: function set(newConfig) {
    update(newConfig);
  }
});

if (IS_DOM) bunker(bootstrap);

/*!
 * Font Awesome Free 5.0.13 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 */
var faRssSquare = {
  prefix: "fas",
  iconName: "rss-square",
  icon: [
    448,
    512,
    [],
    "f143",
    "M400 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zM112 416c-26.51 0-48-21.49-48-48s21.49-48 48-48 48 21.49 48 48-21.49 48-48 48zm157.533 0h-34.335c-6.011 0-11.051-4.636-11.442-10.634-5.214-80.05-69.243-143.92-149.123-149.123-5.997-.39-10.633-5.431-10.633-11.441v-34.335c0-6.535 5.468-11.777 11.994-11.425 110.546 5.974 198.997 94.536 204.964 204.964.352 6.526-4.89 11.994-11.425 11.994zm103.027 0h-34.334c-6.161 0-11.175-4.882-11.427-11.038-5.598-136.535-115.204-246.161-251.76-251.76C68.882 152.949 64 147.935 64 141.774V107.44c0-6.454 5.338-11.664 11.787-11.432 167.83 6.025 302.21 141.191 308.205 308.205.232 6.449-4.978 11.787-11.432 11.787z"
  ]
};

/* src/components/views/CardHeader.html generated by Svelte v2.16.1 */

api$1.library.add(faRssSquare);

const file = "src/components/views/CardHeader.html";

function add_css() {
  var style = createElement("style");
  style.id = "svelte-30j8po-style";
  style.textContent =
    ".ui-card__header.svelte-30j8po{background-color:transparent;border-bottom:none;z-index:500}.card>hr.svelte-30j8po{margin:0 1rem}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FyZEhlYWRlci5odG1sIiwic291cmNlcyI6WyJDYXJkSGVhZGVyLmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPGRpdiBjbGFzcz1cImNhcmQtaGVhZGVyIHctMTAwIGQtZmxleCBmbGV4LWNvbHVtbiBhbGlnbi1pdGVtcy1jZW50ZXIgdWktY2FyZF9faGVhZGVyXCI+XG4gIDxoMT5NaWNyb3NlbnNlIFVJIDxpIGNsYXNzPVwiZmFzIGZhLXJzcy1zcXVhcmVcIj48L2k+PC9oMT5cbiAgPGgyPk1hbmFnZSBZb3VyIFJGSUQgUmVhZGVyczwvaDI+XG48L2Rpdj5cblxuPGhyPlxuXG48c2NyaXB0PlxuICBpbXBvcnQgZm9udGF3ZXNvbWUgZnJvbSBcIkBmb3J0YXdlc29tZS9mb250YXdlc29tZVwiO1xuICBpbXBvcnQgeyBmYVJzc1NxdWFyZSB9IGZyb20gXCJAZm9ydGF3ZXNvbWUvZm9udGF3ZXNvbWUtZnJlZS1zb2xpZFwiO1xuXG4gIGZvbnRhd2Vzb21lLmxpYnJhcnkuYWRkKGZhUnNzU3F1YXJlKTtcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gIC51aS1jYXJkX19oZWFkZXIge1xuICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICAgIGJvcmRlci1ib3R0b206IG5vbmU7XG4gICAgei1pbmRleDogNTAwO1xuICB9XG5cbiAgLmNhcmQ+aHIge1xuICAgIG1hcmdpbjogMCAxcmVtO1xuICB9XG48L3N0eWxlPiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFlRSxnQkFBZ0IsY0FBQyxDQUFDLEFBQ2hCLGdCQUFnQixDQUFFLFdBQVcsQ0FDN0IsYUFBYSxDQUFFLElBQUksQ0FDbkIsT0FBTyxDQUFFLEdBQUcsQUFDZCxDQUFDLEFBRUQsS0FBSyxDQUFDLEVBQUUsY0FBQyxDQUFDLEFBQ1IsTUFBTSxDQUFFLENBQUMsQ0FBQyxJQUFJLEFBQ2hCLENBQUMifQ== */";
  append(document.head, style);
}

function create_main_fragment(component, ctx) {
  var div, h1, text0, i, text1, h2, text3, hr;

  return {
    c: function create() {
      div = createElement("div");
      h1 = createElement("h1");
      text0 = createText("Microsense UI ");
      i = createElement("i");
      text1 = createText("\n  ");
      h2 = createElement("h2");
      h2.textContent = "Manage Your RFID Readers";
      text3 = createText("\n\n");
      hr = createElement("hr");
      i.className = "fas fa-rss-square";
      addLoc(i, file, 1, 20, 106);
      addLoc(h1, file, 1, 2, 88);
      addLoc(h2, file, 2, 2, 147);
      div.className =
        "card-header w-100 d-flex flex-column align-items-center ui-card__header svelte-30j8po";
      addLoc(div, file, 0, 0, 0);
      hr.className = "svelte-30j8po";
      addLoc(hr, file, 5, 0, 189);
    },

    m: function mount(target, anchor) {
      insert(target, div, anchor);
      append(div, h1);
      append(h1, text0);
      append(h1, i);
      append(div, text1);
      append(div, h2);
      insert(target, text3, anchor);
      insert(target, hr, anchor);
    },

    p: noop,

    d: function destroy(detach) {
      if (detach) {
        detachNode(div);
        detachNode(text3);
        detachNode(hr);
      }
    }
  };
}

function CardHeader(options) {
  this._debugName = "<CardHeader>";
  if (!options || (!options.target && !options.root)) {
    throw new Error("'target' is a required option");
  }

  init(this, options);
  this._state = assign({}, options.data);
  this._intro = true;

  if (!document.getElementById("svelte-30j8po-style")) add_css();

  this._fragment = create_main_fragment(this, this._state);

  if (options.target) {
    if (options.hydrate)
      throw new Error(
        "options.hydrate only works if the component was compiled with the `hydratable: true` option"
      );
    this._fragment.c();
    this._mount(options.target, options.anchor);
  }
}

assign(CardHeader.prototype, protoDev);

CardHeader.prototype._checkReadOnly = function _checkReadOnly(newState) {};

const getEndpoints = {
  readers: {
    route: "api/readers",
    method: "GET"
  },
  health: {
    route: "api/health",
    method: "GET"
  },
  operations: {
    route: "api/operations",
    method: "GET"
  }
};

const postEndpoints = {
  jobs: {
    route: "api/jobs",
    method: "POST"
  }
};

const apiHost = "http://localhost:3000";

// Wrapper around fetch - allows for more flexibility
const apiCall = async ({ route, method, payload = undefined }) => {
  const config = {
    method: method,
    mode: "cors",
    headers: {
      "Content-Type": "application/json"
    },
    redirect: "follow",
    referrer: "no-referrer"
  };

  if (method === "POST" && payload) {
    config.body = JSON.stringify(payload);
  }

  try {
    return await fetch(`${apiHost}/${route}`, config)
      .then(res => {
        if (res.ok) {
          return res.json();
        }
      })
      .then(result => {
        return result;
      });
  } catch (err) {
    throw new Error(`Error fetching data for route: ${route}, err: ${err}`);
  }
};

/* src/components/views/CardBody.html generated by Svelte v2.16.1 */

function readerList({ readers, health }) {
  return readers.map(el => {
    const { status, message } = health.find(ind => ind.reader === el.name) || {
      status: "OK",
      message: "Stable connection"
    };
    return {
      name: el.name,
      type: el.type,
      address: el.address,
      status: status,
      message: message
    };
  });
}

function errorStatusSelected({ selectedReaders }) {
  return (
    selectedReaders.length &&
    selectedReaders.filter(reader => reader.status === "ERROR").length
  );
}

function warningStatusSelected({ selectedReaders }) {
  return (
    selectedReaders.length &&
    selectedReaders.filter(reader => reader.status === "WARNING").length
  );
}

function data() {
  return {
    readers: [],
    health: [],
    operations: [],
    selectedReaders: [],
    selectedOperation: null,
    submitting: false,
    success: false
  };
}
var methods = {
  selectReader(reader) {
    const { selectedReaders } = this.get();
    const found = selectedReaders.findIndex(el => el.name === reader.name);
    if (found !== -1) {
      selectedReaders.splice(found, 1);
    } else {
      selectedReaders.push(reader);
    }
    this.set({
      selectedReaders: selectedReaders
    });
  },
  selectOperation(operation) {
    this.set({
      selectedOperation: operation
    });
  },
  setSubmitting() {
    this.set({
      submitting: true
    });
    const { selectedReaders, selectedOperation } = this.get();
    const {
      jobs: { ...params }
    } = postEndpoints;
    params.payload = {
      operation: selectedOperation,
      readers: selectedReaders.map(reader => reader.name)
    };

    apiCall(params).then(result => {
      this.set({
        selectedReaders: [],
        selectedOperation: null,
        submitting: false,
        success: true
      });
      setTimeout(() => this.set({ success: false }), 2000);
    });
  }
};

function oncreate() {
  this.store.on("state", ({ current: { readers, health, operations } }) => {
    this.set({
      readers: readers,
      health: health,
      operations: operations
    });
  });
}
const file$1 = "src/components/views/CardBody.html";

function click_handler_1(event) {
  const { component, ctx } = this._svelte;

  component.selectOperation(ctx.operation);
}

function get_each1_context(ctx, list, i) {
  const child_ctx = Object.create(ctx);
  child_ctx.operation = list[i];
  return child_ctx;
}

function click_handler(event) {
  const { component, ctx } = this._svelte;

  component.selectReader(ctx.reader);
}

function get_each0_context(ctx, list, i) {
  const child_ctx = Object.create(ctx);
  child_ctx.reader = list[i];
  return child_ctx;
}

function create_main_fragment$1(component, ctx) {
  var div5,
    div1,
    h30,
    text1,
    div0,
    text2,
    div4,
    h31,
    text4,
    div2,
    text5,
    div3,
    button,
    text6,
    button_disabled_value,
    text7,
    text8,
    text9,
    text10;

  var each0_value = ctx.readerList;

  var each0_blocks = [];

  for (var i = 0; i < each0_value.length; i += 1) {
    each0_blocks[i] = create_each_block_1(
      component,
      get_each0_context(ctx, each0_value, i)
    );
  }

  var each0_else = null;

  if (!each0_value.length) {
    each0_else = create_else_block_1(component, ctx);
    each0_else.c();
  }

  var each1_value = ctx.operations;

  var each1_blocks = [];

  for (var i = 0; i < each1_value.length; i += 1) {
    each1_blocks[i] = create_each_block(
      component,
      get_each1_context(ctx, each1_value, i)
    );
  }

  var each1_else = null;

  if (!each1_value.length) {
    each1_else = create_else_block(component, ctx);
    each1_else.c();
  }

  function click_handler_2(event) {
    component.setSubmitting();
  }

  var if_block0 = ctx.errorStatusSelected && create_if_block_3(component, ctx);

  var if_block1 =
    ctx.warningStatusSelected &&
    !ctx.submitting &&
    create_if_block_2(component, ctx);

  var if_block2 = ctx.submitting && create_if_block_1(component, ctx);

  var if_block3 = ctx.success && create_if_block(component, ctx);

  return {
    c: function create() {
      div5 = createElement("div");
      div1 = createElement("div");
      h30 = createElement("h3");
      h30.textContent = "Available Readers";
      text1 = createText("\n    ");
      div0 = createElement("div");

      for (var i = 0; i < each0_blocks.length; i += 1) {
        each0_blocks[i].c();
      }

      text2 = createText("\n  ");
      div4 = createElement("div");
      h31 = createElement("h3");
      h31.textContent = "Available Operations";
      text4 = createText("\n    ");
      div2 = createElement("div");

      for (var i = 0; i < each1_blocks.length; i += 1) {
        each1_blocks[i].c();
      }

      text5 = createText("\n    ");
      div3 = createElement("div");
      button = createElement("button");
      text6 = createText("Start Job");
      text7 = createText("\n      ");
      if (if_block0) if_block0.c();
      text8 = createText("\n      ");
      if (if_block1) if_block1.c();
      text9 = createText("\n    ");
      if (if_block2) if_block2.c();
      text10 = createText("\n    ");
      if (if_block3) if_block3.c();
      addLoc(h30, file$1, 2, 4, 131);
      div0.className = "list-group list-group-flush";
      addLoc(div0, file$1, 3, 4, 162);
      div1.className = "col-6 text-center card-content__data";
      addLoc(div1, file$1, 1, 2, 76);
      addLoc(h31, file$1, 14, 4, 728);
      div2.className = "list-group list-group-flush";
      addLoc(div2, file$1, 15, 4, 762);
      addListener(button, "click", click_handler_2);
      button.type = "button";
      button.className = "btn btn-primary";
      button.disabled = button_disabled_value =
        ctx.errorStatusSelected || !ctx.selectedOperation || ctx.submitting;
      addLoc(button, file$1, 25, 6, 1265);
      div3.className = "col-12 p-3";
      addLoc(div3, file$1, 24, 4, 1234);
      div4.className = "col-6 text-center card-content__actions";
      addLoc(div4, file$1, 13, 2, 670);
      div5.className =
        "card-body col-12 d-flex justify-content-center card-content";
      addLoc(div5, file$1, 0, 0, 0);
    },

    m: function mount(target, anchor) {
      insert(target, div5, anchor);
      append(div5, div1);
      append(div1, h30);
      append(div1, text1);
      append(div1, div0);

      for (var i = 0; i < each0_blocks.length; i += 1) {
        each0_blocks[i].m(div0, null);
      }

      if (each0_else) {
        each0_else.m(div0, null);
      }

      append(div5, text2);
      append(div5, div4);
      append(div4, h31);
      append(div4, text4);
      append(div4, div2);

      for (var i = 0; i < each1_blocks.length; i += 1) {
        each1_blocks[i].m(div2, null);
      }

      if (each1_else) {
        each1_else.m(div2, null);
      }

      append(div4, text5);
      append(div4, div3);
      append(div3, button);
      append(button, text6);
      append(div3, text7);
      if (if_block0) if_block0.m(div3, null);
      append(div3, text8);
      if (if_block1) if_block1.m(div3, null);
      append(div3, text9);
      if (if_block2) if_block2.m(div3, null);
      append(div3, text10);
      if (if_block3) if_block3.m(div3, null);
    },

    p: function update(changed, ctx) {
      if (changed.selectedReaders || changed.readerList) {
        each0_value = ctx.readerList;

        for (var i = 0; i < each0_value.length; i += 1) {
          const child_ctx = get_each0_context(ctx, each0_value, i);

          if (each0_blocks[i]) {
            each0_blocks[i].p(changed, child_ctx);
          } else {
            each0_blocks[i] = create_each_block_1(component, child_ctx);
            each0_blocks[i].c();
            each0_blocks[i].m(div0, null);
          }
        }

        for (; i < each0_blocks.length; i += 1) {
          each0_blocks[i].d(1);
        }
        each0_blocks.length = each0_value.length;
      }

      if (each0_value.length) {
        if (each0_else) {
          each0_else.d(1);
          each0_else = null;
        }
      } else if (!each0_else) {
        each0_else = create_else_block_1(component, ctx);
        each0_else.c();
        each0_else.m(div0, null);
      }

      if (
        changed.errorStatusSelected ||
        changed.selectedOperation ||
        changed.operations
      ) {
        each1_value = ctx.operations;

        for (var i = 0; i < each1_value.length; i += 1) {
          const child_ctx = get_each1_context(ctx, each1_value, i);

          if (each1_blocks[i]) {
            each1_blocks[i].p(changed, child_ctx);
          } else {
            each1_blocks[i] = create_each_block(component, child_ctx);
            each1_blocks[i].c();
            each1_blocks[i].m(div2, null);
          }
        }

        for (; i < each1_blocks.length; i += 1) {
          each1_blocks[i].d(1);
        }
        each1_blocks.length = each1_value.length;
      }

      if (each1_value.length) {
        if (each1_else) {
          each1_else.d(1);
          each1_else = null;
        }
      } else if (!each1_else) {
        each1_else = create_else_block(component, ctx);
        each1_else.c();
        each1_else.m(div2, null);
      }

      if (
        (changed.errorStatusSelected ||
          changed.selectedOperation ||
          changed.submitting) &&
        button_disabled_value !==
          (button_disabled_value =
            ctx.errorStatusSelected || !ctx.selectedOperation || ctx.submitting)
      ) {
        button.disabled = button_disabled_value;
      }

      if (ctx.errorStatusSelected) {
        if (!if_block0) {
          if_block0 = create_if_block_3(component, ctx);
          if_block0.c();
          if_block0.m(div3, text8);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }

      if (ctx.warningStatusSelected && !ctx.submitting) {
        if (!if_block1) {
          if_block1 = create_if_block_2(component, ctx);
          if_block1.c();
          if_block1.m(div3, text9);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }

      if (ctx.submitting) {
        if (!if_block2) {
          if_block2 = create_if_block_1(component, ctx);
          if_block2.c();
          if_block2.m(div3, text10);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }

      if (ctx.success) {
        if (!if_block3) {
          if_block3 = create_if_block(component, ctx);
          if_block3.c();
          if_block3.m(div3, null);
        }
      } else if (if_block3) {
        if_block3.d(1);
        if_block3 = null;
      }
    },

    d: function destroy(detach) {
      if (detach) {
        detachNode(div5);
      }

      destroyEach(each0_blocks, detach);

      if (each0_else) each0_else.d();

      destroyEach(each1_blocks, detach);

      if (each1_else) each1_else.d();

      removeListener(button, "click", click_handler_2);
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d();
      if (if_block2) if_block2.d();
      if (if_block3) if_block3.d();
    }
  };
}

// (9:6) {:else}
function create_else_block_1(component, ctx) {
  var li;

  return {
    c: function create() {
      li = createElement("li");
      li.textContent = "No readers found";
      li.className = "list-group-item";
      addLoc(li, file$1, 9, 8, 582);
    },

    m: function mount(target, anchor) {
      insert(target, li, anchor);
    },

    d: function destroy(detach) {
      if (detach) {
        detachNode(li);
      }
    }
  };
}

// (5:6) {#each readerList as reader}
function create_each_block_1(component, ctx) {
  var a,
    strong0,
    text1,
    text2_value = ctx.reader.name,
    text2,
    text3,
    strong1,
    text5,
    text6_value = ctx.reader.status,
    text6;

  return {
    c: function create() {
      a = createElement("a");
      strong0 = createElement("strong");
      strong0.textContent = "Reader:";
      text1 = createText(" ");
      text2 = createText(text2_value);
      text3 = createText(" - ");
      strong1 = createElement("strong");
      strong1.textContent = "Status:";
      text5 = createText(" ");
      text6 = createText(text6_value);
      addLoc(strong0, file$1, 6, 10, 465);
      addLoc(strong1, file$1, 6, 51, 506);

      a._svelte = { component, ctx };

      addListener(a, "click", click_handler);
      a.href = "#";
      a.className = "list-group-item list-group-item-action text-center";
      toggleClass(
        a,
        "active",
        ctx.selectedReaders.length &&
          ctx.selectedReaders.filter(ind => ind.name === ctx.reader.name).length
      );
      addLoc(a, file$1, 5, 8, 247);
    },

    m: function mount(target, anchor) {
      insert(target, a, anchor);
      append(a, strong0);
      append(a, text1);
      append(a, text2);
      append(a, text3);
      append(a, strong1);
      append(a, text5);
      append(a, text6);
    },

    p: function update(changed, _ctx) {
      ctx = _ctx;
      if (
        changed.readerList &&
        text2_value !== (text2_value = ctx.reader.name)
      ) {
        setData(text2, text2_value);
      }

      if (
        changed.readerList &&
        text6_value !== (text6_value = ctx.reader.status)
      ) {
        setData(text6, text6_value);
      }

      a._svelte.ctx = ctx;
      if (changed.selectedReaders || changed.readerList) {
        toggleClass(
          a,
          "active",
          ctx.selectedReaders.length &&
            ctx.selectedReaders.filter(ind => ind.name === ctx.reader.name)
              .length
        );
      }
    },

    d: function destroy(detach) {
      if (detach) {
        detachNode(a);
      }

      removeListener(a, "click", click_handler);
    }
  };
}

// (21:6) {:else}
function create_else_block(component, ctx) {
  var li;

  return {
    c: function create() {
      li = createElement("li");
      li.textContent = "No operations available";
      li.className = "list-group-item";
      addLoc(li, file$1, 21, 8, 1148);
    },

    m: function mount(target, anchor) {
      insert(target, li, anchor);
    },

    d: function destroy(detach) {
      if (detach) {
        detachNode(li);
      }
    }
  };
}

// (17:6) {#each operations as operation}
function create_each_block(component, ctx) {
  var button,
    strong,
    text_value = ctx.operation,
    text;

  return {
    c: function create() {
      button = createElement("button");
      strong = createElement("strong");
      text = createText(text_value);
      addLoc(strong, file$1, 18, 10, 1079);

      button._svelte = { component, ctx };

      addListener(button, "click", click_handler_1);
      button.type = "button";
      button.className = "list-group-item list-group-item-action text-center";
      button.disabled = ctx.errorStatusSelected;
      toggleClass(
        button,
        "active",
        ctx.selectedOperation && ctx.selectedOperation === ctx.operation
      );
      addLoc(button, file$1, 17, 8, 850);
    },

    m: function mount(target, anchor) {
      insert(target, button, anchor);
      append(button, strong);
      append(strong, text);
    },

    p: function update(changed, _ctx) {
      ctx = _ctx;
      if (changed.operations && text_value !== (text_value = ctx.operation)) {
        setData(text, text_value);
      }

      button._svelte.ctx = ctx;
      if (changed.errorStatusSelected) {
        button.disabled = ctx.errorStatusSelected;
      }

      if (changed.selectedOperation || changed.operations) {
        toggleClass(
          button,
          "active",
          ctx.selectedOperation && ctx.selectedOperation === ctx.operation
        );
      }
    },

    d: function destroy(detach) {
      if (detach) {
        detachNode(button);
      }

      removeListener(button, "click", click_handler_1);
    }
  };
}

// (27:6) {#if errorStatusSelected}
function create_if_block_3(component, ctx) {
  var div;

  return {
    c: function create() {
      div = createElement("div");
      div.textContent = "Cannot start job with a reader in 'Error' status";
      div.className = "alert alert-danger m-3";
      setAttribute(div, "role", "alert");
      addLoc(div, file$1, 27, 6, 1462);
    },

    m: function mount(target, anchor) {
      insert(target, div, anchor);
    },

    d: function destroy(detach) {
      if (detach) {
        detachNode(div);
      }
    }
  };
}

// (32:6) {#if warningStatusSelected && !submitting}
function create_if_block_2(component, ctx) {
  var div;

  return {
    c: function create() {
      div = createElement("div");
      div.textContent = "A selected reader may have limited connectivity";
      div.className = "alert alert-warning m-3";
      setAttribute(div, "role", "alert");
      addLoc(div, file$1, 32, 6, 1647);
    },

    m: function mount(target, anchor) {
      insert(target, div, anchor);
    },

    d: function destroy(detach) {
      if (detach) {
        detachNode(div);
      }
    }
  };
}

// (37:4) {#if submitting}
function create_if_block_1(component, ctx) {
  var div;

  return {
    c: function create() {
      div = createElement("div");
      div.textContent = "Job Submitted";
      div.className = "alert alert-info m-3";
      setAttribute(div, "role", "alert");
      addLoc(div, file$1, 37, 6, 1804);
    },

    m: function mount(target, anchor) {
      insert(target, div, anchor);
    },

    d: function destroy(detach) {
      if (detach) {
        detachNode(div);
      }
    }
  };
}

// (42:4) {#if success}
function create_if_block(component, ctx) {
  var div;

  return {
    c: function create() {
      div = createElement("div");
      div.textContent = "Job started successfully!";
      div.className = "alert alert-success m-3";
      setAttribute(div, "role", "alert");
      addLoc(div, file$1, 42, 6, 1921);
    },

    m: function mount(target, anchor) {
      insert(target, div, anchor);
    },

    d: function destroy(detach) {
      if (detach) {
        detachNode(div);
      }
    }
  };
}

function CardBody(options) {
  this._debugName = "<CardBody>";
  if (!options || (!options.target && !options.root)) {
    throw new Error("'target' is a required option");
  }

  init(this, options);
  this._state = assign(data(), options.data);

  this._recompute({ readers: 1, health: 1, selectedReaders: 1 }, this._state);
  if (!("readers" in this._state))
    console.warn(
      "<CardBody> was created without expected data property 'readers'"
    );
  if (!("health" in this._state))
    console.warn(
      "<CardBody> was created without expected data property 'health'"
    );
  if (!("selectedReaders" in this._state))
    console.warn(
      "<CardBody> was created without expected data property 'selectedReaders'"
    );

  if (!("operations" in this._state))
    console.warn(
      "<CardBody> was created without expected data property 'operations'"
    );
  if (!("selectedOperation" in this._state))
    console.warn(
      "<CardBody> was created without expected data property 'selectedOperation'"
    );

  if (!("submitting" in this._state))
    console.warn(
      "<CardBody> was created without expected data property 'submitting'"
    );

  if (!("success" in this._state))
    console.warn(
      "<CardBody> was created without expected data property 'success'"
    );
  this._intro = true;

  this._fragment = create_main_fragment$1(this, this._state);

  this.root._oncreate.push(() => {
    oncreate.call(this);
    this.fire("update", {
      changed: assignTrue({}, this._state),
      current: this._state
    });
  });

  if (options.target) {
    if (options.hydrate)
      throw new Error(
        "options.hydrate only works if the component was compiled with the `hydratable: true` option"
      );
    this._fragment.c();
    this._mount(options.target, options.anchor);

    flush(this);
  }
}

assign(CardBody.prototype, protoDev);
assign(CardBody.prototype, methods);

CardBody.prototype._checkReadOnly = function _checkReadOnly(newState) {
  if ("readerList" in newState && !this._updatingReadonlyProperty)
    throw new Error("<CardBody>: Cannot set read-only property 'readerList'");
  if ("errorStatusSelected" in newState && !this._updatingReadonlyProperty)
    throw new Error(
      "<CardBody>: Cannot set read-only property 'errorStatusSelected'"
    );
  if ("warningStatusSelected" in newState && !this._updatingReadonlyProperty)
    throw new Error(
      "<CardBody>: Cannot set read-only property 'warningStatusSelected'"
    );
};

CardBody.prototype._recompute = function _recompute(changed, state) {
  if (changed.readers || changed.health) {
    if (this._differs(state.readerList, (state.readerList = readerList(state))))
      changed.readerList = true;
  }

  if (changed.selectedReaders) {
    if (
      this._differs(
        state.errorStatusSelected,
        (state.errorStatusSelected = errorStatusSelected(state))
      )
    )
      changed.errorStatusSelected = true;
    if (
      this._differs(
        state.warningStatusSelected,
        (state.warningStatusSelected = warningStatusSelected(state))
      )
    )
      changed.warningStatusSelected = true;
  }
};

/* src/App.html generated by Svelte v2.16.1 */

const file$2 = "src/App.html";

function create_main_fragment$2(component, ctx) {
  var main, section, div, text;

  var cardheader = new CardHeader({
    root: component.root,
    store: component.store
  });

  var cardbody = new CardBody({
    root: component.root,
    store: component.store
  });

  return {
    c: function create() {
      main = createElement("main");
      section = createElement("section");
      div = createElement("div");
      cardheader._fragment.c();
      text = createText("\n      ");
      cardbody._fragment.c();
      div.className = "card col-8 microsense-ui__card";
      addLoc(div, file$2, 2, 4, 101);
      section.className = "d-flex justify-content-center";
      addLoc(section, file$2, 1, 2, 49);
      main.className = "microsense-ui__container col-12";
      addLoc(main, file$2, 0, 0, 0);
    },

    m: function mount(target, anchor) {
      insert(target, main, anchor);
      append(main, section);
      append(section, div);
      cardheader._mount(div, null);
      append(div, text);
      cardbody._mount(div, null);
    },

    p: noop,

    d: function destroy(detach) {
      if (detach) {
        detachNode(main);
      }

      cardheader.destroy();
      cardbody.destroy();
    }
  };
}

function App(options) {
  this._debugName = "<App>";
  if (!options || (!options.target && !options.root)) {
    throw new Error("'target' is a required option");
  }

  init(this, options);
  this._state = assign({}, options.data);
  this._intro = true;

  this._fragment = create_main_fragment$2(this, this._state);

  if (options.target) {
    if (options.hydrate)
      throw new Error(
        "options.hydrate only works if the component was compiled with the `hydratable: true` option"
      );
    this._fragment.c();
    this._mount(options.target, options.anchor);

    flush(this);
  }
}

assign(App.prototype, protoDev);

App.prototype._checkReadOnly = function _checkReadOnly(newState) {};

function Store(state, options) {
  this._handlers = {};
  this._dependents = [];

  this._computed = blankObject();
  this._sortedComputedProperties = [];

  this._state = assign({}, state);
  this._differs = options && options.immutable ? _differsImmutable : _differs;
}

assign(Store.prototype, {
  _add(component, props) {
    this._dependents.push({
      component: component,
      props: props
    });
  },

  _init(props) {
    const state = {};
    for (let i = 0; i < props.length; i += 1) {
      const prop = props[i];
      state["$" + prop] = this._state[prop];
    }
    return state;
  },

  _remove(component) {
    let i = this._dependents.length;
    while (i--) {
      if (this._dependents[i].component === component) {
        this._dependents.splice(i, 1);
        return;
      }
    }
  },

  _set(newState, changed) {
    const previous = this._state;
    this._state = assign(assign({}, previous), newState);

    for (let i = 0; i < this._sortedComputedProperties.length; i += 1) {
      this._sortedComputedProperties[i].update(this._state, changed);
    }

    this.fire("state", {
      changed,
      previous,
      current: this._state
    });

    this._dependents
      .filter(dependent => {
        const componentState = {};
        let dirty = false;

        for (let j = 0; j < dependent.props.length; j += 1) {
          const prop = dependent.props[j];
          if (prop in changed) {
            componentState["$" + prop] = this._state[prop];
            dirty = true;
          }
        }

        if (dirty) {
          dependent.component._stage(componentState);
          return true;
        }
      })
      .forEach(dependent => {
        dependent.component.set({});
      });

    this.fire("update", {
      changed,
      previous,
      current: this._state
    });
  },

  _sortComputedProperties() {
    const computed = this._computed;
    const sorted = (this._sortedComputedProperties = []);
    const visited = blankObject();
    let currentKey;

    function visit(key) {
      const c = computed[key];

      if (c) {
        c.deps.forEach(dep => {
          if (dep === currentKey) {
            throw new Error(
              `Cyclical dependency detected between ${dep} <-> ${key}`
            );
          }

          visit(dep);
        });

        if (!visited[key]) {
          visited[key] = true;
          sorted.push(c);
        }
      }
    }

    for (const key in this._computed) {
      visit((currentKey = key));
    }
  },

  compute(key, deps, fn) {
    let value;

    const c = {
      deps,
      update: (state, changed, dirty) => {
        const values = deps.map(dep => {
          if (dep in changed) dirty = true;
          return state[dep];
        });

        if (dirty) {
          const newValue = fn.apply(null, values);
          if (this._differs(newValue, value)) {
            value = newValue;
            changed[key] = true;
            state[key] = value;
          }
        }
      }
    };

    this._computed[key] = c;
    this._sortComputedProperties();

    const state = assign({}, this._state);
    const changed = {};
    c.update(state, changed, true);
    this._set(state, changed);
  },

  fire,

  get,

  on,

  set(newState) {
    const oldState = this._state;
    const changed = (this._changed = {});
    let dirty = false;

    for (const key in newState) {
      if (this._computed[key])
        throw new Error(`'${key}' is a read-only computed property`);
      if (this._differs(newState[key], oldState[key]))
        changed[key] = dirty = true;
    }
    if (!dirty) return;

    this._set(newState, changed);
  }
});

// Svelte includes a lightweight state management implementation

const store = new Store();

(async function getInitialState() {
  try {
    const [readers, health, operations] = await Promise.all(
      Object.keys(getEndpoints).map(endpoint => apiCall(getEndpoints[endpoint]))
    );
    store.set({
      readers: readers,
      health: health,
      operations: operations
    });
  } catch (err) {
    console.error(`Error getting data from server: ${err}`);
  }
})();

// bootstrap the client application

const app = new App({
  target: document.querySelector("#microsense-ui__wrapper"),
  store
});

export default app;
//# sourceMappingURL=bundle.es.js.map
