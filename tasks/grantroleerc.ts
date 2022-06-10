import 'dotenv/config';
import { types } from "hardhat/config";
import { task } from "hardhat/config";

task("grantroleerc", "Grante role of mint and burn")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("account", "The account that granted")
  .setAction(async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("MyERC20Contract",
  process.env.ERC20_CONTRACT!, accounts[args.user]);
  const role = await contract.MINTER_BURNER();
  const tx = await contract.grantRole(role, args.account);
  tx.wait();
  console.log(tx);
});
