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
 * @param {XMLDocument} doc
 * @param {string} name
 * @param {Record<string, any>} attributes
 */
export function createElement(doc, name, attributes = {}) {
	let element = doc.createElement(name)
	setAttributes(element, attributes)
	return element
}
