import React from 'react';
import {
    Table,
    Spinner,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
} from 'reactstrap';
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowAltCircleRight } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';

//declare var awsConfig;
class Dashboard extends React.Component {
    intervalID;

    constructor(props) {
        super(props);
        this.state = {
            Items: [],
            isLoading: true,
            noData: false,
            modal: false,
            modalTitle: null,
            modalText: null,
        }
    };

    getItems = async () => {
        this.setState({ Items: [], isLoading: true });
        try {
            const data = await API.get('dlts', '/engines');
            this.setState({ Items: data.Items, isLoading: false });
            if (data.Items.length === 0) {
                this.setState({ noData: true });
            }
            else {
                this.setState({ noData: false });
            }
            //this.intervalID = setTimeout(this.getItems.bind(this), 30000);
        } catch (err) {
            if ('response' in err && typeof err.response !== 'undefined') {
                if (err.response.data.error === 'duplicate_engine') {
                    this.handleApiError(err)
                }
                else {
                    alert(err);
                }
            }
            else {
                alert(err);
            }
        }
    };

    componentDidMount() {
        this.getItems();
    };

    componentWillUnmount() {
        /*
          stop getData() from continuing to run even
          after unmounting this component. Notice we are calling
          'clearTimeout()` here rather than `clearInterval()` as
          in the previous example.
        */
        //clearTimeout(this.intervalID);
    };



    render() {
        const { Items } = this.state;

        const welcome = (
            <div className="welcome">
                <h2>To get started select <strong>Launch Engine</strong> from the top menu.</h2>
            </div>
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

        const tableBody = (
            <tbody ref={this.tableBody} >
                {Items.map(item => (
                    <tr key={item.engine_type}>
                        <td >{item.engine_type.charAt(0).toUpperCase() + item.engine_type.slice(1)}</td>
                        <td >{item.description}</td>
                        <td>{item.started}</td>
                        <td>{item.engine_status}</td>
                        <td className="td-center">
                            <Link to={{
                                pathname: "/manage/" + item.engine_type,
                                state: { engine_type: item.engine_type }
                            }}
                            >
                                <FontAwesomeIcon icon={faArrowAltCircleRight} size="lg" />
                            </Link>
                        </td>
                    </tr>
                ))}
            </tbody>
        )

        return (
            <div>
                <div className="box heading-box">
                    <h1>Dashboard</h1>
                    <Button onClick={this.getItems} size="sm">Refresh</Button>
                </div>
                {modal}
                <div className="box">
                    <h1>Engines</h1>
                    <Table className="dashboard" borderless responsive >
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Started (UTC)</th>
                                <th>Status</th>
                                <th className="td-center">Manage</th>
                            </tr>
                        </thead>
                        {tableBody}
                    </Table>
                    {this.state.isLoading ? <div className="loading"><Spinner color="secondary" /></div> : <div></div>}
                </div>
                {this.state.noData ? welcome : <div></div>}
            </div>
        )
    }

}

export default Dashboard;
