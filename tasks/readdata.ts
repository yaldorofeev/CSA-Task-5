import 'dotenv/config';
import { types, task } from "hardhat/config";
import * as fs from 'fs';

task("readdata", "Read data")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("votingid", "ID of requested voting")
  .addParam("abifile", "File with abi")
  .setAction(async (args, hre) => {

  const file = await fs.readFileSync(args.abifile);
  const abi = JSON.parse(file.toString());

  const accounts = await hre.ethers.getSigners();

  const myDAO = await hre.ethers.getContractAt("MyDAO",
  process.env.DAO_CONTRACT!, accounts[args.user]);

  const vt = await myDAO.votings(args.votingid);
  const calldata = vt["callData"];
  const jsonStr = vt["description"];

  const descr = JSON.parse(jsonStr);

  const iface = new hre.ethers.utils.Interface(abi);

  const result = await iface.decodeFunctionData(descr["function"], calldata);
  console.log(result);
});
