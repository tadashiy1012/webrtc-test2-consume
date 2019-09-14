/** @jsx jsx */
import React, {Fragment} from 'react';
import {observer, inject} from 'mobx-react';
import {jsx, css} from '@emotion/core';
import {mq} from '../util';
import PDFView from './PdfView';

@inject('consume')
@observer
export default class ConsumeChatView extends React.Component {
    constructor(props) {
        super(props);
        this.textRef = React.createRef();
    }
    handleSendClick() {
        this.props.consume.addSay('[me]', this.textRef.current.value);
        this.props.consume.dcPc.send(this.textRef.current.value);
    }
    render() {
        const ary = [...this.props.consume.says, ...this.props.consume.objects].sort((a, b) => a.time - b.time);
        const children = ary.map((e, idx) => {
            console.log(e);
            if (e.say) {
                return <li key={idx}><span>{e.id.substring(0, 5)}</span> : <span>{e.say}</span></li>
            } else {
                if (e.obj.type === 'image/jpeg') {
                    return <li key={idx}>
                        <span>{e.id.substring(0, 5)}</span> : 
                        <div css={{padding:'2px'}}>
                            <img src={URL.createObjectURL(e.obj)} css={{
                                [mq[0]]: {width:'30%'}, [mq[2]]: {width:'30%'}, border:'solid 1px #ccc'
                            }} />
                            <br />
                            <a href={URL.createObjectURL(e.obj)} download='file'>download</a>
                        </div>
                    </li>
                } else if (e.obj.type === 'application/pdf') {
                    return <li key={idx}>
                        <span>{e.id.substring(0, 5)}</span> : 
                        <div className='card' css={{padding:'22px'}}>
                            <PDFView tgt={e} />
                            <a href={URL.createObjectURL(e.obj)} download='file'>download</a>
                        </div>
                    </li>
                } else {
                    return <li key={idx}>
                        <span>{e.id.substring(0, 5)}</span> : 
                        <a href={URL.createObjectURL(e.obj)} download='file'>download</a>
                    </li>
                }
            }
        }).reverse();
        return <Fragment>
            <div className='row'>
                <div className='col'>
                    <h4>chat log</h4>
                    <ul className='overflow-auto' css={{[mq[0]]:{height:'100px'}, [mq[2]]:{height:'260px'}, width:'100%'}}>
                        {children}
                    </ul>
                </div>
            </div>
            <div className='row' css={{[mq[0]]:{display:'block'}, [mq[2]]:{display:'none'}}}>
                <div className='col-12 col-md-9'>
                    <input type='text' ref={this.textRef} placeholder='message' className='form-control' />
                </div>
                <div className='col-12 col-md-3'>
                    <button onClick={() => {this.handleSendClick()}} className='btn btn-primary btn-block'>send message</button>
                </div>
            </div>
        </Fragment>
    }
}