import { ethers } from "hardhat";

async function main() {

  const accounts = await ethers.getSigners();
  const main_owner = accounts[1];
  const main_owner_addr = await main_owner.getAddress();

  const chair_man_1 = accounts[2];
  const chair_man_addr_1 = await chair_man_1.getAddress();

  const MyDAO = await ethers.getContractFactory("MyDAO", main_owner);
  const myDAO = await MyDAO.deploy(chair_man_addr_1,
                                  process.env.ERC20_CONTRACT!,
                                  5000000, 1);

  await myDAO.deployed();

  console.log("MyDAO deployed to:", myDAO.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
