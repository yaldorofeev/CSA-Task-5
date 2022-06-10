import 'dotenv/config';
import { types, task } from "hardhat/config";

task("vote", "Vote for preferred result")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("votingid", "ID of requested voting")
  .addParam("vote", "'yes' or 'no' string")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const myDAO = await hre.ethers.getContractAt("MyDAO",
  process.env.DAO_CONTRACT!, accounts[args.user]);

  let agree;
  if (args.vote == "yes") {
    agree = true;
  } else if (args.vote == "no") {
    agree = false;
  } else {
    console.log("Your answer have not suitable format. Please, enter 'yes' or 'no'");
  }

  const tx = await myDAO.vote(args.votingid, agree);
  const ttx = await tx.wait();
  console.log(ttx);
});
