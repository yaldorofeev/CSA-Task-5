import 'dotenv/config';
import { types, task } from "hardhat/config";

task("deposit", "Deposits tokens on MyDAO")
  .addParam("user", "ID of accaunt in array in .env")
  .addParam("amount", "An amount of deposited tokens")
  .setAction(async (args, hre) => {

  const accounts = await hre.ethers.getSigners();

  const myERC20= await hre.ethers.getContractAt("MyERC20Contract",
  process.env.ERC20_CONTRACT!, accounts[args.user]);

  await myERC20.approve(process.env.DAO_CONTRACT!, args.amount);

  const myDAO = await hre.ethers.getContractAt("MyDAO",
  process.env.DAO_CONTRACT!, accounts[args.user]);

  const tx = await myDAO.deposit(args.amount);
  const ttx = await tx.wait();
  console.log(ttx);
});
