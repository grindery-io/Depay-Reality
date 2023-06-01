import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';

const nameToken = 'MRIToken';
const symbolToken = 'MRI';

describe('Grindery Liquidity Wallet', () => {
  let admin: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    minter: SignerWithAddress,
    grtToken: Contract;

  beforeEach(async () => {
    [admin, user1, user2, minter] = await ethers.getSigners();

    grtToken = await upgrades.deployProxy(
      await ethers.getContractFactory(
        `contracts/v2/GrtMRIToken.sol:GrtMRIToken`
      ),
      [nameToken, symbolToken, minter.address]
    );
  });

  describe('Deployment & initialization', async () => {
    it('Should set the proper minter address', async function () {
      expect(
        await grtToken.hasRole(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('MINTER_BURNER_ROLE')
          ),
          minter.address
        )
      ).to.be.true;
    });

    it('Should set the proper token name', async function () {
      expect(await grtToken.name()).to.equal(nameToken);
    });

    it('Should set the proper token symbol', async function () {
      expect(await grtToken.symbol()).to.equal(symbolToken);
    });
  });

  describe('Mint token', async () => {
    it('Should return an error if msg.sender is not the minter', async function () {
      await expect(
        grtToken.connect(user1).mint(user2.address, 100)
      ).to.be.revertedWith(
        `AccessControl: account ${ethers.utils.hexlify(
          user1.address
        )} is missing role ${ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes('MINTER_BURNER_ROLE')
        )}`
      );
    });

    it('Should increase the total supply', async function () {
      await grtToken.connect(minter).mint(user2.address, 100);
      expect(await grtToken.totalSupply()).to.equal(100);
    });

    it('Should increase the user balance', async function () {
      await grtToken.connect(minter).mint(user2.address, 100);
      expect(await grtToken.balanceOf(user2.address)).to.equal(100);
    });
  });

  describe('Burn token', async () => {
    beforeEach(async () => {
      await grtToken.connect(minter).mint(user2.address, 100);
    });

    it('Should return an error if msg.sender is not the minter', async function () {
      await expect(
        grtToken.connect(user1).burn(user2.address, 100)
      ).to.be.revertedWith(
        `AccessControl: account ${ethers.utils.hexlify(
          user1.address
        )} is missing role ${ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes('MINTER_BURNER_ROLE')
        )}`
      );
    });

    it('Should decrease the total supply', async function () {
      await grtToken.connect(minter).burn(user2.address, 10);
      expect(await grtToken.totalSupply()).to.equal(100 - 10);
    });

    it('Should decrease the user balance', async function () {
      await grtToken.connect(minter).burn(user2.address, 10);
      expect(await grtToken.balanceOf(user2.address)).to.equal(100 - 10);
    });
  });

  describe('Modify access control', async () => {
    it('Change minter should return an error if msg.sender is not the admin', async function () {
      await expect(
        grtToken
          .connect(minter)
          .grantRole(
            ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes('MINTER_BURNER_ROLE')
            ),
            user2.address
          )
      ).to.be.revertedWith(
        `AccessControl: account ${ethers.utils.hexlify(
          minter.address
        )} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`
      );
    });

    it('Change minter should modify the minter if msg.sender is the admin', async function () {
      await grtToken
        .connect(admin)
        .grantRole(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('MINTER_BURNER_ROLE')
          ),
          user2.address
        );

      expect(
        await grtToken.hasRole(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('MINTER_BURNER_ROLE')
          ),
          user2.address
        )
      ).to.be.true;
    });

    it('Change admin should return an error if msg.sender is not the admin', async function () {
      await expect(
        grtToken
          .connect(minter)
          .grantRole(
            '0x0000000000000000000000000000000000000000000000000000000000000000',
            user2.address
          )
      ).to.be.revertedWith(
        `AccessControl: account ${ethers.utils.hexlify(
          minter.address
        )} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`
      );
    });

    it('Change admin should modify the admin if msg.sender is the admin', async function () {
      await grtToken
        .connect(admin)
        .grantRole(
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          user2.address
        );

      expect(
        await grtToken.hasRole(
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          user2.address
        )
      ).to.be.true;
    });
  });
});
