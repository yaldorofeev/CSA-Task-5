//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
/* import './MyERC20Contract.sol'; */

contract MyDAO is AccessControl {
  using SafeERC20 for IERC20;

  // Accessing role to propose votings
  bytes32 public constant CHAIR_ROLE = keccak256("CHAIR_ROLE");

  uint256 public minimumQuorum;

  // Period of votings in hours that assigned in constructor once
  uint256 public immutable debatingPeriodDuration;

  address public voteTokenAddr;

  uint256 public votingCount;

  uint256 public chairManCount;

  IERC20 voteToken;

  /**
   * @dev Structure oh one voting
   * @param actual is this voting actual
   * @param startTime
   * @param description description of proposal
   * @param callData data for contract call
   * @param recipient: address of calling contract
   * @param totalVotes: total amoumt of votes
   * @param agreeVotes: amount of agree votes
   * @param voters: mapping from voter's address to flag is he already voted
   * @param delegations: mapping from voter's address to address to whom delegated
   * @param delegatedTotalBalance: mapping from voter's address to all amount
   *        that was delegeted to him
   */
  struct Voting {
    bool actual;
    uint startTime;
    string description;
    bytes callData;
    address recipient;
    uint256 totalVotes;
    uint256 agreeVotes;
    mapping(address => bool) voters;
    mapping(address => address) delegations;
    mapping(address => uint256) delegatedTotalBalance;
  }

  // Unordered array of actual votings
  uint256[] actualVotingsIds;

  // Mapping from users address to his voting balance
  mapping(address => uint256) votersBalance;

  // Mapping from id to votings
  mapping(uint256 => Voting) public votings;

  /* // Mapping from user to voting Ids in which he participated
  // (including delegated votings)
  mapping(address => uint256[]) participating; */

  /* *
   * @dev Emitted when 'voter' deposit `amount` of vote tokens to the contract
   */
  event Deposit(
    address voter,
    uint256 amount
  );

  /* *
   * Emitted when 'voter' undeposit `amount` of vote tokens from the contract
   */
  event Undeposit(
    address voter,
    uint256 amount
  );

  /* *
   * @dev Emitted when voting with 'votingId' finished with some 'result'.
   */
  event NewVotingAdded(
    uint256 votingId,
    string description
  );

  /* *
   * @dev Emitted when anybody voted in voting 'votingId' for 'result' with
   * 'amount' of votes.
   */
  event Vote(
    uint256 votingId,
    address voter,
    bool result,
    uint256 amount
  );

  /* *
   * @dev Emitted when voting with 'votingId' finished with some 'result'.
   */
  event VotingOver(
    uint256 votingId,
    bool result
  );

  /**
   * @dev constructor
   * @param _chairPerson first chairMan of the contract
   * @param _voteTokenAddr addresses of voting tokens contract
   * @param _minimumQuorum initial quorum
   * @param _debatingPeriodDuration debating period. Can't be changed in futher
   *        time
   */
  constructor(address _chairPerson, address _voteTokenAddr,
      uint256 _minimumQuorum, uint _debatingPeriodDuration) {

    require(_chairPerson != address(0), "Address of chair person can not be zero");
    require(_voteTokenAddr != address(0), "Address of token can not be zero");
    require(_debatingPeriodDuration != 0, "Debating period can not be zero");

    _setupRole(DEFAULT_ADMIN_ROLE, address(this));
    _grantRole(CHAIR_ROLE, _chairPerson);
    chairManCount = 1;

    voteToken = IERC20(_voteTokenAddr);
    voteTokenAddr = _voteTokenAddr;
    minimumQuorum = _minimumQuorum;
    debatingPeriodDuration = _debatingPeriodDuration;
  }

  /**
   * @dev Deposit tokens to contract
   * @param _amount of deposited tokens
   */
  function deposit(uint256 _amount) public {
    voteToken.safeTransferFrom(msg.sender, address(this), _amount);
    votersBalance[msg.sender] += _amount;
    emit Deposit(msg.sender, _amount);
  }

  /**
   * @dev Undeposit tokens from contract
   * @param _amount of undeposited tokens
   */
  function unDeposit(uint256 _amount) public {
    require(votersBalance[msg.sender] >= _amount, "Too many tokens requested");
    for (uint i = 0; i < actualVotingsIds.length; i++) {
      uint256 id = actualVotingsIds[i];
      Voting storage vt = votings[id];
      require(!vt.voters[msg.sender],
        "Undeposit operation reverted due to participating in actual voting");
      address delegator = vt.delegations[msg.sender];
      require(!vt.voters[delegator],
        "Undeposit operation reverted due to delegating in actual voting");
      if (vt.delegations[msg.sender] != address(0)) {
        vt.delegations[msg.sender] = address(0);
        vt.delegatedTotalBalance[delegator] -= votersBalance[msg.sender];
      }
    }
    voteToken.safeTransfer(msg.sender, _amount);
    votersBalance[msg.sender] -= _amount;
    emit Undeposit(msg.sender, _amount);
  }

  /**
   * @dev Only chairmans can propose votings
   * @param _callData: data for call an external contract
   * @param _recipient: address of an external contract
   * @param _description of call
   */
  function addProposal(bytes memory _callData, address _recipient,
      string memory _description) public {
    require(hasRole(CHAIR_ROLE, msg.sender), "Caller is not a chairman");
    uint256 votingId = votingCount;
    votingCount += 1;
    Voting storage vt = votings[votingId];
    vt.actual = true;
    vt.startTime = block.timestamp;
    vt.description = _description;
    vt.callData = _callData;
    vt.recipient = _recipient;
    vt.totalVotes = 0;
    vt.agreeVotes = 0;
    actualVotingsIds.push(votingId);
    emit NewVotingAdded(votingId, _description);
  }

  function delegate(uint256 _votingId, address _to) public {
    require(votersBalance[msg.sender] != 0, "No tokens to vote");
    require(votersBalance[_to] != 0, "This accaunt can not vote");
    require(msg.sender != _to, "Voter cannot delegate himself");
    Voting storage vt = votings[_votingId];
    require(vt.actual, "This voting is not actual");
    require(!vt.voters[_to], "The voter already voted");
    address sideDelegator = vt.delegations[_to];
    require(!vt.voters[sideDelegator],
      "This voter delegate his votes to some voter and that voter already voted");
    require(vt.delegations[msg.sender] == address(0),
      "The votes are already delegated. Undelegate them to redelegate");
    vt.delegatedTotalBalance[_to] += votersBalance[msg.sender];
    vt.delegations[msg.sender] = _to;
  }

  function unDelegate(uint256 _votingId) public {
    require(votersBalance[msg.sender] != 0, "No tokens to vote");
    Voting storage vt = votings[_votingId];
    require(vt.actual, "This voting is not actual");
    address delegator = vt.delegations[msg.sender];
    require(delegator != address(0), "Nothing to undelegate");
    require(!vt.voters[delegator], "The voter already voted");
    vt.delegations[msg.sender] = address(0);
    vt.delegatedTotalBalance[delegator] -= votersBalance[msg.sender];
  }

  function vote(uint256 _votingId, bool _agree) public {
    require(votersBalance[msg.sender] != 0, "No tokens to vote");
    Voting storage vt = votings[_votingId];
    require(vt.actual, "This voting is not actual");
    require(block.timestamp < vt.startTime + debatingPeriodDuration * 1 hours,
      "The time of voting is elapsed");
    require(!vt.voters[msg.sender], "The voter already voted");
    address delegator = vt.delegations[msg.sender];
    require(!vt.voters[delegator],
      "The voter delegate his votes and delegator already voted");
    if (delegator != address(0)) {
      vt.delegatedTotalBalance[delegator] -= votersBalance[msg.sender];
    }
    vt.delegations[msg.sender] = address(0);
    uint256 amount = votersBalance[msg.sender];
    amount += vt.delegatedTotalBalance[msg.sender];
    vt.voters[msg.sender] = true;
    if (_agree) {
      vt.totalVotes += amount;
      vt.agreeVotes += amount;
    } else {
      vt.totalVotes += amount;
    }
    emit Vote(_votingId, msg.sender, _agree, amount);
  }

  function finishProposal(uint256 _votingId) public {
    Voting storage vt = votings[_votingId];
    require(block.timestamp > vt.startTime + debatingPeriodDuration * 1 hours,
      "The time of voting is not elapsed");
    require(vt.totalVotes >= minimumQuorum,
      "Not enougth votes for quorum");
    if (vt.totalVotes - vt.agreeVotes >= vt.agreeVotes) {
      vt.actual = false;
      emit VotingOver(_votingId, false);
    } else {
      (bool sucsess, ) = vt.recipient.call(vt.callData);
      require(sucsess, "ERROR call func");
      vt.actual = false;
      emit VotingOver(_votingId, true);
    }
    for (uint i = 0; i < actualVotingsIds.length; i++) {
      if (actualVotingsIds[i] == _votingId) {
        actualVotingsIds[i] = actualVotingsIds[actualVotingsIds.length - 1];
        actualVotingsIds.pop();
        break;
      }
    }
  }

  function addChairMan(address newChairman) public {
    require(msg.sender == address(this), "This function can be called only from voting");
    _grantRole(CHAIR_ROLE, newChairman);
    chairManCount += 1;
  }

  function removeChairMan(address chairMan) public {
    require(msg.sender == address(this), "This function can be called only from voting");
    require(chairManCount > 1, "Can not leave contract without chairman");
    _revokeRole(CHAIR_ROLE, chairMan);
    chairManCount -= 1;
  }

  function resetMinimumQuorum(uint256 newQuorum) public {
    require(msg.sender == address(this), "This function can be called only from voting");
    minimumQuorum = newQuorum;
  }

  /* function onERC721Received(
    address,
    address,
    uint256,
    bytes calldata
    )external returns(bytes4) {
    return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
  }

  function onERC1155Received(
    address,
    address,
    uint256,
    uint256,
    bytes calldata
    )external returns(bytes4) {
    return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
  } */

}
