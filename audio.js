// Web Audio API Sound Synthesizer - Không cần tải file âm thanh ngoài
class SoundController {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, startVol = 0.2, endVol = 0) {
        if (!this.enabled) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(startVol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(Math.max(endVol, 0.0001), this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.error(e);
        }
    }

    playMove() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) {}
    }

    playDash() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.22);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) {}
    }

    playAttack() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const bufferSize = this.ctx.sampleRate * 0.18;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.frequency.exponentialRampToValueAtTime(300, now + 0.18);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        } catch (e) {}
    }

    playHit() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {}
    }

    playShield() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        } catch (e) {}
    }

    playClash() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            [580, 890].forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now);
                osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
            });
        } catch (e) {}
    }

    playSelect() {
        this.playTone(520, 'sine', 0.08, 0.15);
    }

    playUndo() {
        this.playTone(320, 'sine', 0.08, 0.15);
    }

    playCommit() {
        this.init();
        this.playTone(440, 'triangle', 0.1, 0.2);
        setTimeout(() => this.playTone(660, 'triangle', 0.18, 0.25), 90);
    }

    playVictory() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 'triangle', 0.35, 0.25), idx * 140);
        });
    }

    playDefeat() {
        const notes = [440, 392, 349, 293];
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 'sawtooth', 0.4, 0.25), idx * 160);
        });
    }

    playSilencedPistol() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            // 1. Tiếng phập giảm thanh trầm (Low thud)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);

            // 2. Tiếng xì khói giảm thanh (Suppressed noise puff)
            const bufferSize = this.ctx.sampleRate * 0.09;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(150, now + 0.09);
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.2, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        } catch (e) {}
    }

    playRifleShot() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            for (let i = 0; i < 3; i++) {
                const burstTime = now + i * 0.045;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(650 - i * 80, burstTime);
                osc.frequency.exponentialRampToValueAtTime(80, burstTime + 0.035);
                gain.gain.setValueAtTime(0.2, burstTime);
                gain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.035);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(burstTime);
                osc.stop(burstTime + 0.035);
            }
        } catch (e) {}
    }

    playRocketLaunch() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(750, now + 0.28);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.28);
        } catch (e) {}
    }

    playExplosion() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.45);
        } catch (e) {}
    }

    playGrenadeTick() {
        this.playTone(920, 'sine', 0.06, 0.25);
    }

    playAdrenaline() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            // Tiếng tiêm thuốc rít (Injection hiss)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);

            // Nhịp tim kích hoạt Adrenaline (Heartbeat surge)
            setTimeout(() => {
                this.playTone(100, 'triangle', 0.1, 0.35);
                setTimeout(() => this.playTone(85, 'triangle', 0.12, 0.3), 110);
            }, 180);
        } catch (e) {}
    }

    playHookThrow() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            // Tiếng vung xích kim loại xé gió
            for (let i = 0; i < 4; i++) {
                const chainTime = now + i * 0.035;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(700 + (i % 2) * 350, chainTime);
                osc.frequency.exponentialRampToValueAtTime(300, chainTime + 0.03);
                gain.gain.setValueAtTime(0.16, chainTime);
                gain.gain.exponentialRampToValueAtTime(0.001, chainTime + 0.03);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(chainTime);
                osc.stop(chainTime + 0.03);
            }
        } catch (e) {}
    }

    playHookPull() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            // Tiếng kim loại cắn vào thịt & giật xích kéo mạnh
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {}
    }

    playCigarette() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            // 1. Tiếng bật lửa zippo tanh tách (flint strike click)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.03);

            // 2. Tiếng rít thuốc xèo xèo & luồng khói bốc lên (sizzle puff)
            const bufferSize = this.ctx.sampleRate * 0.35;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1200, now + 0.03);
            filter.frequency.linearRampToValueAtTime(800, now + 0.35);
            filter.Q.value = 2.0;
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.2, now + 0.03);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now + 0.03);
        } catch (e) {}
    }

    playBombLauncher() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            // 1. Tiếng thụt nòng súng phóng bom (Thump)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);

            // 2. Tiếng đạn bom lao xé gió (Whoosh)
            const bufferSize = this.ctx.sampleRate * 0.2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufferSize);
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(600, now);
            filter.frequency.linearRampToValueAtTime(250, now + 0.2);
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.25, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        } catch (e) {}
    }

    playPulseRifle() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            // 1. Tia năng lượng xung điện cao tần
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(950, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);

            // 2. Tiếng nổ laser giòn giã
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(420, now);
            osc2.frequency.exponentialRampToValueAtTime(80, now + 0.12);
            gain2.gain.setValueAtTime(0.35, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);
            osc2.start(now);
            osc2.stop(now + 0.12);
        } catch (e) {}
    }

    playLeap() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            // Động cơ phản lực bật nhảy vút cao
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(650, now + 0.18);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);

            // Gió rít khi lao vút
            const bufferSize = this.ctx.sampleRate * 0.2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufferSize);
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.linearRampToValueAtTime(1400, now + 0.2);
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.2, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        } catch (e) {}
    }

    playCyberBladeSlash() {
        this.init();
        try {
            const now = this.ctx.currentTime;
            // 1. Tiếng chém kiếm công nghệ rền vang, năng lượng cực mạnh
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);

            // 2. Tiếng xé toang không gian chém quét 3x2
            const bufferSize = this.ctx.sampleRate * 0.28;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1600, now);
            filter.frequency.exponentialRampToValueAtTime(350, now + 0.28);
            filter.Q.value = 3.0;
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.35, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        } catch (e) {}
    }
}

window.soundCtrl = new SoundController();
