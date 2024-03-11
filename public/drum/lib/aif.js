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
