import React from 'react';
import {
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from 'reactstrap';
import ManageLocust from './Locust/Locust'


class Manage extends React.Component {
    intervalID;

    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            engine_name: this.props.match.params['engine'],
            modal: false,
            modalTitle: null,
            modalText: null,
        }
        this.closeModal = this.closeModal.bind(this);
    };

    componentDidMount() {

    };

    componentWillUnmount() {
    };

    notFoundModal() {
        this.setState({
            modal: true, modalTitle: 'Engine error', modalText: <p>No engine by the name of {this.state.engine_name} found</p>
        });
    }

    closeModal() {
        this.setState({
            modal: false, modalTitle: null, modalText: null
        });
        this.props.history.push('/')
    }


    render() {

        const manageForm = (
            <div>
                {(() => {
                    switch (this.state.engine_name) {
                        case 'locust':
                            return (
                                <ManageLocust engineName={this.state.engine_name} />
                            );
                        default:
                            return (
                                <Modal isOpen="true">
                                    <ModalHeader>Engine error</ModalHeader>
                                    <ModalBody>
                                        <p>No engine by the name of {this.state.engine_name} found</p>
                                    </ModalBody>
                                    <ModalFooter>
                                        <Button onClick={this.closeModal} size="sm">Ok</Button>
                                    </ModalFooter>
                                </Modal>
                            );
                    }
                })()}
            </div >
        )

        return (
            <div>
                {manageForm}
            </div>
        )
    }

}

export default Manage;
