/**
 * @typedef {Object} MouserPoint
 * @prop {number} x
 * @prop {number} y
 */

/**
 * @typedef {Object} MouserChangePoint
 * @prop {number} xd the normalized height change (- left, +right)
 * @prop {number} yd the normalized height change (- down, +up)
 */

/**
 * @typedef {Object} MouserStartEndDetail
 * @prop {"start" | "end"} type
 * @prop {MouserPoint} mouse
 * @prop {MouseEvent | TouchEvent} event
 * @prop {Touch} [finger]
 */

/**
 * @typedef {Object} MouserMoveDetail
 * @prop {"move"} type
 * @prop {MouserPoint & MouserChangePoint} mouse
 * @prop {MouseEvent | TouchEvent} event
 * @prop {Touch} [finger]
 */

/**
 * @typedef {MouserStartEndDetail | MouserMoveDetail} MouserDetail
 */

export default class Mouser {
	#lastX = 0
	#lastY = 0

	/**
	 * @typedef {Object} MouserArgs
	 * @prop {HTMLCanvasElement} canvas
	 * @prop {number} dpi
	 * @prop {(detail: MouserStartEndDetail) => any} onstart
	 * @prop {(detail: MouserMoveDetail) => any} onmove
	 * @prop {(detail: MouserStartEndDetail) => any} onend
	 * @param {MouserArgs} args
	 */
	constructor({canvas, dpi, onstart, onmove, onend}) {
		this.canvas = canvas

		this.context = /** @type {CanvasRenderingContext2D}*/ (
			canvas.getContext("2d")
		)
		this.dpi = dpi
		canvas.addEventListener("touchstart", this.#touchstart)
		canvas.addEventListener("mousedown", this.#mousedown)
		this.onstart = onstart
		this.onmove = onmove
		this.onend = onend
	}

	get width() {
		return this.canvas.width
	}

	get height() {
		return this.canvas.height
	}

	/** @param {MouseEvent} event */
	#mousedown = event => {
		// assumes nothing ever changes size while you're trying to trim a sample
		let bounds = this.canvas.getBoundingClientRect()
		let mouse = normalizePointerEvent(event, bounds, this.dpi)
		this.#lastX = event.clientX
		this.#lastY = event.clientY
		this.onstart({
			type: "start",
			mouse,
			event
		})

		/** @param {MouseEvent} event */
		let mousemove = event => {
			let mouse = normalizePointerEvent(event, bounds, this.dpi)
			this.onmove({
				type: "move",
				mouse: {
					...mouse,
					xd: (event.clientX - this.#lastX) / this.width,
					yd: (this.#lastY - event.clientY) / this.height
				},
				event
			})
		}
		window.addEventListener("mousemove", mousemove)

		/** @param {MouseEvent} event */
		let mouseend = event => {
			let mouse = normalizePointerEvent(event, bounds, this.dpi)
			try {
				this.onend({type: "end", mouse, event})
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
	#touchstart = event => {
		// prevent mousedown from firing
		event.preventDefault()
		// assumes nothing ever changes size while you're fingering
		let bounds = this.canvas.getBoundingClientRect()
		for (let finger of event.changedTouches) {
			let mouse = normalizePointerEvent(finger, bounds, this.dpi)
			this.onstart({type: "start", mouse, event, finger})
			let initialX = finger.clientX
			let initialY = finger.clientY

			/** @param {TouchEvent} event */
			let move = event => {
				let moved = findFinger(finger, event.changedTouches)

				if (moved) {
					let mouse = normalizePointerEvent(moved, bounds, this.dpi)
					this.onmove({
						type: "move",
						mouse: {
							...mouse,
							xd: (moved.clientX - initialX) / this.width,
							yd: (initialY - moved.clientY) / this.height
						},
						event,
						finger
					})
				}
			}
			window.addEventListener("touchmove", move)

			/** @param {TouchEvent} event */
			let end = event => {
				let lost = findFinger(finger, event.changedTouches)
				let missing = !findFinger(finger, event.targetTouches)

				if (lost && missing) {
					let mouse = normalizePointerEvent(lost, bounds, this.dpi)
					this.onend({type: "end", mouse, event, finger})
					window.removeEventListener("touchmove", move)
					window.removeEventListener("touchend", end)
				}
			}
			window.addEventListener("touchend", end)
		}
	}
}
/**
 * @param {Touch} finger
 * @param {TouchList} touches
 * @returns {Touch?}
 */
export function findFinger(finger, touches) {
	return (
		[].find.call(
			touches,
			/** @param {Touch} touch */
			touch => touch.identifier == finger.identifier
		) || null
	)
}

/**
 * @param {MouseEvent | Touch} event
 * @param {DOMRect} bounds
 * @param {number} dpi
 * @returns {MouserPoint} corrected
 */
function normalizePointerEvent(event, bounds, dpi) {
	let x = event.clientX
	let y = event.clientY
	return {
		x:
			x < bounds.left
				? 0
				: // the bounds are the effective size
					x > bounds.right
					? bounds.width * dpi
					: // multiplied for the REAL canvas size
						(x - bounds.left) * dpi,
		y:
			y < bounds.top
				? 0
				: y > bounds.bottom
					? bounds.height * dpi
					: (y - bounds.top) * dpi
	}
}
