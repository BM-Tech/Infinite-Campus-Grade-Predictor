
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Home.svelte generated by Svelte v3.44.2 */

    const { console: console_1$2 } = globals;
    const file$3 = "src\\Home.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (58:0) {#each classes as cl, i}
    function create_each_block$1(ctx) {
    	let button;
    	let nav;
    	let ul0;
    	let strong;
    	let t0_value = /*cl*/ ctx[6].details[0].task.courseName + "";
    	let t0;
    	let t1;
    	let ul1;
    	let t2_value = getGradeFromClass(/*cl*/ ctx[6].details) + "";
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*i*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			nav = element("nav");
    			ul0 = element("ul");
    			strong = element("strong");
    			t0 = text(t0_value);
    			t1 = space();
    			ul1 = element("ul");
    			t2 = text(t2_value);
    			add_location(strong, file$3, 60, 16, 1822);
    			add_location(ul0, file$3, 60, 12, 1818);
    			add_location(ul1, file$3, 61, 12, 1889);
    			add_location(nav, file$3, 59, 8, 1799);
    			add_location(button, file$3, 58, 4, 1750);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, nav);
    			append_dev(nav, ul0);
    			append_dev(ul0, strong);
    			append_dev(strong, t0);
    			append_dev(nav, t1);
    			append_dev(nav, ul1);
    			append_dev(ul1, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*classes*/ 1 && t0_value !== (t0_value = /*cl*/ ctx[6].details[0].task.courseName + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*classes*/ 1 && t2_value !== (t2_value = getGradeFromClass(/*cl*/ ctx[6].details) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(58:0) {#each classes as cl, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let br;
    	let t0;
    	let t1;
    	let a;
    	let mounted;
    	let dispose;
    	let each_value = /*classes*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			a = element("a");
    			a.textContent = "Open Playground";
    			add_location(br, file$3, 56, 0, 1714);
    			attr_dev(a, "href", "#1");
    			attr_dev(a, "role", "button");
    			attr_dev(a, "class", "secondary");
    			add_location(a, file$3, 66, 0, 1973);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t1, anchor);
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_1*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*openEditor, getGradeFromClass, classes*/ 5) {
    				each_value = /*classes*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t1.parentNode, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getGradeFromClass(details) {
    	let text = "";

    	for (let term of details) {
    		if (term.task.progressScore != undefined) {
    			text = term.task.progressScore + " (" + term.task.progressPercent + "%)";
    		}
    	}

    	return text;
    }

    function getPercentFromClass(details) {
    	let pct = 0;

    	for (let term of details) {
    		if (term.task.progressPercent != undefined) {
    			pct = term.task.progressPercent;
    		}
    	}

    	return pct;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	let { classes } = $$props;
    	const dispatch = createEventDispatcher();

    	function openEditor(index) {
    		dispatch('editor', { m: "openEditor", data: classes[index] });
    	}

    	let storageGrades = {};

    	for (let i = 0; i < classes.length; i++) {
    		let cname = classes[i].details[0].task.courseName;
    		storageGrades[cname] = getPercentFromClass(classes[i].details);
    	}

    	chrome.storage.local.get(['GRADES'], function (result) {
    		if (result.GRADES == undefined) {
    			result.GRADES = [];
    		}

    		result.GRADES.push({ date: new Date(), grades: storageGrades });

    		if (result.GRADES[result.GRADES.length - 1].grades != storageGrades || result.GRADES.length == 0) {
    			chrome.storage.local.set({ GRADES: result.GRADES }, function () {
    				console.log('Saved grades to storage');
    			});
    		}
    	});

    	window["cleargrades"] = function () {
    		chrome.storage.local.set({ GRADES: [] }, function () {
    			console.log('Cleared grades');
    		});
    	};

    	window["getgrades"] = function () {
    		console.log(classes);
    	};

    	const writable_props = ['classes'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => openEditor(i);

    	const click_handler_1 = () => {
    		dispatch('playground');
    	};

    	$$self.$$set = $$props => {
    		if ('classes' in $$props) $$invalidate(0, classes = $$props.classes);
    	};

    	$$self.$capture_state = () => ({
    		classes,
    		createEventDispatcher,
    		dispatch,
    		getGradeFromClass,
    		getPercentFromClass,
    		openEditor,
    		storageGrades
    	});

    	$$self.$inject_state = $$props => {
    		if ('classes' in $$props) $$invalidate(0, classes = $$props.classes);
    		if ('storageGrades' in $$props) storageGrades = $$props.storageGrades;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [classes, dispatch, openEditor, click_handler, click_handler_1];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { classes: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*classes*/ ctx[0] === undefined && !('classes' in props)) {
    			console_1$2.warn("<Home> was created without expected prop 'classes'");
    		}
    	}

    	get classes() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    class Category{
        constructor(weight, name){
            this.weight = weight;
            this.initialWeight = weight;
            this.name = name;
            this.assignments = [];
            this.equalWeighting = false;
        }

        addAssignment(assignment){
            this.assignments.push(assignment);
        }

        calculateGrade(equalWeighting, termSettings){
            let total = new Grade(0, 0);
            for(let a of this.assignments){
                let enabled = a.isEnabled(termSettings);
                if(!isNaN(a.score) && !isNaN(a.outof) && enabled){
                    if(!equalWeighting){
                        total.score += a.score;
                        total.outof += a.outof;
                    } else {
                        total.score += a.score/a.outof;
                        total.outof++;
                    }
                }
            }
            return total
        }

        getWeightedGrade(equalWeighting, termSettings){
            let total = this.calculateGrade(equalWeighting, termSettings);
            return total.getPercent() * this.weight / 100
        }

        alreadyExists(arr){
            for(let cat of arr){
                if(cat.name == this.name)
                    return {true: true, in: arr.indexOf(cat)}
            }
            return {true: false, in: -1}
        }

        toString(equalWeighting, termSettings){
            try{
                let pct = this.calculateGrade(equalWeighting, termSettings).toString();
                return this.name + " (Grade: " + pct + "%) (Weight: " + (this.weight).toFixed(2) + "%)"
            } catch(e){
                return this.name
            }
        }
    }

    class Grade{
        constructor(score, outof){
            this.score = score;
            this.outof = outof;
            this.percent = score / outof;
        }

        getPercent(){
            this.percent = this.score / this.outof;
            return this.percent
        }

        toString(){
            return (this.getPercent() * 100).toFixed(2)
    	}
    }

    class Assignment extends Grade{
        constructor(score, outof, name, origional, term){
            super(score, outof);
            this.name = name;
            this.origional = origional;
            this.term = term;
            this.exclude = false;
        }

        getOgGrade(){
            if(this.origional != undefined){
                if(this.origional == this.toString()){
                    return ""
                }
                return "(Original: " + this.origional + "%)"
            }
            return "(New assignment)"
        }

        getTerm(terms){
            return terms[this.term]
        }

        isEnabled(termSettings){
            if(termSettings == undefined || this.term == undefined){
                return true
            }
            if(this.exclude){
                return false
            }
            return termSettings[this.term]
        }
    }

    class Term{
        constructor(id, name, seq, start, end){
            this.id = id;
            this.name = name;
            this.seq = seq;
            let s = start.split('-');
            let e = end.split('-');
            this.start = new Date(s[0], s[1] - 1, s[2]);
            this.end = new Date(e[0], e[1] - 1, e[2]);
            // console.log(s, this.start, this.inRange())
        }

        inRange(){
            let now = Date.now();
            return (now >= this.start.getTime() && now < this.end.getTime())
        }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var frappeCharts_min_umd = createCommonjsModule(function (module, exports) {
    !function(t,e){module.exports=e();}(commonjsGlobal,function(){function t(t,e){return "string"==typeof t?(e||document).querySelector(t):t||null}function e(t){var e=t.getBoundingClientRect();return {top:e.top+(document.documentElement.scrollTop||document.body.scrollTop),left:e.left+(document.documentElement.scrollLeft||document.body.scrollLeft)}}function i(t){return null===t.offsetParent}function n(t){var e=t.getBoundingClientRect();return e.top>=0&&e.left>=0&&e.bottom<=(window.innerHeight||document.documentElement.clientHeight)&&e.right<=(window.innerWidth||document.documentElement.clientWidth)}function a(t){var e=window.getComputedStyle(t),i=parseFloat(e.paddingLeft)+parseFloat(e.paddingRight);return t.clientWidth-i}function s(t,e,i){var n=document.createEvent("HTMLEvents");n.initEvent(e,!0,!0);for(var a in i)n[a]=i[a];return t.dispatchEvent(n)}function r(t){return t.titleHeight+t.margins.top+t.paddings.top}function o(t){return t.margins.left+t.paddings.left}function l(t){return t.margins.top+t.margins.bottom+t.paddings.top+t.paddings.bottom+t.titleHeight+t.legendHeight}function u(t){return t.margins.left+t.margins.right+t.paddings.left+t.paddings.right}function h(t){return parseFloat(t.toFixed(2))}function c(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]&&arguments[3];i||(i=n?t[0]:t[t.length-1]);var a=new Array(Math.abs(e)).fill(i);return t=n?a.concat(t):t.concat(a)}function d(t,e){return (t+"").length*e}function p(t,e){return {x:Math.sin(t*Zt)*e,y:Math.cos(t*Zt)*e}}function f(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1];return !Number.isNaN(t)&&(void 0!==t&&(!!Number.isFinite(t)&&!(e&&t<0)))}function v(t){return Number(Math.round(t+"e4")+"e-4")}function g(t){var e=void 0,i=void 0,n=void 0;if(t instanceof Date)return new Date(t.getTime());if("object"!==(void 0===t?"undefined":Ft(t))||null===t)return t;e=Array.isArray(t)?[]:{};for(n in t)i=t[n],e[n]=g(i);return e}function m(t,e){var i=void 0,n=void 0;return t<=e?(i=e-t,n=t):(i=t-e,n=e),[i,n]}function y(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:e.length-t.length;return i>0?t=c(t,i):e=c(e,i),[t,e]}function b(t,e){if(t)return t.length>e?t.slice(0,e-3)+"...":t}function x(t){var e=void 0;if("number"==typeof t)e=t;else if("string"==typeof t&&(e=Number(t),Number.isNaN(e)))return t;var i=Math.floor(Math.log10(Math.abs(e)));if(i<=2)return e;var n=Math.floor(i/3),a=Math.pow(10,i-3*n)*+(e/Math.pow(10,i)).toFixed(1);return Math.round(100*a)/100+" "+["","K","M","B","T"][n]}function k(t,e){for(var i=[],n=0;n<t.length;n++)i.push([t[n],e[n]]);var a=function(t,e){var i=e[0]-t[0],n=e[1]-t[1];return {length:Math.sqrt(Math.pow(i,2)+Math.pow(n,2)),angle:Math.atan2(n,i)}},s=function(t,e,i,n){var s=a(e||t,i||t),r=s.angle+(n?Math.PI:0),o=.2*s.length;return [t[0]+Math.cos(r)*o,t[1]+Math.sin(r)*o]};return function(t,e){return t.reduce(function(t,i,n,a){return 0===n?i[0]+","+i[1]:t+" "+e(i,n,a)},"")}(i,function(t,e,i){var n=s(i[e-1],i[e-2],t),a=s(t,i[e-1],i[e+1],!0);return "C "+n[0]+","+n[1]+" "+a[0]+","+a[1]+" "+t[0]+","+t[1]})}function w(t){return t>255?255:t<0?0:t}function A(t,e){var i=ie(t),n=!1;"#"==i[0]&&(i=i.slice(1),n=!0);var a=parseInt(i,16),s=w((a>>16)+e),r=w((a>>8&255)+e),o=w((255&a)+e);return (n?"#":"")+(o|r<<8|s<<16).toString(16)}function P(t){var e=/(^\s*)(rgb|hsl)(a?)[(]\s*([\d.]+\s*%?)\s*,\s*([\d.]+\s*%?)\s*,\s*([\d.]+\s*%?)\s*(?:,\s*([\d.]+)\s*)?[)]$/i;return /(^\s*)(#)((?:[A-Fa-f0-9]{3}){1,2})$/i.test(t)||e.test(t)}function T(t,e){return "string"==typeof t?(e||document).querySelector(t):t||null}function L(t,e){var i=document.createElementNS("http://www.w3.org/2000/svg",t);for(var n in e){var a=e[n];if("inside"===n)T(a).appendChild(i);else if("around"===n){var s=T(a);s.parentNode.insertBefore(i,s),i.appendChild(s);}else "styles"===n?"object"===(void 0===a?"undefined":Ft(a))&&Object.keys(a).map(function(t){i.style[t]=a[t];}):("className"===n&&(n="class"),"innerHTML"===n?i.textContent=a:i.setAttribute(n,a));}return i}function O(t,e){return L("linearGradient",{inside:t,id:e,x1:0,x2:0,y1:0,y2:1})}function M(t,e,i,n){return L("stop",{inside:t,style:"stop-color: "+i,offset:e,"stop-opacity":n})}function C(t,e,i,n){return L("svg",{className:e,inside:t,width:i,height:n})}function D(t){return L("defs",{inside:t})}function N(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:void 0,n={className:t,transform:e};return i&&(n.inside=i),L("g",n)}function S(t){return L("path",{className:arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",d:t,styles:{stroke:arguments.length>2&&void 0!==arguments[2]?arguments[2]:"none",fill:arguments.length>3&&void 0!==arguments[3]?arguments[3]:"none","stroke-width":arguments.length>4&&void 0!==arguments[4]?arguments[4]:2}})}function E(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:1,s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:0,r=i.x+t.x,o=i.y+t.y,l=i.x+e.x,u=i.y+e.y;return "M"+i.x+" "+i.y+"\n\t\tL"+r+" "+o+"\n\t\tA "+n+" "+n+" 0 "+s+" "+(a?1:0)+"\n\t\t"+l+" "+u+" z"}function _(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:1,s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:0,r=i.x+t.x,o=i.y+t.y,l=i.x+e.x,u=2*i.y,h=i.y+e.y;return "M"+i.x+" "+i.y+"\n\t\tL"+r+" "+o+"\n\t\tA "+n+" "+n+" 0 "+s+" "+(a?1:0)+"\n\t\t"+l+" "+u+" z\n\t\tL"+r+" "+u+"\n\t\tA "+n+" "+n+" 0 "+s+" "+(a?1:0)+"\n\t\t"+l+" "+h+" z"}function z(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:1,s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:0,r=i.x+t.x,o=i.y+t.y,l=i.x+e.x,u=i.y+e.y;return "M"+r+" "+o+"\n\t\tA "+n+" "+n+" 0 "+s+" "+(a?1:0)+"\n\t\t"+l+" "+u}function W(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:1,s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:0,r=i.x+t.x,o=i.y+t.y,l=i.x+e.x,u=2*n+o,h=i.y+t.y;return "M"+r+" "+o+"\n\t\tA "+n+" "+n+" 0 "+s+" "+(a?1:0)+"\n\t\t"+l+" "+u+"\n\t\tM"+r+" "+u+"\n\t\tA "+n+" "+n+" 0 "+s+" "+(a?1:0)+"\n\t\t"+l+" "+h}function j(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n="path-fill-gradient-"+e+"-"+(i?"lighter":"default"),a=O(t,n),s=[1,.6,.2];return i&&(s=[.4,.2,0]),M(a,"0%",e,s[0]),M(a,"50%",e,s[1]),M(a,"100%",e,s[2]),n}function F(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:Jt,s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:"none";return L("rect",{className:"percentage-bar",x:t,y:e,width:i,height:n,fill:s,styles:{stroke:A(s,-25),"stroke-dasharray":"0, "+(n+i)+", "+i+", "+n,"stroke-width":a}})}function H(t,e,i,n,a){var s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:"none",r=arguments.length>6&&void 0!==arguments[6]?arguments[6]:{},o={className:t,x:e,y:i,width:n,height:n,rx:a,fill:s};return Object.keys(r).map(function(t){o[t]=r[t];}),L("rect",o)}function I(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"none",a=arguments[4];a=arguments.length>5&&void 0!==arguments[5]&&arguments[5]?b(a,se):a;var s={className:"legend-bar",x:0,y:0,width:i,height:"2px",fill:n},r=L("text",{className:"legend-dataset-text",x:0,y:0,dy:2*re+"px","font-size":1.2*re+"px","text-anchor":"start",fill:le,innerHTML:a}),o=L("g",{transform:"translate("+t+", "+e+")"});return o.appendChild(L("rect",s)),o.appendChild(r),o}function R(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"none",a=arguments[4];a=arguments.length>5&&void 0!==arguments[5]&&arguments[5]?b(a,se):a;var s={className:"legend-dot",cx:0,cy:0,r:i,fill:n},r=L("text",{className:"legend-dataset-text",x:0,y:0,dx:re+"px",dy:re/3+"px","font-size":1.2*re+"px","text-anchor":"start",fill:le,innerHTML:a}),o=L("g",{transform:"translate("+t+", "+e+")"});return o.appendChild(L("circle",s)),o.appendChild(r),o}function Y(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:{},s=a.fontSize||re;return L("text",{className:t,x:e,y:i,dy:(void 0!==a.dy?a.dy:s/2)+"px","font-size":s+"px",fill:a.fill||le,"text-anchor":a.textAnchor||"start",innerHTML:n})}function B(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:{};a.stroke||(a.stroke=oe);var s=L("line",{className:"line-vertical "+a.className,x1:0,x2:0,y1:i,y2:n,styles:{stroke:a.stroke}}),r=L("text",{x:0,y:i>n?i+ae:i-ae-re,dy:re+"px","font-size":re+"px","text-anchor":"middle",innerHTML:e+""}),o=L("g",{transform:"translate("+t+", 0)"});return o.appendChild(s),o.appendChild(r),o}function V(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:{};a.stroke||(a.stroke=oe),a.lineType||(a.lineType=""),a.shortenNumbers&&(e=x(e));var s=L("line",{className:"line-horizontal "+a.className+("dashed"===a.lineType?"dashed":""),x1:i,x2:n,y1:0,y2:0,styles:{stroke:a.stroke}}),r=L("text",{x:i<n?i-ae:i+ae,y:0,dy:re/2-2+"px","font-size":re+"px","text-anchor":i<n?"end":"start",innerHTML:e+""}),o=L("g",{transform:"translate(0, "+t+")","stroke-opacity":1});return 0!==r&&"0"!==r||(o.style.stroke="rgba(27, 31, 35, 0.6)"),o.appendChild(s),o.appendChild(r),o}function U(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{};f(t)||(t=0),n.pos||(n.pos="left"),n.offset||(n.offset=0),n.mode||(n.mode="span"),n.stroke||(n.stroke=oe),n.className||(n.className="");var a=-1*ne,s="span"===n.mode?i+ne:0;return "tick"===n.mode&&"right"===n.pos&&(a=i+ne,s=i),a+=n.offset,s+=n.offset,V(t,e,a,s,{stroke:n.stroke,className:n.className,lineType:n.lineType,shortenNumbers:n.shortenNumbers})}function G(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{};f(t)||(t=0),n.pos||(n.pos="bottom"),n.offset||(n.offset=0),n.mode||(n.mode="span"),n.stroke||(n.stroke=oe),n.className||(n.className="");var a=i+ne,s="span"===n.mode?-1*ne:i;return "tick"===n.mode&&"top"===n.pos&&(a=-1*ne,s=0),B(t,e,a,s,{stroke:n.stroke,className:n.className,lineType:n.lineType})}function q(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{};n.labelPos||(n.labelPos="right");var a=L("text",{className:"chart-label",x:"left"===n.labelPos?ae:i-d(e,5)-ae,y:0,dy:re/-2+"px","font-size":re+"px","text-anchor":"start",innerHTML:e+""}),s=V(t,"",0,i,{stroke:n.stroke||oe,className:n.className||"",lineType:n.lineType});return s.appendChild(a),s}function X(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:{},s=t-e,r=L("rect",{className:"bar mini",styles:{fill:"rgba(228, 234, 239, 0.49)",stroke:oe,"stroke-dasharray":i+", "+s},x:0,y:0,width:i,height:s});a.labelPos||(a.labelPos="right");var o=L("text",{className:"chart-label",x:"left"===a.labelPos?ae:i-d(n+"",4.5)-ae,y:0,dy:re/-2+"px","font-size":re+"px","text-anchor":"start",innerHTML:n+""}),l=L("g",{transform:"translate(0, "+e+")"});return l.appendChild(r),l.appendChild(o),l}function J(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:"",s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:0,r=arguments.length>6&&void 0!==arguments[6]?arguments[6]:0,o=arguments.length>7&&void 0!==arguments[7]?arguments[7]:{},l=m(e,o.zeroLine),u=Vt(l,2),h=u[0],c=u[1];c-=r,0===h&&(h=o.minHeight,c-=o.minHeight),f(t)||(t=0),f(c)||(c=0),f(h,!0)||(h=0),f(i,!0)||(i=0);var d=L("rect",{className:"bar mini",style:"fill: "+n,"data-point-index":s,x:t,y:c,width:i,height:h});if((a+="")||a.length){d.setAttribute("y",0),d.setAttribute("x",0);var p=L("text",{className:"data-point-value",x:i/2,y:0,dy:re/2*-1+"px","font-size":re+"px","text-anchor":"middle",innerHTML:a}),v=L("g",{"data-point-index":s,transform:"translate("+t+", "+c+")"});return v.appendChild(d),v.appendChild(p),v}return d}function K(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:"",s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:0,r=L("circle",{style:"fill: "+n,"data-point-index":s,cx:t,cy:e,r:i});if((a+="")||a.length){r.setAttribute("cy",0),r.setAttribute("cx",0);var o=L("text",{className:"data-point-value",x:0,y:0,dy:re/2*-1-i+"px","font-size":re+"px","text-anchor":"middle",innerHTML:a}),l=L("g",{"data-point-index":s,transform:"translate("+t+", "+e+")"});return l.appendChild(r),l.appendChild(o),l}return r}function $(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{},a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:{},s=e.map(function(e,i){return t[i]+","+e}).join("L");n.spline&&(s=k(t,e));var r=S("M"+s,"line-graph-path",i);if(n.heatline){var o=j(a.svgDefs,i);r.style.stroke="url(#"+o+")";}var l={path:r};if(n.regionFill){var u=j(a.svgDefs,i,!0),h="M"+t[0]+","+a.zeroLine+"L"+s+"L"+t.slice(-1)[0]+","+a.zeroLine;l.region=S(h,"region-fill","none","url(#"+u+")");}return l}function Q(t,e,i,n){var a="string"==typeof e?e:e.join(", ");return [t,{transform:i.join(", ")},n,ve,"translate",{transform:a}]}function Z(t,e,i){return Q(t,[i,0],[e,0],pe)}function tt(t,e,i){return Q(t,[0,i],[0,e],pe)}function et(t,e,i,n){var a=e-i,s=t.childNodes[0];return [[s,{height:a,"stroke-dasharray":s.getAttribute("width")+", "+a},pe,ve],Q(t,[0,n],[0,i],pe)]}function it(t,e,i,n){var a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:0,s=m(i,(arguments.length>5&&void 0!==arguments[5]?arguments[5]:{}).zeroLine),r=Vt(s,2),o=r[0],l=r[1];return l-=a,"rect"!==t.nodeName?[[t.childNodes[0],{width:n,height:o},ce,ve],Q(t,t.getAttribute("transform").split("(")[1].slice(0,-1),[e,l],pe)]:[[t,{width:n,height:o,x:e,y:l},ce,ve]]}function nt(t,e,i){return "circle"!==t.nodeName?[Q(t,t.getAttribute("transform").split("(")[1].slice(0,-1),[e,i],pe)]:[[t,{cx:e,cy:i},ce,ve]]}function at(t,e,i,n,a){var s=[],r=i.map(function(t,i){return e[i]+","+t}).join("L");a&&(r=k(e,i));var o=[t.path,{d:"M"+r},de,ve];if(s.push(o),t.region){var l=e[0]+","+n+"L",u="L"+e.slice(-1)[0]+", "+n,h=[t.region,{d:"M"+l+r+u},de,ve];s.push(h);}return s}function st(t,e){return [t,{d:e},ce,ve]}function rt(t,e,i){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"linear",a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:void 0,s=arguments.length>5&&void 0!==arguments[5]?arguments[5]:{},r=t.cloneNode(!0),o=t.cloneNode(!0);for(var l in e){var u=void 0;u="transform"===l?document.createElementNS("http://www.w3.org/2000/svg","animateTransform"):document.createElementNS("http://www.w3.org/2000/svg","animate");var h=s[l]||t.getAttribute(l),c=e[l],d={attributeName:l,from:h,to:c,begin:"0s",dur:i/1e3+"s",values:h+";"+c,keySplines:ge[n],keyTimes:"0;1",calcMode:"spline",fill:"freeze"};a&&(d.type=a);for(var p in d)u.setAttribute(p,d[p]);r.appendChild(u),a?o.setAttribute(l,"translate("+c+")"):o.setAttribute(l,c);}return [r,o]}function ot(t,e){t.style.transform=e,t.style.webkitTransform=e,t.style.msTransform=e,t.style.mozTransform=e,t.style.oTransform=e;}function lt(t,e){var i=[],n=[];e.map(function(t){var e=t[0],a=e.parentNode,s=void 0,r=void 0;t[0]=e;var o=rt.apply(void 0,Ut(t)),l=Vt(o,2);s=l[0],r=l[1],i.push(r),n.push([s,a]),a&&a.replaceChild(s,e);});var a=t.cloneNode(!0);return n.map(function(t,n){t[1]&&(t[1].replaceChild(i[n],t[0]),e[n][0]=i[n]);}),a}function ut(t,e,i){if(0!==i.length){var n=lt(e,i);e.parentNode==t&&(t.removeChild(e),t.appendChild(n)),setTimeout(function(){n.parentNode==t&&(t.removeChild(n),t.appendChild(e));},fe);}}function ht(t,e){var i=document.createElement("a");i.style="display: none";var n=new Blob(e,{type:"image/svg+xml; charset=utf-8"}),a=window.URL.createObjectURL(n);i.href=a,i.download=t,document.body.appendChild(i),i.click(),setTimeout(function(){document.body.removeChild(i),window.URL.revokeObjectURL(a);},300);}function ct(e){var i=e.cloneNode(!0);i.classList.add("chart-container"),i.setAttribute("xmlns","http://www.w3.org/2000/svg"),i.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");var n=t.create("style",{innerHTML:me});i.insertBefore(n,i.firstChild);var a=t.create("div");return a.appendChild(i),a.innerHTML}function dt(t){var e=new Date(t);return e.setMinutes(e.getMinutes()-e.getTimezoneOffset()),e}function pt(t){var e=t.getDate(),i=t.getMonth()+1;return [t.getFullYear(),(i>9?"":"0")+i,(e>9?"":"0")+e].join("-")}function ft(t){return new Date(t.getTime())}function vt(t,e){var i=xt(t);return Math.ceil(gt(i,e)/xe)}function gt(t,e){var i=we*ke;return (dt(e)-dt(t))/i}function mt(t,e){return t.getMonth()===e.getMonth()&&t.getFullYear()===e.getFullYear()}function yt(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1],i=Ae[t];return e?i.slice(0,3):i}function bt(t,e){return new Date(e,t+1,0)}function xt(t){var e=ft(t),i=e.getDay();return 0!==i&&kt(e,-1*i),e}function kt(t,e){t.setDate(t.getDate()+e);}function wt(t,e,i){var n=Object.keys(Le).filter(function(e){return t.includes(e)}),a=Le[n[0]];return Object.assign(a,{constants:e,getData:i}),new Te(a)}function At(t){if(0===t)return [0,0];if(isNaN(t))return {mantissa:-6755399441055744,exponent:972};var e=t>0?1:-1;if(!isFinite(t))return {mantissa:4503599627370496*e,exponent:972};t=Math.abs(t);var i=Math.floor(Math.log10(t));return [e*(t/Math.pow(10,i)),i]}function Pt(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,i=Math.ceil(t),n=Math.floor(e),a=i-n,s=a,r=1;a>5&&(a%2!=0&&(a=++i-n),s=a/2,r=2),a<=2&&(r=a/(s=4)),0===a&&(s=5,r=1);for(var o=[],l=0;l<=s;l++)o.push(n+r*l);return o}function Tt(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,i=At(t),n=Vt(i,2),a=n[0],s=n[1],r=e?e/Math.pow(10,s):0,o=Pt(a=a.toFixed(6),r);return o=o.map(function(t){return t*Math.pow(10,s)})}function Lt(t){function e(t,e){for(var i=Tt(t),n=i[1]-i[0],a=0,s=1;a<e;s++)a+=n,i.unshift(-1*a);return i}var i=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=Math.max.apply(Math,Ut(t)),a=Math.min.apply(Math,Ut(t)),s=[];if(n>=0&&a>=0)At(n)[1],s=i?Tt(n,a):Tt(n);else if(n>0&&a<0){var r=Math.abs(a);n>=r?(At(n)[1],s=e(n,r)):(At(r)[1],s=e(r,n).reverse().map(function(t){return -1*t}));}else if(n<=0&&a<=0){var o=Math.abs(a),l=Math.abs(n);At(o)[1],s=(s=i?Tt(o,l):Tt(o)).reverse().map(function(t){return -1*t});}return s}function Ot(t){var e=Mt(t);return t.indexOf(0)>=0?t.indexOf(0):t[0]>0?-1*t[0]/e:-1*t[t.length-1]/e+(t.length-1)}function Mt(t){return t[1]-t[0]}function Ct(t){return t[t.length-1]-t[0]}function Dt(t,e){return h(e.zeroLine-t*e.scaleMultiplier)}function Nt(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n=e.reduce(function(e,i){return Math.abs(i-t)<Math.abs(e-t)?i:e},[]);return i?e.indexOf(n):n}function St(t,e){for(var i=Math.max.apply(Math,Ut(t)),n=1/(e-1),a=[],s=0;s<e;s++){var r=i*(n*s);a.push(r);}return a}function Et(t,e){return e.filter(function(e){return e<t}).length}function _t(t,e){t.labels=t.labels||[];var i=t.labels.length,n=t.datasets,a=new Array(i).fill(0);return n||(n=[{values:a}]),n.map(function(t){if(t.values){var n=t.values;n=(n=n.map(function(t){return isNaN(t)?0:t})).length>i?n.slice(0,i):c(n,i-n.length,0),t.values=n;}else t.values=a;t.chartType||(t.chartType=e);}),t.yRegions&&t.yRegions.map(function(t){if(t.end<t.start){var e=[t.end,t.start];t.start=e[0],t.end=e[1];}}),t}function zt(t){var e=t.labels.length,i=new Array(e).fill(0),n={labels:t.labels.slice(0,-1),datasets:t.datasets.map(function(t){return {name:"",values:i.slice(0,-1),chartType:t.chartType}})};return t.yMarkers&&(n.yMarkers=[{value:0,label:""}]),t.yRegions&&(n.yRegions=[{start:0,end:0,label:""}]),n}function Wt(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],i=!(arguments.length>2&&void 0!==arguments[2])||arguments[2],n=t/e.length;n<=0&&(n=1);var a=n/Kt,s=void 0;if(i){var r=Math.max.apply(Math,Ut(e.map(function(t){return t.length})));s=Math.ceil(r/a);}return e.map(function(t,e){return (t+="").length>a&&(i?e%s!=0&&(t=""):t=a-3>0?t.slice(0,a-3)+" ...":t.slice(0,a)+".."),t})}function jt(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"line",e=arguments[1],i=arguments[2];return "axis-mixed"===t?(i.type="line",new De(e,i)):Se[t]?new Se[t](e,i):void console.error("Undefined chart type: "+t)}!function(t,e){void 0===e&&(e={});var i=e.insertAt;if(t&&"undefined"!=typeof document){var n=document.head||document.getElementsByTagName("head")[0],a=document.createElement("style");a.type="text/css","top"===i&&n.firstChild?n.insertBefore(a,n.firstChild):n.appendChild(a),a.styleSheet?a.styleSheet.cssText=t:a.appendChild(document.createTextNode(t));}}('.chart-container{position:relative;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif}.chart-container .axis,.chart-container .chart-label{fill:#555b51}.chart-container .axis line,.chart-container .chart-label line{stroke:#dadada}.chart-container .dataset-units circle{stroke:#fff;stroke-width:2}.chart-container .dataset-units path{fill:none;stroke-opacity:1;stroke-width:2px}.chart-container .dataset-path{stroke-width:2px}.chart-container .path-group path{fill:none;stroke-opacity:1;stroke-width:2px}.chart-container line.dashed{stroke-dasharray:5,3}.chart-container .axis-line .specific-value{text-anchor:start}.chart-container .axis-line .y-line{text-anchor:end}.chart-container .axis-line .x-line{text-anchor:middle}.chart-container .legend-dataset-text{fill:#6c7680;font-weight:600}.graph-svg-tip{position:absolute;z-index:99999;padding:10px;font-size:12px;color:#959da5;text-align:center;background:rgba(0,0,0,.8);border-radius:3px}.graph-svg-tip ol,.graph-svg-tip ul{padding-left:0;display:-webkit-box;display:-ms-flexbox;display:flex}.graph-svg-tip ul.data-point-list li{min-width:90px;-webkit-box-flex:1;-ms-flex:1;flex:1;font-weight:600}.graph-svg-tip strong{color:#dfe2e5;font-weight:600}.graph-svg-tip .svg-pointer{position:absolute;height:5px;margin:0 0 0 -5px;content:" ";border:5px solid transparent;border-top-color:rgba(0,0,0,.8)}.graph-svg-tip.comparison{padding:0;text-align:left;pointer-events:none}.graph-svg-tip.comparison .title{display:block;padding:10px;margin:0;font-weight:600;line-height:1;pointer-events:none}.graph-svg-tip.comparison ul{margin:0;white-space:nowrap;list-style:none}.graph-svg-tip.comparison li{display:inline-block;padding:5px 10px}');var Ft="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},Ht=(function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}),It=function(){function t(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n);}}return function(e,i,n){return i&&t(e.prototype,i),n&&t(e,n),e}}(),Rt=function t(e,i,n){null===e&&(e=Function.prototype);var a=Object.getOwnPropertyDescriptor(e,i);if(void 0===a){var s=Object.getPrototypeOf(e);return null===s?void 0:t(s,i,n)}if("value"in a)return a.value;var r=a.get;if(void 0!==r)return r.call(n)},Yt=function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e);},Bt=function(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !e||"object"!=typeof e&&"function"!=typeof e?t:e},Vt=function(){function t(t,e){var i=[],n=!0,a=!1,s=void 0;try{for(var r,o=t[Symbol.iterator]();!(n=(r=o.next()).done)&&(i.push(r.value),!e||i.length!==e);n=!0);}catch(t){a=!0,s=t;}finally{try{!n&&o.return&&o.return();}finally{if(a)throw s}}return i}return function(e,i){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return t(e,i);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),Ut=function(t){if(Array.isArray(t)){for(var e=0,i=Array(t.length);e<t.length;e++)i[e]=t[e];return i}return Array.from(t)};t.create=function(e,i){var n=document.createElement(e);for(var a in i){var s=i[a];if("inside"===a)t(s).appendChild(n);else if("around"===a){var r=t(s);r.parentNode.insertBefore(n,r),n.appendChild(r);}else "styles"===a?"object"===(void 0===s?"undefined":Ft(s))&&Object.keys(s).map(function(t){n.style[t]=s[t];}):a in n?n[a]=s:n.setAttribute(a,s);}return n};var Gt={margins:{top:10,bottom:10,left:20,right:20},paddings:{top:20,bottom:40,left:30,right:10},baseHeight:240,titleHeight:20,legendHeight:30,titleFontSize:12},qt=700,Jt=2,Kt=7,$t=["light-blue","blue","violet","red","orange","yellow","green","light-green","purple","magenta","light-grey","dark-grey"],Qt={bar:$t,line:$t,pie:$t,percentage:$t,heatmap:["#ebedf0","#c6e48b","#7bc96f","#239a3b","#196127"],donut:$t},Zt=Math.PI/180,te=function(){function e(t){var i=t.parent,n=void 0===i?null:i,a=t.colors,s=void 0===a?[]:a;Ht(this,e),this.parent=n,this.colors=s,this.titleName="",this.titleValue="",this.listValues=[],this.titleValueFirst=0,this.x=0,this.y=0,this.top=0,this.left=0,this.setup();}return It(e,[{key:"setup",value:function(){this.makeTooltip();}},{key:"refresh",value:function(){this.fill(),this.calcPosition();}},{key:"makeTooltip",value:function(){var e=this;this.container=t.create("div",{inside:this.parent,className:"graph-svg-tip comparison",innerHTML:'<span class="title"></span>\n\t\t\t\t<ul class="data-point-list"></ul>\n\t\t\t\t<div class="svg-pointer"></div>'}),this.hideTip(),this.title=this.container.querySelector(".title"),this.dataPointList=this.container.querySelector(".data-point-list"),this.parent.addEventListener("mouseleave",function(){e.hideTip();});}},{key:"fill",value:function(){var e=this,i=void 0;this.index&&this.container.setAttribute("data-point-index",this.index),i=this.titleValueFirst?"<strong>"+this.titleValue+"</strong>"+this.titleName:this.titleName+"<strong>"+this.titleValue+"</strong>",this.title.innerHTML=i,this.dataPointList.innerHTML="",this.listValues.map(function(i,n){var a=e.colors[n]||"black",s=0===i.formatted||i.formatted?i.formatted:i.value,r=t.create("li",{styles:{"border-top":"3px solid "+a},innerHTML:'<strong style="display: block;">'+(0===s||s?s:"")+"</strong>\n\t\t\t\t\t"+(i.title?i.title:"")});e.dataPointList.appendChild(r);});}},{key:"calcPosition",value:function(){var t=this.container.offsetWidth;this.top=this.y-this.container.offsetHeight-5,this.left=this.x-t/2;var e=this.parent.offsetWidth-t,i=this.container.querySelector(".svg-pointer");if(this.left<0)i.style.left="calc(50% - "+-1*this.left+"px)",this.left=0;else if(this.left>e){var n="calc(50% + "+(this.left-e)+"px)";i.style.left=n,this.left=e;}else i.style.left="50%";}},{key:"setValues",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:[],a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:-1;this.titleName=i.name,this.titleValue=i.value,this.listValues=n,this.x=t,this.y=e,this.titleValueFirst=i.valueFirst||0,this.index=a,this.refresh();}},{key:"hideTip",value:function(){this.container.style.top="0px",this.container.style.left="0px",this.container.style.opacity="0";}},{key:"showTip",value:function(){this.container.style.top=this.top+"px",this.container.style.left=this.left+"px",this.container.style.opacity="1";}}]),e}(),ee={"light-blue":"#7cd6fd",blue:"#5e64ff",violet:"#743ee2",red:"#ff5858",orange:"#ffa00a",yellow:"#feef72",green:"#28a745","light-green":"#98d85b",purple:"#b554ff",magenta:"#ffa3ef",black:"#36114C",grey:"#bdd3e6","light-grey":"#f0f4f7","dark-grey":"#b8c2cc"},ie=function(t){return /rgb[a]{0,1}\([\d, ]+\)/gim.test(t)?/\D+(\d*)\D+(\d*)\D+(\d*)/gim.exec(t).map(function(t,e){return 0!==e?Number(t).toString(16):"#"}).reduce(function(t,e){return ""+t+e}):ee[t]||t},ne=6,ae=4,se=15,re=10,oe="#dadada",le="#555b51",ue={bar:function(t){var e=void 0;"rect"!==t.nodeName&&(e=t.getAttribute("transform"),t=t.childNodes[0]);var i=t.cloneNode();return i.style.fill="#000000",i.style.opacity="0.4",e&&i.setAttribute("transform",e),i},dot:function(t){var e=void 0;"circle"!==t.nodeName&&(e=t.getAttribute("transform"),t=t.childNodes[0]);var i=t.cloneNode(),n=t.getAttribute("r"),a=t.getAttribute("fill");return i.setAttribute("r",parseInt(n)+4),i.setAttribute("fill",a),i.style.opacity="0.6",e&&i.setAttribute("transform",e),i},heat_square:function(t){var e=void 0;"circle"!==t.nodeName&&(e=t.getAttribute("transform"),t=t.childNodes[0]);var i=t.cloneNode(),n=t.getAttribute("r"),a=t.getAttribute("fill");return i.setAttribute("r",parseInt(n)+4),i.setAttribute("fill",a),i.style.opacity="0.6",e&&i.setAttribute("transform",e),i}},he={bar:function(t,e){var i=void 0;"rect"!==t.nodeName&&(i=t.getAttribute("transform"),t=t.childNodes[0]);var n=["x","y","width","height"];Object.values(t.attributes).filter(function(t){return n.includes(t.name)&&t.specified}).map(function(t){e.setAttribute(t.name,t.nodeValue);}),i&&e.setAttribute("transform",i);},dot:function(t,e){var i=void 0;"circle"!==t.nodeName&&(i=t.getAttribute("transform"),t=t.childNodes[0]);var n=["cx","cy"];Object.values(t.attributes).filter(function(t){return n.includes(t.name)&&t.specified}).map(function(t){e.setAttribute(t.name,t.nodeValue);}),i&&e.setAttribute("transform",i);},heat_square:function(t,e){var i=void 0;"circle"!==t.nodeName&&(i=t.getAttribute("transform"),t=t.childNodes[0]);var n=["cx","cy"];Object.values(t.attributes).filter(function(t){return n.includes(t.name)&&t.specified}).map(function(t){e.setAttribute(t.name,t.nodeValue);}),i&&e.setAttribute("transform",i);}},ce=350,de=350,pe=ce,fe=250,ve="easein",ge={ease:"0.25 0.1 0.25 1",linear:"0 0 1 1",easein:"0.1 0.8 0.2 1",easeout:"0 0 0.58 1",easeinout:"0.42 0 0.58 1"},me=".chart-container{position:relative;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif}.chart-container .axis,.chart-container .chart-label{fill:#555b51}.chart-container .axis line,.chart-container .chart-label line{stroke:#dadada}.chart-container .dataset-units circle{stroke:#fff;stroke-width:2}.chart-container .dataset-units path{fill:none;stroke-opacity:1;stroke-width:2px}.chart-container .dataset-path{stroke-width:2px}.chart-container .path-group path{fill:none;stroke-opacity:1;stroke-width:2px}.chart-container line.dashed{stroke-dasharray:5,3}.chart-container .axis-line .specific-value{text-anchor:start}.chart-container .axis-line .y-line{text-anchor:end}.chart-container .axis-line .x-line{text-anchor:middle}.chart-container .legend-dataset-text{fill:#6c7680;font-weight:600}.graph-svg-tip{position:absolute;z-index:99999;padding:10px;font-size:12px;color:#959da5;text-align:center;background:rgba(0,0,0,.8);border-radius:3px}.graph-svg-tip ul{padding-left:0;display:flex}.graph-svg-tip ol{padding-left:0;display:flex}.graph-svg-tip ul.data-point-list li{min-width:90px;flex:1;font-weight:600}.graph-svg-tip strong{color:#dfe2e5;font-weight:600}.graph-svg-tip .svg-pointer{position:absolute;height:5px;margin:0 0 0 -5px;content:' ';border:5px solid transparent;border-top-color:rgba(0,0,0,.8)}.graph-svg-tip.comparison{padding:0;text-align:left;pointer-events:none}.graph-svg-tip.comparison .title{display:block;padding:10px;margin:0;font-weight:600;line-height:1;pointer-events:none}.graph-svg-tip.comparison ul{margin:0;white-space:nowrap;list-style:none}.graph-svg-tip.comparison li{display:inline-block;padding:5px 10px}",ye=function(){function e(t,i){if(Ht(this,e),i=g(i),this.parent="string"==typeof t?document.querySelector(t):t,!(this.parent instanceof HTMLElement))throw new Error("No `parent` element to render on was provided.");this.rawChartArgs=i,this.title=i.title||"",this.type=i.type||"",this.realData=this.prepareData(i.data),this.data=this.prepareFirstData(this.realData),this.colors=this.validateColors(i.colors,this.type),this.config={showTooltip:1,showLegend:1,isNavigable:i.isNavigable||0,animate:void 0!==i.animate?i.animate:1,truncateLegends:i.truncateLegends||1},this.measures=JSON.parse(JSON.stringify(Gt));var n=this.measures;this.setMeasures(i),this.title.length||(n.titleHeight=0),this.config.showLegend||(n.legendHeight=0),this.argHeight=i.height||n.baseHeight,this.state={},this.options={},this.initTimeout=qt,this.config.isNavigable&&(this.overlays=[]),this.configure(i);}return It(e,[{key:"prepareData",value:function(t){return t}},{key:"prepareFirstData",value:function(t){return t}},{key:"validateColors",value:function(t,e){var i=[];return (t=(t||[]).concat(Qt[e])).forEach(function(t){var e=ie(t);P(e)?i.push(e):console.warn('"'+t+'" is not a valid color.');}),i}},{key:"setMeasures",value:function(){}},{key:"configure",value:function(){var t=this,e=this.argHeight;this.baseHeight=e,this.height=e-l(this.measures),this.boundDrawFn=function(){return t.draw(!0)},ResizeObserver&&(this.resizeObserver=new ResizeObserver(this.boundDrawFn),this.resizeObserver.observe(this.parent)),window.addEventListener("resize",this.boundDrawFn),window.addEventListener("orientationchange",this.boundDrawFn);}},{key:"destroy",value:function(){this.resizeObserver&&this.resizeObserver.disconnect(),window.removeEventListener("resize",this.boundDrawFn),window.removeEventListener("orientationchange",this.boundDrawFn);}},{key:"setup",value:function(){this.makeContainer(),this.updateWidth(),this.makeTooltip(),this.draw(!1,!0);}},{key:"makeContainer",value:function(){this.parent.innerHTML="";var e={inside:this.parent,className:"chart-container"};this.independentWidth&&(e.styles={width:this.independentWidth+"px"}),this.container=t.create("div",e);}},{key:"makeTooltip",value:function(){this.tip=new te({parent:this.container,colors:this.colors}),this.bindTooltip();}},{key:"bindTooltip",value:function(){}},{key:"draw",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]&&arguments[0],n=arguments.length>1&&void 0!==arguments[1]&&arguments[1];e&&i(this.parent)||(this.updateWidth(),this.calc(e),this.makeChartArea(),this.setupComponents(),this.components.forEach(function(e){return e.setup(t.drawArea)}),this.render(this.components,!1),n&&(this.data=this.realData,setTimeout(function(){t.update(t.data);},this.initTimeout)),this.renderLegend(),this.setupNavigation(n));}},{key:"calc",value:function(){}},{key:"updateWidth",value:function(){this.baseWidth=a(this.parent),this.width=this.baseWidth-u(this.measures);}},{key:"makeChartArea",value:function(){this.svg&&this.container.removeChild(this.svg);var t=this.measures;this.svg=C(this.container,"frappe-chart chart",this.baseWidth,this.baseHeight),this.svgDefs=D(this.svg),this.title.length&&(this.titleEL=Y("title",t.margins.left,t.margins.top,this.title,{fontSize:t.titleFontSize,fill:"#666666",dy:t.titleFontSize}));var e=r(t);this.drawArea=N(this.type+"-chart chart-draw-area","translate("+o(t)+", "+e+")"),this.config.showLegend&&(e+=this.height+t.paddings.bottom,this.legendArea=N("chart-legend","translate("+o(t)+", "+e+")")),this.title.length&&this.svg.appendChild(this.titleEL),this.svg.appendChild(this.drawArea),this.config.showLegend&&this.svg.appendChild(this.legendArea),this.updateTipOffset(o(t),r(t));}},{key:"updateTipOffset",value:function(t,e){this.tip.offset={x:t,y:e};}},{key:"setupComponents",value:function(){this.components=new Map;}},{key:"update",value:function(t){t||console.error("No data to update."),this.data=this.prepareData(t),this.calc(),this.render(this.components,this.config.animate),this.renderLegend();}},{key:"render",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.components,i=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];this.config.isNavigable&&this.overlays.map(function(t){return t.parentNode.removeChild(t)});var n=[];e.forEach(function(t){n=n.concat(t.update(i));}),n.length>0?(ut(this.container,this.svg,n),setTimeout(function(){e.forEach(function(t){return t.make()}),t.updateNav();},400)):(e.forEach(function(t){return t.make()}),this.updateNav());}},{key:"updateNav",value:function(){this.config.isNavigable&&(this.makeOverlay(),this.bindUnits());}},{key:"renderLegend",value:function(){}},{key:"setupNavigation",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];this.config.isNavigable&&e&&(this.bindOverlay(),this.keyActions={13:this.onEnterKey.bind(this),37:this.onLeftArrow.bind(this),38:this.onUpArrow.bind(this),39:this.onRightArrow.bind(this),40:this.onDownArrow.bind(this)},document.addEventListener("keydown",function(e){n(t.container)&&(e=e||window.event,t.keyActions[e.keyCode]&&t.keyActions[e.keyCode]());}));}},{key:"makeOverlay",value:function(){}},{key:"updateOverlay",value:function(){}},{key:"bindOverlay",value:function(){}},{key:"bindUnits",value:function(){}},{key:"onLeftArrow",value:function(){}},{key:"onRightArrow",value:function(){}},{key:"onUpArrow",value:function(){}},{key:"onDownArrow",value:function(){}},{key:"onEnterKey",value:function(){}},{key:"addDataPoint",value:function(){}},{key:"removeDataPoint",value:function(){}},{key:"getDataPoint",value:function(){}},{key:"setCurrentDataPoint",value:function(){}},{key:"updateDataset",value:function(){}},{key:"export",value:function(){var t=ct(this.svg);ht(this.title||"Chart",[t]);}}]),e}(),be=function(t){function e(t,i){return Ht(this,e),Bt(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,i))}return Yt(e,t),It(e,[{key:"configure",value:function(t){Rt(e.prototype.__proto__||Object.getPrototypeOf(e.prototype),"configure",this).call(this,t),this.config.formatTooltipY=(t.tooltipOptions||{}).formatTooltipY,this.config.maxSlices=t.maxSlices||20,this.config.maxLegendPoints=t.maxLegendPoints||20;}},{key:"calc",value:function(){var t=this,e=this.state,i=this.config.maxSlices;e.sliceTotals=[];var n=this.data.labels.map(function(e,i){var n=0;return t.data.datasets.map(function(t){n+=t.values[i];}),[n,e]}).filter(function(t){return t[0]>=0}),a=n;if(n.length>i){n.sort(function(t,e){return e[0]-t[0]}),a=n.slice(0,i-1);var s=0;n.slice(i-1).map(function(t){s+=t[0];}),a.push([s,"Rest"]),this.colors[i-1]="grey";}e.labels=[],a.map(function(t){e.sliceTotals.push(v(t[0])),e.labels.push(t[1]);}),e.grandTotal=e.sliceTotals.reduce(function(t,e){return t+e},0),this.center={x:this.width/2,y:this.height/2};}},{key:"renderLegend",value:function(){var t=this,e=this.state;this.legendArea.textContent="",this.legendTotals=e.sliceTotals.slice(0,this.config.maxLegendPoints);var i=0,n=0;this.legendTotals.map(function(a,s){var r=150,o=Math.floor((t.width-u(t.measures))/r);t.legendTotals.length<o&&(r=t.width/t.legendTotals.length),i>o&&(i=0,n+=20);var l=r*i+5,h=t.config.truncateLegends?b(e.labels[s],r/10):e.labels[s],c=t.config.formatTooltipY?t.config.formatTooltipY(a):a,d=R(l,n,5,t.colors[s],h+": "+c,!1);t.legendArea.appendChild(d),i++;});}}]),e}(ye),xe=7,ke=1e3,we=86400,Ae=["January","February","March","April","May","June","July","August","September","October","November","December"],Pe=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],Te=function(){function t(e){var i=e.layerClass,n=void 0===i?"":i,a=e.layerTransform,s=void 0===a?"":a,r=e.constants,o=e.getData,l=e.makeElements,u=e.animateElements;Ht(this,t),this.layerTransform=s,this.constants=r,this.makeElements=l,this.getData=o,this.animateElements=u,this.store=[],this.labels=[],this.layerClass=n,this.layerClass="function"==typeof this.layerClass?this.layerClass():this.layerClass,this.refresh();}return It(t,[{key:"refresh",value:function(t){this.data=t||this.getData();}},{key:"setup",value:function(t){this.layer=N(this.layerClass,this.layerTransform,t);}},{key:"make",value:function(){this.render(this.data),this.oldData=this.data;}},{key:"render",value:function(t){var e=this;this.store=this.makeElements(t),this.layer.textContent="",this.store.forEach(function(t){e.layer.appendChild(t);}),this.labels.forEach(function(t){e.layer.appendChild(t);});}},{key:"update",value:function(){var t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.refresh();var e=[];return t&&(e=this.animateElements(this.data)||[]),e}}]),t}(),Le={donutSlices:{layerClass:"donut-slices",makeElements:function(t){return t.sliceStrings.map(function(e,i){var n=S(e,"donut-path",t.colors[i],"none",t.strokeWidth);return n.style.transition="transform .3s;",n})},animateElements:function(t){return this.store.map(function(e,i){return st(e,t.sliceStrings[i])})}},pieSlices:{layerClass:"pie-slices",makeElements:function(t){return t.sliceStrings.map(function(e,i){var n=S(e,"pie-path","none",t.colors[i]);return n.style.transition="transform .3s;",n})},animateElements:function(t){return this.store.map(function(e,i){return st(e,t.sliceStrings[i])})}},percentageBars:{layerClass:"percentage-bars",makeElements:function(t){var e=this;return t.xPositions.map(function(i,n){return F(i,0,t.widths[n],e.constants.barHeight,e.constants.barDepth,t.colors[n])})},animateElements:function(t){if(t)return []}},yAxis:{layerClass:"y axis",makeElements:function(t){var e=this;return t.positions.map(function(i,n){return U(i,t.labels[n],e.constants.width,{mode:e.constants.mode,pos:e.constants.pos,shortenNumbers:e.constants.shortenNumbers})})},animateElements:function(t){var e=t.positions,i=t.labels,n=this.oldData.positions,a=this.oldData.labels,s=y(n,e),r=Vt(s,2);n=r[0],e=r[1];var o=y(a,i),l=Vt(o,2);return a=l[0],i=l[1],this.render({positions:n,labels:i}),this.store.map(function(t,i){return tt(t,e[i],n[i])})}},xAxis:{layerClass:"x axis",makeElements:function(t){var e=this;return t.positions.map(function(i,n){return G(i,t.calcLabels[n],e.constants.height,{mode:e.constants.mode,pos:e.constants.pos})})},animateElements:function(t){var e=t.positions,i=t.calcLabels,n=this.oldData.positions,a=this.oldData.calcLabels,s=y(n,e),r=Vt(s,2);n=r[0],e=r[1];var o=y(a,i),l=Vt(o,2);return a=l[0],i=l[1],this.render({positions:n,calcLabels:i}),this.store.map(function(t,i){return Z(t,e[i],n[i])})}},yMarkers:{layerClass:"y-markers",makeElements:function(t){var e=this;return t.map(function(t){return q(t.position,t.label,e.constants.width,{labelPos:t.options.labelPos,mode:"span",lineType:"dashed"})})},animateElements:function(t){var e=y(this.oldData,t),i=Vt(e,2);this.oldData=i[0];var n=(t=i[1]).map(function(t){return t.position}),a=t.map(function(t){return t.label}),s=t.map(function(t){return t.options}),r=this.oldData.map(function(t){return t.position});return this.render(r.map(function(t,e){return {position:r[e],label:a[e],options:s[e]}})),this.store.map(function(t,e){return tt(t,n[e],r[e])})}},yRegions:{layerClass:"y-regions",makeElements:function(t){var e=this;return t.map(function(t){return X(t.startPos,t.endPos,e.constants.width,t.label,{labelPos:t.options.labelPos})})},animateElements:function(t){var e=y(this.oldData,t),i=Vt(e,2);this.oldData=i[0];var n=(t=i[1]).map(function(t){return t.endPos}),a=t.map(function(t){return t.label}),s=t.map(function(t){return t.startPos}),r=t.map(function(t){return t.options}),o=this.oldData.map(function(t){return t.endPos}),l=this.oldData.map(function(t){return t.startPos});this.render(o.map(function(t,e){return {startPos:l[e],endPos:o[e],label:a[e],options:r[e]}}));var u=[];return this.store.map(function(t,e){u=u.concat(et(t,s[e],n[e],o[e]));}),u}},heatDomain:{layerClass:function(){return "heat-domain domain-"+this.constants.index},makeElements:function(t){var e=this,i=this.constants,n=i.index,a=i.colWidth,s=i.rowHeight,r=i.squareSize,o=i.radius,l=i.xTranslate,u=0;return this.serializedSubDomains=[],t.cols.map(function(t,i){1===i&&e.labels.push(Y("domain-name",l,-12,yt(n,!0).toUpperCase(),{fontSize:9})),t.map(function(t,i){if(t.fill){var n={"data-date":t.yyyyMmDd,"data-value":t.dataValue,"data-day":i},a=H("day",l,u,r,o,t.fill,n);e.serializedSubDomains.push(a);}u+=s;}),u=0,l+=a;}),this.serializedSubDomains},animateElements:function(t){if(t)return []}},barGraph:{layerClass:function(){return "dataset-units dataset-bars dataset-"+this.constants.index},makeElements:function(t){var e=this.constants;return this.unitType="bar",this.units=t.yPositions.map(function(i,n){return J(t.xPositions[n],i,t.barWidth,e.color,t.labels[n],n,t.offsets[n],{zeroLine:t.zeroLine,barsWidth:t.barsWidth,minHeight:e.minHeight})}),this.units},animateElements:function(t){var e=t.xPositions,i=t.yPositions,n=t.offsets,a=t.labels,s=this.oldData.xPositions,r=this.oldData.yPositions,o=this.oldData.offsets,l=this.oldData.labels,u=y(s,e),h=Vt(u,2);s=h[0],e=h[1];var c=y(r,i),d=Vt(c,2);r=d[0],i=d[1];var p=y(o,n),f=Vt(p,2);o=f[0],n=f[1];var v=y(l,a),g=Vt(v,2);l=g[0],a=g[1],this.render({xPositions:s,yPositions:r,offsets:o,labels:a,zeroLine:this.oldData.zeroLine,barsWidth:this.oldData.barsWidth,barWidth:this.oldData.barWidth});var m=[];return this.store.map(function(a,s){m=m.concat(it(a,e[s],i[s],t.barWidth,n[s],{zeroLine:t.zeroLine}));}),m}},lineGraph:{layerClass:function(){return "dataset-units dataset-line dataset-"+this.constants.index},makeElements:function(t){var e=this.constants;return this.unitType="dot",this.paths={},e.hideLine||(this.paths=$(t.xPositions,t.yPositions,e.color,{heatline:e.heatline,regionFill:e.regionFill,spline:e.spline},{svgDefs:e.svgDefs,zeroLine:t.zeroLine})),this.units=[],e.hideDots||(this.units=t.yPositions.map(function(i,n){return K(t.xPositions[n],i,t.radius,e.color,e.valuesOverPoints?t.values[n]:"",n)})),Object.values(this.paths).concat(this.units)},animateElements:function(t){var e=t.xPositions,i=t.yPositions,n=t.values,a=this.oldData.xPositions,s=this.oldData.yPositions,r=this.oldData.values,o=y(a,e),l=Vt(o,2);a=l[0],e=l[1];var u=y(s,i),h=Vt(u,2);s=h[0],i=h[1];var c=y(r,n),d=Vt(c,2);r=d[0],n=d[1],this.render({xPositions:a,yPositions:s,values:n,zeroLine:this.oldData.zeroLine,radius:this.oldData.radius});var p=[];return Object.keys(this.paths).length&&(p=p.concat(at(this.paths,e,i,t.zeroLine,this.constants.spline))),this.units.length&&this.units.map(function(t,n){p=p.concat(nt(t,e[n],i[n]));}),p}}},Oe=function(t){function i(t,e){Ht(this,i);var n=Bt(this,(i.__proto__||Object.getPrototypeOf(i)).call(this,t,e));return n.type="percentage",n.setup(),n}return Yt(i,t),It(i,[{key:"setMeasures",value:function(t){var e=this.measures;this.barOptions=t.barOptions||{};var i=this.barOptions;i.height=i.height||20,i.depth=i.depth||Jt,e.paddings.right=30,e.legendHeight=60,e.baseHeight=8*(i.height+.5*i.depth);}},{key:"setupComponents",value:function(){var t=this.state,e=[["percentageBars",{barHeight:this.barOptions.height,barDepth:this.barOptions.depth},function(){return {xPositions:t.xPositions,widths:t.widths,colors:this.colors}}.bind(this)]];this.components=new Map(e.map(function(t){var e=wt.apply(void 0,Ut(t));return [t[0],e]}));}},{key:"calc",value:function(){var t=this;Rt(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),"calc",this).call(this);var e=this.state;e.xPositions=[],e.widths=[];var n=0;e.sliceTotals.map(function(i){var a=t.width*i/e.grandTotal;e.widths.push(a),e.xPositions.push(n),n+=a;});}},{key:"makeDataByIndex",value:function(){}},{key:"bindTooltip",value:function(){var t=this,i=this.state;this.container.addEventListener("mousemove",function(n){var a=t.components.get("percentageBars").store,s=n.target;if(a.includes(s)){var r=a.indexOf(s),o=e(t.container),l=e(s),u=l.left-o.left+parseInt(s.getAttribute("width"))/2,h=l.top-o.top,c=(t.formattedLabels&&t.formattedLabels.length>0?t.formattedLabels[r]:t.state.labels[r])+": ",d=i.sliceTotals[r]/i.grandTotal;t.tip.setValues(u,h,{name:c,value:(100*d).toFixed(1)+"%"}),t.tip.showTip();}});}}]),i}(be),Me=function(t){function i(t,e){Ht(this,i);var n=Bt(this,(i.__proto__||Object.getPrototypeOf(i)).call(this,t,e));return n.type="pie",n.initTimeout=0,n.init=1,n.setup(),n}return Yt(i,t),It(i,[{key:"configure",value:function(t){Rt(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),"configure",this).call(this,t),this.mouseMove=this.mouseMove.bind(this),this.mouseLeave=this.mouseLeave.bind(this),this.hoverRadio=t.hoverRadio||.1,this.config.startAngle=t.startAngle||0,this.clockWise=t.clockWise||!1;}},{key:"calc",value:function(){var t=this;Rt(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),"calc",this).call(this);var e=this.state;this.radius=this.height>this.width?this.center.x:this.center.y;var n=this.radius,a=this.clockWise,s=e.slicesProperties||[];e.sliceStrings=[],e.slicesProperties=[];var r=180-this.config.startAngle;e.sliceTotals.map(function(i,o){var l=r,u=i/e.grandTotal*360,h=u>180?1:0,c=a?-u:u,d=r+=c,f=p(l,n),v=p(d,n),g=t.init&&s[o],m=void 0,y=void 0;t.init?(m=g?g.startPosition:f,y=g?g.endPosition:f):(m=f,y=v);var b=360===u?_(m,y,t.center,t.radius,a,h):E(m,y,t.center,t.radius,a,h);e.sliceStrings.push(b),e.slicesProperties.push({startPosition:f,endPosition:v,value:i,total:e.grandTotal,startAngle:l,endAngle:d,angle:c});}),this.init=0;}},{key:"setupComponents",value:function(){var t=this.state,e=[["pieSlices",{},function(){return {sliceStrings:t.sliceStrings,colors:this.colors}}.bind(this)]];this.components=new Map(e.map(function(t){var e=wt.apply(void 0,Ut(t));return [t[0],e]}));}},{key:"calTranslateByAngle",value:function(t){var e=this.radius,i=this.hoverRadio,n=p(t.startAngle+t.angle/2,e);return "translate3d("+n.x*i+"px,"+n.y*i+"px,0)"}},{key:"hoverSlice",value:function(t,i,n,a){if(t){var s=this.colors[i];if(n){ot(t,this.calTranslateByAngle(this.state.slicesProperties[i])),t.style.fill=A(s,50);var r=e(this.svg),o=a.pageX-r.left+10,l=a.pageY-r.top-10,u=(this.formatted_labels&&this.formatted_labels.length>0?this.formatted_labels[i]:this.state.labels[i])+": ",h=(100*this.state.sliceTotals[i]/this.state.grandTotal).toFixed(1);this.tip.setValues(o,l,{name:u,value:h+"%"}),this.tip.showTip();}else ot(t,"translate3d(0,0,0)"),this.tip.hideTip(),t.style.fill=s;}}},{key:"bindTooltip",value:function(){this.container.addEventListener("mousemove",this.mouseMove),this.container.addEventListener("mouseleave",this.mouseLeave);}},{key:"mouseMove",value:function(t){var e=t.target,i=this.components.get("pieSlices").store,n=this.curActiveSliceIndex,a=this.curActiveSlice;if(i.includes(e)){var s=i.indexOf(e);this.hoverSlice(a,n,!1),this.curActiveSlice=e,this.curActiveSliceIndex=s,this.hoverSlice(e,s,!0,t);}else this.mouseLeave();}},{key:"mouseLeave",value:function(){this.hoverSlice(this.curActiveSlice,this.curActiveSliceIndex,!1);}}]),i}(be),Ce=function(t){function e(t,i){Ht(this,e);var n=Bt(this,(e.__proto__||Object.getPrototypeOf(e)).call(this,t,i));n.type="heatmap",n.countLabel=i.countLabel||"";var a=["Sunday","Monday"],s=a.includes(i.startSubDomain)?i.startSubDomain:"Sunday";return n.startSubDomainIndex=a.indexOf(s),n.setup(),n}return Yt(e,t),It(e,[{key:"setMeasures",value:function(t){var e=this.measures;this.discreteDomains=0===t.discreteDomains?0:1,e.paddings.top=36,e.paddings.bottom=0,e.legendHeight=24,e.baseHeight=12*xe+l(e);var i=this.data,n=this.discreteDomains?12:0;this.independentWidth=12*(vt(i.start,i.end)+n)+u(e);}},{key:"updateWidth",value:function(){var t=this.discreteDomains?12:0,e=this.state.noOfWeeks?this.state.noOfWeeks:52;this.baseWidth=12*(e+t)+u(this.measures);}},{key:"prepareData",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.data;if(t.start&&t.end&&t.start>t.end)throw new Error("Start date cannot be greater than end date.");if(t.start||(t.start=new Date,t.start.setFullYear(t.start.getFullYear()-1)),t.end||(t.end=new Date),t.dataPoints=t.dataPoints||{},parseInt(Object.keys(t.dataPoints)[0])>1e5){var e={};Object.keys(t.dataPoints).forEach(function(i){var n=new Date(i*ke);e[pt(n)]=t.dataPoints[i];}),t.dataPoints=e;}return t}},{key:"calc",value:function(){var t=this.state;t.start=ft(this.data.start),t.end=ft(this.data.end),t.firstWeekStart=ft(t.start),t.noOfWeeks=vt(t.start,t.end),t.distribution=St(Object.values(this.data.dataPoints),5),t.domainConfigs=this.getDomains();}},{key:"setupComponents",value:function(){var t=this,e=this.state,i=this.discreteDomains?0:1,n=e.domainConfigs.map(function(n,a){return ["heatDomain",{index:n.index,colWidth:12,rowHeight:12,squareSize:10,radius:t.rawChartArgs.radius||0,xTranslate:12*e.domainConfigs.filter(function(t,e){return e<a}).map(function(t){return t.cols.length-i}).reduce(function(t,e){return t+e},0)},function(){return e.domainConfigs[a]}.bind(t)]});this.components=new Map(n.map(function(t,e){var i=wt.apply(void 0,Ut(t));return [t[0]+"-"+e,i]}));var a=0;Pe.forEach(function(e,i){if([1,3,5].includes(i)){var n=Y("subdomain-name",-6,a,e,{fontSize:10,dy:8,textAnchor:"end"});t.drawArea.appendChild(n);}a+=12;});}},{key:"update",value:function(t){t||console.error("No data to update."),this.data=this.prepareData(t),this.draw(),this.bindTooltip();}},{key:"bindTooltip",value:function(){var t=this;this.container.addEventListener("mousemove",function(e){t.components.forEach(function(i){var n=i.store,a=e.target;if(n.includes(a)){var s=a.getAttribute("data-value"),r=a.getAttribute("data-date").split("-"),o=yt(parseInt(r[1])-1,!0),l=t.container.getBoundingClientRect(),u=a.getBoundingClientRect(),h=parseInt(e.target.getAttribute("width")),c=u.left-l.left+h/2,d=u.top-l.top,p=s+" "+t.countLabel,f=" on "+o+" "+r[0]+", "+r[2];t.tip.setValues(c,d,{name:f,value:p,valueFirst:1},[]),t.tip.showTip();}});});}},{key:"renderLegend",value:function(){var t=this;this.legendArea.textContent="";var e=0,i=this.rawChartArgs.radius||0,n=Y("subdomain-name",e,12,"Less",{fontSize:11,dy:9});e=30,this.legendArea.appendChild(n),this.colors.slice(0,5).map(function(n,a){var s=H("heatmap-legend-unit",e+15*a,12,10,i,n);t.legendArea.appendChild(s);});var a=Y("subdomain-name",e+75+3,12,"More",{fontSize:11,dy:9});this.legendArea.appendChild(a);}},{key:"getDomains",value:function(){for(var t=this.state,e=[t.start.getMonth(),t.start.getFullYear()],i=e[0],n=e[1],a=[t.end.getMonth(),t.end.getFullYear()],s=a[0]-i+1+12*(a[1]-n),r=[],o=ft(t.start),l=0;l<s;l++){var u=t.end;if(!mt(o,t.end)){var h=[o.getMonth(),o.getFullYear()];u=bt(h[0],h[1]);}r.push(this.getDomainConfig(o,u)),kt(u,1),o=u;}return r}},{key:"getDomainConfig",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",i=[t.getMonth(),t.getFullYear()],n=i[0],a=i[1],s=xt(t),r={index:n,cols:[]};kt(e=ft(e)||bt(n,a),1);for(var o=vt(s,e),l=[],u=void 0,h=0;h<o;h++)u=this.getCol(s,n),l.push(u),kt(s=new Date(u[xe-1].yyyyMmDd),1);return void 0!==u[xe-1].dataValue&&(kt(s,1),l.push(this.getCol(s,n,!0))),r.cols=l,r}},{key:"getCol",value:function(t,e){for(var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n=this.state,a=ft(t),s=[],r=0;r<xe;r++,kt(a,1)){var o={},l=a>=n.start&&a<=n.end;i||a.getMonth()!==e||!l?o.yyyyMmDd=pt(a):o=this.getSubDomainConfig(a),s.push(o);}return s}},{key:"getSubDomainConfig",value:function(t){var e=pt(t),i=this.data.dataPoints[e];return {yyyyMmDd:e,dataValue:i||0,fill:this.colors[Et(i,this.state.distribution)]}}}]),e}(ye),De=function(t){function i(t,e){Ht(this,i);var n=Bt(this,(i.__proto__||Object.getPrototypeOf(i)).call(this,t,e));return n.barOptions=e.barOptions||{},n.lineOptions=e.lineOptions||{},n.type=e.type||"line",n.init=1,n.setup(),n}return Yt(i,t),It(i,[{key:"setMeasures",value:function(){this.data.datasets.length<=1&&(this.config.showLegend=0,this.measures.paddings.bottom=30);}},{key:"configure",value:function(t){Rt(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),"configure",this).call(this,t),t.axisOptions=t.axisOptions||{},t.tooltipOptions=t.tooltipOptions||{},this.config.xAxisMode=t.axisOptions.xAxisMode||"span",this.config.yAxisMode=t.axisOptions.yAxisMode||"span",this.config.xIsSeries=t.axisOptions.xIsSeries||0,this.config.shortenYAxisNumbers=t.axisOptions.shortenYAxisNumbers||0,this.config.formatTooltipX=t.tooltipOptions.formatTooltipX,this.config.formatTooltipY=t.tooltipOptions.formatTooltipY,this.config.valuesOverPoints=t.valuesOverPoints;}},{key:"prepareData",value:function(){return _t(arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.data,this.type)}},{key:"prepareFirstData",value:function(){return zt(arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.data)}},{key:"calc",value:function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];this.calcXPositions(),t||this.calcYAxisParameters(this.getAllYValues(),"line"===this.type),this.makeDataByIndex();}},{key:"calcXPositions",value:function(){var t=this.state,e=this.data.labels;t.datasetLength=e.length,t.unitWidth=this.width/t.datasetLength,t.xOffset=t.unitWidth/2,t.xAxis={labels:e,positions:e.map(function(e,i){return h(t.xOffset+i*t.unitWidth)})};}},{key:"calcYAxisParameters",value:function(t){var e=Lt(t,arguments.length>1&&void 0!==arguments[1]?arguments[1]:"false"),i=this.height/Ct(e),n=Mt(e)*i,a=this.height-Ot(e)*n;this.state.yAxis={labels:e,positions:e.map(function(t){return a-t*i}),scaleMultiplier:i,zeroLine:a},this.calcDatasetPoints(),this.calcYExtremes(),this.calcYRegions();}},{key:"calcDatasetPoints",value:function(){var t=this.state,e=function(e){return e.map(function(e){return Dt(e,t.yAxis)})};t.datasets=this.data.datasets.map(function(t,i){var n=t.values,a=t.cumulativeYs||[];return {name:t.name&&t.name.replace(/<|>|&/g,function(t){return "&"==t?"&amp;":"<"==t?"&lt;":"&gt;"}),index:i,chartType:t.chartType,values:n,yPositions:e(n),cumulativeYs:a,cumulativeYPos:e(a)}});}},{key:"calcYExtremes",value:function(){var t=this.state;if(this.barOptions.stacked)return void(t.yExtremes=t.datasets[t.datasets.length-1].cumulativeYPos);t.yExtremes=new Array(t.datasetLength).fill(9999),t.datasets.map(function(e){e.yPositions.map(function(e,i){e<t.yExtremes[i]&&(t.yExtremes[i]=e);});});}},{key:"calcYRegions",value:function(){var t=this.state;this.data.yMarkers&&(this.state.yMarkers=this.data.yMarkers.map(function(e){return e.position=Dt(e.value,t.yAxis),e.options||(e.options={}),e})),this.data.yRegions&&(this.state.yRegions=this.data.yRegions.map(function(e){return e.startPos=Dt(e.start,t.yAxis),e.endPos=Dt(e.end,t.yAxis),e.options||(e.options={}),e}));}},{key:"getAllYValues",value:function(){var t,e=this,i="values";if(this.barOptions.stacked){i="cumulativeYs";var n=new Array(this.state.datasetLength).fill(0);this.data.datasets.map(function(t,a){var s=e.data.datasets[a].values;t[i]=n=n.map(function(t,e){return t+s[e]});});}var a=this.data.datasets.map(function(t){return t[i]});return this.data.yMarkers&&a.push(this.data.yMarkers.map(function(t){return t.value})),this.data.yRegions&&this.data.yRegions.map(function(t){a.push([t.end,t.start]);}),(t=[]).concat.apply(t,Ut(a))}},{key:"setupComponents",value:function(){var t=this,e=[["yAxis",{mode:this.config.yAxisMode,width:this.width,shortenNumbers:this.config.shortenYAxisNumbers},function(){return this.state.yAxis}.bind(this)],["xAxis",{mode:this.config.xAxisMode,height:this.height},function(){var t=this.state;return t.xAxis.calcLabels=Wt(this.width,t.xAxis.labels,this.config.xIsSeries),t.xAxis}.bind(this)],["yRegions",{width:this.width,pos:"right"},function(){return this.state.yRegions}.bind(this)]],i=this.state.datasets.filter(function(t){return "bar"===t.chartType}),n=this.state.datasets.filter(function(t){return "line"===t.chartType}),a=i.map(function(e){var n=e.index;return ["barGraph-"+e.index,{index:n,color:t.colors[n],stacked:t.barOptions.stacked,valuesOverPoints:t.config.valuesOverPoints,minHeight:0*t.height},function(){var t=this.state,e=t.datasets[n],a=this.barOptions.stacked,s=this.barOptions.spaceRatio||.5,r=t.unitWidth*(1-s),o=r/(a?1:i.length),l=t.xAxis.positions.map(function(t){return t-r/2});a||(l=l.map(function(t){return t+o*n}));var u=new Array(t.datasetLength).fill("");this.config.valuesOverPoints&&(u=a&&e.index===t.datasets.length-1?e.cumulativeYs:e.values);var h=new Array(t.datasetLength).fill(0);return a&&(h=e.yPositions.map(function(t,i){return t-e.cumulativeYPos[i]})),{xPositions:l,yPositions:e.yPositions,offsets:h,labels:u,zeroLine:t.yAxis.zeroLine,barsWidth:r,barWidth:o}}.bind(t)]}),s=n.map(function(e){var i=e.index;return ["lineGraph-"+e.index,{index:i,color:t.colors[i],svgDefs:t.svgDefs,heatline:t.lineOptions.heatline,regionFill:t.lineOptions.regionFill,spline:t.lineOptions.spline,hideDots:t.lineOptions.hideDots,hideLine:t.lineOptions.hideLine,valuesOverPoints:t.config.valuesOverPoints},function(){var t=this.state,e=t.datasets[i],n=t.yAxis.positions[0]<t.yAxis.zeroLine?t.yAxis.positions[0]:t.yAxis.zeroLine;return {xPositions:t.xAxis.positions,yPositions:e.yPositions,values:e.values,zeroLine:n,radius:this.lineOptions.dotSize||4}}.bind(t)]}),r=[["yMarkers",{width:this.width,pos:"right"},function(){return this.state.yMarkers}.bind(this)]];e=e.concat(a,s,r);var o=["yMarkers","yRegions"];this.dataUnitComponents=[],this.components=new Map(e.filter(function(e){return !o.includes(e[0])||t.state[e[0]]}).map(function(e){var i=wt.apply(void 0,Ut(e));return (e[0].includes("lineGraph")||e[0].includes("barGraph"))&&t.dataUnitComponents.push(i),[e[0],i]}));}},{key:"makeDataByIndex",value:function(){var t=this;this.dataByIndex={};var e=this.state,i=this.config.formatTooltipX,n=this.config.formatTooltipY;e.xAxis.labels.map(function(a,s){var r=t.state.datasets.map(function(e,i){var a=e.values[s];return {title:e.name,value:a,yPos:e.yPositions[s],color:t.colors[i],formatted:n?n(a):a}});t.dataByIndex[s]={label:a,formattedLabel:i?i(a):a,xPos:e.xAxis.positions[s],values:r,yExtreme:e.yExtremes[s]};});}},{key:"bindTooltip",value:function(){var t=this;this.container.addEventListener("mousemove",function(i){var n=t.measures,a=e(t.container),s=i.pageX-a.left-o(n),l=i.pageY-a.top;l<t.height+r(n)&&l>r(n)?t.mapTooltipXPosition(s):t.tip.hideTip();});}},{key:"mapTooltipXPosition",value:function(t){var e=this.state;if(e.yExtremes){var i=Nt(t,e.xAxis.positions,!0);if(i>=0){var n=this.dataByIndex[i];this.tip.setValues(n.xPos+this.tip.offset.x,n.yExtreme+this.tip.offset.y,{name:n.formattedLabel,value:""},n.values,i),this.tip.showTip();}}}},{key:"renderLegend",value:function(){var t=this,e=this.data;e.datasets.length>1&&(this.legendArea.textContent="",e.datasets.map(function(e,i){var n=I(100*i,"0",100,t.colors[i],e.name,t.config.truncateLegends);t.legendArea.appendChild(n);}));}},{key:"makeOverlay",value:function(){var t=this;if(this.init)return void(this.init=0);this.overlayGuides&&this.overlayGuides.forEach(function(t){var e=t.overlay;e.parentNode.removeChild(e);}),this.overlayGuides=this.dataUnitComponents.map(function(t){return {type:t.unitType,overlay:void 0,units:t.units}}),void 0===this.state.currentIndex&&(this.state.currentIndex=this.state.datasetLength-1),this.overlayGuides.map(function(e){var i=e.units[t.state.currentIndex];e.overlay=ue[e.type](i),t.drawArea.appendChild(e.overlay);});}},{key:"updateOverlayGuides",value:function(){this.overlayGuides&&this.overlayGuides.forEach(function(t){var e=t.overlay;e.parentNode.removeChild(e);});}},{key:"bindOverlay",value:function(){var t=this;this.parent.addEventListener("data-select",function(){t.updateOverlay();});}},{key:"bindUnits",value:function(){var t=this;this.dataUnitComponents.map(function(e){e.units.map(function(e){e.addEventListener("click",function(){var i=e.getAttribute("data-point-index");t.setCurrentDataPoint(i);});});}),this.tip.container.addEventListener("click",function(){var e=t.tip.container.getAttribute("data-point-index");t.setCurrentDataPoint(e);});}},{key:"updateOverlay",value:function(){var t=this;this.overlayGuides.map(function(e){var i=e.units[t.state.currentIndex];he[e.type](i,e.overlay);});}},{key:"onLeftArrow",value:function(){this.setCurrentDataPoint(this.state.currentIndex-1);}},{key:"onRightArrow",value:function(){this.setCurrentDataPoint(this.state.currentIndex+1);}},{key:"getDataPoint",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.state.currentIndex,e=this.state;return {index:t,label:e.xAxis.labels[t],values:e.datasets.map(function(e){return e.values[t]})}}},{key:"setCurrentDataPoint",value:function(t){var e=this.state;(t=parseInt(t))<0&&(t=0),t>=e.xAxis.labels.length&&(t=e.xAxis.labels.length-1),t!==e.currentIndex&&(e.currentIndex=t,s(this.parent,"data-select",this.getDataPoint()));}},{key:"addDataPoint",value:function(t,e){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.state.datasetLength;Rt(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),"addDataPoint",this).call(this,t,e,n),this.data.labels.splice(n,0,t),this.data.datasets.map(function(t,i){t.values.splice(n,0,e[i]);}),this.update(this.data);}},{key:"removeDataPoint",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.state.datasetLength-1;this.data.labels.length<=1||(Rt(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),"removeDataPoint",this).call(this,t),this.data.labels.splice(t,1),this.data.datasets.map(function(e){e.values.splice(t,1);}),this.update(this.data));}},{key:"updateDataset",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0;this.data.datasets[e].values=t,this.update(this.data);}},{key:"updateDatasets",value:function(t){this.data.datasets.map(function(e,i){t[i]&&(e.values=t[i]);}),this.update(this.data);}}]),i}(ye),Ne=function(t){function i(t,e){Ht(this,i);var n=Bt(this,(i.__proto__||Object.getPrototypeOf(i)).call(this,t,e));return n.type="donut",n.initTimeout=0,n.init=1,n.setup(),n}return Yt(i,t),It(i,[{key:"configure",value:function(t){Rt(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),"configure",this).call(this,t),this.mouseMove=this.mouseMove.bind(this),this.mouseLeave=this.mouseLeave.bind(this),this.hoverRadio=t.hoverRadio||.1,this.config.startAngle=t.startAngle||0,this.clockWise=t.clockWise||!1,this.strokeWidth=t.strokeWidth||30;}},{key:"calc",value:function(){var t=this;Rt(i.prototype.__proto__||Object.getPrototypeOf(i.prototype),"calc",this).call(this);var e=this.state;this.radius=this.height>this.width?this.center.x-this.strokeWidth/2:this.center.y-this.strokeWidth/2;var n=this.radius,a=this.clockWise,s=e.slicesProperties||[];e.sliceStrings=[],e.slicesProperties=[];var r=180-this.config.startAngle;e.sliceTotals.map(function(i,o){var l=r,u=i/e.grandTotal*360,h=u>180?1:0,c=a?-u:u,d=r+=c,f=p(l,n),v=p(d,n),g=t.init&&s[o],m=void 0,y=void 0;t.init?(m=g?g.startPosition:f,y=g?g.endPosition:f):(m=f,y=v);var b=360===u?W(m,y,t.center,t.radius,t.clockWise,h):z(m,y,t.center,t.radius,t.clockWise,h);e.sliceStrings.push(b),e.slicesProperties.push({startPosition:f,endPosition:v,value:i,total:e.grandTotal,startAngle:l,endAngle:d,angle:c});}),this.init=0;}},{key:"setupComponents",value:function(){var t=this.state,e=[["donutSlices",{},function(){return {sliceStrings:t.sliceStrings,colors:this.colors,strokeWidth:this.strokeWidth}}.bind(this)]];this.components=new Map(e.map(function(t){var e=wt.apply(void 0,Ut(t));return [t[0],e]}));}},{key:"calTranslateByAngle",value:function(t){var e=this.radius,i=this.hoverRadio,n=p(t.startAngle+t.angle/2,e);return "translate3d("+n.x*i+"px,"+n.y*i+"px,0)"}},{key:"hoverSlice",value:function(t,i,n,a){if(t){var s=this.colors[i];if(n){ot(t,this.calTranslateByAngle(this.state.slicesProperties[i])),t.style.stroke=A(s,50);var r=e(this.svg),o=a.pageX-r.left+10,l=a.pageY-r.top-10,u=(this.formatted_labels&&this.formatted_labels.length>0?this.formatted_labels[i]:this.state.labels[i])+": ",h=(100*this.state.sliceTotals[i]/this.state.grandTotal).toFixed(1);this.tip.setValues(o,l,{name:u,value:h+"%"}),this.tip.showTip();}else ot(t,"translate3d(0,0,0)"),this.tip.hideTip(),t.style.stroke=s;}}},{key:"bindTooltip",value:function(){this.container.addEventListener("mousemove",this.mouseMove),this.container.addEventListener("mouseleave",this.mouseLeave);}},{key:"mouseMove",value:function(t){var e=t.target,i=this.components.get("donutSlices").store,n=this.curActiveSliceIndex,a=this.curActiveSlice;if(i.includes(e)){var s=i.indexOf(e);this.hoverSlice(a,n,!1),this.curActiveSlice=e,this.curActiveSliceIndex=s,this.hoverSlice(e,s,!0,t);}else this.mouseLeave();}},{key:"mouseLeave",value:function(){this.hoverSlice(this.curActiveSlice,this.curActiveSliceIndex,!1);}}]),i}(be),Se={bar:De,line:De,percentage:Oe,heatmap:Ce,pie:Me,donut:Ne},Ee=function t(e,i){return Ht(this,t),jt(i.type,e,i)},_e=Object.freeze({Chart:Ee,PercentageChart:Oe,PieChart:Me,Heatmap:Ce,AxisChart:De}),ze={};return ze.NAME="Frappe Charts",ze.VERSION="1.6.2",ze=Object.assign({},ze,_e)});

    });

    /* node_modules\svelte-frappe-charts\src\components\base.svelte generated by Svelte v3.44.2 */
    const file$2 = "node_modules\\svelte-frappe-charts\\src\\components\\base.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$2, 89, 0, 2072);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[18](div);

    			if (!mounted) {
    				dispose = listen_dev(div, "data-select", /*data_select_handler*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[18](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Base', slots, []);

    	let { data = {
    		labels: [],
    		datasets: [{ values: [] }],
    		yMarkers: {},
    		yRegions: []
    	} } = $$props;

    	let { title = '' } = $$props;
    	let { type = 'line' } = $$props;
    	let { height = 300 } = $$props;
    	let { animate = true } = $$props;
    	let { axisOptions = {} } = $$props;
    	let { barOptions = {} } = $$props;
    	let { lineOptions = {} } = $$props;
    	let { tooltipOptions = {} } = $$props;
    	let { colors = [] } = $$props;
    	let { valuesOverPoints = 0 } = $$props;
    	let { isNavigable = false } = $$props;
    	let { maxSlices = 3 } = $$props;

    	/**
     *  COMPONENT
     */
    	//  The Chart returned from frappe
    	let chart = null;

    	//  DOM node for frappe to latch onto
    	let chartRef;

    	//  Helper HOF for calling a fn only if chart exists
    	function ifChartThen(fn) {
    		return function ifChart(...args) {
    			if (chart) {
    				return fn(...args);
    			}
    		};
    	}

    	const addDataPoint = ifChartThen((label, valueFromEachDataset, index) => chart.addDataPoint(label, valueFromEachDataset, index));
    	const removeDataPoint = ifChartThen(index => chart.removeDataPoint(index));
    	const exportChart = ifChartThen(() => chart.export());

    	//  Update the chart when incoming data changes
    	const updateChart = ifChartThen(newData => chart.update(newData));

    	/**
     *  Handle initializing the chart when this Svelte component mounts
     */
    	onMount(() => {
    		chart = new frappeCharts_min_umd.Chart(chartRef,
    		{
    				data,
    				title,
    				type,
    				height,
    				animate,
    				colors,
    				axisOptions,
    				barOptions,
    				lineOptions,
    				tooltipOptions,
    				valuesOverPoints,
    				isNavigable,
    				maxSlices
    			});
    	});

    	//  Mark Chart references for garbage collection when component is unmounted
    	onDestroy(() => {
    		chart = null;
    	});

    	const writable_props = [
    		'data',
    		'title',
    		'type',
    		'height',
    		'animate',
    		'axisOptions',
    		'barOptions',
    		'lineOptions',
    		'tooltipOptions',
    		'colors',
    		'valuesOverPoints',
    		'isNavigable',
    		'maxSlices'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Base> was created with unknown prop '${key}'`);
    	});

    	function data_select_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			chartRef = $$value;
    			$$invalidate(0, chartRef);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(1, data = $$props.data);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('type' in $$props) $$invalidate(3, type = $$props.type);
    		if ('height' in $$props) $$invalidate(4, height = $$props.height);
    		if ('animate' in $$props) $$invalidate(5, animate = $$props.animate);
    		if ('axisOptions' in $$props) $$invalidate(6, axisOptions = $$props.axisOptions);
    		if ('barOptions' in $$props) $$invalidate(7, barOptions = $$props.barOptions);
    		if ('lineOptions' in $$props) $$invalidate(8, lineOptions = $$props.lineOptions);
    		if ('tooltipOptions' in $$props) $$invalidate(9, tooltipOptions = $$props.tooltipOptions);
    		if ('colors' in $$props) $$invalidate(10, colors = $$props.colors);
    		if ('valuesOverPoints' in $$props) $$invalidate(11, valuesOverPoints = $$props.valuesOverPoints);
    		if ('isNavigable' in $$props) $$invalidate(12, isNavigable = $$props.isNavigable);
    		if ('maxSlices' in $$props) $$invalidate(13, maxSlices = $$props.maxSlices);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		Chart: frappeCharts_min_umd.Chart,
    		data,
    		title,
    		type,
    		height,
    		animate,
    		axisOptions,
    		barOptions,
    		lineOptions,
    		tooltipOptions,
    		colors,
    		valuesOverPoints,
    		isNavigable,
    		maxSlices,
    		chart,
    		chartRef,
    		ifChartThen,
    		addDataPoint,
    		removeDataPoint,
    		exportChart,
    		updateChart
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(1, data = $$props.data);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('type' in $$props) $$invalidate(3, type = $$props.type);
    		if ('height' in $$props) $$invalidate(4, height = $$props.height);
    		if ('animate' in $$props) $$invalidate(5, animate = $$props.animate);
    		if ('axisOptions' in $$props) $$invalidate(6, axisOptions = $$props.axisOptions);
    		if ('barOptions' in $$props) $$invalidate(7, barOptions = $$props.barOptions);
    		if ('lineOptions' in $$props) $$invalidate(8, lineOptions = $$props.lineOptions);
    		if ('tooltipOptions' in $$props) $$invalidate(9, tooltipOptions = $$props.tooltipOptions);
    		if ('colors' in $$props) $$invalidate(10, colors = $$props.colors);
    		if ('valuesOverPoints' in $$props) $$invalidate(11, valuesOverPoints = $$props.valuesOverPoints);
    		if ('isNavigable' in $$props) $$invalidate(12, isNavigable = $$props.isNavigable);
    		if ('maxSlices' in $$props) $$invalidate(13, maxSlices = $$props.maxSlices);
    		if ('chart' in $$props) chart = $$props.chart;
    		if ('chartRef' in $$props) $$invalidate(0, chartRef = $$props.chartRef);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 2) {
    			updateChart(data);
    		}
    	};

    	return [
    		chartRef,
    		data,
    		title,
    		type,
    		height,
    		animate,
    		axisOptions,
    		barOptions,
    		lineOptions,
    		tooltipOptions,
    		colors,
    		valuesOverPoints,
    		isNavigable,
    		maxSlices,
    		addDataPoint,
    		removeDataPoint,
    		exportChart,
    		data_select_handler,
    		div_binding
    	];
    }

    class Base extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			data: 1,
    			title: 2,
    			type: 3,
    			height: 4,
    			animate: 5,
    			axisOptions: 6,
    			barOptions: 7,
    			lineOptions: 8,
    			tooltipOptions: 9,
    			colors: 10,
    			valuesOverPoints: 11,
    			isNavigable: 12,
    			maxSlices: 13,
    			addDataPoint: 14,
    			removeDataPoint: 15,
    			exportChart: 16
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Base",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get data() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animate() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animate(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get axisOptions() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set axisOptions(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get barOptions() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set barOptions(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineOptions() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineOptions(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tooltipOptions() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tooltipOptions(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colors() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valuesOverPoints() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valuesOverPoints(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isNavigable() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isNavigable(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxSlices() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxSlices(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addDataPoint() {
    		return this.$$.ctx[14];
    	}

    	set addDataPoint(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeDataPoint() {
    		return this.$$.ctx[15];
    	}

    	set removeDataPoint(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get exportChart() {
    		return this.$$.ctx[16];
    	}

    	set exportChart(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Base$1 = Base;

    /* src\Editor.svelte generated by Svelte v3.44.2 */

    const { Object: Object_1, console: console_1$1 } = globals;
    const file$1 = "src\\Editor.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[56] = list[i];
    	child_ctx[57] = list;
    	child_ctx[58] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[59] = list[i];
    	child_ctx[60] = list;
    	child_ctx[61] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[56] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[64] = list[i][0];
    	child_ctx[1] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[56] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[69] = list[i];
    	child_ctx[70] = list;
    	child_ctx[71] = i;
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[56] = list[i];
    	child_ctx[72] = list;
    	child_ctx[73] = i;
    	return child_ctx;
    }

    // (351:0) {#if issticky}
    function create_if_block_12(ctx) {
    	let div;
    	let p;
    	let strong0;
    	let t1;
    	let t2_value = /*getCurrentGrade*/ ctx[18]() + "";
    	let t2;
    	let t3;
    	let strong1;
    	let t5;
    	let t6_value = (/*newGrade*/ ctx[3] * 100).toFixed(2) + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "Original:";
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = text(" | ");
    			strong1 = element("strong");
    			strong1.textContent = "New:";
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = text("%");
    			add_location(strong0, file$1, 352, 11, 11211);
    			add_location(strong1, file$1, 352, 61, 11261);
    			add_location(p, file$1, 352, 8, 11208);
    			attr_dev(div, "class", "sticky");
    			add_location(div, file$1, 351, 4, 11178);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, strong0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, strong1);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			append_dev(p, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newGrade*/ 8 && t6_value !== (t6_value = (/*newGrade*/ ctx[3] * 100).toFixed(2) + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(351:0) {#if issticky}",
    		ctx
    	});

    	return block;
    }

    // (361:4) {#if isPlayground}
    function create_if_block_11(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Save/Load";
    			add_location(button, file$1, 361, 8, 11580);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[33], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(361:4) {#if isPlayground}",
    		ctx
    	});

    	return block;
    }

    // (367:0) {#if !isPlayground}
    function create_if_block_9(ctx) {
    	let small;
    	let a;
    	let t1;
    	let mounted;
    	let dispose;
    	let if_block = /*moreToolsOpen*/ ctx[13] && create_if_block_10(ctx);

    	const block = {
    		c: function create() {
    			small = element("small");
    			a = element("a");
    			a.textContent = "More Tools";
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(a, "href", "#a");
    			add_location(a, file$1, 368, 8, 11819);
    			attr_dev(small, "class", "sidewayslist");
    			add_location(small, file$1, 367, 4, 11781);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small, anchor);
    			append_dev(small, a);
    			append_dev(small, t1);
    			if (if_block) if_block.m(small, null);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_4*/ ctx[34], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*moreToolsOpen*/ ctx[13]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_10(ctx);
    					if_block.c();
    					if_block.m(small, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(367:0) {#if !isPlayground}",
    		ctx
    	});

    	return block;
    }

    // (370:8) {#if moreToolsOpen}
    function create_if_block_10(ctx) {
    	let a0;
    	let t1;
    	let a1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			a0.textContent = "Equal Weighting";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Grading Periods";
    			attr_dev(a0, "href", "#a");
    			add_location(a0, file$1, 370, 12, 11937);
    			attr_dev(a1, "href", "#a");
    			add_location(a1, file$1, 371, 12, 12029);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler_5*/ ctx[35], false, false, false),
    					listen_dev(a1, "click", /*click_handler_6*/ ctx[36], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(370:8) {#if moreToolsOpen}",
    		ctx
    	});

    	return block;
    }

    // (379:0) {#if showAreas.equalWeighting}
    function create_if_block_8(ctx) {
    	let article;
    	let div;
    	let h4;
    	let t1;
    	let p;
    	let t3;
    	let t4;
    	let hr;
    	let br;
    	let t5;
    	let nav;
    	let ul0;
    	let li0;
    	let t7;
    	let ul1;
    	let li1;
    	let label;
    	let input;
    	let article_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_6 = /*categories*/ ctx[4];
    	validate_each_argument(each_value_6);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	const block = {
    		c: function create() {
    			article = element("article");
    			div = element("div");
    			h4 = element("h4");
    			h4.textContent = "Equal Weighting";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Categories with this enabled will have all assignments weighted the same.";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			hr = element("hr");
    			br = element("br");
    			t5 = space();
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "All categories weighted same";
    			t7 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			label = element("label");
    			input = element("input");
    			add_location(h4, file$1, 381, 12, 12386);
    			add_location(p, file$1, 382, 12, 12424);
    			add_location(hr, file$1, 397, 12, 13067);
    			add_location(br, file$1, 397, 16, 13071);
    			add_location(li0, file$1, 399, 20, 13136);
    			add_location(ul0, file$1, 399, 16, 13132);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "name", "category");
    			attr_dev(input, "role", "switch");
    			add_location(input, file$1, 402, 24, 13274);
    			attr_dev(label, "for", "category");
    			add_location(label, file$1, 401, 20, 13226);
    			add_location(li1, file$1, 400, 20, 13200);
    			add_location(ul1, file$1, 400, 16, 13196);
    			set_style(nav, "width", "100%");
    			add_location(nav, file$1, 398, 12, 13089);
    			add_location(div, file$1, 380, 8, 12367);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 379, 4, 12315);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, div);
    			append_dev(div, h4);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(div, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t4);
    			append_dev(div, hr);
    			append_dev(div, br);
    			append_dev(div, t5);
    			append_dev(div, nav);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(nav, t7);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, label);
    			append_dev(label, input);
    			input.checked = /*courseSettings*/ ctx[2].allCategoriesWeightedSame;
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler_1*/ ctx[38]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*courseSettings, categories*/ 20) {
    				each_value_6 = /*categories*/ ctx[4];
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t4);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_6.length;
    			}

    			if (dirty[0] & /*courseSettings*/ 4) {
    				input.checked = /*courseSettings*/ ctx[2].allCategoriesWeightedSame;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, true);
    				article_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, false);
    			article_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_each(each_blocks, detaching);
    			if (detaching && article_transition) article_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(379:0) {#if showAreas.equalWeighting}",
    		ctx
    	});

    	return block;
    }

    // (384:12) {#each categories as cat}
    function create_each_block_6(ctx) {
    	let nav;
    	let ul0;
    	let li0;
    	let t0_value = /*cat*/ ctx[56].name + "";
    	let t0;
    	let t1;
    	let ul1;
    	let li1;
    	let label;
    	let input;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[37].call(input, /*cat*/ ctx[56]);
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			label = element("label");
    			input = element("input");
    			add_location(li0, file$1, 386, 24, 12637);
    			add_location(ul0, file$1, 385, 20, 12607);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "name", "switch");
    			attr_dev(input, "id", "switch");
    			attr_dev(input, "role", "switch");
    			add_location(input, file$1, 390, 28, 12789);
    			attr_dev(label, "for", "switch");
    			add_location(label, file$1, 389, 28, 12739);
    			add_location(li1, file$1, 389, 24, 12735);
    			add_location(ul1, file$1, 388, 20, 12705);
    			set_style(nav, "width", "100%");
    			add_location(nav, file$1, 384, 16, 12561);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, t0);
    			append_dev(nav, t1);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, label);
    			append_dev(label, input);
    			input.checked = /*courseSettings*/ ctx[2].equalWeighting[/*cat*/ ctx[56].name];

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*categories*/ 16 && t0_value !== (t0_value = /*cat*/ ctx[56].name + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*courseSettings, categories*/ 20) {
    				input.checked = /*courseSettings*/ ctx[2].equalWeighting[/*cat*/ ctx[56].name];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(384:12) {#each categories as cat}",
    		ctx
    	});

    	return block;
    }

    // (412:0) {#if showAreas.gradingPeriods}
    function create_if_block_7(ctx) {
    	let article;
    	let div;
    	let h4;
    	let t1;
    	let p;
    	let t3;
    	let article_transition;
    	let current;
    	let each_value_5 = Object.keys(/*terms*/ ctx[7]);
    	validate_each_argument(each_value_5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const block = {
    		c: function create() {
    			article = element("article");
    			div = element("div");
    			h4 = element("h4");
    			h4.textContent = "Grading Periods";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Enable/disable assignments in certain grading periods to be considered in calculation.";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h4, file$1, 414, 12, 13637);
    			add_location(p, file$1, 415, 12, 13675);
    			add_location(div, file$1, 413, 8, 13618);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 412, 4, 13566);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, div);
    			append_dev(div, h4);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(div, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*courseSettings, terms*/ 132) {
    				each_value_5 = Object.keys(/*terms*/ ctx[7]);
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_5.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, true);
    				article_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, false);
    			article_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_each(each_blocks, detaching);
    			if (detaching && article_transition) article_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(412:0) {#if showAreas.gradingPeriods}",
    		ctx
    	});

    	return block;
    }

    // (417:12) {#each Object.keys(terms) as term}
    function create_each_block_5(ctx) {
    	let nav;
    	let ul0;
    	let li0;
    	let t0_value = /*terms*/ ctx[7][/*term*/ ctx[69]].name + "";
    	let t0;
    	let t1;
    	let ul1;
    	let li1;
    	let label;
    	let input;
    	let t2;
    	let mounted;
    	let dispose;

    	function input_change_handler_2() {
    		/*input_change_handler_2*/ ctx[39].call(input, /*term*/ ctx[69]);
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			label = element("label");
    			input = element("input");
    			t2 = space();
    			add_location(li0, file$1, 419, 24, 13910);
    			add_location(ul0, file$1, 418, 20, 13880);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "name", "switch");
    			attr_dev(input, "id", "switch");
    			attr_dev(input, "role", "switch");
    			add_location(input, file$1, 423, 28, 14070);
    			attr_dev(label, "for", "switch");
    			add_location(label, file$1, 422, 28, 14020);
    			add_location(li1, file$1, 422, 24, 14016);
    			add_location(ul1, file$1, 421, 20, 13986);
    			set_style(nav, "width", "100%");
    			add_location(nav, file$1, 417, 16, 13834);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, t0);
    			append_dev(nav, t1);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, label);
    			append_dev(label, input);
    			input.checked = /*courseSettings*/ ctx[2].termEnabled[/*term*/ ctx[69].toString()];
    			append_dev(nav, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler_2);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*terms*/ 128 && t0_value !== (t0_value = /*terms*/ ctx[7][/*term*/ ctx[69]].name + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*courseSettings, terms*/ 132) {
    				input.checked = /*courseSettings*/ ctx[2].termEnabled[/*term*/ ctx[69].toString()];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(417:12) {#each Object.keys(terms) as term}",
    		ctx
    	});

    	return block;
    }

    // (435:0) {#if showAreas.newAssig}
    function create_if_block_6(ctx) {
    	let article;
    	let form;
    	let div0;
    	let label0;
    	let t0;
    	let input0;
    	let t1;
    	let label1;
    	let t2;
    	let select;
    	let t3;
    	let div1;
    	let label2;
    	let t4;
    	let input1;
    	let t5;
    	let label3;
    	let t6;
    	let input2;
    	let t7;
    	let input3;
    	let article_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_4 = /*categories*/ ctx[4];
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const block = {
    		c: function create() {
    			article = element("article");
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			t0 = text("Assignment name\r\n                    ");
    			input0 = element("input");
    			t1 = space();
    			label1 = element("label");
    			t2 = text("Category\r\n                    ");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div1 = element("div");
    			label2 = element("label");
    			t4 = text("Score\r\n                    ");
    			input1 = element("input");
    			t5 = space();
    			label3 = element("label");
    			t6 = text("Out of\r\n                    ");
    			input2 = element("input");
    			t7 = space();
    			input3 = element("input");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "aName");
    			add_location(input0, file$1, 439, 20, 14658);
    			attr_dev(label0, "for", "aName");
    			add_location(label0, file$1, 438, 16, 14602);
    			attr_dev(select, "name", "aCat");
    			select.required = true;
    			if (/*newAssig*/ ctx[9]["catName"] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[41].call(select));
    			add_location(select, file$1, 443, 20, 14811);
    			attr_dev(label1, "for", "aCat");
    			add_location(label1, file$1, 442, 16, 14763);
    			attr_dev(div0, "class", "grid");
    			add_location(div0, file$1, 437, 12, 14566);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "name", "aScore");
    			attr_dev(input1, "step", "0.01");
    			input1.required = true;
    			add_location(input1, file$1, 453, 20, 15207);
    			attr_dev(label2, "for", "aScore");
    			add_location(label2, file$1, 452, 16, 15160);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "name", "aOutOf");
    			attr_dev(input2, "step", "0.01");
    			input2.required = true;
    			add_location(input2, file$1, 456, 20, 15383);
    			attr_dev(label3, "for", "aOutOf");
    			add_location(label3, file$1, 455, 16, 15335);
    			attr_dev(div1, "class", "grid");
    			add_location(div1, file$1, 451, 12, 15124);
    			attr_dev(input3, "type", "submit");
    			input3.value = "Add";
    			add_location(input3, file$1, 460, 12, 15529);
    			attr_dev(form, "action", "#");
    			add_location(form, file$1, 436, 8, 14491);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 435, 4, 14439);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, form);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(label0, t0);
    			append_dev(label0, input0);
    			set_input_value(input0, /*newAssig*/ ctx[9].name);
    			append_dev(div0, t1);
    			append_dev(div0, label1);
    			append_dev(label1, t2);
    			append_dev(label1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*newAssig*/ ctx[9]["catName"]);
    			append_dev(form, t3);
    			append_dev(form, div1);
    			append_dev(div1, label2);
    			append_dev(label2, t4);
    			append_dev(label2, input1);
    			set_input_value(input1, /*newAssig*/ ctx[9].score);
    			append_dev(div1, t5);
    			append_dev(div1, label3);
    			append_dev(label3, t6);
    			append_dev(label3, input2);
    			set_input_value(input2, /*newAssig*/ ctx[9].outof);
    			append_dev(form, t7);
    			append_dev(form, input3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[40]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[41]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[42]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[43]),
    					listen_dev(form, "submit", prevent_default(/*submitAssignment*/ ctx[21]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newAssig, categories*/ 528 && input0.value !== /*newAssig*/ ctx[9].name) {
    				set_input_value(input0, /*newAssig*/ ctx[9].name);
    			}

    			if (dirty[0] & /*categories*/ 16) {
    				each_value_4 = /*categories*/ ctx[4];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}

    			if (dirty[0] & /*newAssig, categories*/ 528) {
    				select_option(select, /*newAssig*/ ctx[9]["catName"]);
    			}

    			if (dirty[0] & /*newAssig, categories*/ 528 && to_number(input1.value) !== /*newAssig*/ ctx[9].score) {
    				set_input_value(input1, /*newAssig*/ ctx[9].score);
    			}

    			if (dirty[0] & /*newAssig, categories*/ 528 && to_number(input2.value) !== /*newAssig*/ ctx[9].outof) {
    				set_input_value(input2, /*newAssig*/ ctx[9].outof);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, true);
    				article_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, false);
    			article_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_each(each_blocks, detaching);
    			if (detaching && article_transition) article_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(435:0) {#if showAreas.newAssig}",
    		ctx
    	});

    	return block;
    }

    // (445:24) {#each categories as cat}
    function create_each_block_4(ctx) {
    	let option;
    	let t_value = /*cat*/ ctx[56].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*cat*/ ctx[56].name;
    			option.value = option.__value;
    			add_location(option, file$1, 445, 28, 14954);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*categories*/ 16 && t_value !== (t_value = /*cat*/ ctx[56].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*categories*/ 16 && option_value_value !== (option_value_value = /*cat*/ ctx[56].name)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(445:24) {#each categories as cat}",
    		ctx
    	});

    	return block;
    }

    // (467:0) {#if showAreas.newCategory}
    function create_if_block_5(ctx) {
    	let article;
    	let form;
    	let div;
    	let label0;
    	let t0;
    	let input0;
    	let t1;
    	let label1;
    	let t2;
    	let input1;
    	let t3;
    	let input2;
    	let article_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			article = element("article");
    			form = element("form");
    			div = element("div");
    			label0 = element("label");
    			t0 = text("Category Name\r\n                    ");
    			input0 = element("input");
    			t1 = space();
    			label1 = element("label");
    			t2 = text("Weight (%)\r\n                    ");
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "cName");
    			input0.required = true;
    			add_location(input0, file$1, 471, 20, 15882);
    			attr_dev(label0, "for", "cName");
    			add_location(label0, file$1, 470, 16, 15828);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "100");
    			attr_dev(input1, "name", "cWeight");
    			input1.required = true;
    			add_location(input1, file$1, 474, 20, 16050);
    			attr_dev(label1, "for", "cWeight");
    			add_location(label1, file$1, 473, 16, 15997);
    			attr_dev(div, "class", "grid");
    			add_location(div, file$1, 469, 12, 15792);
    			attr_dev(input2, "type", "submit");
    			input2.value = "Add";
    			add_location(input2, file$1, 477, 12, 16205);
    			attr_dev(form, "action", "#");
    			add_location(form, file$1, 468, 8, 15719);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 467, 4, 15667);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, form);
    			append_dev(form, div);
    			append_dev(div, label0);
    			append_dev(label0, t0);
    			append_dev(label0, input0);
    			set_input_value(input0, /*newCategory*/ ctx[10].name);
    			append_dev(div, t1);
    			append_dev(div, label1);
    			append_dev(label1, t2);
    			append_dev(label1, input1);
    			set_input_value(input1, /*newCategory*/ ctx[10].weight);
    			append_dev(form, t3);
    			append_dev(form, input2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[44]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[45]),
    					listen_dev(form, "submit", prevent_default(/*submitCategory*/ ctx[22]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newCategory*/ 1024 && input0.value !== /*newCategory*/ ctx[10].name) {
    				set_input_value(input0, /*newCategory*/ ctx[10].name);
    			}

    			if (dirty[0] & /*newCategory*/ 1024 && to_number(input1.value) !== /*newCategory*/ ctx[10].weight) {
    				set_input_value(input1, /*newCategory*/ ctx[10].weight);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, true);
    				article_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, false);
    			article_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (detaching && article_transition) article_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(467:0) {#if showAreas.newCategory}",
    		ctx
    	});

    	return block;
    }

    // (483:0) {#if showAreas.saveLoad}
    function create_if_block_4(ctx) {
    	let article;
    	let h4;
    	let t1;
    	let p;
    	let t3;
    	let form;
    	let div0;
    	let input0;
    	let t4;
    	let input1;
    	let t5;
    	let div1;
    	let select;
    	let t6;
    	let button;
    	let t8;
    	let div2;
    	let a;
    	let article_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_3 = Object.entries(/*savedCourses*/ ctx[16]);
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			article = element("article");
    			h4 = element("h4");
    			h4.textContent = "Save & Load";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Save your current course to a file, or load a course from a file.";
    			t3 = space();
    			form = element("form");
    			div0 = element("div");
    			input0 = element("input");
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			div1 = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			button = element("button");
    			button.textContent = "Load";
    			t8 = space();
    			div2 = element("div");
    			a = element("a");
    			a.textContent = "Delete";
    			add_location(h4, file$1, 484, 8, 16364);
    			add_location(p, file$1, 485, 8, 16394);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Save Name...");
    			add_location(input0, file$1, 488, 16, 16598);
    			attr_dev(input1, "type", "submit");
    			input1.value = "Save As";
    			add_location(input1, file$1, 489, 16, 16690);
    			attr_dev(div0, "class", "grid");
    			add_location(div0, file$1, 487, 12, 16562);
    			set_style(form, "margin-bottom", "0");
    			add_location(form, file$1, 486, 8, 16476);
    			attr_dev(select, "name", "loadCourse");
    			if (/*loadCourseName*/ ctx[15] === void 0) add_render_callback(() => /*select_change_handler_1*/ ctx[47].call(select));
    			add_location(select, file$1, 493, 12, 16806);
    			add_location(button, file$1, 498, 12, 17052);
    			attr_dev(div1, "class", "grid");
    			add_location(div1, file$1, 492, 8, 16774);
    			attr_dev(a, "href", "#1");
    			attr_dev(a, "role", "button");
    			attr_dev(a, "class", "secondary outline");
    			add_location(a, file$1, 502, 12, 17163);
    			attr_dev(div2, "class", "sidewayslist");
    			add_location(div2, file$1, 501, 8, 17123);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 483, 4, 16312);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, h4);
    			append_dev(article, t1);
    			append_dev(article, p);
    			append_dev(article, t3);
    			append_dev(article, form);
    			append_dev(form, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*saveCourseName*/ ctx[14]);
    			append_dev(div0, t4);
    			append_dev(div0, input1);
    			append_dev(article, t5);
    			append_dev(article, div1);
    			append_dev(div1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*loadCourseName*/ ctx[15]);
    			append_dev(div1, t6);
    			append_dev(div1, button);
    			append_dev(article, t8);
    			append_dev(article, div2);
    			append_dev(div2, a);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_2*/ ctx[46]),
    					listen_dev(form, "submit", prevent_default(/*saveCourseAs*/ ctx[25]), false, true, false),
    					listen_dev(select, "change", /*select_change_handler_1*/ ctx[47]),
    					listen_dev(button, "click", /*loadCourse*/ ctx[26], false, false, false),
    					listen_dev(a, "click", prevent_default(/*deleteCourse*/ ctx[27]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*saveCourseName*/ 16384 && input0.value !== /*saveCourseName*/ ctx[14]) {
    				set_input_value(input0, /*saveCourseName*/ ctx[14]);
    			}

    			if (dirty[0] & /*savedCourses*/ 65536) {
    				each_value_3 = Object.entries(/*savedCourses*/ ctx[16]);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}

    			if (dirty[0] & /*loadCourseName, savedCourses*/ 98304) {
    				select_option(select, /*loadCourseName*/ ctx[15]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, true);
    				article_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, false);
    			article_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_each(each_blocks, detaching);
    			if (detaching && article_transition) article_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(483:0) {#if showAreas.saveLoad}",
    		ctx
    	});

    	return block;
    }

    // (495:16) {#each Object.entries(savedCourses) as [name, course]}
    function create_each_block_3(ctx) {
    	let option;
    	let t_value = /*name*/ ctx[64] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*name*/ ctx[64];
    			option.value = option.__value;
    			add_location(option, file$1, 495, 20, 16954);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*savedCourses*/ 65536 && t_value !== (t_value = /*name*/ ctx[64] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*savedCourses*/ 65536 && option_value_value !== (option_value_value = /*name*/ ctx[64])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(495:16) {#each Object.entries(savedCourses) as [name, course]}",
    		ctx
    	});

    	return block;
    }

    // (509:0) {#if showAreas.showGraph}
    function create_if_block_3$1(ctx) {
    	let article;
    	let chart;
    	let article_transition;
    	let current;

    	chart = new Base$1({
    			props: {
    				data: /*gradesOverTime*/ ctx[23],
    				type: "line"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			article = element("article");
    			create_component(chart.$$.fragment);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 509, 4, 17355);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			mount_component(chart, article, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chart.$$.fragment, local);

    			add_render_callback(() => {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, true);
    				article_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chart.$$.fragment, local);
    			if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, false);
    			article_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_component(chart);
    			if (detaching && article_transition) article_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(509:0) {#if showAreas.showGraph}",
    		ctx
    	});

    	return block;
    }

    // (516:0) {#if showAreas.whatToMaintain}
    function create_if_block_2$1(ctx) {
    	let article;
    	let h4;
    	let t1;
    	let p0;
    	let t3;
    	let div0;
    	let p1;
    	let t5;
    	let input0;
    	let t6;
    	let p2;
    	let t8;
    	let div1;
    	let label0;
    	let t9;
    	let select;
    	let t10;
    	let label1;
    	let t11;
    	let input1;
    	let t12;
    	let p3;
    	let t13;
    	let strong;
    	let t14_value = /*minNeedAssig*/ ctx[6].score + "";
    	let t14;
    	let t15;
    	let t16_value = /*minNeedAssig*/ ctx[6].outof + "";
    	let t16;
    	let t17;
    	let t18_value = /*minNeedAssig*/ ctx[6].toString() + "";
    	let t18;
    	let t19;
    	let t20;
    	let t21;
    	let t22;
    	let article_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*categories*/ ctx[4];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			article = element("article");
    			h4 = element("h4");
    			h4.textContent = "What do I need to maintain X grade?";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Create a variable assignment or choose an existing one to predict the lowest score you need to maintain a certain grade.";
    			t3 = space();
    			div0 = element("div");
    			p1 = element("p");
    			p1.textContent = "Grade wanted (percent):";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "Variable assignment:";
    			t8 = space();
    			div1 = element("div");
    			label0 = element("label");
    			t9 = text("Category\r\n                ");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			label1 = element("label");
    			t11 = text("Out of\r\n                ");
    			input1 = element("input");
    			t12 = space();
    			p3 = element("p");
    			t13 = text("You need a minimum of ");
    			strong = element("strong");
    			t14 = text(t14_value);
    			t15 = text("/");
    			t16 = text(t16_value);
    			t17 = text(" (");
    			t18 = text(t18_value);
    			t19 = text("%)");
    			t20 = text(" on this assignment to maintain a grade of ");
    			t21 = text(/*gradeWanted*/ ctx[5]);
    			t22 = text("%.");
    			add_location(h4, file$1, 517, 8, 17611);
    			add_location(p0, file$1, 518, 8, 17665);
    			add_location(p1, file$1, 520, 12, 17834);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "placeholder", "%");
    			add_location(input0, file$1, 521, 12, 17878);
    			attr_dev(div0, "class", "grid");
    			add_location(div0, file$1, 519, 8, 17802);
    			add_location(p2, file$1, 523, 8, 17966);
    			attr_dev(select, "name", "aCat");
    			select.required = true;
    			if (/*minNeedAssig*/ ctx[6]["catName"] === void 0) add_render_callback(() => /*select_change_handler_2*/ ctx[49].call(select));
    			add_location(select, file$1, 526, 16, 18079);
    			attr_dev(label0, "for", "aCat");
    			add_location(label0, file$1, 525, 12, 18035);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "name", "aOutOf");
    			input1.required = true;
    			add_location(input1, file$1, 534, 16, 18400);
    			attr_dev(label1, "for", "aOutOf");
    			add_location(label1, file$1, 533, 12, 18356);
    			attr_dev(div1, "class", "grid");
    			add_location(div1, file$1, 524, 8, 18003);
    			add_location(strong, file$1, 538, 33, 18551);
    			add_location(p3, file$1, 538, 8, 18526);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 516, 4, 17559);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, h4);
    			append_dev(article, t1);
    			append_dev(article, p0);
    			append_dev(article, t3);
    			append_dev(article, div0);
    			append_dev(div0, p1);
    			append_dev(div0, t5);
    			append_dev(div0, input0);
    			set_input_value(input0, /*gradeWanted*/ ctx[5]);
    			append_dev(article, t6);
    			append_dev(article, p2);
    			append_dev(article, t8);
    			append_dev(article, div1);
    			append_dev(div1, label0);
    			append_dev(label0, t9);
    			append_dev(label0, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*minNeedAssig*/ ctx[6]["catName"]);
    			append_dev(div1, t10);
    			append_dev(div1, label1);
    			append_dev(label1, t11);
    			append_dev(label1, input1);
    			set_input_value(input1, /*minNeedAssig*/ ctx[6].outof);
    			append_dev(article, t12);
    			append_dev(article, p3);
    			append_dev(p3, t13);
    			append_dev(p3, strong);
    			append_dev(strong, t14);
    			append_dev(strong, t15);
    			append_dev(strong, t16);
    			append_dev(strong, t17);
    			append_dev(strong, t18);
    			append_dev(strong, t19);
    			append_dev(p3, t20);
    			append_dev(p3, t21);
    			append_dev(p3, t22);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_3*/ ctx[48]),
    					listen_dev(select, "change", /*select_change_handler_2*/ ctx[49]),
    					listen_dev(input1, "input", /*input1_input_handler_2*/ ctx[50])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gradeWanted*/ 32 && to_number(input0.value) !== /*gradeWanted*/ ctx[5]) {
    				set_input_value(input0, /*gradeWanted*/ ctx[5]);
    			}

    			if (dirty[0] & /*categories*/ 16) {
    				each_value_2 = /*categories*/ ctx[4];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}

    			if (dirty[0] & /*minNeedAssig, categories*/ 80) {
    				select_option(select, /*minNeedAssig*/ ctx[6]["catName"]);
    			}

    			if (dirty[0] & /*minNeedAssig, categories*/ 80 && to_number(input1.value) !== /*minNeedAssig*/ ctx[6].outof) {
    				set_input_value(input1, /*minNeedAssig*/ ctx[6].outof);
    			}

    			if ((!current || dirty[0] & /*minNeedAssig*/ 64) && t14_value !== (t14_value = /*minNeedAssig*/ ctx[6].score + "")) set_data_dev(t14, t14_value);
    			if ((!current || dirty[0] & /*minNeedAssig*/ 64) && t16_value !== (t16_value = /*minNeedAssig*/ ctx[6].outof + "")) set_data_dev(t16, t16_value);
    			if ((!current || dirty[0] & /*minNeedAssig*/ 64) && t18_value !== (t18_value = /*minNeedAssig*/ ctx[6].toString() + "")) set_data_dev(t18, t18_value);
    			if (!current || dirty[0] & /*gradeWanted*/ 32) set_data_dev(t21, /*gradeWanted*/ ctx[5]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, true);
    				article_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!article_transition) article_transition = create_bidirectional_transition(article, slide, {}, false);
    			article_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_each(each_blocks, detaching);
    			if (detaching && article_transition) article_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(516:0) {#if showAreas.whatToMaintain}",
    		ctx
    	});

    	return block;
    }

    // (528:20) {#each categories as cat}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*cat*/ ctx[56].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*cat*/ ctx[56].name;
    			option.value = option.__value;
    			add_location(option, file$1, 528, 24, 18218);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*categories*/ 16 && t_value !== (t_value = /*cat*/ ctx[56].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*categories*/ 16 && option_value_value !== (option_value_value = /*cat*/ ctx[56].name)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(528:20) {#each categories as cat}",
    		ctx
    	});

    	return block;
    }

    // (575:16) {#if assig.isEnabled(courseSettings.termEnabled)}
    function create_if_block$1(ctx) {
    	let li2;
    	let nav;
    	let ul0;
    	let li0;
    	let t0_value = /*assig*/ ctx[59].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*assig*/ ctx[59].toString() + "";
    	let t2;
    	let t3;
    	let t4_value = /*assig*/ ctx[59].getOgGrade() + "";
    	let t4;
    	let t5;
    	let small;
    	let a;
    	let t7;
    	let t8;
    	let ul1;
    	let li1;
    	let div;
    	let input0;
    	let t9;
    	let input1;
    	let t10;
    	let mounted;
    	let dispose;
    	let if_block = /*showAreas*/ ctx[8].whatToMaintain && create_if_block_1$1(ctx);

    	function input0_input_handler_5() {
    		/*input0_input_handler_5*/ ctx[52].call(input0, /*each_value_1*/ ctx[60], /*assig_index*/ ctx[61]);
    	}

    	function input1_input_handler_3() {
    		/*input1_input_handler_3*/ ctx[53].call(input1, /*each_value_1*/ ctx[60], /*assig_index*/ ctx[61]);
    	}

    	const block = {
    		c: function create() {
    			li2 = element("li");
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = text("% ");
    			t4 = text(t4_value);
    			t5 = text("  \r\n                            ");
    			small = element("small");
    			a = element("a");
    			a.textContent = "delete";
    			t7 = text("  \r\n                                ");
    			if (if_block) if_block.c();
    			t8 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			div = element("div");
    			input0 = element("input");
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			attr_dev(a, "href", "#a");
    			add_location(a, file$1, 580, 32, 20254);
    			attr_dev(small, "class", "modifiers");
    			add_location(small, file$1, 579, 28, 20195);
    			add_location(li0, file$1, 576, 28, 20041);
    			add_location(ul0, file$1, 576, 24, 20037);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "placeholder", "Score");
    			add_location(input0, file$1, 588, 32, 20767);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "placeholder", "Out Of");
    			add_location(input1, file$1, 589, 32, 20867);
    			attr_dev(div, "class", "grid");
    			add_location(div, file$1, 587, 28, 20715);
    			add_location(li1, file$1, 586, 28, 20681);
    			add_location(ul1, file$1, 586, 24, 20677);
    			add_location(nav, file$1, 575, 24, 20006);
    			add_location(li2, file$1, 575, 20, 20002);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li2, anchor);
    			append_dev(li2, nav);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, t0);
    			append_dev(li0, t1);
    			append_dev(li0, t2);
    			append_dev(li0, t3);
    			append_dev(li0, t4);
    			append_dev(li0, t5);
    			append_dev(li0, small);
    			append_dev(small, a);
    			append_dev(small, t7);
    			if (if_block) if_block.m(small, null);
    			append_dev(nav, t8);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, div);
    			append_dev(div, input0);
    			set_input_value(input0, /*assig*/ ctx[59].score);
    			append_dev(div, t9);
    			append_dev(div, input1);
    			set_input_value(input1, /*assig*/ ctx[59].outof);
    			append_dev(nav, t10);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						a,
    						"click",
    						prevent_default(function () {
    							if (is_function(/*deleteAssignment*/ ctx[20](/*cat*/ ctx[56], /*assig*/ ctx[59]))) /*deleteAssignment*/ ctx[20](/*cat*/ ctx[56], /*assig*/ ctx[59]).apply(this, arguments);
    						}),
    						false,
    						true,
    						false
    					),
    					listen_dev(input0, "input", input0_input_handler_5),
    					listen_dev(input1, "input", input1_input_handler_3)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*categories*/ 16 && t0_value !== (t0_value = /*assig*/ ctx[59].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*categories*/ 16 && t2_value !== (t2_value = /*assig*/ ctx[59].toString() + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*categories*/ 16 && t4_value !== (t4_value = /*assig*/ ctx[59].getOgGrade() + "")) set_data_dev(t4, t4_value);

    			if (/*showAreas*/ ctx[8].whatToMaintain) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(small, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*categories*/ 16 && to_number(input0.value) !== /*assig*/ ctx[59].score) {
    				set_input_value(input0, /*assig*/ ctx[59].score);
    			}

    			if (dirty[0] & /*categories*/ 16 && to_number(input1.value) !== /*assig*/ ctx[59].outof) {
    				set_input_value(input1, /*assig*/ ctx[59].outof);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li2);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(575:16) {#if assig.isEnabled(courseSettings.termEnabled)}",
    		ctx
    	});

    	return block;
    }

    // (582:32) {#if showAreas.whatToMaintain}
    function create_if_block_1$1(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "make variable";
    			attr_dev(a, "href", "#a");
    			add_location(a, file$1, 582, 36, 20441);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(
    					a,
    					"click",
    					prevent_default(function () {
    						if (is_function(/*makeAssigVariable*/ ctx[24](/*assig*/ ctx[59].outof, /*cat*/ ctx[56].name))) /*makeAssigVariable*/ ctx[24](/*assig*/ ctx[59].outof, /*cat*/ ctx[56].name).apply(this, arguments);
    					}),
    					false,
    					true,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(582:32) {#if showAreas.whatToMaintain}",
    		ctx
    	});

    	return block;
    }

    // (573:12) {#each cat.assignments as assig}
    function create_each_block_1(ctx) {
    	let show_if = /*assig*/ ctx[59].isEnabled(/*courseSettings*/ ctx[2].termEnabled);
    	let if_block_anchor;
    	let if_block = show_if && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*categories, courseSettings*/ 20) show_if = /*assig*/ ctx[59].isEnabled(/*courseSettings*/ ctx[2].termEnabled);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(573:12) {#each cat.assignments as assig}",
    		ctx
    	});

    	return block;
    }

    // (546:0) {#each categories as cat}
    function create_each_block(ctx) {
    	let details;
    	let summary;
    	let t0_value = /*cat*/ ctx[56].toString(/*courseSettings*/ ctx[2].equalWeighting[/*cat*/ ctx[56].name], /*courseSettings*/ ctx[2].termEnabled) + "";
    	let t0;
    	let t1;
    	let ul4;
    	let nav0;
    	let ul0;
    	let li0;
    	let t3;
    	let ul1;
    	let li1;
    	let div0;
    	let input0;
    	let t4;
    	let p;
    	let t6;
    	let nav1;
    	let ul2;
    	let li2;
    	let input1;
    	let t7;
    	let li3;
    	let a;
    	let t9;
    	let ul3;
    	let li4;
    	let div1;
    	let input2;
    	let t10;
    	let input3;
    	let t11;
    	let br;
    	let t12;
    	let t13;
    	let mounted;
    	let dispose;

    	function input0_input_handler_4() {
    		/*input0_input_handler_4*/ ctx[51].call(input0, /*each_value*/ ctx[57], /*cat_index*/ ctx[58]);
    	}

    	let each_value_1 = /*cat*/ ctx[56].assignments;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			details = element("details");
    			summary = element("summary");
    			t0 = text(t0_value);
    			t1 = space();
    			ul4 = element("ul");
    			nav0 = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "Weight:";
    			t3 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			div0 = element("div");
    			input0 = element("input");
    			t4 = space();
    			p = element("p");
    			p.textContent = "%";
    			t6 = space();
    			nav1 = element("nav");
    			ul2 = element("ul");
    			li2 = element("li");
    			input1 = element("input");
    			t7 = space();
    			li3 = element("li");
    			a = element("a");
    			a.textContent = "Add";
    			t9 = space();
    			ul3 = element("ul");
    			li4 = element("li");
    			div1 = element("div");
    			input2 = element("input");
    			t10 = space();
    			input3 = element("input");
    			t11 = space();
    			br = element("br");
    			t12 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			add_location(summary, file$1, 547, 8, 18833);
    			add_location(li0, file$1, 550, 20, 19007);
    			add_location(ul0, file$1, 550, 16, 19003);
    			attr_dev(input0, "type", "number");
    			add_location(input0, file$1, 553, 24, 19121);
    			add_location(p, file$1, 554, 24, 19193);
    			attr_dev(div0, "class", "grid");
    			add_location(div0, file$1, 552, 20, 19077);
    			add_location(li1, file$1, 551, 20, 19051);
    			add_location(ul1, file$1, 551, 16, 19047);
    			add_location(nav0, file$1, 549, 12, 18980);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "New Assignment Name...");
    			add_location(input1, file$1, 561, 24, 19346);
    			add_location(li2, file$1, 561, 20, 19342);
    			attr_dev(a, "href", "#1");
    			attr_dev(a, "role", "button");
    			attr_dev(a, "class", "primary outline");
    			add_location(a, file$1, 562, 24, 19433);
    			add_location(li3, file$1, 562, 20, 19429);
    			add_location(ul2, file$1, 560, 16, 19316);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "placeholder", "Score");
    			add_location(input2, file$1, 566, 24, 19611);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "placeholder", "Out Of");
    			add_location(input3, file$1, 567, 24, 19678);
    			attr_dev(div1, "class", "grid");
    			add_location(div1, file$1, 565, 20, 19567);
    			add_location(li4, file$1, 564, 20, 19541);
    			add_location(ul3, file$1, 564, 16, 19537);
    			add_location(nav1, file$1, 559, 12, 19293);
    			add_location(br, file$1, 571, 12, 19810);
    			attr_dev(ul4, "class", "longlist");
    			add_location(ul4, file$1, 548, 8, 18945);
    			add_location(details, file$1, 546, 4, 18814);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			append_dev(summary, t0);
    			append_dev(details, t1);
    			append_dev(details, ul4);
    			append_dev(ul4, nav0);
    			append_dev(nav0, ul0);
    			append_dev(ul0, li0);
    			append_dev(nav0, t3);
    			append_dev(nav0, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*cat*/ ctx[56].weight);
    			append_dev(div0, t4);
    			append_dev(div0, p);
    			append_dev(ul4, t6);
    			append_dev(ul4, nav1);
    			append_dev(nav1, ul2);
    			append_dev(ul2, li2);
    			append_dev(li2, input1);
    			append_dev(ul2, t7);
    			append_dev(ul2, li3);
    			append_dev(li3, a);
    			append_dev(nav1, t9);
    			append_dev(nav1, ul3);
    			append_dev(ul3, li4);
    			append_dev(li4, div1);
    			append_dev(div1, input2);
    			append_dev(div1, t10);
    			append_dev(div1, input3);
    			append_dev(ul4, t11);
    			append_dev(ul4, br);
    			append_dev(ul4, t12);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul4, null);
    			}

    			append_dev(details, t13);

    			if (!mounted) {
    				dispose = listen_dev(input0, "input", input0_input_handler_4);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*categories, courseSettings*/ 20 && t0_value !== (t0_value = /*cat*/ ctx[56].toString(/*courseSettings*/ ctx[2].equalWeighting[/*cat*/ ctx[56].name], /*courseSettings*/ ctx[2].termEnabled) + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*categories*/ 16 && to_number(input0.value) !== /*cat*/ ctx[56].weight) {
    				set_input_value(input0, /*cat*/ ctx[56].weight);
    			}

    			if (dirty[0] & /*categories, makeAssigVariable, showAreas, deleteAssignment, courseSettings*/ 17826068) {
    				each_value_1 = /*cat*/ ctx[56].assignments;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(details);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(546:0) {#each categories as cat}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let nav;
    	let ul0;
    	let li0;
    	let h3;
    	let t0_value = /*course*/ ctx[1].details[0].task.courseName + "";
    	let t0;
    	let t1;
    	let ul1;
    	let li1;
    	let a;
    	let strong0;
    	let t3;
    	let div0;
    	let p;
    	let strong1;
    	let t5;
    	let t6_value = /*getCurrentGrade*/ ctx[18]() + "";
    	let t6;
    	let t7;
    	let strong2;
    	let t9;
    	let t10_value = (/*newGrade*/ ctx[3] * 100).toFixed(2) + "";
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let div1;
    	let button0;
    	let t15;
    	let button1;
    	let t17;
    	let t18;
    	let t19;
    	let t20;
    	let t21;
    	let t22;
    	let t23;
    	let t24;
    	let t25;
    	let t26;
    	let br0;
    	let br1;
    	let t27;
    	let hr;
    	let t28;
    	let each_1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*issticky*/ ctx[11] && create_if_block_12(ctx);
    	let if_block1 = /*isPlayground*/ ctx[0] && create_if_block_11(ctx);
    	let if_block2 = !/*isPlayground*/ ctx[0] && create_if_block_9(ctx);
    	let if_block3 = /*showAreas*/ ctx[8].equalWeighting && create_if_block_8(ctx);
    	let if_block4 = /*showAreas*/ ctx[8].gradingPeriods && create_if_block_7(ctx);
    	let if_block5 = /*showAreas*/ ctx[8].newAssig && create_if_block_6(ctx);
    	let if_block6 = /*showAreas*/ ctx[8].newCategory && create_if_block_5(ctx);
    	let if_block7 = /*showAreas*/ ctx[8].saveLoad && create_if_block_4(ctx);
    	let if_block8 = /*showAreas*/ ctx[8].showGraph && create_if_block_3$1(ctx);
    	let if_block9 = /*showAreas*/ ctx[8].whatToMaintain && create_if_block_2$1(ctx);
    	let each_value = /*categories*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			a = element("a");
    			strong0 = element("strong");
    			strong0.textContent = "Back";
    			t3 = space();
    			div0 = element("div");
    			p = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "Original:";
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = text(" | ");
    			strong2 = element("strong");
    			strong2.textContent = "New:";
    			t9 = space();
    			t10 = text(t10_value);
    			t11 = text("%");
    			t12 = space();
    			if (if_block0) if_block0.c();
    			t13 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "New Assignment";
    			t15 = space();
    			button1 = element("button");
    			button1.textContent = "New Category";
    			t17 = space();
    			if (if_block1) if_block1.c();
    			t18 = space();
    			if (if_block2) if_block2.c();
    			t19 = space();
    			if (if_block3) if_block3.c();
    			t20 = space();
    			if (if_block4) if_block4.c();
    			t21 = space();
    			if (if_block5) if_block5.c();
    			t22 = space();
    			if (if_block6) if_block6.c();
    			t23 = space();
    			if (if_block7) if_block7.c();
    			t24 = space();
    			if (if_block8) if_block8.c();
    			t25 = space();
    			if (if_block9) if_block9.c();
    			t26 = space();
    			br0 = element("br");
    			br1 = element("br");
    			t27 = space();
    			hr = element("hr");
    			t28 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h3, file$1, 338, 12, 10755);
    			add_location(li0, file$1, 338, 8, 10751);
    			add_location(ul0, file$1, 337, 4, 10737);
    			add_location(strong0, file$1, 341, 91, 10918);
    			attr_dev(a, "role", "button");
    			attr_dev(a, "class", "outline");
    			attr_dev(a, "href", "#/");
    			add_location(a, file$1, 341, 12, 10839);
    			add_location(li1, file$1, 341, 8, 10835);
    			add_location(ul1, file$1, 340, 4, 10821);
    			add_location(nav, file$1, 336, 0, 10726);
    			add_location(strong1, file$1, 347, 7, 11041);
    			add_location(strong2, file$1, 347, 57, 11091);
    			add_location(p, file$1, 347, 4, 11038);
    			add_location(div0, file$1, 346, 0, 11008);
    			add_location(button0, file$1, 358, 4, 11393);
    			add_location(button1, file$1, 359, 4, 11472);
    			attr_dev(div1, "class", "grid");
    			add_location(div1, file$1, 357, 0, 11369);
    			add_location(br0, file$1, 542, 0, 18727);
    			add_location(br1, file$1, 542, 4, 18731);
    			add_location(hr, file$1, 544, 0, 18777);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, h3);
    			append_dev(h3, t0);
    			append_dev(nav, t1);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, a);
    			append_dev(a, strong0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, p);
    			append_dev(p, strong1);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			append_dev(p, t7);
    			append_dev(p, strong2);
    			append_dev(p, t9);
    			append_dev(p, t10);
    			append_dev(p, t11);
    			/*div0_binding*/ ctx[30](div0);
    			insert_dev(target, t12, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(div1, t15);
    			append_dev(div1, button1);
    			append_dev(div1, t17);
    			if (if_block1) if_block1.m(div1, null);
    			insert_dev(target, t18, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t19, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t20, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, t21, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert_dev(target, t22, anchor);
    			if (if_block6) if_block6.m(target, anchor);
    			insert_dev(target, t23, anchor);
    			if (if_block7) if_block7.m(target, anchor);
    			insert_dev(target, t24, anchor);
    			if (if_block8) if_block8.m(target, anchor);
    			insert_dev(target, t25, anchor);
    			if (if_block9) if_block9.m(target, anchor);
    			insert_dev(target, t26, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t28, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*click_handler*/ ctx[29], false, false, false),
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[31], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[32], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*course*/ 2) && t0_value !== (t0_value = /*course*/ ctx[1].details[0].task.courseName + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty[0] & /*newGrade*/ 8) && t10_value !== (t10_value = (/*newGrade*/ ctx[3] * 100).toFixed(2) + "")) set_data_dev(t10, t10_value);

    			if (/*issticky*/ ctx[11]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_12(ctx);
    					if_block0.c();
    					if_block0.m(t13.parentNode, t13);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*isPlayground*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_11(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (!/*isPlayground*/ ctx[0]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_9(ctx);
    					if_block2.c();
    					if_block2.m(t19.parentNode, t19);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*showAreas*/ ctx[8].equalWeighting) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*showAreas*/ 256) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_8(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t20.parentNode, t20);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*showAreas*/ ctx[8].gradingPeriods) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*showAreas*/ 256) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_7(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(t21.parentNode, t21);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*showAreas*/ ctx[8].newAssig) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty[0] & /*showAreas*/ 256) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_6(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(t22.parentNode, t22);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (/*showAreas*/ ctx[8].newCategory) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);

    					if (dirty[0] & /*showAreas*/ 256) {
    						transition_in(if_block6, 1);
    					}
    				} else {
    					if_block6 = create_if_block_5(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(t23.parentNode, t23);
    				}
    			} else if (if_block6) {
    				group_outros();

    				transition_out(if_block6, 1, 1, () => {
    					if_block6 = null;
    				});

    				check_outros();
    			}

    			if (/*showAreas*/ ctx[8].saveLoad) {
    				if (if_block7) {
    					if_block7.p(ctx, dirty);

    					if (dirty[0] & /*showAreas*/ 256) {
    						transition_in(if_block7, 1);
    					}
    				} else {
    					if_block7 = create_if_block_4(ctx);
    					if_block7.c();
    					transition_in(if_block7, 1);
    					if_block7.m(t24.parentNode, t24);
    				}
    			} else if (if_block7) {
    				group_outros();

    				transition_out(if_block7, 1, 1, () => {
    					if_block7 = null;
    				});

    				check_outros();
    			}

    			if (/*showAreas*/ ctx[8].showGraph) {
    				if (if_block8) {
    					if_block8.p(ctx, dirty);

    					if (dirty[0] & /*showAreas*/ 256) {
    						transition_in(if_block8, 1);
    					}
    				} else {
    					if_block8 = create_if_block_3$1(ctx);
    					if_block8.c();
    					transition_in(if_block8, 1);
    					if_block8.m(t25.parentNode, t25);
    				}
    			} else if (if_block8) {
    				group_outros();

    				transition_out(if_block8, 1, 1, () => {
    					if_block8 = null;
    				});

    				check_outros();
    			}

    			if (/*showAreas*/ ctx[8].whatToMaintain) {
    				if (if_block9) {
    					if_block9.p(ctx, dirty);

    					if (dirty[0] & /*showAreas*/ 256) {
    						transition_in(if_block9, 1);
    					}
    				} else {
    					if_block9 = create_if_block_2$1(ctx);
    					if_block9.c();
    					transition_in(if_block9, 1);
    					if_block9.m(t26.parentNode, t26);
    				}
    			} else if (if_block9) {
    				group_outros();

    				transition_out(if_block9, 1, 1, () => {
    					if_block9 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*categories, makeAssigVariable, showAreas, deleteAssignment, courseSettings*/ 17826068) {
    				each_value = /*categories*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			transition_in(if_block6);
    			transition_in(if_block7);
    			transition_in(if_block8);
    			transition_in(if_block9);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			transition_out(if_block6);
    			transition_out(if_block7);
    			transition_out(if_block8);
    			transition_out(if_block9);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div0);
    			/*div0_binding*/ ctx[30](null);
    			if (detaching) detach_dev(t12);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div1);
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t18);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t19);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t20);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(t21);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach_dev(t22);
    			if (if_block6) if_block6.d(detaching);
    			if (detaching) detach_dev(t23);
    			if (if_block7) if_block7.d(detaching);
    			if (detaching) detach_dev(t24);
    			if (if_block8) if_block8.d(detaching);
    			if (detaching) detach_dev(t25);
    			if (if_block9) if_block9.d(detaching);
    			if (detaching) detach_dev(t26);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t28);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function copy(ob) {
    	return Object.assign({}, ob);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Editor', slots, []);
    	let { course } = $$props;
    	let { isPlayground = false } = $$props;
    	const dispatch = createEventDispatcher();

    	let courseSettings = {
    		equalWeighting: {},
    		termEnabled: {},
    		allCategoriesWeightedSame: false
    	};

    	let key;
    	key = 'courseSettings' + course.details[0].task.courseName;

    	chrome.storage.local.get(key, result => {
    		if (result[key] != undefined) {
    			$$invalidate(2, courseSettings = result[key]);
    			console.log(courseSettings);
    		}
    	});

    	// Returns default grade without changes
    	function getCurrentGrade() {
    		let text = "";

    		for (let term of course.details) {
    			if (term.task.progressScore != undefined) {
    				text = term.task.progressScore + " (" + term.task.progressPercent + "%)";
    			}
    		}

    		return text;
    	}

    	// Reformat course object to list of categories 
    	let newGrade = 100;

    	let categories = [];

    	for (let term of course.details) {
    		for (let category of term.categories) {
    			// If category is already in the array, it was already created from a previous term
    			// In this case, add following assignments to the existing Category object
    			let currentCategory = new Category(category.weight, category.name);

    			let existance = currentCategory.alreadyExists(categories);

    			if (existance.true) {
    				currentCategory = categories[existance.in];
    			}

    			// Add assignments to category
    			for (let assignment of category.assignments) {
    				currentCategory.addAssignment(new Assignment(parseFloat(assignment.scorePoints) * assignment.multiplier, assignment.totalPoints * assignment.multiplier, assignment.assignmentName, (assignment.scorePoints * assignment.multiplier / (assignment.totalPoints * assignment.multiplier) * 100).toFixed(2), assignment.termID));
    			}

    			if (!existance.true) categories.push(currentCategory);
    		}
    	}

    	// console.log(categories)
    	if (categories.length == 1) {
    		categories[0].initialWeight = 100;
    		categories[0].weight = 100;
    		categories = categories;
    		console.log(categories);
    	}

    	// Generate list of grading periods
    	let terms = {};

    	let tids = [];

    	for (let term of course.terms) {
    		let newTerm = new Term(term.termID, term.termName, term.termSeq, term.startDate, term.endDate);
    		terms[term.termID] = newTerm;
    		courseSettings.termEnabled[term.termID] = newTerm.inRange();
    		tids.push(term.termID);
    	}

    	if (course.terms.length == 4) {
    		// console.log(courseSettings.termEnabled[tids[0]])
    		if (courseSettings.termEnabled[tids[1]]) {
    			courseSettings.termEnabled[tids[0]] = true;
    		}

    		if (courseSettings.termEnabled[tids[3]]) {
    			courseSettings.termEnabled[tids[2]] = true;
    		}

    		courseSettings = courseSettings;
    	}

    	// Normalize weights
    	function normalizeWeights() {
    		let weightSum = 0;

    		for (let cat of categories) {
    			weightSum += cat.initialWeight;
    		}

    		for (let cat of categories) {
    			cat.weight = cat.initialWeight / weightSum * 100;
    		}
    	}

    	normalizeWeights();

    	// Toggleable areas
    	let showAreas = {
    		newAssig: false,
    		newCategory: false,
    		showGraph: false,
    		equalWeighting: false,
    		gradingPeriods: false,
    		whatToMaintain: false,
    		saveLoad: false
    	};

    	function toggleArea(area) {
    		for (let a of Object.keys(showAreas)) {
    			if (a != area || showAreas[area] == true) $$invalidate(8, showAreas[a] = false, showAreas); else $$invalidate(8, showAreas[area] = true, showAreas);
    		}
    	}

    	function deleteAssignment(cat, assig) {
    		let i = categories.indexOf(cat);
    		let a = categories[i].assignments.indexOf(assig);
    		if (a > -1) categories[i].assignments.splice(a, 1);
    		$$invalidate(4, categories);
    	}

    	// New assignment on submit
    	let newAssig = new Assignment(10, 10, "");

    	function submitAssignment() {
    		for (let cat of categories) {
    			if (cat.name == newAssig["catName"]) {
    				let c = copy(newAssig);
    				let t = new Assignment(c.score, c.outof, c.name);
    				categories[categories.indexOf(cat)].addAssignment(t);
    				$$invalidate(9, newAssig = new Assignment(10, 10, ""));
    				$$invalidate(4, categories);
    				return;
    			}
    		}
    	}

    	// New category on submit
    	let newCategory = new Category(0, "");

    	function submitCategory() {
    		copy(newCategory);
    		let t = new Category(newCategory.weight, newCategory.name);
    		categories.push(t);
    		normalizeWeights();
    		$$invalidate(4, categories);
    	}

    	// Activate sticky grade div when scrolled past
    	let issticky = false;

    	let sticky;

    	document.addEventListener('scroll', () => {
    		try {
    			if (window.pageYOffset > sticky.offsetTop) {
    				$$invalidate(11, issticky = true);
    			} else {
    				$$invalidate(11, issticky = false);
    			}
    		} catch(e) {
    			
    		}
    	});

    	let moreToolsOpen = true;

    	// charts data initialization
    	let gradesOverTime = {
    		labels: ["January", "February", "March", "April", "May", "June", "July"],
    		datasets: [{ values: [10, 12, 3, 9, 8, 15, 9] }]
    	};

    	chrome.storage.local.get(['GRADES'], result => {
    		if (result.GRADES != undefined) {
    			console.log("Grades from storage:");
    			console.log(result.GRADES);
    		}
    	});

    	// Minimum need (doesnt work bruh)
    	let gradeWanted = 90;

    	let minNeedAssig = new Assignment(10, 10, "");

    	function makeAssigVariable(outOf, cat) {
    		$$invalidate(6, minNeedAssig.outof = outOf, minNeedAssig);
    		$$invalidate(6, minNeedAssig["catName"] = cat, minNeedAssig);
    		window.scrollTo({ top: 0, behavior: 'smooth' });
    	}

    	let saveCourseName;

    	function saveCourseAs() {
    		let course = { name: saveCourseName, categories };

    		chrome.storage.local.get(['GRADES'], result => {
    			if (result.GRADES == undefined) {
    				chrome.storage.local.set({ GRADES: { saveCourseName: course } });
    			} else {
    				let courses = result.GRADES;
    				courses[saveCourseName] = course;
    				chrome.storage.local.set({ GRADES: courses });
    			}
    		});

    		dispatch('home');
    	}

    	let loadCourseName;
    	let savedCourses = [];

    	if (isPlayground) {
    		chrome.storage.local.get(['GRADES'], result => {
    			if (result.GRADES != undefined) {
    				$$invalidate(16, savedCourses = result.GRADES);
    			}
    		});
    	}

    	function loadCourse() {
    		let course = savedCourses[loadCourseName];
    		console.log(course.categories);
    		$$invalidate(4, categories = []);

    		for (let i of course.categories) {
    			let cat = new Category(i.weight, i.name);

    			for (let j of i.assignments) {
    				let assig = new Assignment(j.score, j.outof, j.name);
    				cat.addAssignment(assig);
    			}

    			categories.push(cat);
    		}

    		$$invalidate(14, saveCourseName = loadCourseName);
    	}

    	function deleteCourse() {
    		try {
    			delete savedCourses[saveCourseName];
    			chrome.storage.local.set({ GRADES: savedCourses });
    			dispatch('home');
    		} catch(e) {
    			console.log(e);
    		}
    	}

    	const writable_props = ['course', 'isPlayground'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		dispatch('home');
    	};

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			sticky = $$value;
    			$$invalidate(12, sticky);
    		});
    	}

    	const click_handler_1 = () => {
    		toggleArea("newAssig");
    	};

    	const click_handler_2 = () => {
    		toggleArea("newCategory");
    	};

    	const click_handler_3 = () => {
    		toggleArea("saveLoad");
    	};

    	const click_handler_4 = () => {
    		$$invalidate(13, moreToolsOpen = !moreToolsOpen);
    	};

    	const click_handler_5 = () => {
    		toggleArea("equalWeighting");
    	};

    	const click_handler_6 = () => {
    		toggleArea("gradingPeriods");
    	};

    	function input_change_handler(cat) {
    		courseSettings.equalWeighting[cat.name] = this.checked;
    		$$invalidate(2, courseSettings);
    		$$invalidate(4, categories);
    	}

    	function input_change_handler_1() {
    		courseSettings.allCategoriesWeightedSame = this.checked;
    		$$invalidate(2, courseSettings);
    	}

    	function input_change_handler_2(term) {
    		courseSettings.termEnabled[term.toString()] = this.checked;
    		$$invalidate(2, courseSettings);
    		$$invalidate(7, terms);
    	}

    	function input0_input_handler() {
    		newAssig.name = this.value;
    		$$invalidate(9, newAssig);
    		$$invalidate(4, categories);
    	}

    	function select_change_handler() {
    		newAssig["catName"] = select_value(this);
    		$$invalidate(9, newAssig);
    		$$invalidate(4, categories);
    	}

    	function input1_input_handler() {
    		newAssig.score = to_number(this.value);
    		$$invalidate(9, newAssig);
    		$$invalidate(4, categories);
    	}

    	function input2_input_handler() {
    		newAssig.outof = to_number(this.value);
    		$$invalidate(9, newAssig);
    		$$invalidate(4, categories);
    	}

    	function input0_input_handler_1() {
    		newCategory.name = this.value;
    		$$invalidate(10, newCategory);
    	}

    	function input1_input_handler_1() {
    		newCategory.weight = to_number(this.value);
    		$$invalidate(10, newCategory);
    	}

    	function input0_input_handler_2() {
    		saveCourseName = this.value;
    		$$invalidate(14, saveCourseName);
    	}

    	function select_change_handler_1() {
    		loadCourseName = select_value(this);
    		$$invalidate(15, loadCourseName);
    		$$invalidate(16, savedCourses);
    	}

    	function input0_input_handler_3() {
    		gradeWanted = to_number(this.value);
    		$$invalidate(5, gradeWanted);
    	}

    	function select_change_handler_2() {
    		minNeedAssig["catName"] = select_value(this);
    		(((($$invalidate(6, minNeedAssig), $$invalidate(3, newGrade)), $$invalidate(4, categories)), $$invalidate(2, courseSettings)), $$invalidate(5, gradeWanted));
    		$$invalidate(4, categories);
    	}

    	function input1_input_handler_2() {
    		minNeedAssig.outof = to_number(this.value);
    		(((($$invalidate(6, minNeedAssig), $$invalidate(3, newGrade)), $$invalidate(4, categories)), $$invalidate(2, courseSettings)), $$invalidate(5, gradeWanted));
    		$$invalidate(4, categories);
    	}

    	function input0_input_handler_4(each_value, cat_index) {
    		each_value[cat_index].weight = to_number(this.value);
    		$$invalidate(4, categories);
    	}

    	function input0_input_handler_5(each_value_1, assig_index) {
    		each_value_1[assig_index].score = to_number(this.value);
    		$$invalidate(4, categories);
    	}

    	function input1_input_handler_3(each_value_1, assig_index) {
    		each_value_1[assig_index].outof = to_number(this.value);
    		$$invalidate(4, categories);
    	}

    	$$self.$$set = $$props => {
    		if ('course' in $$props) $$invalidate(1, course = $$props.course);
    		if ('isPlayground' in $$props) $$invalidate(0, isPlayground = $$props.isPlayground);
    	};

    	$$self.$capture_state = () => ({
    		course,
    		createEventDispatcher,
    		slide,
    		Category,
    		Assignment,
    		Term,
    		Chart: Base$1,
    		isPlayground,
    		dispatch,
    		courseSettings,
    		key,
    		getCurrentGrade,
    		newGrade,
    		categories,
    		terms,
    		tids,
    		normalizeWeights,
    		showAreas,
    		toggleArea,
    		deleteAssignment,
    		copy,
    		newAssig,
    		submitAssignment,
    		newCategory,
    		submitCategory,
    		issticky,
    		sticky,
    		moreToolsOpen,
    		gradesOverTime,
    		gradeWanted,
    		minNeedAssig,
    		makeAssigVariable,
    		saveCourseName,
    		saveCourseAs,
    		loadCourseName,
    		savedCourses,
    		loadCourse,
    		deleteCourse
    	});

    	$$self.$inject_state = $$props => {
    		if ('course' in $$props) $$invalidate(1, course = $$props.course);
    		if ('isPlayground' in $$props) $$invalidate(0, isPlayground = $$props.isPlayground);
    		if ('courseSettings' in $$props) $$invalidate(2, courseSettings = $$props.courseSettings);
    		if ('key' in $$props) $$invalidate(28, key = $$props.key);
    		if ('newGrade' in $$props) $$invalidate(3, newGrade = $$props.newGrade);
    		if ('categories' in $$props) $$invalidate(4, categories = $$props.categories);
    		if ('terms' in $$props) $$invalidate(7, terms = $$props.terms);
    		if ('tids' in $$props) tids = $$props.tids;
    		if ('showAreas' in $$props) $$invalidate(8, showAreas = $$props.showAreas);
    		if ('newAssig' in $$props) $$invalidate(9, newAssig = $$props.newAssig);
    		if ('newCategory' in $$props) $$invalidate(10, newCategory = $$props.newCategory);
    		if ('issticky' in $$props) $$invalidate(11, issticky = $$props.issticky);
    		if ('sticky' in $$props) $$invalidate(12, sticky = $$props.sticky);
    		if ('moreToolsOpen' in $$props) $$invalidate(13, moreToolsOpen = $$props.moreToolsOpen);
    		if ('gradesOverTime' in $$props) $$invalidate(23, gradesOverTime = $$props.gradesOverTime);
    		if ('gradeWanted' in $$props) $$invalidate(5, gradeWanted = $$props.gradeWanted);
    		if ('minNeedAssig' in $$props) $$invalidate(6, minNeedAssig = $$props.minNeedAssig);
    		if ('saveCourseName' in $$props) $$invalidate(14, saveCourseName = $$props.saveCourseName);
    		if ('loadCourseName' in $$props) $$invalidate(15, loadCourseName = $$props.loadCourseName);
    		if ('savedCourses' in $$props) $$invalidate(16, savedCourses = $$props.savedCourses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*isPlayground, key, courseSettings*/ 268435461) {
    			{
    				if (!isPlayground) chrome.storage.local.set({ [key]: courseSettings });
    			}
    		}

    		if ($$self.$$.dirty[0] & /*categories, courseSettings, newGrade*/ 28) {
    			// On change, update new grade with sum of weighted categories
    			{
    				$$invalidate(3, newGrade = 0);
    				let renormalize = false;
    				let subtractThisWeight = 0;

    				for (let cat of categories) {
    					let wieghtEqually = courseSettings.equalWeighting[cat.name];
    					if (wieghtEqually == null) wieghtEqually = false;
    					let wg = cat.getWeightedGrade(wieghtEqually, courseSettings.termEnabled);

    					if (!isNaN(wg)) {
    						$$invalidate(3, newGrade += wg);
    					} else {
    						renormalize = true;
    						subtractThisWeight += cat.weight;
    					}
    				}

    				// If a whole grade category is null, ignore it and renormalize 
    				if (renormalize) {
    					$$invalidate(3, newGrade /= 1 - subtractThisWeight / 100);
    				}

    				// If all categories are weighted equally, recalculate accordingly
    				if (courseSettings.allCategoriesWeightedSame) {
    					$$invalidate(3, newGrade = 0);
    					let catCount = 0;

    					for (let cat of categories) {
    						let x = cat.calculateGrade(courseSettings.equalWeighting[cat.name], courseSettings.termEnabled).getPercent();

    						if (!isNaN(x)) {
    							$$invalidate(3, newGrade += x);
    							catCount++;
    						}
    					}

    					$$invalidate(3, newGrade /= catCount);
    				}

    				(($$invalidate(3, newGrade), $$invalidate(4, categories)), $$invalidate(2, courseSettings));
    			}
    		}

    		if ($$self.$$.dirty[0] & /*newGrade, categories, minNeedAssig, courseSettings, gradeWanted*/ 124) {
    			{
    				let gradeWoNewcat = copy(newGrade);
    				let categ = categories[0];

    				for (let cat of categories) {
    					if (cat.name == minNeedAssig["catName"]) {
    						gradeWoNewcat -= cat.getWeightedGrade(courseSettings.equalWeighting[cat.name], courseSettings.termEnabled);
    						categ = cat;
    					}
    				}

    				let neededCatGrade = gradeWanted - gradeWoNewcat;

    				// console.log("you need a " + neededCatGrade + " in " + categ.name + " to get a " + gradeWanted + " overall")
    				/*
        currScore + newScore 
        ____________________ = neededCatGrade
        currOutof + newOutof

        newScore = (neededCatGrade)(currOutof + newOutof) - currScore
    */
    				try {
    					let categGrade = categ.calculateGrade();
    					let newScore = neededCatGrade * (categGrade.outof + minNeedAssig.outof) - categGrade.score;
    					$$invalidate(6, minNeedAssig.score = newScore, minNeedAssig);
    				} catch(e) {
    					console.log(e);
    				}
    			}
    		}
    	};

    	return [
    		isPlayground,
    		course,
    		courseSettings,
    		newGrade,
    		categories,
    		gradeWanted,
    		minNeedAssig,
    		terms,
    		showAreas,
    		newAssig,
    		newCategory,
    		issticky,
    		sticky,
    		moreToolsOpen,
    		saveCourseName,
    		loadCourseName,
    		savedCourses,
    		dispatch,
    		getCurrentGrade,
    		toggleArea,
    		deleteAssignment,
    		submitAssignment,
    		submitCategory,
    		gradesOverTime,
    		makeAssigVariable,
    		saveCourseAs,
    		loadCourse,
    		deleteCourse,
    		key,
    		click_handler,
    		div0_binding,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		input_change_handler,
    		input_change_handler_1,
    		input_change_handler_2,
    		input0_input_handler,
    		select_change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		input0_input_handler_2,
    		select_change_handler_1,
    		input0_input_handler_3,
    		select_change_handler_2,
    		input1_input_handler_2,
    		input0_input_handler_4,
    		input0_input_handler_5,
    		input1_input_handler_3
    	];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { course: 1, isPlayground: 0 }, null, [-1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*course*/ ctx[1] === undefined && !('course' in props)) {
    			console_1$1.warn("<Editor> was created without expected prop 'course'");
    		}
    	}

    	get course() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set course(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isPlayground() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isPlayground(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let NullCourse = {
        "terms": [
            {
                "termID": 706,
                "termName": "Q1",
                "termScheduleID": 256,
                "termScheduleName": "Quarters",
                "termSeq": 1,
                "isPrimary": true,
                "startDate": "2022-08-17",
                "endDate": "2022-10-14"
            },
            {
                "termID": 707,
                "termName": "Q2",
                "termScheduleID": 256,
                "termScheduleName": "Quarters",
                "termSeq": 2,
                "isPrimary": true,
                "startDate": "2022-10-17",
                "endDate": "2022-12-22"
            },
            {
                "termID": 708,
                "termName": "Q3",
                "termScheduleID": 256,
                "termScheduleName": "Quarters",
                "termSeq": 3,
                "isPrimary": true,
                "startDate": "2023-01-09",
                "endDate": "2023-03-16"
            },
            {
                "termID": 709,
                "termName": "Q4",
                "termScheduleID": 256,
                "termScheduleName": "Quarters",
                "termSeq": 4,
                "isPrimary": true,
                "startDate": "2023-03-20",
                "endDate": "2023-06-02"
            }
        ],
        "details": [
            {
                "task": {
                    "_id": "12157",
                    "personID": 12157,
                    "trialID": 1295,
                    "calendarID": 725,
                    "structureID": 721,
                    "courseID": 29623,
                    "courseName": "Playground",
                    "sectionID": 379630,
                    "taskID": 2,
                    "termID": 706,
                    "hasAssignments": false,
                    "hasCompositeTasks": false,
                    "taskName": "Quarter Grade",
                    "gradedOnce": false,
                    "treeTraversalSeq": 2,
                    "hasDetail": false,
                    "_model": "PortalGradingTaskModel",
                    "_hashCode": "410452639",
                    "termName": "Q1",
                    "termSeq": 1
                },
                "categories": [],
                "children": null
            },
            {
                "task": {
                    "_id": "12157",
                    "personID": 12157,
                    "trialID": 1295,
                    "calendarID": 725,
                    "structureID": 721,
                    "courseID": 29623,
                    "courseName": "Playground",
                    "sectionID": 379630,
                    "taskID": 3,
                    "termID": 706,
                    "hasAssignments": false,
                    "hasCompositeTasks": false,
                    "taskName": "Mid-Term Grade",
                    "gradedOnce": false,
                    "treeTraversalSeq": 3,
                    "hasDetail": false,
                    "_model": "PortalGradingTaskModel",
                    "_hashCode": "1956266458",
                    "termName": "Q1",
                    "termSeq": 1
                },
                "categories": [],
                "children": null
            },
            {
                "task": {
                    "_id": "12157",
                    "personID": 12157,
                    "trialID": 1295,
                    "calendarID": 725,
                    "structureID": 721,
                    "courseID": 29623,
                    "courseName": "Playground",
                    "sectionID": 379630,
                    "taskID": 1,
                    "termID": 707,
                    "hasAssignments": false,
                    "hasCompositeTasks": true,
                    "taskName": "Semester Final",
                    "gradedOnce": false,
                    "treeTraversalSeq": 1,
                    "hasDetail": true,
                    "_model": "PortalGradingTaskModel",
                    "_hashCode": "1765994671",
                    "termName": "Q2",
                    "termSeq": 2
                },
                "categories": [],
                "children": [
                    {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1295,
                        "calendarID": 725,
                        "structureID": 721,
                        "courseID": 29623,
                        "courseName": "Playground",
                        "sectionID": 379630,
                        "taskID": 2,
                        "termID": 707,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "calculationWeight": 100,
                        "calculationPercent": 1,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1666756704",
                        "termName": "Q2",
                        "termSeq": 2
                    }
                ]
            },
            {
                "task": {
                    "_id": "12157",
                    "personID": 12157,
                    "trialID": 1295,
                    "calendarID": 725,
                    "structureID": 721,
                    "courseID": 29623,
                    "courseName": "Playground",
                    "sectionID": 379630,
                    "taskID": 2,
                    "termID": 707,
                    "hasAssignments": false,
                    "hasCompositeTasks": false,
                    "taskName": "Quarter Grade",
                    "gradedOnce": false,
                    "treeTraversalSeq": 2,
                    "calculationWeight": 100,
                    "calculationPercent": 1,
                    "hasDetail": false,
                    "_model": "PortalGradingTaskModel",
                    "_hashCode": "-1666756704",
                    "termName": "Q2",
                    "termSeq": 2
                },
                "categories": [],
                "children": null
            },
            {
                "task": {
                    "_id": "12157",
                    "personID": 12157,
                    "trialID": 1295,
                    "calendarID": 725,
                    "structureID": 721,
                    "courseID": 29623,
                    "courseName": "Playground",
                    "sectionID": 379630,
                    "taskID": 3,
                    "termID": 707,
                    "hasAssignments": false,
                    "hasCompositeTasks": false,
                    "taskName": "Mid-Term Grade",
                    "gradedOnce": false,
                    "treeTraversalSeq": 3,
                    "hasDetail": false,
                    "_model": "PortalGradingTaskModel",
                    "_hashCode": "-120942885",
                    "termName": "Q2",
                    "termSeq": 2
                },
                "categories": [],
                "children": null
            },
            {
                "task": {
                    "_id": "12157",
                    "personID": 12157,
                    "trialID": 1295,
                    "calendarID": 725,
                    "structureID": 721,
                    "courseID": 29623,
                    "courseName": "Playground",
                    "sectionID": 379630,
                    "taskID": 2,
                    "termID": 708,
                    "hasAssignments": false,
                    "hasCompositeTasks": false,
                    "taskName": "Quarter Grade",
                    "gradedOnce": false,
                    "treeTraversalSeq": 2,
                    "hasDetail": false,
                    "_model": "PortalGradingTaskModel",
                    "_hashCode": "551001249",
                    "termName": "Q3",
                    "termSeq": 3
                },
                "categories": [],
                "children": null
            },
            {
                "task": {
                    "_id": "12157",
                    "personID": 12157,
                    "trialID": 1295,
                    "calendarID": 725,
                    "structureID": 721,
                    "courseID": 29623,
                    "courseName": "Playground",
                    "sectionID": 379630,
                    "taskID": 3,
                    "termID": 708,
                    "hasAssignments": false,
                    "hasCompositeTasks": false,
                    "taskName": "Mid-Term Grade",
                    "gradedOnce": false,
                    "treeTraversalSeq": 3,
                    "hasDetail": false,
                    "_model": "PortalGradingTaskModel",
                    "_hashCode": "2096815068",
                    "termName": "Q3",
                    "termSeq": 3
                },
                "categories": [],
                "children": null
            },
            {
                "task": {
                    "_id": "12157",
                    "personID": 12157,
                    "trialID": 1295,
                    "calendarID": 725,
                    "structureID": 721,
                    "courseID": 29623,
                    "courseName": "Playground",
                    "sectionID": 379630,
                    "taskID": 1,
                    "termID": 709,
                    "hasAssignments": false,
                    "hasCompositeTasks": true,
                    "taskName": "Semester Final",
                    "gradedOnce": false,
                    "treeTraversalSeq": 1,
                    "hasDetail": true,
                    "_model": "PortalGradingTaskModel",
                    "_hashCode": "1906543281",
                    "termName": "Q4",
                    "termSeq": 4
                },
                "categories": [],
                "children": [
                    {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1295,
                        "calendarID": 725,
                        "structureID": 721,
                        "courseID": 29623,
                        "courseName": "Playground",
                        "sectionID": 379630,
                        "taskID": 2,
                        "termID": 709,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "calculationWeight": 100,
                        "calculationPercent": 1,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1526208094",
                        "termName": "Q4",
                        "termSeq": 4
                    }
                ]
            },
            {
                "task": {
                    "_id": "12157",
                    "personID": 12157,
                    "trialID": 1295,
                    "calendarID": 725,
                    "structureID": 721,
                    "courseID": 29623,
                    "courseName": "Playground",
                    "sectionID": 379630,
                    "taskID": 2,
                    "termID": 709,
                    "hasAssignments": false,
                    "hasCompositeTasks": false,
                    "taskName": "Quarter Grade",
                    "gradedOnce": false,
                    "treeTraversalSeq": 2,
                    "calculationWeight": 100,
                    "calculationPercent": 1,
                    "hasDetail": false,
                    "_model": "PortalGradingTaskModel",
                    "_hashCode": "-1526208094",
                    "termName": "Q4",
                    "termSeq": 4
                },
                "categories": [],
                "children": null
            },
            {
                "task": {
                    "_id": "12157",
                    "personID": 12157,
                    "trialID": 1295,
                    "calendarID": 725,
                    "structureID": 721,
                    "courseID": 29623,
                    "courseName": "Playground",
                    "sectionID": 379630,
                    "taskID": 3,
                    "termID": 709,
                    "hasAssignments": false,
                    "hasCompositeTasks": false,
                    "taskName": "Mid-Term Grade",
                    "gradedOnce": false,
                    "treeTraversalSeq": 3,
                    "hasDetail": false,
                    "_model": "PortalGradingTaskModel",
                    "_hashCode": "19605725",
                    "termName": "Q4",
                    "termSeq": 4
                },
                "categories": [],
                "children": null
            }
        ]
    };

    /* src\App.svelte generated by Svelte v3.44.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (64:36) 
    function create_if_block_3(ctx) {
    	let p0;
    	let strong;
    	let t1;
    	let p1;
    	let t2;
    	let a;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			strong = element("strong");
    			strong.textContent = "Something went wrong.";
    			t1 = space();
    			p1 = element("p");
    			t2 = text("Did you ");
    			a = element("a");
    			t3 = text("log in");
    			t4 = text(" to Infinite Campus?");
    			add_location(strong, file, 64, 6, 1628);
    			add_location(p0, file, 64, 3, 1625);
    			attr_dev(a, "href", /*icURL*/ ctx[1]);
    			add_location(a, file, 65, 14, 1686);
    			add_location(p1, file, 65, 3, 1675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, strong);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t2);
    			append_dev(p1, a);
    			append_dev(a, t3);
    			append_dev(p1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*icURL*/ 2) {
    				attr_dev(a, "href", /*icURL*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(64:36) ",
    		ctx
    	});

    	return block;
    }

    // (62:2) {#if loadingState == "loading"}
    function create_if_block_2(ctx) {
    	let a;
    	let t1;
    	let br;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Loading, please wait...";
    			t1 = space();
    			br = element("br");
    			attr_dev(a, "href", "/#");
    			attr_dev(a, "aria-busy", "true");
    			add_location(a, file, 62, 3, 1520);
    			add_location(br, file, 62, 61, 1578);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(62:2) {#if loadingState == \\\"loading\\\"}",
    		ctx
    	});

    	return block;
    }

    // (73:2) {:else}
    function create_else_block(ctx) {
    	let div;
    	let editor;
    	let div_transition;
    	let current;

    	editor = new Editor({
    			props: { course: /*currentCourse*/ ctx[4] },
    			$$inline: true
    		});

    	editor.$on("home", /*home_handler_1*/ ctx[8]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(editor.$$.fragment);
    			add_location(div, file, 73, 3, 2081);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(editor, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const editor_changes = {};
    			if (dirty & /*currentCourse*/ 16) editor_changes.course = /*currentCourse*/ ctx[4];
    			editor.$set(editor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editor.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editor.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(editor);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(73:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (71:40) 
    function create_if_block_1(ctx) {
    	let div;
    	let editor;
    	let div_transition;
    	let current;

    	editor = new Editor({
    			props: { isPlayground: true, course: NullCourse },
    			$$inline: true
    		});

    	editor.$on("home", /*home_handler*/ ctx[7]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(editor.$$.fragment);
    			add_location(div, file, 71, 3, 1943);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(editor, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editor.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editor.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(editor);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(71:40) ",
    		ctx
    	});

    	return block;
    }

    // (69:2) {#if currentPage == "Home"}
    function create_if_block(ctx) {
    	let div;
    	let home;
    	let div_transition;
    	let current;

    	home = new Home({
    			props: { classes: /*classes*/ ctx[2] },
    			$$inline: true
    		});

    	home.$on("editor", /*openEditor*/ ctx[5]);
    	home.$on("playground", /*openPlayground*/ ctx[6]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(home.$$.fragment);
    			add_location(div, file, 69, 3, 1783);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(home, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const home_changes = {};
    			if (dirty & /*classes*/ 4) home_changes.classes = /*classes*/ ctx[2];
    			home.$set(home_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(home);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(69:2) {#if currentPage == \\\"Home\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let br;
    	let t0;
    	let div0;
    	let t1;
    	let current_block_type_index;
    	let if_block1;
    	let t2;
    	let nav;
    	let ul0;
    	let li0;
    	let small0;
    	let t4;
    	let ul1;
    	let li1;
    	let a0;
    	let small1;
    	let t6;
    	let li2;
    	let a1;
    	let small2;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*loadingState*/ ctx[0] == "loading") return create_if_block_2;
    		if (/*loadingState*/ ctx[0] == "error") return create_if_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	const if_block_creators = [create_if_block, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*currentPage*/ ctx[3] == "Home") return 0;
    		if (/*currentPage*/ ctx[3] == "Playground") return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			br = element("br");
    			t0 = space();
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if_block1.c();
    			t2 = space();
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			small0 = element("small");
    			small0.textContent = "Infinite Campus Grade Predictor";
    			t4 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			a0 = element("a");
    			small1 = element("small");
    			small1.textContent = "About";
    			t6 = space();
    			li2 = element("li");
    			a1 = element("a");
    			small2 = element("small");
    			small2.textContent = "Github";
    			add_location(br, file, 57, 1, 1427);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file, 60, 1, 1457);
    			add_location(small0, file, 80, 7, 2253);
    			add_location(li0, file, 80, 3, 2249);
    			add_location(ul0, file, 79, 2, 2240);
    			add_location(small1, file, 83, 78, 2401);
    			attr_dev(a0, "href", "https://benman604.github.io/Infinite-Campus-Grade-Predictor/");
    			add_location(a0, file, 83, 7, 2330);
    			add_location(li1, file, 83, 3, 2326);
    			add_location(small2, file, 84, 76, 2508);
    			attr_dev(a1, "href", "https://github.com/bm-tech/Infinite-Campus-Grade-Predictor");
    			add_location(a1, file, 84, 7, 2439);
    			add_location(li2, file, 84, 3, 2435);
    			add_location(ul1, file, 82, 2, 2317);
    			add_location(nav, file, 78, 1, 2231);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file, 56, 0, 1401);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, br);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t1);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div1, t2);
    			append_dev(div1, nav);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, small0);
    			append_dev(nav, t4);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, a0);
    			append_dev(a0, small1);
    			append_dev(ul1, t6);
    			append_dev(ul1, li2);
    			append_dev(li2, a1);
    			append_dev(a1, small2);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, t1);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div0, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let loadingState = "loading";
    	let icURL;

    	chrome.storage.local.get(['IC_subdomain'], x => {
    		$$invalidate(1, icURL = `https://${x.IC_subdomain}.infinitecampus.org`);
    	});

    	chrome.runtime.sendMessage({ m: "getGrades" });
    	let classes = [];

    	chrome.runtime.onMessage.addListener((req, who, res) => {
    		if (req.m == "recieveGrades") {
    			if (req.data.fetchError != undefined || req.data.errors != undefined) {
    				console.log(req.data);
    				$$invalidate(0, loadingState = "error");
    				return;
    			}

    			classes.push(req.data);
    			$$invalidate(2, classes);
    			$$invalidate(0, loadingState = "done");
    		}
    	});

    	// Debugging 
    	// import {x} from './testing'
    	// classes = x
    	window["debugger"] = {
    		getCurrentClass: () => {
    			return currentCourse;
    		},
    		getAllClasses: () => {
    			return classes;
    		},
    		setClasses: cl => {
    			$$invalidate(2, classes = cl);
    		}
    	};

    	let currentPage = "Home";
    	let currentCourse;

    	function openEditor(event) {
    		$$invalidate(4, currentCourse = event.detail.data);
    		$$invalidate(3, currentPage = "Editor");
    	}

    	function openPlayground() {
    		$$invalidate(3, currentPage = "Playground");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const home_handler = () => {
    		$$invalidate(3, currentPage = "Home");
    	};

    	const home_handler_1 = () => {
    		$$invalidate(3, currentPage = "Home");
    	};

    	$$self.$capture_state = () => ({
    		Home,
    		Editor,
    		NullCourse,
    		slide,
    		loadingState,
    		icURL,
    		classes,
    		currentPage,
    		currentCourse,
    		openEditor,
    		openPlayground
    	});

    	$$self.$inject_state = $$props => {
    		if ('loadingState' in $$props) $$invalidate(0, loadingState = $$props.loadingState);
    		if ('icURL' in $$props) $$invalidate(1, icURL = $$props.icURL);
    		if ('classes' in $$props) $$invalidate(2, classes = $$props.classes);
    		if ('currentPage' in $$props) $$invalidate(3, currentPage = $$props.currentPage);
    		if ('currentCourse' in $$props) $$invalidate(4, currentCourse = $$props.currentCourse);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		loadingState,
    		icURL,
    		classes,
    		currentPage,
    		currentCourse,
    		openEditor,
    		openPlayground,
    		home_handler,
    		home_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
