/**
 * @typedef {Uint8ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor} SomeTypedArrayConstructor
 */

/**
 * @typedef {Object} ArrayInfo
 * @prop {SomeTypedArrayConstructor} type
 * @prop {number} size

 */

/**
 * @typedef {Record<string, ArrayInfo>} MemoryArrayDefinition
 */

export default class Memory {
	/**
	 * @satisfies {MemoryArrayDefinition}
	 */
	static def = {
		sampleRate: {
			type: Uint32Array,
			size: 1
		},
		code: {
			type: Uint16Array,
			size: 4096
		}
	}

	static get size() {
		return Object.values(Memory.def).reduce(
			(total, array) => total + array.type.BYTES_PER_ELEMENT * array.size,
			0
		)
	}

	/** @type Map<string, Uint8Array | Uint16Array | Uint32Array> */
	arrays = new Map()
	/**
	 * @param {SharedArrayBuffer} sab
	 */
	constructor(sab) {
		this.sab = sab
		let offset = 0
		for (let [name, info] of Object.entries(Memory.def)) {
			this.arrays.set(name, new info.type(sab, offset, info.size))
			offset += info.size * info.type.BYTES_PER_ELEMENT
		}
	}

	/** @type {number} */
	get sampleRate() {
		return this.arrays.get("sampleRate")?.at(0) || 0
	}

	set sampleRate(number) {
		this.arrays.get("sampleRate")?.set([number])
	}

	/** @type {string} */
	get code() {
		let array = this.arrays.get("code")
		if (!array) {
			return ""
		}
		let s = []
		for (let i = 0; i < array.length; i++) {
			let val = array.at(i)
			if (!val) {
				break
			}
			s.push(String.fromCharCode(val))
		}
		return s.join("")
	}

	set code(string) {
		let array = this.arrays.get("code")
		if (!array) {
			return
		}
		let c = []
		let len = string.length
		for (let i = 0; i < array.length; i++) {
			if (i < len) {
				c.push(string.charCodeAt(i))
			} else {
				c.push(0)
			}
		}
		this.arrays.get("code")?.set(c)
	}
}
