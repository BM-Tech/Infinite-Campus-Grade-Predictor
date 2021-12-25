
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
    const file$2 = "src\\Home.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (21:0) {#each classes as cl, i}
    function create_each_block$1(ctx) {
    	let button;
    	let strong;
    	let t0_value = /*cl*/ ctx[4].details[0].task.courseName + "";
    	let t0;
    	let t1;
    	let t2_value = getGradeFromClass(/*cl*/ ctx[4].details) + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*i*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			strong = element("strong");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			add_location(strong, file$2, 32, 8, 910);
    			set_style(button, "padding", "5", 1);
    			add_location(button, file$2, 31, 4, 831);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, strong);
    			append_dev(strong, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);
    			append_dev(button, t3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*classes*/ 1 && t0_value !== (t0_value = /*cl*/ ctx[4].details[0].task.courseName + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*classes*/ 1 && t2_value !== (t2_value = getGradeFromClass(/*cl*/ ctx[4].details) + "")) set_data_dev(t2, t2_value);
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
    		source: "(21:0) {#each classes as cl, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let each_1_anchor;
    	let each_value = /*classes*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*openEditor, getGradeFromClass, classes*/ 3) {
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
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
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

    function getGradeFromClass(details) {
    	let text = "";

    	for (let term of details) {
    		if (term.task.progressScore != undefined) {
    			text = term.task.progressScore + " (" + term.task.progressPercent + "%)";
    		}
    	}

    	return text;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	let { classes } = $$props;
    	const dispatch = createEventDispatcher();

    	function openEditor(index) {
    		dispatch('message', { m: "openEditor", data: classes[index] });
    	}

    	const writable_props = ['classes'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => openEditor(i);

    	$$self.$$set = $$props => {
    		if ('classes' in $$props) $$invalidate(0, classes = $$props.classes);
    	};

    	$$self.$capture_state = () => ({
    		classes,
    		createEventDispatcher,
    		dispatch,
    		getGradeFromClass,
    		openEditor
    	});

    	$$self.$inject_state = $$props => {
    		if ('classes' in $$props) $$invalidate(0, classes = $$props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [classes, openEditor, click_handler];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { classes: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*classes*/ ctx[0] === undefined && !('classes' in props)) {
    			console.warn("<Home> was created without expected prop 'classes'");
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
            this.name = name;
            this.assignments = [];
        }

        addAssignment(assignment){
            this.assignments.push(assignment);
        }

        calculateGrade(){
            let total = new Grade(0, 0);
            for(let a of this.assignments){
                if(!isNaN(a.score) && !isNaN(a.outof)){
                    total.score += a.score;
                    total.outof += a.outof;
                }
            }
            return total
        }

        getWeightedGrade(){
            let total = this.calculateGrade();
            return total.getPercent() * this.weight / 100
        }

        alreadyExists(arr){
            for(let cat of arr){
                if(cat.name == this.name)
                    return {true: true, in: arr.indexOf(cat)}
            }
            return {true: false, in: -1}
        }

        toString(){
            let pct = this.calculateGrade().toString();
            return this.name + " (Grade: " + pct + "%) (Weight: " + (this.weight).toFixed(2) + "%)"
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
            this.getPercent();
            return (this.percent * 100).toFixed(2)
    	}
    }

    class Assignment extends Grade{
        constructor(score, outof, name){
            super(score, outof);
            this.name = name;
        }
    }

    /* src\Editor.svelte generated by Svelte v3.44.2 */

    const { Object: Object_1, console: console_1$1 } = globals;
    const file$1 = "src\\Editor.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[28] = list;
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    // (152:0) {#if issticky}
    function create_if_block_3(ctx) {
    	let div;
    	let p;
    	let strong0;
    	let t1;
    	let t2_value = /*getCurrentGrade*/ ctx[8]() + "";
    	let t2;
    	let t3;
    	let strong1;
    	let t5;
    	let t6_value = (/*newGrade*/ ctx[1] * 100).toFixed(2) + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "Origional:";
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = text(" | ");
    			strong1 = element("strong");
    			strong1.textContent = "New:";
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = text("%");
    			add_location(strong0, file$1, 153, 11, 4657);
    			add_location(strong1, file$1, 153, 62, 4708);
    			add_location(p, file$1, 153, 8, 4654);
    			attr_dev(div, "class", "sticky");
    			add_location(div, file$1, 152, 4, 4624);
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
    			if (dirty[0] & /*newGrade*/ 2 && t6_value !== (t6_value = (/*newGrade*/ ctx[1] * 100).toFixed(2) + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(152:0) {#if issticky}",
    		ctx
    	});

    	return block;
    }

    // (168:4) {#if showAreas.newAssig}
    function create_if_block_2(ctx) {
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
    	let each_value_2 = /*categories*/ ctx[2];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			article = element("article");
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			t0 = text("Assignment name\r\n                        ");
    			input0 = element("input");
    			t1 = space();
    			label1 = element("label");
    			t2 = text("Category\r\n                        ");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div1 = element("div");
    			label2 = element("label");
    			t4 = text("Score\r\n                        ");
    			input1 = element("input");
    			t5 = space();
    			label3 = element("label");
    			t6 = text("Out of\r\n                        ");
    			input2 = element("input");
    			t7 = space();
    			input3 = element("input");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "aName");
    			add_location(input0, file$1, 172, 24, 5416);
    			attr_dev(label0, "for", "aName");
    			add_location(label0, file$1, 171, 20, 5356);
    			attr_dev(select, "name", "aCat");
    			select.required = true;
    			if (/*newAssig*/ ctx[4]["catName"] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[18].call(select));
    			add_location(select, file$1, 176, 24, 5581);
    			attr_dev(label1, "for", "aCat");
    			add_location(label1, file$1, 175, 20, 5529);
    			attr_dev(div0, "class", "grid");
    			add_location(div0, file$1, 170, 16, 5316);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "name", "aScore");
    			input1.required = true;
    			add_location(input1, file$1, 186, 24, 6013);
    			attr_dev(label2, "for", "aScore");
    			add_location(label2, file$1, 185, 20, 5962);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "name", "aOutOf");
    			input2.required = true;
    			add_location(input2, file$1, 189, 24, 6189);
    			attr_dev(label3, "for", "aOutOf");
    			add_location(label3, file$1, 188, 20, 6137);
    			attr_dev(div1, "class", "grid");
    			add_location(div1, file$1, 184, 16, 5922);
    			attr_dev(input3, "type", "submit");
    			input3.value = "Add";
    			add_location(input3, file$1, 193, 16, 6335);
    			attr_dev(form, "action", "#");
    			add_location(form, file$1, 169, 12, 5237);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 168, 8, 5181);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, form);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(label0, t0);
    			append_dev(label0, input0);
    			set_input_value(input0, /*newAssig*/ ctx[4].name);
    			append_dev(div0, t1);
    			append_dev(div0, label1);
    			append_dev(label1, t2);
    			append_dev(label1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*newAssig*/ ctx[4]["catName"]);
    			append_dev(form, t3);
    			append_dev(form, div1);
    			append_dev(div1, label2);
    			append_dev(label2, t4);
    			append_dev(label2, input1);
    			set_input_value(input1, /*newAssig*/ ctx[4].score);
    			append_dev(div1, t5);
    			append_dev(div1, label3);
    			append_dev(label3, t6);
    			append_dev(label3, input2);
    			set_input_value(input2, /*newAssig*/ ctx[4].outof);
    			append_dev(form, t7);
    			append_dev(form, input3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[17]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[18]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[19]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[20]),
    					listen_dev(form, "submit", prevent_default(/*submitAssignment*/ ctx[11]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newAssig, categories*/ 20 && input0.value !== /*newAssig*/ ctx[4].name) {
    				set_input_value(input0, /*newAssig*/ ctx[4].name);
    			}

    			if (dirty[0] & /*categories*/ 4) {
    				each_value_2 = /*categories*/ ctx[2];
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

    			if (dirty[0] & /*newAssig, categories*/ 20) {
    				select_option(select, /*newAssig*/ ctx[4]["catName"]);
    			}

    			if (dirty[0] & /*newAssig, categories*/ 20 && to_number(input1.value) !== /*newAssig*/ ctx[4].score) {
    				set_input_value(input1, /*newAssig*/ ctx[4].score);
    			}

    			if (dirty[0] & /*newAssig, categories*/ 20 && to_number(input2.value) !== /*newAssig*/ ctx[4].outof) {
    				set_input_value(input2, /*newAssig*/ ctx[4].outof);
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(168:4) {#if showAreas.newAssig}",
    		ctx
    	});

    	return block;
    }

    // (178:28) {#each categories as cat}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*cat*/ ctx[24].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*cat*/ ctx[24].name;
    			option.value = option.__value;
    			add_location(option, file$1, 178, 32, 5732);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*categories*/ 4 && t_value !== (t_value = /*cat*/ ctx[24].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*categories*/ 4 && option_value_value !== (option_value_value = /*cat*/ ctx[24].name)) {
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
    		source: "(178:28) {#each categories as cat}",
    		ctx
    	});

    	return block;
    }

    // (200:4) {#if showAreas.addFinal}
    function create_if_block_1(ctx) {
    	let article;
    	let p;
    	let article_transition;
    	let current;

    	const block = {
    		c: function create() {
    			article = element("article");
    			p = element("p");
    			p.textContent = "Add Final";
    			add_location(p, file$1, 201, 12, 6554);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 200, 8, 6498);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, p);
    			current = true;
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
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(200:4) {#if showAreas.addFinal}",
    		ctx
    	});

    	return block;
    }

    // (207:4) {#if showAreas.showGraph}
    function create_if_block$1(ctx) {
    	let article;
    	let p;
    	let article_transition;
    	let current;

    	const block = {
    		c: function create() {
    			article = element("article");
    			p = element("p");
    			p.textContent = "Show Graph";
    			add_location(p, file$1, 208, 12, 6720);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 207, 8, 6664);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, p);
    			current = true;
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
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(207:4) {#if showAreas.showGraph}",
    		ctx
    	});

    	return block;
    }

    // (220:12) {#each cat.assignments as assig}
    function create_each_block_1(ctx) {
    	let li2;
    	let nav;
    	let ul0;
    	let li0;
    	let t0_value = /*assig*/ ctx[27].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*assig*/ ctx[27].toString() + "";
    	let t2;
    	let t3;
    	let a;
    	let t5;
    	let ul1;
    	let li1;
    	let div;
    	let input0;
    	let t6;
    	let input1;
    	let t7;
    	let mounted;
    	let dispose;

    	function input0_input_handler_1() {
    		/*input0_input_handler_1*/ ctx[21].call(input0, /*each_value_1*/ ctx[28], /*assig_index*/ ctx[29]);
    	}

    	function input1_input_handler_1() {
    		/*input1_input_handler_1*/ ctx[22].call(input1, /*each_value_1*/ ctx[28], /*assig_index*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			li2 = element("li");
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			t0 = text(t0_value);
    			t1 = text("\r\n                        (");
    			t2 = text(t2_value);
    			t3 = text("%) \r\n                        ");
    			a = element("a");
    			a.textContent = "delete";
    			t5 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			div = element("div");
    			input0 = element("input");
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$1, 225, 24, 7210);
    			add_location(li0, file$1, 222, 24, 7094);
    			add_location(ul0, file$1, 222, 20, 7090);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "placeholder", "Score");
    			add_location(input0, file$1, 229, 28, 7425);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "placeholder", "Out Of");
    			add_location(input1, file$1, 230, 28, 7521);
    			attr_dev(div, "class", "grid");
    			add_location(div, file$1, 228, 24, 7377);
    			add_location(li1, file$1, 227, 24, 7347);
    			add_location(ul1, file$1, 227, 20, 7343);
    			add_location(nav, file$1, 221, 20, 7063);
    			add_location(li2, file$1, 221, 16, 7059);
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
    			append_dev(li0, a);
    			append_dev(nav, t5);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, div);
    			append_dev(div, input0);
    			set_input_value(input0, /*assig*/ ctx[27].score);
    			append_dev(div, t6);
    			append_dev(div, input1);
    			set_input_value(input1, /*assig*/ ctx[27].outof);
    			append_dev(nav, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						a,
    						"click",
    						function () {
    							if (is_function(/*deleteAssignment*/ ctx[10](/*cat*/ ctx[24], /*assig*/ ctx[27]))) /*deleteAssignment*/ ctx[10](/*cat*/ ctx[24], /*assig*/ ctx[27]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(input0, "input", input0_input_handler_1),
    					listen_dev(input1, "input", input1_input_handler_1)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*categories*/ 4 && t0_value !== (t0_value = /*assig*/ ctx[27].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*categories*/ 4 && t2_value !== (t2_value = /*assig*/ ctx[27].toString() + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*categories*/ 4 && to_number(input0.value) !== /*assig*/ ctx[27].score) {
    				set_input_value(input0, /*assig*/ ctx[27].score);
    			}

    			if (dirty[0] & /*categories*/ 4 && to_number(input1.value) !== /*assig*/ ctx[27].outof) {
    				set_input_value(input1, /*assig*/ ctx[27].outof);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(220:12) {#each cat.assignments as assig}",
    		ctx
    	});

    	return block;
    }

    // (216:0) {#each categories as cat}
    function create_each_block(ctx) {
    	let details;
    	let summary;
    	let t0_value = /*cat*/ ctx[24].toString() + "";
    	let t0;
    	let t1;
    	let ul;
    	let t2;
    	let each_value_1 = /*cat*/ ctx[24].assignments;
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
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			add_location(summary, file$1, 217, 8, 6876);
    			attr_dev(ul, "class", "longlist");
    			add_location(ul, file$1, 218, 8, 6921);
    			add_location(details, file$1, 216, 4, 6857);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			append_dev(summary, t0);
    			append_dev(details, t1);
    			append_dev(details, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(details, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*categories*/ 4 && t0_value !== (t0_value = /*cat*/ ctx[24].toString() + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*categories, deleteAssignment*/ 1028) {
    				each_value_1 = /*cat*/ ctx[24].assignments;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
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
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(216:0) {#each categories as cat}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let nav;
    	let ul0;
    	let li0;
    	let h3;
    	let t0_value = /*course*/ ctx[0].details[0].task.courseName + "";
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
    	let t6_value = /*getCurrentGrade*/ ctx[8]() + "";
    	let t6;
    	let t7;
    	let strong2;
    	let t9;
    	let t10_value = (/*newGrade*/ ctx[1] * 100).toFixed(2) + "";
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let div1;
    	let button0;
    	let t15;
    	let button1;
    	let t17;
    	let button2;
    	let t19;
    	let div2;
    	let t20;
    	let t21;
    	let t22;
    	let hr;
    	let t23;
    	let each_1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*issticky*/ ctx[5] && create_if_block_3(ctx);
    	let if_block1 = /*showAreas*/ ctx[3].newAssig && create_if_block_2(ctx);
    	let if_block2 = /*showAreas*/ ctx[3].addFinal && create_if_block_1(ctx);
    	let if_block3 = /*showAreas*/ ctx[3].showGraph && create_if_block$1(ctx);
    	let each_value = /*categories*/ ctx[2];
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
    			strong1.textContent = "Origional:";
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
    			button1.textContent = "Add Final";
    			t17 = space();
    			button2 = element("button");
    			button2.textContent = "Show graph";
    			t19 = space();
    			div2 = element("div");
    			if (if_block1) if_block1.c();
    			t20 = space();
    			if (if_block2) if_block2.c();
    			t21 = space();
    			if (if_block3) if_block3.c();
    			t22 = space();
    			hr = element("hr");
    			t23 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h3, file$1, 139, 12, 4212);
    			add_location(li0, file$1, 139, 8, 4208);
    			add_location(ul0, file$1, 138, 4, 4194);
    			add_location(strong0, file$1, 142, 79, 4363);
    			attr_dev(a, "href", "#/");
    			add_location(a, file$1, 142, 12, 4296);
    			add_location(li1, file$1, 142, 8, 4292);
    			add_location(ul1, file$1, 141, 4, 4278);
    			add_location(nav, file$1, 137, 0, 4183);
    			add_location(strong1, file$1, 148, 7, 4486);
    			add_location(strong2, file$1, 148, 58, 4537);
    			add_location(p, file$1, 148, 4, 4483);
    			add_location(div0, file$1, 147, 0, 4453);
    			add_location(button0, file$1, 159, 4, 4840);
    			add_location(button1, file$1, 160, 4, 4919);
    			add_location(button2, file$1, 161, 4, 4993);
    			attr_dev(div1, "class", "grid");
    			add_location(div1, file$1, 158, 0, 4816);
    			add_location(div2, file$1, 165, 0, 5102);
    			add_location(hr, file$1, 214, 0, 6820);
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
    			/*div0_binding*/ ctx[13](div0);
    			insert_dev(target, t12, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(div1, t15);
    			append_dev(div1, button1);
    			append_dev(div1, t17);
    			append_dev(div1, button2);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div2, anchor);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div2, t20);
    			if (if_block2) if_block2.m(div2, null);
    			append_dev(div2, t21);
    			if (if_block3) if_block3.m(div2, null);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t23, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[14], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[15], false, false, false),
    					listen_dev(button2, "click", /*click_handler_3*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*course*/ 1) && t0_value !== (t0_value = /*course*/ ctx[0].details[0].task.courseName + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty[0] & /*newGrade*/ 2) && t10_value !== (t10_value = (/*newGrade*/ ctx[1] * 100).toFixed(2) + "")) set_data_dev(t10, t10_value);

    			if (/*issticky*/ ctx[5]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(t13.parentNode, t13);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*showAreas*/ ctx[3].newAssig) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*showAreas*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div2, t20);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*showAreas*/ ctx[3].addFinal) {
    				if (if_block2) {
    					if (dirty[0] & /*showAreas*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div2, t21);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*showAreas*/ ctx[3].showGraph) {
    				if (if_block3) {
    					if (dirty[0] & /*showAreas*/ 8) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div2, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*categories, deleteAssignment*/ 1028) {
    				each_value = /*categories*/ ctx[2];
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
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div0);
    			/*div0_binding*/ ctx[13](null);
    			if (detaching) detach_dev(t12);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div2);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t23);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Editor', slots, []);
    	let { course } = $$props;
    	const dispatch = createEventDispatcher();

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
    			// If category is already in array, it was already created from a previous term
    			// In this case, add following assignments to the existing Category object
    			let currentCategory = new Category(category.weight, category.name);

    			let existance = currentCategory.alreadyExists(categories);

    			if (existance.true) {
    				currentCategory = categories[existance.in];
    			}

    			// Add assignments to category
    			for (let assignment of category.assignments) {
    				currentCategory.addAssignment(new Assignment(parseFloat(assignment.scorePoints) * assignment.multiplier, assignment.totalPoints * assignment.multiplier, assignment.assignmentName));
    			}

    			if (!existance.true) categories.push(currentCategory);
    		}
    	}

    	// Normalize weights
    	function normalizeWeights() {
    		let weightSum = 0;

    		for (let cat of categories) {
    			weightSum += cat.weight;
    		}

    		for (let cat of categories) {
    			cat.weight = cat.weight / weightSum * 100;
    		}
    	}

    	normalizeWeights();
    	console.log(categories);

    	// Toggleable areas
    	let showAreas = {
    		newAssig: false,
    		addFinal: false,
    		showGraph: false
    	};

    	function toggleArea(area) {
    		for (let a of Object.keys(showAreas)) {
    			if (a != area || showAreas[area] == true) $$invalidate(3, showAreas[a] = false, showAreas); else $$invalidate(3, showAreas[area] = true, showAreas);
    		}
    	}

    	function deleteAssignment(cat, assig) {
    		let i = categories.indexOf(cat);
    		let a = categories[i].assignments.indexOf(assig);
    		if (a > -1) categories[i].assignments.splice(a, 1);
    		$$invalidate(2, categories);
    	}

    	let newAssig = new Assignment(10, 10, "");

    	function submitAssignment() {
    		console.log(newAssig);

    		for (let cat of categories) {
    			if (cat.name == newAssig["catName"]) {
    				categories[categories.indexOf(cat)].addAssignment(newAssig);
    				$$invalidate(2, categories);
    				return;
    			}
    		}
    	} //categories[newAssig["catIndex"]].push(newAssig)

    	let issticky = false;
    	let sticky;

    	document.addEventListener('scroll', () => {
    		try {
    			if (window.pageYOffset > sticky.offsetTop) {
    				$$invalidate(5, issticky = true);
    			} else {
    				$$invalidate(5, issticky = false);
    			}
    		} catch(e) {
    			console.log(e);
    		}
    	});

    	const writable_props = ['course'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		dispatch('message', { m: "goHome" });
    	};

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			sticky = $$value;
    			$$invalidate(6, sticky);
    		});
    	}

    	const click_handler_1 = () => {
    		toggleArea("newAssig");
    	};

    	const click_handler_2 = () => {
    		toggleArea("addFinal");
    	};

    	const click_handler_3 = () => {
    		toggleArea("showGraph");
    	};

    	function input0_input_handler() {
    		newAssig.name = this.value;
    		$$invalidate(4, newAssig);
    		$$invalidate(2, categories);
    	}

    	function select_change_handler() {
    		newAssig["catName"] = select_value(this);
    		$$invalidate(4, newAssig);
    		$$invalidate(2, categories);
    	}

    	function input1_input_handler() {
    		newAssig.score = to_number(this.value);
    		$$invalidate(4, newAssig);
    		$$invalidate(2, categories);
    	}

    	function input2_input_handler() {
    		newAssig.outof = to_number(this.value);
    		$$invalidate(4, newAssig);
    		$$invalidate(2, categories);
    	}

    	function input0_input_handler_1(each_value_1, assig_index) {
    		each_value_1[assig_index].score = to_number(this.value);
    		$$invalidate(2, categories);
    	}

    	function input1_input_handler_1(each_value_1, assig_index) {
    		each_value_1[assig_index].outof = to_number(this.value);
    		$$invalidate(2, categories);
    	}

    	$$self.$$set = $$props => {
    		if ('course' in $$props) $$invalidate(0, course = $$props.course);
    	};

    	$$self.$capture_state = () => ({
    		course,
    		createEventDispatcher,
    		slide,
    		Category,
    		Assignment,
    		dispatch,
    		getCurrentGrade,
    		newGrade,
    		categories,
    		normalizeWeights,
    		showAreas,
    		toggleArea,
    		deleteAssignment,
    		newAssig,
    		submitAssignment,
    		issticky,
    		sticky
    	});

    	$$self.$inject_state = $$props => {
    		if ('course' in $$props) $$invalidate(0, course = $$props.course);
    		if ('newGrade' in $$props) $$invalidate(1, newGrade = $$props.newGrade);
    		if ('categories' in $$props) $$invalidate(2, categories = $$props.categories);
    		if ('showAreas' in $$props) $$invalidate(3, showAreas = $$props.showAreas);
    		if ('newAssig' in $$props) $$invalidate(4, newAssig = $$props.newAssig);
    		if ('issticky' in $$props) $$invalidate(5, issticky = $$props.issticky);
    		if ('sticky' in $$props) $$invalidate(6, sticky = $$props.sticky);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*categories, newGrade*/ 6) {
    			// On change, update new grade with sum of weighted categories
    			{
    				$$invalidate(1, newGrade = 0);
    				let renormalize = false;
    				let subtractThisWeight = 0;

    				for (let cat of categories) {
    					let wg = cat.getWeightedGrade();

    					if (!isNaN(wg)) {
    						$$invalidate(1, newGrade += wg);
    					} else {
    						renormalize = true;
    						subtractThisWeight += cat.weight;
    					}
    				}

    				// If a whole grade category is null, ignore it and renormalize 
    				if (renormalize) {
    					$$invalidate(1, newGrade /= 1 - subtractThisWeight / 100);
    				}

    				($$invalidate(1, newGrade), $$invalidate(2, categories));
    			}
    		}
    	};

    	return [
    		course,
    		newGrade,
    		categories,
    		showAreas,
    		newAssig,
    		issticky,
    		sticky,
    		dispatch,
    		getCurrentGrade,
    		toggleArea,
    		deleteAssignment,
    		submitAssignment,
    		click_handler,
    		div0_binding,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		input0_input_handler,
    		select_change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input0_input_handler_1,
    		input1_input_handler_1
    	];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { course: 0 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*course*/ ctx[0] === undefined && !('course' in props)) {
    			console_1$1.warn("<Editor> was created without expected prop 'course'");
    		}
    	}

    	get course() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set course(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let x = [
        {
            "terms": [
                {
                    "termID": 473,
                    "termName": "Q1",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 1,
                    "isPrimary": true,
                    "startDate": "2021-08-18",
                    "endDate": "2021-10-15"
                },
                {
                    "termID": 474,
                    "termName": "Q2",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 2,
                    "isPrimary": true,
                    "startDate": "2021-10-18",
                    "endDate": "2021-12-22"
                },
                {
                    "termID": 475,
                    "termName": "Q3",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 3,
                    "isPrimary": true,
                    "startDate": "2022-01-10",
                    "endDate": "2022-03-17"
                },
                {
                    "termID": 476,
                    "termName": "Q4",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 4,
                    "isPrimary": true,
                    "startDate": "2022-03-21",
                    "endDate": "2022-06-06"
                }
            ],
            "details": [
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19725,
                        "courseName": "Intro to Design",
                        "sectionID": 215489,
                        "taskID": 2,
                        "termID": 473,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "scoreID": 906064,
                        "score": "A-",
                        "percent": 91,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1404719502",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19725,
                        "courseName": "Intro to Design",
                        "sectionID": 215489,
                        "taskID": 3,
                        "termID": 473,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1510160399",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19725,
                        "courseName": "Intro to Design",
                        "sectionID": 215489,
                        "taskID": 1,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "1473187404",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19725,
                        "courseName": "Intro to Design",
                        "sectionID": 215489,
                        "taskID": 2,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-838216265",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19725,
                        "courseName": "Intro to Design",
                        "sectionID": 215489,
                        "taskID": 3,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "707597554",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19725,
                        "courseName": "Intro to Design",
                        "sectionID": 215489,
                        "taskID": 2,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "1379541688",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19725,
                        "courseName": "Intro to Design",
                        "sectionID": 215489,
                        "taskID": 3,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1369611789",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19725,
                        "courseName": "Intro to Design",
                        "sectionID": 215489,
                        "taskID": 1,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "1613736014",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19725,
                        "courseName": "Intro to Design",
                        "sectionID": 215489,
                        "taskID": 2,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-697667655",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19725,
                        "courseName": "Intro to Design",
                        "sectionID": 215489,
                        "taskID": 3,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "848146164",
                        "termName": "Q4",
                        "termSeq": 4
                    },
                    "categories": [],
                    "children": null
                }
            ]
        },
        {
            "terms": [
                {
                    "termID": 473,
                    "termName": "Q1",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 1,
                    "isPrimary": true,
                    "startDate": "2021-08-18",
                    "endDate": "2021-10-15"
                },
                {
                    "termID": 474,
                    "termName": "Q2",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 2,
                    "isPrimary": true,
                    "startDate": "2021-10-18",
                    "endDate": "2021-12-22"
                },
                {
                    "termID": 475,
                    "termName": "Q3",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 3,
                    "isPrimary": true,
                    "startDate": "2022-01-10",
                    "endDate": "2022-03-17"
                },
                {
                    "termID": 476,
                    "termName": "Q4",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 4,
                    "isPrimary": true,
                    "startDate": "2022-03-21",
                    "endDate": "2022-06-06"
                }
            ],
            "details": [
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19769,
                        "courseName": "Advisory",
                        "sectionID": 215596,
                        "taskID": 2,
                        "termID": 473,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "calcMethod": "no",
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "527375714",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19769,
                        "courseName": "Advisory",
                        "sectionID": 215596,
                        "taskID": 3,
                        "termID": 473,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "calcMethod": "no",
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "2073189533",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19769,
                        "courseName": "Advisory",
                        "sectionID": 215596,
                        "taskID": 1,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "calcMethod": "no",
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "761570040",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19769,
                        "courseName": "Advisory",
                        "sectionID": 215596,
                        "taskID": 2,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "calcMethod": "no",
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1549833629",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19769,
                        "courseName": "Advisory",
                        "sectionID": 215596,
                        "taskID": 3,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "calcMethod": "no",
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-4019810",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19769,
                        "courseName": "Advisory",
                        "sectionID": 215596,
                        "taskID": 2,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "calcMethod": "no",
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "667924324",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19769,
                        "courseName": "Advisory",
                        "sectionID": 215596,
                        "taskID": 3,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "calcMethod": "no",
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-2081229153",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19769,
                        "courseName": "Advisory",
                        "sectionID": 215596,
                        "taskID": 1,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "calcMethod": "no",
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "902118650",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19769,
                        "courseName": "Advisory",
                        "sectionID": 215596,
                        "taskID": 2,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "calcMethod": "no",
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1409285019",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19769,
                        "courseName": "Advisory",
                        "sectionID": 215596,
                        "taskID": 3,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "calcMethod": "no",
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "136528800",
                        "termName": "Q4",
                        "termSeq": 4
                    },
                    "categories": [],
                    "children": null
                }
            ]
        },
        {
            "terms": [
                {
                    "termID": 473,
                    "termName": "Q1",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 1,
                    "isPrimary": true,
                    "startDate": "2021-08-18",
                    "endDate": "2021-10-15"
                },
                {
                    "termID": 474,
                    "termName": "Q2",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 2,
                    "isPrimary": true,
                    "startDate": "2021-10-18",
                    "endDate": "2021-12-22"
                },
                {
                    "termID": 475,
                    "termName": "Q3",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 3,
                    "isPrimary": true,
                    "startDate": "2022-01-10",
                    "endDate": "2022-03-17"
                },
                {
                    "termID": 476,
                    "termName": "Q4",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 4,
                    "isPrimary": true,
                    "startDate": "2022-03-21",
                    "endDate": "2022-06-06"
                }
            ],
            "details": [
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19898,
                        "courseName": "Eng 11",
                        "sectionID": 215685,
                        "taskID": 2,
                        "termID": 473,
                        "hasAssignments": true,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 218,
                        "scoreID": 729985,
                        "score": "B+",
                        "percent": 89.84,
                        "progressScore": "A-",
                        "progressPercent": 89.89,
                        "progressPointsEarned": 509,
                        "progressTotalPoints": 547,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1472411523",
                        "termName": "Q1",
                        "termSeq": 1
                    },
                    "categories": [
                        {
                            "groupID": 8871,
                            "name": "Essays",
                            "weight": 46,
                            "seq": 2,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 80290,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 79490,
                                    "termID": 473,
                                    "assignmentName": "ICE Cell",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-10-07T06:59:00.000Z",
                                    "assignedDate": "2021-10-05T07:00:00.000Z",
                                    "modifiedDate": "2021-10-21T19:22:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "45",
                                    "scorePoints": "45.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 50,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 469146,
                                "scoreID": 729985,
                                "groupID": 8871,
                                "progressScore": "A-",
                                "progressPercent": 90,
                                "progressTrendVal": null,
                                "progressPointsEarned": 45,
                                "progressTotalPoints": 50,
                                "termID": 473,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 8869,
                            "name": "Other Work",
                            "weight": 17,
                            "seq": 2,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 69802,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 69029,
                                    "termID": 473,
                                    "assignmentName": "CRN8 & J9-10",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-10-13T06:59:00.000Z",
                                    "assignedDate": "2021-10-05T07:00:00.000Z",
                                    "modifiedDate": "2021-10-22T01:33:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "75",
                                    "scorePoints": "75.0",
                                    "scorePercentage": "83.333",
                                    "totalPoints": 90,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 81071,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 80266,
                                    "termID": 473,
                                    "assignmentName": "CRN 6-7",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-10-07T06:59:00.000Z",
                                    "assignedDate": "2021-09-29T07:00:00.000Z",
                                    "modifiedDate": "2021-10-22T01:33:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "40",
                                    "scorePoints": "40.0",
                                    "scorePercentage": "133.333",
                                    "totalPoints": 30,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 59836,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 59127,
                                    "termID": 473,
                                    "assignmentName": "CRN & J8",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-09-30T06:59:00.000Z",
                                    "assignedDate": "2021-09-29T07:00:00.000Z",
                                    "modifiedDate": "2021-10-06T22:40:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "40",
                                    "scorePoints": "40.0",
                                    "scorePercentage": "114.286",
                                    "totalPoints": 35,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 33798,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 33385,
                                    "termID": 473,
                                    "assignmentName": "J4-5, CRN 7-9",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-09-15T06:59:00.000Z",
                                    "assignedDate": "2021-09-07T07:00:00.000Z",
                                    "modifiedDate": "2021-09-16T16:44:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "85",
                                    "scorePoints": "85.0",
                                    "scorePercentage": "94.444",
                                    "totalPoints": 90,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 82995,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 82173,
                                    "termID": 473,
                                    "assignmentName": "VS",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-08-30T06:59:00.000Z",
                                    "assignedDate": "2021-08-29T07:00:00.000Z",
                                    "modifiedDate": "2021-10-22T20:53:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 29853,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 29443,
                                    "termID": 473,
                                    "assignmentName": "DOL #1",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-08-27T06:59:00.000Z",
                                    "assignedDate": "2021-08-26T07:00:00.000Z",
                                    "modifiedDate": "2021-09-14T15:36:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 29848,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 29438,
                                    "termID": 473,
                                    "assignmentName": "J#3",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-08-27T06:59:00.000Z",
                                    "assignedDate": "2021-08-26T07:00:00.000Z",
                                    "modifiedDate": "2021-09-15T19:53:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "15",
                                    "scorePoints": "15.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 15,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 32921,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 32523,
                                    "termID": 473,
                                    "assignmentName": "1-3 TGGN",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-08-25T06:59:00.000Z",
                                    "assignedDate": "2021-08-19T07:00:00.000Z",
                                    "modifiedDate": "2021-09-15T19:43:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "57",
                                    "scorePoints": "57.0",
                                    "scorePercentage": "95.0",
                                    "totalPoints": 60,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 29846,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 29436,
                                    "termID": 473,
                                    "assignmentName": "J#2",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-08-25T06:59:00.000Z",
                                    "assignedDate": "2021-08-24T07:00:00.000Z",
                                    "modifiedDate": "2021-09-22T21:20:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "12",
                                    "scorePoints": "12.0",
                                    "scorePercentage": "80.0",
                                    "totalPoints": 15,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 29747,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 29337,
                                    "termID": 473,
                                    "assignmentName": "J#1",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-08-19T06:59:00.000Z",
                                    "assignedDate": "2021-08-18T07:00:00.000Z",
                                    "modifiedDate": "2021-09-22T16:37:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "13",
                                    "scorePoints": "13.0",
                                    "scorePercentage": "86.667",
                                    "totalPoints": 15,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 218924,
                                "scoreID": 729985,
                                "groupID": 8869,
                                "progressScore": "A",
                                "progressPercent": 96.57,
                                "progressTrendVal": null,
                                "progressPointsEarned": 367,
                                "progressTotalPoints": 380,
                                "termID": 473,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 8413,
                            "name": "Quizzes & Tests",
                            "weight": 17,
                            "seq": 3,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 71185,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 70410,
                                    "termID": 473,
                                    "assignmentName": "RQ1CR",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-10-13T06:59:00.000Z",
                                    "assignedDate": "2021-10-12T07:00:00.000Z",
                                    "modifiedDate": "2021-10-15T17:01:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "9",
                                    "scorePoints": "9.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 10,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 70513,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 69738,
                                    "termID": 473,
                                    "assignmentName": "TGG Exam",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-09-21T06:59:00.000Z",
                                    "assignedDate": "2021-09-20T07:00:00.000Z",
                                    "modifiedDate": "2021-10-15T02:14:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "58",
                                    "scorePoints": "58.0",
                                    "scorePercentage": "80.556",
                                    "totalPoints": 72,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 34079,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 33658,
                                    "termID": 473,
                                    "assignmentName": "RQ2 TGG",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-09-02T06:59:00.000Z",
                                    "assignedDate": "2021-09-01T07:00:00.000Z",
                                    "modifiedDate": "2021-09-16T18:04:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "9",
                                    "scorePoints": "9.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 10,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 27645,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 27240,
                                    "termID": 473,
                                    "assignmentName": "VQ1TGG",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-08-31T06:59:00.000Z",
                                    "assignedDate": "2021-08-30T07:00:00.000Z",
                                    "modifiedDate": "2021-09-22T21:05:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "8",
                                    "scorePoints": "8.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 8,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 29723,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 29313,
                                    "termID": 473,
                                    "assignmentName": "VQ2 TGG",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-08-31T06:59:00.000Z",
                                    "assignedDate": "2021-08-30T07:00:00.000Z",
                                    "modifiedDate": "2021-09-23T18:00:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "5",
                                    "scorePoints": "5.0",
                                    "scorePercentage": "71.429",
                                    "totalPoints": 7,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 25581,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 25156,
                                    "termID": 473,
                                    "assignmentName": "TGG RQ1--Chapters 1-3",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-08-28T06:59:00.000Z",
                                    "assignedDate": "2021-08-27T07:00:00.000Z",
                                    "modifiedDate": "2021-09-14T15:42:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "8",
                                    "scorePoints": "8.0",
                                    "scorePercentage": "80.0",
                                    "totalPoints": 10,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 269172,
                                "scoreID": 729985,
                                "groupID": 8413,
                                "progressScore": "B",
                                "progressPercent": 82.9,
                                "progressTrendVal": null,
                                "progressPointsEarned": 97,
                                "progressTotalPoints": 117,
                                "termID": 473,
                                "taskID": 2
                            }
                        }
                    ],
                    "children": null
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19898,
                        "courseName": "Eng 11",
                        "sectionID": 215685,
                        "taskID": 3,
                        "termID": 473,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "scoreID": 822319,
                        "score": "B",
                        "percent": 89.96,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "262430172",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19898,
                        "courseName": "Eng 11",
                        "sectionID": 215685,
                        "taskID": 1,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "416799465",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19898,
                        "courseName": "Eng 11",
                        "sectionID": 215685,
                        "taskID": 2,
                        "termID": 474,
                        "hasAssignments": true,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 1,
                        "cumulativeTermName": "Q1",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 218,
                        "scoreID": 730000,
                        "progressScore": "A",
                        "progressPercent": 91.81,
                        "progressPointsEarned": 1141,
                        "progressTotalPoints": 1192,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-421601488",
                        "termName": "Q2",
                        "termSeq": 2
                    },
                    "categories": [
                        {
                            "groupID": 8871,
                            "name": "Essays",
                            "weight": 46,
                            "seq": 2,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 111577,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 110590,
                                    "termID": 474,
                                    "assignmentName": "#2 Cell MRP Final",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-12-10T07:59:00.000Z",
                                    "assignedDate": "2021-12-09T08:00:00.000Z",
                                    "modifiedDate": "2021-12-07T19:12:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "90",
                                    "scorePoints": "90.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 111569,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 110582,
                                    "termID": 474,
                                    "assignmentName": "#2 Cell MRP Draft",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-12-07T07:59:00.000Z",
                                    "assignedDate": "2021-12-06T08:00:00.000Z",
                                    "modifiedDate": "2021-12-14T17:31:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "15",
                                    "scorePoints": "15.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 15,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 469147,
                                "scoreID": 730000,
                                "groupID": 8871,
                                "progressScore": "A",
                                "progressPercent": 90.9,
                                "progressTrendVal": null,
                                "progressPointsEarned": 150,
                                "progressTotalPoints": 165,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 8869,
                            "name": "Other Work",
                            "weight": 17,
                            "seq": 2,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 130061,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 128989,
                                    "termID": 474,
                                    "assignmentName": "CPN3 & J#17",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-12-09T07:59:00.000Z",
                                    "assignedDate": "2021-12-01T08:00:00.000Z",
                                    "modifiedDate": "2021-12-09T18:35:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "92",
                                    "scorePoints": "92.0",
                                    "scorePercentage": "96.842",
                                    "totalPoints": 95,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 120908,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 119857,
                                    "termID": 474,
                                    "assignmentName": "CP2 & J#16",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-12-01T07:59:00.000Z",
                                    "assignedDate": "2021-11-23T08:00:00.000Z",
                                    "modifiedDate": "2021-12-01T21:59:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "80",
                                    "scorePoints": "80.0",
                                    "scorePercentage": "106.667",
                                    "totalPoints": 75,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 121446,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 120400,
                                    "termID": 474,
                                    "assignmentName": "CP C Map 1",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-11-20T07:59:00.000Z",
                                    "assignedDate": "2021-11-18T08:00:00.000Z",
                                    "modifiedDate": null,
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": null,
                                    "scorePoints": null,
                                    "scorePercentage": null,
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": null,
                                    "missing": null,
                                    "cheated": null,
                                    "dropped": null,
                                    "incomplete": null,
                                    "turnedIn": null,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 113946,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 112914,
                                    "termID": 474,
                                    "assignmentName": "Schedule Card",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-11-18T07:59:00.000Z",
                                    "assignedDate": "2021-11-16T08:00:00.000Z",
                                    "modifiedDate": "2021-11-19T00:03:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "15",
                                    "scorePoints": "15.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 15,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 112822,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 111834,
                                    "termID": 474,
                                    "assignmentName": "CPN1 & J#15",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-11-17T07:59:00.000Z",
                                    "assignedDate": "2021-11-09T08:00:00.000Z",
                                    "modifiedDate": "2021-11-18T17:12:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "40",
                                    "scorePoints": "40.0",
                                    "scorePercentage": "114.286",
                                    "totalPoints": 35,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 113660,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 112628,
                                    "termID": 474,
                                    "assignmentName": "DOL 11/08",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-11-09T07:59:00.000Z",
                                    "assignedDate": "2021-11-08T08:00:00.000Z",
                                    "modifiedDate": "2021-11-18T21:56:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "6",
                                    "scorePoints": "6.0",
                                    "scorePercentage": "60.0",
                                    "totalPoints": 10,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 113688,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 112656,
                                    "termID": 474,
                                    "assignmentName": "J#14",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-11-06T06:59:00.000Z",
                                    "assignedDate": "2021-11-04T07:00:00.000Z",
                                    "modifiedDate": "2021-12-03T18:55:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "133.333",
                                    "totalPoints": 15,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 88044,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 87179,
                                    "termID": 474,
                                    "assignmentName": "CRE & J# 11-13",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-10-27T06:59:00.000Z",
                                    "assignedDate": "2021-10-19T07:00:00.000Z",
                                    "modifiedDate": "2021-10-28T16:41:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "119",
                                    "scorePoints": "119.0",
                                    "scorePercentage": "113.333",
                                    "totalPoints": 105,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 218939,
                                "scoreID": 730000,
                                "groupID": 8869,
                                "progressScore": "A",
                                "progressPercent": 101.23,
                                "progressTrendVal": null,
                                "progressPointsEarned": 739,
                                "progressTotalPoints": 730,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 8413,
                            "name": "Quizzes & Tests",
                            "weight": 17,
                            "seq": 3,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 133967,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 132886,
                                    "termID": 474,
                                    "assignmentName": "CP RQ3",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-12-11T07:59:00.000Z",
                                    "assignedDate": "2021-12-09T08:00:00.000Z",
                                    "modifiedDate": "2021-12-15T20:22:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "7",
                                    "scorePoints": "7.0",
                                    "scorePercentage": "70.0",
                                    "totalPoints": 10,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 123000,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 121949,
                                    "termID": 474,
                                    "assignmentName": "RQ2 CP",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-12-04T07:59:00.000Z",
                                    "assignedDate": "2021-12-02T08:00:00.000Z",
                                    "modifiedDate": "2021-12-06T15:34:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "7",
                                    "scorePoints": "7.0",
                                    "scorePercentage": "70.0",
                                    "totalPoints": 10,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 125773,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 124717,
                                    "termID": 474,
                                    "assignmentName": "VQ1 CP",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-12-02T07:59:00.000Z",
                                    "assignedDate": "2021-11-30T08:00:00.000Z",
                                    "modifiedDate": "2021-12-06T21:33:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "13",
                                    "scorePoints": "13.0",
                                    "scorePercentage": "86.667",
                                    "totalPoints": 15,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 115682,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 114646,
                                    "termID": 474,
                                    "assignmentName": "RQ1 CP",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-11-20T07:59:00.000Z",
                                    "assignedDate": "2021-11-18T08:00:00.000Z",
                                    "modifiedDate": "2021-12-01T22:19:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "7",
                                    "scorePoints": "7.0",
                                    "scorePercentage": "70.0",
                                    "totalPoints": 10,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 124257,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 123203,
                                    "termID": 474,
                                    "assignmentName": "CRUT",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-11-13T07:59:00.000Z",
                                    "assignedDate": "2021-11-10T08:00:00.000Z",
                                    "modifiedDate": "2021-12-06T15:54:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "89",
                                    "scorePoints": "89.0",
                                    "scorePercentage": "89.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 93535,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 92634,
                                    "termID": 474,
                                    "assignmentName": "CRVQ4",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-10-30T06:59:00.000Z",
                                    "assignedDate": "2021-10-28T07:00:00.000Z",
                                    "modifiedDate": "2021-11-02T18:01:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "15",
                                    "scorePoints": "15.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 15,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 85886,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 85062,
                                    "termID": 474,
                                    "assignmentName": "CRRQ 2 21",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-10-21T06:59:00.000Z",
                                    "assignedDate": "2021-10-19T07:00:00.000Z",
                                    "modifiedDate": "2021-10-26T17:36:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "7",
                                    "scorePoints": "7.0",
                                    "scorePercentage": "70.0",
                                    "totalPoints": 10,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 86230,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 85400,
                                    "termID": 474,
                                    "assignmentName": "CRVQ3",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215685,
                                    "courseID": 19898,
                                    "dueDate": "2021-10-19T06:59:00.000Z",
                                    "assignedDate": "2021-10-18T07:00:00.000Z",
                                    "modifiedDate": "2021-10-26T19:51:00.000Z",
                                    "courseName": "Eng 11",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 269173,
                                "scoreID": 730000,
                                "groupID": 8413,
                                "progressScore": "B",
                                "progressPercent": 84.84,
                                "progressTrendVal": null,
                                "progressPointsEarned": 252,
                                "progressTotalPoints": 297,
                                "termID": 474,
                                "taskID": 2
                            }
                        }
                    ],
                    "children": null
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19898,
                        "courseName": "Eng 11",
                        "sectionID": 215685,
                        "taskID": 3,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "scoreID": 940127,
                        "score": "A",
                        "percent": 91.12,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1736524800",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19898,
                        "courseName": "Eng 11",
                        "sectionID": 215685,
                        "taskID": 2,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "323153749",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19898,
                        "courseName": "Eng 11",
                        "sectionID": 215685,
                        "taskID": 3,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 218,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "1869140766",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19898,
                        "courseName": "Eng 11",
                        "sectionID": 215685,
                        "taskID": 1,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "557348075",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19898,
                        "courseName": "Eng 11",
                        "sectionID": 215685,
                        "taskID": 2,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 3,
                        "cumulativeTermName": "Q3",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 218,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "1242069477",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 19898,
                        "courseName": "Eng 11",
                        "sectionID": 215685,
                        "taskID": 3,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-208241775",
                        "termName": "Q4",
                        "termSeq": 4
                    },
                    "categories": [],
                    "children": null
                }
            ]
        },
        {
            "terms": [
                {
                    "termID": 473,
                    "termName": "Q1",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 1,
                    "isPrimary": true,
                    "startDate": "2021-08-18",
                    "endDate": "2021-10-15"
                },
                {
                    "termID": 474,
                    "termName": "Q2",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 2,
                    "isPrimary": true,
                    "startDate": "2021-10-18",
                    "endDate": "2021-12-22"
                },
                {
                    "termID": 475,
                    "termName": "Q3",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 3,
                    "isPrimary": true,
                    "startDate": "2022-01-10",
                    "endDate": "2022-03-17"
                },
                {
                    "termID": 476,
                    "termName": "Q4",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 4,
                    "isPrimary": true,
                    "startDate": "2022-03-21",
                    "endDate": "2022-06-06"
                }
            ],
            "details": [
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20120,
                        "courseName": "Pre Calc",
                        "sectionID": 215848,
                        "taskID": 2,
                        "termID": 473,
                        "hasAssignments": true,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 258,
                        "scoreID": 740228,
                        "score": "A-",
                        "percent": 91.38,
                        "progressScore": "A-",
                        "progressPercent": 91.38,
                        "progressPointsEarned": 320,
                        "progressTotalPoints": 350,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-145099396",
                        "termName": "Q1",
                        "termSeq": 1
                    },
                    "categories": [
                        {
                            "groupID": 13361,
                            "name": "Homework/Classwork",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 58198,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 57515,
                                    "termID": 473,
                                    "assignmentName": "HW 2.3, 2.4, Polynomials",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-10-07T06:59:00.000Z",
                                    "assignedDate": "2021-09-30T21:46:00.000Z",
                                    "modifiedDate": "2021-10-07T20:07:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 52377,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 51775,
                                    "termID": 473,
                                    "assignmentName": "HW 2.2 & 2.3",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-09-30T06:59:00.000Z",
                                    "assignedDate": "2021-09-28T02:30:00.000Z",
                                    "modifiedDate": "2021-09-30T19:24:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 42663,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 42153,
                                    "termID": 473,
                                    "assignmentName": "HW 1.6 & 2.1",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-09-22T06:59:00.000Z",
                                    "assignedDate": "2021-09-18T17:10:00.000Z",
                                    "modifiedDate": "2021-09-22T23:32:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 32390,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 31993,
                                    "termID": 473,
                                    "assignmentName": "HW 1.4 & 1.5",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-09-16T06:59:00.000Z",
                                    "assignedDate": "2021-09-12T16:40:00.000Z",
                                    "modifiedDate": "2021-09-16T20:39:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 26744,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 26308,
                                    "termID": 473,
                                    "assignmentName": "HW 1.2 & 1.3",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-09-10T06:59:00.000Z",
                                    "assignedDate": "2021-09-05T20:05:00.000Z",
                                    "modifiedDate": "2021-09-11T17:59:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "5",
                                    "scorePoints": "5.0",
                                    "scorePercentage": "50.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 26751,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 26315,
                                    "termID": 473,
                                    "assignmentName": "HW 1.1",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-09-09T06:59:00.000Z",
                                    "assignedDate": "2021-08-26T00:57:00.000Z",
                                    "modifiedDate": "2021-09-11T00:51:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 26745,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 26309,
                                    "termID": 473,
                                    "assignmentName": "HW: Section D",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-09-02T06:59:00.000Z",
                                    "assignedDate": "2021-08-26T00:41:00.000Z",
                                    "modifiedDate": "2021-09-11T00:51:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 26747,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 26311,
                                    "termID": 473,
                                    "assignmentName": "HW B.4",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-09-01T06:59:00.000Z",
                                    "assignedDate": "2021-08-26T00:25:00.000Z",
                                    "modifiedDate": "2021-09-11T00:51:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "9.5",
                                    "scorePoints": "9.5",
                                    "scorePercentage": "95.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 26750,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 26314,
                                    "termID": 473,
                                    "assignmentName": "HW B.3",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-08-31T06:59:00.000Z",
                                    "assignedDate": "2021-08-24T00:57:00.000Z",
                                    "modifiedDate": "2021-09-11T00:51:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 26748,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 26312,
                                    "termID": 473,
                                    "assignmentName": "Syllabus & HW Formatting",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-08-31T06:59:00.000Z",
                                    "assignedDate": "2021-08-22T17:56:00.000Z",
                                    "modifiedDate": "2021-09-11T00:51:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 26749,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 26313,
                                    "termID": 473,
                                    "assignmentName": "HW: B.1 & B.2",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-08-26T06:59:00.000Z",
                                    "assignedDate": "2021-08-22T17:31:00.000Z",
                                    "modifiedDate": "2021-09-11T00:51:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 244700,
                                "scoreID": 740228,
                                "groupID": 13361,
                                "progressScore": "A",
                                "progressPercent": 95,
                                "progressTrendVal": null,
                                "progressPointsEarned": 104.5,
                                "progressTotalPoints": 110,
                                "termID": 473,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 13358,
                            "name": "Quizzes",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 71294,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 70517,
                                    "termID": 473,
                                    "assignmentName": "Chapter 2 Quiz",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-10-12T06:59:00.000Z",
                                    "assignedDate": "2021-10-11T07:00:00.000Z",
                                    "modifiedDate": "2021-10-16T00:17:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "17.5",
                                    "scorePoints": "17.5",
                                    "scorePercentage": "87.5",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 32391,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 31994,
                                    "termID": 473,
                                    "assignmentName": "Chapter 1 Quiz",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-09-14T06:59:00.000Z",
                                    "assignedDate": "2021-09-13T16:35:00.000Z",
                                    "modifiedDate": "2021-09-15T17:14:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 292010,
                                "scoreID": 740228,
                                "groupID": 13358,
                                "progressScore": "A",
                                "progressPercent": 93.75,
                                "progressTrendVal": null,
                                "progressPointsEarned": 37.5,
                                "progressTotalPoints": 40,
                                "termID": 473,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 13355,
                            "name": "Tests",
                            "weight": 50,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 50121,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 49570,
                                    "termID": 473,
                                    "assignmentName": "Chapter 1 Test",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-09-25T06:59:00.000Z",
                                    "assignedDate": "2021-09-24T07:00:00.000Z",
                                    "modifiedDate": "2021-10-01T22:23:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "88",
                                    "scorePoints": "88.0",
                                    "scorePercentage": "88.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 26746,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 26310,
                                    "termID": 473,
                                    "assignmentName": "Chapter P Test",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-09-11T06:59:00.000Z",
                                    "assignedDate": "2021-09-11T00:38:00.000Z",
                                    "modifiedDate": "2021-09-11T00:51:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "90",
                                    "scorePoints": "90.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 100,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 244699,
                                "scoreID": 740228,
                                "groupID": 13355,
                                "progressScore": "B+",
                                "progressPercent": 89,
                                "progressTrendVal": null,
                                "progressPointsEarned": 178,
                                "progressTotalPoints": 200,
                                "termID": 473,
                                "taskID": 2
                            }
                        }
                    ],
                    "children": null
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20120,
                        "courseName": "Pre Calc",
                        "sectionID": 215848,
                        "taskID": 3,
                        "termID": 473,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "443103263",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20120,
                        "courseName": "Pre Calc",
                        "sectionID": 215848,
                        "taskID": 1,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-868516230",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20120,
                        "courseName": "Pre Calc",
                        "sectionID": 215848,
                        "taskID": 2,
                        "termID": 474,
                        "hasAssignments": true,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 1,
                        "cumulativeTermName": "Q1",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 258,
                        "scoreID": 740263,
                        "progressScore": "A-",
                        "progressPercent": 90.47,
                        "progressPointsEarned": 722,
                        "progressTotalPoints": 802,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1464909773",
                        "termName": "Q2",
                        "termSeq": 2
                    },
                    "categories": [
                        {
                            "groupID": 13365,
                            "name": "Final Exam",
                            "weight": 10,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 145155,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 144045,
                                    "termID": 474,
                                    "assignmentName": "Semester 1 Final Exam",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-12-21T07:59:00.000Z",
                                    "assignedDate": "2021-12-20T08:00:00.000Z",
                                    "modifiedDate": "2021-12-24T18:44:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "34",
                                    "scorePoints": "34.0",
                                    "scorePercentage": "97.143",
                                    "totalPoints": 35,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 540270,
                                "scoreID": 740263,
                                "groupID": 13365,
                                "progressScore": "A+",
                                "progressPercent": 97.14,
                                "progressTrendVal": null,
                                "progressPointsEarned": 34,
                                "progressTotalPoints": 35,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 13361,
                            "name": "Homework/Classwork",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 140563,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 139480,
                                    "termID": 474,
                                    "assignmentName": "Semester Review Classwork",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-12-17T23:10:00.000Z",
                                    "assignedDate": "2021-12-16T16:58:00.000Z",
                                    "modifiedDate": "2021-12-18T18:05:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 127555,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 126495,
                                    "termID": 474,
                                    "assignmentName": "HW 5.1",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-12-15T07:59:00.000Z",
                                    "assignedDate": "2021-12-06T04:44:00.000Z",
                                    "modifiedDate": "2021-12-15T17:43:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "7",
                                    "scorePoints": "7.0",
                                    "scorePercentage": "70.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 120544,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 119493,
                                    "termID": 474,
                                    "assignmentName": "HW 4.7",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-12-08T07:59:00.000Z",
                                    "assignedDate": "2021-12-01T01:21:00.000Z",
                                    "modifiedDate": "2021-12-08T16:09:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 120545,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 119494,
                                    "termID": 474,
                                    "assignmentName": "HW 4.5 & 4.6",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-12-02T07:59:00.000Z",
                                    "assignedDate": "2021-11-29T22:05:00.000Z",
                                    "modifiedDate": "2021-12-02T20:04:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 104009,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 103081,
                                    "termID": 474,
                                    "assignmentName": "HW 4.2 & 4.4",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-11-17T07:59:00.000Z",
                                    "assignedDate": "2021-11-11T00:35:00.000Z",
                                    "modifiedDate": "2021-11-20T05:12:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 104010,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 103082,
                                    "termID": 474,
                                    "assignmentName": "HW 4.1 & 4.3",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-11-12T07:59:00.000Z",
                                    "assignedDate": "2021-11-09T01:48:00.000Z",
                                    "modifiedDate": "2021-11-12T18:46:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 86670,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 85841,
                                    "termID": 474,
                                    "assignmentName": "HW 3.3",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-11-03T06:59:00.000Z",
                                    "assignedDate": "2021-10-26T21:19:00.000Z",
                                    "modifiedDate": "2021-11-03T14:12:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 86671,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 85842,
                                    "termID": 474,
                                    "assignmentName": "HW 3.2",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-10-29T06:59:00.000Z",
                                    "assignedDate": "2021-10-26T21:17:00.000Z",
                                    "modifiedDate": "2021-10-29T18:06:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 86672,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 85843,
                                    "termID": 474,
                                    "assignmentName": "HW 3.1",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-10-27T06:59:00.000Z",
                                    "assignedDate": "2021-10-20T03:30:00.000Z",
                                    "modifiedDate": "2021-10-27T16:46:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 65995,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 65255,
                                    "termID": 473,
                                    "assignmentName": "HW 2.6 & 2.7",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-10-20T06:59:00.000Z",
                                    "assignedDate": "2021-10-12T00:50:00.000Z",
                                    "modifiedDate": "2021-10-27T03:55:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 244770,
                                "scoreID": 740263,
                                "groupID": 13361,
                                "progressScore": "A",
                                "progressPercent": 95.95,
                                "progressTrendVal": null,
                                "progressPointsEarned": 201.5,
                                "progressTotalPoints": 210,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 13358,
                            "name": "Quizzes",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 123589,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 122535,
                                    "termID": 474,
                                    "assignmentName": "Quiz 4.1 - 4.5",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-12-04T07:59:00.000Z",
                                    "assignedDate": "2021-12-03T08:00:00.000Z",
                                    "modifiedDate": "2021-12-06T23:23:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "9.5",
                                    "scorePoints": "9.5",
                                    "scorePercentage": "79.167",
                                    "totalPoints": 12,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 123546,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 122492,
                                    "termID": 474,
                                    "assignmentName": "Unit Circle Quiz",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-11-20T07:59:00.000Z",
                                    "assignedDate": "2021-11-19T08:00:00.000Z",
                                    "modifiedDate": "2021-12-04T00:15:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "4.5",
                                    "scorePoints": "4.5",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 5,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 292043,
                                "scoreID": 740263,
                                "groupID": 13358,
                                "progressScore": "A-",
                                "progressPercent": 90.35,
                                "progressTrendVal": null,
                                "progressPointsEarned": 51.5,
                                "progressTotalPoints": 57,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 13355,
                            "name": "Tests",
                            "weight": 50,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 145153,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 144043,
                                    "termID": 474,
                                    "assignmentName": "Chapter 4 Test",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-12-11T07:59:00.000Z",
                                    "assignedDate": "2021-12-10T08:00:00.000Z",
                                    "modifiedDate": "2021-12-24T18:41:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "80",
                                    "scorePoints": "80.0",
                                    "scorePercentage": "80.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 123528,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 122474,
                                    "termID": 474,
                                    "assignmentName": "Chapter 3 Test",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-11-06T06:59:00.000Z",
                                    "assignedDate": "2021-11-05T07:00:00.000Z",
                                    "modifiedDate": "2021-12-04T00:15:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "87",
                                    "scorePoints": "87.0",
                                    "scorePercentage": "87.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 90236,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 89360,
                                    "termID": 474,
                                    "assignmentName": "Chapter 2 Test",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215848,
                                    "courseID": 20120,
                                    "dueDate": "2021-10-23T06:59:00.000Z",
                                    "assignedDate": "2021-10-22T07:00:00.000Z",
                                    "modifiedDate": "2021-10-30T00:45:00.000Z",
                                    "courseName": "Pre Calc",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "90",
                                    "scorePoints": "90.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 244769,
                                "scoreID": 740263,
                                "groupID": 13355,
                                "progressScore": "B+",
                                "progressPercent": 87,
                                "progressTrendVal": null,
                                "progressPointsEarned": 435,
                                "progressTotalPoints": 500,
                                "termID": 474,
                                "taskID": 2
                            }
                        }
                    ],
                    "children": null
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20120,
                        "courseName": "Pre Calc",
                        "sectionID": 215848,
                        "taskID": 3,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1634106080",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20120,
                        "courseName": "Pre Calc",
                        "sectionID": 215848,
                        "taskID": 2,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 258,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-961988708",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20120,
                        "courseName": "Pre Calc",
                        "sectionID": 215848,
                        "taskID": 3,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "583651873",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20120,
                        "courseName": "Pre Calc",
                        "sectionID": 215848,
                        "taskID": 1,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-727967620",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20120,
                        "courseName": "Pre Calc",
                        "sectionID": 215848,
                        "taskID": 2,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 3,
                        "cumulativeTermName": "Q3",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 258,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-43246178",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20120,
                        "courseName": "Pre Calc",
                        "sectionID": 215848,
                        "taskID": 3,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1493557470",
                        "termName": "Q4",
                        "termSeq": 4
                    },
                    "categories": [],
                    "children": null
                }
            ]
        },
        {
            "terms": [
                {
                    "termID": 473,
                    "termName": "Q1",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 1,
                    "isPrimary": true,
                    "startDate": "2021-08-18",
                    "endDate": "2021-10-15"
                },
                {
                    "termID": 474,
                    "termName": "Q2",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 2,
                    "isPrimary": true,
                    "startDate": "2021-10-18",
                    "endDate": "2021-12-22"
                },
                {
                    "termID": 475,
                    "termName": "Q3",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 3,
                    "isPrimary": true,
                    "startDate": "2022-01-10",
                    "endDate": "2022-03-17"
                },
                {
                    "termID": 476,
                    "termName": "Q4",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 4,
                    "isPrimary": true,
                    "startDate": "2022-03-21",
                    "endDate": "2022-06-06"
                }
            ],
            "details": [
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20220,
                        "courseName": "AP Physics 1",
                        "sectionID": 215938,
                        "taskID": 2,
                        "termID": 473,
                        "hasAssignments": true,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 1,
                        "cumulativeTermName": "Q1",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": false,
                        "usePercent": false,
                        "curveID": 400,
                        "scoreID": 886763,
                        "score": "A+",
                        "percent": 100,
                        "progressScore": "A+",
                        "progressPercent": 100,
                        "progressPointsEarned": 160,
                        "progressTotalPoints": 160,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-2050538765",
                        "termName": "Q1",
                        "termSeq": 1
                    },
                    "categories": [
                        {
                            "groupID": 15680,
                            "name": "Work",
                            "weight": 100,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": false,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 76023,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 75232,
                                    "termID": 473,
                                    "assignmentName": "Kinematic Graphs HW",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-10-16T06:59:00.000Z",
                                    "assignedDate": "2021-10-12T17:01:00.000Z",
                                    "modifiedDate": "2021-10-19T15:51:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 66864,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 66123,
                                    "termID": 473,
                                    "assignmentName": "Lab Ave Velocity",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-10-09T06:59:00.000Z",
                                    "assignedDate": "2021-10-08T07:00:00.000Z",
                                    "modifiedDate": "2021-10-12T17:56:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 58029,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 57346,
                                    "termID": 473,
                                    "assignmentName": "Syllabus",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-10-09T06:59:00.000Z",
                                    "assignedDate": "2021-10-05T07:00:00.000Z",
                                    "modifiedDate": "2021-10-12T17:54:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 61048,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 60326,
                                    "termID": 473,
                                    "assignmentName": "Projectile Motion HW",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-10-08T06:59:00.000Z",
                                    "assignedDate": "2021-10-07T07:00:00.000Z",
                                    "modifiedDate": "2021-10-07T17:56:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 61063,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 60340,
                                    "termID": 473,
                                    "assignmentName": "Test Correction",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-10-08T06:59:00.000Z",
                                    "assignedDate": "2021-10-07T07:00:00.000Z",
                                    "modifiedDate": "2021-10-07T17:57:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 61053,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 60331,
                                    "termID": 473,
                                    "assignmentName": "Unit 1Test Practice",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-10-08T03:56:00.000Z",
                                    "assignedDate": "2021-10-07T07:00:00.000Z",
                                    "modifiedDate": "2021-10-07T17:57:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 61036,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 60316,
                                    "termID": 473,
                                    "assignmentName": "Ch 3 Hw",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-09-15T06:59:00.000Z",
                                    "assignedDate": "2021-09-07T07:00:00.000Z",
                                    "modifiedDate": "2021-10-07T17:51:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 59309,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 58615,
                                    "termID": 473,
                                    "assignmentName": "Hw Ch 2-1D Motion",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-09-07T06:59:00.000Z",
                                    "assignedDate": "2021-09-06T07:00:00.000Z",
                                    "modifiedDate": "2021-10-06T17:31:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 418297,
                                "scoreID": 886763,
                                "groupID": 15680,
                                "progressScore": "A+",
                                "progressPercent": 100,
                                "progressTrendVal": null,
                                "progressPointsEarned": 160,
                                "progressTotalPoints": 160,
                                "termID": 473,
                                "taskID": 2
                            }
                        }
                    ],
                    "children": null
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20220,
                        "courseName": "AP Physics 1",
                        "sectionID": 215938,
                        "taskID": 3,
                        "termID": 473,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "73059688",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20220,
                        "courseName": "AP Physics 1",
                        "sectionID": 215938,
                        "taskID": 1,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1238559805",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20220,
                        "courseName": "AP Physics 1",
                        "sectionID": 215938,
                        "taskID": 2,
                        "termID": 474,
                        "hasAssignments": true,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 1,
                        "cumulativeTermName": "Q1",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": false,
                        "usePercent": false,
                        "curveID": 400,
                        "scoreID": 886781,
                        "progressScore": "B+",
                        "progressPercent": 88.78,
                        "progressPointsEarned": 825.75,
                        "progressTotalPoints": 930.09,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1516337454",
                        "termName": "Q2",
                        "termSeq": 2
                    },
                    "categories": [
                        {
                            "groupID": 15680,
                            "name": "Work",
                            "weight": 100,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": false,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 144695,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 143604,
                                    "termID": 474,
                                    "assignmentName": "Final Fall 2021",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-12-23T07:59:00.000Z",
                                    "assignedDate": "2021-12-22T08:00:00.000Z",
                                    "modifiedDate": "2021-12-22T20:16:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "34",
                                    "scorePoints": "34.0",
                                    "scorePercentage": "87.179",
                                    "totalPoints": 39,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 3.847,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 137807,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 136726,
                                    "termID": 474,
                                    "assignmentName": "Test Unit 3 Circular Motion and Gravitation",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-12-16T07:59:00.000Z",
                                    "assignedDate": "2021-11-29T08:00:00.000Z",
                                    "modifiedDate": "2021-12-16T16:55:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "12",
                                    "scorePoints": "12.0",
                                    "scorePercentage": "50.0",
                                    "totalPoints": 24,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 4.167,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 134691,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 133610,
                                    "termID": 474,
                                    "assignmentName": "Unit 3 MCQ Circular Motion",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-12-15T07:59:00.000Z",
                                    "assignedDate": "2021-12-07T08:00:00.000Z",
                                    "modifiedDate": "2021-12-15T16:29:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 138316,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 137231,
                                    "termID": 474,
                                    "assignmentName": "Lab: Gravity 2 Methods",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-12-14T07:59:00.000Z",
                                    "assignedDate": "2021-12-10T18:02:00.000Z",
                                    "modifiedDate": "2021-12-16T19:06:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 130188,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 129116,
                                    "termID": 474,
                                    "assignmentName": "Gravitation Worksheets",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-12-11T07:59:00.000Z",
                                    "assignedDate": "2021-12-07T17:29:00.000Z",
                                    "modifiedDate": "2021-12-16T19:06:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 130187,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 129115,
                                    "termID": 474,
                                    "assignmentName": "Circular Motion Worksheets",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-12-08T07:59:00.000Z",
                                    "assignedDate": "2021-12-03T16:39:00.000Z",
                                    "modifiedDate": "2021-12-09T18:57:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 126531,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 125475,
                                    "termID": 474,
                                    "assignmentName": "Unit 2 FRQ Forces",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-12-08T07:59:00.000Z",
                                    "assignedDate": "2021-12-02T08:00:00.000Z",
                                    "modifiedDate": "2021-12-07T17:20:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 130186,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 129114,
                                    "termID": 474,
                                    "assignmentName": "Lab: Conical Circular Motion",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-12-04T07:59:00.000Z",
                                    "assignedDate": "2021-12-03T17:35:00.000Z",
                                    "modifiedDate": "2021-12-09T18:57:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "16",
                                    "scorePoints": "16.0",
                                    "scorePercentage": "80.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 118895,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 117860,
                                    "termID": 474,
                                    "assignmentName": "Unit 2 Force Test",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-12-01T07:59:00.000Z",
                                    "assignedDate": "2021-11-30T08:00:00.000Z",
                                    "modifiedDate": "2021-11-30T16:36:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "17",
                                    "scorePoints": "17.0",
                                    "scorePercentage": "73.913",
                                    "totalPoints": 23,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 4.35,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 122261,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 121210,
                                    "termID": 474,
                                    "assignmentName": "Spring Constant Lab",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-11-20T07:59:00.000Z",
                                    "assignedDate": "2021-11-19T17:41:00.000Z",
                                    "modifiedDate": "2021-12-02T22:15:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 108871,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 107888,
                                    "termID": 474,
                                    "assignmentName": "U2 Force MCQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-11-16T07:59:00.000Z",
                                    "assignedDate": "2021-11-11T08:00:00.000Z",
                                    "modifiedDate": "2021-11-16T17:14:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 109782,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 108797,
                                    "termID": 474,
                                    "assignmentName": "Ch 4 HW p103:  37, 39, 47, 49, 57, 59, 65, 67, 89",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-11-13T07:59:00.000Z",
                                    "assignedDate": "2021-11-03T18:04:00.000Z",
                                    "modifiedDate": "2021-11-16T21:49:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 109783,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 108798,
                                    "termID": 474,
                                    "assignmentName": "Forces Worksheets #2",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-11-13T07:59:00.000Z",
                                    "assignedDate": "2021-11-10T16:53:00.000Z",
                                    "modifiedDate": "2021-11-16T21:49:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 108836,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 107853,
                                    "termID": 474,
                                    "assignmentName": "Lab Friction Force",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-11-11T07:59:00.000Z",
                                    "assignedDate": "2021-11-04T07:00:00.000Z",
                                    "modifiedDate": "2021-11-16T17:07:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 107071,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 106114,
                                    "termID": 474,
                                    "assignmentName": "Force Graphing",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-11-06T06:59:00.000Z",
                                    "assignedDate": "2021-11-02T16:41:00.000Z",
                                    "modifiedDate": "2021-11-15T17:03:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 95259,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 94362,
                                    "termID": 474,
                                    "assignmentName": "Classwork: FBD 1-11",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-11-04T06:59:00.000Z",
                                    "assignedDate": "2021-11-02T19:05:00.000Z",
                                    "modifiedDate": "2021-11-03T22:13:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 92538,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 91636,
                                    "termID": 474,
                                    "assignmentName": "Unit 1 FRQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-10-30T06:59:00.000Z",
                                    "assignedDate": "2021-10-18T07:00:00.000Z",
                                    "modifiedDate": "2021-11-02T17:30:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 91901,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 91001,
                                    "termID": 474,
                                    "assignmentName": "Unit 1: MCQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-10-30T06:59:00.000Z",
                                    "assignedDate": "2021-10-18T07:00:00.000Z",
                                    "modifiedDate": "2021-11-01T17:31:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 89690,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 88810,
                                    "termID": 474,
                                    "assignmentName": "Lab Projectile Motion",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-10-28T06:59:00.000Z",
                                    "assignedDate": "2021-10-19T07:00:00.000Z",
                                    "modifiedDate": "2021-10-29T17:58:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 89708,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 88828,
                                    "termID": 474,
                                    "assignmentName": "Test Unit 1 2D Motion",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 215938,
                                    "courseID": 20220,
                                    "dueDate": "2021-10-26T06:59:00.000Z",
                                    "assignedDate": "2021-10-25T07:00:00.000Z",
                                    "modifiedDate": "2021-10-29T18:11:00.000Z",
                                    "courseName": "AP Physics 1",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "95",
                                    "scorePoints": "95.0",
                                    "scorePercentage": "95.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 418315,
                                "scoreID": 886781,
                                "groupID": 15680,
                                "progressScore": "B+",
                                "progressPercent": 88.78,
                                "progressTrendVal": null,
                                "progressPointsEarned": 825.75,
                                "progressTotalPoints": 930.09,
                                "termID": 474,
                                "taskID": 2
                            }
                        }
                    ],
                    "children": null
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20220,
                        "courseName": "AP Physics 1",
                        "sectionID": 215938,
                        "taskID": 3,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "scoreID": 932283,
                        "score": "A+",
                        "percent": 98.86,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "803528390",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20220,
                        "courseName": "AP Physics 1",
                        "sectionID": 215938,
                        "taskID": 2,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 3,
                        "cumulativeTermName": "Q3",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": false,
                        "usePercent": false,
                        "curveID": 400,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "1663925498",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20220,
                        "courseName": "AP Physics 1",
                        "sectionID": 215938,
                        "taskID": 3,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "213608298",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20220,
                        "courseName": "AP Physics 1",
                        "sectionID": 215938,
                        "taskID": 1,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1098011195",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20220,
                        "courseName": "AP Physics 1",
                        "sectionID": 215938,
                        "taskID": 2,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 3,
                        "cumulativeTermName": "Q3",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": false,
                        "usePercent": false,
                        "curveID": 400,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-413283845",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20220,
                        "courseName": "AP Physics 1",
                        "sectionID": 215938,
                        "taskID": 3,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1863601045",
                        "termName": "Q4",
                        "termSeq": 4
                    },
                    "categories": [],
                    "children": null
                }
            ]
        },
        {
            "terms": [
                {
                    "termID": 473,
                    "termName": "Q1",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 1,
                    "isPrimary": true,
                    "startDate": "2021-08-18",
                    "endDate": "2021-10-15"
                },
                {
                    "termID": 474,
                    "termName": "Q2",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 2,
                    "isPrimary": true,
                    "startDate": "2021-10-18",
                    "endDate": "2021-12-22"
                },
                {
                    "termID": 475,
                    "termName": "Q3",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 3,
                    "isPrimary": true,
                    "startDate": "2022-01-10",
                    "endDate": "2022-03-17"
                },
                {
                    "termID": 476,
                    "termName": "Q4",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 4,
                    "isPrimary": true,
                    "startDate": "2022-03-21",
                    "endDate": "2022-06-06"
                }
            ],
            "details": [
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20345,
                        "courseName": "AP USH",
                        "sectionID": 216051,
                        "taskID": 2,
                        "termID": 473,
                        "hasAssignments": true,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 1,
                        "cumulativeTermName": "Q1",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 6,
                        "scoreID": 889094,
                        "score": "B+",
                        "progressScore": "B+",
                        "progressPercent": 87.49,
                        "progressPointsEarned": 1161.5,
                        "progressTotalPoints": 1213,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "392085285",
                        "termName": "Q1",
                        "termSeq": 1
                    },
                    "categories": [
                        {
                            "groupID": 10463,
                            "name": "Coursework",
                            "weight": 30,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 34362,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 33940,
                                    "termID": 473,
                                    "assignmentName": "Chapter 8 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-10-16T06:59:00.000Z",
                                    "assignedDate": "2021-10-08T07:00:00.000Z",
                                    "modifiedDate": "2021-10-21T00:22:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "70",
                                    "scorePoints": "70.0",
                                    "scorePercentage": "70.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 67383,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 66641,
                                    "termID": 473,
                                    "assignmentName": "Chapter 5 SAQ in class grading assignment",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-10-12T06:59:00.000Z",
                                    "assignedDate": "2021-10-11T07:00:00.000Z",
                                    "modifiedDate": "2021-10-21T00:27:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 66163,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 65423,
                                    "termID": 473,
                                    "assignmentName": "Chapter 7 Class Lecture Presentation",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-10-09T06:59:00.000Z",
                                    "assignedDate": "2021-10-05T07:00:00.000Z",
                                    "modifiedDate": "2021-10-18T19:20:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 34356,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 33934,
                                    "termID": 473,
                                    "assignmentName": "Chapter 7 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-10-09T06:59:00.000Z",
                                    "assignedDate": "2021-10-01T07:00:00.000Z",
                                    "modifiedDate": "2021-10-21T00:22:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 34351,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 33929,
                                    "termID": 473,
                                    "assignmentName": "Chapter 6 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-10-02T06:59:00.000Z",
                                    "assignedDate": "2021-09-24T07:00:00.000Z",
                                    "modifiedDate": "2021-10-11T22:13:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 34346,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 33924,
                                    "termID": 473,
                                    "assignmentName": "Chapter 5 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-09-25T06:59:00.000Z",
                                    "assignedDate": "2021-09-17T07:00:00.000Z",
                                    "modifiedDate": "2021-10-11T22:13:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 43582,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 43070,
                                    "termID": 473,
                                    "assignmentName": "Chapter 4 SAQ peer grading activity",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-09-21T06:59:00.000Z",
                                    "assignedDate": "2021-09-20T07:00:00.000Z",
                                    "modifiedDate": "2021-09-23T17:46:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 34340,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 33918,
                                    "termID": 473,
                                    "assignmentName": "Chapter 4 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-09-18T06:59:00.000Z",
                                    "assignedDate": "2021-09-10T07:00:00.000Z",
                                    "modifiedDate": "2021-09-23T16:45:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 34335,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 33913,
                                    "termID": 473,
                                    "assignmentName": "Chapter 3 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-09-11T06:59:00.000Z",
                                    "assignedDate": "2021-09-03T07:00:00.000Z",
                                    "modifiedDate": "2021-09-16T18:07:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 34331,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 33909,
                                    "termID": 473,
                                    "assignmentName": "Chapter 2 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-09-01T06:59:00.000Z",
                                    "assignedDate": "2021-08-26T07:00:00.000Z",
                                    "modifiedDate": "2021-09-16T18:07:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 34326,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 33904,
                                    "termID": 473,
                                    "assignmentName": "Chapter 1 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-08-27T06:59:00.000Z",
                                    "assignedDate": "2021-08-20T07:00:00.000Z",
                                    "modifiedDate": "2021-09-16T18:07:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 432650,
                                "scoreID": 889094,
                                "groupID": 10463,
                                "progressScore": "A",
                                "progressPercent": 97.02,
                                "progressTrendVal": null,
                                "progressPointsEarned": 980,
                                "progressTotalPoints": 1010,
                                "termID": 473,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 10475,
                            "name": "Participation",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 34271,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 33849,
                                    "termID": 473,
                                    "assignmentName": "First Quarter Participation",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-10-16T06:59:00.000Z",
                                    "assignedDate": "2021-08-18T07:00:00.000Z",
                                    "modifiedDate": "2021-09-16T17:54:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 78677,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 77880,
                                    "termID": 473,
                                    "assignmentName": "Notebook",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-10-16T06:59:00.000Z",
                                    "assignedDate": "2021-08-18T07:00:00.000Z",
                                    "modifiedDate": "2021-10-21T17:38:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 432652,
                                "scoreID": 889094,
                                "groupID": 10475,
                                "progressScore": "A",
                                "progressPercent": 100,
                                "progressTrendVal": null,
                                "progressPointsEarned": 120,
                                "progressTotalPoints": 120,
                                "termID": 473,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 10467,
                            "name": "Writing Assessments",
                            "weight": 40,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 66167,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 65427,
                                    "termID": 473,
                                    "assignmentName": "Chapter 6 SAQ - Completion ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-09-28T06:59:00.000Z",
                                    "assignedDate": "2021-09-27T07:00:00.000Z",
                                    "modifiedDate": "2021-10-12T21:23:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "3",
                                    "scorePoints": "3.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 3,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 43576,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 43064,
                                    "termID": 473,
                                    "assignmentName": "Period 2 LEQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-09-25T06:59:00.000Z",
                                    "assignedDate": "2021-09-20T07:00:00.000Z",
                                    "modifiedDate": "2021-12-21T03:53:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "37.5",
                                    "scorePoints": "37.5",
                                    "scorePercentage": "75.0",
                                    "totalPoints": 50,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 65829,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 65089,
                                    "termID": 473,
                                    "assignmentName": "Chapter 5 SAQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-09-22T06:59:00.000Z",
                                    "assignedDate": "2021-09-21T07:00:00.000Z",
                                    "modifiedDate": "2021-12-21T03:34:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "21",
                                    "scorePoints": "21.0",
                                    "scorePercentage": "70.0",
                                    "totalPoints": 30,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 432651,
                                "scoreID": 889094,
                                "groupID": 10467,
                                "progressScore": "C",
                                "progressPercent": 74.09,
                                "progressTrendVal": null,
                                "progressPointsEarned": 61.5,
                                "progressTotalPoints": 83,
                                "termID": 473,
                                "taskID": 2
                            }
                        }
                    ],
                    "children": null
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20345,
                        "courseName": "AP USH",
                        "sectionID": 216051,
                        "taskID": 3,
                        "termID": 473,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 6,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "83607006",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20345,
                        "courseName": "AP USH",
                        "sectionID": 216051,
                        "taskID": 1,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1228185473",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20345,
                        "courseName": "AP USH",
                        "sectionID": 216051,
                        "taskID": 2,
                        "termID": 474,
                        "hasAssignments": true,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "scoreID": 916492,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1299334876",
                        "termName": "Q2",
                        "termSeq": 2
                    },
                    "categories": [
                        {
                            "groupID": 10463,
                            "name": "Coursework",
                            "weight": 30,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 141590,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 140506,
                                    "termID": 474,
                                    "assignmentName": "DBQ Document Summaries",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-21T07:59:00.000Z",
                                    "assignedDate": "2021-12-20T08:00:00.000Z",
                                    "modifiedDate": "2021-12-21T00:27:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 141585,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 140501,
                                    "termID": 474,
                                    "assignmentName": "DBQ Introduction and analysis",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-21T07:59:00.000Z",
                                    "assignedDate": "2021-12-20T08:00:00.000Z",
                                    "modifiedDate": "2021-12-21T00:24:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 141596,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 140512,
                                    "termID": 474,
                                    "assignmentName": "Using Primary Sources",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-21T07:59:00.000Z",
                                    "assignedDate": "2021-12-20T08:00:00.000Z",
                                    "modifiedDate": "2021-12-21T00:27:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 141097,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 140014,
                                    "termID": 474,
                                    "assignmentName": "Chapter 16 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-18T07:59:00.000Z",
                                    "assignedDate": "2021-12-13T08:00:00.000Z",
                                    "modifiedDate": "2021-12-20T11:03:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 141093,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 140010,
                                    "termID": 474,
                                    "assignmentName": "Chapter 15 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-11T07:59:00.000Z",
                                    "assignedDate": "2021-12-06T08:00:00.000Z",
                                    "modifiedDate": "2021-12-20T11:03:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 141089,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 140006,
                                    "termID": 474,
                                    "assignmentName": "Chapter 14 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-04T07:59:00.000Z",
                                    "assignedDate": "2021-11-29T08:00:00.000Z",
                                    "modifiedDate": "2021-12-20T11:03:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 141081,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 139998,
                                    "termID": 474,
                                    "assignmentName": "Chapter 13 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-11-20T07:59:00.000Z",
                                    "assignedDate": "2021-11-15T08:00:00.000Z",
                                    "modifiedDate": "2021-12-20T11:03:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 103030,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 102101,
                                    "termID": 474,
                                    "assignmentName": "Chapter 12 notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-11-13T07:59:00.000Z",
                                    "assignedDate": "2021-11-08T08:00:00.000Z",
                                    "modifiedDate": "2021-11-18T03:57:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 103768,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 102839,
                                    "termID": 474,
                                    "assignmentName": "Group 2 Group Chap 12 lesson",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-11-11T07:59:00.000Z",
                                    "assignedDate": "2021-11-10T08:00:00.000Z",
                                    "modifiedDate": "2021-11-18T03:57:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "90",
                                    "scorePoints": "90.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 103347,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 102418,
                                    "termID": 474,
                                    "assignmentName": "LEQ Peer grading class assignment #1,2,3",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-11-11T07:59:00.000Z",
                                    "assignedDate": "2021-11-10T08:00:00.000Z",
                                    "modifiedDate": "2021-11-16T10:27:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "50",
                                    "scorePoints": "50.0",
                                    "scorePercentage": "50.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 103351,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 102422,
                                    "termID": 474,
                                    "assignmentName": "Period 4 MCQ practice",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-11-11T07:59:00.000Z",
                                    "assignedDate": "2021-11-10T08:00:00.000Z",
                                    "modifiedDate": "2021-11-10T21:13:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "50",
                                    "scorePoints": "50.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 50,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 103024,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 102095,
                                    "termID": 474,
                                    "assignmentName": "Chapter 11 notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-11-06T06:59:00.000Z",
                                    "assignedDate": "2021-11-01T07:00:00.000Z",
                                    "modifiedDate": "2021-11-10T19:26:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 103020,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 102091,
                                    "termID": 474,
                                    "assignmentName": "Chapter 10 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-10-30T06:59:00.000Z",
                                    "assignedDate": "2021-10-25T07:00:00.000Z",
                                    "modifiedDate": "2021-11-10T19:26:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 103015,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 102086,
                                    "termID": 474,
                                    "assignmentName": "Chapter 9 Notes",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-10-23T06:59:00.000Z",
                                    "assignedDate": "2021-10-18T07:00:00.000Z",
                                    "modifiedDate": "2021-11-10T19:26:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 507131,
                                "scoreID": 916492,
                                "groupID": 10463,
                                "progressScore": null,
                                "progressPercent": null,
                                "progressTrendVal": null,
                                "progressPointsEarned": null,
                                "progressTotalPoints": null,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 10471,
                            "name": "Exams",
                            "weight": 10,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": false,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 142462,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 141374,
                                    "termID": 474,
                                    "assignmentName": "Semester Final",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-21T07:59:00.000Z",
                                    "assignedDate": "2021-12-20T08:00:00.000Z",
                                    "modifiedDate": "2021-12-21T00:35:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "34",
                                    "scorePoints": "34.0",
                                    "scorePercentage": "68.0",
                                    "totalPoints": 50,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 141104,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 140021,
                                    "termID": 474,
                                    "assignmentName": "MCQ Chapter 8-13",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-11T07:59:00.000Z",
                                    "assignedDate": "2021-12-06T08:00:00.000Z",
                                    "modifiedDate": "2021-12-20T10:47:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "22",
                                    "scorePoints": "22.0",
                                    "scorePercentage": "88.0",
                                    "totalPoints": 25,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 105409,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 104452,
                                    "termID": 474,
                                    "assignmentName": "MCQ - Chap 1-8 Test",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-11-13T07:59:00.000Z",
                                    "assignedDate": "2021-11-10T08:00:00.000Z",
                                    "modifiedDate": "2021-11-12T21:58:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "18",
                                    "scorePoints": "18.0",
                                    "scorePercentage": "72.0",
                                    "totalPoints": 25,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 509780,
                                "scoreID": 916492,
                                "groupID": 10471,
                                "progressScore": null,
                                "progressPercent": null,
                                "progressTrendVal": null,
                                "progressPointsEarned": null,
                                "progressTotalPoints": null,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 10475,
                            "name": "Participation",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 103327,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 102398,
                                    "termID": 474,
                                    "assignmentName": "Second Quarter Participation",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-11-11T07:59:00.000Z",
                                    "assignedDate": "2021-11-10T08:00:00.000Z",
                                    "modifiedDate": "2021-11-10T21:12:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 507133,
                                "scoreID": 916492,
                                "groupID": 10475,
                                "progressScore": null,
                                "progressPercent": null,
                                "progressTrendVal": null,
                                "progressPointsEarned": null,
                                "progressTotalPoints": null,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 10467,
                            "name": "Writing Assessments",
                            "weight": 40,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 142528,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 141440,
                                    "termID": 474,
                                    "assignmentName": "Week of 12/13 SAQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-18T07:59:00.000Z",
                                    "assignedDate": "2021-12-13T08:00:00.000Z",
                                    "modifiedDate": "2021-12-22T20:54:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "3",
                                    "scorePoints": "3.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 3,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 141070,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 139987,
                                    "termID": 474,
                                    "assignmentName": "Graded LEQ 1",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-11T07:59:00.000Z",
                                    "assignedDate": "2021-12-01T08:00:00.000Z",
                                    "modifiedDate": null,
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": null,
                                    "scorePoints": null,
                                    "scorePercentage": null,
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": null,
                                    "missing": null,
                                    "cheated": null,
                                    "dropped": null,
                                    "incomplete": null,
                                    "turnedIn": null,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 142524,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 141436,
                                    "termID": 474,
                                    "assignmentName": "Week of 12/6 SAQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-11T07:59:00.000Z",
                                    "assignedDate": "2021-12-06T08:00:00.000Z",
                                    "modifiedDate": "2021-12-22T20:54:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "3",
                                    "scorePoints": "3.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 3,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 142520,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 141432,
                                    "termID": 474,
                                    "assignmentName": "Week of 11/29 SAQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-12-04T07:59:00.000Z",
                                    "assignedDate": "2021-11-29T08:00:00.000Z",
                                    "modifiedDate": null,
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": null,
                                    "scorePoints": null,
                                    "scorePercentage": null,
                                    "totalPoints": 30,
                                    "comments": null,
                                    "feedback": null,
                                    "late": null,
                                    "missing": null,
                                    "cheated": null,
                                    "dropped": null,
                                    "incomplete": null,
                                    "turnedIn": null,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 142516,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 141428,
                                    "termID": 474,
                                    "assignmentName": "Week of 11/15 SAQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-11-20T07:59:00.000Z",
                                    "assignedDate": "2021-11-15T08:00:00.000Z",
                                    "modifiedDate": "2021-12-22T20:54:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "3",
                                    "scorePoints": "3.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 3,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 103358,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 102429,
                                    "termID": 474,
                                    "assignmentName": "Week of 11/1 SAQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-11-06T06:59:00.000Z",
                                    "assignedDate": "2021-11-01T07:00:00.000Z",
                                    "modifiedDate": "2021-12-21T01:44:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "30",
                                    "scorePoints": "30.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 30,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 103339,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 102410,
                                    "termID": 474,
                                    "assignmentName": "Week of 10/18 Period 4 SAQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-10-23T06:59:00.000Z",
                                    "assignedDate": "2021-10-18T07:00:00.000Z",
                                    "modifiedDate": "2021-11-10T21:11:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "3",
                                    "scorePoints": "3.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 3,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 103411,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 102482,
                                    "termID": 474,
                                    "assignmentName": "Week of 10/11 SAQ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216051,
                                    "courseID": 20345,
                                    "dueDate": "2021-10-19T06:59:00.000Z",
                                    "assignedDate": "2021-10-18T07:00:00.000Z",
                                    "modifiedDate": "2021-11-10T20:47:00.000Z",
                                    "courseName": "AP USH",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "3",
                                    "scorePoints": "3.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 3,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 507132,
                                "scoreID": 916492,
                                "groupID": 10467,
                                "progressScore": null,
                                "progressPercent": null,
                                "progressTrendVal": null,
                                "progressPointsEarned": null,
                                "progressTotalPoints": null,
                                "termID": 474,
                                "taskID": 2
                            }
                        }
                    ],
                    "children": null
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20345,
                        "courseName": "AP USH",
                        "sectionID": 216051,
                        "taskID": 3,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 6,
                        "scoreID": 976865,
                        "score": "B+",
                        "percent": 89.83,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "1524197393",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20345,
                        "courseName": "AP USH",
                        "sectionID": 216051,
                        "taskID": 2,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1321831189",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20345,
                        "courseName": "AP USH",
                        "sectionID": 216051,
                        "taskID": 3,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "223982630",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20345,
                        "courseName": "AP USH",
                        "sectionID": 216051,
                        "taskID": 1,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1087636863",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20345,
                        "courseName": "AP USH",
                        "sectionID": 216051,
                        "taskID": 2,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "895926764",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20345,
                        "courseName": "AP USH",
                        "sectionID": 216051,
                        "taskID": 3,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1853226713",
                        "termName": "Q4",
                        "termSeq": 4
                    },
                    "categories": [],
                    "children": null
                }
            ]
        },
        {
            "terms": [
                {
                    "termID": 473,
                    "termName": "Q1",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 1,
                    "isPrimary": true,
                    "startDate": "2021-08-18",
                    "endDate": "2021-10-15"
                },
                {
                    "termID": 474,
                    "termName": "Q2",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 2,
                    "isPrimary": true,
                    "startDate": "2021-10-18",
                    "endDate": "2021-12-22"
                },
                {
                    "termID": 475,
                    "termName": "Q3",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 3,
                    "isPrimary": true,
                    "startDate": "2022-01-10",
                    "endDate": "2022-03-17"
                },
                {
                    "termID": 476,
                    "termName": "Q4",
                    "termScheduleID": 170,
                    "termScheduleName": "Quarters",
                    "termSeq": 4,
                    "isPrimary": true,
                    "startDate": "2022-03-21",
                    "endDate": "2022-06-06"
                }
            ],
            "details": [
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20384,
                        "courseName": "Chin 3",
                        "sectionID": 216143,
                        "taskID": 2,
                        "termID": 473,
                        "hasAssignments": true,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 300,
                        "scoreID": 717725,
                        "score": "A",
                        "percent": 95.84,
                        "progressScore": "A",
                        "progressPercent": 95.41,
                        "progressPointsEarned": 1081.5,
                        "progressTotalPoints": 1140,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "982565065",
                        "termName": "Q1",
                        "termSeq": 1
                    },
                    "categories": [
                        {
                            "groupID": 8218,
                            "name": "Homework",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 81629,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 80822,
                                    "termID": 473,
                                    "assignmentName": "L3 WB Reading ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-15T15:30:00.000Z",
                                    "assignedDate": "2021-10-13T04:55:00.000Z",
                                    "modifiedDate": "2021-10-22T05:33:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79730,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78930,
                                    "termID": 473,
                                    "assignmentName": "L3 vocabulary preview",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-08T15:30:00.000Z",
                                    "assignedDate": "2021-10-06T19:44:00.000Z",
                                    "modifiedDate": "2021-10-21T16:31:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 67732,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 66990,
                                    "termID": 473,
                                    "assignmentName": "L2 storytelling",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-02T06:59:00.000Z",
                                    "assignedDate": "2021-09-19T19:06:00.000Z",
                                    "modifiedDate": "2021-10-13T05:00:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "18",
                                    "scorePoints": "18.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79727,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78927,
                                    "termID": 473,
                                    "assignmentName": "Workbook translations ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-29T15:30:00.000Z",
                                    "assignedDate": "2021-09-19T19:03:00.000Z",
                                    "modifiedDate": "2021-10-21T16:31:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 44599,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 44081,
                                    "termID": 473,
                                    "assignmentName": "Workbook reading ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-22T15:30:00.000Z",
                                    "assignedDate": "2021-09-19T18:56:00.000Z",
                                    "modifiedDate": "2021-09-23T23:30:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 67734,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 66992,
                                    "termID": 473,
                                    "assignmentName": "L2 vocabulary preview ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-17T15:30:00.000Z",
                                    "assignedDate": "2021-09-15T22:25:00.000Z",
                                    "modifiedDate": "2021-10-13T05:00:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 67738,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 66996,
                                    "termID": 473,
                                    "assignmentName": "L1 storytelling ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-15T15:30:00.000Z",
                                    "assignedDate": "2021-09-13T19:35:00.000Z",
                                    "modifiedDate": "2021-10-13T05:00:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 81628,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 80821,
                                    "termID": 473,
                                    "assignmentName": "WB P17-18",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-08T15:30:00.000Z",
                                    "assignedDate": "2021-09-03T15:46:00.000Z",
                                    "modifiedDate": "2021-10-22T05:33:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 20873,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 20490,
                                    "termID": 473,
                                    "assignmentName": "P5-10",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-08-30T15:30:00.000Z",
                                    "assignedDate": "2021-08-25T17:43:00.000Z",
                                    "modifiedDate": "2021-09-06T23:25:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 20874,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 20491,
                                    "termID": 473,
                                    "assignmentName": "L1 vocabulary preview",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-08-25T15:30:00.000Z",
                                    "assignedDate": "2021-08-20T17:44:00.000Z",
                                    "modifiedDate": "2021-09-06T23:25:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 189238,
                                "scoreID": 717725,
                                "groupID": 8218,
                                "progressScore": "A+",
                                "progressPercent": 98.82,
                                "progressTrendVal": null,
                                "progressPointsEarned": 168,
                                "progressTotalPoints": 170,
                                "termID": 473,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 8193,
                            "name": "Participation",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 79715,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78915,
                                    "termID": 473,
                                    "assignmentName": "L3 quizlet practice",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-16T06:59:00.000Z",
                                    "assignedDate": "2021-10-15T18:23:00.000Z",
                                    "modifiedDate": "2021-10-22T05:33:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 67731,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 66989,
                                    "termID": 473,
                                    "assignmentName": "10/11",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-11T18:56:00.000Z",
                                    "assignedDate": "2021-10-11T18:51:00.000Z",
                                    "modifiedDate": "2021-10-13T05:00:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79719,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78919,
                                    "termID": 473,
                                    "assignmentName": "10/08 ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-08T18:20:00.000Z",
                                    "assignedDate": "2021-10-08T18:14:00.000Z",
                                    "modifiedDate": "2021-10-21T16:31:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79728,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78928,
                                    "termID": 473,
                                    "assignmentName": "10/06 journal",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-06T18:20:00.000Z",
                                    "assignedDate": "2021-10-06T15:28:00.000Z",
                                    "modifiedDate": "2021-10-21T16:31:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79633,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78833,
                                    "termID": 473,
                                    "assignmentName": "L2 participation",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-02T06:59:00.000Z",
                                    "assignedDate": "2021-09-13T07:00:00.000Z",
                                    "modifiedDate": "2021-10-21T16:13:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "85",
                                    "scorePoints": "85.0",
                                    "scorePercentage": "85.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 67735,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 66993,
                                    "termID": 473,
                                    "assignmentName": "9/27  journal",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-27T18:55:00.000Z",
                                    "assignedDate": "2021-09-27T18:51:00.000Z",
                                    "modifiedDate": "2021-10-13T05:00:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "9",
                                    "scorePoints": "9.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79731,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78931,
                                    "termID": 473,
                                    "assignmentName": "Workbook writing",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-24T15:30:00.000Z",
                                    "assignedDate": "2021-09-19T19:00:00.000Z",
                                    "modifiedDate": "2021-10-21T16:31:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79716,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78916,
                                    "termID": 473,
                                    "assignmentName": "Discuss the picture",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-23T06:59:00.000Z",
                                    "assignedDate": "2021-09-22T18:53:00.000Z",
                                    "modifiedDate": "2021-10-21T16:31:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79725,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78925,
                                    "termID": 473,
                                    "assignmentName": "????",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-22T22:00:00.000Z",
                                    "assignedDate": "2021-09-22T21:31:00.000Z",
                                    "modifiedDate": "2021-10-21T16:31:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 44597,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 44079,
                                    "termID": 473,
                                    "assignmentName": "09/22 journal",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-22T18:20:00.000Z",
                                    "assignedDate": "2021-09-22T18:16:00.000Z",
                                    "modifiedDate": "2021-09-23T23:30:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 51323,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 50757,
                                    "termID": 473,
                                    "assignmentName": "Mid-Autumn festival extra credits",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-22T06:59:00.000Z",
                                    "assignedDate": "2021-09-21T07:00:00.000Z",
                                    "modifiedDate": null,
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": null,
                                    "scorePoints": null,
                                    "scorePercentage": null,
                                    "totalPoints": 0,
                                    "comments": null,
                                    "feedback": null,
                                    "late": null,
                                    "missing": null,
                                    "cheated": null,
                                    "dropped": null,
                                    "incomplete": null,
                                    "turnedIn": null,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79724,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78924,
                                    "termID": 473,
                                    "assignmentName": "Room Jambord ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-18T06:59:00.000Z",
                                    "assignedDate": "2021-09-17T19:06:00.000Z",
                                    "modifiedDate": "2021-10-21T16:31:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 44596,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 44078,
                                    "termID": 473,
                                    "assignmentName": "9/17 journal",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-17T18:20:00.000Z",
                                    "assignedDate": "2021-09-17T18:15:00.000Z",
                                    "modifiedDate": "2021-09-23T23:30:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 67737,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 66995,
                                    "termID": 473,
                                    "assignmentName": "9/13 journal ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-13T18:56:00.000Z",
                                    "assignedDate": "2021-09-13T18:48:00.000Z",
                                    "modifiedDate": "2021-10-13T05:00:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 26179,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 25751,
                                    "termID": 473,
                                    "assignmentName": "L1 participation ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-11T06:59:00.000Z",
                                    "assignedDate": "2021-08-18T07:00:00.000Z",
                                    "modifiedDate": "2021-09-23T03:58:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "90",
                                    "scorePoints": "90.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 19706,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 19348,
                                    "termID": 473,
                                    "assignmentName": "What will make you feel ??",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-03T19:00:00.000Z",
                                    "assignedDate": "2021-09-03T18:54:00.000Z",
                                    "modifiedDate": "2021-09-03T22:21:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 19705,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 19347,
                                    "termID": 473,
                                    "assignmentName": "Advantage about learning Chinese",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-03T06:59:00.000Z",
                                    "assignedDate": "2021-09-01T18:49:00.000Z",
                                    "modifiedDate": "2021-09-03T22:21:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 81630,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 80823,
                                    "termID": 473,
                                    "assignmentName": "WB 10-16",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-02T15:30:00.000Z",
                                    "assignedDate": "2021-08-30T19:55:00.000Z",
                                    "modifiedDate": "2021-10-22T05:40:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 19703,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 19345,
                                    "termID": 473,
                                    "assignmentName": "8/30 ??",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-08-30T18:56:00.000Z",
                                    "assignedDate": "2021-08-30T18:50:00.000Z",
                                    "modifiedDate": "2021-09-03T22:21:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 19702,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 19344,
                                    "termID": 473,
                                    "assignmentName": "Introduce your name",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-08-26T18:56:00.000Z",
                                    "assignedDate": "2021-08-26T18:49:00.000Z",
                                    "modifiedDate": "2021-09-03T22:21:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 44600,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 44082,
                                    "termID": 473,
                                    "assignmentName": "how do you come to school",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-08-25T19:00:00.000Z",
                                    "assignedDate": "2021-08-25T18:53:00.000Z",
                                    "modifiedDate": "2021-09-23T23:30:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "8",
                                    "scorePoints": "8.0",
                                    "scorePercentage": "80.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 19701,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 19343,
                                    "termID": 473,
                                    "assignmentName": "The first day of the school",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-08-24T19:00:00.000Z",
                                    "assignedDate": "2021-08-24T18:47:00.000Z",
                                    "modifiedDate": "2021-09-03T22:21:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 188076,
                                "scoreID": 717725,
                                "groupID": 8193,
                                "progressScore": "A",
                                "progressPercent": 93.33,
                                "progressTrendVal": null,
                                "progressPointsEarned": 392,
                                "progressTotalPoints": 420,
                                "termID": 473,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 10907,
                            "name": "Project",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 79717,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78917,
                                    "termID": 473,
                                    "assignmentName": "Apartment for Rent Poster",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-05T06:59:00.000Z",
                                    "assignedDate": "2021-09-27T17:47:00.000Z",
                                    "modifiedDate": "2021-10-21T16:31:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "100",
                                    "scorePoints": "100.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 100,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 81631,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 80824,
                                    "termID": 473,
                                    "assignmentName": "L1 Role play projet ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-10T15:30:00.000Z",
                                    "assignedDate": "2021-09-02T19:26:00.000Z",
                                    "modifiedDate": "2021-10-22T05:40:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "95",
                                    "scorePoints": "95.0",
                                    "scorePercentage": "95.0",
                                    "totalPoints": 100,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 19704,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 19346,
                                    "termID": 473,
                                    "assignmentName": "Name PPT",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-08-27T15:30:00.000Z",
                                    "assignedDate": "2021-08-25T22:11:00.000Z",
                                    "modifiedDate": "2021-09-03T22:21:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 188077,
                                "scoreID": 717725,
                                "groupID": 10907,
                                "progressScore": "A+",
                                "progressPercent": 97.72,
                                "progressTrendVal": null,
                                "progressPointsEarned": 215,
                                "progressTotalPoints": 220,
                                "termID": 473,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 10912,
                            "name": "quiz",
                            "weight": 15,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 79726,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78926,
                                    "termID": 473,
                                    "assignmentName": "L2 vocabulary quiz",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-30T06:59:00.000Z",
                                    "assignedDate": "2021-09-27T17:40:00.000Z",
                                    "modifiedDate": "2021-10-21T16:31:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "96",
                                    "scorePoints": "96.0",
                                    "scorePercentage": "96.0",
                                    "totalPoints": 100,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 20872,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 20489,
                                    "termID": 473,
                                    "assignmentName": "L1 vocab quiz",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-02T19:40:00.000Z",
                                    "assignedDate": "2021-08-30T17:43:00.000Z",
                                    "modifiedDate": "2021-09-08T19:25:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "45.5",
                                    "scorePoints": "45.5",
                                    "scorePercentage": "91.0",
                                    "totalPoints": 50,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 189239,
                                "scoreID": 717725,
                                "groupID": 10912,
                                "progressScore": "A",
                                "progressPercent": 94.33,
                                "progressTrendVal": null,
                                "progressPointsEarned": 141.5,
                                "progressTotalPoints": 150,
                                "termID": 473,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 10917,
                            "name": "Unit Test",
                            "weight": 15,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 67736,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 66994,
                                    "termID": 473,
                                    "assignmentName": "L2 unit test",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-02T06:59:00.000Z",
                                    "assignedDate": "2021-09-27T17:48:00.000Z",
                                    "modifiedDate": "2021-10-13T05:00:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "67",
                                    "scorePoints": "67.0",
                                    "scorePercentage": "83.75",
                                    "totalPoints": 80,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 44598,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 44080,
                                    "termID": 473,
                                    "assignmentName": "L1 unit test",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-09-15T19:40:00.000Z",
                                    "assignedDate": "2021-09-08T17:49:00.000Z",
                                    "modifiedDate": "2021-09-24T18:28:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "98",
                                    "scorePoints": "98.0",
                                    "scorePercentage": "98.0",
                                    "totalPoints": 100,
                                    "comments": null,
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 369638,
                                "scoreID": 717725,
                                "groupID": 10917,
                                "progressScore": "A-",
                                "progressPercent": 91.66,
                                "progressTrendVal": null,
                                "progressPointsEarned": 165,
                                "progressTotalPoints": 180,
                                "termID": 473,
                                "taskID": 2
                            }
                        }
                    ],
                    "children": null
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20384,
                        "courseName": "Chin 3",
                        "sectionID": 216143,
                        "taskID": 3,
                        "termID": 473,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 300,
                        "scoreID": 842166,
                        "score": "A",
                        "percent": 96.01,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-760739633",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20384,
                        "courseName": "Chin 3",
                        "sectionID": 216143,
                        "taskID": 1,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": true,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "scoreID": 717727,
                        "progressPercent": 94.97,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "1741733277",
                        "termName": "Q2",
                        "termSeq": 2
                    },
                    "categories": [],
                    "children": [
                        {
                            "_id": "12157",
                            "personID": 12157,
                            "trialID": 1034,
                            "calendarID": 635,
                            "structureID": 635,
                            "courseID": 20384,
                            "courseName": "Chin 3",
                            "sectionID": 216143,
                            "taskID": 2,
                            "termID": 474,
                            "hasAssignments": true,
                            "hasCompositeTasks": false,
                            "taskName": "Quarter Grade",
                            "gradedOnce": false,
                            "treeTraversalSeq": 2,
                            "cumulativeTermSeq": 1,
                            "cumulativeTermName": "Q1",
                            "maxAssignments": 0,
                            "calcMethod": "nu",
                            "groupWeighted": true,
                            "usePercent": false,
                            "curveID": 300,
                            "scoreID": 717726,
                            "progressScore": "A",
                            "progressPercent": 94.97,
                            "progressPointsEarned": 1660.5,
                            "progressTotalPoints": 1760,
                            "calculationWeight": 100,
                            "calculationPercent": 1,
                            "hasDetail": true,
                            "_model": "PortalGradingTaskModel",
                            "_hashCode": "1526171829",
                            "termName": "Q2",
                            "termSeq": 2
                        }
                    ]
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20384,
                        "courseName": "Chin 3",
                        "sectionID": 216143,
                        "taskID": 2,
                        "termID": 474,
                        "hasAssignments": true,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 1,
                        "cumulativeTermName": "Q1",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 300,
                        "scoreID": 717726,
                        "progressScore": "A",
                        "progressPercent": 94.97,
                        "progressPointsEarned": 1660.5,
                        "progressTotalPoints": 1760,
                        "calculationWeight": 100,
                        "calculationPercent": 1,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "1526171829",
                        "termName": "Q2",
                        "termSeq": 2
                    },
                    "categories": [
                        {
                            "groupID": 8218,
                            "name": "Homework",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 114464,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113429,
                                    "termID": 474,
                                    "assignmentName": "L4 workbook translate ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-11-15T16:30:00.000Z",
                                    "assignedDate": "2021-11-05T19:47:00.000Z",
                                    "modifiedDate": "2021-11-19T05:58:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 114465,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113430,
                                    "termID": 474,
                                    "assignmentName": "L4 workbook writing ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-11-12T16:30:00.000Z",
                                    "assignedDate": "2021-11-05T19:46:00.000Z",
                                    "modifiedDate": "2021-11-19T05:58:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 114468,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113433,
                                    "termID": 474,
                                    "assignmentName": "L4 workbook reading ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-11-10T07:59:00.000Z",
                                    "assignedDate": "2021-11-05T19:44:00.000Z",
                                    "modifiedDate": "2021-11-19T05:58:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 114459,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113424,
                                    "termID": 474,
                                    "assignmentName": "L4 vocabulary preview",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-11-05T15:30:00.000Z",
                                    "assignedDate": "2021-11-03T19:45:00.000Z",
                                    "modifiedDate": "2021-11-19T05:57:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 189240,
                                "scoreID": 717726,
                                "groupID": 8218,
                                "progressScore": "A+",
                                "progressPercent": 99.2,
                                "progressTrendVal": null,
                                "progressPointsEarned": 248,
                                "progressTotalPoints": 250,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 8193,
                            "name": "Participation",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 114462,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113427,
                                    "termID": 474,
                                    "assignmentName": "11/15",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-11-16T07:59:00.000Z",
                                    "assignedDate": "2021-11-15T19:51:00.000Z",
                                    "modifiedDate": "2021-11-19T05:57:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 114466,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113431,
                                    "termID": 474,
                                    "assignmentName": "11/09",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-11-09T19:38:00.000Z",
                                    "assignedDate": "2021-11-09T19:34:00.000Z",
                                    "modifiedDate": "2021-11-19T05:58:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 114470,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113435,
                                    "termID": 474,
                                    "assignmentName": "11/05",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-11-06T06:59:00.000Z",
                                    "assignedDate": "2021-11-05T18:13:00.000Z",
                                    "modifiedDate": "2021-11-19T05:58:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 114460,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113425,
                                    "termID": 474,
                                    "assignmentName": "??????",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-11-06T06:59:00.000Z",
                                    "assignedDate": "2021-11-05T19:17:00.000Z",
                                    "modifiedDate": "2021-11-19T05:57:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 114461,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113426,
                                    "termID": 474,
                                    "assignmentName": "11/03",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-11-04T06:59:00.000Z",
                                    "assignedDate": "2021-11-03T18:15:00.000Z",
                                    "modifiedDate": "2021-11-19T05:57:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 114467,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113432,
                                    "termID": 474,
                                    "assignmentName": "?? ??",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-11-03T19:30:00.000Z",
                                    "assignedDate": "2021-11-03T19:15:00.000Z",
                                    "modifiedDate": "2021-11-19T05:58:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79723,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78923,
                                    "termID": 474,
                                    "assignmentName": "??????",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-29T15:30:00.000Z",
                                    "assignedDate": "2021-10-18T18:37:00.000Z",
                                    "modifiedDate": "2021-11-19T05:57:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "90",
                                    "scorePoints": "90.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 100,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79729,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78929,
                                    "termID": 474,
                                    "assignmentName": "L3 storytelling ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-27T15:30:00.000Z",
                                    "assignedDate": "2021-10-20T22:23:00.000Z",
                                    "modifiedDate": "2021-11-19T05:58:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "18",
                                    "scorePoints": "18.0",
                                    "scorePercentage": "90.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 114463,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113428,
                                    "termID": 474,
                                    "assignmentName": "10/22 journal",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-22T18:21:00.000Z",
                                    "assignedDate": "2021-10-22T18:16:00.000Z",
                                    "modifiedDate": "2021-11-19T05:57:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79718,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78918,
                                    "termID": 474,
                                    "assignmentName": "L3 workbook translation",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-22T15:30:00.000Z",
                                    "assignedDate": "2021-10-20T22:21:00.000Z",
                                    "modifiedDate": "2021-11-19T05:57:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79721,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78921,
                                    "termID": 473,
                                    "assignmentName": "L3 vocabulary quiz",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-21T06:59:00.000Z",
                                    "assignedDate": "2021-10-15T19:47:00.000Z",
                                    "modifiedDate": "2021-10-22T05:33:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "95",
                                    "scorePoints": "95.0",
                                    "scorePercentage": "95.0",
                                    "totalPoints": 100,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79714,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78914,
                                    "termID": 473,
                                    "assignmentName": "L3 workbook writing ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-20T15:30:00.000Z",
                                    "assignedDate": "2021-10-15T19:49:00.000Z",
                                    "modifiedDate": "2021-11-19T05:57:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "20",
                                    "scorePoints": "20.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 20,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                },
                                {
                                    "objectSectionID": 79722,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 78922,
                                    "termID": 474,
                                    "assignmentName": "10/18 journal",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-19T06:59:00.000Z",
                                    "assignedDate": "2021-10-18T16:30:00.000Z",
                                    "modifiedDate": "2021-11-19T05:57:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "10",
                                    "scorePoints": "10.0",
                                    "scorePercentage": "100.0",
                                    "totalPoints": 10,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 188078,
                                "scoreID": 717726,
                                "groupID": 8193,
                                "progressScore": "A",
                                "progressPercent": 94.07,
                                "progressTrendVal": null,
                                "progressPointsEarned": 715,
                                "progressTotalPoints": 760,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 10907,
                            "name": "Project",
                            "weight": 20,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [],
                            "progress": {
                                "progressID": 188079,
                                "scoreID": 717726,
                                "groupID": 10907,
                                "progressScore": "A+",
                                "progressPercent": 97.72,
                                "progressTrendVal": null,
                                "progressPointsEarned": 215,
                                "progressTotalPoints": 220,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 10912,
                            "name": "quiz",
                            "weight": 15,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 114469,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113434,
                                    "termID": 474,
                                    "assignmentName": "L4 vocabulary quiz ",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-11-13T07:59:00.000Z",
                                    "assignedDate": "2021-11-05T19:48:00.000Z",
                                    "modifiedDate": "2021-11-19T05:58:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "81",
                                    "scorePoints": "81.0",
                                    "scorePercentage": "81.0",
                                    "totalPoints": 100,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 189241,
                                "scoreID": 717726,
                                "groupID": 10912,
                                "progressScore": "B+",
                                "progressPercent": 89,
                                "progressTrendVal": null,
                                "progressPointsEarned": 222.5,
                                "progressTotalPoints": 250,
                                "termID": 474,
                                "taskID": 2
                            }
                        },
                        {
                            "groupID": 10917,
                            "name": "Unit Test",
                            "weight": 15,
                            "seq": 0,
                            "isExcluded": false,
                            "isWeighted": true,
                            "usePercent": false,
                            "assignments": [
                                {
                                    "objectSectionID": 114458,
                                    "parentObjectSectionID": null,
                                    "type": 7,
                                    "personID": 12157,
                                    "taskID": 2,
                                    "groupActivityID": 113423,
                                    "termID": 474,
                                    "assignmentName": "L3 unit test",
                                    "schoolID": 11,
                                    "calendarID": 635,
                                    "structureID": 635,
                                    "sectionID": 216143,
                                    "courseID": 20384,
                                    "dueDate": "2021-10-28T06:59:00.000Z",
                                    "assignedDate": "2021-10-22T22:26:00.000Z",
                                    "modifiedDate": "2021-11-19T05:57:00.000Z",
                                    "courseName": "Chin 3",
                                    "hasMultipleScores": null,
                                    "active": true,
                                    "scoringType": "p",
                                    "score": "95",
                                    "scorePoints": "95.0",
                                    "scorePercentage": "95.0",
                                    "totalPoints": 100,
                                    "comments": "",
                                    "feedback": null,
                                    "late": false,
                                    "missing": false,
                                    "cheated": false,
                                    "dropped": false,
                                    "incomplete": false,
                                    "turnedIn": false,
                                    "wysiwygSubmission": false,
                                    "upload": false,
                                    "driveSubmission": false,
                                    "multiplier": 1,
                                    "hasStudentHTML": null,
                                    "hasTeacherHTML": null,
                                    "hasQuiz": null,
                                    "hasLTI": null,
                                    "hasLTIAcceptsScores": null,
                                    "hasFile": null,
                                    "hasExternalFile": null,
                                    "hasSubmission": null,
                                    "hasDiscussion": null,
                                    "hasRubric": null,
                                    "notGraded": false,
                                    "includeCampusLearning": true
                                }
                            ],
                            "progress": {
                                "progressID": 369639,
                                "scoreID": 717726,
                                "groupID": 10917,
                                "progressScore": "A-",
                                "progressPercent": 92.85,
                                "progressTrendVal": null,
                                "progressPointsEarned": 260,
                                "progressTotalPoints": 280,
                                "termID": 474,
                                "taskID": 2
                            }
                        }
                    ],
                    "children": null
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20384,
                        "courseName": "Chin 3",
                        "sectionID": 216143,
                        "taskID": 3,
                        "termID": 474,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "953839012",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20384,
                        "courseName": "Chin 3",
                        "sectionID": 216143,
                        "taskID": 2,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 3,
                        "cumulativeTermName": "Q3",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": true,
                        "usePercent": false,
                        "curveID": 300,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "326941003",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20384,
                        "courseName": "Chin 3",
                        "sectionID": 216143,
                        "taskID": 3,
                        "termID": 475,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1123370331",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20384,
                        "courseName": "Chin 3",
                        "sectionID": 216143,
                        "taskID": 1,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": true,
                        "taskName": "Semester Final",
                        "gradedOnce": false,
                        "treeTraversalSeq": 1,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": true,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1313642118",
                        "termName": "Q4",
                        "termSeq": 4
                    },
                    "categories": [],
                    "children": [
                        {
                            "_id": "12157",
                            "personID": 12157,
                            "trialID": 1034,
                            "calendarID": 635,
                            "structureID": 635,
                            "courseID": 20384,
                            "courseName": "Chin 3",
                            "sectionID": 216143,
                            "taskID": 2,
                            "termID": 476,
                            "hasAssignments": false,
                            "hasCompositeTasks": false,
                            "taskName": "Quarter Grade",
                            "gradedOnce": false,
                            "treeTraversalSeq": 2,
                            "cumulativeTermSeq": 3,
                            "cumulativeTermName": "Q3",
                            "maxAssignments": 0,
                            "calcMethod": "nu",
                            "groupWeighted": false,
                            "usePercent": false,
                            "curveID": 300,
                            "calculationWeight": 100,
                            "calculationPercent": 1,
                            "hasDetail": false,
                            "_model": "PortalGradingTaskModel",
                            "_hashCode": "-1750262574",
                            "termName": "Q4",
                            "termSeq": 4
                        }
                    ]
                },
                {
                    "task": {
                        "_id": "12157",
                        "personID": 12157,
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20384,
                        "courseName": "Chin 3",
                        "sectionID": 216143,
                        "taskID": 2,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Quarter Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 2,
                        "cumulativeTermSeq": 3,
                        "cumulativeTermName": "Q3",
                        "maxAssignments": 0,
                        "calcMethod": "nu",
                        "groupWeighted": false,
                        "usePercent": false,
                        "curveID": 300,
                        "calculationWeight": 100,
                        "calculationPercent": 1,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "-1750262574",
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
                        "trialID": 1034,
                        "calendarID": 635,
                        "structureID": 635,
                        "courseID": 20384,
                        "courseName": "Chin 3",
                        "sectionID": 216143,
                        "taskID": 3,
                        "termID": 476,
                        "hasAssignments": false,
                        "hasCompositeTasks": false,
                        "taskName": "Mid-Term Grade",
                        "gradedOnce": false,
                        "treeTraversalSeq": 3,
                        "cumulativeTermSeq": 0,
                        "maxAssignments": 0,
                        "calcMethod": "no",
                        "groupWeighted": false,
                        "usePercent": false,
                        "hasDetail": false,
                        "_model": "PortalGradingTaskModel",
                        "_hashCode": "1094387622",
                        "termName": "Q4",
                        "termSeq": 4
                    },
                    "categories": [],
                    "children": null
                }
            ]
        }
    ];

    /* src\App.svelte generated by Svelte v3.44.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (37:1) {:else}
    function create_else_block(ctx) {
    	let div;
    	let editor;
    	let div_transition;
    	let current;

    	editor = new Editor({
    			props: { course: /*currentCourse*/ ctx[2] },
    			$$inline: true
    		});

    	editor.$on("message", /*message_handler*/ ctx[4]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(editor.$$.fragment);
    			add_location(div, file, 37, 2, 958);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(editor, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const editor_changes = {};
    			if (dirty & /*currentCourse*/ 4) editor_changes.course = /*currentCourse*/ ctx[2];
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
    		source: "(37:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (35:1) {#if currentPage == "Home"}
    function create_if_block(ctx) {
    	let div;
    	let home;
    	let div_transition;
    	let current;

    	home = new Home({
    			props: { classes: /*classes*/ ctx[0] },
    			$$inline: true
    		});

    	home.$on("message", /*openEditor*/ ctx[3]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(home.$$.fragment);
    			add_location(div, file, 35, 2, 861);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(home, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const home_changes = {};
    			if (dirty & /*classes*/ 1) home_changes.classes = /*classes*/ ctx[0];
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
    		source: "(35:1) {#if currentPage == \\\"Home\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let br;
    	let t0;
    	let article;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let nav;
    	let ul0;
    	let li0;
    	let small0;
    	let t3;
    	let ul1;
    	let li1;
    	let a0;
    	let small1;
    	let t5;
    	let li2;
    	let a1;
    	let small2;
    	let t7;
    	let li3;
    	let a2;
    	let small3;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentPage*/ ctx[1] == "Home") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			br = element("br");
    			t0 = space();
    			article = element("article");
    			if_block.c();
    			t1 = space();
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			small0 = element("small");
    			small0.textContent = "Infinite Campus Grade Predictor";
    			t3 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			a0 = element("a");
    			small1 = element("small");
    			small1.textContent = "About";
    			t5 = space();
    			li2 = element("li");
    			a1 = element("a");
    			small2 = element("small");
    			small2.textContent = "Help";
    			t7 = space();
    			li3 = element("li");
    			a2 = element("a");
    			small3 = element("small");
    			small3.textContent = "Contribute";
    			add_location(br, file, 31, 1, 809);
    			add_location(article, file, 33, 1, 818);
    			add_location(small0, file, 43, 7, 1114);
    			add_location(li0, file, 43, 3, 1110);
    			add_location(ul0, file, 42, 2, 1101);
    			add_location(small1, file, 46, 20, 1204);
    			attr_dev(a0, "href", "#/");
    			add_location(a0, file, 46, 7, 1191);
    			add_location(li1, file, 46, 3, 1187);
    			add_location(small2, file, 47, 20, 1255);
    			attr_dev(a1, "href", "#/");
    			add_location(a1, file, 47, 7, 1242);
    			add_location(li2, file, 47, 3, 1238);
    			add_location(small3, file, 48, 20, 1305);
    			attr_dev(a2, "href", "#/");
    			add_location(a2, file, 48, 7, 1292);
    			add_location(li3, file, 48, 3, 1288);
    			add_location(ul1, file, 45, 2, 1178);
    			add_location(nav, file, 41, 1, 1092);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 30, 0, 783);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, br);
    			append_dev(div, t0);
    			append_dev(div, article);
    			if_blocks[current_block_type_index].m(article, null);
    			append_dev(div, t1);
    			append_dev(div, nav);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, small0);
    			append_dev(nav, t3);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, a0);
    			append_dev(a0, small1);
    			append_dev(ul1, t5);
    			append_dev(ul1, li2);
    			append_dev(li2, a1);
    			append_dev(a1, small2);
    			append_dev(ul1, t7);
    			append_dev(ul1, li3);
    			append_dev(li3, a2);
    			append_dev(a2, small3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(article, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let classes = [];

    	chrome.runtime.onMessage.addListener((req, who, res) => {
    		if (req.m == "getGradeDetails") {
    			classes.push(req.data);
    			$$invalidate(0, classes);
    		} //currentCourse = classes[0]
    	});

    	window["getAllClasses"] = () => {
    		console.log(classes);
    	};

    	window["setClasses"] = cl => {
    		$$invalidate(0, classes = cl);
    	};

    	classes = x;
    	let currentPage = "Home";
    	let currentCourse;

    	function openEditor(event) {
    		$$invalidate(2, currentCourse = event.detail.data);
    		$$invalidate(1, currentPage = "Editor");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const message_handler = () => {
    		$$invalidate(1, currentPage = "Home");
    	};

    	$$self.$capture_state = () => ({
    		Home,
    		Editor,
    		slide,
    		classes,
    		x,
    		currentPage,
    		currentCourse,
    		openEditor
    	});

    	$$self.$inject_state = $$props => {
    		if ('classes' in $$props) $$invalidate(0, classes = $$props.classes);
    		if ('currentPage' in $$props) $$invalidate(1, currentPage = $$props.currentPage);
    		if ('currentCourse' in $$props) $$invalidate(2, currentCourse = $$props.currentCourse);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [classes, currentPage, currentCourse, openEditor, message_handler];
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
