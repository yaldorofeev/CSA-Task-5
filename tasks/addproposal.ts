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

  const file = await fs.readFileSync(args.calldatafile);
  const data = JSON.parse(file.toString());
  const abi = data[0];
  const funcname = data[1];
  const param = parseInt(data[2]);

  const iface = new hre.ethers.utils.Interface(abi);
  const calldata = iface.encodeFunctionData(funcname, [param]);

  const description = JSON.stringify({contract: args.recipient,
                                      function: funcname,
                                      newParametr: param,
                                      description: args.description});
  console.log(description);

  const tx = await myDAO.addProposal(calldata, args.recipient, description);
  const ttx = await tx.wait();
  console.log(ttx);
});
