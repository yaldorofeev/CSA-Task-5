import 'dotenv/config';
import { types, task } from "hardhat/config";

task("finish", "Undelegate votes")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("votingid", "ID of requested voting")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const myDAO = await hre.ethers.getContractAt("MyDAO",
  process.env.DAO_CONTRACT!, accounts[args.user]);

  const tx = await myDAO.finishProposal(args.votingid);
  const ttx = await tx.wait();
  console.log(ttx);
});
