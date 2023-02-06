// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers, hardhatEthers } = require("hardhat");
import { GRTPOOL , ERC20} from '../typechain-types'


describe("GRTPOOL", function () {
  let GRTPOOL: GRTPOOL;
  let GRTToken: ERC20;
  let TokenToWithdraw: ERC20;
  let userA: any;
  let userB:any;
  let userC: any;
  let userD: any;

  this.before(async function () {
    [userA, userB, userC, userD] = await ethers.getSigners();
    const _realityEth = await ethers.getContractFactory("RealityETH_v3_0");
    const REALITYETH = await _realityEth.deploy();
    await REALITYETH.deployed();

    const _grtPool = await ethers.getContractFactory("GRTPOOL");
    GRTPOOL = await _grtPool.deploy(REALITYETH.address);
    await GRTPOOL.deployed();

    const _GRTToken = await ethers.getContractFactory('ERC20')
    GRTToken = await _GRTToken.deploy();
    await GRTToken.deployed();

    const _token_to_withdraw = await ethers.getContractFactory('ERC20')
    TokenToWithdraw = await _token_to_withdraw.deploy();
    await TokenToWithdraw.deployed();

  });

  it("Test should deposit GRT and create a question", async function () {
    console.log('GRTPOOL deployed at:' + GRTPOOL.address)
    console.log('GRTToken deployed at: ' + GRTToken.address);
    console.log('TokenToWithdraw deployed at: ' + TokenToWithdraw.address);

    // initialize contract
    await GRTPOOL.initialize()

    // set exchange rate with withdrawal token
    await GRTPOOL.setExchangeRate(TokenToWithdraw.address, 2)

    // Mint withdrawal tokens for GRTPOOL contract
    await TokenToWithdraw.mint(GRTPOOL.address, '1000000000000000000000')

    expect(await TokenToWithdraw.balanceOf(GRTPOOL.address)).to.equal(
      '1000000000000000000000'
    );
    await GRTToken.mint(
      userA.address, '1000000000000000000000');

    expect(await GRTToken.balanceOf(userA.address)).to.equal(
      '1000000000000000000000'
    );

    await GRTToken.approve(GRTPOOL.address, '1000000000000000000000')

    // transfer ERC20 to pool by UserA
    const res = await GRTPOOL.transferERC20(GRTToken.address, 1000, 2, TokenToWithdraw.address)
    const txhash = res.hash

    // creating template
    const stringTemplate = '{"title": "%s", "type": "bool", "category": "%s", "lang": "%s"}'
    const id = await GRTPOOL.createRealityERC20Template(stringTemplate)
    const _id = await id.wait()
    const templateId = _id.events[1].args[0].toString()
    console.log(templateId.toString())
    const questionStr = 'Did I make a transaction deposit of 1000GRT?␟␟en'
    const __questionId = await GRTPOOL.createQuestionERC20(questionStr, txhash, 2, 1000, TokenToWithdraw.address, userB.address, templateId, { value: ethers.utils.parseEther("0.1") });
    const _questionId = await __questionId.wait()
    const questionId = _questionId.events[2].args[0]
    console.log(questionId)

    console.log('before b')

    const getHistoryHash = await GRTPOOL.getHistoryHash(questionId)
    console.log('firstHistory', getHistoryHash)


    // answering a question
    await GRTPOOL.connect(userC).answerQuestion('true', questionId, 0, { value: ethers.utils.parseEther("1") });
    const getHistoryHash1 = await GRTPOOL.getHistoryHash(questionId)
    console.log('getHistoryHash1', getHistoryHash1)

    await GRTPOOL.connect(userD).answerQuestion('false', questionId, 0, { value: ethers.utils.parseEther("2") });

    // const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    // const network = { provider: provider };


    await network.provider.send("evm_increaseTime", [97200])
    await network.provider.send("evm_mine")

    // checking if question is finalized
    const isFinalized = await GRTPOOL.isFinalized(questionId)
    console.log(isFinalized)

    const getFinalizeTS = await GRTPOOL.getFinalizeTS(questionId)
    console.log(getFinalizeTS)


    const getBounty = await GRTPOOL.getBounty(questionId)
    console.log(getBounty.toString())

    const getHistoryHash2 = await GRTPOOL.getHistoryHash(questionId)
    console.log('getHistoryHash2', getHistoryHash2)

    const answer1 = await GRTPOOL.getBytes('true');
    console.log(answer1);

    const answer2 = await GRTPOOL.getBytes('false');
    console.log(answer2);


    // const verifyHistoryInputOrRevert = await GRTPOOL.verifyHistoryInputOrRevert(getHistoryHash1, getHistoryHash, answer1, "1000000000000000000", userC.address)
    // console.log('verifyHistoryInputOrRevert', verifyHistoryInputOrRevert)

    const canWithdrawA = await GRTPOOL.canUserWithdraw(userB.address, questionId)
    console.log('a', canWithdrawA)
    await GRTPOOL.claimWinnings(questionId, [getHistoryHash1, getHistoryHash], [userD.address, userC.address], [ethers.utils.parseEther("2"), ethers.utils.parseEther("1")], [answer2, answer1])

    const canWithdrawB = await GRTPOOL.canUserWithdraw(userB.address, questionId)
    console.log(canWithdrawB)
  });

  
});

