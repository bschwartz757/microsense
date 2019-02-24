var app = (function () {
  'use strict';

  // Fetch api key for openweathermap.com at app start time
  var fetchKey = function () {
    return fetch("/get-key")
      .then(function (res) { return res.json(); })
      .then(function (result) {
        window.apiKey = result.key;
      })
      .catch(function (err) {
        console.error(("Error fetching key: " + err));
      });
  };

  function noop() {}

  function assign(tar, src) {
  	for (var k in src) tar[k] = src[k];
  	return tar;
  }

  function appendNode(node, target) {
  	target.appendChild(node);
  }

  function insertNode(node, target, anchor) {
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

  function createComment() {
  	return document.createComment('');
  }

  function addListener(node, event, handler) {
  	node.addEventListener(event, handler, false);
  }

  function removeListener(node, event, handler) {
  	node.removeEventListener(event, handler, false);
  }

  function setAttribute(node, attribute, value) {
  	node.setAttribute(attribute, value);
  }

  function linear(t) {
  	return t;
  }

  function generateRule({ a, b, delta, duration }, ease, fn) {
  	const step = 16.666 / duration;
  	let keyframes = '{\n';

  	for (let p = 0; p <= 1; p += step) {
  		const t = a + delta * ease(p);
  		keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
  	}

  	return keyframes + `100% {${fn(b, 1 - b)}}\n}`;
  }

  // https://github.com/darkskyapp/string-hash/blob/master/index.js
  function hash(str) {
  	let hash = 5381;
  	let i = str.length;

  	while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
  	return hash >>> 0;
  }

  function wrapTransition(component, node, fn, params, intro) {
  	let obj = fn(node, params);
  	let duration;
  	let ease;
  	let cssText;

  	let initialised = false;

  	return {
  		t: intro ? 0 : 1,
  		running: false,
  		program: null,
  		pending: null,

  		run(b, callback) {
  			if (typeof obj === 'function') {
  				transitionManager.wait().then(() => {
  					obj = obj();
  					this._run(b, callback);
  				});
  			} else {
  				this._run(b, callback);
  			}
  		},

  		_run(b, callback) {
  			duration = obj.duration || 300;
  			ease = obj.easing || linear;

  			const program = {
  				start: window.performance.now() + (obj.delay || 0),
  				b,
  				callback: callback || noop
  			};

  			if (intro && !initialised) {
  				if (obj.css && obj.delay) {
  					cssText = node.style.cssText;
  					node.style.cssText += obj.css(0, 1);
  				}

  				if (obj.tick) obj.tick(0, 1);
  				initialised = true;
  			}

  			if (!b) {
  				program.group = transitionManager.outros;
  				transitionManager.outros.remaining += 1;
  			}

  			if (obj.delay) {
  				this.pending = program;
  			} else {
  				this.start(program);
  			}

  			if (!this.running) {
  				this.running = true;
  				transitionManager.add(this);
  			}
  		},

  		start(program) {
  			component.fire(`${program.b ? 'intro' : 'outro'}.start`, { node });

  			program.a = this.t;
  			program.delta = program.b - program.a;
  			program.duration = duration * Math.abs(program.b - program.a);
  			program.end = program.start + program.duration;

  			if (obj.css) {
  				if (obj.delay) node.style.cssText = cssText;

  				const rule = generateRule(program, ease, obj.css);
  				transitionManager.addRule(rule, program.name = '__svelte_' + hash(rule));

  				node.style.animation = (node.style.animation || '')
  					.split(', ')
  					.filter(anim => anim && (program.delta < 0 || !/__svelte/.test(anim)))
  					.concat(`${program.name} ${program.duration}ms linear 1 forwards`)
  					.join(', ');
  			}

  			this.program = program;
  			this.pending = null;
  		},

  		update(now) {
  			const program = this.program;
  			if (!program) return;

  			const p = now - program.start;
  			this.t = program.a + program.delta * ease(p / program.duration);
  			if (obj.tick) obj.tick(this.t, 1 - this.t);
  		},

  		done() {
  			const program = this.program;
  			this.t = program.b;

  			if (obj.tick) obj.tick(this.t, 1 - this.t);

  			component.fire(`${program.b ? 'intro' : 'outro'}.end`, { node });

  			if (!program.b && !program.invalidated) {
  				program.group.callbacks.push(() => {
  					program.callback();
  					if (obj.css) transitionManager.deleteRule(node, program.name);
  				});

  				if (--program.group.remaining === 0) {
  					program.group.callbacks.forEach(fn => {
  						fn();
  					});
  				}
  			} else {
  				if (obj.css) transitionManager.deleteRule(node, program.name);
  			}

  			this.running = !!this.pending;
  		},

  		abort() {
  			if (this.program) {
  				if (obj.tick) obj.tick(1, 0);
  				if (obj.css) transitionManager.deleteRule(node, this.program.name);
  				this.program = this.pending = null;
  				this.running = false;
  			}
  		},

  		invalidate() {
  			if (this.program) {
  				this.program.invalidated = true;
  			}
  		}
  	};
  }

  var transitionManager = {
  	running: false,
  	transitions: [],
  	bound: null,
  	stylesheet: null,
  	activeRules: {},
  	promise: null,

  	add(transition) {
  		this.transitions.push(transition);

  		if (!this.running) {
  			this.running = true;
  			requestAnimationFrame(this.bound || (this.bound = this.next.bind(this)));
  		}
  	},

  	addRule(rule, name) {
  		if (!this.stylesheet) {
  			const style = createElement('style');
  			document.head.appendChild(style);
  			transitionManager.stylesheet = style.sheet;
  		}

  		if (!this.activeRules[name]) {
  			this.activeRules[name] = true;
  			this.stylesheet.insertRule(`@keyframes ${name} ${rule}`, this.stylesheet.cssRules.length);
  		}
  	},

  	next() {
  		this.running = false;

  		const now = window.performance.now();
  		let i = this.transitions.length;

  		while (i--) {
  			const transition = this.transitions[i];

  			if (transition.program && now >= transition.program.end) {
  				transition.done();
  			}

  			if (transition.pending && now >= transition.pending.start) {
  				transition.start(transition.pending);
  			}

  			if (transition.running) {
  				transition.update(now);
  				this.running = true;
  			} else if (!transition.pending) {
  				this.transitions.splice(i, 1);
  			}
  		}

  		if (this.running) {
  			requestAnimationFrame(this.bound);
  		} else if (this.stylesheet) {
  			let i = this.stylesheet.cssRules.length;
  			while (i--) this.stylesheet.deleteRule(i);
  			this.activeRules = {};
  		}
  	},

  	deleteRule(node, name) {
  		node.style.animation = node.style.animation
  			.split(', ')
  			.filter(anim => anim && anim.indexOf(name) === -1)
  			.join(', ');
  	},

  	groupOutros() {
  		this.outros = {
  			remaining: 0,
  			callbacks: []
  		};
  	},

  	wait() {
  		if (!transitionManager.promise) {
  			transitionManager.promise = Promise.resolve();
  			transitionManager.promise.then(() => {
  				transitionManager.promise = null;
  			});
  		}

  		return transitionManager.promise;
  	}
  };

  function blankObject() {
  	return Object.create(null);
  }

  function destroy(detach) {
  	this.destroy = noop;
  	this.fire('destroy');
  	this.set = noop;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function _differs(a, b) {
  	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
  }

  function fire(eventName, data) {
  	var handlers =
  		eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			handler.__calling = true;
  			handler.call(this, data);
  			handler.__calling = false;
  		}
  	}
  }

  function get() {
  	return this._state;
  }

  function init(component, options) {
  	component._handlers = blankObject();
  	component._bind = options._bind;

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;
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
  	this.root._lock = true;
  	callAll(this.root._beforecreate);
  	callAll(this.root._oncreate);
  	callAll(this.root._aftercreate);
  	this.root._lock = false;
  }

  function _set(newState) {
  	var oldState = this._state,
  		changed = {},
  		dirty = false;

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign(assign({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function callAll(fns) {
  	while (fns && fns.length) fns.shift()();
  }

  function _mount(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var proto = {
  	destroy,
  	get,
  	fire,
  	on,
  	set,
  	_recompute: noop,
  	_set,
  	_mount,
  	_differs
  };

  var kelvinToFahrenheit = function (val) {
    return parseInt((val - 273.15) * 1.8 + 32);
  };

  var kelvinToCelsius = function (val) {
    return parseInt(val - 273.15);
  };

  var getFiveDayForecast = function (input) {
    if ( input === void 0 ) input = { city: "" };

    return fetch(("http://api.openweathermap.org/data/2.5/forecast?q=" + (input.city) + "&appid=" + (window.apiKey) + "\n  "))
      .then(function (response) { return response.json(); })
      .then(function (results) {
        var forecastArr = results.list.filter(function (idx) {
          // selects the 2 o'clock pm forecast
          return new Date(idx.dt * 1000).getHours() === 14;
        });
        var weatherArr = forecastArr.map(function (obj) {
          var dt = obj.dt;
          var main = obj.main;
          var weather = obj.weather;
          return {
            date: new Date(dt * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric"
            }),
            temp: {
              f: kelvinToFahrenheit(main.temp),
              c: kelvinToCelsius(main.temp)
            },
            humidity: main.humidity,
            conditions: {
              description: weather[0].description,
              icon: weather[0].icon
            }
          };
        });
        return weatherArr;
      })
      .catch(function (err) {
        throw new Error(err);
      });
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
    if (typeof window !== 'undefined') _WINDOW = window;
    if (typeof document !== 'undefined') _DOCUMENT = document;
    if (typeof MutationObserver !== 'undefined') _MUTATION_OBSERVER$1 = MutationObserver;
    if (typeof performance !== 'undefined') _PERFORMANCE = performance;
  } catch (e) {}

  var _ref = _WINDOW.navigator || {};
  var _ref$userAgent = _ref.userAgent;
  var userAgent = _ref$userAgent === undefined ? '' : _ref$userAgent;

  var WINDOW = _WINDOW;
  var DOCUMENT = _DOCUMENT;
  var MUTATION_OBSERVER = _MUTATION_OBSERVER$1;
  var PERFORMANCE = _PERFORMANCE;
  var IS_BROWSER = !!WINDOW.document;
  var IS_DOM = !!DOCUMENT.documentElement && !!DOCUMENT.head && typeof DOCUMENT.addEventListener === 'function' && typeof DOCUMENT.createElement === 'function';
  var IS_IE = ~userAgent.indexOf('MSIE') || ~userAgent.indexOf('Trident/');

  var NAMESPACE_IDENTIFIER = '___FONT_AWESOME___';
  var UNITS_IN_GRID = 16;
  var DEFAULT_FAMILY_PREFIX = 'fa';
  var DEFAULT_REPLACEMENT_CLASS = 'svg-inline--fa';
  var DATA_FA_I2SVG = 'data-fa-i2svg';
  var DATA_FA_PSEUDO_ELEMENT = 'data-fa-pseudo-element';
  var HTML_CLASS_I2SVG_BASE_CLASS = 'fontawesome-i2svg';

  var PRODUCTION = function () {
    try {
      return process.env.NODE_ENV === 'production';
    } catch (e) {
      return false;
    }
  }();

  var oneToTen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  var oneToTwenty = oneToTen.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);

  var ATTRIBUTES_WATCHED_FOR_MUTATION = ['class', 'data-prefix', 'data-icon', 'data-fa-transform', 'data-fa-mask'];

  var RESERVED_CLASSES = ['xs', 'sm', 'lg', 'fw', 'ul', 'li', 'border', 'pull-left', 'pull-right', 'spin', 'pulse', 'rotate-90', 'rotate-180', 'rotate-270', 'flip-horizontal', 'flip-vertical', 'stack', 'stack-1x', 'stack-2x', 'inverse', 'layers', 'layers-text', 'layers-counter'].concat(oneToTen.map(function (n) {
    return n + 'x';
  })).concat(oneToTwenty.map(function (n) {
    return 'w-' + n;
  }));

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();



  var _extends = Object.assign || function (target) {
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



  var toConsumableArray = function (arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    } else {
      return Array.from(arr);
    }
  };

  var initial = WINDOW.FontAwesomeConfig || {};
  var initialKeys = Object.keys(initial);

  var _default = _extends({
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
  }, initial);

  if (!_default.autoReplaceSvg) _default.observeMutations = false;

  var config$1 = _extends({}, _default);

  WINDOW.FontAwesomeConfig = config$1;

  function update(newConfig) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _params$asNewDefault = params.asNewDefault,
        asNewDefault = _params$asNewDefault === undefined ? false : _params$asNewDefault;

    var validKeys = Object.keys(config$1);
    var ok = asNewDefault ? function (k) {
      return ~validKeys.indexOf(k) && !~initialKeys.indexOf(k);
    } : function (k) {
      return ~validKeys.indexOf(k);
    };

    Object.keys(newConfig).forEach(function (configKey) {
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
    DOCUMENT.removeEventListener('DOMContentLoaded', listener);
    loaded = 1;
    functions.map(function (fn) {
      return fn();
    });
  };

  var loaded = false;

  if (IS_DOM) {
    loaded = (DOCUMENT.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(DOCUMENT.readyState);

    if (!loaded) DOCUMENT.addEventListener('DOMContentLoaded', listener);
  }

  var domready = function (fn) {
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

    var style = DOCUMENT.createElement('style');
    style.setAttribute('type', 'text/css');
    style.innerHTML = css;

    var headChildren = DOCUMENT.head.childNodes;
    var beforeChild = null;

    for (var i = headChildren.length - 1; i > -1; i--) {
      var child = headChildren[i];
      var tagName = (child.tagName || '').toUpperCase();
      if (['STYLE', 'LINK'].indexOf(tagName) > -1) {
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

    for (var i = (obj || []).length >>> 0; i--;) {
      array[i] = obj[i];
    }

    return array;
  }

  function classArray(node) {
    if (node.classList) {
      return toArray(node.classList);
    } else {
      return (node.getAttribute('class') || '').split(' ').filter(function (i) {
        return i;
      });
    }
  }

  function getIconName(familyPrefix, cls) {
    var parts = cls.split('-');
    var prefix = parts[0];
    var iconName = parts.slice(1).join('-');

    if (prefix === familyPrefix && iconName !== '' && !isReserved(iconName)) {
      return iconName;
    } else {
      return null;
    }
  }

  function htmlEscape(str) {
    return ('' + str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function joinAttributes(attributes) {
    return Object.keys(attributes || {}).reduce(function (acc, attributeName) {
      return acc + (attributeName + '="' + htmlEscape(attributes[attributeName]) + '" ');
    }, '').trim();
  }

  function joinStyles(styles) {
    return Object.keys(styles || {}).reduce(function (acc, styleName) {
      return acc + (styleName + ': ' + styles[styleName] + ';');
    }, '');
  }

  function transformIsMeaningful(transform) {
    return transform.size !== meaninglessTransform.size || transform.x !== meaninglessTransform.x || transform.y !== meaninglessTransform.y || transform.rotate !== meaninglessTransform.rotate || transform.flipX || transform.flipY;
  }

  function transformForSvg(_ref) {
    var transform = _ref.transform,
        containerWidth = _ref.containerWidth,
        iconWidth = _ref.iconWidth;

    var outer = {
      transform: 'translate(' + containerWidth / 2 + ' 256)'
    };
    var innerTranslate = 'translate(' + transform.x * 32 + ', ' + transform.y * 32 + ') ';
    var innerScale = 'scale(' + transform.size / 16 * (transform.flipX ? -1 : 1) + ', ' + transform.size / 16 * (transform.flipY ? -1 : 1) + ') ';
    var innerRotate = 'rotate(' + transform.rotate + ' 0 0)';
    var inner = {
      transform: innerTranslate + ' ' + innerScale + ' ' + innerRotate
    };
    var path = {
      transform: 'translate(' + iconWidth / 2 * -1 + ' -256)'
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
        startCentered = _ref2$startCentered === undefined ? false : _ref2$startCentered;

    var val = '';

    if (startCentered && IS_IE) {
      val += 'translate(' + (transform.x / d - width / 2) + 'em, ' + (transform.y / d - height / 2) + 'em) ';
    } else if (startCentered) {
      val += 'translate(calc(-50% + ' + transform.x / d + 'em), calc(-50% + ' + transform.y / d + 'em)) ';
    } else {
      val += 'translate(' + transform.x / d + 'em, ' + transform.y / d + 'em) ';
    }

    val += 'scale(' + transform.size / d * (transform.flipX ? -1 : 1) + ', ' + transform.size / d * (transform.flipY ? -1 : 1) + ') ';
    val += 'rotate(' + transform.rotate + 'deg) ';

    return val;
  }

  var ALL_SPACE = {
    x: 0,
    y: 0,
    width: '100%',
    height: '100%'
  };

  var makeIconMasking = function (_ref) {
    var children = _ref.children,
        attributes = _ref.attributes,
        main = _ref.main,
        mask = _ref.mask,
        transform = _ref.transform;
    var mainWidth = main.width,
        mainPath = main.icon;
    var maskWidth = mask.width,
        maskPath = mask.icon;


    var trans = transformForSvg({ transform: transform, containerWidth: maskWidth, iconWidth: mainWidth });

    var maskRect = {
      tag: 'rect',
      attributes: _extends({}, ALL_SPACE, {
        fill: 'white'
      })
    };
    var maskInnerGroup = {
      tag: 'g',
      attributes: _extends({}, trans.inner),
      children: [{ tag: 'path', attributes: _extends({}, mainPath.attributes, trans.path, { fill: 'black' }) }]
    };
    var maskOuterGroup = {
      tag: 'g',
      attributes: _extends({}, trans.outer),
      children: [maskInnerGroup]
    };
    var maskId = 'mask-' + nextUniqueId();
    var clipId = 'clip-' + nextUniqueId();
    var maskTag = {
      tag: 'mask',
      attributes: _extends({}, ALL_SPACE, {
        id: maskId,
        maskUnits: 'userSpaceOnUse',
        maskContentUnits: 'userSpaceOnUse'
      }),
      children: [maskRect, maskOuterGroup]
    };
    var defs = {
      tag: 'defs',
      children: [{ tag: 'clipPath', attributes: { id: clipId }, children: [maskPath] }, maskTag]
    };

    children.push(defs, { tag: 'rect', attributes: _extends({ fill: 'currentColor', 'clip-path': 'url(#' + clipId + ')', mask: 'url(#' + maskId + ')' }, ALL_SPACE) });

    return {
      children: children,
      attributes: attributes
    };
  };

  var makeIconStandard = function (_ref) {
    var children = _ref.children,
        attributes = _ref.attributes,
        main = _ref.main,
        transform = _ref.transform,
        styles = _ref.styles;

    var styleString = joinStyles(styles);

    if (styleString.length > 0) {
      attributes['style'] = styleString;
    }

    if (transformIsMeaningful(transform)) {
      var trans = transformForSvg({ transform: transform, containerWidth: main.width, iconWidth: main.width });
      children.push({
        tag: 'g',
        attributes: _extends({}, trans.outer),
        children: [{
          tag: 'g',
          attributes: _extends({}, trans.inner),
          children: [{
            tag: main.icon.tag,
            children: main.icon.children,
            attributes: _extends({}, main.icon.attributes, trans.path)
          }]
        }]
      });
    } else {
      children.push(main.icon);
    }

    return {
      children: children,
      attributes: attributes
    };
  };

  var asIcon = function (_ref) {
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
      attributes['style'] = joinStyles(_extends({}, styles, {
        'transform-origin': offset.x + transform.x / 16 + 'em ' + (offset.y + transform.y / 16) + 'em'
      }));
    }

    return [{
      tag: 'svg',
      attributes: attributes,
      children: children
    }];
  };

  var asSymbol = function (_ref) {
    var prefix = _ref.prefix,
        iconName = _ref.iconName,
        children = _ref.children,
        attributes = _ref.attributes,
        symbol = _ref.symbol;

    var id = symbol === true ? prefix + '-' + config$1.familyPrefix + '-' + iconName : symbol;

    return [{
      tag: 'svg',
      attributes: {
        style: 'display: none;'
      },
      children: [{
        tag: 'symbol',
        attributes: _extends({}, attributes, { id: id }),
        children: children
      }]
    }];
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

    var widthClass = 'fa-w-' + Math.ceil(width / height * 16);
    var attrClass = [config$1.replacementClass, iconName ? config$1.familyPrefix + '-' + iconName : '', widthClass].concat(extra.classes).join(' ');

    var content = {
      children: [],
      attributes: _extends({}, extra.attributes, {
        'data-prefix': prefix,
        'data-icon': iconName,
        'class': attrClass,
        'role': 'img',
        'xmlns': 'http://www.w3.org/2000/svg',
        'viewBox': '0 0 ' + width + ' ' + height
      })
    };

    if (watchable) {
      content.attributes[DATA_FA_I2SVG] = '';
    }

    if (title) content.children.push({ tag: 'title', attributes: { id: content.attributes['aria-labelledby'] || 'title-' + nextUniqueId() }, children: [title] });

    var args = _extends({}, content, {
      prefix: prefix,
      iconName: iconName,
      main: main,
      mask: mask,
      transform: transform,
      symbol: symbol,
      styles: extra.styles
    });

    var _ref2 = mask.found && main.found ? makeIconMasking(args) : makeIconStandard(args),
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


    var attributes = _extends({}, extra.attributes, title ? { 'title': title } : {}, {
      'class': extra.classes.join(' ')
    });

    if (watchable) {
      attributes[DATA_FA_I2SVG] = '';
    }

    var styles = _extends({}, extra.styles);

    if (transformIsMeaningful(transform)) {
      styles['transform'] = transformForCss({ transform: transform, startCentered: true, width: width, height: height });
      styles['-webkit-transform'] = styles['transform'];
    }

    var styleString = joinStyles(styles);

    if (styleString.length > 0) {
      attributes['style'] = styleString;
    }

    var val = [];

    val.push({
      tag: 'span',
      attributes: attributes,
      children: [content]
    });

    if (title) {
      val.push({ tag: 'span', attributes: { class: 'sr-only' }, children: [title] });
    }

    return val;
  }

  var noop$2 = function noop() {};
  var p = config$1.measurePerformance && PERFORMANCE && PERFORMANCE.mark && PERFORMANCE.measure ? PERFORMANCE : { mark: noop$2, measure: noop$2 };
  var preamble = 'FA "5.0.13"';

  var begin = function begin(name) {
    p.mark(preamble + ' ' + name + ' begins');
    return function () {
      return end(name);
    };
  };

  var end = function end(name) {
    p.mark(preamble + ' ' + name + ' ends');
    p.measure(preamble + ' ' + name, preamble + ' ' + name + ' begins', preamble + ' ' + name + ' ends');
  };

  var perf = { begin: begin, end: end };

  /**
   * Internal helper to bind a function known to have 4 arguments
   * to a given context.
   */
  var bindInternal4 = function bindInternal4 (func, thisContext) {
    return function (a, b, c, d) {
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
  var reduce = function fastReduceObject (subject, fn, initialValue, thisContext) {
    var keys = Object.keys(subject),
        length = keys.length,
        iterator = thisContext !== undefined ? bindInternal4(fn, thisContext) : fn,
        i, key, result;

    if (initialValue === undefined) {
      i = 1;
      result = subject[keys[0]];
    }
    else {
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
      return reduce(styles$2, function (o, style, prefix) {
        o[prefix] = reduce(style, reducer, {});
        return o;
      }, {});
    };

    _byUnicode = lookup(function (acc, icon, iconName) {
      acc[icon[3]] = iconName;

      return acc;
    });

    _byLigature = lookup(function (acc, icon, iconName) {
      var ligatures = icon[2];

      acc[iconName] = iconName;

      ligatures.forEach(function (ligature) {
        acc[ligature] = iconName;
      });

      return acc;
    });

    var hasRegular = 'far' in styles$2;

    _byOldName = reduce(shims, function (acc, shim) {
      var oldName = shim[0];
      var prefix = shim[1];
      var iconName = shim[2];

      if (prefix === 'far' && !hasRegular) {
        prefix = 'fas';
      }

      acc[oldName] = { prefix: prefix, iconName: iconName };

      return acc;
    }, {});
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
    return values.reduce(function (acc, cls) {
      var iconName = getIconName(config$1.familyPrefix, cls);

      if (styles$1[cls]) {
        acc.prefix = cls;
      } else if (iconName) {
        var shim = acc.prefix === 'fa' ? byOldName(iconName) : {};

        acc.iconName = shim.iconName || iconName;
        acc.prefix = shim.prefix || acc.prefix;
      } else if (cls !== config$1.replacementClass && cls.indexOf('fa-w-') !== 0) {
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
        attributes = _abstractNodes$attrib === undefined ? {} : _abstractNodes$attrib,
        _abstractNodes$childr = abstractNodes.children,
        children = _abstractNodes$childr === undefined ? [] : _abstractNodes$childr;


    if (typeof abstractNodes === 'string') {
      return htmlEscape(abstractNodes);
    } else {
      return '<' + tag + ' ' + joinAttributes(attributes) + '>' + children.map(toHtml).join('') + '</' + tag + '>';
    }
  }

  var noop$1$1 = function noop() {};

  function isWatched(node) {
    var i2svg = node.getAttribute ? node.getAttribute(DATA_FA_I2SVG) : null;

    return typeof i2svg === 'string';
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
      var newOuterHTML = abstract.map(function (a) {
        return toHtml(a);
      }).join('\n');

      if (node.parentNode && node.outerHTML) {
        node.outerHTML = newOuterHTML + (config$1.keepOriginalSource && node.tagName.toLowerCase() !== 'svg' ? '<!-- ' + node.outerHTML + ' -->' : '');
      } else if (node.parentNode) {
        var newNode = document.createElement('span');
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

      var forSvg = new RegExp(config$1.familyPrefix + '-.*');

      delete abstract[0].attributes.style;

      var splitClasses = abstract[0].attributes.class.split(' ').reduce(function (acc, cls) {
        if (cls === config$1.replacementClass || cls.match(forSvg)) {
          acc.toSvg.push(cls);
        } else {
          acc.toNode.push(cls);
        }

        return acc;
      }, { toNode: [], toSvg: [] });

      abstract[0].attributes.class = splitClasses.toSvg.join(' ');

      var newInnerHTML = abstract.map(function (a) {
        return toHtml(a);
      }).join('\n');
      node.setAttribute('class', splitClasses.toNode.join(' '));
      node.setAttribute(DATA_FA_I2SVG, '');
      node.innerHTML = newInnerHTML;
    }
  };

  function perform(mutations, callback) {
    var callbackFunction = typeof callback === 'function' ? callback : noop$1$1;

    if (mutations.length === 0) {
      callbackFunction();
    } else {
      var frame = WINDOW.requestAnimationFrame || function (op) {
        return op();
      };

      frame(function () {
        var mutator = getMutator();
        var mark = perf.begin('mutate');

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


    mo = new MUTATION_OBSERVER(function (objects) {
      if (disabled) return;

      toArray(objects).forEach(function (mutationRecord) {
        if (mutationRecord.type === 'childList' && mutationRecord.addedNodes.length > 0 && !isWatched(mutationRecord.addedNodes[0])) {
          if (config$1.searchPseudoElements) {
            pseudoElementsCallback(mutationRecord.target);
          }

          treeCallback(mutationRecord.target);
        }

        if (mutationRecord.type === 'attributes' && mutationRecord.target.parentNode && config$1.searchPseudoElements) {
          pseudoElementsCallback(mutationRecord.target.parentNode);
        }

        if (mutationRecord.type === 'attributes' && isWatched(mutationRecord.target) && ~ATTRIBUTES_WATCHED_FOR_MUTATION.indexOf(mutationRecord.attributeName)) {
          if (mutationRecord.attributeName === 'class') {
            var _getCanonicalIcon = getCanonicalIcon(classArray(mutationRecord.target)),
                prefix = _getCanonicalIcon.prefix,
                iconName = _getCanonicalIcon.iconName;

            if (prefix) mutationRecord.target.setAttribute('data-prefix', prefix);
            if (iconName) mutationRecord.target.setAttribute('data-icon', iconName);
          } else {
            nodeCallback(mutationRecord.target);
          }
        }
      });
    });

    if (!IS_DOM) return;

    mo.observe(DOCUMENT.getElementsByTagName('body')[0], {
      childList: true, attributes: true, characterData: true, subtree: true
    });
  }

  function disconnect() {
    if (!mo) return;

    mo.disconnect();
  }

  var styleParser = function (node) {
    var style = node.getAttribute('style');

    var val = [];

    if (style) {
      val = style.split(';').reduce(function (acc, style) {
        var styles = style.split(':');
        var prop = styles[0];
        var value = styles.slice(1);

        if (prop && value.length > 0) {
          acc[prop] = value.join(':').trim();
        }

        return acc;
      }, {});
    }

    return val;
  };

  function toHex(unicode) {
    var result = '';

    for (var i = 0; i < unicode.length; i++) {
      var hex = unicode.charCodeAt(i).toString(16);
      result += ('000' + hex).slice(-4);
    }

    return result;
  }

  var classParser = function (node) {
    var existingPrefix = node.getAttribute('data-prefix');
    var existingIconName = node.getAttribute('data-icon');
    var innerText = node.innerText !== undefined ? node.innerText.trim() : '';

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
      return transformString.toLowerCase().split(' ').reduce(function (acc, n) {
        var parts = n.toLowerCase().split('-');
        var first = parts[0];
        var rest = parts.slice(1).join('-');

        if (first && rest === 'h') {
          acc.flipX = true;
          return acc;
        }

        if (first && rest === 'v') {
          acc.flipY = true;
          return acc;
        }

        rest = parseFloat(rest);

        if (isNaN(rest)) {
          return acc;
        }

        switch (first) {
          case 'grow':
            acc.size = acc.size + rest;
            break;
          case 'shrink':
            acc.size = acc.size - rest;
            break;
          case 'left':
            acc.x = acc.x - rest;
            break;
          case 'right':
            acc.x = acc.x + rest;
            break;
          case 'up':
            acc.y = acc.y - rest;
            break;
          case 'down':
            acc.y = acc.y + rest;
            break;
          case 'rotate':
            acc.rotate = acc.rotate + rest;
            break;
        }

        return acc;
      }, transform);
    }
  };

  var transformParser = function (node) {
    return parseTransformString(node.getAttribute('data-fa-transform'));
  };

  var symbolParser = function (node) {
    var symbol = node.getAttribute('data-fa-symbol');

    return symbol === null ? false : symbol === '' ? true : symbol;
  };

  var attributesParser = function (node) {
    var extraAttributes = toArray(node.attributes).reduce(function (acc, attr) {
      if (acc.name !== 'class' && acc.name !== 'style') {
        acc[attr.name] = attr.value;
      }
      return acc;
    }, {});

    var title = node.getAttribute('title');

    if (config$1.autoA11y) {
      if (title) {
        extraAttributes['aria-labelledby'] = config$1.replacementClass + '-title-' + nextUniqueId();
      } else {
        extraAttributes['aria-hidden'] = 'true';
      }
    }

    return extraAttributes;
  };

  var maskParser = function (node) {
    var mask = node.getAttribute('data-fa-mask');

    if (!mask) {
      return emptyCanonicalIcon();
    } else {
      return getCanonicalIcon(mask.split(' ').map(function (i) {
        return i.trim();
      }));
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
      title: node.getAttribute('title'),
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
    this.name = 'MissingIcon';
    this.message = error || 'Icon unavailable';
    this.stack = new Error().stack;
  }

  MissingIcon.prototype = Object.create(Error.prototype);
  MissingIcon.prototype.constructor = MissingIcon;

  var FILL = { fill: 'currentColor' };
  var ANIMATION_BASE = {
    attributeType: 'XML',
    repeatCount: 'indefinite',
    dur: '2s'
  };
  var RING = {
    tag: 'path',
    attributes: _extends({}, FILL, {
      d: 'M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z'
    })
  };
  var OPACITY_ANIMATE = _extends({}, ANIMATION_BASE, {
    attributeName: 'opacity'
  });
  var DOT = {
    tag: 'circle',
    attributes: _extends({}, FILL, {
      cx: '256',
      cy: '364',
      r: '28'
    }),
    children: [{ tag: 'animate', attributes: _extends({}, ANIMATION_BASE, { attributeName: 'r', values: '28;14;28;28;14;28;' }) }, { tag: 'animate', attributes: _extends({}, OPACITY_ANIMATE, { values: '1;0;1;1;0;1;' }) }]
  };
  var QUESTION = {
    tag: 'path',
    attributes: _extends({}, FILL, {
      opacity: '1',
      d: 'M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z'
    }),
    children: [{ tag: 'animate', attributes: _extends({}, OPACITY_ANIMATE, { values: '1;0;0;0;0;1;' }) }]
  };
  var EXCLAMATION = {
    tag: 'path',
    attributes: _extends({}, FILL, {
      opacity: '0',
      d: 'M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z'
    }),
    children: [{ tag: 'animate', attributes: _extends({}, OPACITY_ANIMATE, { values: '0;0;1;1;0;0;' }) }]
  };

  var missing = { tag: 'g', children: [RING, DOT, QUESTION, EXCLAMATION] };

  var styles = namespace.styles;

  var LAYERS_TEXT_CLASSNAME = 'fa-layers-text';
  var FONT_FAMILY_PATTERN = /Font Awesome 5 (Solid|Regular|Light|Brands)/;
  var STYLE_TO_PREFIX = {
    'Solid': 'fas',
    'Regular': 'far',
    'Light': 'fal',
    'Brands': 'fab'
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
        icon: { tag: 'path', attributes: { fill: 'currentColor', d: vectorData[0] } }
      };
    } else if (iconName && prefix && !config$1.showMissingIcons) {
      throw new MissingIcon('Icon is missing for prefix ' + prefix + ' with icon name ' + iconName);
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


    return [node, makeInlineSvgAbstract({
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
    })];
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
      extra.attributes['aria-hidden'] = 'true';
    }

    return [node, makeLayersTextAbstract({
      content: node.innerHTML,
      width: width,
      height: height,
      transform: transform,
      title: title,
      extra: extra,
      watchable: true
    })];
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
    if (typeof node.remove === 'function') {
      node.remove();
    } else if (node && node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }

  function searchPseudoElements(root) {
    if (!IS_DOM) return;

    var end = perf.begin('searchPseudoElements');

    disableObservation(function () {
      toArray(root.querySelectorAll('*')).forEach(function (node) {
        [':before', ':after'].forEach(function (pos) {
          var styles = WINDOW.getComputedStyle(node, pos);
          var fontFamily = styles.getPropertyValue('font-family').match(FONT_FAMILY_PATTERN);
          var children = toArray(node.children);
          var pseudoElement = children.filter(function (c) {
            return c.getAttribute(DATA_FA_PSEUDO_ELEMENT) === pos;
          })[0];

          if (pseudoElement) {
            if (pseudoElement.nextSibling && pseudoElement.nextSibling.textContent.indexOf(DATA_FA_PSEUDO_ELEMENT) > -1) {
              remove(pseudoElement.nextSibling);
            }
            remove(pseudoElement);
            pseudoElement = null;
          }

          if (fontFamily && !pseudoElement) {
            var content = styles.getPropertyValue('content');
            var i = DOCUMENT.createElement('i');
            i.setAttribute('class', '' + STYLE_TO_PREFIX[fontFamily[1]]);
            i.setAttribute(DATA_FA_PSEUDO_ELEMENT, pos);
            i.innerText = content.length === 3 ? content.substr(1, 1) : content;
            if (pos === ':before') {
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
    var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    if (!IS_DOM) return;

    var htmlClassList = DOCUMENT.documentElement.classList;
    var hclAdd = function hclAdd(suffix) {
      return htmlClassList.add(HTML_CLASS_I2SVG_BASE_CLASS + '-' + suffix);
    };
    var hclRemove = function hclRemove(suffix) {
      return htmlClassList.remove(HTML_CLASS_I2SVG_BASE_CLASS + '-' + suffix);
    };
    var prefixes = Object.keys(styles);
    var prefixesDomQuery = ['.' + LAYERS_TEXT_CLASSNAME + ':not([' + DATA_FA_I2SVG + '])'].concat(prefixes.map(function (p) {
      return '.' + p + ':not([' + DATA_FA_I2SVG + '])';
    })).join(', ');

    if (prefixesDomQuery.length === 0) {
      return;
    }

    var candidates = toArray(root.querySelectorAll(prefixesDomQuery));

    if (candidates.length > 0) {
      hclAdd('pending');
      hclRemove('complete');
    } else {
      return;
    }

    var mark = perf.begin('onTree');

    var mutations = candidates.reduce(function (acc, node) {
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

    perform(mutations, function () {
      hclAdd('active');
      hclAdd('complete');
      hclRemove('pending');

      if (typeof callback === 'function') callback();
    });
  }

  function onNode(node) {
    var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var mutation = generateMutation(node);

    if (mutation) {
      perform([mutation], callback);
    }
  }

  var baseStyles = "svg:not(:root).svg-inline--fa {\n  overflow: visible; }\n\n.svg-inline--fa {\n  display: inline-block;\n  font-size: inherit;\n  height: 1em;\n  overflow: visible;\n  vertical-align: -.125em; }\n  .svg-inline--fa.fa-lg {\n    vertical-align: -.225em; }\n  .svg-inline--fa.fa-w-1 {\n    width: 0.0625em; }\n  .svg-inline--fa.fa-w-2 {\n    width: 0.125em; }\n  .svg-inline--fa.fa-w-3 {\n    width: 0.1875em; }\n  .svg-inline--fa.fa-w-4 {\n    width: 0.25em; }\n  .svg-inline--fa.fa-w-5 {\n    width: 0.3125em; }\n  .svg-inline--fa.fa-w-6 {\n    width: 0.375em; }\n  .svg-inline--fa.fa-w-7 {\n    width: 0.4375em; }\n  .svg-inline--fa.fa-w-8 {\n    width: 0.5em; }\n  .svg-inline--fa.fa-w-9 {\n    width: 0.5625em; }\n  .svg-inline--fa.fa-w-10 {\n    width: 0.625em; }\n  .svg-inline--fa.fa-w-11 {\n    width: 0.6875em; }\n  .svg-inline--fa.fa-w-12 {\n    width: 0.75em; }\n  .svg-inline--fa.fa-w-13 {\n    width: 0.8125em; }\n  .svg-inline--fa.fa-w-14 {\n    width: 0.875em; }\n  .svg-inline--fa.fa-w-15 {\n    width: 0.9375em; }\n  .svg-inline--fa.fa-w-16 {\n    width: 1em; }\n  .svg-inline--fa.fa-w-17 {\n    width: 1.0625em; }\n  .svg-inline--fa.fa-w-18 {\n    width: 1.125em; }\n  .svg-inline--fa.fa-w-19 {\n    width: 1.1875em; }\n  .svg-inline--fa.fa-w-20 {\n    width: 1.25em; }\n  .svg-inline--fa.fa-pull-left {\n    margin-right: .3em;\n    width: auto; }\n  .svg-inline--fa.fa-pull-right {\n    margin-left: .3em;\n    width: auto; }\n  .svg-inline--fa.fa-border {\n    height: 1.5em; }\n  .svg-inline--fa.fa-li {\n    width: 2em; }\n  .svg-inline--fa.fa-fw {\n    width: 1.25em; }\n\n.fa-layers svg.svg-inline--fa {\n  bottom: 0;\n  left: 0;\n  margin: auto;\n  position: absolute;\n  right: 0;\n  top: 0; }\n\n.fa-layers {\n  display: inline-block;\n  height: 1em;\n  position: relative;\n  text-align: center;\n  vertical-align: -.125em;\n  width: 1em; }\n  .fa-layers svg.svg-inline--fa {\n    -webkit-transform-origin: center center;\n            transform-origin: center center; }\n\n.fa-layers-text, .fa-layers-counter {\n  display: inline-block;\n  position: absolute;\n  text-align: center; }\n\n.fa-layers-text {\n  left: 50%;\n  top: 50%;\n  -webkit-transform: translate(-50%, -50%);\n          transform: translate(-50%, -50%);\n  -webkit-transform-origin: center center;\n          transform-origin: center center; }\n\n.fa-layers-counter {\n  background-color: #ff253a;\n  border-radius: 1em;\n  -webkit-box-sizing: border-box;\n          box-sizing: border-box;\n  color: #fff;\n  height: 1.5em;\n  line-height: 1;\n  max-width: 5em;\n  min-width: 1.5em;\n  overflow: hidden;\n  padding: .25em;\n  right: 0;\n  text-overflow: ellipsis;\n  top: 0;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: top right;\n          transform-origin: top right; }\n\n.fa-layers-bottom-right {\n  bottom: 0;\n  right: 0;\n  top: auto;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: bottom right;\n          transform-origin: bottom right; }\n\n.fa-layers-bottom-left {\n  bottom: 0;\n  left: 0;\n  right: auto;\n  top: auto;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: bottom left;\n          transform-origin: bottom left; }\n\n.fa-layers-top-right {\n  right: 0;\n  top: 0;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: top right;\n          transform-origin: top right; }\n\n.fa-layers-top-left {\n  left: 0;\n  right: auto;\n  top: 0;\n  -webkit-transform: scale(0.25);\n          transform: scale(0.25);\n  -webkit-transform-origin: top left;\n          transform-origin: top left; }\n\n.fa-lg {\n  font-size: 1.33333em;\n  line-height: 0.75em;\n  vertical-align: -.0667em; }\n\n.fa-xs {\n  font-size: .75em; }\n\n.fa-sm {\n  font-size: .875em; }\n\n.fa-1x {\n  font-size: 1em; }\n\n.fa-2x {\n  font-size: 2em; }\n\n.fa-3x {\n  font-size: 3em; }\n\n.fa-4x {\n  font-size: 4em; }\n\n.fa-5x {\n  font-size: 5em; }\n\n.fa-6x {\n  font-size: 6em; }\n\n.fa-7x {\n  font-size: 7em; }\n\n.fa-8x {\n  font-size: 8em; }\n\n.fa-9x {\n  font-size: 9em; }\n\n.fa-10x {\n  font-size: 10em; }\n\n.fa-fw {\n  text-align: center;\n  width: 1.25em; }\n\n.fa-ul {\n  list-style-type: none;\n  margin-left: 2.5em;\n  padding-left: 0; }\n  .fa-ul > li {\n    position: relative; }\n\n.fa-li {\n  left: -2em;\n  position: absolute;\n  text-align: center;\n  width: 2em;\n  line-height: inherit; }\n\n.fa-border {\n  border: solid 0.08em #eee;\n  border-radius: .1em;\n  padding: .2em .25em .15em; }\n\n.fa-pull-left {\n  float: left; }\n\n.fa-pull-right {\n  float: right; }\n\n.fa.fa-pull-left,\n.fas.fa-pull-left,\n.far.fa-pull-left,\n.fal.fa-pull-left,\n.fab.fa-pull-left {\n  margin-right: .3em; }\n\n.fa.fa-pull-right,\n.fas.fa-pull-right,\n.far.fa-pull-right,\n.fal.fa-pull-right,\n.fab.fa-pull-right {\n  margin-left: .3em; }\n\n.fa-spin {\n  -webkit-animation: fa-spin 2s infinite linear;\n          animation: fa-spin 2s infinite linear; }\n\n.fa-pulse {\n  -webkit-animation: fa-spin 1s infinite steps(8);\n          animation: fa-spin 1s infinite steps(8); }\n\n@-webkit-keyframes fa-spin {\n  0% {\n    -webkit-transform: rotate(0deg);\n            transform: rotate(0deg); }\n  100% {\n    -webkit-transform: rotate(360deg);\n            transform: rotate(360deg); } }\n\n@keyframes fa-spin {\n  0% {\n    -webkit-transform: rotate(0deg);\n            transform: rotate(0deg); }\n  100% {\n    -webkit-transform: rotate(360deg);\n            transform: rotate(360deg); } }\n\n.fa-rotate-90 {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=1)\";\n  -webkit-transform: rotate(90deg);\n          transform: rotate(90deg); }\n\n.fa-rotate-180 {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=2)\";\n  -webkit-transform: rotate(180deg);\n          transform: rotate(180deg); }\n\n.fa-rotate-270 {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=3)\";\n  -webkit-transform: rotate(270deg);\n          transform: rotate(270deg); }\n\n.fa-flip-horizontal {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=0, mirror=1)\";\n  -webkit-transform: scale(-1, 1);\n          transform: scale(-1, 1); }\n\n.fa-flip-vertical {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)\";\n  -webkit-transform: scale(1, -1);\n          transform: scale(1, -1); }\n\n.fa-flip-horizontal.fa-flip-vertical {\n  -ms-filter: \"progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)\";\n  -webkit-transform: scale(-1, -1);\n          transform: scale(-1, -1); }\n\n:root .fa-rotate-90,\n:root .fa-rotate-180,\n:root .fa-rotate-270,\n:root .fa-flip-horizontal,\n:root .fa-flip-vertical {\n  -webkit-filter: none;\n          filter: none; }\n\n.fa-stack {\n  display: inline-block;\n  height: 2em;\n  position: relative;\n  width: 2em; }\n\n.fa-stack-1x,\n.fa-stack-2x {\n  bottom: 0;\n  left: 0;\n  margin: auto;\n  position: absolute;\n  right: 0;\n  top: 0; }\n\n.svg-inline--fa.fa-stack-1x {\n  height: 1em;\n  width: 1em; }\n\n.svg-inline--fa.fa-stack-2x {\n  height: 2em;\n  width: 2em; }\n\n.fa-inverse {\n  color: #fff; }\n\n.sr-only {\n  border: 0;\n  clip: rect(0, 0, 0, 0);\n  height: 1px;\n  margin: -1px;\n  overflow: hidden;\n  padding: 0;\n  position: absolute;\n  width: 1px; }\n\n.sr-only-focusable:active, .sr-only-focusable:focus {\n  clip: auto;\n  height: auto;\n  margin: 0;\n  overflow: visible;\n  position: static;\n  width: auto; }\n";

  var css = function () {
    var dfp = DEFAULT_FAMILY_PREFIX;
    var drc = DEFAULT_REPLACEMENT_CLASS;
    var fp = config$1.familyPrefix;
    var rc = config$1.replacementClass;
    var s = baseStyles;

    if (fp !== dfp || rc !== drc) {
      var dPatt = new RegExp('\\.' + dfp + '\\-', 'g');
      var rPatt = new RegExp('\\.' + drc, 'g');

      s = s.replace(dPatt, '.' + fp + '-').replace(rPatt, '.' + rc);
    }

    return s;
  };

  function define(prefix, icons) {
    var normalized = Object.keys(icons).reduce(function (acc, iconName) {
      var icon = icons[iconName];
      var expanded = !!icon.icon;

      if (expanded) {
        acc[icon.iconName] = icon.icon;
      } else {
        acc[iconName] = icon;
      }
      return acc;
    }, {});

    if (typeof namespace.hooks.addPack === 'function') {
      namespace.hooks.addPack(prefix, normalized);
    } else {
      namespace.styles[prefix] = _extends({}, namespace.styles[prefix] || {}, normalized);
    }

    /**
     * Font Awesome 4 used the prefix of `fa` for all icons. With the introduction
     * of new styles we needed to differentiate between them. Prefix `fa` is now an alias
     * for `fas` so we'll easy the upgrade process for our users by automatically defining
     * this as well.
     */
    if (prefix === 'fas') {
      define('fa', icons);
    }
  }

  var Library = function () {
    function Library() {
      classCallCheck(this, Library);

      this.definitions = {};
    }

    createClass(Library, [{
      key: 'add',
      value: function add() {
        var _this = this;

        for (var _len = arguments.length, definitions = Array(_len), _key = 0; _key < _len; _key++) {
          definitions[_key] = arguments[_key];
        }

        var additions = definitions.reduce(this._pullDefinitions, {});

        Object.keys(additions).forEach(function (key) {
          _this.definitions[key] = _extends({}, _this.definitions[key] || {}, additions[key]);
          define(key, additions[key]);
        });
      }
    }, {
      key: 'reset',
      value: function reset() {
        this.definitions = {};
      }
    }, {
      key: '_pullDefinitions',
      value: function _pullDefinitions(additions, definition) {
        var normalized = definition.prefix && definition.iconName && definition.icon ? { 0: definition } : definition;

        Object.keys(normalized).map(function (key) {
          var _normalized$key = normalized[key],
              prefix = _normalized$key.prefix,
              iconName = _normalized$key.iconName,
              icon = _normalized$key.icon;


          if (!additions[prefix]) additions[prefix] = {};

          additions[prefix][iconName] = icon;
        });

        return additions;
      }
    }]);
    return Library;
  }();

  function prepIcon(icon) {
    var width = icon[0];
    var height = icon[1];
    var vectorData = icon.slice(4);

    return {
      found: true,
      width: width,
      height: height,
      icon: { tag: 'path', attributes: { fill: 'currentColor', d: vectorData[0] } }
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
    Object.defineProperty(val, 'abstract', {
      get: abstractCreator
    });

    Object.defineProperty(val, 'html', {
      get: function get() {
        return val.abstract.map(function (a) {
          return toHtml(a);
        });
      }
    });

    Object.defineProperty(val, 'node', {
      get: function get() {
        if (!IS_DOM) return;

        var container = DOCUMENT.createElement('div');
        container.innerHTML = val.html;
        return container.children;
      }
    });

    return val;
  }

  function findIconDefinition(params) {
    var _params$prefix = params.prefix,
        prefix = _params$prefix === undefined ? 'fa' : _params$prefix,
        iconName = params.iconName;


    if (!iconName) return;

    return iconFromMapping(library.definitions, prefix, iconName) || iconFromMapping(namespace.styles, prefix, iconName);
  }

  function resolveIcons(next) {
    return function (maybeIconDefinition) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var iconDefinition = (maybeIconDefinition || {}).icon ? maybeIconDefinition : findIconDefinition(maybeIconDefinition || {});

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
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (IS_DOM) {
        ensureCss();

        var _params$node = params.node,
            node = _params$node === undefined ? DOCUMENT : _params$node,
            _params$callback = params.callback,
            callback = _params$callback === undefined ? function () {} : _params$callback;


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

  var icon = resolveIcons(function (iconDefinition) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _params$transform = params.transform,
        transform = _params$transform === undefined ? meaninglessTransform : _params$transform,
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


    return apiObject(_extends({ type: 'icon' }, iconDefinition), function () {
      ensureCss();

      if (config$1.autoA11y) {
        if (title) {
          attributes['aria-labelledby'] = config$1.replacementClass + '-title-' + nextUniqueId();
        } else {
          attributes['aria-hidden'] = 'true';
        }
      }

      return makeInlineSvgAbstract({
        icons: {
          main: prepIcon(icon),
          mask: mask ? prepIcon(mask.icon) : { found: false, width: null, height: null, icon: {} }
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
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _params$transform2 = params.transform,
        transform = _params$transform2 === undefined ? meaninglessTransform : _params$transform2,
        _params$title2 = params.title,
        title = _params$title2 === undefined ? null : _params$title2,
        _params$classes2 = params.classes,
        classes = _params$classes2 === undefined ? [] : _params$classes2,
        _params$attributes2 = params.attributes,
        attributes = _params$attributes2 === undefined ? {} : _params$attributes2,
        _params$styles2 = params.styles,
        styles = _params$styles2 === undefined ? {} : _params$styles2;


    return apiObject({ type: 'text', content: content }, function () {
      ensureCss();

      return makeLayersTextAbstract({
        content: content,
        transform: _extends({}, meaninglessTransform, transform),
        title: title,
        extra: {
          attributes: attributes,
          styles: styles,
          classes: [config$1.familyPrefix + '-layers-text'].concat(toConsumableArray(classes))
        }
      });
    });
  };

  var layer = function layer(assembler) {
    return apiObject({ type: 'layer' }, function () {
      ensureCss();

      var children = [];

      assembler(function (args) {
        Array.isArray(args) ? args.map(function (a) {
          children = children.concat(a.abstract);
        }) : children = children.concat(args.abstract);
      });

      return [{
        tag: 'span',
        attributes: { class: config$1.familyPrefix + '-layers' },
        children: children
      }];
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

      domready(function () {
        if (Object.keys(namespace.styles).length > 0) {
          autoReplace();
        }

        if (config$1.observeMutations && typeof MutationObserver === 'function') {
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
        namespace.styles[prefix] = _extends({}, namespace.styles[prefix] || {}, icons);

        build();
        autoReplace();
      },

      addShims: function addShims(shims) {
        var _namespace$shims;

        (_namespace$shims = namespace.shims).push.apply(_namespace$shims, toConsumableArray(shims));

        build();
        autoReplace();
      }
    });
  }

  Object.defineProperty(api$1, 'config', {
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
  var faSearch = { prefix: 'fas', iconName: 'search', icon: [512, 512, [], "f002", "M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"] };
  var faTimes = { prefix: 'fas', iconName: 'times', icon: [352, 512, [], "f00d", "M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"] };

  /* src/components/views/CardHeader.html generated by Svelte v2.8.1 */

  api$1.library.add(faSearch, faTimes);

  var methods = {
    handleChange: function handleChange(str) {
      if ( str === void 0 ) str = undefined;

      var input = document.querySelector('.card-header__input');
      if (str === 'reset') {
        input.value = '';
      }
      this.set({
        city: input.value.split(', ')[0]
      });
    },
    handleSearch: function handleSearch() {
      this.handleChange();
    },
    handleCancel: function handleCancel() {
      this.handleChange('reset');
    },
    handleSubmit: function handleSubmit(evt) {
      // prevent form submit on <enter> keydown
      evt.preventDefault();
      return false;
    }
  };

  function add_css() {
  	var style = createElement("style");
  	style.id = 'svelte-1jo2kwh-style';
  	style.textContent = ".weather-app-card__header.svelte-1jo2kwh{background-color:transparent;border-bottom:none;z-index:500}.card>hr.svelte-1jo2kwh{margin:0 1rem}.form-control.svelte-1jo2kwh{color:white;font-size:1.5rem;background-color:transparent;border:none}.fa-search.svelte-1jo2kwh,.fa-times.svelte-1jo2kwh{color:rgba(0, 0, 0, 0.4);cursor:pointer}.form-control.svelte-1jo2kwh:focus{background-color:transparent;border-color:transparent;box-shadow:none}input.svelte-1jo2kwh::-webkit-input-placeholder{color:white}input.svelte-1jo2kwh::-moz-placeholder{color:white}input.svelte-1jo2kwh:-ms-input-placeholder{color:white}input.svelte-1jo2kwh:-moz-placeholder{color:white}";
  	appendNode(style, document.head);
  }

  function create_main_fragment(component, ctx) {
  	var div, div_1, text_1, div_2, form, div_3, input, text_2, small, text_7, div_4, text_10, hr;

  	function click_handler(event) {
  		component.handleSearch();
  	}

  	function change_handler(event) {
  		component.handleChange();
  	}

  	function submit_handler(event) {
  		component.handleSubmit(event);
  	}

  	function click_handler_1(event) {
  		component.handleCancel();
  	}

  	return {
  		c: function c() {
  			div = createElement("div");
  			div_1 = createElement("div");
  			div_1.innerHTML = "<i class=\"fas fa-search svelte-1jo2kwh\"></i>";
  			text_1 = createText("\n  ");
  			div_2 = createElement("div");
  			form = createElement("form");
  			div_3 = createElement("div");
  			input = createElement("input");
  			text_2 = createText("\n        ");
  			small = createElement("small");
  			small.textContent = "Please enter a city to search";
  			text_7 = createText("\n  ");
  			div_4 = createElement("div");
  			div_4.innerHTML = "<i class=\"fas fa-times svelte-1jo2kwh\"></i>";
  			text_10 = createText("\n\n");
  			hr = createElement("hr");
  			addListener(div_1, "click", click_handler);
  			addListener(input, "change", change_handler);
  			setAttribute(input, "type", "text");
  			input.className = "form-control card-header__input svelte-1jo2kwh";
  			setAttribute(input, "aria-describedby", "searchHelp");
  			input.placeholder = "Search for a city...";
  			small.id = "searchHelp";
  			small.className = "form-text text-muted";
  			small.hidden = true;
  			div_3.className = "form-group";
  			addListener(form, "submit", submit_handler);
  			div_2.className = "w-75";
  			addListener(div_4, "click", click_handler_1);
  			div.className = "card-header w-100 d-flex justify-content-between align-items-center weather-app-card__header svelte-1jo2kwh";
  			hr.className = "svelte-1jo2kwh";
  		},

  		m: function m(target, anchor) {
  			insertNode(div, target, anchor);
  			appendNode(div_1, div);
  			appendNode(text_1, div);
  			appendNode(div_2, div);
  			appendNode(form, div_2);
  			appendNode(div_3, form);
  			appendNode(input, div_3);
  			appendNode(text_2, div_3);
  			appendNode(small, div_3);
  			appendNode(text_7, div);
  			appendNode(div_4, div);
  			insertNode(text_10, target, anchor);
  			insertNode(hr, target, anchor);
  		},

  		p: noop,

  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			removeListener(div_1, "click", click_handler);
  			removeListener(input, "change", change_handler);
  			removeListener(form, "submit", submit_handler);
  			removeListener(div_4, "click", click_handler_1);
  			if (detach) {
  				detachNode(text_10);
  				detachNode(hr);
  			}
  		}
  	};
  }

  function CardHeader(options) {
  	init(this, options);
  	this._state = assign({}, options.data);
  	this._intro = true;

  	if (!document.getElementById("svelte-1jo2kwh-style")) { add_css(); }

  	this._fragment = create_main_fragment(this, this._state);

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}
  }

  assign(CardHeader.prototype, proto);
  assign(CardHeader.prototype, methods);

  function cubicInOut(t) {
    return t < 0.5
      ? 4.0 * t * t * t
      : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0
  }

  /* src/components/views/CardBody.html generated by Svelte v2.8.1 */

  function fade_1(node, ref) {
    var delay = ref.delay; if ( delay === void 0 ) delay = 0;
    var duration = ref.duration; if ( duration === void 0 ) duration = 400;

    var o = +getComputedStyle(node).opacity;

    return {
      delay: delay,
      duration: duration,
      easing: cubicInOut,
      css: function (t) { return ("opacity: " + (t * o)); }
    };
  }
  function add_css$1() {
  	var style = createElement("style");
  	style.id = 'svelte-13xnyib-style';
  	style.textContent = ".card-body__temp.svelte-13xnyib{font-size:12rem}.weather-card__degree-symbol.svelte-13xnyib{padding-top:.75rem;font-size:6em;top:0;position:unset;line-height:unset;vertical-align:top}.card-body__status.svelte-13xnyib{margin-top:1rem}.card-body__status.svelte-13xnyib span.svelte-13xnyib:first-of-type{font-size:3em;margin:.5rem 0}.card-body__status.svelte-13xnyib span.svelte-13xnyib:nth-child(2){font-size:1.5em;margin:.25em 0;text-transform:capitalize}.card-body__status.svelte-13xnyib span.svelte-13xnyib:last-of-type{font-size:1em;margin:.25em 0}";
  	appendNode(style, document.head);
  }

  function create_main_fragment$1(component, ctx) {
  	var div, current_block_type_index, if_block;

  	var if_block_creators = [
  		create_if_block,
  		create_if_block_1,
  		create_if_block_2
  	];

  	var if_blocks = [];

  	function select_block_type(ctx) {
  		if (!ctx.current.length) { return 0; }
  		if (ctx.current[0] === 'City not found') { return 1; }
  		return 2;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](component, ctx);

  	return {
  		c: function c() {
  			div = createElement("div");
  			if_block.c();
  			div.className = "card-body d-flex justify-content-center weather-app-card__body";
  		},

  		m: function m(target, anchor) {
  			insertNode(div, target, anchor);
  			if_blocks[current_block_type_index].i(div, null);
  		},

  		p: function p(changed, ctx) {
  			var previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);
  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(changed, ctx);
  			} else {
  				transitionManager.groupOutros();
  				if_block.o(function() {
  					if_blocks[previous_block_index].d(1);
  					if_blocks[previous_block_index] = null;
  				});

  				if_block = if_blocks[current_block_type_index];
  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](component, ctx);
  					if_block.c();
  				}
  				if_block.i(div, null);
  			}
  		},

  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if_blocks[current_block_type_index].d();
  		}
  	};
  }

  // (2:2) {#if !current.length}
  function create_if_block(component, ctx) {
  	var div, div_transition, current;

  	return {
  		c: function c() {
  			div = createElement("div");
  			div.innerHTML = "<h1>No Data</h1>";
  			div.className = "card-body__temp svelte-13xnyib";
  		},

  		m: function m(target, anchor) {
  			insertNode(div, target, anchor);
  			current = true;
  		},

  		p: noop,

  		i: function i(target, anchor) {
  			if (current) { return; }
  			if (component.root._intro) {
  				if (div_transition) { div_transition.invalidate(); }

  				component.root._aftercreate.push(function () {
  					if (!div_transition) { div_transition = wrapTransition(component, div, fade_1, {}, true); }
  					div_transition.run(1);
  				});
  			}
  			this.m(target, anchor);
  		},

  		o: function o(outrocallback) {
  			if (!current) { return; }

  			if (!div_transition) { div_transition = wrapTransition(component, div, fade_1, {}, false); }
  			div_transition.run(0, function () {
  				outrocallback();
  				div_transition = null;
  			});

  			current = false;
  		},

  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  			}
  		}
  	};
  }

  // (6:43) 
  function create_if_block_1(component, ctx) {
  	var div, h1, text_value = ctx.current[0], text, div_transition, current;

  	return {
  		c: function c() {
  			div = createElement("div");
  			h1 = createElement("h1");
  			text = createText(text_value);
  			div.className = "card-body__temp svelte-13xnyib";
  		},

  		m: function m(target, anchor) {
  			insertNode(div, target, anchor);
  			appendNode(h1, div);
  			appendNode(text, h1);
  			current = true;
  		},

  		p: function p(changed, ctx) {
  			if ((!current || changed.current) && text_value !== (text_value = ctx.current[0])) {
  				text.data = text_value;
  			}
  		},

  		i: function i(target, anchor) {
  			if (current) { return; }
  			if (component.root._intro) {
  				if (div_transition) { div_transition.invalidate(); }

  				component.root._aftercreate.push(function () {
  					if (!div_transition) { div_transition = wrapTransition(component, div, fade_1, {}, true); }
  					div_transition.run(1);
  				});
  			}
  			this.m(target, anchor);
  		},

  		o: function o(outrocallback) {
  			if (!current) { return; }

  			if (!div_transition) { div_transition = wrapTransition(component, div, fade_1, {}, false); }
  			div_transition.run(0, function () {
  				outrocallback();
  				div_transition = null;
  			});

  			current = false;
  		},

  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  			}
  		}
  	};
  }

  // (10:2) {:else}
  function create_if_block_2(component, ctx) {
  	var div, span, text_value = ctx.current[0].temp.f, text, div_transition, text_2, sup, text_4, div_1, span_1, text_6, span_2, text_7_value = ctx.current[0].conditions.description, text_7, text_8, span_3, text_9_value = ctx.current[0].humidity, text_9, text_10, current;

  	return {
  		c: function c() {
  			div = createElement("div");
  			span = createElement("span");
  			text = createText(text_value);
  			text_2 = createText("\n  ");
  			sup = createElement("sup");
  			sup.textContent = "°";
  			text_4 = createText("\n  ");
  			div_1 = createElement("div");
  			span_1 = createElement("span");
  			span_1.textContent = "F";
  			text_6 = createText("\n    ");
  			span_2 = createElement("span");
  			text_7 = createText(text_7_value);
  			text_8 = createText("\n    ");
  			span_3 = createElement("span");
  			text_9 = createText(text_9_value);
  			text_10 = createText(" % Humidity");
  			div.className = "card-body__temp svelte-13xnyib";
  			sup.className = "weather-card__degree-symbol svelte-13xnyib";
  			span_1.className = "svelte-13xnyib";
  			span_2.className = "svelte-13xnyib";
  			span_3.className = "svelte-13xnyib";
  			div_1.className = "d-flex flex-column ml-2 card-body__status svelte-13xnyib";
  		},

  		m: function m(target, anchor) {
  			insertNode(div, target, anchor);
  			appendNode(span, div);
  			appendNode(text, span);
  			insertNode(text_2, target, anchor);
  			insertNode(sup, target, anchor);
  			insertNode(text_4, target, anchor);
  			insertNode(div_1, target, anchor);
  			appendNode(span_1, div_1);
  			appendNode(text_6, div_1);
  			appendNode(span_2, div_1);
  			appendNode(text_7, span_2);
  			appendNode(text_8, div_1);
  			appendNode(span_3, div_1);
  			appendNode(text_9, span_3);
  			appendNode(text_10, span_3);
  			current = true;
  		},

  		p: function p(changed, ctx) {
  			if ((!current || changed.current) && text_value !== (text_value = ctx.current[0].temp.f)) {
  				text.data = text_value;
  			}

  			if ((!current || changed.current) && text_7_value !== (text_7_value = ctx.current[0].conditions.description)) {
  				text_7.data = text_7_value;
  			}

  			if ((!current || changed.current) && text_9_value !== (text_9_value = ctx.current[0].humidity)) {
  				text_9.data = text_9_value;
  			}
  		},

  		i: function i(target, anchor) {
  			if (current) { return; }
  			if (component.root._intro) {
  				if (div_transition) { div_transition.invalidate(); }

  				component.root._aftercreate.push(function () {
  					if (!div_transition) { div_transition = wrapTransition(component, div, fade_1, {}, true); }
  					div_transition.run(1);
  				});
  			}
  			this.m(target, anchor);
  		},

  		o: function o(outrocallback) {
  			if (!current) { return; }

  			if (!div_transition) { div_transition = wrapTransition(component, div, fade_1, {}, false); }
  			div_transition.run(0, function () {
  				outrocallback();
  				div_transition = null;
  			});

  			current = false;
  		},

  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  				detachNode(text_2);
  				detachNode(sup);
  				detachNode(text_4);
  				detachNode(div_1);
  			}
  		}
  	};
  }

  function CardBody(options) {
  	init(this, options);
  	this._state = assign({}, options.data);
  	this._intro = true;

  	if (!document.getElementById("svelte-13xnyib-style")) { add_css$1(); }

  	if (!options.root) {
  		this._oncreate = [];
  		this._aftercreate = [];
  	}

  	this._fragment = create_main_fragment$1(this, this._state);

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		callAll(this._aftercreate);
  	}
  }

  assign(CardBody.prototype, proto);

  /* src/components/views/CardFooter.html generated by Svelte v2.8.1 */

  function fade_1$1(node, ref) {
    var delay = ref.delay; if ( delay === void 0 ) delay = 0;
    var duration = ref.duration; if ( duration === void 0 ) duration = 400;

    var o = +getComputedStyle(node).opacity;

    return {
      delay: delay,
      duration: duration,
      easing: cubicInOut,
      css: function (t) { return ("opacity: " + (t * o)); }
    };
  }
  function create_main_fragment$2(component, ctx) {
  	var current_block_type_index, if_block, if_block_anchor;

  	var if_block_creators = [
  		create_if_block$1,
  		create_if_block_1$1,
  		create_if_block_2$1
  	];

  	var if_blocks = [];

  	function select_block_type(ctx) {
  		if (!ctx.forecast.length) { return 0; }
  		if (ctx.forecast[0] === 'City not found') { return 1; }
  		return 2;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](component, ctx);

  	return {
  		c: function c() {
  			if_block.c();
  			if_block_anchor = createComment();
  		},

  		m: function m(target, anchor) {
  			if_blocks[current_block_type_index].i(target, anchor);
  			insertNode(if_block_anchor, target, anchor);
  		},

  		p: function p(changed, ctx) {
  			var previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);
  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(changed, ctx);
  			} else {
  				transitionManager.groupOutros();
  				if_block.o(function() {
  					if_blocks[previous_block_index].d(1);
  					if_blocks[previous_block_index] = null;
  				});

  				if_block = if_blocks[current_block_type_index];
  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](component, ctx);
  					if_block.c();
  				}
  				if_block.i(if_block_anchor.parentNode, if_block_anchor);
  			}
  		},

  		d: function d(detach) {
  			if_blocks[current_block_type_index].d(detach);
  			if (detach) {
  				detachNode(if_block_anchor);
  			}
  		}
  	};
  }

  // (31:2) {#each forecast as forecasts}
  function create_each_block(component, ctx) {
  	var div, span, text_value = ctx.forecasts.date, text, text_1, span_1, img, img_src_value, text_3, span_2, text_4_value = ctx.forecasts.temp.f, text_4, text_5, sup, text_7, text_8, span_3, text_9_value = ctx.forecasts.temp.c, text_9, text_10, sup_1, text_12;

  	return {
  		c: function c() {
  			div = createElement("div");
  			span = createElement("span");
  			text = createText(text_value);
  			text_1 = createText("\n    ");
  			span_1 = createElement("span");
  			img = createElement("img");
  			text_3 = createText("\n    ");
  			span_2 = createElement("span");
  			text_4 = createText(text_4_value);
  			text_5 = createText("\n      ");
  			sup = createElement("sup");
  			sup.textContent = "°";
  			text_7 = createText("F");
  			text_8 = createText("\n    ");
  			span_3 = createElement("span");
  			text_9 = createText(text_9_value);
  			text_10 = createText("\n      ");
  			sup_1 = createElement("sup");
  			sup_1.textContent = "°";
  			text_12 = createText("C");
  			span.className = "forecast-item__date";
  			img.src = img_src_value = "http://openweathermap.org/img/w/" + ctx.forecasts.conditions.icon + ".png";
  			img.alt = "weather icon";
  			span_1.className = "forecast-item__symbol";
  			sup.className = "weather-card__degree-symbol";
  			span_2.className = "forecast-item__temp--f";
  			sup_1.className = "weather-card__degree-symbol";
  			span_3.className = "forecast-item__temp--c";
  			div.className = "d-flex flex-column text-center card-footer__forecast-item";
  		},

  		m: function m(target, anchor) {
  			insertNode(div, target, anchor);
  			appendNode(span, div);
  			appendNode(text, span);
  			appendNode(text_1, div);
  			appendNode(span_1, div);
  			appendNode(img, span_1);
  			appendNode(text_3, div);
  			appendNode(span_2, div);
  			appendNode(text_4, span_2);
  			appendNode(text_5, span_2);
  			appendNode(sup, span_2);
  			appendNode(text_7, span_2);
  			appendNode(text_8, div);
  			appendNode(span_3, div);
  			appendNode(text_9, span_3);
  			appendNode(text_10, span_3);
  			appendNode(sup_1, span_3);
  			appendNode(text_12, span_3);
  		},

  		p: function p(changed, ctx) {
  			if ((changed.forecast) && text_value !== (text_value = ctx.forecasts.date)) {
  				text.data = text_value;
  			}

  			if ((changed.forecast) && img_src_value !== (img_src_value = "http://openweathermap.org/img/w/" + ctx.forecasts.conditions.icon + ".png")) {
  				img.src = img_src_value;
  			}

  			if ((changed.forecast) && text_4_value !== (text_4_value = ctx.forecasts.temp.f)) {
  				text_4.data = text_4_value;
  			}

  			if ((changed.forecast) && text_9_value !== (text_9_value = ctx.forecasts.temp.c)) {
  				text_9.data = text_9_value;
  			}
  		},

  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  			}
  		}
  	};
  }

  // (1:0) {#if !forecast.length}
  function create_if_block$1(component, ctx) {
  	var div, div_transition, text_3, style, current;

  	return {
  		c: function c() {
  			div = createElement("div");
  			div.innerHTML = "<div class=\"col-6 text-center\"><h1>No Forecast Data</h1></div>";
  			text_3 = createText("\n");
  			style = createElement("style");
  			style.textContent = ".weather-app-card__footer {\n    color: #888;\n    background: white;\n    padding: 1rem 0;\n    border-radius: 0 0 4px 4px;\n  }";
  			div.className = "card-footer d-flex justify-content-center weather-app-card__footer";
  		},

  		m: function m(target, anchor) {
  			insertNode(div, target, anchor);
  			insertNode(text_3, target, anchor);
  			insertNode(style, target, anchor);
  			current = true;
  		},

  		p: noop,

  		i: function i(target, anchor) {
  			if (current) { return; }
  			if (component.root._intro) {
  				if (div_transition) { div_transition.invalidate(); }

  				component.root._aftercreate.push(function () {
  					if (!div_transition) { div_transition = wrapTransition(component, div, fade_1$1, {}, true); }
  					div_transition.run(1);
  				});
  			}
  			this.m(target, anchor);
  		},

  		o: function o(outrocallback) {
  			if (!current) { return; }

  			if (!div_transition) { div_transition = wrapTransition(component, div, fade_1$1, {}, false); }
  			div_transition.run(0, function () {
  				outrocallback();
  				div_transition = null;
  			});

  			current = false;
  		},

  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  				detachNode(text_3);
  				detachNode(style);
  			}
  		}
  	};
  }

  // (15:42) 
  function create_if_block_1$1(component, ctx) {
  	var div, div_1, h1, text_value = ctx.forecast[0], text, div_transition, text_3, style, current;

  	return {
  		c: function c() {
  			div = createElement("div");
  			div_1 = createElement("div");
  			h1 = createElement("h1");
  			text = createText(text_value);
  			text_3 = createText("\n");
  			style = createElement("style");
  			style.textContent = ".weather-app-card__footer {\n    color: #888;\n    background: white;\n    padding: 1rem 0;\n    border-radius: 0 0 4px 4px;\n  }";
  			div_1.className = "col-6 text-center";
  			div.className = "card-footer d-flex justify-content-center weather-app-card__footer";
  		},

  		m: function m(target, anchor) {
  			insertNode(div, target, anchor);
  			appendNode(div_1, div);
  			appendNode(h1, div_1);
  			appendNode(text, h1);
  			insertNode(text_3, target, anchor);
  			insertNode(style, target, anchor);
  			current = true;
  		},

  		p: function p(changed, ctx) {
  			if ((!current || changed.forecast) && text_value !== (text_value = ctx.forecast[0])) {
  				text.data = text_value;
  			}
  		},

  		i: function i(target, anchor) {
  			if (current) { return; }
  			if (component.root._intro) {
  				if (div_transition) { div_transition.invalidate(); }

  				component.root._aftercreate.push(function () {
  					if (!div_transition) { div_transition = wrapTransition(component, div, fade_1$1, {}, true); }
  					div_transition.run(1);
  				});
  			}
  			this.m(target, anchor);
  		},

  		o: function o(outrocallback) {
  			if (!current) { return; }

  			if (!div_transition) { div_transition = wrapTransition(component, div, fade_1$1, {}, false); }
  			div_transition.run(0, function () {
  				outrocallback();
  				div_transition = null;
  			});

  			current = false;
  		},

  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  				detachNode(text_3);
  				detachNode(style);
  			}
  		}
  	};
  }

  // (29:0) {:else}
  function create_if_block_2$1(component, ctx) {
  	var div, div_transition, text_1, style, current;

  	var each_value = ctx.forecast;

  	var each_blocks = [];

  	for (var i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block(component, get_each_context(ctx, each_value, i));
  	}

  	return {
  		c: function c() {
  			div = createElement("div");

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			text_1 = createText("\n");
  			style = createElement("style");
  			style.textContent = ".weather-app-card__footer {\n    background: white;\n    padding: 1rem 0;\n    border-radius: 0 0 4px 4px;\n  }\n\n  .card-footer__forecast-item {\n    color: gray;\n    border-right: 1px solid lightgray;\n    width: 20%;\n  }\n\n  .forecast-item__date {\n    color: #888;\n  }\n\n  .forecast-item__temp--f {\n    color: navy;\n    font-size: 1.2em;\n    font-weight: bolder;\n  }\n\n  .forecast-item__temp--c {\n    color: #888;\n    font-size: .8em;\n    margin-top: .25em;\n  }\n\n  .card-footer__forecast-item span {\n    margin: .5em 0;\n  }\n\n  .card-footer__forecast-item:last-child {\n    border-right: none;\n  }";
  			div.className = "card-footer w-100 d-flex weather-app-card__footer";
  		},

  		m: function m(target, anchor) {
  			insertNode(div, target, anchor);

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(div, null);
  			}

  			insertNode(text_1, target, anchor);
  			insertNode(style, target, anchor);
  			current = true;
  		},

  		p: function p(changed, ctx) {
  			if (changed.forecast) {
  				each_value = ctx.forecast;

  				for (var i = 0; i < each_value.length; i += 1) {
  					var child_ctx = get_each_context(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(changed, child_ctx);
  					} else {
  						each_blocks[i] = create_each_block(component, child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(div, null);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}
  				each_blocks.length = each_value.length;
  			}
  		},

  		i: function i(target, anchor) {
  			if (current) { return; }
  			if (component.root._intro) {
  				if (div_transition) { div_transition.invalidate(); }

  				component.root._aftercreate.push(function () {
  					if (!div_transition) { div_transition = wrapTransition(component, div, fade_1$1, {}, true); }
  					div_transition.run(1);
  				});
  			}
  			this.m(target, anchor);
  		},

  		o: function o(outrocallback) {
  			if (!current) { return; }

  			if (!div_transition) { div_transition = wrapTransition(component, div, fade_1$1, {}, false); }
  			div_transition.run(0, function () {
  				outrocallback();
  				div_transition = null;
  			});

  			current = false;
  		},

  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			destroyEach(each_blocks, detach);

  			if (detach) {
  				detachNode(text_1);
  				detachNode(style);
  			}
  		}
  	};
  }

  function get_each_context(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.forecasts = list[i];
  	child_ctx.each_value = list;
  	child_ctx.forecasts_index = i;
  	return child_ctx;
  }

  function CardFooter(options) {
  	init(this, options);
  	this._state = assign({}, options.data);
  	this._intro = true;

  	if (!options.root) {
  		this._oncreate = [];
  		this._aftercreate = [];
  	}

  	this._fragment = create_main_fragment$2(this, this._state);

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		callAll(this._aftercreate);
  	}
  }

  assign(CardFooter.prototype, proto);

  /* src/App.html generated by Svelte v2.8.1 */

  function data() {
    return {
      weather: [],
      apiKey: ''
    }
  }
  var methods$1 = {
    getWeather: async function (value) {
      var initialState = this.get();
      if (!value.current.city) {
        // this resets the cardBody and cardFooter components
        return this.set({
          weather: [],
          apiKey: initialState.apiKey
        });
      }
      var results;
      try {
        results = await getFiveDayForecast(value.current);
      } catch (err) {
        results = ['City not found'];
      }
      return this.set({
        weather: results
      });
    }
  };

  function add_css$2() {
  	var style = createElement("style");
  	style.id = 'svelte-1j9k5mo-style';
  	style.textContent = ".weather-app-card.svelte-1j9k5mo{color:white;background-color:rgba(74, 144, 226,\n    0.75);box-shadow:0 0 .75rem rgba(0, 0, 0, 0.5);padding:0 0}";
  	appendNode(style, document.head);
  }

  function create_main_fragment$3(component, ctx) {
  	var main, section, div, text, text_1;

  	var cardheader = new CardHeader({
  		root: component.root,
  		store: component.store
  	});

  	cardheader.on("state", function(event) {
  		component.getWeather(event);
  	});

  	var cardbody_initial_data = { current: ctx.weather };
  	var cardbody = new CardBody({
  		root: component.root,
  		store: component.store,
  		data: cardbody_initial_data
  	});

  	var cardfooter_initial_data = { forecast: ctx.weather };
  	var cardfooter = new CardFooter({
  		root: component.root,
  		store: component.store,
  		data: cardfooter_initial_data
  	});

  	return {
  		c: function c() {
  			main = createElement("main");
  			section = createElement("section");
  			div = createElement("div");
  			cardheader._fragment.c();
  			text = createText("\n      ");
  			cardbody._fragment.c();
  			text_1 = createText("\n      ");
  			cardfooter._fragment.c();
  			div.className = "card col-6 weather-app-card svelte-1j9k5mo";
  			section.className = "col-12 d-flex justify-content-center";
  			main.className = "container";
  		},

  		m: function m(target, anchor) {
  			insertNode(main, target, anchor);
  			appendNode(section, main);
  			appendNode(div, section);
  			cardheader._mount(div, null);
  			appendNode(text, div);
  			cardbody._mount(div, null);
  			appendNode(text_1, div);
  			cardfooter._mount(div, null);
  		},

  		p: function p(changed, ctx) {
  			var cardbody_changes = {};
  			if (changed.weather) { cardbody_changes.current = ctx.weather; }
  			cardbody._set(cardbody_changes);

  			var cardfooter_changes = {};
  			if (changed.weather) { cardfooter_changes.forecast = ctx.weather; }
  			cardfooter._set(cardfooter_changes);
  		},

  		d: function d(detach) {
  			if (detach) {
  				detachNode(main);
  			}

  			cardheader.destroy();
  			cardbody.destroy();
  			cardfooter.destroy();
  		}
  	};
  }

  function App(options) {
  	init(this, options);
  	this._state = assign(data(), options.data);
  	this._intro = true;

  	if (!document.getElementById("svelte-1j9k5mo-style")) { add_css$2(); }

  	if (!options.root) {
  		this._oncreate = [];
  		this._beforecreate = [];
  		this._aftercreate = [];
  	}

  	this._fragment = create_main_fragment$3(this, this._state);

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		this._lock = true;
  		callAll(this._beforecreate);
  		callAll(this._oncreate);
  		callAll(this._aftercreate);
  		this._lock = false;
  	}
  }

  assign(App.prototype, proto);
  assign(App.prototype, methods$1);

  // Un-comment if you want to use Bootstrap js
  fetchKey();

  var app = new App({
    target: document.querySelector("#weather-app")
  });

  return app;

}());
//# sourceMappingURL=bundle.js.map
