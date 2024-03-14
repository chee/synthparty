import {PartyElement} from "./party-elements.js"
import Sound from "../sound.js"

/**
 * @typedef {{
		type: "start" | "move" | "end",
		mouse: {x: number, y: number}
	}} MouseMessage
 */

/** @abstract */
export default class DelugeEditor extends PartyElement {
	static DPI = 4
	/** @type Sound */
	#sound

	constructor() {
		super()
		let canvas = document.createElement("canvas")
		this.canvas = canvas
		this.context = canvas.getContext("2d")
		this.attachShadow({mode: "open"})
		this.shadowRoot.appendChild(this.canvas)
		canvas.style.height = "200px"
		canvas.style.width = "400px"
		this.addEventListener("mousedown", this.#mousedown)
	}

	get editorMode() {
		return this.sound.editorMode
	}

	/** @param {MouseEvent} event */
	#mousedown(event) {
		// assumes nothing ever changes size while you're trying to trim a sample
		let bounds = this.canvas.getBoundingClientRect()
		let mouse = resolveMouseFromEvent(event, bounds)
		this.mouse({type: "start", mouse})
		/** @param {MouseEvent} event */
		let mousemove = event => {
			let mouse = resolveMouseFromEvent(event, bounds)
			this.mouse({type: "move", mouse})
		}
		window.addEventListener("mousemove", mousemove)

		/** @param {MouseEvent} event */
		let mouseend = event => {
			let mouse = resolveMouseFromEvent(event, bounds)
			this.mouse({type: "end", mouse})
			window.removeEventListener("mousemove", mousemove)
		}

		window.addEventListener("mouseup", mouseend, {once: true})
	}

	/** @param {MouseMessage} _message */
	mouse(_message) {
		throw new Error("editor.mouse must be defined")
	}

	get empx() {
		let box = document.createElement("div")
		box.style.width = "1em"
		box.style.visibility = "hidden"
		this.shadowRoot.appendChild(box)
		let empx = box.clientWidth
		this.shadowRoot.removeChild(box)
		return empx
	}

	get width() {
		return this.clientWidth
	}

	get height() {
		return this.clientHeight
	}

	connectedCallback() {
		this.canvas.width = this.width * DelugeEditor.DPI
		this.canvas.height = this.height * DelugeEditor.DPI
	}

	/** @type {Sound} */
	get sound() {
		return this.#sound
	}

	set sound(sound) {
		this.#sound = sound
		this.draw()
	}

	/** @param {string} prop */
	getStyle(prop) {
		return getComputedStyle(this).getPropertyValue("--" + prop)
	}

	get styles() {
		let fill = this.getStyle("editor-fill") || "#000"
		let off = this.getStyle("editor-off") || "#999"
		let line = this.getStyle("editor-line") || "black"
		let start = this.getStyle("editor-start") || "#f00"
		let end = this.getStyle("editor-end") || "#0f0"
		return {fill, line, start, end, off}
	}

	clear() {
		let [canvas, context] = [this.canvas, this.context]
		let {width, height} = canvas
		context.restore()
		context.fillStyle = context.strokeStyle = this.styles.fill
		context.clearRect(0, 0, width, height)
		context.lineWidth = DelugeEditor.DPI
	}

	draw() {}
}

// @abstract
//partyElements.define("deluge-editor", DelugeEditor)

/**
 * @param {MouseMessage["mouse"]} clientXY
 * @param {DOMRect} bounds
 * @returns {MouseMessage["mouse"]} corrected
 */
function resolveMouse(clientXY, bounds) {
	return {
		x:
			clientXY.x < bounds.left
				? 0
				: // the bounds are the effective size
					clientXY.x > bounds.right
					? bounds.width * DelugeEditor.DPI
					: // multiplied for the REAL canvas size
						(clientXY.x - bounds.left) * DelugeEditor.DPI,
		y:
			clientXY.y < bounds.top
				? 0
				: clientXY.y > bounds.bottom
					? bounds.height * DelugeEditor.DPI
					: (clientXY.y - bounds.top) * DelugeEditor.DPI
	}
}

/**
 * @param {MouseEvent | Touch} event
 * @param {DOMRect} bounds
 */
function resolveMouseFromEvent(event, bounds) {
	return resolveMouse(
		{
			x: event.clientX,
			y: event.clientY
		},
		bounds
	)
}
