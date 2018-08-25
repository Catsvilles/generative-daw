import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { Title }     from '@angular/platform-browser';

import { PianoRollComponent } from './piano-roll.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {
    private audioContext: AudioContext;
    @ViewChild(PianoRollComponent) pianoRoll;

    public constructor(private titleService: Title ) { }

    public setTitle( newTitle: string) {
        this.titleService.setTitle( newTitle );
    }

    ngOnInit() {
        this.setTitle('GenerativeDAW');
        this.audioContext = new AudioContext();
        this.tempo = 180;
        this.tracks = [];
        this.notes = [];
        this.audioBuffers = {};
        this.timeStateLength = 8;
        this.inPlayState = false;
        this.queuedSounds = [];
    }

    ngAfterViewInit() {
        this.tracks[0] = this.pianoRoll.gridState;
        this.notes = this.pianoRoll.notes;

        for (let note of this.notes) {
            this.audioBuffers[note.note + note.octave] = 0;
        }

        this.fetchNoteSamples();
    }

    playNoteDrawn(soundName) {
        this.playSound(soundName, 0);
    }

    togglePlayState() {

        if(this.inPlayState) {
            this.inPlayState = false;
            for (var i = 0; i < this.queuedSounds.length; i++) {
                this.queuedSounds[i].stop(0);
            }
            this.queuedSounds = [];
            return;
        }
        this.queuedSounds = [];
        this.inPlayState = true;
        for (let note of this.tracks[0]) {
            for (var timeStateIndex = 0; timeStateIndex < note.timeStates.length; timeStateIndex++) {
                if(note.timeStates[timeStateIndex]) {
                    // beat number * seconds per beat
                    var timeToPlay = timeStateIndex * (60 / this.tempo);
                    this.playNote(note.note, note.octave, timeToPlay);
                }
            }
        }
        var root = this;
        setTimeout(function(){
            root.inPlayState = false;
        }, 1000 * root.timeStateLength * 4 * (60 / root.tempo) );
    }

    playNote(noteName : string, noteOctave : number, time : number) {
        this.playSound(noteName + noteOctave, time);
    }

    playSound(soundName, time) {
        let bufferSource = this.audioContext.createBufferSource();
        this.queuedSounds.push(bufferSource);
        bufferSource.buffer = this.audioBuffers[soundName];
        bufferSource.connect(this.audioContext.destination);
        bufferSource.start(this.audioContext.currentTime + time);
    }

    fetchNoteSample(filename) : Promise<AudioBuffer> {
        return fetch(filename)
                .then(response => response.arrayBuffer())
                .then(buffer => {
                    return new Promise((resolve, reject) => {
                        this.audioContext.decodeAudioData(buffer, resolve, reject);
                    })
                });
    }

    fetchNoteSamples() {
        for (let note of this.notes) {
            var filename = 'assets/' + note.note + (note.octave + 1) + '.wav';

            this.fetchNoteSample(filename).then(audioBuffer => {
                this.loadingSample = false;
                this.audioBuffers[note.note + note.octave] = audioBuffer;
            }).catch(error => { throw error; });
        }
    }

}
