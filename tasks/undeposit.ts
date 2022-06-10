import 'dotenv/config';
import { types, task } from "hardhat/config";

task("undeposit", "Undeposits tokens from MyDAO")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("amount", "An amount of undeposited tokens")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const myDAO = await hre.ethers.getContractAt("MyDAO",
  process.env.DAO_CONTRACT!, accounts[args.user]);

  const tx = await myDAO.unDeposit(args.amount);
  const ttx = await tx.wait();
  console.log(ttx);
});
