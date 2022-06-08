import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("setercrole", "Set role in erc token contract")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("chain", "Blockchain name (eth or bsc)")
  .setAction(async (args, hre) => {

  let bridge_addr;
  let erc20_addr;
  let chainId;

  if (args.chain == "eth") {
    erc20_addr = process.env.ERC20_CONTRACT_ETH!;
    bridge_addr = process.env.BRIDGE_CONTRACT_ETH!;
    hre.changeNetwork('rinkeby');
  }
  else if (args.chain == "bsc") {
    erc20_addr = process.env.ERC20_CONTRACT_BSC!;
    bridge_addr = process.env.BRIDGE_CONTRACT_BSC!;
    hre.changeNetwork('bsc_testnet');
  }
  else {
    console.log("Incorrect name of blockchain");
    return;
  }
  const accounts = await hre.ethers.getSigners();

  const contract = await hre.ethers.getContractAt("MyERC20Contract",
  erc20_addr, accounts[args.user]);

  await contract.grantRole(contract.MINTER_BURNER(), bridge_addr);
});
