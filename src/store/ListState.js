import {observable, action} from 'mobx';
import {getDoc} from '../util';

const ListState = Base => class extends Base {
    
    @observable says = [];
    @observable objects = [];
    @observable chunk = [];

    @action
    addSay(id, say) {
        const time = Date.now();
        this.says.push({id, time, say});
    }

    @action
    clearSays() {
        this.says = [];
    }

    @action
    addObj(id, obj) {
        const time = Date.now();
        const tgt = {id, time, obj, pdf: null};
        this.objects.push(tgt);
    }

    @action
    clearObjects() {
        this.objects = [];
    }

    @action
    readPdf(object) {
        const tgt = this.objects.find(e => e.time === object.time);
        getDoc(object.obj).then((result) => {
            console.log(result);
            tgt.pdf = result;
        });
    }

    @action
    pushChunk(data) {
        this.chunk.push(data);
    }

    @action
    clearChunk() {
        this.chunk = [];
    }

    @action
    getChunkLength() {
        return this.chunk.reduce((prev, next) => prev + next.length, 0);
    }

    @action
    joinChunk() {
        return this.chunk.reduce((prev, next, index, it) => {
            const offset = it.reduce((p, n, idx) => idx < index ? p + n.length : p, 0);
            prev.set(next, offset);
            return prev;
        }, new Uint8Array(this.getChunkLength()));
    }

}

export {
    ListState
};