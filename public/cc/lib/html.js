/**
 * @template {keyof HTMLElementTagNameMap} K
 * @template {HTMLElementTagNameMap[K]} E
 * @param {HTMLElement} node
 * @param {K} selector
 * @returns {E|null}
 */
export function closest(node, selector) {
	if (Object.is(document.documentElement, node)) {
		return null
	}
	if (typeof node.matches == "function" && node.matches(selector)) {
		return node
	}
	if (node.parentElement) {
		return closest(node.parentElement, selector)
	}
	if (node.getRootNode() && node.getRootNode().host) {
		return closest(
			/** @type {HTMLElement}*/ (node.getRootNode().host),
			selector
		)
	}
	return null
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @template {HTMLElementTagNameMap[K]} E
 * @template {keyof E} EK
 * @param {K} name
 * @param {Record<EK, E[EK]>} props
 * @param {HTMLElement[]} children
 * @returns {E}
 */
export function createElement(name, props, children = []) {
	let element = document.createElement(name)
	for (let [k, v] of Object.entries(props)) {
		if (v != null && v !== "") {
			element[k] = v
		}
	}
	element.append(...children)
	return element
}
