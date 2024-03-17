let parser = new DOMParser()

/**
 * @typedef {{
		oscAVolume: number
		oscAPitch: number
		oscAPhaseWidth: number
		carrier1Feedback: number
		oscAWavetablePosition: number
		noiseVolume: number
		oscBVolume: number
		oscBPitch: number
		oscBPhaseWidth: number
		carrier2Feedback: number
		oscBWavetablePosition: number
		modulator1Volume: number
		modulator1Pitch: number
		modulator1Feedback: number
		modulator2Volume: number
		modulator2Pitch: number
		modulator2Feedback: number
		stutterRate: number
		volumePostFX: number
		pitch: number
		pan: number
		sampleRateReduction: number
		bitcrushAmount: number
		portamento: number
		waveFold: number
		env1Release: number
		env1Sustain: number
		env1Decay: number
		env1Attack: number
		lpfMorph: number
		lpfResonance: number
		lpfFrequency: number
		env2Release: number
		env2Sustain: number
		env2Decay: number
		env2Attack: number
		hpfMorph: number
		hpfResonance: number
		hpfFrequency: number
		volumePostReverbSend: number
		compressorShape: number
		bass: number
		bassFreq: number
		arpRate: number
		arpGate: number
		treble: number
		trebleFreq: number
		lfo1Rate: number
		modFXOffset: number
		modFXFeedback: number
		modFXDepth: number
		modFXRate: number
		lfo2Rate: number
		reverbAmount: number
		delayRate: number
		delayFeedback: number
	}} MIDIFollowMap
 */

/**
 * @param {string} midifollowXML
 * @returns {MIDIFollowMap}
 */
export default function createMIDIFollowMap(midifollowXML = midifollowxml) {
	let doc = parser.parseFromString(midifollowXML, "text/xml")
	let cc = doc.querySelector("defaultCCMappings")
	if (!cc) {
		throw new Error("document is not a MIDIFollow.XML")
	}

	return [].reduce.call(
		cc.children,
		(map, child) => {
			map[child.nodeName] = Number(child.textContent)
			return map
		},
		{}
	)
}

let midifollowxml = `<?xml version="1.0" encoding="UTF-8"?>
<defaults>
	<defaultCCMappings>
		<oscAVolume>21</oscAVolume>
		<oscAPitch>12</oscAPitch>
		<oscAPhaseWidth>23</oscAPhaseWidth>
		<carrier1Feedback>24</carrier1Feedback>
		<oscAWavetablePosition>25</oscAWavetablePosition>
		<noiseVolume>41</noiseVolume>
		<oscBVolume>26</oscBVolume>
		<oscBPitch>13</oscBPitch>
		<oscBPhaseWidth>28</oscBPhaseWidth>
		<carrier2Feedback>29</carrier2Feedback>
		<oscBWavetablePosition>30</oscBWavetablePosition>
		<modulator1Volume>54</modulator1Volume>
		<modulator1Pitch>14</modulator1Pitch>
		<modulator1Feedback>55</modulator1Feedback>
		<modulator2Volume>56</modulator2Volume>
		<modulator2Pitch>15</modulator2Pitch>
		<modulator2Feedback>57</modulator2Feedback>
		<stutterRate>255</stutterRate>
		<volumePostFX>7</volumePostFX>
		<pitch>3</pitch>
		<pan>10</pan>
		<sampleRateReduction>63</sampleRateReduction>
		<bitcrushAmount>62</bitcrushAmount>
		<portamento>5</portamento>
		<waveFold>19</waveFold>
		<env1Release>72</env1Release>
		<env1Sustain>76</env1Sustain>
		<env1Decay>75</env1Decay>
		<env1Attack>73</env1Attack>
		<lpfMorph>70</lpfMorph>
		<lpfResonance>71</lpfResonance>
		<lpfFrequency>74</lpfFrequency>
		<env2Release>80</env2Release>
		<env2Sustain>79</env2Sustain>
		<env2Decay>78</env2Decay>
		<env2Attack>77</env2Attack>
		<hpfMorph>83</hpfMorph>
		<hpfResonance>82</hpfResonance>
		<hpfFrequency>81</hpfFrequency>
		<volumePostReverbSend>61</volumePostReverbSend>
		<compressorShape>60</compressorShape>
		<bass>86</bass>
		<bassFreq>84</bassFreq>
		<arpRate>51</arpRate>
		<arpGate>50</arpGate>
		<treble>87</treble>
		<trebleFreq>85</trebleFreq>
		<lfo1Rate>58</lfo1Rate>
		<modFXOffset>18</modFXOffset>
		<modFXFeedback>17</modFXFeedback>
		<modFXDepth>93</modFXDepth>
		<modFXRate>16</modFXRate>
		<lfo2Rate>59</lfo2Rate>
		<reverbAmount>91</reverbAmount>
		<delayRate>53</delayRate>
		<delayFeedback>52</delayFeedback>
	</defaultCCMappings>
</defaults>
`
