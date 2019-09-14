/** @jsx jsx */
import {jsx, css} from '@emotion/core';
import React, {Fragment} from 'react';
import {observer, inject} from 'mobx-react';
import {mq} from '../util'

@inject('consume')
@observer
export default class MessageSender extends React.Component {
    constructor(props) {
        super(props);
        this.textRef = React.createRef();
    }
    handleSendClick() {
        this.props.consume.addSay('[me]', this.textRef.current.value);
        this.props.consume.dcPc.send(this.textRef.current.value);
    }
    render() {
        return <Fragment>
            <div className='row' css={{[mq[0]]:{display:'none'}, [mq[2]]:{display:'block'}}}>
                <div className='col-12'>
                    <textarea ref={this.textRef} rows='3' placeholder='message' className='form-control'></textarea>
                </div>
                <div className='col-12' css={{marginTop:'4px'}}>
                    <button onClick={() => {this.handleSendClick()}} className='btn btn-primary btn-block'>send message</button>
                </div>
            </div>
        </Fragment>
    }
}