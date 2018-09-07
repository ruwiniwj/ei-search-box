/*
 *  Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

import React from 'react';
import VizG from 'react-vizgrammar';
import Widget from '@wso2-dashboards/widget';
import { MuiThemeProvider } from 'material-ui/styles';
import _ from 'lodash';

class IsAnalyticsSessionCount extends Widget {
    constructor(props) {
        super(props);

        this.chartConfig = {
            x: 'DURATION',
            charts: [
                {
                    type: 'bar',
                    y: 'COUNT1',
                    fill: '#00e600',
                    mode: 'stacked',
                },
            ],
            yAxisLabel: 'Session count',
            xAxisLabel: 'Duration',
            pagination: 'true',
            maxLength: 10,
            legend: false,
        };

        this.metadata = {
            names: ['DURATION', 'COUNT1'],
            types: ['ordinal', 'linear'],
        };

        this.state = {
            data: [],
            metadata: this.metadata,
            providerConfig: null,
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
        };

        this.handleResize = this.handleResize.bind(this);
        this.props.glContainer.on('resize', this.handleResize);
        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handleUserSelection = this.handleUserSelection.bind(this);
        this.assembleQuery = this.assembleQuery.bind(this);
    }

    handleResize() {
        this.setState({ width: this.props.glContainer.width, height: this.props.glContainer.height });
    }

    componentDidMount() {
        super.subscribe(this.handleUserSelection);
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                });
            });
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    handleDataReceived(message) {
        message.data = message.data.reverse();
        this.setState({
            metadata: message.metadata,
            data: message.data,
        });
    }

    handleUserSelection(message) {
        this.setState({
            fromDate: message.from,
            toDate: message.to,
        }, this.assembleQuery);
    }

    assembleQuery() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        const dataProviderConfigs = _.cloneDeep(this.state.providerConfig);
        const numOfGroups = 5;
        let { query } = dataProviderConfigs.configs.config.queryData;
        for (let i = 0; i < numOfGroups; i++) {
            query = query
                .replace('{{from}}', this.state.fromDate)
                .replace('{{to}}', this.state.toDate)
                .replace('{{now}}', new Date().getTime());
        }
        dataProviderConfigs.configs.config.queryData.query = query;
        super.getWidgetChannelManager()
            .subscribeWidget(this.props.id, this.handleDataReceived, dataProviderConfigs);
    }

    render() {
        return (
            <MuiThemeProvider muiTheme={this.props.muiTheme}>
                <VizG
                    config={this.chartConfig}
                    metadata={this.state.metadata}
                    data={this.state.data}
                    height={this.state.height}
                    width={this.state.width}
                    theme={this.props.muiTheme.name}
                />
            </MuiThemeProvider>
        );
    }
}
global.dashboard.registerWidget('IsAnalyticsSessionCount', IsAnalyticsSessionCount);
