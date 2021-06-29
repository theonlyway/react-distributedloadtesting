import React from 'react';
import {
    Col,
    Row,
    Spinner
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import AceEditor from "react-ace";
import 'brace/theme/github';
import { API, Storage } from 'aws-amplify';
//import awsConfig from '../../aws_config'
declare var awsConfig;


class Settings extends React.Component {
    intervalID;

    constructor(props) {
        super(props);
        this.state = {
            Items: [],
            isLoading: false,
            refresh: false,
            info: false,
            infoText: null,
            engine_name: this.props.engineName,
            engineAlbAddress: "http://" + awsConfig.engine_alb_address,
            locustFile: null
        }
        this.toggleInfo = this.toggleInfo.bind(this);
        this.getLocustFileBody = this.getLocustFileBody.bind(this);
    };

    getEngine = async () => {
        this.setState({ isLoading: true });
        try {
            const data = await API.get('dlts', '/engine/' + this.state.engine_name);
            this.setState({ Items: data.Items, isLoading: false });
            if (data.Items.length === 0) {
                this.setState({ noData: true });
            }
            this.setState({ isLoading: false });
            this.sendTaskCount()
            this.getLocustFileBody(data.Items[0].locustFileName)
            //this.intervalID = setTimeout(this.getItems.bind(this), 30000);
        } catch (err) {
            alert(err);
        }
    };

    getLocustFileBody = async (key) => {
        const formValues = this.state;
        try {
            const file = await Storage.get(key.slice(1), { level: 'public', download: true })
            formValues['locustFile'] = file
        } catch (err) {
            alert(err)
        }
        this.setState({ formValues: formValues });
    };

    toggleInfo() {
        this.setState({
            info: !this.state.info,
            infoText: "This console only manages the Locust engines resources including the test scenario. Managing the actual locust engine (Starting and stopping load tests) is done via the below management URL"

        });
    }

    componentDidMount() {
        this.getEngine()
    };

    sendTaskCount() {
        if (this.state.Items.length > 0) {
            this.props.taskCount((parseInt(this.state.Items[0].numMasterNodes) + parseInt(this.state.Items[0].numSlaveNodes)))
        }
    }

    componentWillUnmount() {
        //clearTimeout(this.intervalID);
    };

    componentDidUpdate(prevState, prevProps) {
        if (this.props.refresh !== prevState.refresh) {
            this.getEngine()
            this.setState({ 'refresh': !this.props.refresh })
        }
    }

    render() {
        const { Items } = this.state;

        const settings = (

            <div>
                {Items.map(item => (
                    <div key={item.engine_type} className="box">
                        <h3>Settings</h3>
                        <Row>
                            <Col xs="6" sm="4">
                                <Row className="detail">
                                    <Col sm="3"><b>Type</b></Col>
                                    <Col sm="9">{this.state.engine_name.charAt(0).toUpperCase() + this.state.engine_name.slice(1)}</Col>
                                </Row>
                                <Row className="detail">
                                    <Col sm="3"><b>Description</b></Col>
                                    <Col sm="9">{item.description}</Col>
                                </Row>
                                <Row className="detail">
                                    <Col sm="3"><b>Last updated</b></Col>
                                    <Col sm="9">{item.last_updated}</Col>
                                </Row>
                                <Row className="detail">
                                    <Col sm="3"><b>Management URL</b></Col>
                                    <Col sm="9"><a className="text-link"
                                        href={this.state.engineAlbAddress}
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        {this.state.engineAlbAddress} <FontAwesomeIcon size="sm" icon={faExternalLinkAlt} />
                                    </a></Col>
                                </Row>
                            </Col>
                            <Col xs="6" sm="4">
                                <Row className="detail">
                                    <Col sm="3"><b># of master nodes</b></Col>
                                    <Col sm="9">{item.numMasterNodes}</Col>
                                </Row>
                                <Row className="detail">
                                    <Col sm="3"><b>Master node vCPU</b></Col>
                                    <Col sm="9">{item.masterNodeVcpu}</Col>
                                </Row>
                                <Row className="detail">
                                    <Col sm="3"><b>Master node memory</b></Col>
                                    <Col sm="9">{item.masterNodeMemory}</Col>
                                </Row>
                            </Col>
                            <Col xs="6" sm="4">
                                <Row className="detail">
                                    <Col sm="4"><b># of slave nodes</b></Col>
                                    <Col sm="8">{item.numSlaveNodes}</Col>
                                </Row>
                                <Row className="detail">
                                    <Col sm="4"><b>Slave node vCPU</b></Col>
                                    <Col sm="8">{item.slaveNodeVcpu}</Col>
                                </Row>
                                <Row className="detail">
                                    <Col sm="4"><b>Slave node memory</b></Col>
                                    <Col sm="8">{item.slaveNodeMemory}</Col>
                                </Row>
                            </Col>
                        </Row>
                        <Row className="detail">
                            <Col><b>Locust file</b></Col>
                            <AceEditor
                                mode="python"
                                theme="github"
                                showGutter={true}
                                highlightActiveLine={true}
                                name="locustFile"
                                width="100%"
                                height="500px"
                                readOnly={true}
                                value={this.state.locustFile === null ? '' : this.state.locustFile.Body}
                                setOptions={{
                                    showLineNumbers: true,
                                    tabSize: 4,
                                    useSoftTabs: true,
                                    wrapBehavioursEnabled: true,
                                    autoScrollEditorIntoView: true,
                                    showPrintMargin: false,
                                }}
                                editorProps={{
                                    $blockScrolling: Infinity
                                }}
                            />
                        </Row>
                    </div>
                ))
                }
            </div>
        );

        return (
            <div>
                {this.state.isLoading ? <div className="loading"><Spinner color="secondary" /></div> : settings}
            </div>
        )
    }

}

export default Settings;
