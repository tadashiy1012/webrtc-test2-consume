import {Bowl} from '../util';
import {SimpleState} from './SimpleState';
import {ListState} from './ListState';
import {PeerConnState} from './PeerConnState';

export default class ConsumeStore extends SimpleState(ListState(PeerConnState(Bowl))) {}