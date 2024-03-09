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

/** @param {AudioBuffer} audiobuffer */
export default function audioBufferToWav(audiobuffer) {
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

	return encodeWAV(result, sampleRate, numChannels)
}

/**
 * @param {Float32Array} samples
 * @param {number} sampleRate
 * @param {number} numChannels
 */
export function encodeWAV(samples, sampleRate, numChannels) {
	let bytesPerSample = 2
	let blockAlign = numChannels * bytesPerSample

	let buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
	let view = new DataView(buffer)

	// RIFF identifier
	writeString(view, 0, "RIFF")
	// RIFF chunk length
	view.setUint32(4, 36 + samples.length * bytesPerSample, true)
	// RIFF type
	writeString(view, 8, "WAVE")
	// format chunk identifier
	writeString(view, 12, "fmt ")
	// format chunk length
	view.setUint32(16, 16, true)
	// sample format (raw)
	view.setUint16(20, 1, true)
	// channel count
	view.setUint16(22, numChannels, true)
	// sample rate
	view.setUint32(24, sampleRate, true)
	// byte rate (sample rate * block align)
	view.setUint32(28, sampleRate * blockAlign, true)
	// block align (channel count * bytes per sample)
	view.setUint16(32, blockAlign, true)
	// bits per sample
	view.setUint16(34, 8 * bytesPerSample, true)
	// data chunk identifier
	writeString(view, 36, "data")
	// data chunk length
	view.setUint32(40, samples.length * bytesPerSample, true)
	floatTo16BitPCM(view, 44, samples)
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
