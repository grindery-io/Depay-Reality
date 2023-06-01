import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';

upgrades.silenceWarnings();

describe('Grindery Satellite testings', function () {
  let owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    grtToken: Contract,
    token: Contract,
    grtLiquidityWallet: Contract,
    grtSatellite: Contract,
    offerId: string;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    grtSatellite = await upgrades.deployProxy(
      await ethers.getContractFactory(
        'contracts/v0.2.0/GrtSatellite.sol:GrtSatellite'
      )
    );
    await grtSatellite.deployed();

    grtToken = await (await ethers.getContractFactory('ERC20Sample')).deploy();
    await grtToken.deployed();

    token = await (await ethers.getContractFactory('ERC20Sample')).deploy();
    await token.deployed();

    // initialize contract
    await grtSatellite.initializeGrtSatellite(grtToken.address);

    grtLiquidityWallet = await (
      await ethers.getContractFactory(
        'contracts/v0.2.0/GrtLiquidityWallet.sol:GrtLiquidityWallet'
      )
    ).deploy(grtSatellite.address, owner.address);
    await grtLiquidityWallet.deployed();

    offerId =
      '0x784D94277B92AA7F8746A7715982F9B5022946FAEC89A8D4F8F3CECEF67B96E1';
  });

  describe('GRT satellite initialisation', function () {
    it('Should set the correct Owner', async function () {
      expect(await grtSatellite.owner()).to.equal(owner.address);
    });

    it('Should set the correct GRT token address', async function () {
      expect(await grtSatellite.getGrtAddress()).to.equal(grtToken.address);
    });
  });

  describe('Liquidity smart contract deployment', function () {
    it('The GrtLiquidityWallet contract address should not be null', async function () {
      expect(await grtSatellite.callStatic.deployLiquidityContract()).to.not.be
        .null;
    });

    it('The GrtLiquidityWallet contract address should not be undefined', async function () {
      expect(await grtSatellite.callStatic.deployLiquidityContract()).to.not.be
        .undefined;
    });

    it('The GrtLiquidityWallet contract address should be a proper address', async function () {
      expect(await grtSatellite.callStatic.deployLiquidityContract()).to.be
        .properAddress;
    });

    it('Should deploy a GrtLiquidityWallet contract', async function () {
      const result = await grtSatellite.callStatic.deployLiquidityContract();
      expect(result).to.equal(
        (
          await ethers.getContractAt(
            'contracts/v0.2.0/GrtLiquidityWallet.sol:GrtLiquidityWallet',
            result
          )
        ).address
      );
    });

    it('Should set the smart contract function caller as owner', async function () {
      const result = await (
        await grtSatellite.connect(user2).deployLiquidityContract()
      ).wait();

      const contract = await ethers.getContractAt(
        'contracts/v0.2.0/GrtLiquidityWallet.sol:GrtLiquidityWallet',
        result.logs[0].address
      );

      expect(await contract.owner()).to.equal(user2.address);
    });
  });

  describe('Reward for an offer', function () {
    it('Should increase the token balance of the offerer', async function () {
      await grtToken.connect(user1).mint(grtSatellite.address, 10000);
      await grtSatellite.connect(user1).rewardOffer(offerId, 100);
      expect(await grtToken.balanceOf(user1.address)).to.equal(100);
    });

    it('Should decrease the token balance of the GRT satellite contract', async function () {
      await grtToken.connect(user1).mint(grtSatellite.address, 10000);
      await grtSatellite.connect(user1).rewardOffer(offerId, 100);
      expect(await grtToken.balanceOf(grtSatellite.address)).to.equal(
        10000 - 100
      );
    });

    it('Should emit an event', async function () {
      await grtToken.connect(user1).mint(grtSatellite.address, 10000);
      await expect(
        await grtSatellite
          .connect(user1)
          .rewardOffer(offerId.toLowerCase(), 100)
      )
        .to.emit(grtSatellite, 'LogRewardOffer')
        .withArgs(offerId.toLowerCase(), grtToken.address, 100);
    });
  });
});
