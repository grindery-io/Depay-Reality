import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from 'ethers';

describe("Grindery Satellite testings", function () {

  let owner: SignerWithAddress,
      user1: SignerWithAddress,
      user2: SignerWithAddress,
      user3: SignerWithAddress,
      user4: SignerWithAddress,
      user5: SignerWithAddress,
      grtToken: Contract,
      token: Contract,
      grtLiquidityWallet: Contract,
      grtSatellite: any,
      idOffer: string;

  beforeEach(async function() {

    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    grtSatellite = await upgrades.deployProxy(await ethers.getContractFactory(
      "contracts/v0.2.0/GrtSatellite.sol:GrtSatellite")
    );
    await grtSatellite.deployed();

    grtToken = await (await ethers.getContractFactory("ERC20Sample")).deploy();
    await grtToken.deployed();

    token = await (await ethers.getContractFactory("ERC20Sample")).deploy();
    await token.deployed();

    // initialize contract
    await grtSatellite.initializeGrtSatellite(grtToken.address);

    grtLiquidityWallet = await (
      await ethers.getContractFactory("contracts/v0.2.0/GrtLiquidityWallet.sol:GrtLiquidityWallet")
    ).deploy(
      grtSatellite.address,
      owner.address
    );
    await grtLiquidityWallet.deployed();

    idOffer = "0xd2b8dbec86dba5f9b5c34f84d0dc19bf715f984e3c78051e5ffa813a1d29dd73";

  });

  describe("GRT satellite initialisation", function () {

    it("Should set the correct Owner", async function () {
      expect(await grtSatellite.owner()).to.equal(owner.address);
    });

    it("Should set the correct GRT token address", async function () {
      expect(await grtSatellite.getGrtAddress()).to.equal(grtToken.address);
    });

  });

  describe("Liquidity smart contract deployment", function () {

    it("The GrtLiquidityWallet contract address should not be null", async function() {
      expect(
        await grtSatellite.callStatic.deployLiquidityContract()
      ).to.not.be.null;
    });

    it("The GrtLiquidityWallet contract address should not be undefined", async function() {
      expect(
        await grtSatellite.callStatic.deployLiquidityContract()
      ).to.not.be.undefined;
    });

    it("The GrtLiquidityWallet contract address should be a proper address", async function() {
      expect(
        await grtSatellite.callStatic.deployLiquidityContract()
      ).to.be.properAddress;
    });

    it("Should deploy a GrtLiquidityWallet contract", async function() {
      const result = await grtSatellite.callStatic.deployLiquidityContract();
      expect(
        result
      ).to.equal(
        (await ethers.getContractAt("GrtLiquidityWallet", result)).address
      );
    });

  });

  describe("Reward for an offer", function () {

    it("Should increase the token balance of the offerer", async function () {
      await grtToken.connect(user1).mint(grtSatellite.address, 10000);
      await grtSatellite.connect(user1).rewardOffer(idOffer, 100);
      expect(
        await grtToken.balanceOf(user1.address)
      ).to.equal(100);
    });

    it("Should decrease the token balance of the GRT satellite contract", async function () {
      await grtToken.connect(user1).mint(grtSatellite.address, 10000);
      await grtSatellite.connect(user1).rewardOffer(idOffer, 100);
      expect(
        await grtToken.balanceOf(grtSatellite.address)
      ).to.equal(10000-100);
    });

    it("Should emit an event", async function () {
      await grtToken.connect(user1).mint(grtSatellite.address, 10000);
      await expect(
        await grtSatellite.connect(user1).rewardOffer(idOffer, 100)
      ).to.emit(grtSatellite, "LogRewardOffer").withArgs(
        idOffer,
        grtToken.address,
        100
      )
    });

  });

});