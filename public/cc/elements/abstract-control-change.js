import SynthPartyComponent from "./synth-party-component.js"

/**
 * @typedef {{
		type: "start" | "move" | "end"
		mouse: {x: number, y: number}
		event: MouseEvent | TouchEvent
	}} MouseMessage
 */

const IS_BASICALLY_A_PHONE =
	typeof window != "undefined" &&
	window.matchMedia("(pointer: coarse)").matches

/** @abstract */
export default class AbstractControlChange extends SynthPartyComponent {
	static DPI = 4
	disabled = false
	static css = `
		figure {
			display: flex;
			flex-direction: column;
			margin: 0;
			gap: 4px;
			align-items: center;
			background: white;
			border: 1px solid;
			padding: 4px;
			box-shadow: 0 0 10px #00000011;
		}

		* {
			box-sizing: border-box;
		}

		figcaption {
			grid-area: label;
			border: 0px solid;
			background: white;
			text-align: center;
			padding: 2px;
			font-size: 16px;
		}

		#canvas-container {
			border: 2px solid;
			border-top: 0;
			grid-area: canvas;
			height: var(--cc-height);
			width: var(--cc-width);
		}

		canvas {height: 100%; width: 100%; touch-action: none;}
`

	label = document.createElement("figcaption")
	static get stylesheet () {
		let stylesheet = new CSSStyleSheet()
		stylesheet.replaceSync(AbstractControlChange.css)
		return stylesheet
	}

	constructor() {
		super()
		let figure = document.createElement("figure")
		this.attachShadow({mode: "open"})
		this.shadowRoot.appendChild(figure)
		this.label.textContent = this.getAttribute("label")

		let container = document.createElement("div")
		container.id = "canvas-container"
		let canvas = document.createElement("canvas")
		this.canvas = canvas
		this.canvasContext = canvas.getContext("2d")
		container.append(canvas)
		figure.append(container)
		figure.appendChild(this.label)
		this.shadowRoot.adoptedStyleSheets = [AbstractControlChange.stylesheet]
		if (IS_BASICALLY_A_PHONE) {
			this.addEventListener("touchstart", this.#touchstart)
		} else {
			this.addEventListener("mousedown", this.#mousedown)
		}
	}

	/** @param {MouseEvent} event */
	#mousedown(event) {
		// assumes nothing ever changes size while you're trying to trim a sample
		let bounds = this.canvas.getBoundingClientRect()
		let mouse = resolveMouseFromEvent(event, bounds)
		this.mouse({type: "start", mouse, event})
		/** @param {MouseEvent} event */
		let mousemove = event => {
			let mouse = resolveMouseFromEvent(event, bounds)
			this.mouse({type: "move", mouse, event})
		}
		window.addEventListener("mousemove", mousemove)

		/** @param {MouseEvent} event */
		let mouseend = event => {
			let mouse = resolveMouseFromEvent(event, bounds)
			try {
				this.mouse({type: "end", mouse, event})
			} catch (error) {
				throw error
			} finally {
				window.removeEventListener("mousemove", mousemove)
			}
		}

		window.addEventListener("mouseup", mouseend, {once: true})
	}

	// this is super naïve
	/** @param {TouchEvent} event */
	#touchstart(event) {
		// assumes nothing ever changes size while you're fingering
		let bounds = this.canvas.getBoundingClientRect()
		let finger = event.touches.item(0)
		let mouse = resolveMouseFromEvent(finger, bounds)
		this.mouse({type: "start", mouse, event})

		/** @param {TouchEvent} event */
		let move = event => {
			let moved = findFinger(finger, event.changedTouches)

			if (moved) {
				let mouse = resolveMouseFromEvent(moved, bounds)
				this.mouse({type: "move", mouse, event})
			}
		}
		window.addEventListener("touchmove", move)
		window.addEventListener(
			"touchend",
			/** @param {TouchEvent} event */
			event => {
				let lost = findFinger(finger, event.changedTouches)
				let missing = !findFinger(finger, event.targetTouches)
				if (lost && missing) {
					let mouse = resolveMouseFromEvent(lost, bounds)
					this.mouse({type: "end", mouse, event})
					window.removeEventListener("touchmove", move)
				}
			},
			{once: true}
		)
	}

	/** @param {MouseMessage} _message */
	mouse(_message) {
		throw new Error("editor.mouse must be defined")
	}

	get width() {
		return this.canvas.clientWidth
	}

	get height() {
		return this.canvas.clientHeight
	}

	connectedCallback() {
		this.canvas.width = this.width * AbstractControlChange.DPI
		this.canvas.height = this.height * AbstractControlChange.DPI
	}

	/** @param {string} prop */
	getStyle(prop) {
		return getComputedStyle(this).getPropertyValue("--" + prop)
	}

	get styles() {
		let fill = this.getStyle("cc-fill") || "#000"
		let line = this.getStyle("cc-line") || "black"
		let off = this.getStyle("cc-off") || "#999"
		return {fill, line}
	}

	clear() {
		let [canvas, context] = [this.canvas, this.canvasContext]
		let {width, height} = canvas
		context.restore()
		context.fillStyle = context.strokeStyle = this.styles.fill
		context.fillRect(0, 0, width, height)
		context.lineWidth = AbstractControlChange.DPI
	}

	draw() {}
}

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
					? bounds.width * AbstractControlChange.DPI
					: // multiplied for the REAL canvas size
						(clientXY.x - bounds.left) * AbstractControlChange.DPI,
		y:
			clientXY.y < bounds.top
				? 0
				: clientXY.y > bounds.bottom
					? bounds.height * AbstractControlChange.DPI
					: (clientXY.y - bounds.top) * AbstractControlChange.DPI
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

/**
 * @param {Touch} finger
 * @param {TouchList} touches
 * @returns {Touch?}
 */
function findFinger(finger, touches) {
	return [].find.call(
		touches,
		/** @param {Touch} touch */
		touch => touch.identifier == finger.identifier
	)
}
