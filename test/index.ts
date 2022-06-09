import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Signer, Contract } from "ethers";
import * as dotenv from "dotenv";
import { types } from "hardhat/config";

describe("MyDAO", function () {
  //We will test contract in hardhat network without forking, so we should
  //deploy token contract and staking contruct

  let accounts: Signer[];

  let main_owner: Signer;
  let main_owner_addr: string;

  let chair_man_1: Signer;
  let chair_man_addr_1: string;

  let chair_man_2: Signer;
  let chair_man_addr_2: string;

  let user_1: Signer;
  let user_addr_1: string;

  let user_2: Signer;
  let user_addr_2: string;

  let user_3: Signer;
  let user_addr_3: string;

  let user_4: Signer;
  let user_addr_4: string;

  let user_5: Signer;
  let user_addr_5: string;

  let myDAO: Contract;
  let myERC20Contract: Contract;
  let myStaking: Contract;

  let user_votes_1 = 1000000;
  let user_votes_2 = 2000000;
  let user_votes_3 = 3000000;
  let user_votes_5 = 1000000;

  const minimumQuorum = 4000000;
  const debatingPeriodDuration = 24;

  const votingId_0 = 0;
  const votingId_1 = 1;
  const votingId_2 = 2;
  const votingId_3 = 3;
  const votingId_twice_2 = 4;
  const noVotingId = 10;

  let newPeriodAbi = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "newPeriod",
          "type": "uint256"
        }
      ],
      "name": "changeRewardPeriod",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  let addChairManAbi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newChairman",
          "type": "address"
        }
      ],
      "name": "addChairMan",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  let removeChairManAbi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "chairMan",
          "type": "address"
        }
      ],
      "name": "removeChairMan",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  let resetMinimumQuorumAbi = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "newQuorum",
          "type": "uint256"
        }
      ],
      "name": "resetMinimumQuorum",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];


  let snapShot = 0x00;

  it("Deploy token contract, define roles of accounts and mint tokens to voters",
      async function () {

    accounts = await ethers.getSigners();

    main_owner = accounts[0];
    main_owner_addr = await main_owner.getAddress();

    chair_man_1 = accounts[1];
    chair_man_addr_1 = await chair_man_1.getAddress();

    chair_man_2 = accounts[3];
    chair_man_addr_2 = await chair_man_2.getAddress();

    user_1 = accounts[4];
    user_addr_1 = await user_1.getAddress();

    user_2 = accounts[5];
    user_addr_2 = await user_2.getAddress();

    user_3 = accounts[6];
    user_addr_3 = await user_3.getAddress();

    user_4 = accounts[7];
    user_addr_4 = await user_4.getAddress();

    user_5 = accounts[8];
    user_addr_5 = await user_5.getAddress();

    const MyERC20Contract = await ethers.getContractFactory("MyERC20Contract");
    myERC20Contract = await MyERC20Contract.deploy();
    await myERC20Contract.deployed();

    await expect(myERC20Contract.grantRole(myERC20Contract.MINTER_BURNER(),
      main_owner_addr)).to.emit(myERC20Contract, "RoleGranted")
      .withArgs(await myERC20Contract.MINTER_BURNER(),
        main_owner_addr, main_owner_addr);

    await expect(myERC20Contract.mint(user_addr_1, user_votes_1))
      .to.emit(myERC20Contract, "Transfer")
      .withArgs(ethers.constants.AddressZero, user_addr_1, user_votes_1);

    await expect(myERC20Contract.mint(user_addr_2, user_votes_2))
      .to.emit(myERC20Contract, "Transfer")
      .withArgs(ethers.constants.AddressZero, user_addr_2, user_votes_2);

    await expect(myERC20Contract.mint(user_addr_3, user_votes_3))
      .to.emit(myERC20Contract, "Transfer")
      .withArgs(ethers.constants.AddressZero, user_addr_3, user_votes_3);

    await expect(myERC20Contract.mint(user_addr_5, user_votes_5))
      .to.emit(myERC20Contract, "Transfer")
      .withArgs(ethers.constants.AddressZero, user_addr_5, user_votes_5);
  });

  it("Test deploy dao contract", async function () {
    const MyDAO = await ethers.getContractFactory("MyDAO");

    await expect(MyDAO.deploy(ethers.constants.AddressZero,
                              myERC20Contract.address,
                              minimumQuorum,
                              debatingPeriodDuration))
      .to.be.revertedWith("Address of chair person can not be zero");

    await expect(MyDAO.deploy(chair_man_addr_1,
                              ethers.constants.AddressZero,
                              minimumQuorum,
                              debatingPeriodDuration))
      .to.be.revertedWith("Address of token can not be zero");

    await expect(MyDAO.deploy(chair_man_addr_1,
                              myERC20Contract.address,
                              minimumQuorum,
                              0))
      .to.be.revertedWith("Debating period can not be zero");

    myDAO = await MyDAO.deploy(chair_man_addr_1,
                               myERC20Contract.address,
                               minimumQuorum,
                               debatingPeriodDuration);

    await myDAO.deployed();
  });

  it("Deploy myStaking contract", async function () {
    const SuperStaking = await ethers.getContractFactory("SuperStaking");
    myStaking = await SuperStaking.deploy(process.env.UNISWAP_CONTRACT!,
                                          myERC20Contract.address,
                                          myDAO.address,
                                          100,
                                          10,
                                          10);
    await myStaking.deployed();
  });

  it("Test deposit tokens", async function () {
    await expect(myERC20Contract.connect(user_1)
      .approve(myDAO.address, user_votes_1))
      .to.emit(myERC20Contract, "Approval")
      .withArgs(user_addr_1, myDAO.address, user_votes_1);

    await expect(myDAO.connect(user_1).deposit(user_votes_1))
      .to.emit(myDAO, "Deposit")
      .withArgs(user_addr_1, user_votes_1);

    await expect(myERC20Contract.connect(user_2)
      .approve(myDAO.address, user_votes_2))
      .to.emit(myERC20Contract, "Approval")
      .withArgs(user_addr_2, myDAO.address, user_votes_2);

    await expect(myDAO.connect(user_2).deposit(user_votes_2))
      .to.emit(myDAO, "Deposit")
      .withArgs(user_addr_2, user_votes_2);

    await expect(myERC20Contract.connect(user_3)
      .approve(myDAO.address, user_votes_3))
      .to.emit(myERC20Contract, "Approval")
      .withArgs(user_addr_3, myDAO.address, user_votes_3);

    await expect(myDAO.connect(user_3).deposit(user_votes_3))
      .to.emit(myDAO, "Deposit")
      .withArgs(user_addr_3, user_votes_3);

    await expect(myERC20Contract.connect(user_5)
      .approve(myDAO.address, user_votes_5))
      .to.emit(myERC20Contract, "Approval")
      .withArgs(user_addr_5, myDAO.address, user_votes_5);

    await expect(myDAO.connect(user_5).deposit(user_votes_5))
      .to.emit(myDAO, "Deposit")
      .withArgs(user_addr_5, user_votes_5);
  });

  it("Test addProposal for external contract", async function () {
    const iface = new ethers.utils.Interface(newPeriodAbi);
    const calldata = iface.encodeFunctionData("changeRewardPeriod",[200]);
    const recipient = myStaking.address;
    const description = "Reward period of the staking contract too short. Let make it 200";

    await expect(myDAO.addProposal(calldata,
                                   recipient,
                                   description))
      .to.be.revertedWith("Caller is not a chairman");

    await expect(myDAO.connect(chair_man_1).addProposal(calldata,
                                                        recipient,
                                                        description))
      .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_0, description);
  });

  it("Add proposal for add/remove chairman and reset minimum quorum",
      async function () {

    let recipient = myDAO.address;
    let description = "description";

    let iface = new ethers.utils.Interface(removeChairManAbi);
    let calldata = iface.encodeFunctionData("removeChairMan", [chair_man_addr_1]);

    await expect(myDAO.connect(chair_man_1).addProposal(calldata,
                                                        recipient,
                                                        description))
      .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_1, description);

    // 6 hours shifts
    await ethers.provider.send('evm_increaseTime', [3600 * 6]);
    await ethers.provider.send('evm_mine', []);

    iface = new ethers.utils.Interface(addChairManAbi);
    calldata = iface.encodeFunctionData("addChairMan", [chair_man_addr_2]);

    await expect(myDAO.connect(chair_man_1).addProposal(calldata,
                                                        recipient,
                                                        description))
      .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_2, description);

    // 6 hours shifts
    await ethers.provider.send('evm_increaseTime', [3600 * 6]);
    await ethers.provider.send('evm_mine', []);

    iface = new ethers.utils.Interface(resetMinimumQuorumAbi);
    calldata = iface.encodeFunctionData("resetMinimumQuorum",[4500000]);

    await expect(myDAO.connect(chair_man_1).addProposal(calldata,
                                                        recipient,
                                                        description))
      .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_3, description);

    iface = new ethers.utils.Interface(addChairManAbi);
    calldata = iface.encodeFunctionData("addChairMan", [chair_man_addr_2]);

    await expect(myDAO.connect(chair_man_1).addProposal(calldata,
                                                        recipient,
                                                        description))
      .to.emit(myDAO, "NewVotingAdded").withArgs(votingId_twice_2, description);
  });

  it("Test reverts of vote function", async function () {
    snapShot = await network.provider.send("evm_snapshot");

    await expect(myDAO.connect(user_4).vote(votingId_0, true))
      .to.be.revertedWith("No tokens to vote");

    await expect(myDAO.connect(user_1).vote(noVotingId, true))
      .to.be.revertedWith("This voting is not actual");

    await ethers.provider.send('evm_increaseTime', [3600 * 12]);
    await ethers.provider.send('evm_mine', []);

    await expect(myDAO.connect(user_1).vote(votingId_0, true))
      .to.be.revertedWith("The time of voting is elapsed");

    await network.provider.send("evm_revert", [snapShot]);
    snapShot = await network.provider.send("evm_snapshot");

    await expect(myDAO.connect(user_1).vote(votingId_0, true))
      .to.emit(myDAO, "Vote").withArgs(votingId_0, user_addr_1, true,
                                       user_votes_1);

    await expect(myDAO.connect(user_1).vote(votingId_0, false))
      .to.be.revertedWith("The voter already voted");

  });

  describe("Test vote function when votes delegated (user_2 delegete to user_3)",
      function () {

    it("User_2 voted himself and then user_3 voted (amount of his votes then\n"
        + "          should be equal to his balance)",
        async function () {

      await myDAO.connect(user_2).delegate(votingId_0, user_addr_3);

      await expect(myDAO.connect(user_2).vote(votingId_0, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_0, user_addr_2, true,
                                         user_votes_2);

      await expect(myDAO.connect(user_3).vote(votingId_0, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_0, user_addr_3, true,
                                         user_votes_3);
    });

    it("Revert state then user_2 deleget and then undelegete his votes to user_3\n"
        + "          (amount of user_3 votes should be equal to his balance)",
        async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await myDAO.connect(user_2).delegate(votingId_0, user_addr_3);
      await myDAO.connect(user_2).unDelegate(votingId_0);

      await expect(myDAO.connect(user_3).vote(votingId_0, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_0, user_addr_3, true,
                                         user_votes_3);
    });

    it("Revert state then user_3 vote but user_2 delegate to user_3 and then\n"
        + "(         undeposit his tokens, so amount of user_3 votes\n"
        + "          should be equal to his balance (no matter how many unDeposit))",
        async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await myDAO.connect(user_2).delegate(votingId_0, user_addr_3);

      await expect(myDAO.connect(user_2).unDeposit(1000000))
        .to.emit(myDAO, "Undeposit").withArgs(user_addr_2, 1000000);

      await expect(myDAO.connect(user_3).vote(votingId_0, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_0, user_addr_3, true,
                                         user_votes_3);
    });

    it("Revert state then only user_3 vote (amount of his votes then\n"
        + "          should be equal to his balance plus balance of user_2)",
        async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await myDAO.connect(user_2).delegate(votingId_0, user_addr_3);

      await expect(myDAO.connect(user_3).vote(votingId_0, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_0, user_addr_3, true,
                                         user_votes_3 + user_votes_2);
    });

    it("User_2 try to vote after user_3 voted", async function () {
      await expect(myDAO.connect(user_2).vote(votingId_0, true))
        .to.be.revertedWith(
          "The voter delegate his votes and delegator already voted");
    });
  });

  describe("Test reverts of unDeposit function", function () {

    it("Try undeposit too many tokens",
        async function () {

      await expect(myDAO.connect(user_2).unDeposit(user_votes_2 + 1))
        .to.be.revertedWith("Too many tokens requested");
    });

    it("Try undeposit by user_2 who delegeted his votes (the voting is actual)",
        async function () {

      await expect(myDAO.connect(user_2).unDeposit(user_votes_2))
        .to.be.revertedWith(
          "Undeposit operation reverted due to delegating in actual voting");
    });

    it("Try undeposit by user_3 who voted and that voting is actual yet",
        async function () {

      await expect(myDAO.connect(user_3).unDeposit(user_votes_3))
        .to.be.revertedWith(
          "Undeposit operation reverted due to participating in actual voting");
    });
  });

  describe("Test reverts of delegate and unDelegate (in actual state user_2\n"
      + "           delegate to user_3 and user_3 voted)", function () {

    it("Delegate", async function () {

      await expect(myDAO.connect(user_4).delegate(votingId_0, user_addr_3))
        .to.be.revertedWith("No tokens to vote");

      await expect(myDAO.connect(user_1).delegate(votingId_0, user_addr_4))
        .to.be.revertedWith("This accaunt can not vote");

      await expect(myDAO.connect(user_1).delegate(votingId_0, user_addr_1))
        .to.be.revertedWith("Voter cannot delegate himself");

      await expect(myDAO.connect(user_1).delegate(noVotingId, user_addr_3))
        .to.be.revertedWith("This voting is not actual");

      await expect(myDAO.connect(user_1).delegate(votingId_0, user_addr_3))
        .to.be.revertedWith("The voter already voted");

      await expect(myDAO.connect(user_1).delegate(votingId_0, user_addr_2))
        .to.be.revertedWith(
          "This voter delegate his votes to some voter and that voter already voted");

      await myDAO.connect(user_1).delegate(votingId_0, user_addr_5);

      await expect(myDAO.connect(user_1).delegate(votingId_0, user_addr_5))
        .to.be.revertedWith(
          "The votes are already delegated. Undelegate them to redelegate");
    });

    it("Undelegate", async function () {

      await expect(myDAO.connect(user_4).unDelegate(votingId_0))
        .to.be.revertedWith("No tokens to vote");

      await expect(myDAO.connect(user_1).unDelegate(noVotingId))
        .to.be.revertedWith("This voting is not actual");

      await expect(myDAO.connect(user_3).unDelegate(votingId_0))
        .to.be.revertedWith("Nothing to undelegate");

      await expect(myDAO.connect(user_2).unDelegate(votingId_0))
        .to.be.revertedWith("The voter already voted");
    });
  });

  describe("Test finishProposal", function () {

    it("Revert when time not elapsed", async function () {
      await expect(myDAO.connect(user_4).finishProposal(votingId_0))
        .to.be.revertedWith("The time of voting is not elapsed");
    });

    it("Pass when no quorum and revert becourse not actual", async function () {
      await ethers.provider.send('evm_increaseTime', [3600 * 18]);
      await ethers.provider.send('evm_mine', []);

      const avl = await myDAO.connect(user_4).getActualVotingsIdsLength();
      await myDAO.connect(user_4).finishProposal(votingId_1);
      await myDAO.connect(user_4).getActualVotingsIdsLength();
      expect(await myDAO.connect(user_4).getActualVotingsIdsLength()).to.be.equal(avl - 1);

      await expect(myDAO.connect(user_4).finishProposal(votingId_1))
        .to.be.revertedWith("This voting is not actual");
    });

    it("Revert when called function failed (removeChairMan, becourse only one chairman)",
        async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await expect(myDAO.connect(user_1).vote(votingId_1, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_1, user_addr_1, true,
                                         user_votes_1);

      await expect(myDAO.connect(user_3).vote(votingId_1, true))
       .to.emit(myDAO, "Vote").withArgs(votingId_1, user_addr_3, true,
                                        user_votes_3);

      await ethers.provider.send('evm_increaseTime', [3600 * 18]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_1))
        .to.be.revertedWith("ERROR call func");
    });

    it("Finish votingId_1(removeChairMan) with negative result", async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await expect(myDAO.connect(user_1).vote(votingId_1, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_1, user_addr_1, true,
                                         user_votes_1);

      await expect(myDAO.connect(user_3).vote(votingId_1, false))
       .to.emit(myDAO, "Vote").withArgs(votingId_1, user_addr_3, false,
                                        user_votes_3);

      await ethers.provider.send('evm_increaseTime', [3600 * 18]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_1))
        .to.emit(myDAO, "VotingOver").withArgs(votingId_1, false);
    });

    it("Finish votingId_1 with negative result equality of agree and disagree",
        async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await expect(myDAO.connect(user_1).vote(votingId_1, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_1, user_addr_1, true,
                                         user_votes_1);

      await expect(myDAO.connect(user_2).vote(votingId_1, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_1, user_addr_2, true,
                                         user_votes_2);

      await expect(myDAO.connect(user_3).vote(votingId_1, false))
       .to.emit(myDAO, "Vote").withArgs(votingId_1, user_addr_3, false,
                                        user_votes_3);

      await ethers.provider.send('evm_increaseTime', [3600 * 18]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_1))
        .to.emit(myDAO, "VotingOver").withArgs(votingId_1, false);
    });

    it("Finish votingId_2(addChairMan) and votingId_twice_2 and then \n"
        + "votingId_1(removeChairMan) with positive result", async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await expect(myDAO.connect(user_1).vote(votingId_1, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_1, user_addr_1, true,
                                         user_votes_1);

      await expect(myDAO.connect(user_3).vote(votingId_1, true))
       .to.emit(myDAO, "Vote").withArgs(votingId_1, user_addr_3, true,
                                        user_votes_3);

      await expect(myDAO.connect(user_1).vote(votingId_2, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_2, user_addr_1, true,
                                         user_votes_1);

      await expect(myDAO.connect(user_3).vote(votingId_2, true))
       .to.emit(myDAO, "Vote").withArgs(votingId_2, user_addr_3, true,
                                        user_votes_3);

      await expect(myDAO.connect(user_1).vote(votingId_twice_2, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_twice_2, user_addr_1, true,
                                         user_votes_1);

      await expect(myDAO.connect(user_3).vote(votingId_twice_2, true))
       .to.emit(myDAO, "Vote").withArgs(votingId_twice_2, user_addr_3, true,
                                        user_votes_3);


      await ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_2))
        .to.emit(myDAO, "VotingOver").withArgs(votingId_2, true);

      await expect(myDAO.connect(user_4).finishProposal(votingId_twice_2))
        .to.be.revertedWith("ERROR call func");

      await expect(myDAO.connect(user_4).finishProposal(votingId_1))
        .to.emit(myDAO, "VotingOver").withArgs(votingId_1, true);
    });

    it("Finish votingId_3(resetMinimumQuorum) with positive result",
      async function () {

      await network.provider.send("evm_revert", [snapShot]);
      snapShot = await network.provider.send("evm_snapshot");

      await expect(myDAO.connect(user_1).vote(votingId_3, true))
        .to.emit(myDAO, "Vote").withArgs(votingId_3, user_addr_1, true,
                                         user_votes_1);

      await expect(myDAO.connect(user_3).vote(votingId_3, true))
       .to.emit(myDAO, "Vote").withArgs(votingId_3, user_addr_3, true,
                                        user_votes_3);

      await ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await ethers.provider.send('evm_mine', []);

      await expect(myDAO.connect(user_4).finishProposal(votingId_3))
        .to.emit(myDAO, "VotingOver").withArgs(votingId_3, true);

      expect(await myDAO.minimumQuorum()).to.be.equal(4500000);

    });
  });

  it("Try call selftune functions from any addresses (that are not this contract))",
      async function () {

    await expect(myDAO.connect(main_owner).addChairMan(main_owner_addr))
      .to.be.revertedWith("This function can be called only from voting");

    await expect(myDAO.connect(chair_man_1).removeChairMan(chair_man_addr_1))
      .to.be.revertedWith("This function can be called only from voting");

    await expect(myDAO.connect(user_1).resetMinimumQuorum(user_addr_1))
      .to.be.revertedWith("This function can be called only from voting");
  });

});
