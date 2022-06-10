import 'dotenv/config';
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "./tasks/deposit.ts";
import "./tasks/undeposit.ts";
import "./tasks/addproposal.ts";
import "./tasks/vote.ts";
import "./tasks/finish.ts";
import "./tasks/delegate.ts";
import "./tasks/undelegate.ts";
import "./tasks/mint.ts";
import "./tasks/grantroleerc.ts";



// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const accounts = [{
    privateKey: process.env.PRIVATE_KEY_OWNER,
    balance: "100000000000000000000"
  },
  {
    privateKey: process.env.PRIVATE_KEY_BAYER_1 ,
    balance: "100000000000000000000"
  },
  {
    privateKey: process.env.PRIVATE_KEY_BAYER_2,
    balance: "100000000000000000000"
  },
  {
    privateKey: process.env.PRIVATE_KEY_BAYER_3,
    balance: "100000000000000000000"
  }
];

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: {
    version: "0.8.6",
    settings: {
      optimizer: {enabled: process.env.DEBUG ? false : true},
    },
  },
  defaultNetwork: "rinkeby",
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: {mnemonic: process.env.MNEMONIC},
      // accounts:
      //   process.env.PRIVATE_KEY_OWNER !== undefined ? [process.env.PRIVATE_KEY_OWNER, process.env.PRIVATE_KEY_BAYER_1, process.env.PRIVATE_KEY_BAYER_2, process.env.PRIVATE_KEY_BAYER_3] : [],
      gasMultiplier: 1.2
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: {mnemonic: process.env.MNEMONIC}
    },
    hardhat: {
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    //apiKey: process.env.BSCSCAN_API_KEY,
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
