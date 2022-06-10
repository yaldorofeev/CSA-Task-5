import 'dotenv/config';
import { types, task } from "hardhat/config";

task("delegate", "Delegate decision making in voting to some person")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("votingid", "ID of requested voting")
  .addParam("delegated", "Address of delegated person")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const myDAO = await hre.ethers.getContractAt("MyDAO",
  process.env.DAO_CONTRACT!, accounts[args.user]);

  const tx = await myDAO.delegate(args.votingid, args.delegated);
  const ttx = await tx.wait();
  console.log(ttx);
});
