import 'dotenv/config';
import { types, task } from "hardhat/config";

task("deposit", "Deposits tokens on MyDAO")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("calldata", "ABI of called function")
  .addParam("recipient", "Contract address")
  .addParam("description", "Description of operation")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const myDAO = await hre.ethers.getContractAt("MyDAO",
  process.env.DAO_CONTRACT, accounts[args.user]);

  const tx = await myDAO.addProposal(args.calldata, args.recipient, args.description);
  ttx = tx.wait();
  console.log(ttx);
});
