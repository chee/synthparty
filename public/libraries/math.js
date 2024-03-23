/**
 *  @param {number} min
 *  @param {number} num
 *  @param {number} max
 */
export function clamp(min, num, max) {
	return Math.min(Math.max(num, min), max)
}
