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
const rpc = new JsonRpc('https://jungle2.cryptolions.io:443');
const network = {
    blockchain: 'eos',
    protocol: 'https',
    host: 'jungle2.cryptolions.io',
    port: 443,
    chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473'
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
            displayIdentityInfo: false,
        }
    }

    componentDidMount() {
        this.getTokenInfo();
        this.getInflationInfo();
        this.getInflationPools();

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

    async authenticate() {
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

        console.log('Attempting to identify');

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
            displayIdentityInfo: true,
            identity: {
                token: {
                    balance: balance,
                }
            }
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

    signOut() {
        scatter.forgetIdentity();
        //this.stopGetBalance();
        this.setState({
            identity: {
                token: null,
            },
            displayIdentityInfo: false,
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

        return (
            <div className="container">
                <div className="row header">
                    <div className="column">
                        <h3 className="u-pull-left">Enterprise Token, To Boldly Go...</h3>
                        <div className="u-pull-right">
                        {this.state.displayIdentityInfo ?
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
                {this.state.displayIdentityInfo &&
                <div className="row">
                    <div className="column">
                            <h4>Account Info</h4>
                            <IdentityInfo identity={scatter.identity} token={this.state.identity.token} />
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
            </div>
        );
    }
}

ReactDOM.render(
    <Main />,
    document.getElementById('root')
);