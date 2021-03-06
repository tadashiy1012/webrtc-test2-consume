/** @jsx jsx */
import {jsx, css} from '@emotion/core';
import {inject, observer} from 'mobx-react';
import React, {Fragment} from 'react';
import {makeConsumeDataChPC, makeConsumePC, tArray2String, mq} from '../util';
import ChatView from './ChatView';
import SelfVideoView from './SelfVideoView';
import RemoteVideoView from './RemoteVideoView';
import MessageSender from './MessageSender';

@inject('root', 'consume')
@observer
export default class Consume extends React.Component {
    constructor(props) {
        super(props);
        this.props.root.setMode('consume');
        const params = (new URL(document.location)).searchParams;
        const key = params.get('key') || 'default';
        this.props.consume.setKey(key);
        this.props.consume.createWebSocket();
        this.props.consume.setWsOnMessageHandler((ev) => {
            console.log(ev);
            const json = JSON.parse(ev.data);
            console.log(json);
            if (json.destination !== this.props.consume.id) {
                console.log('destination miss match. this message is not to me.');
                return;
            }
            if (json.type === 'produce') {
                if (this.props.consume.pc !== null 
                        && this.props.consume.id === json.destination) {
                    console.log('message to me (pc)');
                    this.props.consume.setRecievedAnswer(json.sdp);
                }
            } else if (json.type === 'produce_dc') {
                if (this.props.consume.dcPc !== null
                        && this.props.consume.id === json.destination) {
                    console.log('message to me (dcPc)');
                    this.props.consume.setDcRecievedAnswer(
                        json.sdp,
                        this.props.consume.key,
                        this.props.root.env
                    );
                }
            }
        });
        this.props.consume.setPC(makeConsumePC(
            this.props.consume.id, 
            this.props.consume.ws, 
            this.props.consume.key
        ));
        this.props.consume.setPcOnTrackHandler((ev) => {
            console.log(ev);
            console.log(ev.streams[0].getTracks());
            this.props.consume.setRecorder(ev.streams[0]);
            this.props.consume.target.srcObject = ev.streams[0];
        });
        this.props.consume.setDcPC(makeConsumeDataChPC(
            this.props.consume.id, 
            this.props.consume.ws,
            this.props.consume.key, 
            this.props.root.env
        ));
        this.props.consume.dcPc.createDataCh();
        this.props.consume.dcPc.setOnMessageHandler((ev) => {
            console.log(ev);
            if (typeof ev.data === 'string') {
                const json = JSON.parse(ev.data);
                this.props.consume.addSay(json.id, json.message);
            } else if (ev.data instanceof ArrayBuffer) {
                const tary = new Uint8Array(ev.data);
                if (tary.length === 1 && tary[0] === 0) {
                    const joined = this.props.consume.joinChunk();
                    const header = joined.slice(0, 100);
                    const id = tArray2String(header.slice(0, 36));
                    const type = header.slice(36);
                    const file = joined.slice(100);
                    const typeStr = tArray2String(type.slice(0, type.indexOf(0)));
                    const blob = new Blob([file], {type: typeStr});
                    console.log(blob);
                    this.props.consume.addObj(id, blob);
                    this.props.consume.clearChunk();
                } else if (tary.length > 0) {
                    this.props.consume.pushChunk(tary);
                }
            }
        });
    }
    componentWillUnmount() {
        console.log('consume component unmount');
        this.props.consume.setWsOnMessageHandler(() => {});
        this.props.consume.unsetWebSocket();
        this.props.consume.setPC(null);
        this.props.consume.setDcPC(null);
        this.props.consume.setTarget(null);
        this.props.consume.setStream(null);
        this.props.consume.setStreamSelf(null);
        this.props.consume.unsetRecorder();
        this.props.consume.clearSays();
        this.props.consume.clearObjects();
        this.props.consume.regenerateId();
    }
    render() {
        return <Fragment>
            <div className='row no-gutters'>
                <div className='col-md-9'>
                    <RemoteVideoView />
                </div>
                <div className='col-md-3' css={{[mq[0]]: {position:'absolute'}, [mq[2]]: {position:'static'}}}>
                    <SelfVideoView />
                    <MessageSender />
                </div>
            </div>
            <ChatView />
        </Fragment>
    }
}
