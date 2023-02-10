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

    });

    it("Should decrease the token amount of the transaction signer if payment is a success", async function () {

    });

    it("Should increase the token amount of the recipient if payment is a success", async function () {

    });

    it("Should emit an event if payment is a success", async function () {

    });

    it("Should return true if payment is a success", async function () {

    });

  });

  describe("Pay an offer cross-chain with native token", function () {

    it("Should decrease the native token amount of the transaction signer if payment is a success", async function () {

    });

    it("Should increase the native token amount of the recipient if payment is a success", async function () {

    });

    it("Should emit an event if payment is a success", async function () {

    });

    it("Should return true if payment is a success", async function () {

    });

  });

});