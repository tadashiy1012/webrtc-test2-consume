import {observable, action} from 'mobx';
import {decode} from 'base64-arraybuffer-es6';
import {makeConsumePC, makeConsumeDataChPC, tArray2String} from '../util';

const PeerConnState = Base => class extends Base {
    
    @observable pc = null;
    @observable dcPc = null;

    chunk = [];

    @action
    setPC(pc) {
        this.pc = pc;
    }

    @action
    addTrackToPc() {
        const senders = this.pc.conn.getSenders();
        console.log(senders, this.streamSelf);
        this.streamSelf.getTracks().forEach(track => {
            if (senders.length > 0 && track.kind === 'video') {
                const videoSender = senders.find(e => e.track.kind === 'video');
                if (videoSender) {
                    videoSender.replaceTrack(track);
                } else {
                    this.pc.addTrack(track, this.streamSelf);
                }
            } else if (senders.length > 0 && track.kind === 'audio') {
                const audioSender = senders.find(e => e.track.kind === 'audio');
                if (audioSender) {
                    audioSender.replaceTrack(track);
                } else {
                    this.pc.addTrack(track, this.streamSelf);
                }
            } else {
                this.pc.addTrack(track, this.streamSelf);
            }
        });
    }
    
    @action
    setRecievedAnswer(sdp) {
        const recievedAnswer = new RTCSessionDescription({
            type: 'answer', sdp
        });
        (async () => {
            if (this.pc.conn.remoteDescription !== null 
                    && this.pc.conn.remoteDescription !== recievedAnswer) {
                this.setPC(makeConsumePC(this.id, this.ws, true));
                await this.pc.setLocalDesc(await this.pc.createOffer());
            }
            await this.pc.setRemoteDesc(recievedAnswer);
        })();
    }

    @action
    setPcOnTrackHandler(handler) {
        this.pc.conn.ontrack = handler;
    }

    @action
    setDcPC(dcPc) {
        this.dcPc = dcPc;
    }

    @action
    setDcOnMessage() {
        this.dcPc.setOnMessageHandler((ev) => {
            console.log(ev);
            if (typeof ev.data === 'string') {
                const json = JSON.parse(ev.data);
                if (json.type === 'plane') {
                    this.addSay(json.id, json.message);
                } else if (json.type === 'b64') {
                    const buf = decode(json.message);
                    const tary = new Uint8Array(buf);
                    const header = tary.slice(0, 100);
                    const id = header.slice(0, 36);
                    const type = header.slice(36);
                    const file = tary.slice(100);
                    const typeStr = tArray2String(type.slice(0, type.indexOf(0)));
                    const blob = new Blob([file], {type: typeStr});
                    console.log(blob);
                    this.addObj(tArray2String(id), blob);
                }
            } else {
                if (ev.data instanceof ArrayBuffer) {
                    const tary = new Uint8Array(ev.data);
                    if (tary.length === 1 && tary[0] === 0) {
                        const len = this.chunk.reduce((prev, next) => {
                            return prev + next.length;
                        }, 0);
                        const tary = this.chunk.reduce((prev, next, index, it) => {
                            const offset = it.reduce((p, n, idx) => {
                                return idx < index ? p + n.length : p;
                            }, 0);
                            prev.set(next, offset);
                            return prev;
                        }, new Uint8Array(len));
                        const header = tary.slice(0, 100);
                        const id = header.slice(0, 36);
                        const type = header.slice(36);
                        const file = tary.slice(100);
                        const typeStr = tArray2String(type.slice(0, type.indexOf(0)));
                        const blob = new Blob([file], {type: typeStr});
                        console.log(blob);
                        this.addObj(tArray2String(id), blob);
                        this.chunk = [];
                    } else if (tary.length > 0) {
                        this.chunk.push(tary);
                    }
                }
            }
        });
    }

    @action
    setDcRecievedAnswer(sdp, key, env) {
        const recievedAnswer = new RTCSessionDescription({
            type: 'answer', sdp
        });
        (async () => {
            if (this.dcPc.conn.remoteDescription !== null) {
                if (this.dcPc.conn.remoteDescription !== recievedAnswer) {
                    this.setDcPC(makeConsumeDataChPC(this.id, this.ws, key, env, true));
                    await this.dcPc.setLocalDesc(await this.dcPc.createOffer());
                    this.setDcOnMessage();
                }
            } else {
                await this.dcPc.setRemoteDesc(recievedAnswer);
            }
        })();
    }

}

export {
    PeerConnState
};