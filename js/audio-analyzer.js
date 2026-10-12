class AudioSliderAnalyzer {
	static BAND_RANGES = {
		bass: [1, 4],
		mid: [4, 20],
		treble: [20, 46],
	};

	static SILENCE_FLOOR = 0.001;
	static MIN_TOTAL_ENERGY = 0.0001;
	static LOUDNESS_POWER = 0.35;
	static BAND_WEIGHT_BASE = 0.45;
	static BAND_WEIGHT_SCALE = 0.75;

	clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	splitAudioChannels(audioArray) {
		if (audioArray.length >= 6 && audioArray.length % 2 === 0) {
			const half = audioArray.length / 2;
			return [audioArray.slice(0, half), audioArray.slice(half)];
		}
		return [audioArray];
	}

	bandAverage(channels, startIndex, endIndex) {
		let total = 0;
		let count = 0;

		channels.forEach((channel) => {
			const start = this.clamp(startIndex, 0, Math.max(0, channel.length - 1));
			const end = this.clamp(endIndex, start + 1, channel.length);
			for (let i = start; i < end && i < channel.length; i++) {
				total += this.clamp(channel[i] || 0, 0, 1);
				count += 1;
			}
		});

		return count > 0 ? total / count : 0;
	}

	getBandEnergies(channels) {
		const { bass, mid, treble } = AudioSliderAnalyzer.BAND_RANGES;
		return {
			bass: this.bandAverage(channels, bass[0], bass[1]),
			mid: this.bandAverage(channels, mid[0], mid[1]),
			treble: this.bandAverage(channels, treble[0], treble[1]),
		};
	}

	getBandWeight(share) {
		return AudioSliderAnalyzer.BAND_WEIGHT_BASE + share * AudioSliderAnalyzer.BAND_WEIGHT_SCALE;
	}

	buildSilentLevels() {
		return { volume: 0, bass: 0, mid: 0, treble: 0 };
	}

	analyze(audioArray, sensitivity) {
		if (!audioArray || audioArray.length === 0) {
			return this.buildSilentLevels();
		}

		const channels = this.splitAudioChannels(audioArray);
		const { bass: bassEnergy, mid: midEnergy, treble: trebleEnergy } = this.getBandEnergies(channels);
		const rawVolume = Math.max(...audioArray);
		const scaledVolume = this.clamp(rawVolume * sensitivity, 0, 1);

		// Nonlinear loudness curve: quiet audio still moves bars noticeably.
		const loudness = Math.pow(scaledVolume, AudioSliderAnalyzer.LOUDNESS_POWER) * 100;
		const totalEnergy = bassEnergy + midEnergy + trebleEnergy;

		if (scaledVolume <= AudioSliderAnalyzer.SILENCE_FLOOR || totalEnergy <= AudioSliderAnalyzer.MIN_TOTAL_ENERGY) {
			return this.buildSilentLevels();
		}

		const bassShare = bassEnergy / totalEnergy;
		const midShare = midEnergy / totalEnergy;
		const trebleShare = trebleEnergy / totalEnergy;

		const bassWeight = this.getBandWeight(bassShare);
		const midWeight = this.getBandWeight(midShare);
		const trebleWeight = this.getBandWeight(trebleShare);

		return {
			volume: scaledVolume,
			bass: this.clamp(loudness * bassWeight, 0, 100),
			mid: this.clamp(loudness * midWeight, 0, 100),
			treble: this.clamp(loudness * trebleWeight, 0, 100),
		};
	}
}

window.AudioSliderAnalyzer = AudioSliderAnalyzer;
