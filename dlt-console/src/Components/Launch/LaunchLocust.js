import React from 'react';
import { API } from 'aws-amplify';
import { Storage } from 'aws-amplify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import 'brace';
import AceEditor from "react-ace";
import { v4 as uuidv4 } from 'uuid';
import {
    Col,
    Row,
    Button,
    FormGroup,
    Label,
    Input,
    FormText,
    Spinner,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from 'reactstrap';
import 'brace/theme/github';

class LaunchLocust extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            isLoading: false,
            runningTasks: false,
            modal: false,
            modalTitle: null,
            modalText: null,
            refreshPricing: false,
            fargateVcpuPrice: null,
            fargateMemoryPrice: null,
            fargateVcpuSimCost: null,
            fargateMemorySimCost: null,
            fargateSimTotalCost: null,
            formValues: {
                vCpuOptions: [
                    { label: '0.25', value: '256', id: 1 },
                    { label: '0.5', value: '512', id: 2 },
                    { label: '1', value: '1024', id: 3 },
                    { label: '2', value: '2048', id: 4 },
                    { label: '4', value: '4096', id: 5 },
                ],
                fargateTaskServiceLimit: 100,
                fargateTaskCount: 0,
                fargateRunTimeHours: 24,
                masterMemoryOptions: [],
                slaveMemoryOptions: [],
                numMasterNodes: '1',
                masterNodeVcpu: '512',
                masterNodeMemory: '2048',
                numSlaveNodes: '1',
                slaveNodeVcpu: '512',
                slaveNodeMemory: '2048',
                locustFiles: [],
                locustFile: '',
                locustFileSelection: '',
                locustFileName: '',
                customLocustFile: false,
                customLocustFileBody: '',
                customLocustFileName: ''
            }
        }

        this.form = React.createRef();
        this.handleInputChange = this.handleInputChange.bind(this);
        this.setFormValue = this.setFormValue.bind(this);
        this.masterMemoryOptions = this.masterMemoryOptions.bind(this);
        this.slaveMemoryOptions = this.slaveMemoryOptions.bind(this);
        this.handleLocustFileSelection = this.handleLocustFileSelection.bind(this);
        this.handleLocustFile = this.handleLocustFile.bind(this);
        this.handleLocustFileSelection = this.handleLocustFileSelection.bind(this);
        this.handleLocustFileBody = this.handleLocustFileBody.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.openInfoModal = this.openInfoModal.bind(this);
        this.handleTaskLimitChanges = this.handleTaskLimitChanges.bind(this);
        this.getLocustFiles = this.getLocustFiles.bind(this);
        this.goHome = this.goHome.bind(this);
    }

    launchLocust = async () => {
        const values = this.state.formValues;

        if (!this.form.current.reportValidity()) {
            return false;
        }

        if (this.state.formValues.fargateTaskCount > this.state.formValues.fargateTaskServiceLimit) {
            this.setState({
                modal: true, modalTitle: 'Task count', modalText: 'Task count: ' + this.state.formValues.fargateTaskCount + " is greater than the AWS accounts service limit of " + this.state.formValues.fargateTaskServiceLimit
            });
            return false;
        }
        this.setState({ isLoading: true })

        if (values.customLocustFile === true) {
            this.putLocustFile()
        }

        try {

            let payload = {
                numMasterNodes: parseInt(values.numMasterNodes),
                masterNodeVcpu: parseInt(values.masterNodeVcpu),
                masterNodeMemory: parseInt(values.masterNodeMemory),
                numSlaveNodes: parseInt(values.numSlaveNodes),
                slaveNodeVcpu: parseInt(values.slaveNodeVcpu),
                slaveNodeMemory: parseInt(values.slaveNodeMemory),
                locustFileName: values.customLocustFile ? "/scenarios/locust/custom/" + values.customLocustFileName : "/" + values.locustFileSelection,
                customLocustFile: values.customLocustFile
            };

            await API.post('dlts', '/engine/launch/locust', { body: payload });
            this.setState({ isLoading: false })
            this.goHome()
        } catch (err) {
            if ('response' in err && typeof err.response !== 'undefined') {
                if (err.response.data.error === 'duplicate_engine') {
                    this.handleApiError(err)
                }
                else {
                    this.setState({
                        modal: true, modalTitle: err.message, modalText: err.message + "- Request to " + err.config.url + " failed"
                    });
                }
            }
            else {
                this.setState({
                    modal: true, modalTitle: err.message, modalText: err.message + "- Request to " + err.config.url + " failed"
                });
            }
        }
    };

    fargatePricing = async () => {
        this.setState({ isLoading: true })
        try {
            const data = await API.get('dlts', '/pricing/fargate');
            this.setState({
                fargateVcpuPrice: parseFloat(data.vcpu), fargateMemoryPrice: parseFloat(data.memory)
            });
            this.calculateFargatePricing()
            this.setState({ isLoading: false })
        } catch (err) {
            this.setState({
                modal: true, modalTitle: 'Pricing error', modalText: 'Failed to get Fargate pricing information'
            });
        }
    };

    handleTaskLimitChanges(event) {

    }

    goHome() {
        this.props.history.push('/')
    }

    calculateFargatePricing() {
        const values = this.state
        let taskCount = parseInt(values.formValues.numMasterNodes) + parseInt(values.formValues.numSlaveNodes)
        let masterVcpu = parseFloat(values.formValues.vCpuOptions.find(x => x.value === this.state.formValues.masterNodeVcpu).label)
        let slaveVcpu = parseFloat(values.formValues.vCpuOptions.find(x => x.value === this.state.formValues.slaveNodeVcpu).label)
        let masterMemory = parseFloat(values.formValues.masterMemoryOptions.find(x => x.value === this.state.formValues.masterNodeMemory).label)
        let slaveMemory = parseFloat(values.formValues.slaveMemoryOptions.find(x => x.value === this.state.formValues.slaveNodeMemory).label)
        let vCpuEstimateSim = (parseInt(values.formValues.numMasterNodes) + parseInt(values.formValues.numSlaveNodes)) * (masterVcpu + slaveVcpu) * values.fargateVcpuPrice * values.formValues.fargateRunTimeHours
        let memoryEstimateSim = (parseInt(values.formValues.numMasterNodes) + parseInt(values.formValues.numSlaveNodes)) * (masterMemory + slaveMemory) * values.fargateMemoryPrice * values.formValues.fargateRunTimeHours
        let totalCostSim = vCpuEstimateSim + memoryEstimateSim
        values['fargateVcpuSimCost'] = vCpuEstimateSim
        values['fargateMemorySimCost'] = memoryEstimateSim
        values['fargateSimTotalCost'] = totalCostSim
        values.formValues['fargateTaskCount'] = taskCount
        this.setState({
            values
        });

    }

    getLocustFiles = async () => {
        const formValues = this.state.formValues;
        this.setState({ isLoading: true });
        try {
            const data = await Storage.list('scenarios/locust', { level: 'public' })
            if (data.length === 0) {
                this.setState({ isLoading: false, noData: true });
            }
            else {
                formValues['locustFiles'] = data
                formValues['locustFileSelection'] = data[0].key
                formValues['customLocustFile'] = false
                try {
                    const file = await Storage.get(data[0].key, { level: 'public', download: true })
                    formValues['locustFile'] = file
                } catch (err) {
                    alert(err)
                }
                formValues['locustFileName'] = (formValues.locustFileSelection).split("/")[((formValues.locustFileSelection).split("/").length) - 1]
                this.setState({ formValues: formValues });
            }
        } catch (err) {
            alert(err);
        }
    };

    putLocustFile = async () => {
        const formValues = this.state.formValues;
        try {
            await Storage.put('scenarios/locust/custom/' + formValues.customLocustFileName, formValues.customLocustFileBody, { level: 'public' })
        } catch (err) {
            alert(err);
        }
    };

    getLocustFileBody = async (key) => {
        const formValues = this.state.formValues;
        try {
            const file = await Storage.get(key, { level: 'public', download: true })
            formValues['locustFile'] = file
        } catch (err) {
            alert(err)
        }
        this.setState({ formValues: formValues });
    };


    componentDidMount() {
        this.initialMemoryOptions();
        this.getLocustFiles()
        this.fargatePricing();
    };

    setFormValue(key, value) {
        const formValues = this.state.formValues;
        formValues[key] = value;
        this.setState({ formValues });
    }

    handleInputChange(event) {
        const value = event.target.value;
        const name = event.target.name;
        this.setFormValue(name, value);
        if (name === "masterNodeMemory" || name === "slaveNodeMemory" || name === "numSlaveNodes" || name === "fargateRunTimeHours") {
            this.calculateFargatePricing();
        }
    }

    handleLocustFile(event) {
        const formValues = this.state.formValues;
        formValues['locustFileName'] = 'woop woop'
        this.setState({ formValues });
    }

    handleLocustFileSelection(event) {
        const value = event.target.value;
        const name = event.target.name;
        const formValues = this.state.formValues
        this.setFormValue(name, value);
        if (value === 'Custom' && name === 'locustFileSelection') {
            formValues['locustFile'] = null
            formValues['customLocustFile'] = true
            formValues['customLocustFileName'] = 'custom_locust_file_' + uuidv4() + '.py'
            this.setState({ formValues: formValues });
        }
        else if (name === 'locustFileName') {
            formValues['customLocustFile'] = true
            formValues['customLocustFileName'] = value
            this.setState({ formValues: formValues });
        }
        else {
            formValues['locustFile'] = null
            formValues['customLocustFile'] = false
            formValues['customLocustFileBody'] = ''
            formValues['locustFileName'] = (formValues.locustFileSelection).split("/")[((formValues.locustFileSelection).split("/").length) - 1]
            this.setState({ formValues: formValues });
            this.getLocustFileBody(value)
        }
    }

    handleLocustFileBody(newValue) {
        const formValues = this.state.formValues
        formValues['customLocustFileBody'] = newValue
        this.setState({ formValues: formValues });
    }

    initialMemoryOptions() {
        const formValues = this.state.formValues;
        switch (formValues.masterNodeVcpu) {
            case '256':
                formValues['masterMemoryOptions'] = [
                    { value: '0.5', id: 1 },
                    { value: '1', id: 2 },
                    { value: '2', id: 3 }
                ]
                this.setState({ formValues });
                break;
            case '512':
                formValues['masterMemoryOptions'].length = 0
                for (let index = 1; index <= 4; index++) {
                    formValues['masterMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                break;
            case '1024':
                formValues['masterMemoryOptions'].length = 0
                for (let index = 2; index <= 8; index++) {
                    formValues['masterMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                break;
            case '2048':
                formValues['masterMemoryOptions'].length = 0
                for (let index = 4; index <= 16; index++) {
                    formValues['masterMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                break;
            case '4096':
                formValues['masterMemoryOptions'].length = 0
                for (let index = 8; index <= 30; index++) {
                    formValues['masterMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                break;
            default:
                break;
        }
        switch (formValues.slaveNodeVcpu) {
            case '256':
                formValues['slaveMemoryOptions'] = [
                    { value: '0.5', id: 1 },
                    { value: '1', id: 2 },
                    { value: '2', id: 3 }
                ]
                this.setState({ formValues });
                break;
            case '512':
                formValues['slaveMemoryOptions'].length = 0
                for (let index = 1; index <= 4; index++) {
                    formValues['slaveMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                break;
            case '1024':
                formValues['slaveMemoryOptions'].length = 0
                for (let index = 2; index <= 8; index++) {
                    formValues['slaveMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                break;
            case '2048':
                formValues['slaveMemoryOptions'].length = 0
                for (let index = 4; index <= 16; index++) {
                    formValues['slaveMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                break;
            case '4096':
                formValues['slaveMemoryOptions'].length = 0
                for (let index = 8; index <= 30; index++) {
                    formValues['slaveMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                break;
            default:
                break;
        }
    }

    masterMemoryOptions(event) {
        this.handleInputChange(event);
        const value = event.target.value;
        const formValues = this.state.formValues;
        switch (value) {
            case '256':
                formValues['masterMemoryOptions'] = [
                    { label: '0.5', value: (0.5 * 1024).toString(), id: 1 },
                    { label: '1', value: (1 * 1024).toString(), id: 2 },
                    { label: '2', value: (2 * 1024).toString(), id: 3 }
                ]
                formValues['masterNodeMemory'] = (1 * 1024).toString()
                this.setState({ formValues });
                this.calculateFargatePricing();
                break;
            case '512':
                formValues['masterMemoryOptions'].length = 0
                formValues['masterNodeMemory'] = (2 * 1024).toString()
                for (let index = 1; index <= 4; index++) {
                    formValues['masterMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                this.calculateFargatePricing();
                break;
            case '1024':
                formValues['masterMemoryOptions'].length = 0
                formValues['masterNodeMemory'] = (2 * 1024).toString()
                for (let index = 2; index <= 8; index++) {
                    formValues['masterMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                this.calculateFargatePricing();
                break;
            case '2048':
                formValues['masterMemoryOptions'].length = 0
                formValues['masterNodeMemory'] = (4 * 1024).toString()
                for (let index = 4; index <= 16; index++) {
                    formValues['masterMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                this.calculateFargatePricing();
                break;
            case '4096':
                formValues['masterMemoryOptions'].length = 0
                formValues['masterNodeMemory'] = (8 * 1024).toString()
                for (let index = 8; index <= 30; index++) {
                    formValues['masterMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                this.calculateFargatePricing();
                break;
            default:
                break;
        }
    }

    slaveMemoryOptions(event) {
        this.handleInputChange(event);
        const value = event.target.value;
        const formValues = this.state.formValues;
        switch (value) {
            case '256':
                formValues['slaveMemoryOptions'] = [
                    { label: '0.5', value: (0.5 * 1024).toString(), id: 1 },
                    { label: '1', value: (1 * 1024).toString(), id: 2 },
                    { label: '2', value: (2 * 1024).toString(), id: 3 }
                ]
                formValues['slaveNodeMemory'] = (1 * 1024).toString()
                this.setState({ formValues });
                this.calculateFargatePricing();
                break;
            case '512':
                formValues['slaveMemoryOptions'].length = 0
                formValues['slaveNodeMemory'] = (1 * 1024).toString()
                for (let index = 1; index <= 4; index++) {
                    formValues['slaveMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                this.calculateFargatePricing();
                break;
            case '1024':
                formValues['slaveMemoryOptions'].length = 0
                formValues['slaveNodeMemory'] = (2 * 1024).toString()
                for (let index = 2; index <= 8; index++) {
                    formValues['slaveMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                this.calculateFargatePricing();
                break;
            case '2048':
                formValues['slaveMemoryOptions'].length = 0
                formValues['slaveNodeMemory'] = (4 * 1024).toString()
                for (let index = 4; index <= 16; index++) {
                    formValues['slaveMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                this.calculateFargatePricing();
                break;
            case '4096':
                formValues['slaveMemoryOptions'].length = 0
                formValues['slaveNodeMemory'] = (8 * 1024).toString()
                for (let index = 8; index <= 30; index++) {
                    formValues['slaveMemoryOptions'].push({ label: index.toString(), value: (index * 1024).toString(), id: index })
                }
                this.setState({ formValues });
                this.calculateFargatePricing();
                break;
            default:
                break;
        }
    }

    handleApiError(err) {
        this.setState({
            modal: true, modalTitle: err.message, modalText: err.response.data.error_text + " at " + err.response.data.data.Items[0].started + ". Please go back to the dashboard and manage the already existing engine"
        });
    }

    closeModal() {
        this.setState({
            modal: false, modalTitle: null, modalText: null, isLoading: false
        });
    }

    openInfoModal() {
        this.setState({
            modal: true, modalTitle: 'Pricing info', modalText: <p>Pricing info is taken from the pricing API for Fargate tasks spun up in Sydney provided by AWS and the method for calculation used is provided <a className="text-link" onClick={this.closeModal} target="_blank" href="https://aws.amazon.com/fargate/pricing/" rel="noopener noreferrer"> here <FontAwesomeIcon size="sm" icon={faExternalLinkAlt} /></a>. Does not include egress data charges</p>
        });
    }
    render() {

        const heading = (
            <div className="box cheading-box">
                <h1>Launch Locust engine</h1>
                <Button
                    size="sm"
                    onClick={this.launchLocust}
                >Launch</Button>
            </div>
        )

        const vCpuOptions = (
            this.state.formValues.vCpuOptions.map(v => (
                <option key={v.id} label={v.label} value={v.value}>{v.label}</option>
            ))
        )

        const masterMemoryOptions = (
            this.state.formValues.masterMemoryOptions.map(v => (
                <option key={v.id} label={v.label} value={v.value}></option>
            ))
        )

        const slaveMemoryOptions = (
            this.state.formValues.slaveMemoryOptions.map(v => (
                <option key={v.id} label={v.label} value={v.value}>{v.label}</option>
            ))
        )

        const modal = (
            <Modal isOpen={this.state.modal}>
                <ModalHeader toggle={this.toggle}>{this.state.modalTitle}</ModalHeader>
                <ModalBody>
                    {this.state.modalText}
                </ModalBody>
                <ModalFooter>
                    <Button color='secondary' onClick={this.closeModal}>Close</Button>
                </ModalFooter>
            </Modal>
        )

        const createLocustForm = (
            <div>
                <Row>
                    <Col xs="2">
                        <div className="box create-box">
                            <h3>Settings</h3>
                            <FormGroup>
                                <Label for="numOfMasterNodes"># of master nodes</Label>
                                <Input
                                    type="number"
                                    name="numOfMasterNodes"
                                    id="numOfMasterNodes"
                                    defaultValue={this.state.formValues.numMasterNodes}
                                    readOnly={true}
                                    required
                                />
                                <FormText color="muted">
                                    The number of master nodes for the cluster. This will default to 1
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="masterNodeVcpu">Master node vCPU</Label>
                                <Input type="select" value={this.state.formValues.masterNodeVcpu} onChange={this.masterMemoryOptions} name="masterNodeVcpu" id="masterNodeVcpu" >
                                    {vCpuOptions}
                                </Input>
                                <FormText color="muted">
                                    The amount of vCPU to assign to the master node tasks
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="masterNodeMemory">Master node memory</Label>
                                <Input type="select" value={this.state.formValues.masterNodeMemory} onChange={this.handleInputChange} name="masterNodeMemory" id="masterNodeMemory" >
                                    {masterMemoryOptions}
                                </Input>
                                <FormText color="muted">
                                    The amount of memory in GB to assign to the master node tasks
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="numSlaveNodes"># of slave nodes</Label>
                                <Input
                                    type="number"
                                    name="numSlaveNodes"
                                    id="numSlaveNodes"
                                    defaultValue="1"
                                    onChange={this.handleInputChange}
                                    required
                                />
                                <FormText color="muted">
                                    The number of slaves to connect to the master node for distributed testing. The total number of master nodes + slave nodes should fit within the accounts service limits for fargate tasks
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="slaveNodeVcpu">Slave node vCPU</Label>
                                <Input type="select" value={this.state.formValues.slaveNodeVcpu} onChange={this.slaveMemoryOptions} name="slaveNodeVcpu" id="slaveNodeVcpu" >
                                    {vCpuOptions}
                                </Input>
                                <FormText color="muted">
                                    The amount of vCPU to assign to the slave node tasks
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="slaveNodeMemory">Slave node memory</Label>
                                <Input type="select" value={this.state.formValues.slaveNodeMemory} onChange={this.handleInputChange} name="slaveNodeMemory" id="slaveNodeMemory" >
                                    {slaveMemoryOptions}
                                </Input>
                                <FormText color="muted">
                                    The amount of memory in GB to assign to the slave node tasks
                                </FormText>
                            </FormGroup>
                        </div>
                    </Col>
                    <Col xs="10">
                        <div className="box create-box">
                            <FormGroup>
                                <Label for="locustFileSelection">Locust file selection</Label>
                                <Input type="select" onChange={this.handleLocustFileSelection} name="locustFileSelection" id="locustFileSelection" >
                                    {this.state.formValues.locustFiles.length > 0 ? this.state.formValues.locustFiles.map((v, i) => (
                                        <option key={i} label={v.key} value={v.key}>{v.key}</option>)) : null}
                                    <option key="999" label="Custom" value="Custom">Custom</option>
                                </Input>
                                <FormText color="muted">
                                    Select a default locust file that contains a predefined test scenario
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="locustFile">Locust file</Label>
                                <AceEditor
                                    mode="python"
                                    theme="github"
                                    showGutter={true}
                                    highlightActiveLine={true}
                                    name="locustFile"
                                    width="inherit"
                                    height="500px"
                                    onChange={this.handleLocustFileBody}
                                    readOnly={this.state.formValues.customLocustFile === true ? false : true}
                                    value={this.state.formValues.locustFile !== null ? this.state.formValues.locustFile.Body : this.state.formValues.customLocustFileBody}
                                    required
                                    //onChange={this.handleLocustFile}
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
                                <FormText color="muted">
                                    A valid Python Locust file https://docs.locust.io/en/stable/quickstart.html
                                </FormText>
                            </FormGroup>
                            <FormGroup>
                                <Label for="locustFileName">Locust file name</Label>
                                <Input
                                    type="text"
                                    name="locustFileName"
                                    id="locustFileName"
                                    readOnly={this.state.formValues.customLocustFile === true ? false : true}
                                    onChange={this.handleLocustFileSelection}
                                    value={this.state.formValues.customLocustFile === true ? this.state.formValues.customLocustFileName : this.state.formValues.locustFileName}
                                    required
                                />
                                <FormText color="muted">
                                    If custom locust file input a name to save the file as. Otherwise it's just the name of the file
                                </FormText>
                                {this.state.formValues.customLocustFile === true ? <FormText color="red">
                                    If the file name already exists the file will be overwritten. In addition remember to back up your custom file if you wish to keep it because the custom file is stored in the consoles S3 bucket and will be destroyed alongside the solution when it's torn down.
                                </FormText> : null}
                            </FormGroup>
                        </div>
                    </Col>
                </Row>
                <div className="box">
                    <h3>Estimated cost:</h3>
                    <Button id="info" onClick={this.openInfoModal} color="link"><FontAwesomeIcon id="icon" icon={faInfoCircle} /> Info</Button>
                    <Row>
                        <Col sm="3">
                            <div className="price result form-inline">
                                <Label for="fargateTaskServiceLimit">Account Fargate task limit:</Label>
                                <Input
                                    type="number"
                                    name="fargateTaskServiceLimit"
                                    id="fargateTaskServiceLimit"
                                    defaultValue={this.state.formValues.fargateTaskServiceLimit}
                                    onChange={this.handleInputChange}
                                    bsSize="sm"
                                />
                            </div>
                        </Col>
                        <Col sm="3">
                            <div className="price result form-inline">
                                <Label for="fargateRunTimeHours">Simulated runtime (Hours):</Label>
                                <Input
                                    type="number"
                                    name="fargateRunTimeHours"
                                    id="fargateRunTimeHours"
                                    defaultValue={this.state.formValues.fargateRunTimeHours}
                                    onChange={this.handleInputChange}
                                    bsSize="sm"
                                />
                            </div>
                        </Col>
                        <Col sm="3">
                            <div className="price result">
                                <b>vCPU cost (USD):</b><span>${this.state.fargateVcpuPrice}</span>
                            </div>
                        </Col>
                        <Col sm="3">
                            <div className="price result">
                                <b>Memory cost (USD):</b><span>${this.state.fargateMemoryPrice}</span>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col sm="3">
                            <div className="price result">
                                <b>Task acount:</b><span>{this.state.formValues.fargateTaskCount} out of {this.state.formValues.fargateTaskServiceLimit}</span>
                                {this.state.formValues.fargateTaskCount > this.state.formValues.fargateTaskServiceLimit ? <FormText color="red">
                                    Number of tasks exceeds service limits for account
                                </FormText> : null}
                            </div>
                        </Col>
                        <Col sm="3">
                            <div className="price result">
                                <b>Esimated vCPU cost:</b><span>${this.state.fargateVcpuSimCost}</span>
                            </div>
                        </Col>
                        <Col sm="3">
                            <div className="price result">
                                <b>Esimated memory cost:</b><span>${this.state.fargateMemorySimCost}</span>
                            </div>
                        </Col>
                        <Col sm="3">
                            <div className="price result">
                                <b>Estimated total simulated cost:</b><span>${this.state.fargateSimTotalCost}</span>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>
        );

        return (
            <div>
                <form ref={this.form} onSubmit={e => e.preventDefault()}>
                    {modal}
                    {this.state.isLoading ? <div className="loading"><Spinner color="secondary" /></div> : heading}
                    <div>
                        {this.state.isLoading ? <div className="loading"><Spinner color="secondary" /></div> : createLocustForm}
                    </div>
                </form>
            </div>
        )
    }
}

export default LaunchLocust;
