// Right click on the script name and hit "Run" to execute
// import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network, upgrades } from "hardhat";
// import { GrtPool, ERC20_OZ, RealityETH_v3_0 } from "../typechain-types";
// import {loadFixture, deployContract } from 'ethereum-waffle';
// import {loadFixture, deployContract } from "@nomicfoundation/hardhat-chai-matchers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Grindery Pool testings", function () {
  // let grtpool: GrtPool;
  // let grtToken: ERC20_OZ;
  // let realityEth: RealityETH_v3_0;
  // let token: ERC20_OZ;
  // let owner: any, user1: any, user2: any, user3: any, user4: any, user5: any;

  async function deployFixture() {

    const [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    const _grtPool = await ethers.getContractFactory("GrtPool");
    const grtPool = await upgrades.deployProxy(_grtPool);
    await grtPool.deployed();

    let _realityEth = await ethers.getContractFactory("RealityETH_v3_0");
    const realityEth = await _realityEth.deploy();
    await realityEth.deployed();

    let _grtToken = await ethers.getContractFactory("ERC20_OZ");
    const grtToken = await _grtToken.deploy();
    await grtToken.deployed();

    let _token = await ethers.getContractFactory("ERC20_OZ");
    const token = await _token.deploy();
    await token.deployed();

    return {
      grtToken,
      token,
      grtPool,
      realityEth,
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
    };
  }

  beforeEach(async function() {
    const {
      grtToken,
      token,
      grtPool,
      realityEth,
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
     } = await loadFixture(deployFixture);
    // initialize contract
    await grtPool.initializePool(grtToken.address, 5, realityEth.address);

  });

  it("Test should exchange GRT for another token without dispute on the same chain", async function () {
    // Mint withdrawal tokens for grtPool contract

    await grtToken.mint(user1.address, ethers.utils.parseEther("200"));

    expect(await grtToken.balanceOf(user1.address)).to.equal(
      "200000000000000000000"
    );
    await grtToken.connect(user1).approve(
      grtpool.address,
      ethers.utils.parseEther("2000000")
    );

    // minting GRT to the grt pool
    await grtToken.mint(grtpool.address, ethers.utils.parseEther("200"));

    expect(await grtToken.balanceOf(grtpool.address)).to.equal(
      "200000000000000000000"
    );

    // deposit ERC20 to pool by UserA
    await grtpool
      .connect(user1)
      .depositGRT(
        ethers.utils.parseEther("10"),
        token.address,
        ethers.utils.parseEther("5"),
        31337,
        user2.address
      );
    const res = await grtpool.getInfoDep(0);
    expect(res.userAddr).to.equal(user1.address);

    // make offer
    // User3 staking deposit

    await grtToken.connect(user3).approve(
      grtpool.address,
      ethers.utils.parseEther("20000000")
    );
    await grtpool.connect(user3).stakeGRT(ethers.utils.parseEther("5"));

    // make right offer by user3
    await grtpool
      .connect(user3)
      .makeOfferERC20(0, token.address, ethers.utils.parseEther("5"), 31337);

    // accpet offer by user1
    await grtpool.connect(user1).acceptOffer(0);

    // Honor offer on same chain by user3

    await token.mint(user3.address, ethers.utils.parseEther("20"));

    expect(await token.balanceOf(user3.address)).to.equal(
      "20000000000000000000"
    );
    await token
      .connect(user3)
      .approve(grtpool.address, ethers.utils.parseEther("2000000"));

    await grtpool
      .connect(user3)
      .HnOfferERC20OnChain(0, token.address, ethers.utils.parseEther("5"));

    expect(await grtToken.balanceOf(user3.address)).to.equal(
      "15000000000000000000"
    );
  });

  it("Test should excahnge GRT for another token without dispute on the another chain", async function () {
    // Mint withdrawal tokens for grtPool contract

    await grtToken.mint(user1.address, ethers.utils.parseEther("200"));

    expect(await grtToken.balanceOf(user1.address)).to.equal(
      "200000000000000000000"
    );
    await grtToken.connect(user1).approve(
      grtpool.address,
      ethers.utils.parseEther("200000")
    );

    // minting GRT to the grt pool
    await grtToken.mint(grtpool.address, ethers.utils.parseEther("200"));

    expect(await grtToken.balanceOf(grtpool.address)).to.equal(
      "200000000000000000000"
    );

    // deposit ERC20 to pool by UserA
    await grtpool
      .connect(user1)
      .depositGRT(
        ethers.utils.parseEther("10"),
        token.address,
        ethers.utils.parseEther("5"),
        80001,
        user2.address
      );
    const res = await grtpool.getInfoDep(0);
    expect(res.userAddr).to.equal(user1.address);

    // make offer
    // User3 staking deposit

    await grtpool.connect(user3).stakeGRT(ethers.utils.parseEther("5"));

    // make right offer by user3
    await grtpool
      .connect(user3)
      .makeOfferERC20(0, token.address, ethers.utils.parseEther("5"), 80001);

    // accpet offer by user1
    await grtpool.connect(user1).acceptOffer(0);

    // User3 honors transaction and has sent the amount of token the user1 requested for

    // Claim  rewards on different chain by user3
    await grtpool.connect(user3).claimGRTWithoutDispute(0);
    expect(await grtToken.balanceOf(user3.address)).to.equal(
      "15000000000000000000"
    );
  });

  it("Test should excahnge GRT for another token with dispute on the another chain", async function () {
    // Mint withdrawal tokens for grtPool contract

    await grtToken.mint(user1.address, ethers.utils.parseEther("20"));

    expect(await grtToken.balanceOf(user1.address)).to.equal(
      "20000000000000000000"
    );
    await grtToken.connect(user1).approve(
      grtpool.address,
      ethers.utils.parseEther("2000000")
    );

    // minting GRT to the grt pool
    await grtToken.mint(grtpool.address, ethers.utils.parseEther("200"));

    expect(await grtToken.balanceOf(grtpool.address)).to.equal(
      "200000000000000000000"
    );

    // deposit ERC20 to pool by UserA
    await grtpool
      .connect(user1)
      .depositGRT(
        ethers.utils.parseEther("10"),
        token.address,
        ethers.utils.parseEther("5"),
        80001,
        user2.address
      );
    const res = await grtpool.getInfoDep(0);
    expect(res.userAddr).to.equal(user1.address);

    // make offer
    // User3 staking deposit

    await grtpool.connect(user3).stakeGRT(ethers.utils.parseEther("5"));

    // make right offer by user3
    const offer = await grtpool
      .connect(user3)
      .makeOfferERC20(0, token.address, ethers.utils.parseEther("5"), 80001);
    const txHash = offer.hash;

    // accpet offer by user1
    await grtpool.connect(user1).acceptOffer(0);

    // User3 honors transaction and has sent the amount of token the user1 requested for

    // Claim  rewards on different chain by user3

    // create question template
    const stringTemplate =
      '{"title": "%s", "type": "bool", "category": "%s", "lang": "%s"}';
    const id = await grtpool.createRealityERC20Template(stringTemplate);
    const _id = await id.wait();
    const templateId = _id?.events[1]?.args[0].toString();

    // creating the question
    const questionStr = "Did I make a transaction deposit of 1000GRT?␟␟en";
    const __question = await grtpool.createQuestionERC20(
      questionStr,
      templateId,
      txHash,
      user3.address,
      user2.address,
      token.address,
      ethers.utils.parseEther("5"),
      80001,
      { value: ethers.utils.parseEther("0.1") }
    );
    const _questionId = await __question.wait();
    const questionId = _questionId?.events[2]?.args[1];

    const getHistoryHash = await grtpool.getHistoryHash(questionId);
    //answering the question posted by user3 by users 4 and 5
    await grtpool
      .connect(user4)
      .answerQuestion("true", questionId, 0, {
        value: ethers.utils.parseEther("1"),
      });

    const getHistoryHash1 = await grtpool.getHistoryHash(questionId);

    await grtpool
      .connect(user5)
      .answerQuestion("true", questionId, 0, {
        value: ethers.utils.parseEther("2"),
      });

    // const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    // const network = { provider: provider };

    await network.provider.send("evm_increaseTime", [97200]);
    await network.provider.send("evm_mine");

    // checking if question is finalized
    const isFinalized = await grtpool.isFinalized(questionId);
    expect(isFinalized).to.equal(true);

    const answer = await grtpool.getBytes("true");
    // resolving dispute and claiming GRT exchanged
    await grtpool
      .connect(user3)
      .claimGRTWithDispute(
        0,
        questionId,
        [getHistoryHash1, getHistoryHash],
        [user5.address, user4.address],
        [ethers.utils.parseEther("2"), ethers.utils.parseEther("1")],
        [answer, answer]
      );
    expect(await grtToken.balanceOf(user3.address)).to.equal(
      "15000000000000000000"
    );
  });
});
