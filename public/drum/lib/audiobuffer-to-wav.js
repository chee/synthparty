// Adapted from https://github.com/mattdiamond/Recorderjs/tree/master
/*!
Copyright © 2013 Matt Diamond

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @param {AudioBuffer} audiobuffer
 * @param {number} index
 */
export default function audioBufferToWav(audiobuffer, index = 0) {
	let numChannels = audiobuffer.numberOfChannels
	let sampleRate = audiobuffer.sampleRate

	let result
	if (numChannels === 2) {
		result = interleave(
			audiobuffer.getChannelData(0),
			audiobuffer.getChannelData(1)
		)
	} else {
		result = audiobuffer.getChannelData(0)
	}

	return encodeWAV(result, sampleRate, numChannels, index)
}

class Encoder {
	/** @type ArrayBuffer */
	#buffer
	/** @type DataView */
	#view
	#offset = 0
	#le = false
	// todo don't actually need the length here if we store all the operations
	// and only make the buffer at the end based on the size of "offset"
	constructor(length = 0, {littleEndian = false} = {}) {
		this.#buffer = new ArrayBuffer(length)
		this.#view = new DataView(this.#buffer)
		this.#le = littleEndian
	}

	string(string = "") {
		for (let char of new TextEncoder().encode(string)) {
			this.#view.setUint8(this.#offset, char)
			this.#offset += 1
		}
	}

	/** @param {number} number */
	uint32(number) {
		this.#view.setUint32(this.#offset, number, this.#le)
		this.#offset += 4
	}

	/** @param {number} number */
	uint16(number) {
		this.#view.setUint16(this.#offset, number, this.#le)
		this.#offset += 2
	}

	end() {
		let buffer = this.#buffer
		this.#buffer = null
		this.#view = null
		this.#le = false
		return buffer
	}
}

/**
 * @param {Float32Array} samples
 * @param {number} sampleRate
 * @param {number} numChannels
 */
export function encodeWAV(samples, sampleRate, numChannels, note) {
	let bytesPerSample = 2
	let blockAlign = numChannels * bytesPerSample
	let samplelength = samples.length * bytesPerSample
	let headerlength = 44
	let smplchunklength = 48
	// let instchunklength = 15
	let bufferlength = headerlength + samplelength + smplchunklength // + instchunklength
	let encoder = new Encoder(bufferlength, {littleEndian: true})

	// RIFF identifier
	encoder.string("RIFF")
	// RIFF chunk length (less the 8 bytes of "RIFF" and itself)
	encoder.uint32(bufferlength - 8)
	// RIFF type
	encoder.string("WAVE")
	// format chunk identifier
	encoder.string("fmt ")
	// format chunk length
	encoder.uint32(16)
	// sample format (raw)
	encoder.uint16(1)
	// channel count
	encoder.uint16(numChannels)
	// sample rate
	encoder.uint32(sampleRate)
	// byte rate (sample rate * block align)
	encoder.uint32(sampleRate * blockAlign)
	// block align (channel count * bytes per sample)
	encoder.uint16(blockAlign)
	// bits per sample
	encoder.uint16(8 * bytesPerSample)

	/* write the smpl chunk for smart samplers like the synthstrom deluge */
	encoder.string("smpl")
	// chunk size less header
	encoder.uint32(smplchunklength - 8)
	// manufacturer. should i make it 0x01000041 for Roland? selling knock-off
	// Roland wave files down the market. i wonder if there are any devices that
	// do anything with that information. error: not an official microsoft® wave
	// file
	encoder.uint32(0)
	// product.
	encoder.uint32(0)
	// sample period: sample-rate 44.1k
	encoder.uint32(0x5893)
	// midi note 0-127, if anyone ever adds more than 127 rows i don't know what
	// will happen to them
	encoder.uint32(note)
	// midi pitch fraction (this is a tiny tiny tiny pitch bump that should be
	// imperceptible, but forces the deluge to recognize a midi note of 0 and not
	// consider it disabled)
	encoder.uint32(1)
	// smpte format
	encoder.uint32(0)
	// smpte offset
	encoder.uint32(0)
	// number loops (none)
	encoder.uint32(0)
	// sampler data length
	encoder.uint32(4)
	// sampler data
	encoder.string("chee")

	// data chunk identifier
	encoder.string("data")
	// data chunk length
	encoder.uint32(samplelength)
	for (let sample of samples) {
		encoder.uint16(webaudioSampleTo16BitPCM(sample))
	}

	return encoder.end()
}

/**
 * @param {Float32Array} inputL
 * @param {Float32Array} inputR
 */
function interleave(inputL, inputR) {
	let length = inputL.length + inputR.length
	let result = new Float32Array(length)

	let index = 0
	let inputIndex = 0

	while (index < length) {
		result[index++] = inputL[inputIndex]
		result[index++] = inputR[inputIndex]
		inputIndex++
	}
	return result
}

function webaudioSampleTo16BitPCM(sample) {
	let clample = Math.max(-1, Math.min(1, sample))
	return clample < 0 ? clample * 0x8000 : clample * 0x7fff
}
