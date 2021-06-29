import React from 'react';
import {
    Col,
    Row,
    Spinner
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
//import awsConfig from '../../aws_config'
declare var awsConfig;


class Tasks extends React.Component {
    intervalID;

    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            refresh: false,
            engine_name: this.props.engineName,
            taskCount: this.props.taskCount,
            provisioning: 0,
            pending: 0,
            running: 0,
            tasks: [],
            ecs_dashboard: awsConfig.ecs_dashboard + awsConfig.load_testing_name + "-" + this.props.engineName
        }

        this.getTasks = this.getTasks.bind(this);
        this.taskStatus = this.taskStatus.bind(this);
    };

    getTasks = async () => {
        this.setState({ tasks: [], isLoading: true });
        try {
            const data = await API.get('dlts', '/engine/' + this.state.engine_name + '/tasks');
            if (data.length === 0) {
                this.setState({ isLoading: false, noData: true });
            }
            else {
                this.setState({ isLoading: false, tasks: data.tasks });
            }
            //this.intervalID = setTimeout(this.getItems.bind(this), 30000);
        } catch (err) {
            alert(err);
        }
        this.taskStatus()
    };

    componentDidMount() {
        this.getTasks()
    };

    componentDidUpdate(prevState, prevProps) {
        if (this.props.refresh !== prevState.refresh) {
            this.getTasks()
            this.setState({ 'refresh': !this.props.refresh })
        }
        else if (this.props.taskCount !== prevState.taskCount) {
            this.setState({ taskCount: this.props.taskCount })
        }
    }

    taskStatus() {
        const tasks = this.state.tasks
        let provisioning = 0;
        let pending = 0;
        let running = 0;

        for (let task in tasks) {
            // eslint-disable-next-line default-case
            switch (tasks[task].lastStatus) {
                case 'PROVISIONING':
                    ++provisioning
                    break;
                case 'PENDING':
                    ++pending
                    break;
                case 'RUNNING':
                    ++running
                    break;
            }
        }
        this.setState({ provisioning: provisioning, pending: pending, running: running })
    }

    render() {

        const tasks = (
            <div className="box">
                <h3>Tasks Status:</h3>
                <span className="console">
                    Details for the running tasks can be viewed in the <a className="text-link"
                        href={this.state.ecs_dashboard}
                        target="_blank"
                        rel="noopener noreferrer">
                        Amazon ECS Console <FontAwesomeIcon size="sm" icon={faExternalLinkAlt} />
                    </a>
                </span>

                <Row>
                    <Col sm="3">
                        <div className="result">
                            <b>Task Count:</b><span>{this.state.tasks.length} of {this.state.taskCount}</span>
                        </div>
                    </Col>
                    <Col sm="3">
                        <div className="result">
                            <b>Provisioning Count:</b><span>{this.state.provisioning}</span>
                        </div>
                    </Col>
                    <Col sm="3">
                        <div className="result">
                            <b>Pending Count:</b><span>{this.state.pending}</span>
                        </div>
                    </Col>
                    <Col sm="3">
                        <div className="result">
                            <b>Running Count:</b><span>{this.state.running}</span>
                        </div>
                    </Col>
                </Row>
            </div>
        );

        return (
            <div>
                {this.state.isLoading ? <div className="loading"><Spinner color="secondary" /></div> : tasks}
            </div>
        )
    }

}

export default Tasks;
