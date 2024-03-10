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

	return encodeWAV(result, sampleRate, numChannels, index + 1)
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
	let head = 44
	let tail = 32
	let bufferlength = head + samplelength + tail + 8 + 7
	let buffer = new ArrayBuffer(bufferlength)
	let view = new DataView(buffer)

	let offset = 0
	// RIFF identifier
	writeString(view, offset, "RIFF")
	// RIFF chunk length
	view.setUint32((offset += 4), bufferlength - 8, true)
	// RIFF type
	writeString(view, (offset += 4), "WAVE")
	// format chunk identifier
	writeString(view, (offset += 4), "fmt ")
	// format chunk length
	view.setUint32(16, (offset += 4), true)
	// sample format (raw)
	view.setUint16((offset += 4), 1, true)
	// channel count
	view.setUint16((offset += 2), numChannels, true)
	// sample rate
	view.setUint32((offset += 2), sampleRate, true)
	// byte rate (sample rate * block align)
	view.setUint32((offset += 4), sampleRate * blockAlign, true)
	// block align (channel count * bytes per sample)
	view.setUint16((offset += 4), blockAlign, true)
	// bits per sample
	view.setUint16((offset += 2), 8 * bytesPerSample, true)
	// data chunk identifier
	writeString(view, (offset += 2), "data")
	// data chunk length
	view.setUint32((offset += 4), samplelength, true)
	floatTo16BitPCM(view, (offset += 4), samples)

	/* write the smpl chunk for multisamples */
	writeString(view, (offset += samplelength), "smpl")

	// chunk size
	view.setUint32((offset += 4), tail - 8, true)

	// manufacturer. should i make it 0x01000041 for Roland? selling knock-off
	// Roland wave files down the market
	view.setUint32((offset += 4), 0, true)

	// product.
	view.setUint32((offset += 4), 0, true)

	// sample period: sample-rate 44.1k
	view.setUint32((offset += 4), 0x5893, true)

	// midi note 1-127, if anyone ever adds more than 127 rows i don't know what
	// will happen to them
	view.setUint32((offset += 4), note, true)

	view.setUint32((offset += 4), 0, true)
	writeString(view, (offset += 4), "chee")

	/* write the inst chunk for multisamples */
	writeString(view, (offset += 4), "inst")
	// idgaf i'll write every chunk going
	view.setUint32((offset += 4), 7, true)
	view.setUint32((offset += 4), note, true)

	return buffer
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

/**
 * @param {DataView} view
 * @param {number} offset
 * @param {Float32Array} input
 */
function floatTo16BitPCM(view, offset, input) {
	for (let i = 0; i < input.length; i++, offset += 2) {
		let s = Math.max(-1, Math.min(1, input[i]))
		view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
	}
}

/**
 * @param {DataView} view
 * @param {number} offset
 * @param {string} string
 */
function writeString(view, offset, string) {
	const textEncoder = new TextEncoder()
	let encodedString = textEncoder.encode(string)
	for (let i = 0; i < encodedString.length; i++) {
		view.setUint8(offset + i, encodedString[i])
	}
}
