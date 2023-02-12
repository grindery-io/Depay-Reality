import { expect } from "chai";
import { ethers, network, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC20Sample, GrtSatellite, RealityETH_v3_0 } from "../typechain-types";

describe("Grindery Satellite testings", function () {

  let owner: SignerWithAddress,
      user1: SignerWithAddress,
      user2: SignerWithAddress,
      user3: SignerWithAddress,
      user4: SignerWithAddress,
      user5: SignerWithAddress,
      grtSatellite: GrtSatellite,
      realityEth: RealityETH_v3_0,
      grtToken: ERC20Sample,
      token: ERC20Sample;

  beforeEach(async function() {

    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    grtSatellite = await upgrades.deployProxy(
      await ethers.getContractFactory("GrtSatellite")
    );
    await grtSatellite.deployed();

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
    await grtSatellite.initializeSatellite();

  });

  describe("GRT satellite initialisation", function () {

    it("Should set the correct Owner", async function () {
      expect(await grtSatellite.owner()).to.equal(owner.address);
    });

  });


  describe("Pay an offer cross-chain with ERC20 token", function () {

    it("Should fail if the allowance is not high enough", async function () {
        // mint wdr tokens for user2
      await token.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await token.connect(user2).approve(grtSatellite.address, ethers.utils.parseEther("0.001"))

      await expect(grtSatellite.connect(user2).PayOfferCrossChainERC20(token.address, user1.address, ethers.utils.parseEther("2"))).to.be.revertedWith('ERC20: insufficient allowance')
    });

    it("Should decrease the token amount of the transaction signer if payment is a success", async function () {
      // mint wdr tokens for user2
      await token.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await token.connect(user2).approve(grtSatellite.address, ethers.utils.parseEther("2"))

      await grtSatellite.connect(user2).PayOfferCrossChainERC20(token.address, user1.address, ethers.utils.parseEther("2"))

      expect(await token.balanceOf(user2.address)).to.equal(0)

    });

    it("Should increase the token amount of the recipient if payment is a success", async function () {
      // mint wdr tokens for user2
      await token.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await token.connect(user2).approve(grtSatellite.address, ethers.utils.parseEther("2"))

      await grtSatellite.connect(user2).PayOfferCrossChainERC20(token.address, user1.address, ethers.utils.parseEther("2"))

      expect(await token.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("2"))
    });

    it("Should emit an event if payment is a success", async function () {
      // mint wdr tokens for user2
      await token.mint(user2.address, ethers.utils.parseEther("2"))
      // approve grt tokens from user2 to pool contract
      await token.connect(user2).approve(grtSatellite.address, ethers.utils.parseEther("2"))

      await expect(grtSatellite.connect(user2).PayOfferCrossChainERC20(token.address, user1.address, ethers.utils.parseEther("2"))).to.emit(grtSatellite, 'LogOfferPaidSatelliteCrossChain').withArgs(user2.address, user1.address, token.address, ethers.utils.parseEther("2"))
    });

    it("Should return true if payment is a success", async function () {
      // cannot read returned value from write function
    });

  });

  describe("Pay an offer cross-chain with native token", function () {

    it("Should decrease the native token amount of the transaction signer if payment is a success", async function () {

      const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

      // user2's Eth balance before payOfferOnChainERC20
      const balance = await provider.getBalance(user2.address)
      const balanceInEth = ethers.utils.formatEther(balance);
      await grtSatellite.connect(user2).PayOfferCrossChainNative(user1.address, { value: ethers.utils.parseEther("10") })

      // check user2 ether balance after payment
      const balanceAfter = await provider.getBalance(user2.address);
      const balanceInEthAfter = ethers.utils.formatEther(balanceAfter);

      expect(parseInt(balanceInEthAfter)).to.equal(parseInt(balanceInEth) - 10)
    });

    it("Should increase the native token amount of the recipient if payment is a success", async function () {
      const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

      // user1's Eth balance before payOfferOnChainERC20
      const balance = await provider.getBalance(user1.address)
      const balanceInEth = ethers.utils.formatEther(balance);
      await grtSatellite.connect(user2).PayOfferCrossChainNative(user1.address, { value: ethers.utils.parseEther("10") })

      // check user1 ether balance after payment
      const balanceAfter = await provider.getBalance(user1.address);
      const balanceInEthAfter = ethers.utils.formatEther(balanceAfter);

      expect(Number(balanceInEthAfter)).to.equal(Number(balanceInEth) + 10)
    });

    it("Should emit an event if payment is a success", async function () {

      await expect(grtSatellite.connect(user2).PayOfferCrossChainNative(user1.address, { value: ethers.utils.parseEther("10") })).to.emit(grtSatellite, 'LogOfferPaidSatelliteCrossChain').withArgs(user2.address, user1.address, '0x0000000000000000000000000000000000000000', ethers.utils.parseEther("10"))

    });

    it("Should return true if payment is a success", async function () {
      // cannot read returned value from write function
    });

  });

});