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
		let maxSampleVolume = 0
		for (let i = 0; i < 128; i++) {
			try {
				let result = this.func(this.tick + i, this.memory.sampleRate)
				if (typeof result == "number") {
					left[i] = right[i] = result * 0.25
					maxSampleVolume = Math.max(Math.abs(result), maxSampleVolume)
				} else if (Array.isArray(result)) {
					let [l, r] = result
					left[i] = l * 0.25
					right[i] = r * 0.25
					maxSampleVolume = Math.max(
						Math.abs(l) + Math.abs(r) / 2,
						maxSampleVolume
					)
				}
			} catch (error) {
				continue
			}
		}
		if (maxSampleVolume) {
			let mult = (1 / maxSampleVolume) * 0.99
			for (let i = 0; i < 128; i++) {
				left[i] *= mult
				right[i] *= mult
			}
		}

		this.tick += 128
		return true
	}
}

registerProcessor("user-code", UserWorklet)
