/**
 * @typedef {Record<string, any>} PartyEventMap
 */

/**
 * @template {PartyEventMap} PartyEvents
 * @template {keyof PartyEvents} Name
 * @template {PartyEvents[Name]} Detail
 * @template {Omit<EventInit, "detail">} Options
 */
export class PartyEvent extends CustomEvent {
	/**
	 * @param {Name} name
	 * @param {Detail} detail
	 * @param {Options} options
	 */
	constructor(name, detail, options) {
		super(name, {...options, detail})
	}

	get message() {
		return this.detail
	}
}

/**
 * @template {PartyEvent} PartyEvents
 */
export class PartyElement extends HTMLElement {
	/** @param {keyof HTMLElementTagNameMap | string} selector */
	$(selector) {
		return this.shadowRoot.querySelector(selector)
	}

	/** @param {keyof HTMLElementTagNameMap | string} selector */
	$$(selector) {
		return this.shadowRoot.querySelectorAll(selector)
	}

	truthy(attr = "", prop = attr) {
		return Boolean(
			(this.hasAttribute(attr) && this.getAttribute(attr) != "false") ||
				this[prop]
		)
	}

	connectedCallback() {}

	/**
	 * @template {keyof PartyEvents} Name
	 * @param {Name} name
	 * @param {(message: PartyEvents[Name], event: (PartyEvents & {target: PartyElement})) => void} fn
	 * @param {boolean | AddEventListenerOptions} [options]
	 */
	when(name, fn, options) {
		let el = this
		let cb = (/** @type PartyEvent & {target: PartyElement} */ event) => {
			fn.call(el, event.detail, event)
		}
		this.addEventListener(name, cb, options)
		return () => {
			this.removeEventListener(name, cb)
		}
	}

	/**
	 * @template {keyof PartyEvents} Name
	 * @param {Name} name
	 * @param {PartyEvents[Name]} [detail]
	 * @param {EventInit} [options]
	 */
	announce(
		name,
		detail,
		options = {bubbles: true, composed: true, cancelable: true}
	) {
		this.dispatchEvent(new PartyEvent(name, detail, options))
	}

	/**
	 * @param {string} name
	 * @param {boolean} state
	 */
	toggleAttribute(name, state) {
		if (state && !this.hasAttribute(name)) {
			this.setAttribute(name, name)
		} else if (!state && this.hasAttribute(name)) {
			this.removeAttribute(name)
		}
		return state
	}

	#props = new Map()

	/**
	 * @template {keyof this} P
	 * @param {P} prop
	 * @param {this[P]} val
	 * @param {() => void} cb
	 */
	set(prop, val, cb) {
		if (this.#props.has(prop) && this.#props.get(prop) == val) {
			return
		} else {
			this.#props.set(prop, val)
			cb()
		}
	}

	/**
	 * Only use this in the constructor
	 *
	 * @template {keyof this} P
	 * @param {P} prop
	 * @param {this[P]} val
	 */
	setImmediately(prop, val) {
		this.#props.set(prop, val)
	}

	/**
	 * @template {keyof this} P
	 * @param {P} prop
	 * @returns {this[P]}
	 */
	get(prop) {
		return this.#props.get(prop)
	}
}

class PartyElements {
	/** @type Map<string, typeof PartyElement> */
	#elements = new Map()

	/**
	 * @template {typeof PartyElement} El
	 * Define an element to be registered with the registry
	 * @param {string} name html name of element
	 * @param {El} element bento element to register
	 * @returns {El}
	 */
	define(name, element) {
		this.#elements.set(name, element)
		return element
	}
	/**
	 * Register the defined elements with the customElements registry
	 */
	register() {
		for (let [name, element] of this.#elements) {
			// console.debug(`defining ${name} as ${element.name}`)
			customElements.define(name, element)
		}
	}
}

export const partyElements = new PartyElements()
