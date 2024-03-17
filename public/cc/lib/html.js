/**
 * @param {HTMLElement} node
 * @param {string} selector
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
