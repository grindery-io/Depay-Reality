import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC20Sample, RealityETH_v3_0 } from "../typechain-types";

describe("Grindery Satellite testings", function () {

  let owner: SignerWithAddress,
      user1: SignerWithAddress,
      user2: SignerWithAddress,
      user3: SignerWithAddress,
      user4: SignerWithAddress,
      user5: SignerWithAddress,
      realityEth: RealityETH_v3_0,
      grtToken: ERC20Sample,
      token: ERC20Sample,
      grtSatellite: any;

  beforeEach(async function() {

    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    grtSatellite = await upgrades.deployProxy(await ethers.getContractFactory("GrtSatellite"));
    await grtSatellite.deployed();

    realityEth = await (await ethers.getContractFactory("RealityETH_v3_0")).deploy();
    await realityEth.deployed();

    grtToken = await (await ethers.getContractFactory("ERC20Sample")).deploy();
    await grtToken.deployed();

    token = await (await ethers.getContractFactory("ERC20Sample")).deploy();
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
      await expect(
        grtSatellite.connect(user2).payOfferCrossChainERC20(token.address, user1.address, 100)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should decrease the token balance of the transaction signer", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await grtSatellite.connect(user2).payOfferCrossChainERC20(token.address, user1.address, 100);
      expect(await token.balanceOf(user2.address)).to.equal(1000-100);
    });

    it("Should increase the token balance of the recipient", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await grtSatellite.connect(user2).payOfferCrossChainERC20(token.address, user1.address, 100);
      expect(await token.balanceOf(user1.address)).to.equal(100);
    });

    it("Should emit a paid offer event", async function () {
      await token.connect(user2).mint(user2.address, 1000);
      await token.connect(user2).approve(grtSatellite.address, 500);
      await expect(
        await grtSatellite.connect(user2).payOfferCrossChainERC20(token.address, user1.address, 100)
      )
			.to.emit(grtSatellite, "LogOfferPaidSatelliteCrossChain")
			.withArgs(user2.address, user1.address, token.address, 100);
    });

  });

  describe("Pay an offer cross-chain with native token", function () {

    it("Should decrease the native token balance of the transaction signer", async function () {
      let expectedUser2Balance = await ethers.provider.getBalance(user2.address);
      const tx = await grtSatellite.connect(user2).payOfferCrossChainNative(user1.address, { value: ethers.utils.parseEther("2") });
      const receipt = await tx.wait();
      const gasCostForTxn = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      expectedUser2Balance = expectedUser2Balance.sub(gasCostForTxn);
      expect(
        await ethers.provider.getBalance(user2.address)
      ).to.equal(expectedUser2Balance.sub(ethers.BigNumber.from(ethers.utils.parseEther("2"))));
    });

    it("Should increase the native token amount of the recipient if payment is a success", async function () {
      let expectedUser1Balance = await ethers.provider.getBalance(user1.address);
      await grtSatellite.connect(user2).payOfferCrossChainNative(user1.address, { value: ethers.utils.parseEther("2") });
      expect(
        await ethers.provider.getBalance(user1.address)
      ).to.equal(expectedUser1Balance.add(ethers.BigNumber.from(ethers.utils.parseEther("2"))));
    });

    it("Should emit an event if payment is a success", async function () {
      await expect(
        await grtSatellite.connect(user2).payOfferCrossChainNative(user1.address, { value: ethers.utils.parseEther("2") })
      )
			.to.emit(grtSatellite, "LogOfferPaidSatelliteCrossChain")
			.withArgs(user2.address, user1.address, ethers.constants.AddressZero, ethers.utils.parseEther("2"));
    });

    it("Should return true if payment is a success", async function () {
      const tx = await grtSatellite.connect(user2).payOfferCrossChainNative(user1.address, { value: ethers.utils.parseEther("2") });
      const receipt = await tx.wait();
    });

  });

});