import 'dotenv/config';
import { types, task } from "hardhat/config";
import * as fs from 'fs';

task("addproposal", "Deposits tokens on MyDAO")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("calldatafile", "ABI of called function")
  .addParam("recipient", "Contract address")
  .addParam("description", "Description of operation")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const myDAO = await hre.ethers.getContractAt("MyDAO",
  process.env.DAO_CONTRACT!, accounts[args.user]);

  let data = await fs.readFileSync(args.calldatafile);
  const abi = JSON.parse(data.toString());
  const iface = new hre.ethers.utils.Interface(abi);
  const calldata = iface.encodeFunctionData("changeRewardPeriod",[90]);

  // console.log(abi);


  const tx = await myDAO.addProposal(data, args.recipient, args.description);
  const ttx = await tx.wait();
  console.log(ttx);
});
