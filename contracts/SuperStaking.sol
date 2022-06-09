//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract SuperStaking {

  IERC20 rewardTokens;
  IERC20 lPTokens;

  uint public  reward_period_minutes;
  uint public  lock_period_minutes;
  uint256 public  reward_procents;

  address public immutable dao_address;

  /* UniswapV2Factory router; */

  struct Stake {
    uint256 stakeId;
    uint256 amount;
    uint claim_time;
    uint start_time;
  }

  struct Stake_account {
    Stake[] stakes;
    uint256 total_amount;
  }

  mapping(address => Stake_account) private stakeAccounts;

  event StakeDone (
      address indexed _from,
      uint256 _value
  );

  event Claim(
      address indexed _to,
      uint256 _value
  );

  event Unstake(
    address indexed _to,
    uint256 _value
  );

  constructor(address _uniswap_contract_address,
              address _erc20_reward_contract_address,
              address _dao_address,
              uint _reward_period_minutes,
              uint _lock_period_minutes,
              uint256 _reward_procents
              ) {
    require(_uniswap_contract_address != address(0),
    "Contract address can not be zero");
    require(_erc20_reward_contract_address != address(0),
    "Contract address can not be zero");
    require(_dao_address != address(0),
    "Contract address can not be zero");
    require(_reward_period_minutes != 0, "Reward period can not be zero");
    rewardTokens = IERC20(_erc20_reward_contract_address);
    lPTokens = IERC20(_uniswap_contract_address);
    reward_period_minutes = _reward_period_minutes;
    lock_period_minutes = _lock_period_minutes;
    reward_procents = _reward_procents;
    dao_address = _dao_address;
  }

  function stake(uint256 _amount) public {
    require(lPTokens.balanceOf(msg.sender) >= _amount, "Not enaught tokens");
    Stake_account storage sk = stakeAccounts[msg.sender];
    sk.total_amount += _amount;
    Stake memory st = Stake(
      {
        stakeId: sk.stakes.length,
        amount: _amount,
        start_time: block.timestamp,
        claim_time: block.timestamp
      }
    );
    sk.stakes.push(st);
    (bool sucsess, ) = address(lPTokens).delegatecall(abi.encodeWithSignature("transfer(address, uint256)", address(this), _amount));
    require(sucsess, "ERROR call transfer");
    emit StakeDone(msg.sender, _amount);
  }

  function claim() public {
    uint _now_ = block.timestamp;
    uint256 total_reward;
    Stake_account storage sk = stakeAccounts[msg.sender];
    for (uint i = 0; i < sk.stakes.length; i++){
      uint reward_times = (_now_ - sk.stakes[i].claim_time) / (reward_period_minutes * 1 minutes);
      uint256 reward = sk.stakes[i].amount * reward_procents * reward_times / 100;
      total_reward += reward;
      sk.stakes[i].claim_time = _now_- (_now_ - sk.stakes[i].claim_time) % (reward_period_minutes * 1 minutes);
    }
    require(rewardTokens.balanceOf(address(this)) >= total_reward, "Sorry, but it is not enougth tokens on the contract");
    rewardTokens.transfer(msg.sender, total_reward);
    emit Claim(msg.sender, total_reward);
  }

  function claimOneStake(uint256 _stakeId) public {
    uint _now_ = block.timestamp;
    Stake_account storage sk = stakeAccounts[msg.sender];
    uint reward_times = (_now_ - sk.stakes[_stakeId].claim_time) / (reward_period_minutes * 1 minutes);
    uint256 reward = sk.stakes[_stakeId].amount * reward_procents * reward_times / 100;
    sk.stakes[_stakeId].claim_time = _now_- (_now_ - sk.stakes[_stakeId].claim_time) % (reward_period_minutes * 1 minutes);
    require(rewardTokens.balanceOf(address(this)) >= reward, "Sorry, but it is not enougth tokens on the contract");
    rewardTokens.transfer(msg.sender, reward);
    emit Claim(msg.sender, reward);
  }

  function unstake(uint256 _stakeId, uint256 _amount) public {
    uint _now_ = block.timestamp;
    Stake_account storage sk = stakeAccounts[msg.sender];
    require(_stakeId < sk.stakes.length, "Invalid ID of stake");
    require(_now_ >=  sk.stakes[_stakeId].start_time + lock_period_minutes * 1 minutes, "Its not time to unstake");
    require(sk.stakes[_stakeId].amount >= _amount, "Amount of tokens exceeds staked amount");
    claimOneStake(_stakeId);
    sk.stakes[_stakeId].amount -= _amount;
    address(lPTokens).call(abi.encodeWithSignature("transfer(address, uint256)", msg.sender, _amount));
    sk.total_amount -= _amount;
    emit Unstake(msg.sender, _amount);
  }

  function getStakerState() public view returns(uint256, Stake[] memory) {
    Stake_account storage sk = stakeAccounts[msg.sender];
    return(sk.total_amount, sk.stakes);
  }

  function changeRewardPeriod(uint newPeriod) public {
    require(msg.sender == dao_address, "Only MyDAO can change reward period");
    reward_period_minutes = newPeriod;
  }


}
