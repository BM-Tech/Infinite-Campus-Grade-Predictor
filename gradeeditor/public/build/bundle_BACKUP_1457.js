
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    			add_location(strong, file$2, 22, 8, 613);
    			set_style(button, "padding", "5", 1);
    			add_location(button, file$2, 21, 4, 534);
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
            this.initialWeight = weight;
            this.name = name;
            this.assignments = [];
            this.equalWeighting = false;
        }

        addAssignment(assignment){
            this.assignments.push(assignment);
        }

        calculateGrade(equalWeighting){
            let total = new Grade(0, 0);
            for(let a of this.assignments){
                if(!isNaN(a.score) && !isNaN(a.outof)){
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

        getWeightedGrade(equalWeighting){
            let total = this.calculateGrade(equalWeighting);
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
            return (this.getPercent() * 100).toFixed(2)
    	}
    }

    class Assignment extends Grade{
        constructor(score, outof, name, origional){
            super(score, outof);
            this.name = name;
            this.origional = origional;
        }

        getOgGrade(){
            if(this.origional != undefined){
                if(this.origional == this.toString()){
                    return ""
                }
                return "(Origional: " + this.origional + "%)"
            }
            return "(New assignment)"
        }
    }

    /* src\Editor.svelte generated by Svelte v3.44.2 */

    const { Object: Object_1, console: console_1$1 } = globals;
    const file$1 = "src\\Editor.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	child_ctx[37] = list;
    	child_ctx[38] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	child_ctx[41] = list;
    	child_ctx[42] = i;
    	return child_ctx;
    }

    // (183:0) {#if issticky}
    function create_if_block_3(ctx) {
    	let div;
    	let p;
    	let strong0;
    	let t1;
    	let t2_value = /*getCurrentGrade*/ ctx[11]() + "";
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
    			add_location(strong0, file$1, 184, 11, 5781);
    			add_location(strong1, file$1, 184, 62, 5832);
    			add_location(p, file$1, 184, 8, 5778);
    			attr_dev(div, "class", "sticky");
    			add_location(div, file$1, 183, 4, 5748);
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
    		source: "(183:0) {#if issticky}",
    		ctx
    	});

    	return block;
    }

    // (208:12) {#each categories as cat}
    function create_each_block_3(ctx) {
    	let nav;
    	let ul0;
    	let li0;
    	let t0_value = /*cat*/ ctx[33].name + "";
    	let t0;
    	let t1;
    	let ul1;
    	let li1;
    	let label;
    	let input;
    	let t2;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[22].call(input, /*cat*/ ctx[33]);
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
    			add_location(li0, file$1, 210, 24, 6803);
    			add_location(ul0, file$1, 209, 20, 6773);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "name", "switch");
    			attr_dev(input, "id", "switch");
    			attr_dev(input, "role", "switch");
    			add_location(input, file$1, 214, 28, 6955);
    			attr_dev(label, "for", "switch");
    			add_location(label, file$1, 213, 28, 6905);
    			add_location(li1, file$1, 213, 24, 6901);
    			add_location(ul1, file$1, 212, 20, 6871);
    			set_style(nav, "width", "100%");
    			add_location(nav, file$1, 208, 16, 6727);
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
    			input.checked = /*courseSettings*/ ctx[4].equalWeighting[/*cat*/ ctx[33].name];
    			append_dev(nav, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*categories*/ 4 && t0_value !== (t0_value = /*cat*/ ctx[33].name + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*courseSettings, categories*/ 20) {
    				input.checked = /*courseSettings*/ ctx[4].equalWeighting[/*cat*/ ctx[33].name];
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
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(208:12) {#each categories as cat}",
    		ctx
    	});

    	return block;
    }

    // (234:0) {#if showAreas.newAssig}
    function create_if_block_2$1(ctx) {
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
    			add_location(input0, file$1, 238, 20, 7764);
    			attr_dev(label0, "for", "aName");
    			add_location(label0, file$1, 237, 16, 7708);
    			attr_dev(select, "name", "aCat");
    			select.required = true;
    			if (/*newAssig*/ ctx[6]["catName"] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[25].call(select));
    			add_location(select, file$1, 242, 20, 7917);
    			attr_dev(label1, "for", "aCat");
    			add_location(label1, file$1, 241, 16, 7869);
    			attr_dev(div0, "class", "grid");
    			add_location(div0, file$1, 236, 12, 7672);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "name", "aScore");
    			input1.required = true;
    			add_location(input1, file$1, 252, 20, 8313);
    			attr_dev(label2, "for", "aScore");
    			add_location(label2, file$1, 251, 16, 8266);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "name", "aOutOf");
    			input2.required = true;
    			add_location(input2, file$1, 255, 20, 8477);
    			attr_dev(label3, "for", "aOutOf");
    			add_location(label3, file$1, 254, 16, 8429);
    			attr_dev(div1, "class", "grid");
    			add_location(div1, file$1, 250, 12, 8230);
    			attr_dev(input3, "type", "submit");
    			input3.value = "Add";
    			add_location(input3, file$1, 259, 12, 8611);
    			attr_dev(form, "action", "#");
    			add_location(form, file$1, 235, 8, 7597);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 234, 4, 7545);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, form);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(label0, t0);
    			append_dev(label0, input0);
    			set_input_value(input0, /*newAssig*/ ctx[6].name);
    			append_dev(div0, t1);
    			append_dev(div0, label1);
    			append_dev(label1, t2);
    			append_dev(label1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*newAssig*/ ctx[6]["catName"]);
    			append_dev(form, t3);
    			append_dev(form, div1);
    			append_dev(div1, label2);
    			append_dev(label2, t4);
    			append_dev(label2, input1);
    			set_input_value(input1, /*newAssig*/ ctx[6].score);
    			append_dev(div1, t5);
    			append_dev(div1, label3);
    			append_dev(label3, t6);
    			append_dev(label3, input2);
    			set_input_value(input2, /*newAssig*/ ctx[6].outof);
    			append_dev(form, t7);
    			append_dev(form, input3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[24]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[25]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[26]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[27]),
    					listen_dev(form, "submit", prevent_default(/*submitAssignment*/ ctx[14]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newAssig, categories*/ 68 && input0.value !== /*newAssig*/ ctx[6].name) {
    				set_input_value(input0, /*newAssig*/ ctx[6].name);
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

    			if (dirty[0] & /*newAssig, categories*/ 68) {
    				select_option(select, /*newAssig*/ ctx[6]["catName"]);
    			}

    			if (dirty[0] & /*newAssig, categories*/ 68 && to_number(input1.value) !== /*newAssig*/ ctx[6].score) {
    				set_input_value(input1, /*newAssig*/ ctx[6].score);
    			}

    			if (dirty[0] & /*newAssig, categories*/ 68 && to_number(input2.value) !== /*newAssig*/ ctx[6].outof) {
    				set_input_value(input2, /*newAssig*/ ctx[6].outof);
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(234:0) {#if showAreas.newAssig}",
    		ctx
    	});

    	return block;
    }

    // (244:24) {#each categories as cat}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*cat*/ ctx[33].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*cat*/ ctx[33].name;
    			option.value = option.__value;
    			add_location(option, file$1, 244, 28, 8060);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*categories*/ 4 && t_value !== (t_value = /*cat*/ ctx[33].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*categories*/ 4 && option_value_value !== (option_value_value = /*cat*/ ctx[33].name)) {
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
    		source: "(244:24) {#each categories as cat}",
    		ctx
    	});

    	return block;
    }

    // (266:0) {#if showAreas.newCategory}
    function create_if_block_1$1(ctx) {
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
    			add_location(input0, file$1, 270, 20, 8964);
    			attr_dev(label0, "for", "cName");
    			add_location(label0, file$1, 269, 16, 8910);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "100");
    			attr_dev(input1, "name", "cWeight");
    			input1.required = true;
    			add_location(input1, file$1, 273, 20, 9132);
    			attr_dev(label1, "for", "cWeight");
    			add_location(label1, file$1, 272, 16, 9079);
    			attr_dev(div, "class", "grid");
    			add_location(div, file$1, 268, 12, 8874);
    			attr_dev(input2, "type", "submit");
    			input2.value = "Add";
    			add_location(input2, file$1, 276, 12, 9287);
    			attr_dev(form, "action", "#");
    			add_location(form, file$1, 267, 8, 8801);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 266, 4, 8749);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, form);
    			append_dev(form, div);
    			append_dev(div, label0);
    			append_dev(label0, t0);
    			append_dev(label0, input0);
    			set_input_value(input0, /*newCategory*/ ctx[7].name);
    			append_dev(div, t1);
    			append_dev(div, label1);
    			append_dev(label1, t2);
    			append_dev(label1, input1);
    			set_input_value(input1, /*newCategory*/ ctx[7].weight);
    			append_dev(form, t3);
    			append_dev(form, input2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[28]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[29]),
    					listen_dev(form, "submit", prevent_default(/*submitCategory*/ ctx[15]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*newCategory*/ 128 && input0.value !== /*newCategory*/ ctx[7].name) {
    				set_input_value(input0, /*newCategory*/ ctx[7].name);
    			}

    			if (dirty[0] & /*newCategory*/ 128 && to_number(input1.value) !== /*newCategory*/ ctx[7].weight) {
    				set_input_value(input1, /*newCategory*/ ctx[7].weight);
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(266:0) {#if showAreas.newCategory}",
    		ctx
    	});

    	return block;
    }

    // (283:0) {#if showAreas.showGraph}
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
    			add_location(p, file$1, 284, 8, 9463);
    			attr_dev(article, "class", "subcard");
    			add_location(article, file$1, 283, 4, 9411);
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
    		source: "(283:0) {#if showAreas.showGraph}",
    		ctx
    	});

    	return block;
    }

    // (295:12) {#each cat.assignments as assig}
    function create_each_block_1(ctx) {
    	let li2;
    	let nav;
    	let ul0;
    	let li0;
    	let t0_value = /*assig*/ ctx[36].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*assig*/ ctx[36].toString() + "";
    	let t2;
    	let t3;
    	let t4_value = /*assig*/ ctx[36].getOgGrade() + "";
    	let t4;
    	let t5;
    	let a;
    	let t7;
    	let ul1;
    	let li1;
    	let div;
    	let input0;
    	let t8;
    	let input1;
    	let t9;
    	let mounted;
    	let dispose;

    	function input0_input_handler_2() {
    		/*input0_input_handler_2*/ ctx[30].call(input0, /*each_value_1*/ ctx[37], /*assig_index*/ ctx[38]);
    	}

    	function input1_input_handler_2() {
    		/*input1_input_handler_2*/ ctx[31].call(input1, /*each_value_1*/ ctx[37], /*assig_index*/ ctx[38]);
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
    			t5 = space();
    			a = element("a");
    			a.textContent = "delete";
    			t7 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			div = element("div");
    			input0 = element("input");
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			attr_dev(a, "href", "/");
    			add_location(a, file$1, 300, 24, 9956);
    			add_location(li0, file$1, 297, 24, 9821);
    			add_location(ul0, file$1, 297, 20, 9817);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "placeholder", "Score");
    			add_location(input0, file$1, 304, 28, 10169);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "placeholder", "Out Of");
    			add_location(input1, file$1, 305, 28, 10265);
    			attr_dev(div, "class", "grid");
    			add_location(div, file$1, 303, 24, 10121);
    			add_location(li1, file$1, 302, 24, 10091);
    			add_location(ul1, file$1, 302, 20, 10087);
    			add_location(nav, file$1, 296, 20, 9790);
    			add_location(li2, file$1, 296, 16, 9786);
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
    			append_dev(li0, a);
    			append_dev(nav, t7);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, div);
    			append_dev(div, input0);
    			set_input_value(input0, /*assig*/ ctx[36].score);
    			append_dev(div, t8);
    			append_dev(div, input1);
    			set_input_value(input1, /*assig*/ ctx[36].outof);
    			append_dev(nav, t9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						a,
    						"click",
    						prevent_default(function () {
    							if (is_function(/*deleteAssignment*/ ctx[13](/*cat*/ ctx[33], /*assig*/ ctx[36]))) /*deleteAssignment*/ ctx[13](/*cat*/ ctx[33], /*assig*/ ctx[36]).apply(this, arguments);
    						}),
    						false,
    						true,
    						false
    					),
    					listen_dev(input0, "input", input0_input_handler_2),
    					listen_dev(input1, "input", input1_input_handler_2)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*categories*/ 4 && t0_value !== (t0_value = /*assig*/ ctx[36].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*categories*/ 4 && t2_value !== (t2_value = /*assig*/ ctx[36].toString() + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*categories*/ 4 && t4_value !== (t4_value = /*assig*/ ctx[36].getOgGrade() + "")) set_data_dev(t4, t4_value);

    			if (dirty[0] & /*categories*/ 4 && to_number(input0.value) !== /*assig*/ ctx[36].score) {
    				set_input_value(input0, /*assig*/ ctx[36].score);
    			}

    			if (dirty[0] & /*categories*/ 4 && to_number(input1.value) !== /*assig*/ ctx[36].outof) {
    				set_input_value(input1, /*assig*/ ctx[36].outof);
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
    		source: "(295:12) {#each cat.assignments as assig}",
    		ctx
    	});

    	return block;
    }

    // (291:0) {#each categories as cat}
    function create_each_block(ctx) {
    	let details;
    	let summary;
    	let t0_value = /*cat*/ ctx[33].toString() + "";
    	let t0;
    	let t1;
    	let ul;
    	let t2;
    	let each_value_1 = /*cat*/ ctx[33].assignments;
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
    			add_location(summary, file$1, 292, 8, 9603);
    			attr_dev(ul, "class", "longlist");
    			add_location(ul, file$1, 293, 8, 9648);
    			add_location(details, file$1, 291, 4, 9584);
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
    			if (dirty[0] & /*categories*/ 4 && t0_value !== (t0_value = /*cat*/ ctx[33].toString() + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*categories, deleteAssignment*/ 8196) {
    				each_value_1 = /*cat*/ ctx[33].assignments;
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
    		source: "(291:0) {#each categories as cat}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let nav;
    	let ul0;
    	let li0;
    	let h30;
    	let t0_value = /*course*/ ctx[0].details[0].task.courseName + "";
    	let t0;
    	let t1;
    	let ul1;
    	let li1;
    	let a0;
    	let strong0;
    	let t3;
    	let div0;
    	let p0;
    	let strong1;
    	let t5;
    	let t6_value = /*getCurrentGrade*/ ctx[11]() + "";
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
    	let small;
    	let a1;
    	let t19;
    	let dialog;
    	let article;
    	let a2;
    	let t20;
    	let h31;
    	let t22;
    	let div2;
    	let h4;
    	let t24;
    	let p1;
    	let t26;
    	let t27;
    	let footer;
    	let a3;
    	let t29;
    	let t30;
    	let t31;
    	let t32;
    	let hr;
    	let t33;
    	let each1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*issticky*/ ctx[8] && create_if_block_3(ctx);
    	let each_value_3 = /*categories*/ ctx[2];
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let if_block1 = /*showAreas*/ ctx[5].newAssig && create_if_block_2$1(ctx);
    	let if_block2 = /*showAreas*/ ctx[5].newCategory && create_if_block_1$1(ctx);
    	let if_block3 = /*showAreas*/ ctx[5].showGraph && create_if_block$1(ctx);
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
    			h30 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			a0 = element("a");
    			strong0 = element("strong");
    			strong0.textContent = "Back";
    			t3 = space();
    			div0 = element("div");
    			p0 = element("p");
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
    			button1.textContent = "New Category";
    			t17 = space();
    			small = element("small");
    			a1 = element("a");
    			a1.textContent = "Settings";
    			t19 = space();
    			dialog = element("dialog");
    			article = element("article");
    			a2 = element("a");
    			t20 = space();
    			h31 = element("h3");
    			h31.textContent = "Settings";
    			t22 = space();
    			div2 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Equal Weighting";
    			t24 = space();
    			p1 = element("p");
    			p1.textContent = "Categories with this enabled will have all assignments weighted the same.";
    			t26 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t27 = space();
    			footer = element("footer");
    			a3 = element("a");
    			a3.textContent = "Close";
    			t29 = space();
    			if (if_block1) if_block1.c();
    			t30 = space();
    			if (if_block2) if_block2.c();
    			t31 = space();
    			if (if_block3) if_block3.c();
    			t32 = space();
    			hr = element("hr");
    			t33 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each1_anchor = empty();
    			add_location(h30, file$1, 170, 12, 5336);
    			add_location(li0, file$1, 170, 8, 5332);
    			add_location(ul0, file$1, 169, 4, 5318);
    			add_location(strong0, file$1, 173, 79, 5487);
    			attr_dev(a0, "href", "#/");
    			add_location(a0, file$1, 173, 12, 5420);
    			add_location(li1, file$1, 173, 8, 5416);
    			add_location(ul1, file$1, 172, 4, 5402);
    			add_location(nav, file$1, 168, 0, 5307);
    			add_location(strong1, file$1, 179, 7, 5610);
    			add_location(strong2, file$1, 179, 58, 5661);
    			add_location(p0, file$1, 179, 4, 5607);
    			add_location(div0, file$1, 178, 0, 5577);
    			add_location(button0, file$1, 190, 4, 5964);
    			add_location(button1, file$1, 191, 4, 6043);
    			attr_dev(div1, "class", "grid");
    			add_location(div1, file$1, 189, 0, 5940);
    			attr_dev(a1, "href", "#");
    			add_location(a1, file$1, 194, 7, 6219);
    			add_location(small, file$1, 194, 0, 6212);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "aria-label", "Close");
    			add_location(a2, file$1, 199, 8, 6391);
    			add_location(h31, file$1, 203, 8, 6506);
    			add_location(h4, file$1, 205, 12, 6552);
    			add_location(p1, file$1, 206, 12, 6590);
    			add_location(div2, file$1, 204, 8, 6533);
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "role", "button");
    			attr_dev(a3, "class", "secondary");
    			add_location(a3, file$1, 222, 12, 7265);
    			add_location(footer, file$1, 221, 8, 7243);
    			set_style(article, "margin-top", "200px");
    			add_location(article, file$1, 198, 4, 6345);
    			dialog.open = /*dialogOpen*/ ctx[3];
    			add_location(dialog, file$1, 197, 0, 6313);
    			add_location(hr, file$1, 289, 0, 9547);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, h30);
    			append_dev(h30, t0);
    			append_dev(nav, t1);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, a0);
    			append_dev(a0, strong0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, p0);
    			append_dev(p0, strong1);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(p0, t7);
    			append_dev(p0, strong2);
    			append_dev(p0, t9);
    			append_dev(p0, t10);
    			append_dev(p0, t11);
    			/*div0_binding*/ ctx[17](div0);
    			insert_dev(target, t12, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(div1, t15);
    			append_dev(div1, button1);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, small, anchor);
    			append_dev(small, a1);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, dialog, anchor);
    			append_dev(dialog, article);
    			append_dev(article, a2);
    			append_dev(article, t20);
    			append_dev(article, h31);
    			append_dev(article, t22);
    			append_dev(article, div2);
    			append_dev(div2, h4);
    			append_dev(div2, t24);
    			append_dev(div2, p1);
    			append_dev(div2, t26);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div2, null);
    			}

    			append_dev(article, t27);
    			append_dev(article, footer);
    			append_dev(footer, a3);
    			insert_dev(target, t29, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t30, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t31, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t32, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t33, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[16], false, false, false),
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[18], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[19], false, false, false),
    					listen_dev(a1, "click", /*click_handler_3*/ ctx[20], false, false, false),
    					listen_dev(a2, "click", /*click_handler_4*/ ctx[21], false, false, false),
    					listen_dev(a3, "click", /*click_handler_5*/ ctx[23], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*course*/ 1) && t0_value !== (t0_value = /*course*/ ctx[0].details[0].task.courseName + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty[0] & /*newGrade*/ 2) && t10_value !== (t10_value = (/*newGrade*/ ctx[1] * 100).toFixed(2) + "")) set_data_dev(t10, t10_value);

    			if (/*issticky*/ ctx[8]) {
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

    			if (dirty[0] & /*courseSettings, categories*/ 20) {
    				each_value_3 = /*categories*/ ctx[2];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (!current || dirty[0] & /*dialogOpen*/ 8) {
    				prop_dev(dialog, "open", /*dialogOpen*/ ctx[3]);
    			}

    			if (/*showAreas*/ ctx[5].newAssig) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*showAreas*/ 32) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t30.parentNode, t30);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*showAreas*/ ctx[5].newCategory) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*showAreas*/ 32) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t31.parentNode, t31);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*showAreas*/ ctx[5].showGraph) {
    				if (if_block3) {
    					if (dirty[0] & /*showAreas*/ 32) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t32.parentNode, t32);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*categories, deleteAssignment*/ 8196) {
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
    						each_blocks[i].m(each1_anchor.parentNode, each1_anchor);
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
    			/*div0_binding*/ ctx[17](null);
    			if (detaching) detach_dev(t12);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(small);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(dialog);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t29);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t30);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t31);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t32);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t33);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each1_anchor);
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
    			// If category is already in the array, it was already created from a previous term
    			// In this case, add following assignments to the existing Category object
    			let currentCategory = new Category(category.weight, category.name);

    			let existance = currentCategory.alreadyExists(categories);

    			if (existance.true) {
    				currentCategory = categories[existance.in];
    			}

    			// Add assignments to category
    			for (let assignment of category.assignments) {
    				currentCategory.addAssignment(new Assignment(parseFloat(assignment.scorePoints) * assignment.multiplier, assignment.totalPoints * assignment.multiplier, assignment.assignmentName, (assignment.scorePoints * assignment.multiplier / (assignment.totalPoints * assignment.multiplier) * 100).toFixed(2)));
    			}

    			if (!existance.true) categories.push(currentCategory);
    		}
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
    		showGraph: false
    	};

    	function toggleArea(area) {
    		for (let a of Object.keys(showAreas)) {
    			if (a != area || showAreas[area] == true) $$invalidate(5, showAreas[a] = false, showAreas); else $$invalidate(5, showAreas[area] = true, showAreas);
    		}
    	}

    	function deleteAssignment(cat, assig) {
    		let i = categories.indexOf(cat);
    		let a = categories[i].assignments.indexOf(assig);
    		if (a > -1) categories[i].assignments.splice(a, 1);
    		$$invalidate(2, categories);
    	}

    	// New assignment on submit
    	let newAssig = new Assignment(10, 10, "");

    	function submitAssignment() {
    		for (let cat of categories) {
    			if (cat.name == newAssig["catName"]) {
    				let c = copy(newAssig);
    				let t = new Assignment(c.score, c.outof, c.name);
    				categories[categories.indexOf(cat)].addAssignment(t);
    				console.log(t.toString());
    				$$invalidate(6, newAssig = new Assignment(10, 10, ""));
    				$$invalidate(2, categories);
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
    		$$invalidate(2, categories);
    	}

    	// Activate sticky grade div when scrolled past
    	let issticky = false;

    	let sticky;

    	document.addEventListener('scroll', () => {
    		try {
    			if (window.pageYOffset > sticky.offsetTop) {
    				$$invalidate(8, issticky = true);
    			} else {
    				$$invalidate(8, issticky = false);
    			}
    		} catch(e) {
    			
    		}
    	});

    	let dialogOpen = false;
    	let courseSettings = { equalWeighting: {} };
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
    			$$invalidate(9, sticky);
    		});
    	}

    	const click_handler_1 = () => {
    		toggleArea("newAssig");
    	};

    	const click_handler_2 = () => {
    		toggleArea("newCategory");
    	};

    	const click_handler_3 = () => {
    		$$invalidate(3, dialogOpen = true);
    	};

    	const click_handler_4 = () => {
    		$$invalidate(3, dialogOpen = false);
    	};

    	function input_change_handler(cat) {
    		courseSettings.equalWeighting[cat.name] = this.checked;
    		$$invalidate(4, courseSettings);
    		$$invalidate(2, categories);
    	}

    	const click_handler_5 = () => {
    		$$invalidate(3, dialogOpen = false);
    	};

    	function input0_input_handler() {
    		newAssig.name = this.value;
    		$$invalidate(6, newAssig);
    		$$invalidate(2, categories);
    	}

    	function select_change_handler() {
    		newAssig["catName"] = select_value(this);
    		$$invalidate(6, newAssig);
    		$$invalidate(2, categories);
    	}

    	function input1_input_handler() {
    		newAssig.score = to_number(this.value);
    		$$invalidate(6, newAssig);
    		$$invalidate(2, categories);
    	}

    	function input2_input_handler() {
    		newAssig.outof = to_number(this.value);
    		$$invalidate(6, newAssig);
    		$$invalidate(2, categories);
    	}

    	function input0_input_handler_1() {
    		newCategory.name = this.value;
    		$$invalidate(7, newCategory);
    	}

    	function input1_input_handler_1() {
    		newCategory.weight = to_number(this.value);
    		$$invalidate(7, newCategory);
    	}

    	function input0_input_handler_2(each_value_1, assig_index) {
    		each_value_1[assig_index].score = to_number(this.value);
    		$$invalidate(2, categories);
    	}

    	function input1_input_handler_2(each_value_1, assig_index) {
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
    		copy,
    		newAssig,
    		submitAssignment,
    		newCategory,
    		submitCategory,
    		issticky,
    		sticky,
    		dialogOpen,
    		courseSettings
    	});

    	$$self.$inject_state = $$props => {
    		if ('course' in $$props) $$invalidate(0, course = $$props.course);
    		if ('newGrade' in $$props) $$invalidate(1, newGrade = $$props.newGrade);
    		if ('categories' in $$props) $$invalidate(2, categories = $$props.categories);
    		if ('showAreas' in $$props) $$invalidate(5, showAreas = $$props.showAreas);
    		if ('newAssig' in $$props) $$invalidate(6, newAssig = $$props.newAssig);
    		if ('newCategory' in $$props) $$invalidate(7, newCategory = $$props.newCategory);
    		if ('issticky' in $$props) $$invalidate(8, issticky = $$props.issticky);
    		if ('sticky' in $$props) $$invalidate(9, sticky = $$props.sticky);
    		if ('dialogOpen' in $$props) $$invalidate(3, dialogOpen = $$props.dialogOpen);
    		if ('courseSettings' in $$props) $$invalidate(4, courseSettings = $$props.courseSettings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*categories, courseSettings, newGrade*/ 22) {
    			// On change, update new grade with sum of weighted categories
    			{
    				$$invalidate(1, newGrade = 0);
    				let renormalize = false;
    				let subtractThisWeight = 0;

    				for (let cat of categories) {
    					let wieghtEqually = courseSettings.equalWeighting[cat.name];
    					if (wieghtEqually == null) wieghtEqually = false;
    					let wg = cat.getWeightedGrade(wieghtEqually);

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

    				(($$invalidate(1, newGrade), $$invalidate(2, categories)), $$invalidate(4, courseSettings));
    			}
    		}

    		if ($$self.$$.dirty[0] & /*dialogOpen*/ 8) {
    			{
    				if (dialogOpen) {
    					document.querySelector("body").style.overflow = "hidden";
    				} else {
    					document.querySelector("body").style.overflow = "auto";
    				}
    			}
    		}
    	};

    	return [
    		course,
    		newGrade,
    		categories,
    		dialogOpen,
    		courseSettings,
    		showAreas,
    		newAssig,
    		newCategory,
    		issticky,
    		sticky,
    		dispatch,
    		getCurrentGrade,
    		toggleArea,
    		deleteAssignment,
    		submitAssignment,
    		submitCategory,
    		click_handler,
    		div0_binding,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		input_change_handler,
    		click_handler_5,
    		input0_input_handler,
    		select_change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		input0_input_handler_2,
    		input1_input_handler_2
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

    /* src\App.svelte generated by Svelte v3.44.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (58:36) 
    function create_if_block_2(ctx) {
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
    			add_location(strong, file, 58, 6, 1483);
    			add_location(p0, file, 58, 3, 1480);
    			attr_dev(a, "href", /*icURL*/ ctx[1]);
    			add_location(a, file, 59, 14, 1541);
    			add_location(p1, file, 59, 3, 1530);
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(58:36) ",
    		ctx
    	});

    	return block;
    }

    // (56:2) {#if loadingState == "loading"}
    function create_if_block_1(ctx) {
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
    			add_location(a, file, 56, 3, 1375);
    			add_location(br, file, 56, 61, 1433);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(56:2) {#if loadingState == \\\"loading\\\"}",
    		ctx
    	});

    	return block;
    }

    // (65:2) {:else}
    function create_else_block(ctx) {
    	let div;
    	let editor;
    	let div_transition;
    	let current;

    	editor = new Editor({
    			props: { course: /*currentCourse*/ ctx[4] },
    			$$inline: true
    		});

    	editor.$on("message", /*message_handler*/ ctx[6]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(editor.$$.fragment);
    			add_location(div, file, 65, 3, 1737);
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
    		source: "(65:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (63:2) {#if currentPage == "Home"}
    function create_if_block(ctx) {
    	let div;
    	let home;
    	let div_transition;
    	let current;

    	home = new Home({
    			props: { classes: /*classes*/ ctx[2] },
    			$$inline: true
    		});

    	home.$on("message", /*openEditor*/ ctx[5]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(home.$$.fragment);
    			add_location(div, file, 63, 3, 1638);
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
    		source: "(63:2) {#if currentPage == \\\"Home\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let br;
    	let t0;
    	let article;
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
    		if (/*loadingState*/ ctx[0] == "loading") return create_if_block_1;
    		if (/*loadingState*/ ctx[0] == "error") return create_if_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*currentPage*/ ctx[3] == "Home") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			br = element("br");
    			t0 = space();
    			article = element("article");
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
<<<<<<< HEAD
    			add_location(br, file, 48, 1, 1267);
    			add_location(article, file, 50, 1, 1276);
    			add_location(small0, file, 67, 7, 1844);
    			add_location(li0, file, 67, 3, 1840);
    			add_location(ul0, file, 66, 2, 1831);
    			add_location(small1, file, 70, 78, 1992);
    			attr_dev(a0, "href", "https://benman604.github.io/Infinite-Campus-Grade-Predictor/");
    			add_location(a0, file, 70, 7, 1921);
    			add_location(li1, file, 70, 3, 1917);
    			add_location(small2, file, 71, 78, 2101);
    			attr_dev(a1, "href", "https://github.com/benman604/Infinite-Campus-Grade-Predictor");
    			add_location(a1, file, 71, 7, 2030);
    			add_location(li2, file, 71, 3, 2026);
    			add_location(ul1, file, 69, 2, 1908);
    			add_location(nav, file, 65, 1, 1822);
=======
    			add_location(br, file, 52, 1, 1317);
    			add_location(article, file, 54, 1, 1326);
    			add_location(small0, file, 71, 7, 1894);
    			add_location(li0, file, 71, 3, 1890);
    			add_location(ul0, file, 70, 2, 1881);
    			add_location(small1, file, 74, 20, 1984);
    			attr_dev(a0, "href", "#/");
    			add_location(a0, file, 74, 7, 1971);
    			add_location(li1, file, 74, 3, 1967);
    			add_location(small2, file, 75, 78, 2093);
    			attr_dev(a1, "href", "https://github.com/benman604/Infinite-Campus-Grade-Predictor");
    			add_location(a1, file, 75, 7, 2022);
    			add_location(li2, file, 75, 3, 2018);
    			add_location(ul1, file, 73, 2, 1958);
    			add_location(nav, file, 69, 1, 1872);
>>>>>>> 6ccb97608299bcb4e6905062862bd4515c69368f
    			attr_dev(div, "class", "container");
    			add_location(div, file, 51, 0, 1291);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, br);
    			append_dev(div, t0);
    			append_dev(div, article);
    			if (if_block0) if_block0.m(article, null);
    			append_dev(article, t1);
    			if_blocks[current_block_type_index].m(article, null);
    			append_dev(div, t2);
    			append_dev(div, nav);
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
    					if_block0.m(article, t1);
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
    				if_block1.m(article, null);
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
    			if (detaching) detach_dev(div);

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
    				console.error(req.data);
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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const message_handler = () => {
    		$$invalidate(3, currentPage = "Home");
    	};

    	$$self.$capture_state = () => ({
    		Home,
    		Editor,
    		slide,
    		loadingState,
    		icURL,
    		classes,
    		currentPage,
    		currentCourse,
    		openEditor
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
    		message_handler
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
