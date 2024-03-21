/**
 * @param {ArrayBuffer} pcm
 */
export function decode16BitPCM(
	pcm,
	/** @type {{numberOfChannels: number, sampleRate: number, littleEndian?: boolean}} */
	{numberOfChannels, sampleRate, littleEndian = true}
) {
	let audiobuffer = new AudioBuffer({
		numberOfChannels,
		length: pcm.byteLength / numberOfChannels / 2,
		sampleRate
	})
	for (let channel = 0; channel < numberOfChannels; channel++) {
		let channelData = audiobuffer.getChannelData(channel)
		let view = new DataView(pcm)

		for (
			let i = 0, j = channel * 2;
			i < channelData.length;
			i++, j += numberOfChannels * 2
		) {
			let sample = view.getInt16(j, littleEndian)
			channelData[i] = sample / 0x8000
		}
	}
	return audiobuffer
}

/**
 * @param {File} file
 */
export function isAIF(file) {
	return (
		["audio/aiff", "audio/x-aiff"].includes(file.type) ||
		(file.type == "" && file.name.match(/\.aif(f|c)?$/))
	)
}

/** @param {ArrayBuffer} arraybuffer */
export function toAudiobuffer(arraybuffer) {
	let view = new DataView(arraybuffer)
	let sampleRate = -1
	let numberOfChannels = -1
	/** @type {ArrayBuffer} */
	let ssnd
	let textDecoder = new TextDecoder()

	for (let offset = 0; offset + 4 < arraybuffer.byteLength; offset += 1) {
		let id = textDecoder.decode(arraybuffer.slice(offset, offset + 4))

		// todo write a chunk lib
		if (id == "COMM") {
			// let _len = view.getUint32(offset + 4)
			numberOfChannels = view.getInt16(offset + 8)
			// let _numSampleFrames = view.getUint32(offset + 10)
			// `10` tells us this 16-bit audio
			// let _sampleSize = view.getInt16(offset + 14)
			/* lmao i have no idea how to read a long	double */
			// https://wiki.multimedia.cx/index.php/Audio_Interchange_File_Format
			/*
			 * SignBit  	1 bit
			 * Exponent 	15 bits
			 * Mantissa 	64 bits
			 */
			// i think on the op-1 and field it's always
			// `0x400EAC44000000000000`, i.e. 44.1k
			sampleRate = 44100
		}

		if (id == "SSND") {
			let len = view.getUint32(offset + 4)
			ssnd = arraybuffer.slice(offset + 8, offset + 8 + len)
		}
	}

	let audiobuffer = decode16BitPCM(ssnd, {
		numberOfChannels,
		sampleRate,
		littleEndian: true
	})

	return new Sample(audiobuffer, name)
}
