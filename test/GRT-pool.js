// Right click on the script name and hit "Run" to execute
const { expect } = require("chai");
const { ethers } = require("hardhat");

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
    const _grtPool = await ethers.getContractFactory("GRTPOOL");
    GRTPOOL = await _grtPool.deploy();
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
    // set GRT token
    await GRTPOOL.setToken(GRTToken.address)

    // set exchange rate with withdrawal token
    await GRTPOOL.setExchangeRate(TokenToWithdraw.address, 2)

    // Mint withdrawal tokens for GRTPOOL contract
    await TokenToWithdraw.mint(GRTPOOL.address, '1000000000000000000000')

    expect(await TokenToWithdraw.balanceOf(GRTPOOL.address)).to.equal(
      '1000000000000000000000'
    );

    await GRTToken.connect(userA).mint(
      userA.address, '1000000000000000000000');

    expect(await GRTToken.balanceOf(userA.address)).to.equal(
      '1000000000000000000000'
    );

    await GRTToken.connect(userA).approve(GRTPOOL.address, '1000000000000000000000')

    const res = await GRTPOOL.depositGRT(10000000, 2, TokenToWithdraw.address, userB.address, 1, 0, 0)
    const data = res.wait()
    console.log(data)



    // const Storage = await ethers.getContractFactory("Storage");
    // const storage = await Storage.deploy();
    // await storage.deployed();
    // const storage2 = await ethers.getContractAt("Storage", storage.address);
    // const setValue = await storage2.store(56);
    // await setValue.wait();
    // expect((await storage2.retrieve()).toNumber()).to.equal(56);
  });
});