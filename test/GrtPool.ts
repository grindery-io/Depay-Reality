import { expect } from "chai";
import { ethers, network, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC20Sample, GrtPool, RealityETH_v3_0 } from "../typechain-types";

describe("Grindery Pool testings", function () {

  let owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress,
    user4: SignerWithAddress,
    user5: SignerWithAddress,
    grtPool: GrtPool,
    realityEth: RealityETH_v3_0,
    grtToken: ERC20Sample,
    token: ERC20Sample;

  beforeEach(async function () {

    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    grtPool = await upgrades.deployProxy(
      await ethers.getContractFactory("GrtPool")
    );
    await grtPool.deployed();

    realityEth = await (
      await ethers.getContractFactory("RealityETH_v3_0")
    ).deploy();
    await realityEth.deployed();

    grtToken = await (
      await ethers.getContractFactory("ERC20Sample")
    ).deploy();
    await grtToken.deployed();

    token = await (
      await ethers.getContractFactory("ERC20Sample")
    ).deploy();
    await token.deployed();



    // initialize contract
    await grtPool.initializePool(grtToken.address, 5, realityEth.address);

  });

  describe("GRT pool initialisation", function () {

    it("Should set the correct Owner", async function () {
      expect(await grtPool.owner()).to.equal(owner.address);
    });

    it("Should set the correct GRT token address", async function () {
      expect(await grtPool.getGRTAddr()).to.equal(grtToken.address);

    });

    it("Should set the correct chain ID", async function () {
      expect(await grtPool.getGRTChainId()).to.equal(5);
    });

    it("Should set the correct Reality smart contract address", async function () {
      expect(await grtPool.getAddrReality()).to.equal(realityEth.address)
    });

  });

  describe("Staking GRT", function () {

    it("Staking GRT should update the stake mapping", async function () {
      // mint GRT tokens for user1
      await grtToken.mint(user1.address, ethers.utils.parseEther("0.002"))
      // approve grt tokens from user1 to pool contract
      await grtToken.connect(user1).approve(grtPool.address, ethers.utils.parseEther("2"))
      // stake grt on pool contract
      await grtPool.connect(user1).stakeGRT(ethers.utils.parseEther("0.002"))
      expect(await grtPool.getUserStake(user1.address)).to.equal('2000000000000000')
    });

    it("Staking GRT should emit an event", async function () {
      // mint GRT tokens for user1
      await grtToken.mint(user1.address, ethers.utils.parseEther("0.002"))
      // approve grt tokens from user1 to pool contract
      await grtToken.connect(user1).approve(grtPool.address, ethers.utils.parseEther("2"))
      // check event emitted
      await expect(grtPool.connect(user1).stakeGRT(ethers.utils.parseEther("0.002")))
        .to.emit(grtPool, 'LogStake')
        .withArgs(user1.address, ethers.utils.parseEther("0.002"))
    });

  });


  describe("Deposit GRT and request ERC20 tokens", function () {

    it("GRT deposit should fail if the allowance is not high enough", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("0.001"))

      await expect(grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)).to.be.revertedWith('ERC20: insufficient allowance')
    });

    it("A successful GRT deposit should emit an event", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))

      await expect(grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address))
        .to.emit(grtPool, 'LogDeposit')
        .withArgs(0, grtToken.address, ethers.utils.parseEther("2"), 5)
    });

    it("An ERC20 request should emit an event", async function () {
      // Not sure about this
    });

    it("An ERC20 request should increase by one the request counter", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))

      expect(await grtPool.getCounter()).to.equal(0)
      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
      expect(await grtPool.getCounter()).to.equal(1)
    });

    it("An ERC20 request should add a new item in the requests mapping with the proper requester", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
      // before deposit
      const getReqInfoBefore = await grtPool.getInfoRequest(0)
      expect(getReqInfoBefore.userAddr).to.equal('0x0000000000000000000000000000000000000000')

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getReqInfoAfter = await grtPool.getInfoRequest(0)
      expect(getReqInfoAfter.userAddr).to.equal(user2.address)
    });

    it("An ERC20 request should add a new item in the requests mapping with the proper recipient address", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getReqInfoAfter = await grtPool.getInfoRequest(0)
      expect(getReqInfoAfter.receipientAddr).to.equal(user3.address)
    });

    it("An ERC20 request should add a new item in the requests mapping with the proper deposit information (token address, amount and chain Id)", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
      // before deposit
      const getInfoDepositBefore = await grtPool.getInfoDeposit(0)
      expect(getInfoDepositBefore.addrTokenDep).to.equal('0x0000000000000000000000000000000000000000')
      expect(getInfoDepositBefore.amntDep).to.equal(0)
      expect(getInfoDepositBefore.chainIdDep).to.equal(0)

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getInfoDepositAfter = await grtPool.getInfoDeposit(0)
      expect(getInfoDepositAfter.addrTokenDep).to.equal(grtToken.address)
      expect(getInfoDepositAfter.amntDep).to.equal(ethers.utils.parseEther("2"))
      expect(getInfoDepositAfter.chainIdDep).to.equal(5)

    });

    it("An ERC20 request should add a new item in the requests mapping with the proper request information (token address, amount and chain Id)", async function () {
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
      // before deposit
      const getInfoRequestBefore = await grtPool.getInfoRequest(0)
      expect(getInfoRequestBefore.addrTokenReq).to.equal('0x0000000000000000000000000000000000000000')
      expect(getInfoRequestBefore.amntReq).to.equal(0)
      expect(getInfoRequestBefore.chainIdReq).to.equal(0)

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getInfoRequestAfter = await grtPool.getInfoRequest(0)
      expect(getInfoRequestAfter.addrTokenReq).to.equal(token.address)
      expect(getInfoRequestAfter.amntReq).to.equal(ethers.utils.parseEther("10"))
      expect(getInfoRequestAfter.chainIdReq).to.equal(5)
    });

    it("An ERC20 request should add a new item in the requests mapping with the isRequest item set to true", async function () {
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
      // before deposit
      const getInfoRequestBefore = await grtPool.getInfoRequest(0)
      expect(getInfoRequestBefore.isRequest).to.equal(false)

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getInfoRequestAfter = await grtPool.getInfoRequest(0)
      expect(getInfoRequestAfter.isRequest).to.equal(true)
    });

    it("An ERC20 request should add a new item in the requests mapping with an empty offers array inside", async function () {
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
      // before deposit
      const getInfoRequestOffersBefore = await grtPool.getAllRequestOffers(0)
      expect(getInfoRequestOffersBefore.length).to.equal(0)

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getInfoRequestOffersAfter = await grtPool.getAllRequestOffers(0)
      expect(getInfoRequestOffersAfter.length).to.equal(1)
    });

    it("Should return true if the deposit is accepted", async function () {
      // cannot read returned value from write function
    });

    it("Should return false if the deposit isn't accepted", async function () {
      // cannot get returned value from write function
    });

  });


  describe("Deposit GRT and request native tokens", function () {

    it("GRT deposit should fail if the allowance is not high enough", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("0.001"))

      await expect(grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address))
      .to.be.revertedWith('ERC20: insufficient allowance')
    });

    it("A successful GRT deposit should emit an event", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))

      await expect(grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address))
        .to.emit(grtPool, 'LogDeposit')
        .withArgs(0, grtToken.address, ethers.utils.parseEther("2"), 5)
    });

    it("A native token request should emit an event", async function () {
      // not sure about this
    });

    it("A native token request should increase by one the request counter", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))

      expect(await grtPool.getCounter()).to.equal(0)
      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)
      expect(await grtPool.getCounter()).to.equal(1)
    });

    it("A native token request should add a new item in the requests mapping with the proper requester", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
      // before deposit
      const getReqInfoBefore = await grtPool.getInfoRequest(0)
      expect(getReqInfoBefore.userAddr).to.equal('0x0000000000000000000000000000000000000000')

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getReqInfoAfter = await grtPool.getInfoRequest(0)
      expect(getReqInfoAfter.userAddr).to.equal(user2.address)
    });

    it("A native token request should add a new item in the requests mapping with the proper recipient address", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getReqInfoAfter = await grtPool.getInfoRequest(0)
      expect(getReqInfoAfter.receipientAddr).to.equal(user3.address)
    });

    it("A native token request should add a new item in the requests mapping with the proper deposit information (token address, amount and chain Id)", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
      // before deposit
      const getInfoDepositBefore = await grtPool.getInfoDeposit(0)
      expect(getInfoDepositBefore.addrTokenDep).to.equal('0x0000000000000000000000000000000000000000')
      expect(getInfoDepositBefore.amntDep).to.equal(0)
      expect(getInfoDepositBefore.chainIdDep).to.equal(0)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getInfoDepositAfter = await grtPool.getInfoDeposit(0)
      expect(getInfoDepositAfter.addrTokenDep).to.equal(grtToken.address)
      expect(getInfoDepositAfter.amntDep).to.equal(ethers.utils.parseEther("2"))
      expect(getInfoDepositAfter.chainIdDep).to.equal(5)
    });

    it("A native token request should add a new item in the requests mapping with the proper request information (zero address for the token address, amount and chain Id)", async function () {
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
      // before deposit
      const getInfoRequestBefore = await grtPool.getInfoRequest(0)
      expect(getInfoRequestBefore.addrTokenReq).to.equal('0x0000000000000000000000000000000000000000')
      expect(getInfoRequestBefore.amntReq).to.equal(0)
      expect(getInfoRequestBefore.chainIdReq).to.equal(0)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getInfoRequestAfter = await grtPool.getInfoRequest(0)
      expect(getInfoRequestAfter.addrTokenReq).to.equal('0x0000000000000000000000000000000000000000')
      expect(getInfoRequestAfter.amntReq).to.equal(ethers.utils.parseEther("10"))
      expect(getInfoRequestAfter.chainIdReq).to.equal(5)
    });

    it("A native token request should add a new item in the requests mapping with the isRequest item set to true", async function () {
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
      // before deposit
      const getInfoRequestBefore = await grtPool.getInfoRequest(0)
      expect(getInfoRequestBefore.isRequest).to.equal(false)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getInfoRequestAfter = await grtPool.getInfoRequest(0)
      expect(getInfoRequestAfter.isRequest).to.equal(true)
    });

    it("A native token request should add a new item in the requests mapping with an empty offers array inside", async function () {
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
      // before deposit
      const getInfoRequestOffersBefore = await grtPool.getAllRequestOffers(0)
      expect(getInfoRequestOffersBefore.length).to.equal(0)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)
      // after deposit
      const getInfoRequestOffersAfter = await grtPool.getAllRequestOffers(0)
      expect(getInfoRequestOffersAfter.length).to.equal(1)
    });

    it("Should return true if the deposit is accepted", async function () {
      // cannot read returned value from write function
    });

    it("Should return false if the deposit isn't accepted", async function () {
      // cannot read returned value from write function
    });

  });


  describe("Create an offer", function () {

    it("Should fail if there is no request for the provided Id", async function () {
      // create offer
      await expect(grtPool.connect(user1).createOffer(2, ethers.utils.parseEther("10")))
        .to.be.revertedWith("GRT pool: the request for which you are trying to place an offer does not exist!")
    });

    it("Should fail if the user has not enough staked GRT (1 for tests)", async function () {
      // mint GRT tokens for user2
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)

      await expect(grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10")))
        .to.be.revertedWith("GRT pool: your stake amount is not sufficient!")
    });


    it("Should emit an event", async function () {
      // mint GRT tokens for user2 and user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)
      // approve grt tokens from user2 and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await expect(grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10")))
        .to.emit(grtPool, 'LogCreateOffer')
        .withArgs(0, 2)
    });

    it("Should push a new offer in the offers array for the concerning request Id with the correct creator", async function () {
      // mint GRT tokens for user2 and user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)
      // approve grt tokens from user2 and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, token.address)

      // stake GRT for user 1
      await grtPool.connect(user1).stakeGRT(10)
      // create offer
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))
      // get offers
      const offers = await grtPool.getAllRequestOffers(0)
      expect(offers[1].userAddr).to.equal(user1.address)
    });

    it("Should push a new offer in the offers array for the concerning request Id with the correct amount proposed", async function () {
      // mint GRT tokens for user2 and user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)
      // approve grt tokens from user2 and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT for user 1
      await grtPool.connect(user1).stakeGRT(10)
      // create offer
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))
      // get offers
      const offers = await grtPool.getAllRequestOffers(0)
      expect(offers[1].amount).to.equal(ethers.utils.parseEther("10"))
    });

    it("Should push a new offer in the offers array for the concerning request Id with isAccept and isPaid set both to false", async function () {
      // mint GRT tokens for user2 and user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)
      // approve grt tokens from user2 and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT for user 1
      await grtPool.connect(user1).stakeGRT(10)
      // create offer
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))
      // get offers
      const offers = await grtPool.getAllRequestOffers(0)
      expect(offers[1].isAccept).to.equal(false)
      expect(offers[1].isPaid).to.equal(false)
    });

  });


  describe("Accept an offer", function () {
    it("Should fail if idRequest doesn't exist", async function () {
      // create offer
      await expect(grtPool.connect(user2).acceptOffer(2, 0))
        .to.be.revertedWith("GRT pool: the request for which you are trying to accept an offer does not exist!")
    });

    it("Should fail if idOffer doesn't exist for the offer corresponding to idRequest", async function () {
      // mint GRT tokens for user2 and user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)
      // approve grt tokens from user2 and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      await expect(grtPool.connect(user2).acceptOffer(0, 2)).to.be.revertedWith("GRT pool: the offer Id is invalid!")
    });

    it("Should fail if the offer has already been accepted", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // approve grt tokens from user2 and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))


      // accept user1's offer by user 2
      await grtPool.connect(user2).acceptOffer(0, 1)

      // accept user1's offer again
      await expect(grtPool.connect(user2).acceptOffer(0, 1)).to.be.revertedWith("GRT pool: the offer has already been accepted!")
    });

    it("Should fail if the offer has already been paid", async function () {
      // does not apply
    });

    it("Should fail if the transaction signer is not the requester", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)
      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))


      // accept user1's offer by user4
      await expect(grtPool.connect(user4).acceptOffer(0, 1)).to.be.revertedWith("GRT pool: you are not authorized to accept an offer that has not been issued by you!")

    });

    it("Should set isAccept to true for the corresponding request Id and offer Id", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)
      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))


      // accept user1's offer by user4
      await grtPool.connect(user2).acceptOffer(0, 1)

      const infoOffer = await grtPool.getInfoOffer(0, 1)
      expect(infoOffer.isOfferAccepted).to.equal(true)
    });

    it("Should emit an event for offer acceptance", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)
      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))


      // accept user1's offer by user4
      await expect(grtPool.connect(user2).acceptOffer(0, 1)).to.emit(grtPool, 'LogAcceptOffer')
        .withArgs(0, 1)

    });

    it("Should set isPaid as true for the corresponding request Id and offer Id", async function () {
      // Not applicable as the offer is not yet paid for
    });

    it("Should return true for successHndOffer and true for successGRTReward", async function () {
      // Not applicable as the offer is not yet paid for
    });

  });


  describe("Pay an offer on chain with an ERC20 token", function () {

    it("Should fail if the offer is not accepted yet", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)
      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))


      // pay for  offer by user1
      await expect(grtPool.connect(user1).payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("10"))).to.be.revertedWith("GRT pool: the offer you are trying to pay has not been accepted yet!")


    });

    it("Should fail if the offer has already been paid", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // Mint token tokens for user1
      await token.mint(user1.address, ethers.utils.parseEther("10"))

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      // approve token tokens from user1 to pool contract
      await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)

      // pay for  offer by user1
      await grtPool.connect(user1).payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("10"))

      // pay for offer again by user1
      await expect(grtPool.connect(user1).payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("10"))).to.be.revertedWith("GRT pool: the offer you are trying to pay has already been paid!")


    });

    it("Should fail if the chain Id mentionned in the corresponding offer is not the actual chain Id", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // Mint token tokens for user1
      await token.mint(user1.address, ethers.utils.parseEther("10"))

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      // approve token tokens from user1 to pool contract
      await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)


      // pay for offer by user1
      await expect(grtPool.connect(user1).payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("10"))).to.be.revertedWith("GRT pool: the offer should not be paid on this chain!")


    });

    it("Should fail if the amount doesn't correspond to the offer", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // Mint token tokens for user1
      await token.mint(user1.address, ethers.utils.parseEther("10"))

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      // approve token tokens from user1 to pool contract
      await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)


      // pay for offer by user1
      await expect(grtPool.connect(user1).payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("5"))).to.be.revertedWith("GRT pool: the amount you entered does not match the offer you made!")


    });

    it("Should fail if the transaction signer is not the address which made the offer", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // Mint token tokens for user1
      await token.mint(user1.address, ethers.utils.parseEther("10"))

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      // approve token tokens from user1 to pool contract
      await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)


      // pay for offer by user5
      await expect(grtPool.connect(user5).payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("10"))).to.be.revertedWith("GRT pool: you are not allowed to honour this offer!")

    });

    it("Should fail if the proposed ERC20 token is not the one requested", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // Mint token tokens for user1
      await token.mint(user1.address, ethers.utils.parseEther("10"))

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      // approve token tokens from user1 to pool contract
      await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)


      // pay for offer by user1
      await expect(grtPool.connect(user1).payOfferOnChainERC20(0, 1, grtToken.address, ethers.utils.parseEther("10"))).to.be.revertedWith("GRT pool: the token you wish to propose is not the one expected!")

    });

    it("Should fail if allowance for the correspoànding ERC20 token is not high enough for the transfer", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // Mint token tokens for user1
      await token.mint(user1.address, ethers.utils.parseEther("10"))

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      // approve insufficient token tokens from user1 to pool contract
      await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("1"))

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)


      // pay for offer by user1
      await expect(grtPool.connect(user1).payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("10"))).to.be.revertedWith("ERC20: insufficient allowance")


    });

    it("Should increase the token amount of the recipient with the correct amount", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // Mint token tokens for user1
      await token.mint(user1.address, ethers.utils.parseEther("10"))

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      // approve token tokens from user1 to pool contract
      await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)

      // user1's GRT balance before payOfferOnChainERC20

      // pay for offer by user1
      await grtPool.connect(user1).payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("10"))

      expect(await token.balanceOf(user3.address)).to.equal(
        ethers.utils.parseEther("10")
      );

    });

    it("A successful payment should generate a reward for the transaction signer corresponding to the initial deposit for this request", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // Mint token tokens for user1
      await token.mint(user1.address, ethers.utils.parseEther("10"))

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      // approve token tokens from user1 to pool contract
      await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)

      // pay for offer by user1
      await grtPool.connect(user1).payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("10"))

      expect(await grtToken.balanceOf(user1.address)).to.equal(
        ethers.utils.parseEther("2")
      );
    });

    it("A successful payment and reward transfer should emit and event", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // Mint token tokens for user1
      await token.mint(user1.address, ethers.utils.parseEther("10"))

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      // approve token tokens from user1 to pool contract
      await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

      await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)

      // pay for offer by user1
      await expect(grtPool.connect(user1).payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("10"))).to.emit(grtPool, 'LogOfferPaidOnChain').withArgs(0,1)
    });
  });

  describe("Pay an offer on chain with a native token", function () {

    it("Should fail if the offer is not accepted yet", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)
      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))


      // pay for  offer by user1
      await expect(grtPool.connect(user1).payOfferOnChainNative(0, 1, { value: ethers.utils.parseEther("10") })).to.be.revertedWith("GRT pool: the offer you are trying to pay has not been accepted yet!")
    });

    it("Should fail if the offer has already been paid", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)


      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)

      // pay for  offer by user1
      await grtPool.connect(user1).payOfferOnChainNative(0, 1, { value: ethers.utils.parseEther("10") })

      // pay for offer again by user1
      await expect(grtPool.connect(user1).payOfferOnChainNative(0, 1, { value: ethers.utils.parseEther("10") })).to.be.revertedWith("GRT pool: the offer you are trying to pay has already been paid!")

    });

    it("Should fail if the chain Id mentionned in the corresponding offer is not the actual chain Id", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)


      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 5, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)

      // pay for offer by user1
      await expect(grtPool.connect(user1).payOfferOnChainNative(0, 1, { value: ethers.utils.parseEther("10") })).to.be.revertedWith("GRT pool: the offer should not be paid on this chain!")

    });

    it("Should fail if the amount doesn't correspond to the offer", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // mint token tokens for user1
      await token.mint(user2.address, ethers.utils.parseEther("2"))

      // approve grt tokens from user2  and user1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      // approve token tokens from user2  and user1 to pool contract
      await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))


      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)

      // pay for offer by user1
      await expect(grtPool.connect(user1).payOfferOnChainNative(0, 1, { value: ethers.utils.parseEther("5") })).to.be.revertedWith("GRT pool: the amount you entered does not match the offer you made!")
    });

    it("Should fail if the transaction signer is not the address which made the offer", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)

      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)

      // pay for offer by user5
      await expect(grtPool.connect(user5).payOfferOnChainNative(0, 1, { value: ethers.utils.parseEther("10") })).to.be.revertedWith("GRT pool: you are not allowed to honour this offer!")
    });

    it("Should fail if the proposed ERC20 token is not the one requested", async function () {
      // Not applicable
    });

    it("Should fail if allowance for the correspoànding ERC20 token is not high enough for the transfer", async function () {
      // Not applicable
    });

    it("Should increase the ETH amount of the recipient with the correct amount", async function () {
      // mint GRT tokens for user2, user1
      await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
      await grtToken.mint(user1.address, 10)


      // approve grt tokens from user2  and user 1 to pool contract
      await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
      await grtToken.connect(user1).approve(grtPool.address, 1000)

      await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 31337, user3.address)

      // stake GRT  and create an offer for user 1
      await grtPool.connect(user1).stakeGRT(10)
      await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

      // accept offer by user2
      await grtPool.connect(user2).acceptOffer(0, 1)

      const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
      // user3's Eth balance before payOfferOnChainERC20
      const balance = await provider.getBalance(user3.address)
      const balanceInEth = ethers.utils.formatEther(balance);

      // pay for offer by user1
      await grtPool.connect(user1).payOfferOnChainNative(0, 1, { value: ethers.utils.parseEther("10") })

      // check user3 ether balance after payment
      const balanceAfter = await provider.getBalance(user3.address);
      const balanceInEthAfter = ethers.utils.formatEther(balanceAfter);

      expect(Number(balanceInEthAfter)).to.equal(Number(balanceInEth) + 10)
    });

  it("A successful payment should generate a GRT reward for the transaction signer corresponding to the initial deposit for this request", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)


    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 31337, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

    // accept offer by user2
    await grtPool.connect(user2).acceptOffer(0, 1)

    // pay for offer by user1
    await grtPool.connect(user1).payOfferOnChainNative(0, 1, { value: ethers.utils.parseEther("10") })

    expect(await grtToken.balanceOf(user1.address)).to.equal(
      ethers.utils.parseEther("2")
    );
   
  });

  it("A successful payment and reward transfer should emit and event", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)


    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    await grtPool.connect(user2).depositGRTRequestNative(ethers.utils.parseEther("2"), ethers.utils.parseEther("10"), 31337, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

    // accept offer by user2
    await grtPool.connect(user2).acceptOffer(0, 1)

    // pay for offer by user1
    await expect(grtPool.connect(user1).payOfferOnChainNative(0, 1, { value: ethers.utils.parseEther("10") })).to.emit(grtPool, 'LogOfferPaidOnChain').withArgs(0,1)
  });
});



describe("Claim GRT with dispute", function () {

});


describe("Claim GRT without dispute", function () {

  it("Should fail if the request doesn't exist", async function () {
   // Not applicable, because if the request doesn't exisit, the ofer cannot exist

  });

  it("Should fail if the offer doesn't exist", async function () {
    // Not applicable beacsue there is no check for that in the function
  });

  it("Should fail if the offer has already been paid", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

    // accept offer by user2
    await grtPool.connect(user2).acceptOffer(0, 1)

    // Claim GRT without dispute for offer by user1
    grtPool.connect(user1).claimGRTWithoutDispute(0, 1)

    // Claim GRT without dispute again for offer by user1
    await expect(grtPool.connect(user1).claimGRTWithoutDispute(0, 1)).to.be.revertedWith('GRT pool: the offer you are trying to pay has already been paid!')

  });

  it("Should fail if the transaction signer is not the one who made the corresponding offer", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

    // accept offer by user2
    await grtPool.connect(user2).acceptOffer(0, 1)

    // Claim GRT without dispute for offer by user4
    await expect(grtPool.connect(user4).claimGRTWithoutDispute(0, 1)).to.be.revertedWith('GRT pool: you have not made an offer for this request and therefore you are not entitled to make this request!')

  });

  it("Should generate a GRT reward for the transaction signer corresponding to the initial deposit for this request", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

    // accept offer by user2
    await grtPool.connect(user2).acceptOffer(0, 1)

    // Claim GRT without dispute for offer by user4
    await grtPool.connect(user1).claimGRTWithoutDispute(0, 1)

    expect(await grtToken.balanceOf(user1.address)).to.equal(
      ethers.utils.parseEther("2")
    );

  });

  it("A successful GRT reward for the transaction signer should emit an event", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

    // accept offer by user2
    await grtPool.connect(user2).acceptOffer(0, 1)

    // Claim GRT without dispute for offer by user4
    await expect(grtPool.connect(user1).claimGRTWithoutDispute(0, 1)).to.emit(grtPool, 'LogOfferPaidCrossChain')
      .withArgs(0,1)
  });

  it("A successful GRT reward for the transaction should set isPaid to true for the corresponding offer", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

    // accept offer by user2
    await grtPool.connect(user2).acceptOffer(0, 1)

    // Claim GRT without dispute for offer by user4
    await grtPool.connect(user1).claimGRTWithoutDispute(0, 1)

    const offerInfo = await grtPool.getInfoOffer(0, 1)
    expect(offerInfo.isOfferHnd).to.equal(true)
  });

  it("A successful GRT reward for the transaction signer should return true", async function () {
    // cannot read returned value from write function
  });

});


describe("Get information about a deposit", function () {

  it("Should return the correct address for the requester", async function () {
    // mint GRT tokens for user2
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    // approve grt tokens from user2 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
    // before deposit
    const getReqInfoBefore = await grtPool.getInfoRequest(0)
    expect(getReqInfoBefore.userAddr).to.equal('0x0000000000000000000000000000000000000000')

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
    // after deposit
    const getReqInfoAfter = await grtPool.getInfoRequest(0)
    expect(getReqInfoAfter.userAddr).to.equal(user2.address)
  });

  it("Should return the correct token address", async function () {
    // mint GRT tokens for user2
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    // approve grt tokens from user2 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
    // before deposit
    const getInfoDepositBefore = await grtPool.getInfoDeposit(0)
    expect(getInfoDepositBefore.addrTokenDep).to.equal('0x0000000000000000000000000000000000000000')

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
    // after deposit
    const getInfoDepositAfter = await grtPool.getInfoDeposit(0)
    expect(getInfoDepositAfter.addrTokenDep).to.equal(grtToken.address)
  });

  it("Should return the correct token amount", async function () {
    // mint GRT tokens for user2
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    // approve grt tokens from user2 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
    
    // before deposit
    const getInfoDepositBefore = await grtPool.getInfoDeposit(0)
    expect(getInfoDepositBefore.amntDep).to.equal(0)

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
    // after deposit
    const getInfoDepositAfter = await grtPool.getInfoDeposit(0)
    expect(getInfoDepositAfter.amntDep).to.equal(ethers.utils.parseEther("2"))
  });

  it("Should return the correct chain Id", async function () {
    // mint GRT tokens for user2
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    // approve grt tokens from user2 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
    // before deposit
    const getInfoDepositBefore = await grtPool.getInfoDeposit(0)
    expect(getInfoDepositBefore.chainIdDep).to.equal(0)

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
    // after deposit
    const getInfoDepositAfter = await grtPool.getInfoDeposit(0)
    expect(getInfoDepositAfter.chainIdDep).to.equal(5)
  });

});


describe("Get information about a request", function () {

  it("Should return the correct address for the requester", async function () {
    // mint GRT tokens for user2
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    // approve grt tokens from user2 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))
    // before deposit
    const getReqInfoBefore = await grtPool.getInfoRequest(0)
    expect(getReqInfoBefore.userAddr).to.equal('0x0000000000000000000000000000000000000000')

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
    // after deposit
    const getReqInfoAfter = await grtPool.getInfoRequest(0)
    expect(getReqInfoAfter.userAddr).to.equal(user2.address)
  });

  it("Should return the correct token address", async function () {
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    // approve grt tokens from user2 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))

    // before deposit
    const getInfoRequestBefore = await grtPool.getInfoRequest(0)
    expect(getInfoRequestBefore.addrTokenReq).to.equal('0x0000000000000000000000000000000000000000')

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)

    // after deposit
    const getInfoRequestAfter = await grtPool.getInfoRequest(0)
    expect(getInfoRequestAfter.addrTokenReq).to.equal(token.address)
  });

  it("Should return the correct token amount", async function () {
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))

    // approve grt tokens from user2 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))

    // before deposit
    const getInfoRequestBefore = await grtPool.getInfoRequest(0)
    expect(getInfoRequestBefore.amntReq).to.equal(0)

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)
    // after deposit
    const getInfoRequestAfter = await grtPool.getInfoRequest(0)
    expect(getInfoRequestAfter.amntReq).to.equal(ethers.utils.parseEther("10"))
  });

  it("Should return the correct chain Id", async function () {
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    // approve grt tokens from user2 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("100"))

    // before deposit
    const getInfoRequestBefore = await grtPool.getInfoRequest(0)
    expect(getInfoRequestBefore.chainIdReq).to.equal(0)

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 5, user3.address)

    // after deposit
    const getInfoRequestAfter = await grtPool.getInfoRequest(0)
    expect(getInfoRequestAfter.chainIdReq).to.equal(5)
  });

});


describe("Get information about an offer", function () {

  it("Should return the correct address for the requester", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

    const offer = await grtPool.getInfoOffer(0, 1)
    expect(offer.userAddr).to.equal(user2.address)
  });

  it("Should return isRequest as false if no offer exist for this request", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

    const offer = await grtPool.getInfoOffer(0, 1)
    expect(offer.isOffr).to.equal(false)
  });

  it("Should return isRequest as true if at least one offer exist for this request", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

    const offer = await grtPool.getInfoOffer(0, 1)
    expect(offer.isOffr).to.equal(true)
  });

  it("Should return the correct address for the offeror", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

    const offer = await grtPool.getInfoOffer(0, 1)
    expect(offer.offrUserAdrr).to.equal(user1.address)
  });

  it("Should return isAccept as true if the offer is accepted", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))
    // accept user1's offer by user 2
    await grtPool.connect(user2).acceptOffer(0, 1)

    const offer = await grtPool.getInfoOffer(0, 1)
    expect(offer.isOfferAccepted).to.equal(true)
  });

  it("Should return isAccept as false if the offer is not accepted", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))

    const offer = await grtPool.getInfoOffer(0, 1)
    expect(offer.isOfferAccepted).to.equal(false)
  });

  it("Should return isPaid as true if the offer is paid", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))
    // accept user1's offer by user 2
    await grtPool.connect(user2).acceptOffer(0, 1)

    // Pay for offer by user1
    await grtPool.connect(user1).payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("10"))

    const offer = await grtPool.getInfoOffer(0, 1)
    expect(offer.isOfferHnd).to.equal(true)
  });

  it("Should return isPaid as false if the offer is not paid", async function () {
    // mint GRT tokens for user2, user1
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))
    await grtToken.mint(user1.address, 10)

    // Mint token tokens for user1
    await token.mint(user1.address, ethers.utils.parseEther("10"))

    // approve grt tokens from user2  and user 1 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("10000"))
    await grtToken.connect(user1).approve(grtPool.address, 1000)

    // approve token tokens from user1 to pool contract
    await token.connect(user1).approve(grtPool.address, ethers.utils.parseEther("10000"))

    await grtPool.connect(user2).depositGRTRequestERC20(ethers.utils.parseEther("2"), token.address, ethers.utils.parseEther("10"), 31337, user3.address)

    // stake GRT  and create an offer for user 1
    await grtPool.connect(user1).stakeGRT(10)
    await grtPool.connect(user1).createOffer(0, ethers.utils.parseEther("10"))
    // accept user1's offer by user 2
    await grtPool.connect(user2).acceptOffer(0, 1)

    const offer = await grtPool.getInfoOffer(0, 1)
    expect(offer.isOfferHnd).to.equal(false)
  })

});


describe("Set token information", function () {

  it("Should return the proper token address", async function () {
    // No function for this
  })

  it("Should return the proper amount", async function () {
    // No function for this
  })

  it("Should return the proper chain Id", async function () {
    // No function for this
  })

});


describe("Set GRT address", function () {

  it("Should fail if the transaction signer is not the owner of the contract", async function () {
    await expect(grtPool.connect(user5).setGRTAddr(token.address)).to.be.revertedWith("Ownable: caller is not the owner")
  })

  it("Should modify _addrGRT", async function () {
    expect(await grtPool.getGRTAddr()).to.equal(grtToken.address)
    await grtPool.connect(owner).setGRTAddr(token.address)
    expect(await grtPool.getGRTAddr()).to.equal(token.address)
  })

});

describe("Set GRT chain Id", function () {

  it("Should fail if the transaction signer is not the owner of the contract", async function () {
    await expect(grtPool.connect(user5).setGRTChainId(80001)).to.be.revertedWith("Ownable: caller is not the owner")
  })

  it("Should modify _chainIdGRT", async function () {
    expect(await grtPool.getGRTChainId()).to.equal(5)
    await grtPool.connect(owner).setGRTChainId(80001)
    expect(await grtPool.getGRTChainId()).to.equal(80001)
  })

});


describe("Deposit GRT on the pool", function () {

  it("Should fail if the allowance is not high enough", async function () {
    // mint GRT tokens for user2
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))

    // approve grt tokens from user2 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("1"))

    await expect(grtPool.depositGRT(2)).to.be.revertedWith('ERC20: insufficient allowance')
  });

  it("Should decrease the token amount for the transaction signer", async function () {
    // mint GRT tokens for user2
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))

    // approve grt tokens from user2 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("20"))

    await grtPool.connect(user2).depositGRT(ethers.utils.parseEther("2"))

    expect(await grtToken.balanceOf(user2.address)).to.equal(0)
  });

  it("Should increase the token amount for the GRT pool contract", async function () {
    // mint GRT tokens for user2
    await grtToken.mint(user2.address, ethers.utils.parseEther("2"))

    // approve grt tokens from user2 to pool contract
    await grtToken.connect(user2).approve(grtPool.address, ethers.utils.parseEther("20"))

    await grtPool.connect(user2).depositGRT(ethers.utils.parseEther("2"))
    expect(await grtToken.balanceOf(grtPool.address)).to.equal(ethers.utils.parseEther("2"))
  });

});















  // it("Test should exchange GRT for another token without dispute on the same chain", async function () {
  //   // Mint withdrawal tokens for grtPool contract

  //   await grtToken.mint(user1.address, ethers.utils.parseEther("200"));

  //   expect(await grtToken.balanceOf(user1.address)).to.equal(
  //     "200000000000000000000"
  //   );
  //   await grtToken.connect(user1).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("2000000")
  //   );

  //   // minting GRT to the grt pool
  //   await grtToken.mint(grtPool.address, ethers.utils.parseEther("200"));

  //   expect(await grtToken.balanceOf(grtPool.address)).to.equal(
  //     "200000000000000000000"
  //   );

  //   // deposit ERC20 to pool by UserA
  //   await grtPool
  //     .connect(user1)
  //     .depositGRTRequestERC20(
  //       ethers.utils.parseEther("10"),
  //       token.address,
  //       ethers.utils.parseEther("5"),
  //       31337,
  //       user2.address
  //     )
  //     ;
  //   const res = await grtPool.getInfoDeposit(0);
  //   expect(res.userAddr).to.equal(user1.address);

  //   // make offer
  //   // User3 staking deposit
  //   await grtToken.mint(user3.address, ethers.utils.parseEther("0.2"));

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "200000000000000000"
  //   );
  //   await grtToken.connect(user3).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("20")
  //   );
  //   await grtPool.connect(user3).stakeGRT(ethers.utils.parseEther("0.2"));

  //   // make right offer by user3
  //   await grtPool
  //     .connect(user3)
  //     .createOffer( 0, ethers.utils.parseEther("5"));

  //   // accpet offer by user1
  //   await grtPool.connect(user1).acceptOffer(0, 1);

  //   // Honor offer on same chain by user3

  //   await token.mint(user3.address, ethers.utils.parseEther("20"));

  //   expect(await token.balanceOf(user3.address)).to.equal(
  //     "20000000000000000000"
  //   );
  //   await token
  //     .connect(user3)
  //     .approve(grtPool.address, ethers.utils.parseEther("2000000"));

  //   await grtPool
  //     .connect(user3)
  //     .payOfferOnChainERC20(0, 1, token.address, ethers.utils.parseEther("5"));

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "10000000000000000000"
  //   );
  //    expect(await token.balanceOf(user2.address)).to.equal(
  //     "5000000000000000000"
  //   );
  // });

  // it("Test should exchange GRT for native token without dispute on the same chain", async function () {
  //   // Mint withdrawal tokens for grtPool contract

  //   await grtToken.mint(user1.address, ethers.utils.parseEther("200"));

  //   expect(await grtToken.balanceOf(user1.address)).to.equal(
  //     "200000000000000000000"
  //   );
  //   await grtToken.connect(user1).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("2000000")
  //   );


  //   // deposit ERC20 to pool by UserA
  //   await grtPool
  //     .connect(user1)
  //     .depositGRTRequestNative(
  //       ethers.utils.parseEther("10"),
  //       ethers.utils.parseEther("5"),
  //       31337,
  //       user2.address
  //     );
  //   const res = await grtPool.getInfoDeposit(0);
  //   expect(res.userAddr).to.equal(user1.address);

  //   // make offer
  //   // User3 staking deposit
  // await grtToken.mint(user3.address, ethers.utils.parseEther("0.2"));

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "200000000000000000"
  //   );
  //   await grtToken.connect(user3).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("20")
  //   );
  //   await grtPool.connect(user3).stakeGRT(ethers.utils.parseEther("0.2"));

  //   // make right offer by user3
  //   await grtPool
  //     .connect(user3)
  //     .createOffer( 0, ethers.utils.parseEther("5"));

  //   // accpet offer by user1
  //   await grtPool.connect(user1).acceptOffer(0, 1);

  //      const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  //   // check user2 ether balance before payment
  //   const balance = await provider.getBalance(user2.address);
  //   const balanceInEth = ethers.utils.formatEther(balance);
  //   // Honor offer on same chain by user3

  //   await grtPool
  //     .connect(user3)
  //     .payOfferOnChainNative(0, 1, {value: ethers.utils.parseEther("5")});

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "10000000000000000000"
  //   );
  //   // check user2 ether balance after payment
  //   const balanceAfter = await provider.getBalance(user2.address);
  //   const balanceInEthAfter = ethers.utils.formatEther(balanceAfter);

  //   expect(Number(balanceInEthAfter)).to.equal(Number(balanceInEth) + 5)
  // });

  // it("Test should excahnge GRT for another token without dispute on the another chain", async function () {
  //   // Mint withdrawal tokens for grtPool contract

  //   await grtToken.mint(user1.address, ethers.utils.parseEther("20"));

  //   expect(await grtToken.balanceOf(user1.address)).to.equal(
  //     "20000000000000000000"
  //   );
  //   await grtToken.connect(user1).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("20")
  //   );

  //   // minting GRT to the grt pool
  //   await grtToken.mint(grtPool.address, ethers.utils.parseEther("200"));

  //   expect(await grtToken.balanceOf(grtPool.address)).to.equal(
  //     "200000000000000000000"
  //   );

  //   // deposit ERC20 to pool by UserA
  //   await grtPool
  //     .connect(user1)
  //     .depositGRTRequestERC20(
  //       ethers.utils.parseEther("10"),
  //       token.address,
  //       ethers.utils.parseEther("5"),
  //       80001,
  //       user2.address
  //     );
  //   const res = await grtPool.getInfoDeposit(0);
  //   expect(res.userAddr).to.equal(user1.address);

  //   // make offer
  //   // User3 staking deposit
  //   await grtToken.mint(user3.address, ethers.utils.parseEther("0.2"));

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "200000000000000000"
  //   );
  //   await grtToken.connect(user3).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("2")
  //   );
  //   await grtPool.connect(user3).stakeGRT(ethers.utils.parseEther("0.2"));

  //   // make right offer by user3
  //   await grtPool
  //     .connect(user3)
  //     .createOffer(0, ethers.utils.parseEther("5"));

  //   // accpet offer by user1
  //   await grtPool.connect(user1).acceptOffer(0, 1);

  //   // User3 honors transaction and has sent the amount of token the user1 requested for

  //   // Claim  rewards on different chain by user3
  //   await grtPool.connect(user3).claimGRTWithoutDispute(0, 1);
  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "10000000000000000000"
  //   );
  // });

  // it("Test should excahnge GRT for another token with dispute on the another chain", async function () {
  //   // Mint withdrawal tokens for grtPool contract

  //   await grtToken.mint(user1.address, ethers.utils.parseEther("20"));

  //   expect(await grtToken.balanceOf(user1.address)).to.equal(
  //     "20000000000000000000"
  //   );
  //   await grtToken.connect(user1).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("2000000")
  //   );

  //   // minting GRT to the grt pool
  //   await grtToken.mint(grtPool.address, ethers.utils.parseEther("200"));

  //   expect(await grtToken.balanceOf(grtPool.address)).to.equal(
  //     "200000000000000000000"
  //   );

  //   // deposit ERC20 to pool by UserA
  //   await grtPool
  //     .connect(user1)
  //     .depositGRTRequestERC20(
  //       ethers.utils.parseEther("10"),
  //       token.address,
  //       ethers.utils.parseEther("5"),
  //       80001,
  //       user2.address
  //     );
  //   const res = await grtPool.getInfoDeposit(0);
  //   expect(res.userAddr).to.equal(user1.address);

  //   // make offer
  //   // User3 staking deposit

  //      await grtToken.mint(user3.address, ethers.utils.parseEther("0.2"));

  //   expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "200000000000000000"
  //   );
  //   await grtToken.connect(user3).approve(
  //     grtPool.address,
  //     ethers.utils.parseEther("2")
  //   );
  //   await grtPool.connect(user3).stakeGRT(ethers.utils.parseEther("0.2"));

  //   // make right offer by user3
  // const offer =  await grtPool
  //     .connect(user3)
  //     .createOffer(0, ethers.utils.parseEther("5"));
  // const txHash = offer.hash;
  //   // accpet offer by user1
  //   await grtPool.connect(user1).acceptOffer(0, 1);

  //   // User3 honors transaction and has sent the amount of token the user1 requested for

  //   // Claim  rewards on different chain by user3

  //   // create question template

  //   // creating the question
  //   const questionStr = "Did I make a transaction deposit of 1000GRT?␟␟en";
  //   const __question = await grtPool.createQuestion(
  //     questionStr,
  //     0,
  //     txHash,
  //     user3.address,
  //     user2.address,
  //     token.address,
  //     ethers.utils.parseEther("5"),
  //     80001,
  //     { value: ethers.utils.parseEther("0.1") }
  //   );
  //   const _questionId = await __question.wait();
  //   const questionId = _questionId?.events[2]?.args[1];

  //   const getHistoryHash = await grtPool.getHistoryHash(questionId);
  //   //answering the question posted by user3 by users 4 and 5
  //   await grtPool
  //     .connect(user4)
  //     .answerQuestion('true', questionId, 0, {
  //       value: ethers.utils.parseEther("1"),
  //     });

  //   const getHistoryHash1 = await grtPool.getHistoryHash(questionId);

  //   await grtPool
  //     .connect(user5)
  //     .answerQuestion('true', questionId, 0, {
  //       value: ethers.utils.parseEther("2"),
  //     });


  //   const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  //   const network = { provider: provider };

  //   await network.provider.send("evm_increaseTime", [97200]);
  //   await network.provider.send("evm_mine");

  //   // checking if question is finalized
  //   const isFinalized = await grtPool.isFinalized(questionId);
  //   expect(isFinalized).to.equal(true);

  //   const answer = await grtPool.getBytes('true');
  //   expect (await grtPool.getFinalAnswer(questionId)).to.equal(answer)
  //   // resolving dispute and claiming GRT exchanged
  //   await grtPool
  //     .connect(user3)
  //     .claimGRTWithDispute(
  //       0,
  //       1,
  //       questionId,
  //       [getHistoryHash1, getHistoryHash],
  //       [user5.address, user4.address],
  //       [ethers.utils.parseEther("2"), ethers.utils.parseEther("1")],
  //       [answer, answer]
  //     );
  //  expect(await grtToken.balanceOf(user3.address)).to.equal(
  //     "10000000000000000000"
  //   );
  // })
});