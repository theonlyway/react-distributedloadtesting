import React from 'react';
import {
    Button,
    Spinner,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
} from 'reactstrap';
import { API } from 'aws-amplify';
import { withRouter } from 'react-router-dom';
import Tasks from '../../Tasks/Tasks'
import Settings from '../../Settings/Settings'
//import awsConfig from '../../../aws_config'
declare var awsConfig;


class ManageLocust extends React.Component {
    intervalID;

    constructor(props) {
        super(props);
        this.state = {
            Items: [],
            isLoading: false,
            refresh: false,
            info: false,
            infoText: null,
            noData: true,
            modal: false,
            modalTitle: null,
            modalText: null,
            engine_name: this.props.engineName
        }
        this.form = React.createRef();
        this.confirmDelete = this.confirmDelete.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.toggleInfo = this.toggleInfo.bind(this);
        this.deleteLocust = this.deleteLocust.bind(this);
        this.taskCount = this.taskCount.bind(this);
        this.refresh = this.refresh.bind(this);
    };

    deleteLocust = async () => {
        this.setState({ isLoading: true })
        try {
            await API.del('dlts', '/engine/locust');
            this.setState({ isLoading: false })
            this.props.history.push('/')
        } catch (err) {
            alert(err);
        }
    };

    toggleInfo() {
        this.setState({
            info: !this.state.info,
            infoText: "This console only manages the Locust engines resources including the test scenario. Managing the actual locust engine (Starting and stopping load tests) is done via the below management URL"
        });
    }

    refresh() {
        this.setState({
            refresh: !this.state.refresh,
        });
    }

    confirmDelete() {
        this.setState({
            modal: true, modalTitle: 'Confirmation', modalText: <p>Click <strong><u>Delete</u></strong> to begin the process to remove this load testing engine</p>
        });
    }

    closeModal() {
        this.setState({
            modal: false, modalTitle: null, modalText: null
        });
    }

    taskCount(taskCount) {
        this.setState({ taskCount: taskCount })
    }

    componentDidMount() {

    };

    componentWillUnmount() {
    };


    render() {

        const modal = (
            <Modal isOpen={this.state.modal}>
                <ModalHeader>{this.state.modalTitle}</ModalHeader>
                <ModalBody>
                    {this.state.modalText}
                </ModalBody>
                <ModalFooter>
                    <Button onClick={this.deleteLocust} size="sm" color="danger">Delete</Button>
                    <Button onClick={this.closeModal} size="sm">Cancel</Button>
                </ModalFooter>
            </Modal>
        )

        const manageLocustForm = (
            <div>
                <div className="box heading-box">
                    <h1>Manage {this.state.engine_name.charAt(0).toUpperCase() + this.state.engine_name.slice(1)}</h1>
                    <Button size="sm" onClick={this.confirmDelete} color="danger">Delete</Button>
                    <Button size="sm" onClick={this.refresh}>Refresh</Button>
                </div>
                <Settings engineName={this.state.engine_name} refresh={this.state.refresh} taskCount={this.taskCount} />
                <Tasks engineName={this.state.engine_name} refresh={this.state.refresh} taskCount={this.state.taskCount} />
            </div>
        );

        return (
            <div>
                <form ref={this.form} onSubmit={e => e.preventDefault()}>
                    {modal}
                    <div>
                        {this.state.isLoading ? <div className="loading"><Spinner color="secondary" /></div> : manageLocustForm}
                    </div>
                </form>
            </div>
        )
    }

}

export default withRouter(ManageLocust);
