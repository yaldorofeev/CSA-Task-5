import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("mint", "Mint tokens")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("account", "The account that recieves tokens")
  .addParam("amount", "The amount of tokens to mint")
  .setAction(async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("MyERC20Contract",
  process.env.ERC20_CONTRACT!, accounts[args.user]);
  const tx = await contract.mint(args.account, args.amount);
  tx.wait();
  console.log(tx);
});
