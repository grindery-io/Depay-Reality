// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers, hardhatEthers } = require("hardhat");
import { network } from "hardhat";

describe("GRTPOOL", function () {
  let GRTPOOL;
  let GRTToken;
  let TokenToWithdraw;
  let userA;
  let userB;
  let userC;
  let userD;

  before(async function () {
    [userA, userB, userC, userD] = await ethers.getSigners();
    const _realityEth = await ethers.getContractFactory("RealityETH_v3_0");
    REALITYETH = await _realityEth.deploy();
    await REALITYETH.deployed();

    const _grtPool = await ethers.getContractFactory("GRTPOOL");
    GRTPOOL = await _grtPool.deploy(REALITYETH.address);
    await GRTPOOL.deployed();

    const _GRTToken = await ethers.getContractFactory("ERC20");
    GRTToken = await _GRTToken.deploy();
    await GRTToken.deployed();

    const _token_to_withdraw = await ethers.getContractFactory("ERC20");
    TokenToWithdraw = await _token_to_withdraw.deploy();
    await TokenToWithdraw.deployed();
  });

  it("Test should deposit GRT and create a question, answer the question, claim winnings and distribute funds", async function () {
    console.log("GRTPOOL deployed at:" + GRTPOOL.address);
    console.log("GRTToken deployed at: " + GRTToken.address);
    console.log("TokenToWithdraw deployed at: " + TokenToWithdraw.address);

    // initialize contract
    await GRTPOOL.initialize();

    // set exchange rate with withdrawal token
    await GRTPOOL.setExchangeRate(TokenToWithdraw.address, 2);

    // Mint withdrawal tokens for GRTPOOL contract
    await TokenToWithdraw.mint(GRTPOOL.address, "1000000000000000000000");

    expect(await TokenToWithdraw.balanceOf(GRTPOOL.address)).to.equal(
      "1000000000000000000000"
    );
    await GRTToken.mint(userA.address, "1000000000000000000000");

    expect(await GRTToken.balanceOf(userA.address)).to.equal(
      "1000000000000000000000"
    );

    await GRTToken.approve(GRTPOOL.address, "1000000000000000000000");

    // transfer ERC20 to pool by UserA
    const res = await GRTPOOL.transferERC20(
      GRTToken.address,
      1000,
      2,
      TokenToWithdraw.address
    );
    const txhash = res.hash;

    // creating template
    const stringTemplate =
      '{"title": "%s", "type": "bool", "category": "%s", "lang": "%s"}';
    const id = await GRTPOOL.createRealityERC20Template(stringTemplate);
    const _id = await id.wait();
    const templateId = _id.events[1].args[0].toString();

    const questionStr =
      "Did I make a transaction deposit of 1000GRT?␟ transaction ␟en";
    const __questionId = await GRTPOOL.createQuestionERC20(
      questionStr,
      txhash,
      2,
      1000,
      TokenToWithdraw.address,
      userB.address,
      templateId,
      { value: ethers.utils.parseEther("0.1") }
    );
    const _questionId = await __questionId.wait();
    const questionId = _questionId.events[2].args[0];

    // Getting the first has history equivalent to bytes32(0)
    const getHistoryHash = await GRTPOOL.getHistoryHash(questionId);

    // answering a question as userC
    const _answerQuestion = await GRTPOOL.connect(userC).answerQuestion(
      "true",
      questionId,
      0,
      { value: ethers.utils.parseEther("1") }
    );
    await _answerQuestion.wait();

    // Getting hash history after first answer
    const getHistoryHash1 = await GRTPOOL.getHistoryHash(questionId);

    // recording second answer
    await GRTPOOL.connect(userD).answerQuestion("false", questionId, 0, {
      value: ethers.utils.parseEther("2"),
    });

    // const provider = new ethers.providers.JsonRpcProvider(
    //   "http://localhost:8545"
    // );
    // const network = { provider: provider };

    // Jumping through time (1 day) which represents the timeout set
    await network.provider.send("evm_increaseTime", [97200]);
    await network.provider.send("evm_mine");

    // checking if question is finalized
    const isFinalized = await GRTPOOL.isFinalized(questionId);
    expect(isFinalized).to.equal(true);

    const getBounty = await GRTPOOL.getBounty(questionId);
    expect(getBounty).to.equal("100000000000000000");

    // getting answer1 in bytes32
    const answer1 = await GRTPOOL.getBytes("true");
    // getting answer2 in bytes32
    const answer2 = await GRTPOOL.getBytes("false");

    // const verifyHistoryInputOrRevert = await GRTPOOL.verifyHistoryInputOrRevert(getHistoryHash1, getHistoryHash, answer1, "1000000000000000000", userC.address)
    // console.log('verifyHistoryInputOrRevert', verifyHistoryInputOrRevert)

    const canWithdrawA = await GRTPOOL.canUserWithdraw(
      userB.address,
      questionId
    );
    expect(canWithdrawA).to.equal(null);

    // calling the claimWinnings function with the history hashes from the second-to-the-last to the first, he answerer's addesses (last to first), the bonds (last to first) and the answers passed
    await GRTPOOL.claimWinnings(
      questionId,
      [getHistoryHash1, getHistoryHash],
      [userD.address, userC.address],
      [ethers.utils.parseEther("2"), ethers.utils.parseEther("1")],
      [answer2, answer1]
    );

    const canWithdrawB = await GRTPOOL.canUserWithdraw(
      userB.address,
      questionId
    );
    expect(canWithdrawB).to.equal(true);

    await GRTPOOL.connect(userB).claimDepositExchange(
      questionId,
      userA.address
    );
    expect(await TokenToWithdraw.balanceOf(userB.address)).to.equal(
      "2000"
    );
  });
});
