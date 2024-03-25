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
				"s",
				`with (Math) {return ${this.memory.code}}`
			)
		} catch (error) {
			// console.debug("error making func", this.memory.code, error)
			return true
		}

		for (let i = 0; i < 128; i++) {
			try {
				let result = this.func(this.tick + i, this.memory.sampleRate)
				if (typeof result == "number") {
					left[i] = right[i] = result
				} else if (Array.isArray(result)) {
					left[i] = result[0]
					right[i] = result[1]
				}
			} catch (error) {
				continue
			}
		}
		this.tick += 128
		return true
	}
}

registerProcessor("user-code", UserWorklet)
