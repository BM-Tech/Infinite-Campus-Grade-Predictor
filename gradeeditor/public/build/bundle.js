
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function append(target, node) {
        target.appendChild(node);
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
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
    	let nav;
    	let ul0;
    	let li0;
    	let p;
    	let strong;
    	let t0_value = /*cl*/ ctx[4].details[0].task.courseName + "";
    	let t0;
    	let t1;
    	let t2_value = getGradeFromClass(/*cl*/ ctx[4].details) + "";
    	let t2;
    	let t3;
    	let ul1;
    	let li1;
    	let button;
    	let t5;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*i*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			p = element("p");
    			strong = element("strong");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			button = element("button");
    			button.textContent = "Edit Grades";
    			t5 = space();
    			add_location(strong, file$2, 23, 15, 574);
    			add_location(p, file$2, 23, 12, 571);
    			add_location(li0, file$2, 22, 12, 553);
    			add_location(ul0, file$2, 22, 8, 549);
    			add_location(button, file$2, 27, 12, 723);
    			add_location(li1, file$2, 26, 12, 705);
    			add_location(ul1, file$2, 26, 8, 701);
    			add_location(nav, file$2, 21, 4, 534);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, p);
    			append_dev(p, strong);
    			append_dev(strong, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(nav, t3);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, button);
    			append_dev(nav, t5);

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
    			if (detaching) detach_dev(nav);
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

    /* src\Editor.svelte generated by Svelte v3.44.2 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$1 = "src\\Editor.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i][0];
    	child_ctx[7] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (56:12) {#each assignments as assignment}
    function create_each_block_1(ctx) {
    	let li2;
    	let nav;
    	let ul0;
    	let li0;
    	let t0_value = /*assignment*/ ctx[10].name + "";
    	let t0;
    	let t1;
    	let ul1;
    	let li1;
    	let div;
    	let input0;
    	let input0_value_value;
    	let t2;
    	let input1;
    	let input1_value_value;
    	let t3;

    	const block = {
    		c: function create() {
    			li2 = element("li");
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			div = element("div");
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			add_location(li0, file$1, 58, 28, 1686);
    			add_location(ul0, file$1, 58, 24, 1682);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "placeholder", "Score");
    			input0.value = input0_value_value = /*assignment*/ ctx[10].grade.score;
    			add_location(input0, file$1, 61, 32, 1833);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "placeholder", "Out of");
    			input1.value = input1_value_value = /*assignment*/ ctx[10].grade.outof;
    			add_location(input1, file$1, 62, 32, 1939);
    			attr_dev(div, "class", "grid");
    			add_location(div, file$1, 60, 28, 1781);
    			add_location(li1, file$1, 59, 28, 1747);
    			add_location(ul1, file$1, 59, 24, 1743);
    			add_location(nav, file$1, 57, 20, 1651);
    			add_location(li2, file$1, 56, 16, 1625);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li2, anchor);
    			append_dev(li2, nav);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, t0);
    			append_dev(nav, t1);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, div);
    			append_dev(div, input0);
    			append_dev(div, t2);
    			append_dev(div, input1);
    			append_dev(li2, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*categories*/ 2 && t0_value !== (t0_value = /*assignment*/ ctx[10].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*categories*/ 2 && input0_value_value !== (input0_value_value = /*assignment*/ ctx[10].grade.score)) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*categories*/ 2 && input1_value_value !== (input1_value_value = /*assignment*/ ctx[10].grade.outof)) {
    				prop_dev(input1, "value", input1_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(56:12) {#each assignments as assignment}",
    		ctx
    	});

    	return block;
    }

    // (52:0) {#each Object.entries(categories) as [categoryName, assignments]}
    function create_each_block(ctx) {
    	let details;
    	let summary;
    	let t0_value = /*categoryName*/ ctx[6] + "";
    	let t0;
    	let t1;
    	let ul;
    	let t2;
    	let each_value_1 = /*assignments*/ ctx[7];
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
    			add_location(summary, file$1, 53, 8, 1496);
    			attr_dev(ul, "class", "longlist");
    			add_location(ul, file$1, 54, 8, 1539);
    			add_location(details, file$1, 52, 4, 1477);
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
    			if (dirty & /*categories*/ 2 && t0_value !== (t0_value = /*categoryName*/ ctx[6] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*Object, categories*/ 2) {
    				each_value_1 = /*assignments*/ ctx[7];
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
    		source: "(52:0) {#each Object.entries(categories) as [categoryName, assignments]}",
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
    	let button0;
    	let t3;
    	let div;
    	let p0;
    	let strong0;
    	let t5;
    	let t6_value = /*getCurrentGrade*/ ctx[3]() + "";
    	let t6;
    	let t7;
    	let p1;
    	let strong1;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let button1;
    	let t14;
    	let hr;
    	let t15;
    	let each_1_anchor;
    	let mounted;
    	let dispose;
    	let each_value = Object.entries(/*categories*/ ctx[1]);
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
    			button0 = element("button");
    			button0.textContent = "Back";
    			t3 = space();
    			div = element("div");
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "Origional:";
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = space();
    			p1 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "New:";
    			t9 = space();
    			t10 = text(/*newGrade*/ ctx[4]);
    			t11 = text("%");
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "Add Final";
    			t14 = space();
    			hr = element("hr");
    			t15 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h3, file$1, 37, 12, 1043);
    			add_location(li0, file$1, 37, 8, 1039);
    			add_location(ul0, file$1, 36, 4, 1025);
    			add_location(button0, file$1, 40, 12, 1127);
    			add_location(li1, file$1, 40, 8, 1123);
    			add_location(ul1, file$1, 39, 4, 1109);
    			add_location(nav, file$1, 35, 0, 1014);
    			add_location(strong0, file$1, 45, 7, 1257);
    			add_location(p0, file$1, 45, 4, 1254);
    			add_location(strong1, file$1, 46, 7, 1318);
    			add_location(p1, file$1, 46, 4, 1315);
    			add_location(button1, file$1, 47, 4, 1362);
    			attr_dev(div, "class", "grid");
    			add_location(div, file$1, 44, 0, 1230);
    			add_location(hr, file$1, 50, 0, 1400);
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
    			append_dev(li1, button0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, strong0);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(div, t7);
    			append_dev(div, p1);
    			append_dev(p1, strong1);
    			append_dev(p1, t9);
    			append_dev(p1, t10);
    			append_dev(p1, t11);
    			append_dev(div, t12);
    			append_dev(div, button1);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t15, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*course*/ 1 && t0_value !== (t0_value = /*course*/ ctx[0].details[0].task.courseName + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*Object, categories*/ 2) {
    				each_value = Object.entries(/*categories*/ ctx[1]);
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
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t15);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			mounted = false;
    			dispose();
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
    	console.log(course);

    	function getCurrentGrade() {
    		let text = "";

    		for (let term of course.details) {
    			if (term.task.progressScore != undefined) {
    				text = term.task.progressScore + " (" + term.task.progressPercent + "%)";
    			}
    		}

    		return text;
    	}

    	let newGrade = 100;
    	let categories = {};

    	for (let term of course.details) {
    		for (let categroy of term.categories) {
    			categories[categroy.name] = [];

    			for (let assignment of categroy.assignments) {
    				categories[categroy.name].push({
    					name: assignment.assignmentName,
    					grade: {
    						score: assignment.scorePoints,
    						outof: assignment.totalPoints
    					}
    				});
    			}
    		}
    	}

    	const writable_props = ['course'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		dispatch('message', { m: "goHome" });
    	};

    	$$self.$$set = $$props => {
    		if ('course' in $$props) $$invalidate(0, course = $$props.course);
    	};

    	$$self.$capture_state = () => ({
    		course,
    		createEventDispatcher,
    		dispatch,
    		getCurrentGrade,
    		newGrade,
    		categories
    	});

    	$$self.$inject_state = $$props => {
    		if ('course' in $$props) $$invalidate(0, course = $$props.course);
    		if ('newGrade' in $$props) $$invalidate(4, newGrade = $$props.newGrade);
    		if ('categories' in $$props) $$invalidate(1, categories = $$props.categories);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*categories*/ 2) {
    			console.log(categories);
    		}
    	};

    	return [course, categories, dispatch, getCurrentGrade, newGrade, click_handler];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { course: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*course*/ ctx[0] === undefined && !('course' in props)) {
    			console_1.warn("<Editor> was created without expected prop 'course'");
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
    const file = "src\\App.svelte";

    // (31:2) {:else}
    function create_else_block(ctx) {
    	let editor;
    	let current;

    	editor = new Editor({
    			props: { course: /*currentCourse*/ ctx[2] },
    			$$inline: true
    		});

    	editor.$on("message", /*message_handler*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(editor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(editor, target, anchor);
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
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(editor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(31:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:2) {#if currentPage == "Home"}
    function create_if_block(ctx) {
    	let home;
    	let current;

    	home = new Home({
    			props: { classes: /*classes*/ ctx[0] },
    			$$inline: true
    		});

    	home.$on("message", /*openEditor*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
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
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(29:2) {#if currentPage == \\\"Home\\\"}",
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
    			add_location(br, file, 26, 1, 598);
    			add_location(article, file, 27, 1, 605);
    			add_location(small0, file, 37, 7, 850);
    			add_location(li0, file, 37, 3, 846);
    			add_location(ul0, file, 36, 2, 837);
    			add_location(small1, file, 40, 20, 940);
    			attr_dev(a0, "href", "#/");
    			add_location(a0, file, 40, 7, 927);
    			add_location(li1, file, 40, 3, 923);
    			add_location(small2, file, 41, 20, 991);
    			attr_dev(a1, "href", "#/");
    			add_location(a1, file, 41, 7, 978);
    			add_location(li2, file, 41, 3, 974);
    			add_location(small3, file, 42, 20, 1041);
    			attr_dev(a2, "href", "#/");
    			add_location(a2, file, 42, 7, 1028);
    			add_location(li3, file, 42, 3, 1024);
    			add_location(ul1, file, 39, 2, 914);
    			add_location(nav, file, 35, 1, 828);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 25, 0, 572);
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

    	chrome.tabs.create({
    		url: "https://fremontunifiedca.infinitecampus.org/campus/resources/portal/grades"
    	});

    	let classes = [];

    	chrome.runtime.onMessage.addListener((req, who, res) => {
    		if (req.m == "getGradeDetails") {
    			classes.push(req.data);
    			$$invalidate(0, classes);
    		} //currentCourse = classes[0]
    	});

    	let currentPage = "Home";
    	let currentCourse;

    	function openEditor(event) {
    		$$invalidate(2, currentCourse = event.detail.data);
    		$$invalidate(1, currentPage = "Editor");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const message_handler = () => {
    		$$invalidate(1, currentPage = "Home");
    	};

    	$$self.$capture_state = () => ({
    		Home,
    		Editor,
    		classes,
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
