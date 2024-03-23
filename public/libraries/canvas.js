export function scaleCanvasForDPI(
	/** @type {HTMLCanvasElement} */ canvas,
	/** @type {number} */ dpi
) {
	canvas.width = canvas.clientWidth * dpi
	canvas.height = canvas.clientHeight * dpi
}
