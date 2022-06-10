import { ethers } from "hardhat";

async function main() {

  const accounts = await ethers.getSigners();
  const main_owner = accounts[1];
  const main_owner_addr = await main_owner.getAddress();

  const reward_period_minutes = 60;
  const lock_period_minutes = 180;
  const reward_procents = 5;

  const SuperStaking = await ethers.getContractFactory("SuperStaking", main_owner);
  const superStaking = await SuperStaking.deploy(
    process.env.UNISWAP_CONTRACT!,
    process.env.ERC20_CONTRACT!,
    process.env.DAO_CONTRACT!,
    reward_period_minutes, lock_period_minutes, reward_procents);


  await superStaking.deployed();

  console.log("SuperStaking deployed to:", superStaking.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
