/**
 * @param {HTMLElement} element
 * @param {Record<string, any>} attributes
 */
export function setAttributes(element, attributes) {
	for (let [key, value] of Object.entries(attributes)) {
		element.setAttribute(key, value)
	}
}

/**
 * @overload
 * @param {XMLDocument} doc
 * @param {string} name
 * @return {HTMLElement}
 *
 * @overload
 * @param {XMLDocument} doc
 * @param {string} name
 * @param {HTMLElement[]} children
 * @return {HTMLElement}
 *
 * @overload
 * @param {XMLDocument} doc
 * @param {string} name
 * @param {Record<string, any>} attributes
 * @return {HTMLElement}
 *
 * @param {XMLDocument} doc
 * @param {string} name
 * @param {Record<string, any>} attributes
 * @param {HTMLElement[]} children
 */
export function createElement(doc, name, attributes, children) {
	let element = doc.createElement(name)
	if (Array.isArray(attributes) && !children) {
		children = attributes
		attributes = {}
	}
	if (!attributes) {
		attributes = {}
	}
	if (!children) {
		children = []
	}
	setAttributes(element, attributes)
	element.append(...children)
	return element
}

export function renderNumber(/** @type number */ n) {
	return (
		"0x" +
		(Math.round(-2147483648 + ((2147483647 - -2147483648) / 50) * n) >>> 0)
			.toString(16)
			.padStart(8, "0")
			.toUpperCase()
	)
}
