import './index.css';
import './skeleton.css';
import './normalize.css';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Api, JsonRpc, RpcError } from 'eosjs';
import ScatterJS from 'scatterjs-core';
import ScatterEOS from 'scatterjs-plugin-eosjs2';
import { ResponsivePie } from '@nivo/pie'
import { ResponsiveWaffle } from '@nivo/waffle'

const tokenContract = {
    account: 'gre111111111',
    symbol: 'ENT'
};
const rewardsContract = {
    account: "gre1111111p1",
}
const identityState = {
    anonymous: "anonymous",
    identified: "identified",
    scatterError: "scatterError",
}
const networks = {
    local: {
        blockchain: 'eos',
        protocol: 'http',
        host: '127.0.0.1',
        port: 8888,
        chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f'
    },
    jungle: {
        blockchain: 'eos',
        protocol: 'https',
        host: 'jungle2.cryptolions.io',
        port: 443,
        chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473'
    }
}
const network = networks.local;
const rpc = new JsonRpc(getRpc());

function getRpc() {
    return network.protocol + "://" + network.host + ":" + network.port;
}

window.ScatterJS = null;
ScatterJS.plugins(new ScatterEOS());
var scatter = null;
var eosapi = null;

function AuthenticateButton(props) {
    return (
        <button className="button-primary" onClick={props.onClick}>
            Scatter Sign In
        </button>
    );
}

function IdentityInfo(props) {
    const accounts = props.identity.accounts.map((account) => {
        return (
            <li key={account.name}>{account.name}</li>
        );
    });

    return (
        <div>
            <ul>
                <li>{props.identity.publicKey}</li>
                {props.token &&
                    <li>{props.token.balance}</li>
                }
                <li>
                    Accounts
                    <ul>
                        {accounts}
                    </ul>
                </li>
            </ul>
        </div>
    );
}

class Actions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            actions: [],
        }
    }

    componentDidMount() {
        this.getRewardsActions(this.props.actionTypeId);
    }

    async getRewardsActions(actionTypeId) {
        try {
            var result = await rpc.get_table_rows({
                code: rewardsContract.account,
                scope: actionTypeId,
                table: 'rwdsacts'
            });
            console.log(result);

            this.setState({
                actions: result.rows,
            });
        } catch (e) {
            console.log('\nCaught exception: ' + e);

            if (e instanceof RpcError) {
                console.log(JSON.stringify(e.json, null, 2));
            }
        }
    }

    render() {
        const rewardsActions = this.state.actions.map(action => {
            return (
                <li key={action.id}>
                    {action.id} | {action.source} | {action.owner} | {action.current_pay_outs} | {action.rewards_paid}
                </li>
            )
        });

        return (
            <ul>
                {rewardsActions}
            </ul>
        );
    }
}

class HistoricalActions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            actions: [],
        }
    }

    componentDidMount() {
        this.getRewardsActions(this.props.actionTypeId);
    }

    async getRewardsActions(actionTypeId) {
        try {
            var result = await rpc.get_table_rows({
                code: rewardsContract.account,
                scope: actionTypeId,
                table: 'rwdshistacts'
            });
            console.log(result);

            this.setState({
                actions: result.rows,
            });
        } catch (e) {
            console.log('\nCaught exception: ' + e);

            if (e instanceof RpcError) {
                console.log(JSON.stringify(e.json, null, 2));
            }
        }
    }

    render() {
        const rewardsActions = this.state.actions.map(action => {
            return (
                <li key={action.id}>
                    {action.id} | {action.source} | {action.owner} | {action.rewards_paid}
                </li>
            )
        });

        return (
            <ul>
                {rewardsActions}
            </ul>
        );
    }
}

class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            token: {
                supply: null,
                supplyValue: 1,
                maxSupply: null,
                maxSupplyValue: 1,
                issuer: null,
            },
            inflation: {
                quantity: null,
                frequencySeconds: null,
                canInflate: null,
                inflationPercent: null,
            },
            inflationPools: [

            ],
            identity: {
                token: {
                    balance: null,
                }
            },
            rewardsState: {

            },
            rewardsActionTypes: [

            ],
            displayIdentityInfo: false,
            identityState: identityState.anonymous,
        }
    }

    componentDidMount() {
        this.getTokenInfo();
        this.getInflationInfo();
        this.getInflationPools();
        this.getRewardsState();
        this.getRewardsActionTypes();

        this.intervalTokenInfo = setInterval(() => this.getTokenInfo(), 6000);
        this.intervalInflationInfo = setInterval(() => this.getInflationInfo(), 6000);
        this.intervalInflationPools = setInterval(() => this.getInflationPools(), 6000);
    }

    componentWillUnmount() {
        clearInterval(this.intervalTokenInfo);
        clearInterval(this.intervalInflationInfo);
        clearInterval(this.intervalInflationPools);
        //this.stopGetBalance();
    }

    async getTokenInfo() {
        try {
            var result = await rpc.get_table_rows({
                code: tokenContract.account,
                scope: tokenContract.symbol,
                table: 'stats'
            });

            this.setState({
                token: {
                    supply: result.rows[0].supply,
                    supplyValue: parseFloat(result.rows[0].supply.replace(" ENT", "")),
                    maxSupply: result.rows[0].max_supply,
                    maxSupplyValue: parseFloat(result.rows[0].max_supply.replace(" ENT", "")),
                    issuer: result.rows[0].issuer,
                },
            });
        } catch (e) {
            console.log('\nCaught exception: ' + e);

            if (e instanceof RpcError) {
                console.log(JSON.stringify(e.json, null, 2));
            }
        }
    }

    async getInflationInfo() {
        try {
            var result = await rpc.get_table_rows({
                code: tokenContract.account,
                scope: tokenContract.account,
                table: 'inflator'
            });
            //console.log(result);

            this.setState({
                inflation: {
                    quantity: result.rows[0].quantity,
                    frequencySeconds: result.rows[0].frequency_seconds,
                    canInflate: result.rows[0].can_inflate,
                    inflationPercent: result.rows[0].inflation_percent,
                }
            });
        } catch (e) {
            console.log('\nCaught exception: ' + e);

            if (e instanceof RpcError) {
                console.log(JSON.stringify(e.json, null, 2));
            }
        }
    }

    async getInflationPools() {
        try {
            var result = await rpc.get_table_rows({
                code: tokenContract.account,
                scope: tokenContract.account,
                table: 'inflationpls'
            });
            //console.log(result);

            var inflationPools = await Promise.all(result.rows.map(async r => {
                return {
                    account: r.account,
                    percentage: r.percentage,
                    balance: await this.getBalance(r.account),
                };
            }));

            this.setState({
                inflationPools: inflationPools,
            });
        } catch (e) {
            console.log('\nCaught exception: ' + e);

            if (e instanceof RpcError) {
                console.log(JSON.stringify(e.json, null, 2));
            }
        }
    }

    async connectScatter() {
        if (scatter) { return true; }

        await ScatterJS.scatter.connect("Enterprise").then(connected => {
            console.log('Connecting to Scatter: ' + connected);
            if (!connected)
            {
                console.log('Scatter not connected');
        
                return false;
            }
        
            scatter = ScatterJS.scatter;
            eosapi = scatter.eos(network, Api, {rpc});
        }).catch(error => {
            console.log('Error while connecting to Scatter');
            console.log(error);
        });

        if (scatter) {
            return true;
        }

        return false;
    }

    async authenticate() {
        console.log('Attempting to identify');
        if (!await this.connectScatter()) {
            this.setState({
                identityState: identityState.scatterError,
            });
            return;
        }

        const requiredFields = {
            accounts: [network]
        };
        await scatter.getIdentity(requiredFields).then(identity => {
            //console.log(identity);
        }).catch(error => {
            console.log('Error while getting user\'s identity');
            console.log(error);
        });

        var balance = await this.getBalance(scatter.identity.accounts[0].name);
        this.setState({
            identity: {
                token: {
                    balance: balance,
                }
            },
            identityState: identityState.identified,
        });
    }

    async getBalance(account) {
        try {
            var result = await rpc.get_table_rows({
                code: tokenContract.account,
                scope: account,
                table: 'accounts'
            });
            //console.log(result);
    
            return result.rows[0].balance
        } catch (e) {
            console.log('\nCaught exception: ' + e);
    
            if (e instanceof RpcError) {
                console.log(JSON.stringify(e.json, null, 2));
            }
        }
    }

    async getRewardsState() {
        try {
            var result = await rpc.get_table_rows({
                code: rewardsContract.account,
                scope: rewardsContract.account,
                table: 'state'
            });
            console.log(result);

            this.setState({
                rewardsState: result.rows[0],
            });
        } catch (e) {
            console.log('\nCaught exception: ' + e);

            if (e instanceof RpcError) {
                console.log(JSON.stringify(e.json, null, 2));
            }
        }
    }

    async getRewardsActionTypes() {
        try {
            var result = await rpc.get_table_rows({
                code: rewardsContract.account,
                scope: rewardsContract.account,
                table: 'rwdsacttyps'
            });
            console.log(result);

            this.setState({
                rewardsActionTypes: result.rows,
            });
        } catch (e) {
            console.log('\nCaught exception: ' + e);

            if (e instanceof RpcError) {
                console.log(JSON.stringify(e.json, null, 2));
            }
        }
    }

    signOut() {
        scatter.forgetIdentity();
        //this.stopGetBalance();
        this.setState({
            identity: {
                token: null,
            },
            identityState: identityState.anonymous,
        })
    }

    // startGetBalance() {
    //     this.intervalGetBalance = setInterval(() => this.getBalance(), 60000);
    // }

    // stopGetBalance() {
    //     if (this.intervalGetBalance) {
    //         clearInterval(this.intervalGetBalance);
    //     }
    // }

    render() {
        const pieChartData = this.state.inflationPools.map(pool => {
            return {
                id: pool.account,
                label: pool.account + " (" + (pool.percentage * 1).toPrecision(2) + "%)",
                value: parseFloat((pool.percentage * 1).toPrecision(2)),
            }
        });
        const waffleChartData = [
            {
                id: "Supply",
                label: "Supply",
                value: Number(((this.state.token.supplyValue / this.state.token.maxSupplyValue) * 100).toPrecision(2)),
            },
        ]
        const inflationPools = this.state.inflationPools.map(inflationPool => {
            return (
                <li key={inflationPool.account}>
                    <a href={ "https://jungle.eospark.com/account/" + inflationPool.account} target="_blank">{inflationPool.account}</a>
                    <ul>
                        <li>Distribution Percentage: {(inflationPool.percentage * 1).toPrecision(2)}%</li>
                        <li>Balance: {inflationPool.balance}</li>
                    </ul>
                </li>
            )
        });
        const rewardsActionTypes = this.state.rewardsActionTypes.map(actionType => {
            return (
                <li key={actionType.id}>
                    {actionType.type}
                    <ul>
                        <li>Max Reward: {actionType.max_reward}</li>
                        <li>Max Pay Outs: {actionType.max_pay_outs}</li>
                        <li>Actions
                            <Actions actionTypeId={actionType.id} />
                        </li>
                        <li>Historical Actions
                            <HistoricalActions actionTypeId={actionType.id} />
                        </li>
                    </ul>
                </li>
            )
        });

        return (
            <div className="container">
                <div className="row header">
                    <div className="column">
                        <h3 className="u-pull-left">Enterprise Token, To Boldly Go...</h3>
                        <div className="u-pull-right">
                        {this.state.identityState == identityState.identified ?
                            <button className="button-primary" onClick={() => this.signOut()}>Sign Out</button> :
                            <AuthenticateButton onClick={() => this.authenticate()} />
                        }
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="column">
                        <hr className="separator"/>
                    </div>
                </div>
                {this.state.identityState == identityState.scatterError &&
                <div className="row">
                    <div className="column">
                        <h5>Scatter error - you might need to open Scatter</h5>
                    </div>
                </div>
                }
                {this.state.identityState == identityState.identified &&
                <div>
                    <div className="row">
                        <div className="column">
                            <h4>Account Info</h4>
                            <IdentityInfo identity={scatter.identity} token={this.state.identity.token} />
                        </div>
                    </div>
                    <div className="row">
                        <div className="column">
                            <hr className="separator"/>
                        </div>
                    </div>
                </div>
                }
                <div className="row">
                    <div className="one-third column">
                        <h4>Token Info</h4>
                        <ul>
                            <li><a href="https://jungle.eospark.com/contract/gre111111111" target="_blank">Contract</a></li>
                            <li>Supply: {this.state.token.supply} ({((this.state.token.supplyValue / this.state.token.maxSupplyValue) * 100).toPrecision(2)}%)</li>
                            <li>Max Supply: {this.state.token.maxSupply}</li>
                            <li>Issuer: <a href={ "https://jungle.eospark.com/account/" + this.state.token.issuer} target="_blank">{this.state.token.issuer}</a></li>
                        </ul>
                        <ul>
                            <li>Inflation Percentage: {(this.state.inflation.inflationPercent * 100).toPrecision(2)}%</li>
                            <li>Frequencey (Seconds): {this.state.inflation.frequencySeconds}</li>
                            <li>Can Inflate: {this.state.inflation.canInflate ? "True" : "False"}</li>
                        </ul>
                    </div>
                    <div className="two-thirds column">
                        <div className="token-info-chart">
                            <ResponsiveWaffle
                                data={waffleChartData}
                                total={100}
                                rows={10}
                                columns={10}
                                margin={{
                                    "top": 10,
                                    "right": 10,
                                    "bottom": 10,
                                    "left": 120
                                }}
                                colors="category10"
                                colorBy="id"
                                borderColor="inherit:darker(0.3)"
                                animate={true}
                                motionStiffness={90}
                                motionDamping={11}
                            />
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="column">
                        <hr className="separator"/>
                    </div>
                </div>
                <div className="row">
                    <div className="column">
                        <h4>Inflation Pools</h4>
                    </div>
                </div>
                <div className="row">
                    <div className="one-third column">
                    {this.state.inflationPools.length > 0 &&
                        <ul>
                            {inflationPools}
                        </ul>
                    }
                    </div>
                    <div className="two-thirds column">
                        <div className="chart">
                            <ResponsivePie
                                data={pieChartData}
                                innerRadius={0.5}
                                padAngle={0.7}
                                cornerRadius={3}
                                margin={{
                                    "top": 20,
                                    "right": 40,
                                    "bottom": 40,
                                    "left": 40
                                }}
                                colors="paired"
                                colorBy="id"
                                radialLabelsTextColor="#ffffff"
                                radialLabelsLinkColor="#ffffff"
                                radialLabelsSkipAngle={20}
                                radialLabelsTextXOffset={6}
                                radialLabelsLinkOffset={5}
                                radialLabelsLinkDiagonalLength={16}
                                radialLabelsLinkHorizontalLength={24}
                                radialLabelsLinkStrokeWidth={2}
                                sliceLabel={(data) => (data.value * 1).toPrecision(2) + "%"}
                                slicesLabelsSkipAngle={10}
                                slicesLabelsTextColor="inherit:lighter(1.2)"
                                tooltip={(data) => data.label}
                            />
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="column">
                        <hr className="separator"/>
                    </div>
                </div>
                <div className="row">
                    <div className="column">
                        <h4>Rewards</h4>
                    </div>
                </div>
                <div className="row">
                    <div className="one-third column">
                        {this.state.rewardsState &&
                        <ul>
                            <li>Payable Actions: {this.state.rewardsState.payable_actions}</li>
                        </ul>
                        }
                    </div>
                    <div className="two-thirds column">
                        {this.state.rewardsActionTypes.length > 0 &&
                            <ul>
                                {rewardsActionTypes}
                            </ul>
                        }
                    </div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(
    <Main />,
    document.getElementById('root')
);