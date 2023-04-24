import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import grtPoolABI from "../../artifacts/contracts/v-testnet-launch/GrtPoolGSN.sol/GrtPoolGSN.json";
import {
  GSNUnresolvedConstructorInput,
  RelayProvider,
} from "@opengsn/provider";
import { GsnTestEnvironment } from "@opengsn/cli/dist/GsnTestEnvironment";
import Web3HttpProvider from "web3-providers-http";

const protocolVersion = "v-testnet-launch";
const forwarderAddress = require("../../build/gsn/Forwarder.json").address;
const paymasterAddress = require("../../build/gsn/Paymaster.json").address;
const relayHubAddress = require("../../build/gsn/RelayHub.json").address;
const paymasterABI = require("./PaymasterABI.json");

describe("Grindery Offer testings", function () {
  const chainId = 31337;

  let owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress,
    user4: SignerWithAddress,
    user5: SignerWithAddress,
    grtPool: Contract,
    grtToken: Contract,
    paymaster: Contract,
    token: Contract,
    forwarder: string,
    offerId: string;

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    grtPool = await upgrades.deployProxy(
      await ethers.getContractFactory(
        `contracts/${protocolVersion}/GrtPoolGSN.sol:GrtPoolGSN`
      ),
      [forwarderAddress]
    );
    await grtPool.deployed();

    paymaster = await (
      await ethers.getContractFactory(
        `contracts/${protocolVersion}/GrtPaymaster.sol:WhitelistPaymaster`
      )
    ).deploy();
    await paymaster.deployed();

    await paymaster.connect(owner).whitelistTarget(grtPool.address, true);
    await paymaster
      .connect(owner)
      .whitelistMethod(
        grtPool.address,
        grtPool.interface.getSighash(
          grtPool.interface.getFunction("depositETHAndAcceptOffer")
        ),
        true
      );

    grtToken = await (await ethers.getContractFactory("ERC20Sample")).deploy();
    await grtToken.deployed();

    token = await (await ethers.getContractFactory("ERC20Sample")).deploy();
    await token.deployed();
  });

  describe("Deposit ETH and accept an offer", function () {
    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtPool.address, 500);
      await grtToken.connect(user2).mint(user2.address, 10000);
      await grtToken.connect(user2).approve(grtPool.address, 500);
      offerId = ethers.utils.keccak256(
        ethers.utils.solidityPack(["address", "uint256"], [user1.address, 0])
      );
      await grtPool
        .connect(user1)
        .setOffer(
          token.address,
          chainId,
          ethers.utils.defaultAbiCoder.encode(
            ["string", "string"],
            ["FIRA", "100"]
          ),
          ethers.utils.defaultAbiCoder.encode(
            ["string", "string"],
            ["FIRA", "1000"]
          )
        );
    });

    it("Should decrease the native token balance of the user", async function () {
      const web3provider = new Web3HttpProvider("http://127.0.0.1:8545");

      let gsnProvider = RelayProvider.newProvider({
        provider: web3provider,
        config: {
          // loggerConfiguration: { logLevel: 'error'},
          paymasterAddress: paymasterAddress,
          auditorsCount: 0,
          performDryRunViewRelayCall: false,
        },
      });
      await gsnProvider.init();

      // @ts-ignore
      const etherProvider = new ethers.providers.Web3Provider(gsnProvider);

      const paymasterContract = new ethers.Contract(
        paymasterAddress,
        paymasterABI,
        etherProvider
      );

      console.log(await paymasterContract.getTrustedForwarder());
      console.log(await grtPool.getTrustedForwarder());

      // await grtPool
      //   .connect(etherProvider.getSigner(user2.address))
      //   .setAddress(user2.address);

      // await grtPool
      //   .connect(etherProvider.getSigner(user2.address))
      //   .depositETHAndAcceptOffer(offerId, user2.address, 10, {
      //     value: 250,
      //   });

      // let expectedBalance = await ethers.provider.getBalance(user2.address);
      // const tx = await (
      //   await grtPool
      //     .connect(etherProvider.getSigner(user2.address))
      //     .depositETHAndAcceptOffer(offerId, user2.address, 10, {
      //       value: 250,
      //     })
      // ).wait();
      // expectedBalance = expectedBalance.sub(
      //   tx.gasUsed.mul(tx.effectiveGasPrice)
      // );
      // expectedBalance = expectedBalance.sub(ethers.BigNumber.from(250));
      // expect(await ethers.provider.getBalance(user2.address)).to.equal(
      //   expectedBalance
      // );
    });
  });
});
