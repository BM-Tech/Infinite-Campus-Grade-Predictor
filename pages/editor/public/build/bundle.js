
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

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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

    /* src\App.svelte generated by Svelte v3.44.2 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (92:5) {#each data.categories as category}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*category*/ ctx[15].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*category*/ ctx[15].name;
    			option.value = option.__value;
    			add_location(option, file, 92, 6, 2241);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*category*/ ctx[15].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && option_value_value !== (option_value_value = /*category*/ ctx[15].name)) {
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
    		source: "(92:5) {#each data.categories as category}",
    		ctx
    	});

    	return block;
    }

    // (115:4) {#if modifications[category.name] != null}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*modifications*/ ctx[1][/*category*/ ctx[15].name];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*modifications, data*/ 3) {
    				each_value_1 = /*modifications*/ ctx[1][/*category*/ ctx[15].name];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(115:4) {#if modifications[category.name] != null}",
    		ctx
    	});

    	return block;
    }

    // (116:5) {#each modifications[category.name] as mod}
    function create_each_block_1(ctx) {
    	let small1;
    	let i;
    	let ins;
    	let t0_value = /*mod*/ ctx[18].type + "";
    	let t0;
    	let t1;
    	let t2_value = /*mod*/ ctx[18].name + "";
    	let t2;
    	let t3;
    	let small0;
    	let a0;
    	let t5;
    	let a1;
    	let t7;
    	let small2;
    	let t9;
    	let br;

    	const block = {
    		c: function create() {
    			small1 = element("small");
    			i = element("i");
    			ins = element("ins");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			small0 = element("small");
    			a0 = element("a");
    			a0.textContent = "Edit";
    			t5 = space();
    			a1 = element("a");
    			a1.textContent = "Delete";
    			t7 = space();
    			small2 = element("small");
    			small2.textContent = "100%";
    			t9 = space();
    			br = element("br");
    			add_location(ins, file, 117, 10, 3147);
    			add_location(i, file, 117, 7, 3144);
    			attr_dev(a0, "href", "#d");
    			add_location(a0, file, 120, 8, 3215);
    			attr_dev(a1, "href", "#d");
    			add_location(a1, file, 121, 8, 3245);
    			add_location(small0, file, 119, 7, 3199);
    			add_location(small1, file, 116, 6, 3129);
    			set_style(small2, "float", "right");
    			add_location(small2, file, 124, 6, 3306);
    			add_location(br, file, 125, 6, 3354);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small1, anchor);
    			append_dev(small1, i);
    			append_dev(i, ins);
    			append_dev(ins, t0);
    			append_dev(small1, t1);
    			append_dev(small1, t2);
    			append_dev(small1, t3);
    			append_dev(small1, small0);
    			append_dev(small0, a0);
    			append_dev(small0, t5);
    			append_dev(small0, a1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, small2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*modifications, data*/ 3 && t0_value !== (t0_value = /*mod*/ ctx[18].type + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*modifications, data*/ 3 && t2_value !== (t2_value = /*mod*/ ctx[18].name + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(small2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(116:5) {#each modifications[category.name] as mod}",
    		ctx
    	});

    	return block;
    }

    // (110:3) {#each data.categories as category}
    function create_each_block(ctx) {
    	let hr;
    	let t0;
    	let strong0;
    	let t1_value = /*category*/ ctx[15].name + "";
    	let t1;
    	let t2;
    	let t3_value = /*category*/ ctx[15].weight + "";
    	let t3;
    	let t4;
    	let t5;
    	let strong1;
    	let t6_value = percent(/*category*/ ctx[15].score) + "";
    	let t6;
    	let t7;
    	let t8_value = /*category*/ ctx[15].score.val + "";
    	let t8;
    	let t9;
    	let t10_value = /*category*/ ctx[15].score.outOf + "";
    	let t10;
    	let t11;
    	let t12;
    	let br;
    	let t13;
    	let if_block_anchor;
    	let if_block = /*modifications*/ ctx[1][/*category*/ ctx[15].name] != null && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t0 = space();
    			strong0 = element("strong");
    			t1 = text(t1_value);
    			t2 = text(" (Weight: ");
    			t3 = text(t3_value);
    			t4 = text("%)");
    			t5 = space();
    			strong1 = element("strong");
    			t6 = text(t6_value);
    			t7 = text("% (");
    			t8 = text(t8_value);
    			t9 = text("/");
    			t10 = text(t10_value);
    			t11 = text(")");
    			t12 = space();
    			br = element("br");
    			t13 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(hr, file, 110, 4, 2831);
    			add_location(strong0, file, 111, 4, 2840);
    			set_style(strong1, "float", "right");
    			add_location(strong1, file, 112, 4, 2906);
    			add_location(br, file, 113, 4, 3022);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, strong0, anchor);
    			append_dev(strong0, t1);
    			append_dev(strong0, t2);
    			append_dev(strong0, t3);
    			append_dev(strong0, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, strong1, anchor);
    			append_dev(strong1, t6);
    			append_dev(strong1, t7);
    			append_dev(strong1, t8);
    			append_dev(strong1, t9);
    			append_dev(strong1, t10);
    			append_dev(strong1, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t13, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*category*/ ctx[15].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*data*/ 1 && t3_value !== (t3_value = /*category*/ ctx[15].weight + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*data*/ 1 && t6_value !== (t6_value = percent(/*category*/ ctx[15].score) + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*data*/ 1 && t8_value !== (t8_value = /*category*/ ctx[15].score.val + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*data*/ 1 && t10_value !== (t10_value = /*category*/ ctx[15].score.outOf + "")) set_data_dev(t10, t10_value);

    			if (/*modifications*/ ctx[1][/*category*/ ctx[15].name] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(strong0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(strong1);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t13);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(110:3) {#each data.categories as category}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div4;
    	let article;
    	let header;
    	let h1;
    	let t0_value = /*data*/ ctx[0].className + "";
    	let t0;
    	let t1;
    	let div0;
    	let strong0;
    	let t3;
    	let strong1;
    	let t4_value = /*data*/ ctx[0].grade + "";
    	let t4;
    	let t5;
    	let t6_value = /*data*/ ctx[0].score + "";
    	let t6;
    	let t7;
    	let t8;
    	let div1;
    	let strong2;
    	let t10;
    	let strong3;
    	let t13;
    	let input0;
    	let t14;
    	let div2;
    	let input1;
    	let t15;
    	let input2;
    	let t16;
    	let div3;
    	let select;
    	let t17;
    	let fieldset;
    	let label0;
    	let input3;
    	let t18;
    	let t19;
    	let label1;
    	let input4;
    	let t20;
    	let t21;
    	let button;
    	let t23;
    	let t24;
    	let small;
    	let t25;
    	let a0;
    	let t27;
    	let a1;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*data*/ ctx[0].categories;
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*data*/ ctx[0].categories;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div4 = element("div");
    			article = element("article");
    			header = element("header");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "Origional Grade:";
    			t3 = space();
    			strong1 = element("strong");
    			t4 = text(t4_value);
    			t5 = text(" (");
    			t6 = text(t6_value);
    			t7 = text("%)");
    			t8 = space();
    			div1 = element("div");
    			strong2 = element("strong");
    			strong2.textContent = "New Grade:";
    			t10 = space();
    			strong3 = element("strong");
    			strong3.textContent = `${/*newGrade*/ ctx[3]}%`;
    			t13 = space();
    			input0 = element("input");
    			t14 = space();
    			div2 = element("div");
    			input1 = element("input");
    			t15 = space();
    			input2 = element("input");
    			t16 = space();
    			div3 = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t17 = space();
    			fieldset = element("fieldset");
    			label0 = element("label");
    			input3 = element("input");
    			t18 = text("\n\t\t\t\t\t\tAdding New Grade");
    			t19 = space();
    			label1 = element("label");
    			input4 = element("input");
    			t20 = text("\n\t\t\t\t\t\tModifying Existing Grade");
    			t21 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			t23 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t24 = space();
    			small = element("small");
    			t25 = text("Infinite Campus Grade Predictor | \n\t\t\t");
    			a0 = element("a");
    			a0.textContent = "Github";
    			t27 = text(" |\n\t\t\t");
    			a1 = element("a");
    			a1.textContent = "Toggle Dark Mode";
    			add_location(h1, file, 71, 16, 1538);
    			add_location(strong0, file, 73, 5, 1579);
    			set_style(strong1, "float", "right");
    			add_location(strong1, file, 74, 5, 1618);
    			add_location(div0, file, 72, 4, 1568);
    			add_location(strong2, file, 77, 5, 1712);
    			set_style(strong3, "float", "right");
    			add_location(strong3, file, 78, 5, 1746);
    			add_location(div1, file, 76, 4, 1701);
    			add_location(header, file, 70, 12, 1513);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Assignment Name");
    			add_location(input0, file, 82, 3, 1834);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "placeholder", "Score");
    			add_location(input1, file, 85, 4, 1940);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "placeholder", "Out Of");
    			add_location(input2, file, 86, 4, 2020);
    			attr_dev(div2, "class", "grid");
    			add_location(div2, file, 84, 3, 1917);
    			attr_dev(select, "name", "category");
    			if (/*currentMod*/ ctx[2].category === void 0) add_render_callback(() => /*select_change_handler*/ ctx[10].call(select));
    			add_location(select, file, 90, 4, 2136);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "id", "small");
    			attr_dev(input3, "name", "size");
    			input3.value = "NEW";
    			input3.checked = true;
    			add_location(input3, file, 97, 6, 2367);
    			attr_dev(label0, "for", "add");
    			add_location(label0, file, 96, 5, 2343);
    			attr_dev(input4, "type", "radio");
    			attr_dev(input4, "id", "medium");
    			attr_dev(input4, "name", "size");
    			input4.value = "EDITED";
    			add_location(input4, file, 101, 6, 2552);
    			attr_dev(label1, "for", "modify");
    			add_location(label1, file, 100, 5, 2525);
    			add_location(fieldset, file, 95, 4, 2327);
    			attr_dev(div3, "class", "grid");
    			add_location(div3, file, 89, 3, 2113);
    			add_location(button, file, 107, 3, 2739);
    			set_style(article, "margin-top", "0px");
    			set_style(article, "margin-bottom", "10px");
    			add_location(article, file, 69, 8, 1445);
    			attr_dev(a0, "href", "https://github.com");
    			add_location(a0, file, 132, 3, 3470);
    			attr_dev(a1, "href", "#f");
    			add_location(a1, file, 133, 3, 3515);
    			attr_dev(small, "class", "f");
    			add_location(small, file, 131, 2, 3415);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file, 68, 4, 1413);
    			add_location(main, file, 67, 0, 1402);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div4);
    			append_dev(div4, article);
    			append_dev(article, header);
    			append_dev(header, h1);
    			append_dev(h1, t0);
    			append_dev(header, t1);
    			append_dev(header, div0);
    			append_dev(div0, strong0);
    			append_dev(div0, t3);
    			append_dev(div0, strong1);
    			append_dev(strong1, t4);
    			append_dev(strong1, t5);
    			append_dev(strong1, t6);
    			append_dev(strong1, t7);
    			append_dev(header, t8);
    			append_dev(header, div1);
    			append_dev(div1, strong2);
    			append_dev(div1, t10);
    			append_dev(div1, strong3);
    			append_dev(article, t13);
    			append_dev(article, input0);
    			set_input_value(input0, /*currentMod*/ ctx[2].name);
    			append_dev(article, t14);
    			append_dev(article, div2);
    			append_dev(div2, input1);
    			set_input_value(input1, /*currentMod*/ ctx[2].score.val);
    			append_dev(div2, t15);
    			append_dev(div2, input2);
    			set_input_value(input2, /*currentMod*/ ctx[2].score.outOf);
    			append_dev(article, t16);
    			append_dev(article, div3);
    			append_dev(div3, select);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select, null);
    			}

    			select_option(select, /*currentMod*/ ctx[2].category);
    			append_dev(div3, t17);
    			append_dev(div3, fieldset);
    			append_dev(fieldset, label0);
    			append_dev(label0, input3);
    			append_dev(label0, t18);
    			append_dev(fieldset, t19);
    			append_dev(fieldset, label1);
    			append_dev(label1, input4);
    			append_dev(label1, t20);
    			append_dev(article, t21);
    			append_dev(article, button);
    			append_dev(article, t23);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(article, null);
    			}

    			append_dev(div4, t24);
    			append_dev(div4, small);
    			append_dev(small, t25);
    			append_dev(small, a0);
    			append_dev(small, t27);
    			append_dev(small, a1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[9]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[10]),
    					listen_dev(input3, "change", /*change_handler*/ ctx[11], false, false, false),
    					listen_dev(input4, "change", /*change_handler_1*/ ctx[12], false, false, false),
    					listen_dev(button, "click", /*handleSubmit*/ ctx[5], false, false, false),
    					listen_dev(a1, "click", /*toggleTheme*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*data*/ ctx[0].className + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*data*/ 1 && t4_value !== (t4_value = /*data*/ ctx[0].grade + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*data*/ 1 && t6_value !== (t6_value = /*data*/ ctx[0].score + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*currentMod, data*/ 5 && input0.value !== /*currentMod*/ ctx[2].name) {
    				set_input_value(input0, /*currentMod*/ ctx[2].name);
    			}

    			if (dirty & /*currentMod, data*/ 5 && to_number(input1.value) !== /*currentMod*/ ctx[2].score.val) {
    				set_input_value(input1, /*currentMod*/ ctx[2].score.val);
    			}

    			if (dirty & /*currentMod, data*/ 5 && to_number(input2.value) !== /*currentMod*/ ctx[2].score.outOf) {
    				set_input_value(input2, /*currentMod*/ ctx[2].score.outOf);
    			}

    			if (dirty & /*data*/ 1) {
    				each_value_2 = /*data*/ ctx[0].categories;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*currentMod, data*/ 5) {
    				select_option(select, /*currentMod*/ ctx[2].category);
    			}

    			if (dirty & /*modifications, data, percent*/ 3) {
    				each_value = /*data*/ ctx[0].categories;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(article, null);
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
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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

    function percent(grade) {
    	return (grade.val / grade.outOf * 100).toFixed(2);
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let data = {
    		"grade": "A",
    		"score": 100,
    		"className": "",
    		"categories": []
    	};

    	let modifications = {};
    	let newGrade = 100;

    	chrome.storage.local.get(["data"], res => {
    		$$invalidate(0, data = res.data);

    		for (let i of data.categories) {
    			$$invalidate(1, modifications[i.name] = [], modifications);
    		}

    		console.log(data.categories);
    	});

    	let theme = document.getElementsByTagName("html")[0].getAttribute("data-theme");

    	if (theme == "dark") {
    		theme = "light";
    	} else {
    		theme = "dark";
    	}

    	function toggleTheme() {
    		if (theme == "dark") {
    			$$invalidate(6, theme = "light");
    		} else {
    			$$invalidate(6, theme = "dark");
    		}

    		localStorage.setItem("theme", theme);
    	}

    	let currentMod = {
    		"name": "",
    		"type": "NEW",
    		"category": "",
    		"score": { "val": null, "outOf": null }
    	};

    	let defaultMod = Object.assign({}, currentMod);

    	function handleSubmit() {
    		modifications[currentMod.category].push(Object.assign({}, currentMod));
    		$$invalidate(1, modifications);
    		$$invalidate(2, currentMod = Object.assign({}, defaultMod));
    		calculateGrades();
    	}

    	function calculateGrades() {
    		for (let category of data.categories) {
    			if (modifications[category] != null) {
    				for (let mod of modifications[category]) {
    					console.log(mod);
    				}
    			}
    		}
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		currentMod.name = this.value;
    		$$invalidate(2, currentMod);
    		$$invalidate(0, data);
    	}

    	function input1_input_handler() {
    		currentMod.score.val = to_number(this.value);
    		$$invalidate(2, currentMod);
    		$$invalidate(0, data);
    	}

    	function input2_input_handler() {
    		currentMod.score.outOf = to_number(this.value);
    		$$invalidate(2, currentMod);
    		$$invalidate(0, data);
    	}

    	function select_change_handler() {
    		currentMod.category = select_value(this);
    		$$invalidate(2, currentMod);
    		$$invalidate(0, data);
    	}

    	const change_handler = e => {
    		$$invalidate(2, currentMod.type = e.target.value, currentMod);
    	};

    	const change_handler_1 = e => {
    		$$invalidate(2, currentMod.type = e.target.value, currentMod);
    	};

    	$$self.$capture_state = () => ({
    		data,
    		modifications,
    		newGrade,
    		percent,
    		theme,
    		toggleTheme,
    		currentMod,
    		defaultMod,
    		handleSubmit,
    		calculateGrades
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('modifications' in $$props) $$invalidate(1, modifications = $$props.modifications);
    		if ('newGrade' in $$props) $$invalidate(3, newGrade = $$props.newGrade);
    		if ('theme' in $$props) $$invalidate(6, theme = $$props.theme);
    		if ('currentMod' in $$props) $$invalidate(2, currentMod = $$props.currentMod);
    		if ('defaultMod' in $$props) defaultMod = $$props.defaultMod;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*theme*/ 64) {
    			{
    				document.getElementsByTagName("html")[0].setAttribute("data-theme", theme);
    			}
    		}
    	};

    	if (localStorage.getItem("theme") != null) {
    		$$invalidate(6, theme = localStorage.getItem("theme"));
    	}

    	return [
    		data,
    		modifications,
    		currentMod,
    		newGrade,
    		toggleTheme,
    		handleSubmit,
    		theme,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		select_change_handler,
    		change_handler,
    		change_handler_1
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
