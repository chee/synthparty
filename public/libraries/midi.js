export const MIDIMessage = {
	NoteOff: 0x8 << 4,
	NoteOn: 0x9 << 4,
	Pressure: 0xa << 4,
	ControlChange: 0xb << 4,
	ProgramChange: 0xd << 4,
	PitchBend: 0xe << 4
}

export const MIDIControlChange = {
	Timbre: 74,
	MPEY: 74
}

const FOURTEEN_BITS = (1 << 14) - 1

/**
 * lerp a number between 0 and 1 to a 14-bit msb, lsb pair
 * @param {number} norm a number between 0 and 1
 */
export function scaleTo14bit(norm) {
	let nLevel = Math.round(norm * FOURTEEN_BITS)
	let msb = (nLevel >> 7) & 0x7f
	let lsb = nLevel & 0x7f
	return [msb, lsb]
}

/** @param {number} norm a number between -1 and 1 */
export function scaleBipolarTo14bit(norm) {
	return scaleTo14bit((norm + 1) / 2)
}
