/**
 * AudioSubsystem handles BGM, SFX, UI, and Ambient playback with a structured bus system.
 * It supports manifest-based sound registration and decoupled volume control.
 */
export class AudioSubsystem {
    private eventBus: any;
    private currentBGM: HTMLAudioElement | null = null;
    private sounds: Map<string, string> = new Map();

    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private uiGain: GainNode | null = null;
    private ambientGain: GainNode | null = null;

    constructor(eventBus: any) {
        this.eventBus = eventBus;
        this.initAudioContext();
        this.registerEventListeners();
    }

    private initAudioContext(): void {
        if (typeof window === 'undefined') return;

        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            if (!AudioContextClass) return;

            this.audioContext = new AudioContextClass();

            // Create Gain Nodes
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            this.uiGain = this.audioContext.createGain();
            this.ambientGain = this.audioContext.createGain();

            // Bus Routing: music/sfx/ui/ambient -> master -> destination
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.uiGain.connect(this.masterGain);
            this.ambientGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            // Silently fail if Web Audio is unsupported
        }
    }

    private registerEventListeners(): void {
        if (this.eventBus && typeof this.eventBus.on === 'function') {
            this.eventBus.on("AUDIO_PLAY_BGM", (data: { id: string }) => this.playBGM(data.id));
            this.eventBus.on("AUDIO_STOP_BGM", () => this.stopBGM());
            this.eventBus.on("AUDIO_PLAY_SFX", (data: { id: string }) => this.playSFX(data.id));
            this.eventBus.on("AUDIO_FADE_IN_BGM", (data: { id: string, duration: number }) => this.fadeInBGM(data.id, data.duration));
            this.eventBus.on("AUDIO_FADE_OUT_BGM", (data: { duration: number }) => this.fadeOutBGM(data.duration));

            // Bus & Manifest Events
            this.eventBus.on("AUDIO_SET_VOLUME", (data: { bus: string, value: number }) => this.setVolume(data.bus, data.value));
            this.eventBus.on("AUDIO_LOAD_MANIFEST", (data: { path: string }) => this.loadManifest(data.path));
        }
    }

    public registerSound(id: string, path: string): void {
        this.sounds.set(id, path);
    }

    /**
     * Formal Compliance API: Public check for bus existence.
     */
    public hasBus(name: "music" | "sfx" | "ui" | "ambient"): boolean {
        switch (name) {
            case "music": return this.musicGain !== undefined;
            case "sfx": return this.sfxGain !== undefined;
            case "ui": return this.uiGain !== undefined;
            case "ambient": return this.ambientGain !== undefined;
            default: return false;
        }
    }

    /**
     * Formal Compliance API: Retrieve all registered sound IDs.
     */
    public getRegisteredSoundIds(): string[] {
        return Array.from(this.sounds.keys());
    }

    /**
     * Formal Compliance API: Loads manifest from a plain object.
     */
    public async loadManifestFromObject(manifest: any): Promise<void> {
        const categories = ["music", "sfx", "ui", "ambient"];
        for (const category of categories) {
            if (manifest[category]) {
                for (const [id, path] of Object.entries(manifest[category])) {
                    this.registerSound(id, path as string);
                }
            }
        }
    }

    /**
     * Loads a JSON manifest and registers sound paths.
     */
    public async loadManifest(manifestPath: string): Promise<void> {
        try {
            if (typeof fetch === 'undefined') return;
            const response = await fetch(manifestPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const manifest = await response.json();
            await this.loadManifestFromObject(manifest);
        } catch (e) {
            console.error("AudioSubsystem: Failed to load manifest", e);
        }
    }

    /**
     * Sets volume for a specific bus.
     */
    public setVolume(bus: string, value: number): void {
        if (!this.audioContext) return;

        let targetNode: GainNode | null = null;
        switch (bus) {
            case "master": targetNode = this.masterGain; break;
            case "music": targetNode = this.musicGain; break;
            case "sfx": targetNode = this.sfxGain; break;
            case "ui": targetNode = this.uiGain; break;
            case "ambient": targetNode = this.ambientGain; break;
        }

        if (targetNode) {
            const now = this.audioContext.currentTime;
            targetNode.gain.setTargetAtTime(value, now, 0.05);
        }
    }

    public playBGM(id: string): void {
        const path = this.sounds.get(id);
        if (!path) return;

        this.stopBGM();

        this.currentBGM = new Audio(path);
        this.currentBGM.loop = true;

        if (this.audioContext && this.musicGain) {
            try {
                const source = this.audioContext.createMediaElementSource(this.currentBGM);
                source.connect(this.musicGain);
            } catch (e) { }
        }

        this.currentBGM.play().catch(() => { });
    }

    public stopBGM(): void {
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM = null;
        }
    }

    public playSFX(id: string): void {
        const path = this.sounds.get(id);
        if (!path) return;

        const sfx = new Audio(path);
        if (this.audioContext && this.sfxGain) {
            try {
                const source = this.audioContext.createMediaElementSource(sfx);
                source.connect(this.sfxGain);
            } catch (e) { }
        }
        sfx.play().catch(() => { });
    }

    public fadeInBGM(id: string, duration: number): void {
        this.playBGM(id);
        if (this.audioContext && this.musicGain) {
            const now = this.audioContext.currentTime;
            this.musicGain.gain.cancelScheduledValues(now);
            this.musicGain.gain.setValueAtTime(0, now);
            this.musicGain.gain.linearRampToValueAtTime(1.0, now + duration);
        }
    }

    public fadeOutBGM(duration: number): void {
        if (this.audioContext && this.musicGain) {
            const now = this.audioContext.currentTime;
            const currentVolume = this.musicGain.gain.value;
            this.musicGain.gain.cancelScheduledValues(now);
            this.musicGain.gain.setValueAtTime(currentVolume, now);
            this.musicGain.gain.linearRampToValueAtTime(0, now + duration);
        }
    }
}
