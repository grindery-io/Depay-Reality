import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';

describe('Grindery Offer testings', function () {
  const chainId = 31337;

  let owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    grtOffer: Contract,
    grtToken: Contract,
    token: Contract,
    token1: Contract,
    minPriceLimit: string,
    maxPriceLimit: string,
    offerId: string;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    grtOffer = await upgrades.deployProxy(
      await ethers.getContractFactory('contracts/v1/GrtPool.sol:GrtPool'),
      []
    );
    await grtOffer.deployed();

    grtToken = await (await ethers.getContractFactory('ERC20Sample')).deploy();
    await grtToken.deployed();

    token = await (await ethers.getContractFactory('ERC20Sample')).deploy();
    await token.deployed();

    token1 = await (await ethers.getContractFactory('ERC20Sample')).deploy();
    await token1.deployed();
  });

  describe('Initialization', function () {
    it('Should set the proper owner', async function () {
      expect(await grtOffer.owner()).to.equal(owner.address);
    });
  });

  describe('Set up an offer', function () {
    beforeEach(async function () {
      await grtToken.connect(user1).mint(user1.address, 10000);
      await grtToken.connect(user1).approve(grtOffer.address, 500);
      maxPriceLimit = ethers.utils.defaultAbiCoder.encode(
        ['string', 'string'],
        ['FIRA', '1000']
      );
      minPriceLimit = ethers.utils.defaultAbiCoder.encode(
        ['string', 'string'],
        ['FIRA', '100']
      );
      offerId = ethers.utils.keccak256(
        ethers.utils.solidityPack(['address', 'uint256'], [user1.address, 0])
      );
    });

    describe('Set up an offer with Grindery', function () {
      it('Should set the user address for the offerer', async function () {
        await grtOffer
          .connect(user1)
          .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
        expect(await grtOffer.getOfferer(offerId)).to.equal(user1.address);
      });

      it('Should set the chainId for the offer', async function () {
        await grtOffer
          .connect(user1)
          .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
        expect(await grtOffer.getChainIdOffer(offerId)).to.equal(chainId);
      });

      it('Should set the token address for the offer', async function () {
        await grtOffer
          .connect(user1)
          .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
        expect(await grtOffer.getTokenOffer(offerId)).to.equal(token.address);
      });

      it('Should set the hash for the lower price limit', async function () {
        await grtOffer
          .connect(user1)
          .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
        expect(await grtOffer.getMinPriceLimitHashOffer(offerId)).to.equal(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['bytes'], [minPriceLimit])
          )
        );
      });
      it('Should set the hash for the upper price limit', async function () {
        await grtOffer
          .connect(user1)
          .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
        expect(await grtOffer.getMaxPriceLimitHashOffer(offerId)).to.equal(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['bytes'], [maxPriceLimit])
          )
        );
      });
      it('Should emit an event', async function () {
        await expect(
          await grtOffer
            .connect(user1)
            .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit)
        )
          .to.emit(grtOffer, 'LogNewOffer')
          .withArgs(offerId, token.address, chainId);
      });
      it('Should increase the user nonce by one', async function () {
        await grtOffer
          .connect(user1)
          .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
        expect(await grtOffer.getNonceOffer(user1.address)).to.equal(1);
      });
      it('Should set isActive as true', async function () {
        await grtOffer
          .connect(user1)
          .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
        expect(await grtOffer.getStatusOffer(offerId)).to.equal(true);
      });
      describe('Min price limit verification', function () {
        it('Min price limit verification should return false if parameters are not correct', async function () {
          await grtOffer
            .connect(user1)
            .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
          expect(
            await grtOffer.checkMinPriceLimitOffer(
              offerId,
              ethers.utils.defaultAbiCoder.encode(
                ['string', 'string'],
                ['bitcoin', '100']
              )
            )
          ).to.equal(false);
        });
        it('Min price limit verification should return true if parameters are correct', async function () {
          await grtOffer
            .connect(user1)
            .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
          expect(
            await grtOffer.checkMinPriceLimitOffer(
              offerId,
              ethers.utils.defaultAbiCoder.encode(
                ['string', 'string'],
                ['FIRA', '100']
              )
            )
          ).to.equal(true);
        });
      });
      describe('Max price limit verification', function () {
        it('Max price limit verification should return false if parameters are not correct', async function () {
          await grtOffer
            .connect(user1)
            .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
          expect(
            await grtOffer.checkMaxPriceLimitOffer(
              offerId,
              ethers.utils.defaultAbiCoder.encode(
                ['string', 'string'],
                ['bitcoin', '1000']
              )
            )
          ).to.equal(false);
        });
        it('Max price limit verification should return true if parameters are correct', async function () {
          await grtOffer
            .connect(user1)
            .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
          expect(
            await grtOffer.checkMaxPriceLimitOffer(
              offerId,
              ethers.utils.defaultAbiCoder.encode(
                ['string', 'string'],
                ['FIRA', '1000']
              )
            )
          ).to.equal(true);
        });
      });
    });

    describe('Modify an offer', function () {
      beforeEach(async function () {
        await grtToken.connect(user1).mint(user1.address, 10000);
        await grtToken.connect(user1).approve(grtOffer.address, 500);
        maxPriceLimit = ethers.utils.defaultAbiCoder.encode(
          ['string', 'string'],
          ['FIRA', '1000']
        );
        minPriceLimit = ethers.utils.defaultAbiCoder.encode(
          ['string', 'string'],
          ['FIRA', '100']
        );
        offerId = ethers.utils.keccak256(
          ethers.utils.solidityPack(['address', 'uint256'], [user1.address, 0])
        );

        await grtOffer
          .connect(user1)
          .setOffer(token.address, chainId, minPriceLimit, maxPriceLimit);
      });

      describe('Modify chainId offer', function () {
        it('Should fail if the sender is not the creator of the offer', async function () {
          await expect(
            grtOffer.connect(user2).setChainIdOffer(offerId, 34)
          ).to.be.revertedWith(
            'Grindery offer: you are not allowed to modify this offer.'
          );
        });

        it('Should modify the chainID', async function () {
          await grtOffer.connect(user1).setChainIdOffer(offerId, 34);
          expect(await grtOffer.getChainIdOffer(offerId)).to.equal(34);
        });

        it('Should emit an event', async function () {
          await expect(
            await grtOffer.connect(user1).setChainIdOffer(offerId, 34)
          )
            .to.emit(grtOffer, 'LogSetChainIdOffer')
            .withArgs(offerId, 34);
        });
      });

      describe('Modify token address offer', function () {
        it('Should fail if the sender is not the creator of the offer', async function () {
          await expect(
            grtOffer.connect(user2).setTokenOffer(offerId, token1.address)
          ).to.be.revertedWith(
            'Grindery offer: you are not allowed to modify this offer.'
          );
        });

        it('Should modify the token address', async function () {
          await grtOffer.connect(user1).setTokenOffer(offerId, token1.address);
          expect(await grtOffer.getTokenOffer(offerId)).to.equal(
            token1.address
          );
        });

        it('Should emit an event', async function () {
          await expect(
            await grtOffer.connect(user1).setTokenOffer(offerId, token1.address)
          )
            .to.emit(grtOffer, 'LogSetTokenOffer')
            .withArgs(offerId, token1.address);
        });
      });

      describe('Modify Min price limit offer', function () {
        it('Should fail if the sender is not the creator of the offer', async function () {
          await expect(
            grtOffer
              .connect(user2)
              .setMinPriceLimit(
                offerId,
                ethers.utils.defaultAbiCoder.encode(
                  ['string', 'string'],
                  ['FIRA', '50']
                )
              )
          ).to.be.revertedWith(
            'Grindery offer: you are not allowed to modify this offer.'
          );
        });

        it('Should modify the Min price limit options', async function () {
          await grtOffer
            .connect(user1)
            .setMinPriceLimit(
              offerId,
              ethers.utils.defaultAbiCoder.encode(
                ['string', 'string'],
                ['FIRA', '50']
              )
            );
          expect(await grtOffer.getMinPriceLimitHashOffer(offerId)).to.equal(
            ethers.utils.keccak256(
              ethers.utils.solidityPack(
                ['bytes'],
                [
                  ethers.utils.defaultAbiCoder.encode(
                    ['string', 'string'],
                    ['FIRA', '50']
                  ),
                ]
              )
            )
          );
        });

        it('Should emit an event', async function () {
          await expect(
            await grtOffer
              .connect(user1)
              .setMinPriceLimit(
                offerId,
                ethers.utils.defaultAbiCoder.encode(
                  ['string', 'string'],
                  ['FIRA', '50']
                )
              )
          )
            .to.emit(grtOffer, 'LogSetMinPriceLimit')
            .withArgs(
              offerId,
              ethers.utils.keccak256(
                ethers.utils.solidityPack(
                  ['bytes'],
                  [
                    ethers.utils.defaultAbiCoder.encode(
                      ['string', 'string'],
                      ['FIRA', '50']
                    ),
                  ]
                )
              )
            );
        });
      });

      describe('Modify Max price limit offer', function () {
        it('Should fail if the sender is not the creator of the offer', async function () {
          await expect(
            grtOffer
              .connect(user2)
              .setMaxPriceLimit(
                offerId,
                ethers.utils.defaultAbiCoder.encode(
                  ['string', 'string'],
                  ['FIRA', '2000']
                )
              )
          ).to.be.revertedWith(
            'Grindery offer: you are not allowed to modify this offer.'
          );
        });

        it('Should modify the Max price limit options', async function () {
          await grtOffer
            .connect(user1)
            .setMaxPriceLimit(
              offerId,
              ethers.utils.defaultAbiCoder.encode(
                ['string', 'string'],
                ['FIRA', '2000']
              )
            );
          expect(await grtOffer.getMaxPriceLimitHashOffer(offerId)).to.equal(
            ethers.utils.keccak256(
              ethers.utils.solidityPack(
                ['bytes'],
                [
                  ethers.utils.defaultAbiCoder.encode(
                    ['string', 'string'],
                    ['FIRA', '2000']
                  ),
                ]
              )
            )
          );
        });

        it('Should emit an event', async function () {
          await expect(
            await grtOffer
              .connect(user1)
              .setMaxPriceLimit(
                offerId,
                ethers.utils.defaultAbiCoder.encode(
                  ['string', 'string'],
                  ['FIRA', '2000']
                )
              )
          )
            .to.emit(grtOffer, 'LogSetMaxPriceLimit')
            .withArgs(
              offerId,
              ethers.utils.keccak256(
                ethers.utils.solidityPack(
                  ['bytes'],
                  [
                    ethers.utils.defaultAbiCoder.encode(
                      ['string', 'string'],
                      ['FIRA', '2000']
                    ),
                  ]
                )
              )
            );
        });
      });

      describe('Modify status offer', function () {
        it('Should fail if the sender is not the creator of the offer', async function () {
          await expect(
            grtOffer.connect(user2).setIsActive(offerId, false)
          ).to.be.revertedWith(
            'Grindery offer: you are not allowed to modify this offer.'
          );
        });

        it('Should modify the status', async function () {
          await grtOffer.connect(user1).setIsActive(offerId, false);
          expect(await grtOffer.getStatusOffer(offerId)).to.equal(false);
        });

        it('Should emit an event', async function () {
          await expect(
            await grtOffer.connect(user1).setIsActive(offerId, false)
          )
            .to.emit(grtOffer, 'LogSetStatusOffer')
            .withArgs(offerId, false);
        });
      });
    });
  });
});
