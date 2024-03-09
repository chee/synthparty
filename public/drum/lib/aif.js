// lmao this was written by chatgpt
/*
 * you are a senior software engineer at a client-side DAW company that makes
  billions of dollars. today you have to write code for decoding a simple 16-bit
  linear pcm aif file (with one SSND chunk) to a webaudio audiobuffer in the
  browser. you are fit for this task and you know exactly how to do it. show me
  the code
 */

/** @param {ArrayBuffer} arrayBuffer */
export function decodeAiffToAudioBuffer(arrayBuffer) {
	const audioCtx = new AudioContext()
	const dataView = new DataView(arrayBuffer)

	// AIFF format parsing
	let ssndOffset = 0
	for (let i = 0; i < arrayBuffer.byteLength; i += 4) {
		const chunkId = String.fromCharCode(
			dataView.getUint8(i),
			dataView.getUint8(i + 1),
			dataView.getUint8(i + 2),
			dataView.getUint8(i + 3)
		)
		if (chunkId === "SSND") {
			ssndOffset = i + 8 // Skip chunk size and offset
			break
		}
	}
	if (ssndOffset === 0) throw new Error("SSND chunk not found")

	// Assuming 44.1kHz, mono, 16-bit linear PCM AIFF
	const sampleRate = 44100
	const numChannels = 1
	const audioBuffer = audioCtx.createBuffer(
		numChannels,
		(arrayBuffer.byteLength - ssndOffset) / numChannels / 2,
		sampleRate
	)

	// Convert 16-bit PCM to Float32Array for each channel
	for (let channel = 0; channel < numChannels; channel++) {
		const float32Array = audioBuffer.getChannelData(channel)
		for (
			let i = 0, j = ssndOffset + channel * 2;
			i < float32Array.length;
			i++, j += 4
		) {
			const sample = dataView.getInt16(j, true) // Assuming little-endian
			float32Array[i] = sample / 0x8000
		}
	}

	return audioBuffer
}
