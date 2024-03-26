import Memory from "./memory.js"

class UserWorklet extends AudioWorkletProcessor {
	/** @param {{processorOptions: {sab: SharedArrayBuffer}}} options */
	constructor(options) {
		super()
		let {sab} = options.processorOptions
		if (!sab) {
			let msg = "failed to instantiate, missing processorOption"
			console.error(msg, {
				sab: typeof sab
			})
			throw new Error(msg)
		}
		this.memory = new Memory(sab)
		this.tick = 0
	}

	/**
	 * @param {Float32Array[][]} _inputs
	 * @param {Float32Array[][]} outputs
	 * @param {Record<string, Float32Array>} _parameters
	 */
	process(_inputs, outputs, _parameters) {
		let [[left, right]] = outputs
		try {
			this.func = new Function(
				"t",
				"sr",
				`with (Math) {return ${this.memory.code}}`
			)
		} catch (error) {
			// console.debug("error making func", this.memory.code, error)
			return true
		}
		let maxSampleVolume = 1
		for (let i = 0; i < 128; i++) {
			try {
				let result = this.func(this.tick + i, this.memory.sampleRate)
				let pair =
					Array.isArray(result) &&
					result.length == 2 &&
					result.every(n => typeof n == "number")
				if (pair) {
					let [l, r] = result
					left[i] = l
					right[i] = r
					maxSampleVolume = Math.max(Math.abs(l), maxSampleVolume)
					maxSampleVolume = Math.max(Math.abs(r), maxSampleVolume)
				} else if (typeof result == "number") {
					left[i] = right[i] = result
					maxSampleVolume = Math.max(Math.abs(result), maxSampleVolume)
				}
			} catch (error) {
				continue
			}
		}

		let mult = 1 / maxSampleVolume

		for (let i = 0; i < 128; i++) {
			left[i] *= mult
			right[i] *= mult
		}

		this.tick += 128
		return true
	}
}

registerProcessor("user-code", UserWorklet)
