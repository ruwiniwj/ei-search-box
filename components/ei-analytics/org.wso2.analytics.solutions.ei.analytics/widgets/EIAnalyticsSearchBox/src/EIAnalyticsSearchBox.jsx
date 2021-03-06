/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import Widget from '@wso2-dashboards/widget';
import Select from 'react-select';
import './react-select.css';

const SELECTED_COMPONENT = "id";

class EIAnalyticsSearchBox extends Widget {

    constructor(props) {
        super(props);
        this.state = {
            selectedOption: '',
            optionArray: []
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.excludeComponets = this.excludeComponets.bind(this);
        this.publishMessage = this.publishMessage.bind(this);
        this.getCurrentPage = this.getCurrentPage.bind(this);
        this.getKey = this.getKey.bind(this);

        this.publishedMsgSet = [];
        this.pageName = this.getCurrentPage();
        this.pgAPI = "api";
        this.pgEndpoint = "endpoint";
        this.pgProxy = "proxy";
        this.pgSequence = "sequence";
        this.pgInbound = "inbound";
    }

    componentDidMount() {
        // if a component is already selected, preserve the selection
        let selected = super.getGlobalState(this.getKey(this.pageName,SELECTED_COMPONENT));
        if (selected) {
            this.publishMessage(selected);
        }

        let query;
        let componentType = this.pageName;
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                //based on the component type, query ESB or Mediator stat tables
                if (this.pageName == this.pgAPI || this.pageName == this.pgProxy || this.pageName == this.pgInbound) {
                    query = message.data.configs.providerConfig.configs.config.queryData.queryESB;

                    //change pageName variable to 'Proxy Service' to query data based on the componentType
                    if (this.pageName == this.pgProxy) {
                        componentType = 'proxy service';
                    }
                    //change pageName variable to 'Inbound EndPoint'to query data based on the componentType
                    else if (this.pageName == this.pgInbound) {
                        componentType = 'inbound endpoint';
                    }

                } else {
                    query = message.data.configs.providerConfig.configs.config.queryData.queryMediator;
                }
                message.data.configs.providerConfig.configs.config.queryData.query = query.replace('{{paramComponentType}}', componentType);
                super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleDataReceived, message.data.configs.providerConfig);

            })
            .catch((error) => {
                this.setState({
                    faultyProviderConf: true
                });
            });
    }

    getCurrentPage() {
        return window.location.pathname.split('/').pop();
    }

    getKey(pageName, parameter) {
            return pageName + "_page_" + parameter;
    }

    //map data into options in the search box
    handleDataReceived(data) {
        let componentNameArr = data.data.map(
            function (nameArr) {
                return nameArr[0];
            });

        // remove endpoints in the excludeEndpoints-array from the options
        if (this.pageName == this.pgEndpoint) {
            let excludeEndpoints = ["AnonymousEndpoint"];
            this.excludeComponets(componentNameArr, excludeEndpoints);
        }

        // remove sequences in the excludeSequences-array from the options
        else if (this.pageName == this.pgSequence) {
            let excludeSequences = ["PROXY_INSEQ", "PROXY_OUTSEQ", "PROXY_FAULTSEQ", "API_OUTSEQ", "API_INSEQ", "API_FAULTSEQ", "AnonymousSequence"];
            this.excludeComponets(componentNameArr, excludeSequences);
        }

        this.setState({
            optionArray: componentNameArr.map(option => ({
                value: option,
                label: option,
                clearableValue: false
            }))
        });
    }

    //remove an array of elements from an array
    excludeComponets(componentNameArr, excludeItems) {
        let item;
        for (item in excludeItems) {
            let exSeq = excludeItems[item];
            let index = componentNameArr.indexOf(exSeq);
            if (index > -1) {
                componentNameArr.splice(index, 1);
            }
        }
    }

    //publish the selected componentName
    handleChange(event) {
        if (event) {
            let selectedValue = event.value;
            this.publishMessage(selectedValue);
        }
    }

    //publish the given message as an object
    publishMessage(pubMessage) {
        this.setState({selectedOption: pubMessage});
        let selectedComponent = {"selectedComponent": pubMessage};
        this.publishedMsgSet.push({time: new Date(), value: pubMessage});
        super.publish(selectedComponent);
        //super.setGlobalState(this.getKey(this.pageName,SELECTED_COMPONENT),selectedComponent);
        //publish it to the subscriber
        //super.publish(JSON.stringify(selectedComponent));
    }

    render() {
        return (
            <div>
                <Select
                    name="form-field-name"
                    onChange={this.handleChange}
                    options={this.state.optionArray}
                    placeholder={this.state.selectedOption}
                    value={this.state.selectedOption}
                    clearable={false}
                >
                </Select>
            </div>
        );
    }
}

global.dashboard.registerWidget('EIAnalyticsSearchBox', EIAnalyticsSearchBox);
